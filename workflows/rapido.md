<purpose>
Executar tarefas pequenas e ad-hoc com garantias UP (commits atomicos, rastreamento STATE.md). Modo rapido spawna up-planejador (modo rapido) + up-executor(s), rastreia tarefas em `.plano/rapido/`, e atualiza tabela "Tarefas Rapidas Completadas" do STATE.md.
</purpose>

<process>
**Passo 1: Parsear argumentos e obter descricao da tarefa**

Parsear `$ARGUMENTS` para:
- Texto restante -> usar como `$DESCRIPTION` se nao-vazio

Se `$DESCRIPTION` esta vazio, promptar usuario interativamente:

```
AskUserQuestion(
  header: "Tarefa Rapida",
  question: "O que voce quer fazer?",
  followUp: null
)
```

Guardar resposta como `$DESCRIPTION`.

Se ainda vazio, re-promptar: "Por favor forneca descricao da tarefa."

Exibir banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > TAREFA RAPIDA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

**Passo 2: Inicializar**

```bash
INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init quick "$DESCRIPTION")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON: `commit_docs`, `next_num`, `slug`, `date`, `timestamp`, `quick_dir`, `task_dir`, `roadmap_exists`, `planning_exists`.

**Se `roadmap_exists` = false:** Erro -- Modo rapido requer projeto ativo com ROADMAP.md. Execute `/up:novo-projeto` primeiro.

---

**Passo 3: Criar diretorio da tarefa**

```bash
QUICK_DIR=".plano/rapido/${next_num}-${slug}"
mkdir -p "$QUICK_DIR"
```

Reportar:
```
Criando tarefa rapida ${next_num}: ${DESCRIPTION}
Diretorio: ${QUICK_DIR}
```

---

**Passo 4: Spawn planejador (modo rapido)**

```
Task(
  prompt="
<planning_context>

**Modo:** quick
**Diretorio:** ${QUICK_DIR}
**Descricao:** ${DESCRIPTION}

<files_to_read>
- .plano/STATE.md (Estado do Projeto)
- ./CLAUDE.md (se existir -- seguir diretrizes do projeto)
</files_to_read>

</planning_context>

<constraints>
- Criar UM UNICO plano com 1-3 tarefas focadas
- Tarefas rapidas devem ser atomicas e autocontidas
- Sem fase de pesquisa
- Alvo ~30% uso de contexto (simples, focado)
</constraints>

<output>
Escrever plano em: ${QUICK_DIR}/${next_num}-PLAN.md
Retornar: ## PLANNING COMPLETE com caminho do plano
</output>
",
  subagent_type="up-planejador",
  description="Plano rapido: ${DESCRIPTION}"
)
```

Apos planejador retornar:
1. Verificar plano existe em `${QUICK_DIR}/${next_num}-PLAN.md`
2. Reportar: "Plano criado: ${QUICK_DIR}/${next_num}-PLAN.md"

---

**Passo 5: Spawn executor**

```
Task(
  prompt="
Executar tarefa rapida ${next_num}.

<files_to_read>
- ${QUICK_DIR}/${next_num}-PLAN.md (Plano)
- .plano/STATE.md (Estado do projeto)
- ./CLAUDE.md (Instrucoes do projeto, se existir)
</files_to_read>

<constraints>
- Executar todas tarefas do plano
- Commitar cada tarefa atomicamente
- Criar summary em: ${QUICK_DIR}/${next_num}-SUMMARY.md
- NAO atualizar ROADMAP.md (tarefas rapidas sao separadas de fases planejadas)
</constraints>
",
  subagent_type="up-executor",
  description="Executar: ${DESCRIPTION}"
)
```

Apos executor retornar:
1. Verificar summary existe em `${QUICK_DIR}/${next_num}-SUMMARY.md`
2. Se summary nao encontrado, erro: "Executor falhou ao criar ${next_num}-SUMMARY.md"

---

**Passo 6: Atualizar STATE.md**

**6a. Verificar se secao "Tarefas Rapidas Completadas" existe:**

Ler STATE.md e verificar secao `### Tarefas Rapidas Completadas`.

**6b. Se secao nao existe, criar:**

Inserir apos secao `### Bloqueios/Preocupacoes`:

```markdown
### Tarefas Rapidas Completadas

| # | Descricao | Data | Commit | Diretorio |
|---|-----------|------|--------|----------|
```

**6c. Adicionar nova linha a tabela:**

```markdown
| ${next_num} | ${DESCRIPTION} | ${date} | ${commit_hash} | [${next_num}-${slug}](./rapido/${next_num}-${slug}/) |
```

**6d. Atualizar linha "Ultima atividade":**

```
Ultima atividade: ${date} - Completou tarefa rapida ${next_num}: ${DESCRIPTION}
```

Usar ferramenta Edit para fazer mudancas atomicamente.

---

**Passo 7: Commit final e conclusao**

Stagear e commitar artefatos da tarefa rapida:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs(rapido-${next_num}): ${DESCRIPTION}" --files ${QUICK_DIR}/${next_num}-PLAN.md ${QUICK_DIR}/${next_num}-SUMMARY.md .plano/STATE.md
```

Obter hash do commit final:
```bash
commit_hash=$(git rev-parse --short HEAD)
```

Exibir saida de conclusao:

```
---

UP > TAREFA RAPIDA COMPLETA

Tarefa Rapida ${next_num}: ${DESCRIPTION}

Summary: ${QUICK_DIR}/${next_num}-SUMMARY.md
Commit: ${commit_hash}

---

Pronto para proxima tarefa: /up:rapido
```

</process>

<success_criteria>
- [ ] Validacao ROADMAP.md passa
- [ ] Usuario forneceu descricao da tarefa
- [ ] Slug gerado (minusculo, hifens, max 40 chars)
- [ ] Proximo numero calculado (001, 002, 003...)
- [ ] Diretorio criado em `.plano/rapido/NNN-slug/`
- [ ] `${next_num}-PLAN.md` criado pelo planejador
- [ ] `${next_num}-SUMMARY.md` criado pelo executor
- [ ] STATE.md atualizado com linha da tarefa rapida
- [ ] Artefatos committed
</success_criteria>