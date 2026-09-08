/**
 * Gerencia UM navegador Chromium persistente e logado no portal Se7en Pay.
 *
 * Estrategia: reaproveitar sessao (cookies + localStorage) salva em disco
 * (storage/state.json) entre reinicios do servico. So refaz login (com
 * TOTP gerado localmente a partir da seed guardada no Keychain) quando a
 * sessao expira ou nao existe ainda.
 *
 * Todas as acoes (associar/desassociar POS, buscar equipamento, etc.) usam
 * a MESMA pagina logada, na ordem em que chegam (fila simples), porque e
 * um unico navegador compartilhado.
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { authenticator } = require('otplib');
const secrets = require('../secrets');

const BASE_URL = process.env.SE7EN_BASE_URL || 'https://vendas.se7enpay.com.br';
const HEADLESS = (process.env.HEADLESS || 'true').toLowerCase() !== 'false';
const STATE_PATH = path.join(__dirname, '..', '..', 'storage', 'state.json');

let browserPromise = null;
let contextPromise = null;
let pagePromise = null;

// Fila simples: garante que so uma acao mexe na pagina compartilhada por vez.
let queue = Promise.resolve();
function serialize(fn) {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => {},
    () => {}
  );
  return run;
}

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: HEADLESS });
  }
  return browserPromise;
}

async function getContext() {
  if (!contextPromise) {
    contextPromise = (async () => {
      const browser = await getBrowser();
      const hasState = fs.existsSync(STATE_PATH);
      return browser.newContext(hasState ? { storageState: STATE_PATH } : {});
    })();
  }
  return contextPromise;
}

async function getPage() {
  if (!pagePromise) {
    pagePromise = (async () => {
      const context = await getContext();
      return context.newPage();
    })();
  }
  return pagePromise;
}

async function persistState() {
  const context = await getContext();
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  await context.storageState({ path: STATE_PATH });
}

async function isLoggedIn(page) {
  await page.goto(`${BASE_URL}/home`, { waitUntil: 'domcontentloaded' });
  // A home demora a carregar (backend lento) mas o importante e nao ter
  // sido redirecionado de volta pro /login.
  try {
    await page.waitForURL('**/login**', { timeout: 3000 });
    return false; // foi mandado pro login
  } catch {
    // nao redirecionou em 3s: assumimos logado (a pagina pode ainda estar
    // no "Carregando...", o que e normal).
    return !page.url().includes('/login');
  }
}

async function fillOtpInput(page, code) {
  // Tenta um campo unico de 6 digitos primeiro.
  const singleField = page.locator(
    'input[maxlength="6"], input[name*="otp" i], input[name*="code" i], input[name*="token" i]'
  );
  if (await singleField.count()) {
    await singleField.first().fill(code);
    return;
  }
  // Fallback: 6 campos separados, um digito cada (padrao comum de UI de OTP).
  const digitInputs = page.locator('input[maxlength="1"]');
  const count = await digitInputs.count();
  if (count >= 6) {
    for (let i = 0; i < 6; i++) {
      await digitInputs.nth(i).fill(code[i]);
    }
    return;
  }
  throw new Error(
    'Nao encontrei o campo de codigo do autenticador na tela. ' +
      'Rode com HEADLESS=false e ajuste os seletores em fillOtpInput().'
  );
}

async function login(page) {
  const { email, password, totpSecret } = await secrets.getCredentials();

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);

  const entrar = page.getByRole('button', { name: /^entrar$/i });
  await entrar.waitFor({ state: 'visible' });
  // Botao fica desabilitado ate os campos serem validados no client-side;
  // esperamos ele habilitar em vez de um timeout fixo.
  await page.waitForFunction(
    () => {
      const btn = [...document.querySelectorAll('button')].find(
        (b) => b.textContent.trim().toLowerCase() === 'entrar'
      );
      return btn && !btn.disabled;
    },
    { timeout: 10000 }
  );
  await entrar.click();

  // Tela de autenticador (TOTP) pode levar um instante pra aparecer.
  await page.waitForTimeout(1500);
  const code = authenticator.generate(totpSecret);
  await fillOtpInput(page, code);

  // Botao de confirmar codigo: tenta achar algo obvio, senao tenta Enter.
  const confirmar = page.getByRole('button', {
    name: /(confirmar|validar|verificar|entrar|continuar)/i,
  });
  if (await confirmar.count()) {
    await confirmar.first().click();
  } else {
    await page.keyboard.press('Enter');
  }

  // Espera sair da tela de login (o backend e lento, entao damos bastante margem).
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 60000,
  });

  await persistState();
}

/**
 * Garante que a pagina compartilhada esta logada e pronta pra uso, e
 * executa `fn(page)` de forma serializada (uma acao por vez).
 */
async function withPage(fn) {
  return serialize(async () => {
    const page = await getPage();
    if (!(await isLoggedIn(page))) {
      await login(page);
    }
    const result = await fn(page);
    // O portal pode renovar o token silenciosamente enquanto a aba fica
    // aberta; regravamos o snapshot a cada acao pra o proximo restart do
    // servico partir do estado mais recente possivel, nao do login antigo.
    await persistState();
    return result;
  });
}

async function forceLogin() {
  return serialize(async () => {
    const page = await getPage();
    await login(page);
  });
}

module.exports = { withPage, forceLogin, BASE_URL };
