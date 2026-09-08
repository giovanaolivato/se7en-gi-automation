# Filas — Back Office

Cobre: cadastro de estabelecimento, problemas com pagamentos e financeiro do
EC, alterações cadastrais, POS, transação, comissão, split. Ver regras gerais
de abertura (evidências, campos obrigatórios) em
[como-abrir-chamado.md](como-abrir-chamado.md).

## Cadastral - alteração cadastral
Correção de documento do responsável, alteração de e-mail, alteração de
endereço, etc.
- **Alteração de e-mail**: obrigatório anexar termo de consentimento
  assinado via Gov pelo titular (sem isso não segue para atendimento).
- **Endereço/responsável legal**: anexar contrato social comprovando.

## Conta digital - erro no pagamento de títulos
Problemas no pagamento de contas ou transações via Pix. Anexar evidência
(foto/print/vídeo) e descrição completa do erro.

## Conta digital - estorno Pix/boleto
Estabelecimento recebeu estorno de um pagamento que ele realizou. Anexar
comprovante de pagamento completo (com ID da transação) + comprovante do
estorno/devolução.

## Conta digital - gestão de usuários
Gestão de usuário na conta digital. **Não é possível criar usuário extra** —
apenas 1 usuário por CNPJ (regra vale para todos os fornecedores). É possível
alterar o responsável legal mediante comprovação de vínculo via contrato
social + documento com foto.

## Pos - configuração de Skin/logo
Máquina/POS/terminal não baixou a skin/logo da operação na tela. Esta é a
fila **padrão** pra esse problema — só use a fila específica do
[WeQi/F7](weqi-f7.md) se o licenciado confirmou que a máquina é do F7.

## Pos - erro ao transacionar
Erro em qualquer modalidade (débito, crédito, Pix). Obrigatório anexar:
foto/vídeo do erro, **SN da máquina**, e os procedimentos já tentados
(inicialização, reset). Antes de orientar abertura de chamado, verifique se
o código de erro relatado está catalogado em
[erros-pos.md](erros-pos.md) — muitos têm solução própria sem precisar de
chamado.

## Pos - problema com associação ou desassociação
Problema ao associar/vincular máquinas pelo portal. Se o erro aparece **na
tela do próprio POS** (não no portal), ver também
[erros-pos.md](erros-pos.md). Se o erro aparece **no portal** ao tentar
associar, ver a seção "Erro ao associar POS a um estabelecimento" no mesmo
arquivo. Se o licenciado quer **trocar o fornecedor** de uma máquina (não é
erro, é mudança intencional), isso não precisa de chamado — ver
[../produtos/alteracao-fornecedor-pos.md](../produtos/alteracao-fornecedor-pos.md).

## Pos - taxa ao portador
Erros do aplicativo da máquina relacionados a taxa ao portador, ou dúvidas
de utilização.

## Split - problemas cadastrais
Problema de cadastro ou agendamento no split: cadastro de beneficiário,
agendamento Pix, agendamento boleto, acúmulo de recebíveis. Ver
[../split-de-recebiveis.md](../split-de-recebiveis.md).

## Split - problemas de pagamentos
Recusas de boleto, devoluções de pagamentos feitos via split, liquidações de
valores na própria conta do EC.

## Comissão - diferença entre TPV e comissão
Ex: diferença entre o total de vendas na aba Vendas e o total na aba
Comissão (divergência de comissionamento).

## Comissão - EC não está gerando comissão
Um ou mais estabelecimentos da base do licenciado não geram comissão.
Anexar evidências da contestação.

## Transação - cancelamento de transação
- Venda do **dia atual**: o próprio estabelecimento cancela na máquina
  (inserindo o cartão), seguindo o vídeo do modelo da máquina — **não
  precisa de chamado**.
- Venda de **outro dia**: abrir chamado nesta fila. Só é possível cancelar
  débito e crédito. O fornecedor retém o valor na agenda antes de emitir a
  carta de cancelamento (já que o valor foi antecipado). Anexar comprovante
  da venda (impresso ou consulta no portal).

## Transação - divergência de pagamento
Estabelecimento com dúvida sobre valor recebido a menor/maior. Anexar
comprovante do valor recebido + relatório de vendas (pode ser resumo do
dia), com descrição clara da divergência (valores esperados vs recebidos).

## Transação - EC não liquidou
Estabelecimento não recebeu nenhum valor de suas transações. Anexar
comprovante de vendas + extrato do estabelecimento.
