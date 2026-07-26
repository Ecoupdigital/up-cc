# Contratos herdados pelo modo grill (fases 13 e 14)

Gate de pré-requisito do plano 001. Nenhuma tarefa desta fase cita formato de pergunta ou
artefato de memória que não esteja nomeado aqui, com origem literal.

| Item | Nome literal | Arquivo de origem | Título da seção de origem |
|------|--------------|--------------------|-----------------------------|
| Formato de pergunta com resposta recomendada | Rótulos `Pergunta:`, `Recomendo:`, `Porque:`, `Opções:` (regra "nenhuma pergunta crua") | `up/references/questioning.md` (citado também em `up/skills/up-brainstorm/SKILL.md`, seção "Antes de perguntar (contrato de pergunta)") | `## 1. Nenhuma pergunta crua`, dentro de `<contrato_de_pergunta>` |
| Regra de fato contra decisão | "Fato contra decisão", com o protocolo de resolução prévia de seis fontes e o teste de classificação | `up/references/questioning.md` | `## 2. Fato contra decisão`, dentro de `<contrato_de_pergunta>` |
| Formato do verbete do glossário do projeto | Verbete em `.plano/GLOSSARY.md`, seção `## Termos`, inserido em ordem alfabética, com regra de admissão (só conceito específico do domínio) e regra de higiene (zero detalhe de implementação) escritas no próprio arquivo | `up/bin/lib/memoria-termo.cjs` (cabeçalho embutido e função `lerCabecalhoTemplate`); regra também descrita em `up/skills/up-brainstorm/SKILL.md` | `## Memória gravada no instante` (SKILL.md); `## Termos` (arquivo `.plano/GLOSSARY.md` gerado) |
| Formato do registro de decisão e a operação determinística de numeração | Subcomando `memoria decisao criar` (grava com as seções `## Contexto`, `## Decisão`, `## Motivo`, `## Condições do gate`, `## Alternativas rejeitadas`); numeração obtida por `memoria decisao proximo-numero`, que varre `.plano/decisoes/` e nunca reaproveita número apagado | `up/bin/lib/memoria-decisao.cjs` | Comentário de cabeçalho do módulo ("Acoes: proximo-numero, listar, criar, status") e `up/skills/up-brainstorm/SKILL.md`, seção `## Memória gravada no instante` |
| Base de rejeições | Diretório `.plano/fora-de-escopo/`, submódulo `memoria fora-de-escopo` (ações `registrar` e `buscar`); consultada como primeiro passo de toda rodada, antes de explorar a intenção, inclusive no tier Trivial | `up/bin/lib/memoria.cjs` (função `dirForaDeEscopo`); `up/skills/up-brainstorm/SKILL.md` | `## Consulta à memória antes de explorar` |

SHA_BASE: 89541fcc92613cc9624cc09d8dc34efb17fb0b3b
