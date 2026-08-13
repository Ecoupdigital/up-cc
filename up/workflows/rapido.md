<purpose>
Executar tarefas pequenas e ad-hoc com garantias UP (commits atomicos, rastreamento STATE.md).
O orquestrador executa na propria sessao (ou spawna um `up-executor` se a tarefa passar de um
arquivo). Sem planejador. Sem DCRV. Lei de Ferro na mesma sessao: evidencia fresca antes de
afirmar pronto. Rastreia em `.plano/rapido/` e atualiza a tabela "Tarefas Rapidas Completadas"
do STATE.md quando `.plano/` existir.

**ESCAPE HATCH PURO (sem cerimonia GitHub).** Diferente de `/up:build` (GitHub-nativo por DEFAULT:
worktree -> branch `up/fase-NN` -> issue -> PR -> menu), o modo rapido NUNCA cria worktree, NUNCA cria
issue do GitHub, NUNCA abre PR e NAO toca em `.plano/git-map.json`. Todo o trabalho e committado
atomicamente na branch ATUAL (mesma semantica do `--local` do build). E o caminho quente para
"so faz e commita". Quem quer worktree/issue/PR usa `/up:build`.
</purpose>

> Vocabulário UP: fase, plano, onda, gate, evidência, worktree, escape hatch, verificação e laço DCRV têm definição única em `$HOME/.claude/up/references/glossario-up.md`. Use o termo, não redefina.

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
INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init rapido "$DESCRIPTION")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON: `commit_docs`, `next_num`, `slug`, `date`, `timestamp`, `quick_dir`, `task_dir`, `roadmap_exists`, `planning_exists`.

ROADMAP.md NAO e obrigatorio. Se `.plano/` nao existe, criar so o necessario para rastrear a
tarefa (`.plano/rapido/` e um STATE.md minimo). Sem roadmap, sem fase, sem PLAN-READY.

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

**Passo 4: Executar (orquestrador na sessao, sem planejador)**

Nao spawne `up-planejador`. Nao escreva PLAN.md obrigatorio. Nao rode DCRV.

1. Anuncie em uma linha o que vai mudar e onde.
2. Execute na propria sessao. So spawne `up-executor` se a tarefa passar de um arquivo ou
   exigir isolamento. Um spawn, sem cadeia.
3. Aplique a Lei de Ferro nesta mensagem: rode a prova do tipo certo (teste, captura ou smoke)
   e leia a saida antes de afirmar pronto. Detalhe em `up-verificar-antes-de-concluir`.
4. Commit atomico na branch atual.
5. Escreva um SUMMARY curto em `${QUICK_DIR}/${next_num}-SUMMARY.md` (o que mudou, a prova
   rodada, o hash do commit). Sem plano, sem DCRV, sem VERIFICATION.md.

---

**Passo 6: Atualizar STATE.md**

**6a. Verificar se secao "Tarefas Rapidas Completadas" existe:**

Ler STATE.md e verificar secao `### Tarefas Rapidas Completadas`.

**6b. Se secao nao existe, criar:**

Inserir apos secao `### Bloqueios/Preocupacoes`:

```markdown
### Tarefas Rapidas Completadas

| # | Descricao | Data | Commit | Diretorio |
|---|-----------|------|--------|-----------|
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
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs(rapido-${next_num}): ${DESCRIPTION}" --files ${QUICK_DIR}/${next_num}-SUMMARY.md .plano/STATE.md
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
- [ ] Sem spawn de up-planejador e sem DCRV
- [ ] `${next_num}-SUMMARY.md` escrito com a prova da Lei de Ferro
- [ ] STATE.md atualizado com linha da tarefa rapida
- [ ] Artefatos committed na branch ATUAL (sem worktree, sem issue, sem PR, sem git-map.json)
</success_criteria>
