/**
 * Acoes na aba "Equipamentos" do portal, dirigindo a UI real (Playwright)
 * em vez de chamar a API interna direto. Motivo: o token de autenticacao
 * do portal fica cifrado no localStorage e so e' decifrado dentro do
 * proprio bundle JS da aplicacao (via um interceptor do axios); nao ha
 * como reidratar esse header fora do navegador sem enganharia reversa da
 * criptografia. Dirigindo a UI a gente reaproveita a sessao real do
 * navegador sem precisar soubere como o portal monta o Authorization.
 *
 * Reflexo direto: encontramos os dois PUTs reais no bundle do portal
 * (products/associate e products/disassociate), mas so os usamos como
 * documentacao/validacao — a acao em si e' sempre via clique na UI.
 */
const { BASE_URL } = require('../browser/session');

const NAV_TIMEOUT = 60000; // o backend do portal e' lento, especialmente em Equipamentos

function onlyDigits(str) {
  return String(str || '').replace(/\D/g, '');
}

async function abrirEstoqueEquipamentos(page) {
  await page.goto(`${BASE_URL}/equipmentStock`, { waitUntil: 'domcontentloaded' });
  await page
    .getByPlaceholder(/consultar n[uú]mero de s[ée]rie/i)
    .waitFor({ timeout: NAV_TIMEOUT });
}

async function buscarLinhaPorSerial(page, serial) {
  const campoBusca = page.getByPlaceholder(/consultar n[uú]mero de s[ée]rie/i);
  await campoBusca.fill(serial);
  await campoBusca.press('Enter');

  const linha = page.locator('table tr', { hasText: serial });

  // O backend do portal e' lento pra filtrar; espera ativamente em vez de
  // um timeout fixo, e da' um erro claro se realmente nao existir.
  try {
    await linha.first().waitFor({ timeout: 20000 });
  } catch {
    throw new Error(`Equipamento com serial "${serial}" nao encontrado.`);
  }
  return linha.first();
}

/**
 * Abre a tela de detalhes (Ver POS) do equipamento pelo serial.
 * Retorna a `page` ja navegada para /detailsStock.
 */
async function abrirDetalhesPorSerial(page, serial) {
  await abrirEstoqueEquipamentos(page);
  const linha = await buscarLinhaPorSerial(page, serial);
  const verPos = linha.getByText(/ver pos/i);
  await verPos.click();
  await page.waitForURL('**/detailsStock**', { timeout: NAV_TIMEOUT });
  await page.getByText(/detalhes do equipamento/i).waitFor({ timeout: NAV_TIMEOUT });
}

async function lerDetalhes(page) {
  // Cada campo da tela de detalhes e' <h1>Rotulo</h1><h2>Valor</h2> dentro
  // do mesmo container, isolado do menu lateral (nao existe risco de
  // colisao com itens do menu, que nao usam h1/h2).
  async function campo(labelRegex) {
    const h1 = page.locator('h1').filter({ hasText: labelRegex });
    if (await h1.count()) {
      const h2 = h1.first().locator('xpath=following-sibling::h2[1]');
      if (await h2.count()) return (await h2.first().innerText()).trim();
    }
    return null;
  }
  const titulo = (await page.locator('h1').filter({ hasText: /^POS/ }).first().innerText().catch(() => '')) || '';
  const temAssociar = await page.getByRole('button', { name: /^associar pos$/i }).count();
  const temDesassociar = await page.getByRole('button', { name: /desassociar pos/i }).count();

  return {
    posTitulo: titulo.trim(),
    modelo: await campo(/^modelo$/i),
    fornecedor: await campo(/^fornecedor$/i),
    proprietario: await campo(/^propriet[aá]rio$/i),
    localizacao: await campo(/^localiza[cç][aã]o$/i),
    estabelecimento: await campo(/^estabelecimento$/i),
    documentoEc: await campo(/^documento ec$/i),
    vinculado: temDesassociar > 0 && temAssociar === 0,
  };
}

/**
 * Busca um equipamento pelo serial e retorna seus dados (sem alterar nada).
 */
async function buscarPorSerial(page, serial) {
  await abrirDetalhesPorSerial(page, serial);
  return lerDetalhes(page);
}

/**
 * Associa o POS (por serial) a um estabelecimento (por CNPJ, com ou sem
 * mascara). Espelha exatamente os cliques que um humano faria.
 */
async function associar(page, serial, cnpj) {
  await abrirDetalhesPorSerial(page, serial);

  const antes = await lerDetalhes(page);
  if (antes.vinculado) {
    return {
      ok: false,
      motivo: 'ja_vinculado',
      detalhe: antes,
    };
  }

  await page.getByRole('button', { name: /^associar pos$/i }).click();
  await page.getByText(/selecionar estabelecimento/i).waitFor();

  // O "Estabelecimento" e' um react-select: o texto "Clique para ver a
  // lista" e' so uma div de placeholder visual, o campo real de digitacao
  // e' um <input role="combobox">, e as opcoes tem role="option".
  const dropdown = page.locator('input[role="combobox"]');
  await dropdown.click();
  await dropdown.fill(onlyDigits(cnpj));
  await page.waitForTimeout(1000);

  const opcao = page.getByRole('option', { name: new RegExp(onlyDigits(cnpj)) }).first();
  const existeOpcao = await opcao.count();
  if (!existeOpcao) {
    await page.keyboard.press('Escape');
    return {
      ok: false,
      motivo: 'estabelecimento_nao_encontrado',
      detalhe: { cnpjBuscado: cnpj },
    };
  }
  await opcao.click();

  await page.getByRole('button', { name: /^associar$/i }).click();
  await page.getByText(/tem certeza\?/i).waitFor();
  await page.getByRole('button', { name: /^sim$/i }).click();

  // O backend demora; a confirmacao "Sucesso!" pode nao aparecer sempre
  // (as vezes so atualiza a tela). Aguardamos qualquer um dos dois sinais.
  await Promise.race([
    page.getByText(/sucesso/i).first().waitFor({ timeout: NAV_TIMEOUT }),
    page.getByRole('button', { name: /desassociar pos/i }).waitFor({ timeout: NAV_TIMEOUT }),
  ]);
  const okButton = page.getByRole('button', { name: /^ok$/i });
  if (await okButton.count()) await okButton.click();

  const depois = await lerDetalhes(page);
  return {
    ok: true,
    detalhe: depois,
    aviso: 'Procedimento realizado. E preciso reiniciar a maquininha (tecla F8) para finalizar.',
  };
}

/**
 * Desassocia o POS (por serial) do estabelecimento atual.
 */
async function desassociar(page, serial) {
  await abrirDetalhesPorSerial(page, serial);

  const antes = await lerDetalhes(page);
  if (!antes.vinculado) {
    return {
      ok: false,
      motivo: 'ja_desvinculado',
      detalhe: antes,
    };
  }

  await page.getByRole('button', { name: /desassociar pos/i }).click();
  await page.getByText(/tem certeza\?/i).waitFor();
  await page.getByRole('button', { name: /^sim$/i }).click();

  await page.getByText(/sucesso/i).first().waitFor({ timeout: NAV_TIMEOUT });
  const okButton = page.getByRole('button', { name: /^ok$/i });
  if (await okButton.count()) await okButton.click();

  const depois = await lerDetalhes(page);
  return {
    ok: true,
    detalhe: depois,
    aviso: 'Procedimento realizado. E preciso reiniciar a maquininha (tecla F8) para finalizar.',
  };
}

module.exports = { buscarPorSerial, associar, desassociar };
