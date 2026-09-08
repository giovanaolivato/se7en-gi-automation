# Índice da Base de Conhecimento — Se7en Pay

Este é o ponto de entrada. Antes de responder qualquer pergunta de um licenciado,
identifique o assunto e abra o(s) arquivo(s) relevante(s) abaixo. Não tente
adivinhar — se o assunto não estiver claramente coberto, diga que vai verificar
e oriente a abertura de um chamado (veja [chamados/como-abrir-chamado.md](chamados/como-abrir-chamado.md)).

## Glossário rápido

Ver [glossario.md](glossario.md) para todos os termos e siglas (EC, LA, TPV, D+1, etc).

## 1. Produtos / Fornecedores

Cada fornecedor é um produto de recebimento diferente. Pergunta sobre "qual
produto usar", "como cadastrar X", "quais documentos preciso" → abrir o
arquivo do fornecedor específico.

| Fornecedor | Também chamado de | Arquivo | Resumo em 1 linha |
|---|---|---|---|
| F3 | Cappta | [produtos/f3-cappta.md](produtos/f3-cappta.md) | Sub-adquirente com split de recebíveis (D+1, acúmulo de até 28 dias) |
| F4 | Adquirente | [produtos/f4-adquirente.md](produtos/f4-adquirente.md) | Adquirente direto, taxas mais competitivas, recebimento na conta do EC |
| F5 | Link de pagamento, Confraonline | [produtos/f5-link-pagamento.md](produtos/f5-link-pagamento.md) | Cobrança à distância (e-commerce), recebimento em D+14, depende do F6 |
| F6 (F6M / F6C) | Confrapix, Bolepix | [produtos/f6-confrapix-bolepix.md](produtos/f6-confrapix-bolepix.md) | Recebimento via Pix e boleto (Bolepix só no F6C) |
| F7 | WeQi | [produtos/f7-weqi.md](produtos/f7-weqi.md) | Máquinas WeQi — chip próprio, dúvidas vão para fila WeQi específica |

Fluxo de cadastro de estabelecimento (documentos, passo a passo no portal,
planos/taxas, biometria, ativação, associação de máquina) está descrito em
detalhe dentro de [produtos/f3-cappta.md](produtos/f3-cappta.md) (o processo é
igual para todos os fornecedores, mudando só a escolha do fornecedor e os
dados bancários — isso está anotado lá).

Trocar o **fornecedor de um equipamento POS já cadastrado** (ex: mudar uma
máquina de F3 pra F4) é diferente de cadastro — ver
[produtos/alteracao-fornecedor-pos.md](produtos/alteracao-fornecedor-pos.md).

## 2. Split de recebíveis

Ferramenta exclusiva do F3. Configuração no app Empresas, regras de horário
de agendamento (14h), Pix/boleto para beneficiários.
→ [split-de-recebiveis.md](split-de-recebiveis.md)

Se a pergunta for sobre **benefício tributário, fundamentação legal ou como
convencer o cliente a usar** (não sobre configurar) →
[produtos/split-fundamentacao-e-vendas.md](produtos/split-fundamentacao-e-vendas.md).
**Atenção:** números de economia tributária ali são exemplos, não promessas
— nunca afirme uma economia exata pra um cliente específico.

## 3. Chamados (tickets de suporte)

Quando o licenciado tem um problema que a base de conhecimento não resolve
diretamente, a ação é abrir um chamado na fila correta.

- Regras gerais de como abrir um chamado (título, evidências, SLA) →
  [chamados/como-abrir-chamado.md](chamados/como-abrir-chamado.md)
- Tabela de decisão rápida "qual fila usar" →
  [chamados/resumo-filas.md](chamados/resumo-filas.md)
- Detalhe de cada fila por área:
  - [chamados/back-office.md](chamados/back-office.md) — cadastro, conta digital, POS, transação, comissão, split
  - [chamados/comercial.md](chamados/comercial.md) — cadastro de EC, migração, TEF, tarifas
  - [chamados/financeiro.md](chamados/financeiro.md) — chave Pix do licenciado, comissões retroativas, tarifas indevidas
  - [chamados/logistica.md](chamados/logistica.md) — inventário de máquinas, manutenção
  - [chamados/onboarding.md](chamados/onboarding.md) — cadastro/alteração do próprio licenciado
  - [chamados/tecnologia.md](chamados/tecnologia.md) — apps, domicílio bancário F5/F6, integração, sincronização de vendas
  - [chamados/weqi-f7.md](chamados/weqi-f7.md) — tudo relacionado ao fornecedor 7 (WeQi)
- **Erro específico de código na tela do POS** (ex: "PC-0202", "Tamper",
  "estabelecimento inválido") → **antes de tudo** consulte
  [chamados/erros-pos.md](chamados/erros-pos.md) — é uma tabela de referência
  erro → causa → solução. Só afirme causa/solução se o código relatado
  bater exatamente com um da tabela; se o licenciado só descrever um sintoma
  vago ("erro na máquina"), peça o código exato antes de responder. **Se o
  código, depois de confirmado, não estiver na tabela, isso não é motivo pra
  `escalar_duvida`** — erros-pos.md já tem uma regra geral de fallback
  (abrir chamado Back Office - Pos - erro ao transacionar) que cobre esse
  caso.

## Como navegar (para o agente)

1. Identifique se a pergunta é sobre um **produto/fornecedor** (seção 1),
   **split** (seção 2), ou um **problema/chamado** (seção 3).
2. Abra apenas o(s) arquivo(s) necessário(s) — não precisa carregar tudo.
3. Se a pergunta cruzar temas (ex: "cliente quer receber Pix e não consegue
   sacar"), abra os dois arquivos relevantes (F6 + fila de tecnologia/transação).
4. Se depois de consultar os arquivos a resposta não estiver clara, **não
   invente**: oriente a abertura do chamado na fila mais provável, usando
   [chamados/resumo-filas.md](chamados/resumo-filas.md) como guia, e avise que
   um humano vai continuar o atendimento.
