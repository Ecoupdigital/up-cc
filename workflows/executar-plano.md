<purpose>
Executar um prompt de fase (PLAN.md) e criar o resumo do resultado (SUMMARY.md).
</purpose>

<required_reading>
Ler STATE.md antes de qualquer operacao para carregar contexto do projeto.
Ler config.json para configuracoes de comportamento de planejamento.
</required_reading>

<process>

<step name="init_context" priority="first">
Carregar contexto de execucao:

```bash
INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init execute-phase "${PHASE}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Extrair do init JSON: `commit_docs`, `phase_dir`, `phase_number`, `plans`, `summaries`, `incomplete_plans`, `state_path`, `config_path`.

Se `.plano/` faltando: erro.
</step>

<step name="identify_plan">
```bash
ls .plano/fases/XX-nome/*-PLAN.md 2>/dev/null | sort
ls .plano/fases/XX-nome/*-SUMMARY.md 2>/dev/null | sort
```

Encontrar primeiro PLAN sem SUMMARY correspondente.

<if mode="yolo">
Auto-aprovar: `Executar {fase}-{plano}-PLAN.md [Plano X de Y para Fase Z]` -> parse_segments.
</if>

<if mode="interactive">
Apresentar identificacao do plano, esperar confirmacao.
</if>
</step>

<step name="record_start_time">
```bash
PLAN_START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PLAN_START_EPOCH=$(date +%s)
```
</step>

<step name="load_prompt">
```bash
cat .plano/fases/XX-nome/{fase}-{plano}-PLAN.md
```
Este E as instrucoes de execucao. Seguir exatamente. Se plano referencia CONTEXT.md: honrar visao do usuario em tudo.
</step>

<step name="execute">
Desvios sao normais -- tratar via regras abaixo.

1. Ler arquivos de @contexto do prompt
2. Por tarefa:
   - `type="auto"`: Implementar com regras de desvio + portoes de autenticacao. Verificar criterios de conclusao. Commitar. Registrar hash para Summary.
   - `type="checkpoint:*"`: PARAR -> checkpoint_protocol -> esperar usuario -> continuar apenas apos confirmacao.
3. Executar verificacoes `<verification>`
4. Confirmar `<success_criteria>` atendido
5. Documentar desvios no Summary
</step>

<deviation_rules>

## Regras de Desvio

Voce VAI descobrir trabalho nao planejado. Aplicar automaticamente, rastrear todos para Summary.

| Regra | Gatilho | Acao | Permissao |
|-------|---------|------|-----------|
| **1: Bug** | Comportamento quebrado, erros, queries erradas, erros de tipo, vulns de seguranca | Corrigir -> testar -> verificar -> rastrear `[Regra 1 - Bug]` | Auto |
| **2: Critico Faltante** | Essenciais faltando: tratamento de erro, validacao, auth, CSRF/CORS | Adicionar -> testar -> verificar -> rastrear `[Regra 2 - Critico Faltante]` | Auto |
| **3: Bloqueante** | Impede conclusao: deps faltando, tipos errados, imports quebrados | Corrigir bloqueio -> verificar que prossegue -> rastrear `[Regra 3 - Bloqueante]` | Auto |
| **4: Arquitetural** | Mudanca estrutural: nova tabela DB, mudanca de schema, novo servico | PARAR -> apresentar decisao -> rastrear `[Regra 4 - Arquitetural]` | Perguntar usuario |

**Prioridade:** Regra 4 (PARAR) > Regras 1-3 (auto) > incerto -> Regra 4

</deviation_rules>

<task_commit>
## Protocolo de Commit por Tarefa

Apos cada tarefa (verificacao passou, criterios de conclusao atendidos), commitar imediatamente.

**1. Verificar:** `git status --short`

**2. Stagear individualmente** (NUNCA `git add .` ou `git add -A`):
```bash
git add src/api/auth.ts
git add src/types/user.ts
```

**3. Tipo de commit:**

| Tipo | Quando | Exemplo |
|------|--------|---------|
| `feat` | Nova funcionalidade | feat(08-02): criar endpoint de registro |
| `fix` | Correcao de bug | fix(08-02): corrigir regex de validacao de email |
| `test` | Apenas teste | test(08-02): adicionar teste para hashing de senha |
| `refactor` | Sem mudanca de comportamento | refactor(08-02): extrair validacao para helper |
| `docs` | Documentacao | docs(08-02): adicionar docs da API |
| `chore` | Config/deps | chore(08-02): adicionar dependencia bcrypt |

**4. Formato:** `{tipo}({fase}-{plano}): {descricao}`

**5. Registrar hash:**
```bash
TASK_COMMIT=$(git rev-parse --short HEAD)
```

</task_commit>

<step name="checkpoint_protocol">
Em `type="checkpoint:*"`: automatizar tudo possivel primeiro. Checkpoints sao apenas para verificacao/decisoes.

Exibir: box `CHECKPOINT: [Tipo]` -> Progresso {X}/{Y} -> Nome da tarefa -> conteudo especifico do tipo -> `SUA ACAO: [sinal]`

| Tipo | Conteudo | Sinal de retomada |
|------|----------|-------------------|
| human-verify (90%) | O que foi construido + passos de verificacao | "aprovado" ou descrever problemas |
| decision (9%) | Decisao necessaria + contexto + opcoes | "Selecionar: opcao-id" |
| human-action (1%) | O que foi automatizado + UM passo manual | "feito" |
</step>

<step name="create_summary">
Criar `{fase}-{plano}-SUMMARY.md` em `.plano/fases/XX-nome/`.

**Frontmatter:** fase, plano, subsistema, tags | requer/fornece/afeta | tech-stack.adicionado/padroes | key-files.criados/modificados | decisoes-chave | requisitos-completados | duracao, completado.

Titulo: `# Fase [X] Plano [Y]: [Nome] Resumo`

One-liner SUBSTANCIAL: "Auth JWT com rotacao de refresh usando jose library" nao "Autenticacao implementada"
</step>

<step name="update_current_position">
Atualizar STATE.md:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" state advance-plan
node "$HOME/.claude/up/bin/up-tools.cjs" state update-progress
```
</step>

<step name="update_roadmap">
```bash
node "$HOME/.claude/up/bin/up-tools.cjs" roadmap update-plan-progress "${PHASE}"
```
</step>

<step name="update_requirements">
Marcar requisitos completados do campo `requirements:` do frontmatter do PLAN.md:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" requirements mark-complete ${REQ_IDS}
```
</step>

<step name="git_commit_metadata">
Codigo da tarefa ja committed por tarefa. Commitar metadados do plano:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs({fase}-{plano}): completar plano [nome]" --files .plano/fases/XX-nome/{fase}-{plano}-SUMMARY.md .plano/STATE.md .plano/ROADMAP.md .plano/REQUIREMENTS.md
```
</step>

<step name="offer_next">
```bash
ls -1 .plano/fases/[dir-fase-atual]/*-PLAN.md 2>/dev/null | wc -l
ls -1 .plano/fases/[dir-fase-atual]/*-SUMMARY.md 2>/dev/null | wc -l
```

| Condicao | Rota | Acao |
|----------|------|------|
| summaries < plans | **A: Mais planos** | Encontrar proximo PLAN sem SUMMARY. Yolo: auto-continuar. Interativo: mostrar proximo plano. |
| summaries = plans, atual < maior fase | **B: Fase pronta** | Mostrar conclusao, sugerir `/up:planejar-fase {Z+1}` |
| summaries = plans, atual = maior fase | **C: Todas fases prontas** | Mostrar banner de conclusao |
</step>

</process>

<success_criteria>
- Todas tarefas do PLAN.md completadas
- Todas verificacoes passam
- SUMMARY.md criado com conteudo substancial
- STATE.md atualizado (posicao, decisoes, problemas, sessao)
- ROADMAP.md atualizado
</success_criteria>