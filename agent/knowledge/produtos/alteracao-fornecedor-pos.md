# Alteração de fornecedor de um POS pelo portal

Funcionalidade do portal que permite trocar o **fornecedor** de um
equipamento POS (ex: de F3 para F4 ou F7) diretamente pela tela de edição do
equipamento — útil pra redirecionar máquinas em estoque para diferentes
fornecedores sem precisar de intervenção técnica.

## Regra de negócio (a mais importante)

- **Equipamento sem vínculo** (não associado a nenhum estabelecimento) →
  alteração de fornecedor é **permitida normalmente**.
- **Equipamento vinculado a um estabelecimento** → o campo de fornecedor
  **não fica disponível** para edição. Precisa desassociar primeiro.

## Como alterar (equipamento sem vínculo)

1. Acessar **Equipamentos → Estoque de Equipamentos**.
2. Localizar o equipamento desejado → **Editar**.
3. No campo **Fornecedor**, selecionar o novo fornecedor (F3, F4, F7 — as
   opções disponíveis no dropdown).
4. **Salvar alterações.**

## Como alterar (equipamento já vinculado a um EC)

1. Acessar a listagem de equipamentos.
2. Clicar em **Ver POS**.
3. Localizar o vínculo existente.
4. Clicar em **Desassociar** (botão "Desassociar POS").
5. Retornar à tela de edição do equipamento.
6. Selecionar o novo fornecedor.
7. **Salvar alterações.**

Depois de trocar o fornecedor, a máquina pode ser associada normalmente ao
estabelecimento desejado (ver o fluxo de habilitação de máquina em
[f3-cappta.md](f3-cappta.md#habilitar-a-máquina-após-cadastro-ativo), que é
o mesmo processo independente do fornecedor).
