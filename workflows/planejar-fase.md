<purpose>
Criar prompts executaveis (PLAN.md) para uma fase do roteiro. Fluxo simplificado: um unico up-planejador faz pesquisa inline (se necessario), cria planos e auto-verifica. Sem loop planner-checker separado.

Flags: --pesquisar (pesquisa profunda), --sem-pesquisa (pular), --auto (encadear executar+verificar), --gaps (replanejar a partir de lacunas).
</purpose>

<process>

## 1. Inicializar

```bash
INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init planejar-fase "$PHASE")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON: `commit_docs`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `has_research`, `has_context`, `has_plans`, `plan_count`, `planning_exists`, `roadmap_exists`, `phase_req_ids`.

**Caminhos de arquivo:** `state_path`, `roadmap_path`, `requirements_path`, `context_path`, `research_path`, `verification_path`.

**Se `planning_exists` = false:** Erro -- executar `/up:novo-projeto` primeiro.

## 2. Parsear Argumentos

Extrair do $ARGUMENTS: numero da fase, flags (`--pesquisar`, `--sem-pesquisa`, `--gaps`, `--auto`).

**Se sem numero da fase:** Detectar proxima fase nao planejada do roteiro.

**Se `phase_found` = false:** Validar fase existe no ROADMAP.md. Se valida, criar diretorio:
```bash
mkdir -p ".plano/fases/${padded_phase}-${phase_slug}"
```

## 3. Validar Fase

```bash
PHASE_INFO=$(node "$HOME/.claude/up/bin/up-tools.cjs" roadmap get-phase "${PHASE}")
```

**Se `found` = false:** Erro com fases disponiveis.
**Se `found` = true:** Extrair `phase_number`, `phase_name`, `goal`.

## 4. Carregar CONTEXT.md

Verificar `context_path` do init JSON.

Se `context_path` nao e null, exibir: `Usando contexto da fase: ${context_path}`

**Se `context_path` e null (sem CONTEXT.md):**

Use AskUserQuestion:
- header: "Sem contexto"
- question: "Sem CONTEXT.md para Fase {X}. Planos usarao pesquisa e requisitos apenas. Continuar ou capturar contexto primeiro?"
- options:
  - "Continuar sem contexto" -- Planejar usando pesquisa + requisitos apenas
  - "Executar discutir-fase primeiro" -- Capturar decisoes de design antes de planejar

Se "Continuar sem contexto": Prosseguir para passo 5.
Se "Executar discutir-fase primeiro": Exibir `/up:discutir-fase {X}` e sair.

## 5. Tratar Pesquisa

**Pular se:** flag `--gaps`, flag `--sem-pesquisa`.

**Se `has_research` = true (do init) E sem flag `--pesquisar`:** Usar existente, pular para passo 6.

**Se RESEARCH.md faltando OU flag `--pesquisar`:**

O up-planejador fara a pesquisa inline como parte do planejamento. Definir `RESEARCH_INLINE=true`.

## 6. Verificar Planos Existentes

```bash
ls "${PHASE_DIR}"/*-PLAN.md 2>/dev/null
```

**Se existem:** Oferecer: 1) Adicionar mais planos, 2) Ver existentes, 3) Replanejar do zero.

## 7. Spawn up-planejador

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > PLANEJANDO FASE {X}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Spawning planejador...
```

```
Task(
  prompt="
<planning_context>
**Fase:** {phase_number}
**Modo:** {standard | gap_closure}
**Pesquisa inline:** {RESEARCH_INLINE}

<files_to_read>
- {state_path} (Estado do Projeto)
- {roadmap_path} (Roteiro)
- {requirements_path} (Requisitos)
- {context_path} (DECISOES DO USUARIO de /up:discutir-fase)
- {research_path} (Pesquisa Tecnica - se existir)
- {verification_path} (Lacunas de Verificacao - se --gaps)
- .plano/codebase/CONVENTIONS.md (Convencoes do codebase - se existir, BROWNFIELD)
- .plano/codebase/CONCERNS.md (Divida tecnica - se existir, BROWNFIELD)
- .plano/codebase/ARCHITECTURE.md (Arquitetura existente - se existir, BROWNFIELD)
</files_to_read>

**IDs de requisitos da fase (cada ID DEVE aparecer no campo `requirements` de um plano):** {phase_req_ids}

**Instrucoes do projeto:** Ler ./CLAUDE.md se existir

Se RESEARCH_INLINE=true:
- Pesquisar o dominio antes de planejar
- Usar Context7/docs oficiais para verificar versoes e APIs
- Documentar achados de pesquisa no inicio de cada PLAN.md

**Se arquivos de codebase existem (brownfield):**
- Respeitar padroes e convencoes de CONVENTIONS.md nos planos
- Considerar divida tecnica de CONCERNS.md ao definir tarefas
- Alinhar planos com arquitetura existente de ARCHITECTURE.md
- NAO recriar infraestrutura que ja existe
</planning_context>

<self_check>
Apos criar os planos, auto-verificar:
- [ ] Cada requisito da fase mapeado a um plano
- [ ] Frontmatter valido (wave, depends_on, files_modified, autonomous)
- [ ] Tarefas sao especificas e acionaveis
- [ ] Dependencias corretamente identificadas
- [ ] Waves atribuidas para execucao paralela
- [ ] must_haves derivados do objetivo da fase
Se algo falhar na verificacao, corrija antes de retornar.
</self_check>

<output>
Escrever PLAN.md em: {phase_dir}/
Retornar: ## PLANNING COMPLETE com resumo dos planos
</output>
",
  subagent_type="up-planejador",
  description="Planejar Fase {phase}"
)
```

## 8. Tratar Retorno do Planejador

- **`## PLANNING COMPLETE`:** Exibir contagem de planos. Prosseguir para passo 9.
- **`## CHECKPOINT REACHED`:** Apresentar ao usuario, obter resposta, spawn continuacao.
- **`## PLANNING INCONCLUSIVE`:** Mostrar tentativas, oferecer: Adicionar contexto / Tentar novamente / Manual.

## 9. Apresentar Status Final

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > FASE {X} PLANEJADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Fase {X}: {Nome}** -- {N} plano(s) em {M} wave(s)

| Wave | Planos | O que constroi |
|------|--------|----------------|
| 1    | 01, 02 | [objetivos] |
| 2    | 03     | [objetivo]  |

Pesquisa: {Completa | Usou existente | Pulada | Inline}

───────────────────────────────────────────────────────────────

## Proximo

**Executar Fase {X}** -- rodar todos {N} planos

/up:executar-fase {X}

<sub>/clear primeiro -> janela de contexto limpa</sub>

───────────────────────────────────────────────────────────────

**Tambem disponivel:**
- cat .plano/fases/{fase-dir}/*-PLAN.md -- revisar planos
- /up:planejar-fase {X} --pesquisar -- re-pesquisar primeiro

───────────────────────────────────────────────────────────────
```

## 10. Auto-Advance (se --auto)

**Se flag `--auto` presente:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > AUTO-AVANCANDO PARA EXECUTAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Planos prontos. Lancando executar-fase...
```

Lancar executar-fase:
```
Skill(skill="up:executar-fase", args="${PHASE}")
```

</process>

<success_criteria>
- [ ] .plano/ diretorio validado
- [ ] Fase validada contra roteiro
- [ ] Diretorio da fase criado se necessario
- [ ] CONTEXT.md carregado e passado ao planejador
- [ ] Pesquisa tratada (inline, existente ou pulada)
- [ ] Planos existentes verificados
- [ ] up-planejador spawned com contexto completo
- [ ] Planejador auto-verificou os planos
- [ ] Planos criados (PLANNING COMPLETE ou CHECKPOINT tratado)
- [ ] Usuario ve status entre spawns de agentes
- [ ] Usuario sabe proximos passos
</success_criteria>
