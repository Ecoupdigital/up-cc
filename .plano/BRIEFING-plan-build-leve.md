# Briefing: Plan e build leves (fase 22, v3.1.0)

**Data:** 2026-09-16
**Origem:** pedido do dono: "o planejador demora demais e sempre faz uma fase gigantesca". Quer `/up:plan` e `/up:build` no estilo do `/up:rapido`, mantendo o PLAN.md. Somou o padrão de Product Engineer (anexo `.plano/ANEXO-padrao-product-engineering.md`).
**Status:** design aprovado por seção (A, B, C e D) em 2026-09-16. Próximo passo: `/up:plan`.

## Problema (medido)

- **up-beauty, fase 14** (planejada em 2026-09-16, já na v3): 16 planos, 494 KB de plano, 27 requisitos numa fase. Cada PLAN.md com 30 a 38 KB, acima do limite de 25 KB do próprio `validate-plan`.
- **up-beauty, fases 12, 13, 15 e 16:** 4 a 6 planos, de 106 a 135 KB por fase.
- **app-foco-real, fase 72** (filtro de data no admin): 5 planos, mais AUDIT-PLAN, CODE-REVIEW e VERIFICATION.

## Causas (no código)

1. **Sem limite de fase.** `up/agents/up-arquiteto.md:264` e `up/agents/up-planejador.md:133` medem a fase por "~70% do contexto de um agente", régua da época de 200k de contexto. Com 1M, quase tudo cabe numa fase.
2. **O planejador faz o trabalho do executor.** Pesquisa inline, leitura profunda do código, `must_haves` com truths/artifacts/key_links, checagem de 9 itens e loop de `validate-plan`. O executor depois relê tudo.
3. **O planejador começa do zero.** É subagente aberto logo depois do brainstorm, que já tinha o contexto carregado.
4. **O MODO PROJETO planeja todas as fases de uma vez** (`up/workflows/plan.md:177`).
5. **O build abre um `up-executor` novo por plano** (`up/workflows/build.md:249`), mesmo quando a onda tem um plano só.

## Decisões do dono

| Decisão | Escolha | Alternativas rejeitadas (motivo) |
|---|---|---|
| Direção | Pacote completo: limite de fase, plano curto escrito na sessão, só a próxima fase planejada, build na sessão com 1 plano | Só limite e plano curto (ganho menor, sobra a lentidão do agente frio). Fundir plan no build (perde o PLAN-READY separado) |
| Pedido acima do limite | Quebra sozinho em fases no ROADMAP, avisa em uma linha, planeja só a primeira | Parar e perguntar (devolve a espera). Só avisar (limite vira sugestão) |
| Fases 17 a 20 | 17, 18 e 20 canceladas, registradas em `.plano/fora-de-escopo/`. 19 continua pendente | Cancelar as quatro. Manter todas pendentes |
| Onde mora o padrão de Product Engineer | Referência única aplicada pelo executor, e o plano cita em uma linha `Implícitos:` por entrega | Checklist dentro do PLAN.md (engorda o plano, foi o caminho da fase 14 do up-beauty). Só no brainstorm (depende de lembrar na conversa) |
| Requisitos implícitos contam no limite? | Não. São critério de pronto da entrega, não escopo novo | Contam (toda tela vira várias fases). Só os grandes contam |

## Design aprovado

### A. `/up:plan` leve

- **Plano escrito na sessão.** Sem flag, `/up:plan` não spawna `up-planejador`: a sessão que fez o brainstorm escreve o PLAN.md.
- **Template de uma página (alvo até ~3 KB).** Frontmatter mínimo (fase, plano, onda, dependências), objetivo, fora de escopo, entregas (cada uma com resultado observável, linha `Implícitos:` e prova) e critério de pronto. Saem `must_haves` (truths, artifacts, key_links), pesquisa obrigatória, checagem de 9 itens e o loop de refazer do `validate-plan`, que passa a só avisar tamanho. O formato continua legível por `phase-plan-index` e pelo build.
- **Limite de fase.** Até ~5 entregas pedidas (implícitos não contam). 1 plano por padrão; 2 ou 3 só com paralelismo real (áreas disjuntas). Passou do limite: quebra em fases no ROADMAP, avisa em uma linha e planeja só a primeira.
- **Só a próxima fase ganha PLAN.md**, inclusive em projeto novo. O `up-arquiteto` continua gerando PROJECT, ROADMAP, REQUIREMENTS e SYSTEM-DESIGN, já com o limite de fase, e gera PHASE.md e REQUIREMENTS-SLICE.md só da próxima fase.
- **PLAN-READY.md continua** (o build depende dele), como índice curto.
- **`--profundo`** mantém o fluxo atual: planejador subagente, pesquisa, checagem e planejamento de todas as fases. Serve para projeto grande ou para executar em outro runtime.

### B. `/up:build` leve

- **Onda com 1 plano:** a sessão executa dentro da worktree, sem spawn.
- **Onda com 2 ou mais planos:** `up-executor` em paralelo, como hoje.
- **Mantidos:** worktree, branch, issue e PR; teste visual pré-merge; menu de fechamento; `verify-static` uma vez no fim; prova no SUMMARY. As flags `--local`, `--solo`, `--auto`, `--review`, `--testar` e `--board` seguem iguais.

### C. Padrão de Product Engineer

- **Fonte única:** novo `up/references/product-engineering.md`, fundindo o anexo do dono, os 71 itens de `production-requirements.md` e as regras de domínio (frontend, backend, database) que hoje moram em `up/agents/up-executor.md`, sem duplicar.
- **Executor carrega inteiro**, seja a sessão (build com 1 plano) ou o subagente. A análise "antes de codificar" (seção 11 do anexo) roda internamente, sem perguntar. A regra de autonomia (seção 12) já coincide com o contrato de pergunta do UP e não muda nada nele.
- **Plano:** cada entrega cita em uma linha `Implícitos:` o que do padrão se aplica (ex.: "lista: busca, filtros, ordenação e paginação no servidor, ações por linha").
- **Definition of Done** (seção 13): o SUMMARY ganha um checklist curto de completude, só com os itens aplicáveis àquela entrega, ao lado da `## Prova`.
- **Saem:** `production-requirements.md` e `production-requirements-compressed.md` (inclusive a frase sobre "supervisores", sedimento da v1) e as regras de domínio duplicadas no `up-executor.md`. Arquiteto, revisor, tester, verificador, sintetizador e o manifesto de referências em `up/bin/up-tools.cjs` passam a apontar para o arquivo novo.

**Cobertura atual do padrão no UP** (base para a fusão):

| Seção do anexo | Já existe | Falta |
|---|---|---|
| 1. Regra principal | Brainstorm (objetivo, usuário); princípios 3 e 4 | Requisitos implícitos por funcionalidade (hoje só o arquiteto, só em projeto novo) |
| 2. Listagem e gestão | Paginação, debounce, 4 estados, confirmação destrutiva, tabela vira card no celular | Busca, filtros, limpar filtros, ordenação, total, seleção, ações em lote, duplicar, status, exportar, persistência de filtro |
| 3. CRUD completo | Soft delete "onde importa", `created_by`, `audit_logs` (projeto novo) | Duplicar, arquivar, restaurar, histórico, ativo/inativo, permissão por ação |
| 4. Formulários | Label, validação front e back, loading, máscara, autofocus | Preservar dados no erro, cancelamento seguro |
| 5. Estados | Loading, erro, vazio, sucesso | Sem resultado de busca separado de vazio, sem permissão |
| 6. Segurança | Auth, validação server-side, RLS, CSRF, XSS, rate limit, log sem dado sensível | Isolamento de tenant explícito, acesso indevido a registro |
| 7. Banco e backend | Índices, constraints, N+1, migrations | Busca, filtro e ordenação no servidor; compatibilidade com dados existentes |
| 8. Consistência | Princípio 4, design tokens | Reusar componente existente, posição de ações |
| 9. Responsividade e a11y | RESP (7) e A11Y (9) | Nada relevante |
| 10. Performance | PERF (9) | Volume realista como pergunta |
| 11. Antes de codificar | Nada | Tudo |
| 12. Autonomia | Contrato de pergunta, decisões escaladas | Nada |
| 13. Definition of Done | `up-prova` prova que funciona | Checklist de completude |

### D. Limpeza, versão e prova

- **ROADMAP:** fases 17, 18 e 20 marcadas como canceladas (motivo na base de rejeições); 19 pendente; fase 22 "Plan e build leves" adicionada.
- **Versão 3.1.0** em `package.json` e `up/package.json`: nenhuma flag some, muda o comportamento padrão.
- **Testes:** atualizar `up/tests/caminho-quente.test.cjs`, `up/tests/plano-contrato.test.cjs` e `up/tests/up-leve.test.cjs` para o fluxo novo. Teste novo de invariante: `/up:plan` sem flag não spawna `up-planejador`; `--profundo` existe; template de plano dentro do tamanho alvo; `product-engineering.md` existe, está no manifesto do executor e é instalado.
- **Instalação:** `node up/bin/install.js --all` em diretório temporário, conferindo o arquivo novo nos 4 runtimes.

## Fora de escopo

- Remover o `up-planejador` ou o fluxo pesado: continuam atrás de `--profundo`.
- Mudar GitHub-nativo, teste visual pré-merge, menu de fechamento ou grill: decisões anteriores, mantidas.
- `/up:rapido`: sem mudança.
- Fase 19 (auditoria escopada): pendente, reavaliar depois.
- Bug do slug com acento no espaço `memoria` (gera `n-voa-e-fronteira-do-roadmap`, `revis-o`): vai por `/up:rapido`.

## Critérios de sucesso

1. `/up:plan N` sem flag não spawna `up-planejador` e gera PLAN.md de até ~3 KB.
2. Pedido acima de ~5 entregas vira mais de uma fase no ROADMAP, e só a primeira ganha PLAN.md.
3. `/up:plan` em projeto novo gera PLAN.md só da próxima fase.
4. `/up:build` executa na sessão uma onda de 1 plano e spawna executores em paralelo numa onda de 2 ou mais.
5. `up/references/product-engineering.md` existe, é carregado pelo executor (sessão e subagente) e é instalado nos 4 runtimes; os `production-requirements*.md` e as regras de domínio duplicadas no `up-executor.md` não existem mais.
6. SUMMARY traz checklist de completude com os itens aplicáveis.
7. `--profundo` reproduz o fluxo atual.
8. Os três testes atualizados e o novo invariante passam; instalação temporária nos 4 runtimes sem erro.
9. Versão 3.1.0 nos dois `package.json`.
10. ROADMAP com 17, 18 e 20 canceladas, 19 pendente e 22 adicionada.

## Medição depois do merge

Na próxima fase real do up-beauty, comparar tamanho do PLAN.md e tempo do `/up:plan` com as fases 14 a 16.
