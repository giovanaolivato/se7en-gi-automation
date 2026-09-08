# Resumo das filas — qual área escolher

Tabela de decisão rápida. Depois de identificar a área, veja o arquivo
específico dela para a subcategoria exata.

| Área | Quando usar | Arquivo |
|---|---|---|
| **Back Office** | Problemas de cadastro de estabelecimento, pagamentos e financeiro do EC, alterações cadastrais, POS, transação, comissão, split. Maior parte das divergências relacionadas a estabelecimento e recebimento. | [back-office.md](back-office.md) |
| **Comercial** | Estabelecimento **antes** de começar a transacionar — apoio pré-carteira ativa, migração de EC, TEF, tarifas. | [comercial.md](comercial.md) |
| **Financeiro** | Pagamento de comissão aos **licenciados**, dados cadastrais de pagamento do licenciado (chave Pix), tarifas lançadas a estabelecimentos que precisam ser reembolsadas ao licenciado. | [financeiro.md](financeiro.md) |
| **Logística** | Inventário de máquinas, periféricos, envios, manutenção de máquinas. | [logistica.md](logistica.md) |
| **Onboarding** | Alterações cadastrais do **licenciado** (não do estabelecimento), destrato e contrato de licenciados. | [onboarding.md](onboarding.md) |
| **Tecnologia** | Problemas nos aplicativos (Se7en Gestão / Se7en Empresas), domicílio bancário F5/F6, sincronização de vendas, token de integração. | [tecnologia.md](tecnologia.md) |
| **WeQi** | Qualquer coisa relacionada ao **fornecedor 7**. | [weqi-f7.md](weqi-f7.md) |

## Regra de ouro

- Problema é do **estabelecimento já cadastrado/ativo** (dinheiro, POS,
  split, comissão) → **Back Office**.
- Problema é **antes de o estabelecimento existir/ter carteira ativa**, ou é
  sobre o **credenciamento em si** → **Comercial**.
- Problema é sobre o **licenciado receber/ser pago** → **Financeiro** ou
  **Onboarding** (se for dado cadastral do próprio LA).
- Problema é de **app/portal travando, bug, token, sincronização** →
  **Tecnologia**.
- Problema é de **máquina física, envio, estoque** → **Logística**.
- Qualquer coisa do **F7** → **WeQi**, sempre.
