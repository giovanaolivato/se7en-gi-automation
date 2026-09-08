# Como abrir um chamado

O principal canal de comunicação com os fornecedores é através de
**chamados** (também chamados de tickets). No portal, aba **Tíquetes**: dá
pra acompanhar chamados em aberto, ver status, atualizar via mensagens e
acompanhar retornos.

## SLA

Cada chamado tem um SLA (tempo de resposta) definido pela gravidade.
Chamados envolvendo o **financeiro de estabelecimentos têm prioridade**. Na
média, o tempo de retorno e conclusão é de **3 dias úteis**.

## Regra mais importante: escolha a fila certa

Um chamado aberto na **fila errada** é fechado automaticamente e isso atrasa
a resolução. Use [resumo-filas.md](resumo-filas.md) para decidir a área, e os
arquivos específicos de cada área para a fila exata.

## Campos obrigatórios ao abrir

- **Título**
- **Tipo de solicitação** (de acordo com o problema)
- **Estabelecimento**
- **Licenciado**
- **Fornecedor correto** (de acordo com a solicitação)

## Regra mais importante depois da fila certa: evidências

Coloque o **máximo de informação possível já na abertura**: dados, descrição
completa da solicitação/problema, evidências (fotos ou vídeo), documentos em
anexo. Falta de evidência gera lentidão, porque o atendimento vai pedir mais
informação depois — quanto mais completo no início, mais rápido anda.

## Casos que exigem anexo obrigatório

- **Alteração de e-mail cadastral** → anexar o **termo de consentimento
  assinado via Gov** pelo titular do estabelecimento (sem isso o chamado não
  segue para atendimento). Anexar já na primeira mensagem.
- **Alteração de endereço ou responsável legal** → anexar **contrato
  social** comprovando a alteração.
- **Estorno recebido pelo estabelecimento** → anexar comprovante de
  pagamento completo (com ID da transação) + comprovante do estorno/devolução.
- **Erro ao transacionar (POS)** → anexar foto/vídeo do erro + **SN da
  máquina** + o que já foi tentado (reset, reinicialização).
- **Cancelamento de venda de outro dia** → anexar comprovante da venda
  (impresso da máquina ou consulta no portal).
- **Divergência de pagamento/liquidação** → anexar comprovante do valor
  recebido pelo EC + relatório de vendas (pode ser o resumo do dia), com
  descrição clara da divergência (ex: vendeu R$1000, previsto R$950,
  recebeu R$800, pendente R$150).
- **EC não liquidou nenhum valor** → anexar comprovante de vendas + extrato
  do estabelecimento.
- **EC não está gerando comissão** → anexar evidências da contestação.

## Quando não souber a fila exata

Escolha pelo menos a **área correta** (Back Office, Comercial, Financeiro,
Logística, Onboarding, Tecnologia, ou WeQi para o F7) mesmo sem certeza da
subcategoria exata — ver [resumo-filas.md](resumo-filas.md).
