# GATE-DOCS - Verificacao de precisao dos docs do UP v2

Repo: /home/projects/up-cc
Data: 2026-05-31
Veredito geral: **FAIL** (1 check FAIL: links internos quebrados)

## Tabela PASS/FAIL

| # | Check | Status |
|---|-------|--------|
| 1 | Zero comandos v1 como instrucao de uso atual | PASS |
| 2 | Zero "default --solo"; default descrito como GitHub-nativo | PASS |
| 3 | Contagens corretas (7 comandos, 12 agentes) + nomes batem | PASS |
| 4 | Zero em-dash / en-dash nos docs alvo | PASS |
| 5 | docs/GUIA-DE-USO.md existe e cobre todos os topicos | PASS |
| 6 | CLAUDE.md menciona o v2 (skills, hooks, engines, contagens) | PASS |
| 7 | Links internos validos (GUIA + CHANGELOG) | **FAIL** |
| 8 | Sanity: nenhum arquivo vazio/truncado | PASS |

## Detalhe por check

### Check 1 - PASS
Grep dos termos v1 em README.md, up/README.md, docs/GUIA-DE-USO.md. 3 ocorrencias, todas legitimas (contexto de migracao "absorve os antigos X", nao instrucao de uso atual):
- up/README.md:193 - "up-sintetizador | Sintetiza research, melhorias, ideias e requisitos" (descricao do agente, palavra "melhorias" comum, nao comando v1)
- docs/GUIA-DE-USO.md:383 - "Absorve os antigos ux-tester, mobile-first, adicionar-testes e verificar-trabalho num comando so." (migracao)
- docs/GUIA-DE-USO.md:394 - "Absorve melhorias e ideias." (migracao)
Nenhuma instrui o usuario a rodar comando v1. PASS.

### Check 2 - PASS
Zero violacoes de "default --solo". Todas as 4 mencoes de default reforcam GitHub-nativo e dizem explicitamente que --solo NAO e o default:
- README.md:39 - "O --solo e o escape hatch, nao o default."
- up/README.md:36 / :72 - "--solo e o escape hatch"
- docs/GUIA-DE-USO.md:315 - "Atencao: --solo NAO e o default. O default e GitHub-nativo."
github_native=true documentado como default em todos os 3 arquivos. PASS.

### Check 3 - PASS
- Filesystem: 7 comandos (auditar, build, depurar, plan, rapido, testar, up), 12 agentes.
- README.md:31-32 tabela: Comandos 31->7, Agentes 52->12 (31/52 sao os numeros v1 numa tabela comparativa, legitimo; numero atual = 7 e 12).
- README.md:156 lista os 12 nomes; diff contra ls up/agents = IDENTICAL.
- up/README.md:25/66/177 dizem 7 comandos / 12 agentes.
Nenhuma contagem errada (32 nao aparece). PASS.

### Check 4 - PASS
grep -c em-dash / en-dash:
- README.md: 0 / 0
- up/README.md: 0 / 0
- docs/GUIA-DE-USO.md: 0 / 0
- CLAUDE.md: 1 / 1 (linha 111) - NAO e violacao: a unica ocorrencia esta DENTRO da propria regra que proibe os caracteres ("ZERO em-dash (—) and en-dash (–) anywhere"), exibindo ao leitor quais glifos sao banidos. Uso meta-documental, nao prosa. Aceito.
PASS.

### Check 5 - PASS
docs/GUIA-DE-USO.md existe (542 linhas). Cobertura por titulo:
- greenfield: secao 3 (linha 55)
- brownfield: secao 4 (linha 174)
- rapido: secao 5 (linha 218)
- waves/multiagente: secao 6 (linha 236)
- teste visual: secao 7 (linha 265)
- github-nativo: secao 8 (linha 295)
- TDD por tipo: secao 9 (linha 331)
- multica --board: secao 10 (linha 345)
- multi-runtime: secao 13 (linha 442)
- config: secao 14 (linha 466)
Todos os topicos exigidos presentes. PASS.

### Check 6 - PASS
CLAUDE.md (em ingles, dev-facing) menciona todos os conceitos v2:
- skills: linha 9, 12, 41, 77 (4 skills: usando-up, up-brainstorm, up-tdd, up-verificar-antes-de-concluir)
- up-session-start: linha 43, 77
- github.cjs: linha 42, 92, 99
- multica.cjs: linha 42, 100, 106
- github_native: linha 66, 89, 106
- 12 agentes / 7 comandos: linha 9 ("7 commands, 12 agents, 4 skills"), 49, 58
PASS.

### Check 7 - FAIL
Dois links internos quebrados (resolvidos relativo ao diretorio do arquivo de origem):

1. README.md (raiz do repo) -> CHANGELOG.md
   - Resolve para /home/projects/up-cc/CHANGELOG.md -> NAO EXISTE.
   - O changelog real esta em up/CHANGELOG.md.
   - Ocorre 2x:
     - /home/projects/up-cc/README.md:46  "Detalhes completos no [CHANGELOG](CHANGELOG.md) e no [Guia de Uso](docs/GUIA-DE-USO.md)."
     - /home/projects/up-cc/README.md:161 "- **[CHANGELOG](CHANGELOG.md)**: historico de versoes e detalhes do breaking change v2."
   - Correcao: trocar link para up/CHANGELOG.md (ou criar/symlinkar CHANGELOG.md na raiz).

2. up/README.md (em up/) -> docs/GUIA-DE-USO.md
   - Resolve para /home/projects/up-cc/up/docs/GUIA-DE-USO.md -> NAO EXISTE.
   - O guia real esta em /home/projects/up-cc/docs/GUIA-DE-USO.md (um nivel acima).
   - Ocorre 1x:
     - /home/projects/up-cc/up/README.md:25 "Detalhes completos no [docs/GUIA-DE-USO.md](docs/GUIA-DE-USO.md)."
   - Correcao: trocar link para ../docs/GUIA-DE-USO.md.

Observacao: o link de up/README.md:25 para CHANGELOG.md (-> up/CHANGELOG.md) ESTA correto e o link de README.md:46/160 para docs/GUIA-DE-USO.md ESTA correto. So os 2 acima quebram.

### Check 8 - PASS
wc -l:
- README.md: 165
- up/README.md: 257
- docs/GUIA-DE-USO.md: 542
- CLAUDE.md: 117
- up/CHANGELOG.md: 110
Nenhum vazio nem truncado. PASS.
