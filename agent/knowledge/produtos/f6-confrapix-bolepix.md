# F6 — Confrapix / Bolepix

**Também chamado de:** Fornecedor 6, F6, F6M, F6C, Confrapix, Bolepix.

## O que é

Existem dois provedores do Confra Pix: **fornecedor 6M** (MT Bank) e
**fornecedor 6C** (Celcoin). Ambos permitem recebimento via Pix.

## Cadastro e escolha da vertente (F6-C vs F6-M)

Cadastrar o fornecedor 6 (ou adicioná-lo a um cadastro de estabelecimento já
existente). No momento do cadastro é gerada uma **biometria facial**,
necessária para a ativação.

Ao selecionar o fornecedor F6 na etapa **comercial** do cadastro, o portal
mostra uma etapa extra na tela de **Dados Bancários** pedindo pra escolher a
vertente:
- **F6-C** — Celcoin
- **F6-M** — MT Bank

Essa escolha define a configuração usada para os dados bancários do
estabelecimento.

**A escolha só aparece em dois momentos:**
- No cadastro inicial do estabelecimento;
- Ao adicionar um novo fornecedor F6 para um EC que já existe (Editar
  cadastro → Comercial → Adicionar novo fornecedor → Dados Bancários →
  selecionar F6).

**Importante — não dá pra trocar de vertente depois pela edição de
cadastro:** se o EC já está vinculado ao F6-C, não é possível mudar para
F6-M (e vice-versa) editando o cadastro. Migração entre F6-C e F6-M só é
feita **via chamado**.

## Recebimento via Pix (Cash in)

O estabelecimento pode:
- Gerar uma **chave Pix estática** (QR code fixo, sem valor pré-definido) —
  pode imprimir e deixar exposto no estabelecimento.
- Gerar uma **chave copia e cola** sem valor pré-definido, para enviar
  direto ao cliente.
- Criar um **Pix com valor pré-definido**: informa o valor (não precisa
  informar o pagador) e gera uma chave copia e cola ou QR code.

Pagamentos recebidos caem **instantaneamente** no app Empresas, aba "Minha
conta" (no futuro deve mudar para D+1, mas hoje é instantâneo).

**Atenção — não confundir com o prazo do F5:** o D+14 é do **F5** (link de
pagamento), não do F6/F6C. Pix e boleto recebidos diretamente pelo F6/F6C
são instantâneos, mesmo quando o estabelecimento também usa F5 (que exige
F6 como conta de recebimento, mas isso não muda o prazo do F6 em si).

## Uso do saldo (Cash out)

O saldo disponível em "Minha conta" pode ser usado para:
- Transferências via Pix
- Pagamento de boletos

Recebimento via Pix/boleto = **Cash in**. Uso do saldo já disponível =
**Cash out**.

## Bolepix (só no F6C)

Bolepix é um boleto que vem acompanhado de um Pix para pagamento no mesmo
momento. **Somente o fornecedor 6C oferece essa ferramenta hoje.** Para
estabelecimentos que precisam de recebimento via boleto, cadastre no F6C.
(O F6M deve passar a oferecer boleto também no futuro — confirmar status
atual se o cliente perguntar.)

## Domicílio bancário / dados bancários

Alteração de domicílio bancário do F6 é tratada na fila de **tecnologia**
(F6 e F5 usam filas de tecnologia; ver
[../chamados/tecnologia.md](../chamados/tecnologia.md)).

## Relação com o F5

Se o estabelecimento usa o **F5** (link de pagamento), o F6 é obrigatório
junto — é a conta de recebimento do F5. Ver
[f5-link-pagamento.md](f5-link-pagamento.md).
