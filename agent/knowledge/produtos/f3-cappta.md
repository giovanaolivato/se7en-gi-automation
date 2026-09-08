# F3 — Cappta

**Também chamado de:** Fornecedor 3, F3, Cappta.

> ⚠️ **A seção "Passo a passo de cadastro" abaixo é o fluxo genérico de
> credenciamento, só documentado aqui por ser o mesmo pra todos os
> fornecedores.** Se o licenciado perguntar "como cadastro um cliente novo"
> **sem dizer qual fornecedor**, responda com os passos genéricos e **não
> cite "conta digital F3"** na etapa de dados bancários — diga algo como
> "na etapa de dados bancários, selecione a conta digital do fornecedor que
> você está cadastrando" ou pergunte qual fornecedor ele vai usar. Só
> mencione "conta digital F3" especificamente quando o licenciado já tiver
> dito que é F3.

## O que é

Sub-adquirente (máquinas de cartão com arranjo). Opera através de **split de
recebíveis** — ver [../split-de-recebiveis.md](../split-de-recebiveis.md) para
o funcionamento completo dessa ferramenta.

Indicado para estabelecimentos e prestadores de serviços.

## Diferencial: economia tributária via split

Antes de o valor entrar na conta bancária do estabelecimento, ele fica
acumulado por até 28 dias. Nesse período, o estabelecimento pode destinar
valores diretamente a beneficiários via Pix ou agendar boletos — o valor sai
do acúmulo direto para o beneficiário, restando na conta apenas o lucro real
do estabelecimento. Isso gera economia tributária.

## Documentos necessários para cadastro

- Cartão CNPJ ou número do CNPJ (para consulta)
- Documento com foto do responsável legal pelo CNPJ
- E-mail válido que o cliente tenha acesso (esse e-mail dá acesso à conta —
  ver aviso importante abaixo)
- Telefone do responsável
- Conta de luz/energia do endereço do estabelecimento (ou, como segunda
  opção, do endereço do responsável)

## Passo a passo de cadastro no portal do licenciado

1. Menu lateral esquerdo → **Estabelecimentos**
2. Canto superior direito → **Gerenciar estabelecimentos** → **Novo estabelecimento**
3. Digite o CNPJ — alguns dados são pré-preenchidos automaticamente.
   **Sempre confira** esses dados contra a Receita Federal / cartão CNPJ.
   Dados divergentes causam erro no cadastro e lentidão na ativação.
4. Preencha o restante dos dados. **Atenção especial ao e-mail**: é ele que
   dá acesso à conta do estabelecimento. E-mail errado ou inválido impede o
   acesso, e a correção só é feita via chamado + termo de consentimento
   assinado pelo Gov — isso atrasa a ativação e pode reter valores já
   transacionados (ver [../chamados/comercial.md](../chamados/comercial.md)).
5. Avançar → informe o **endereço** do estabelecimento (igual ao da Receita/cartão CNPJ).
6. Avançar → aba **comercial**: escolha o **plano de taxas**.
   - Planos ficam na aba "Planos" do portal, com o código **CPAG**, e mostram
     para qual fornecedor cada plano está disponível.
   - Dá pra exportar em PDF ou Excel.
   - **Sempre escolha planos ANTECIPADOS (com antecipação)** — não usamos
     planos sem antecipação. Antecipado = recebimento em D+1 (próximo dia útil).
   - Selecione fornecedor, plano e meta de TPV (a meta não influencia nada
     nesse momento).
7. Avançar → **dados bancários**: selecione a **conta digital do fornecedor
   que está cadastrando** (ex: conta digital F3, conta digital F6). Não
   precisa preencher mais nada.
8. **Salvar/cadastrar.**

> O processo acima é o mesmo para todos os fornecedores — o que muda é a
> escolha do fornecedor no credenciamento e a opção de dados bancários
> (ex: conta digital F6, conta digital F3).

## Depois de cadastrar

- É exibido um link de **biometria facial** — exclusivo do F3, mas **não é
  necessário realizá-la**.
- O estabelecimento aparece na aba Estabelecimentos com status "em análise".
  Normalmente ativa em 1 dia útil (símbolo fica verde).
- Se o status aparecer como **"análise de risco"**: clique para abrir o
  chamado automático e envie tudo que comprove que o estabelecimento é real
  (fotos internas/externas tiradas pelo licenciado — **não vale foto do
  Google Maps**, rede social ativa, contrato de locação, etc). Isso costuma
  acontecer quando: o CNPJ é recente, o CNAE tem risco maior de chargeback,
  ou o endereço cadastrado diverge do cartão CNPJ.

## Habilitar a máquina (após cadastro ativo)

1. Aba **Equipamentos** → localizar pelo SN da máquina → **detalhes**.
2. Se já estiver associada a outro estabelecimento, clique em **desassociar terminal**.
3. Selecione o estabelecimento desejado → **associar/habilitar**.
4. Reinicie a máquina — ela vai puxar o estabelecimento recém-habilitado.
5. **Sempre faça testes de venda** (débito, crédito e Pix, com cartão
   inserido) antes de entregar a máquina ao cliente.

Erro durante a habilitação → abrir chamado no Back Office com: SN da
máquina, documento do estabelecimento e print do erro (ver
[../chamados/back-office.md](../chamados/back-office.md)).

## TEF (integração com sistema próprio do estabelecimento)

Se o estabelecimento já tem um sistema/PDV integrado, é possível solicitar o
**número lógico** via chamado (fila comercial — ver
[../chamados/comercial.md](../chamados/comercial.md)). A configuração no
sistema é responsabilidade do estabelecimento/software house. Número lógico e
manual de instalação são enviados no próprio chamado. Operação, recebimento e
benefícios são idênticos à máquina tradicional — a vantagem é o licenciado
não ter custo de máquina, já que o estabelecimento usa seu próprio pinpad.
