# Split de recebíveis — fundamentação legal, benefício tributário e argumentos de venda

Este arquivo é sobre **por que e como vender o split pro estabelecimento**
(fundamentação legal, benefício tributário, FAQs, argumentos de venda). Para
o **passo a passo operacional de configurar** o split no app Empresas
(acúmulo de 28 dias, agendamento, horário das 14h), ver
[../split-de-recebiveis.md](../split-de-recebiveis.md) — os dois arquivos se
complementam.

> ⚠️ **Isso é material de apoio comercial**, produzido pela Universidade
> Confrapag para ajudar o licenciado a explicar o produto. Números de
> economia tributária são **exemplos ilustrativos** — a economia real de
> cada estabelecimento depende do enquadramento fiscal específico dele.
> Nunca prometa um valor exato de economia a um cliente; sempre oriente que
> o contador do estabelecimento confirme o impacto no caso concreto.

## O que é (visão de negócio)

Split de recebíveis é a **divisão dos valores de venda entre diferentes
beneficiários antes da liquidação** — o valor total não chega a transitar
pela conta do lojista. Isso é diferente do "split de pagamento" tradicional,
que distribui o dinheiro **depois** de cair na conta do lojista (e por isso
gera bitributação: o valor é tributado como receita do lojista e depois de
novo quando repassado).

No modelo Confrapag, a divisão ocorre na **camada de recebíveis**, não na de
pagamento — o lojista só declara como receita a parte que é efetivamente
dele.

## Fundamentação legal

Isso é frequentemente perguntado por contadores/CFOs de estabelecimentos —
respostas rápidas e citáveis:

- **Regulamentação Bancária (Banco Central):**
  - Resolução BCB 150/2021 — registro e negociação de recebíveis
  - Resolução BCB 80/2021 — credenciamento das registradoras
  - Resolução BCB 264/2021 — definição de Unidades de Recebíveis (UR)
- **Código Civil:**
  - Arts. 286–298 — cessão de direitos creditórios (é a base jurídica do
    split: o lojista cede o direito sobre parte do recebível)
  - Arts. 653–656 — mandato mercantil
- **Legislação tributária:**
  - Art. 121 do CTN — define o sujeito passivo da obrigação tributária
  - Leis 10.637/2002 e 10.833/2003, Art. 1º §2º IX — base de cálculo do
    PIS/COFINS
  - IN RFB 2.163/2023 — EFD-Reinf R-4010/R-4020
  - LC 123/2006, Art. 3º §1º — Documento de Arrecadação do Simples (DAS)
  - LC 116/2003, item 7.02 §1º — exclusões de base de cálculo (subempreitada)
- **Operações estaduais / DIMP:**
  - Convênio ICMS 134/2016 — institui a DIMP (Declaração de Instituições de
    Meios de Pagamento)
  - Existem também atos, decretos, portarias e instruções normativas que
    variam por UF

**Resposta curta pra "isso é legal?":** Sim — amparado pelo Art. 286 do
Código Civil (cessão de crédito) e pela IN RFB 2.219/2024, com toda a
operação documentada e rastreável, incluindo entrega automática da DIMP.

## Como funciona por dentro (fluxo completo)

1. **Cadastro de beneficiários** (o lojista, no Portal → Gestor de
   Recebíveis → Beneficiários) — feito uma única vez, com CNPJ/CPF, dados
   bancários e percentuais de cada parceiro.
2. **Venda e emissão fiscal** — a venda é feita normalmente no PDV, com
   NF-e/CF-e emitida pelo **valor total**. O campo "Informações
   Complementares" da nota deve conter os detalhes do split (beneficiários,
   valores, UR).
3. **Geração do NSU/UR** — o sistema gera automaticamente o Número
   Sequencial Único e a Unidade de Recebível, usados para rastreabilidade.
4. **Entrada no Gestor de Recebíveis** — o valor da venda entra protegido e
   rastreável, pronto pra distribuição.
5. **Execução do split** — conforme o agendamento configurado (de D+1 até
   D+28 — ver regras de horário em
   [../split-de-recebiveis.md](../split-de-recebiveis.md)).
6. **Distribuição automática** — os valores são transferidos direto pras
   contas de cada beneficiário (lojista e parceiros) nas datas agendadas.
7. **Entrega da DIMP** — feita automaticamente pelo sistema à SEFAZ, com
   todos os NSU, CNPJs e valores.
8. **Contabilização** — o contador do estabelecimento registra **só a
   parcela do lojista** como receita; os demais valores entram como
   passivo/repasse.
9. **Documentação e prova** — toda a operação fica documentada com
   comprovantes acessíveis pelo Portal — útil se questionado por auditoria.

## O benefício tributário, com números (estudo de caso)

Exemplo de uma clínica médica (Anexo V do Simples Nacional), faturamento de
R$ 300.000/mês, 30 médicos parceiros:

| | **Antes** (bitributação) | **Depois** (com split) |
|---|---|---|
| Faturamento declarado | R$ 300.000 | R$ 200.000 (só a parte da clínica) |
| Alíquota do Simples | 23,0% | 23,0% |
| Impostos mensais | R$ 69.000 | R$ 46.000 |
| Margem de lucro | R$ 129.500 | R$ 154.000 |

**Resultado:** redução de R$ 23.000/mês em tributos (33% a menos de
imposto), aumento de R$ 24.500/mês na margem, e economia de R$ 294.000/ano
— mantendo compliance fiscal completo. **Isso é um exemplo real, não uma
garantia** — a economia depende do faturamento, anexo do Simples e volume
de repasses de cada estabelecimento.

### Tabela de alíquotas do Simples Nacional (pra estimar o impacto)

| Faixa | Faturamento anual | Anexo I (Comércio) | Anexo II (Indústria) | Anexo III (Serviços) | Anexo IV (Serviços) | Anexo V (Clínicas/TI) |
|---|---|---|---|---|---|---|
| 1ª | Até R$ 180 mil | 4,00% | 4,50% | 6,00% | 4,50% | 15,50% |
| 2ª | R$ 180–360 mil | 7,30% | 7,80% | 11,20% | 9,00% | 18,00% |
| 3ª | R$ 360–720 mil | 9,50% | 10,00% | 13,50% | 10,20% | 19,50% |
| 4ª | R$ 720 mil–1,8 mi | 10,70% | 11,20% | 16,00% | 14,00% | 20,50% |
| 5ª | R$ 1,8–3,6 mi | 14,30% | 14,70% | 21,00% | 22,00% | 23,00% |
| 6ª | R$ 3,6–4,8 mi | 19,00% | 30,00% | 33,00% | 33,00% | 30,50% |

Alíquotas progressivas conforme faturamento dos últimos 12 meses. Quanto
maior a faixa, maior o benefício relativo de excluir repasses a terceiros da
base de cálculo.

## Guia prático de implementação (visão do estabelecimento)

1. **Cadastro na plataforma** — o EC se cadastra no Portal Confrapag e
   solicita a habilitação do Gestor de Recebíveis junto a um licenciado
   autorizado.
2. **Configuração de beneficiários** — em Gestor de Recebíveis →
   Beneficiários: CNPJ/CPF, dados bancários e percentuais de cada parceiro.
3. **Configuração contábil** — o contador do EC adapta o plano de contas/ERP
   pra registrar corretamente os repasses via split.
4. **Template de NF-e/CF-e** — configurar o campo "Informações
   Complementares" com o padrão de split (beneficiários, valores, NSU/UR).

Nível de automação de cada etapa: inserção de NSU/UR é semi-automática (via
API, responsabilidade do contador); split pré-liquidação, geração da DIMP e
armazenamento de comprovantes são 100% automáticos pelo sistema; integração
contábil depende do ERP do estabelecimento.

## Perguntas frequentes (pra responder o licenciado ou repassar ao EC)

**O Split de Recebíveis é legal?**
Sim. Amparado pelo Art. 286 do Código Civil (cessão de crédito) e pela IN
RFB 2.219/2024. Toda operação é documentada e rastreável, com entrega
automática da DIMP.

**Como isso afeta a relação com o contador?**
Positivamente — o contador recebe todos os documentos e comprovantes
necessários, com relatórios detalhados e lançamentos claros (receita própria
separada de valores de repasse).

**Todos os tipos de empresa podem usar?**
Sim — aplicável a Simples Nacional, Lucro Presumido e Lucro Real. É
especialmente benéfico pra negócios com repasses frequentes a parceiros:
clínicas médicas, franquias, representações comerciais e marketplaces.

**Como fica a emissão da nota fiscal?**
A NF-e/CF-e é emitida normalmente pelo valor total da venda, mas deve
incluir no campo "Informações Complementares" os detalhes do split
(beneficiários, valores, e o NSU/UR gerado).

**Qual a diferença pro split de pagamento tradicional?**
No split de pagamento, o intermediário funciona como "caixa" e distribui os
valores depois de recebidos (gera bitributação). No modelo Confrapag, a
empresa vende diretamente e a divisão ocorre por cessão de crédito antes da
liquidação — sem bitributação, com mais controle sobre os repasses.

**Qual o custo pra implementar?**
Varia por proposta do licenciado, baseada no volume de transações do
estabelecimento — não há um valor fixo documentado aqui. Segundo o material,
o investimento tende a ser bem menor que a economia gerada.

## Argumentos de venda por perfil (adaptado do material da Universidade)

Use o argumento que combina com quem está ouvindo:

- **Lojista/comerciante (linguagem simples):** "Você paga imposto só sobre o
  que é realmente seu — o que é do parceiro nem entra como receita sua."
- **Dono de negócio (foco prático):** resolve o problema de repasses
  manuais inflando a base de cálculo do imposto sem necessidade.
- **Contador/CFO (linguagem técnica):** cite a Resolução BCB 150/21, os
  registros CERC/TEG e a entrega automática da DIMP individualizada.
- **Rede/franqueadora (foco estratégico):** compliance, rastreabilidade e
  governança financeira entre unidades e parceiros.

Cinco variações de pitch, em ordem crescente de sofisticação: **direto**
(automação + segurança) → **de valor** (organização + transparência) →
**persuasivo** (eficiência + compliance + economia tributária) → **técnico**
(base legal + compliance contábil) → **institucional** (governança +
alinhamento regulatório + confiança de stakeholders). Comece pelo pitch
direto ou de valor pra a maioria dos licenciados; use o técnico/institucional
só quando o interlocutor for contador, CFO ou rede maior.
