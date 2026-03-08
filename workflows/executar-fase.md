<purpose>
Executar todos os planos em uma fase usando execucao paralela baseada em waves. Orquestrador fica enxuto -- delega execucao de planos a subagentes.
</purpose>

<core_principle>
Orquestrador coordena, nao executa. Cada subagente carrega o contexto completo de execute-plan. Orquestrador: descobrir planos -> analisar deps -> agrupar waves -> spawn agentes -> tratar checkpoints -> coletar resultados.
</core_principle>

<process>

<step name="initialize" priority="first">
Carregar contexto:

```bash
INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init execute-phase "${PHASE_ARG}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON: `executor_model`, `verifier_model`, `commit_docs`, `parallelization`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `plans`, `incomplete_plans`, `plan_count`, `incomplete_count`, `state_exists`, `roadmap_exists`, `phase_req_ids`.

**Se `phase_found` = false:** Erro -- diretorio da fase nao encontrado.
**Se `plan_count` = 0:** Erro -- sem planos encontrados na fase.

Quando `parallelization` = false, planos dentro de uma wave executam sequencialmente.
</step>

<step name="validate_phase">
Do init JSON: `phase_dir`, `plan_count`, `incomplete_count`.

Reportar: "Encontrados {plan_count} planos em {phase_dir} ({incomplete_count} incompletos)"
</step>

<step name="discover_and_group_plans">
Carregar inventario de planos com agrupamento por wave:

```bash
PLAN_INDEX=$(node "$HOME/.claude/up/bin/up-tools.cjs" phase-plan-index "${PHASE_NUMBER}")
```

Parse JSON: `phase`, `plans[]` (cada com `id`, `wave`, `autonomous`, `objective`, `files_modified`, `task_count`, `has_summary`), `waves`, `incomplete`, `has_checkpoints`.

**Filtrar:** Pular planos onde `has_summary: true`. Se todos filtrados: "Sem planos incompletos" -> sair.

Reportar:
```
## Plano de Execucao

**Fase {X}: {Nome}** -- {total_plans} planos em {wave_count} waves

| Wave | Planos | O que constroi |
|------|--------|----------------|
| 1 | 01-01, 01-02 | {dos objetivos dos planos, 3-8 palavras} |
| 2 | 01-03 | ... |
```
</step>

<step name="execute_waves">
Executar cada wave em sequencia. Dentro de uma wave: paralelo se `PARALLELIZATION=true`, sequencial se `false`.

**Para cada wave:**

1. **Descrever o que esta sendo construido (ANTES do spawn):**

   Ler `<objective>` de cada plano. Extrair o que esta sendo construido e por que.

   ```
   ---
   ## Wave {N}

   **{Plan ID}: {Nome do Plano}**
   {2-3 sentencas: o que isso constroi, abordagem tecnica, por que importa}

   Spawning {count} agente(s)...
   ---
   ```

2. **Spawn agentes executores:**

   Passar apenas caminhos -- executores leem arquivos eles mesmos com contexto limpo de 200k.

   ```
   Task(
     subagent_type="up-executor",
     prompt="
       <objective>
       Executar plano {plan_number} da fase {phase_number}-{phase_name}.
       Commitar cada tarefa atomicamente. Criar SUMMARY.md. Atualizar STATE.md e ROADMAP.md.
       </objective>

       <execution_context>
       @~/.claude/up/workflows/executar-plano.md
       @~/.claude/up/references/checkpoints.md
       </execution_context>

       <files_to_read>
       Ler estes arquivos no inicio da execucao usando a ferramenta Read:
       - {phase_dir}/{plan_file} (Plano)
       - .plano/STATE.md (Estado)
       - .plano/config.json (Config, se existir)
       - ./CLAUDE.md (Instrucoes do projeto, se existir)
       </files_to_read>

       <success_criteria>
       - [ ] Todas tarefas executadas
       - [ ] Cada tarefa committed individualmente
       - [ ] SUMMARY.md criado no diretorio do plano
       - [ ] STATE.md atualizado com posicao e decisoes
       - [ ] ROADMAP.md atualizado com progresso do plano (via `roadmap update-plan-progress`)
       </success_criteria>
     "
   )
   ```

3. **Esperar todos agentes na wave completarem.**

4. **Reportar conclusao -- spot-check claims primeiro:**

   Para cada SUMMARY.md:
   - Verificar que primeiros 2 arquivos de `key-files.created` existem no disco
   - Verificar `git log --oneline --all --grep="{phase}-{plan}"` retorna >= 1 commit
   - Verificar marcador `## Self-Check: FAILED`

   Se algum spot-check falhar: reportar qual plano falhou, perguntar "Tentar novamente?" ou "Continuar com waves restantes?"

   Se passar:
   ```
   ---
   ## Wave {N} Completa

   **{Plan ID}: {Nome do Plano}**
   {O que foi construido -- do SUMMARY.md}

   {Se mais waves: o que isso habilita para proxima wave}
   ---
   ```

5. **Tratar falhas:**
   Para falhas reais: reportar qual plano falhou -> perguntar "Continuar?" ou "Parar?" -> se continuar, planos dependentes podem tambem falhar.

6. **Prosseguir para proxima wave.**
</step>

<step name="aggregate_results">
Apos todas waves:

```markdown
## Fase {X}: {Nome} Execucao Completa

**Waves:** {N} | **Planos:** {M}/{total} completos

| Wave | Planos | Status |
|------|--------|--------|
| 1 | plano-01, plano-02 | Completo |
| 2 | plano-03 | Completo |

### Detalhes dos Planos
1. **03-01**: [resumo do SUMMARY.md]
2. **03-02**: [resumo do SUMMARY.md]

### Problemas Encontrados
[Agregado dos SUMMARYs, ou "Nenhum"]
```
</step>

<step name="verify_phase_goal">
Verificar que fase atingiu seu OBJETIVO, nao apenas completou tarefas.

```
Task(
  prompt="Verificar atingimento do objetivo da fase {phase_number}.
Diretorio da fase: {phase_dir}
Objetivo da fase: {goal do ROADMAP.md}
IDs de requisitos da fase: {phase_req_ids}
Verificar must_haves contra codebase real.
Cross-referenciar IDs de requisitos do frontmatter do PLAN contra REQUIREMENTS.md.
Criar VERIFICATION.md.",
  subagent_type="up-verificador"
)
```

Ler status:
```bash
grep "^status:" "$PHASE_DIR"/*-VERIFICATION.md | cut -d: -f2 | tr -d ' '
```

| Status | Acao |
|--------|------|
| `passed` | -> update_roadmap |
| `human_needed` | Apresentar itens para teste humano, obter aprovacao |
| `gaps_found` | Apresentar resumo de lacunas, oferecer `/up:planejar-fase {fase} --gaps` |
</step>

<step name="update_roadmap">
**Marcar fase completa e atualizar todos arquivos de rastreamento:**

```bash
COMPLETION=$(node "$HOME/.claude/up/bin/up-tools.cjs" phase complete "${PHASE_NUMBER}")
```

O CLI trata:
- Marcar checkbox da fase `[x]` com data de conclusao
- Atualizar tabela de Progresso
- Avancar STATE.md para proxima fase
- Atualizar rastreabilidade do REQUIREMENTS.md

Extrair do resultado: `next_phase`, `next_phase_name`, `is_last_phase`.

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs(fase-{X}): completar execucao da fase" --files .plano/ROADMAP.md .plano/STATE.md .plano/REQUIREMENTS.md {phase_dir}/*-VERIFICATION.md
```
</step>

<step name="offer_next">

**Se verificacao passou:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > FASE {X} COMPLETA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Fase {X}: {Nome}** -- todos planos executados e verificados

───────────────────────────────────────────────────────────────

## Proximo

**Fase {X+1}: {Nome}** -- [Objetivo do ROADMAP.md]

/up:discutir-fase {X+1} -- reunir contexto e esclarecer abordagem

<sub>/clear primeiro -> janela de contexto limpa</sub>

───────────────────────────────────────────────────────────────

**Tambem disponivel:**
- /up:planejar-fase {X+1} -- pular discussao, planejar diretamente
- /up:verificar-trabalho {X} -- teste de aceitacao do usuario

───────────────────────────────────────────────────────────────
```

**Se lacunas encontradas:**

```
## Lacunas Encontradas na Fase {X}: {Nome}

**Score:** {N}/{M} must-haves verificados
**Relatorio:** {phase_dir}/{phase_num}-VERIFICATION.md

### O que Falta
{Resumo das lacunas}

---
## Proximo

`/up:planejar-fase {X} --gaps`

<sub>`/clear` primeiro -> janela de contexto limpa</sub>
```
</step>

</process>

<context_efficiency>
Orquestrador: ~10-15% contexto. Subagentes: 200k limpo cada. Sem polling (Task bloqueia). Sem vazamento de contexto.
</context_efficiency>

<failure_handling>
- **Agente falha no meio do plano:** SUMMARY.md faltando -> reportar, perguntar usuario como prosseguir
- **Cadeia de dependencia quebra:** Wave 1 falha -> dependentes da Wave 2 provavelmente falham -> usuario escolhe tentar ou pular
- **Todos agentes na wave falham:** Problema sistemico -> parar, reportar para investigacao
</failure_handling>

<resumption>
Re-executar `/up:executar-fase {fase}` -> discover_plans encontra SUMMARYs completos -> pula -> resume do primeiro plano incompleto -> continua execucao por wave.
</resumption>