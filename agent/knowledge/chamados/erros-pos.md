# Erros transacionais nos POS (Cappta / F3)

Tabela de referência de códigos de erro que aparecem na tela da máquina.
**Só afirme a causa/solução específica se o erro relatado bater exatamente
com um dos códigos abaixo.**

## Se o código NÃO estiver na tabela

Isso **não é um caso pra `escalar_duvida`**. Já existe um fallback
documentado pra qualquer erro de POS não catalogado — é a regra geral logo
abaixo. Depois de confirmar o código exato com o licenciado (não adivinhe
qual código ele quis dizer, ex: "400" não é o mesmo que "PA 400"), se
mesmo assim não bater com nenhum da tabela, **oriente direto a abertura do
chamado da regra geral** — isso é aplicar uma solução já documentada, não é
invenção.

## Regra geral (vale pra qualquer erro de POS ao transacionar, catalogado ou não)

O caminho é abrir chamado com o tipo de serviço **Back Office - Pos - erro
ao transacionar** (ver [back-office.md](back-office.md)). No corpo do
chamado é **obrigatório** informar:
- SN da máquina com problema
- Descrição breve do erro (o código exato, se houver)
- Todos os testes já realizados
- Foto ou vídeo do erro (evidência é essencial pra agilizar a resolução)

O único meio de comunicação com a Cappta é através de chamado.

## Erros válidos para todos os modelos

| Erro | Motivo | O que fazer |
|---|---|---|
| Tamper / Code 56 | Máquina bloqueada | Necessário trocar o terminal |
| PS-2000 | Pagamento não encontrado | Abrir chamado Cappta (erro ao transacionar) |
| CP-14 | Erro ao gerar o QR Code do Pix | Inicializar a máquina e tentar de novo em alguns segundos; se não resolver, abrir chamado |
| PC-0042 | Chave pode estar ausente | Abrir chamado Cappta (erro ao transacionar) |
| PC-0020 / PC-0002 / PS-2009 | Chave pode estar ausente | Abrir chamado Cappta (erro ao transacionar) |
| Erro captura do PIN | Erro de chave | Abrir chamado Cappta (erro ao transacionar) |
| **Estabelecimento inválido** | Erro de chave | Abrir chamado Cappta (erro ao transacionar) |

## A910 / A920 / L300 / P2

| Erro | Modelo | Motivo | O que fazer |
|---|---|---|---|
| PA-500 / Netflix | A910/A920/L300/P2 | Falha na aplicação | Reset no terminal: Menu → Resetar dados do terminal → senha do supervisor (geralmente `123456` ou `000000`) → "Sim" em "Apagar dados da aplicação". Se persistir, abrir chamado. |
| PC-1087 | A910/A920/L300 | Terminal não inicializado na adquirente | Abrir chamado Cappta (erro ao transacionar) |
| PC-0012 | A910 | Operação cancelada | O EC cancelou a venda antes de passar o cartão — oriente a repetir a venda sem interromper o processo |

## P2

| Erro | Motivo | O que fazer |
|---|---|---|
| PA 400 | Falha na aplicação | Reset: Menu → Gerir terminal → Restaurar app. Se persistir, contatar Cappta (abrir chamado). |
| PC-0013 | Falha de conexão | O POS perdeu conexão — oriente conectar no Wi-Fi, ou se usar dados móveis, validar a configuração da APN |
| 423 | Terminal não desassocia | No POS: "Fechar erro" → menu (3 tracinhos) → "Restaurar app". Desassociar o terminal na Plataforma de Gestão. No POS: "Iniciar configuração" para solicitar o token. Associar novamente pela Plataforma de Gestão. **Atenção:** se associar no mesmo EC de antes, o erro persiste — nesse caso, precisa contatar a Cappta. |
| Sunmiboot mode | Terminal em modo de configuração | Retirar a bateria e ligar de novo segurando só o botão power |
| PC-0008 | Terminal não inicializado na adquirente | Abrir chamado Cappta (erro ao transacionar) |
| PC-0016 | Falha no pagamento | Inicializar a máquina e tentar de novo em alguns segundos |
| PC-0059 | Chave pode estar ausente | Abrir chamado Cappta (erro ao transacionar) |
| Android está iniciando | Terminal sem launcher | Abrir chamado Cappta (erro ao transacionar) |
| PS-75 | Falha na aplicação | Inicializar a máquina e tentar de novo; se persistir, abrir chamado |

## S920

| Erro | Motivo | O que fazer |
|---|---|---|
| PC-0202 | Terminal perdeu a associação | Se a versão for menor que 2.5.10.8, atualizar e executar a função 10. Se o erro persistir (ou a versão já for maior), executar a função 3; se persistir, abrir chamado. |
| PS-0062 | EC pode estar desconfigurado na Cappta | Executar a função 10; se persistir, abrir chamado |
| PA 400 | Falha na aplicação | Menu → Funções → 8 - Apagar configuração → senha (geralmente `000000`) → "Sim" em "Confirmar remoção da configuração". Se persistir, abrir chamado. |
| PC-1002 | Falha na aplicação | Inicializar o terminal; se persistir, abrir chamado |
| PC-1093 | Operação não permitida | Abrir chamado Cappta (erro ao transacionar) |
| PC-1101 | Credenciais do usuário inválidas | Desassociar e associar novamente na plataforma de gestão + reset no terminal. Se persistir, abrir chamado. |
| PC-0104 | Chave pode estar ausente | Abrir chamado Cappta (erro ao transacionar) |
| PC-0206 | Falha na configuração do EC | Desassociar e associar novamente na plataforma de gestão + reset no terminal. Se persistir, abrir chamado. |
| PC-0073 | Falha de conexão com chip | Retirar e reinserir o chip; se persistir, trocar o chip e testar em todos os slots; verificar configuração da APN; se persistir, trocar o terminal |
| PC-0052 | Timeout de comunicação com o servidor (Wi-Fi) | Menu → Funções → 8 - Apagar configuração → senha (geralmente `000000`) → "Sim" em "Confirmar remoção da configuração" |
| PC-0159 | Provedor do chip pode estar incorreto | Solicitar serial (ICCID) do chip, provedor e foto do resultado da função 2, e abrir chamado com a Cappta |
| PC-1003 | Data/hora inválida | Inicializar a máquina e tentar de novo em alguns segundos |
| PC-1004 | Falha na inicialização do campo | Inicializar a máquina e tentar de novo em alguns segundos |
| PC-1008 | Erro genérico | Testar com outro cartão — não há solução conhecida para esse erro |
| PC-1008 | Falha na inicialização da transação | Inicializar a máquina e tentar de novo em alguns segundos |
| PC-1040 | Falha na conexão | Inicializar a máquina e tentar de novo em alguns segundos |
| PC-1043 | Erro do servidor | Inicializar a máquina e tentar de novo em alguns segundos |
| PC-1116 | Tipo de transação de modalidade diferente do cartão | Opção de pagamento inválida — o cartão do cliente não está configurado pra essa modalidade (ex: cartão é débito e foi selecionado crédito na hora da venda) |
| PS-58 | Desconectado pelo autorizador da adquirente | Possível timeout de comunicação — reiniciar o POS pra buscar melhor conexão e repetir a operação |
| PS-59 | Desconectado pelo autorizador da adquirente | Possível timeout de comunicação — reiniciar o POS pra buscar melhor conexão e repetir a operação |
| PS-68 | Erro genérico loja de pagamentos | Inicializar a máquina e tentar de novo em alguns segundos |
| ST-1020 | Transação sendo enviada para Stone | Abrir chamado Cappta (erro ao transacionar) |

## Erro ao associar POS a um estabelecimento (erro no portal)

Diferente dos erros de transação acima — esse é sobre **associar a máquina a
um EC pelo portal**:

1. Testar associar a mesma máquina a outro EC — isso identifica se o erro é
   no cadastro do EC ou na própria POS.
2. Enviar a foto do erro para a **assistente comercial**, junto com nome do
   EC, CNPJ e SN da máquina, informando que houve erro ao associar no
   portal.
3. Ela vai orientar se dá pra resolver por ali ou se precisa ser via
   chamado.

Isso é diferente de "Pos - problema com associação ou desassociação" — use
esse fluxo específico primeiro quando o erro aparecer no **portal**, não na
máquina.
