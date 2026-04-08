<purpose>
Registrar projeto no UP de forma leve. Sem questionario, sem requisitos, sem roadmap.
Detecta o que existe, gera PROJECT.md automaticamente, cria config padrao, para.

O PROJECT.md vai crescer conforme o usuario planeja fases com /up:planejar-fase e /up:discutir-fase.
</purpose>

<process>

## 1. Setup

**PRIMEIRO PASSO OBRIGATORIO -- Execute antes de qualquer interacao:**

```bash
INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init iniciar)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON: `commit_docs`, `project_exists`, `planning_exists`, `has_existing_code`, `has_codebase_map`, `codebase_files`, `has_git`, `has_package_json`, `has_readme`, `stack_hints`.

**Se `project_exists` = true:**

Use AskUserQuestion:
- header: "PROJECT.md existente"
- question: "Ja existe um PROJECT.md. O que fazer?"
- options:
  - "Sobrescrever" -- Gerar novamente a partir do codebase
  - "Cancelar" -- Manter como esta

Se "Cancelar": Sair. Sugerir `/up:progresso`.

**Se `has_git` = false:** Inicializar git:
```bash
git init
```

## 2. Coletar informacoes do projeto (AUTOMATICO, sem perguntar)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > REGISTRANDO PROJETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Fontes de informacao (ler em paralelo, o que existir):

**Sempre ler:**
```bash
# package.json (nome, descricao, dependencias)
cat package.json 2>/dev/null

# README (descricao do projeto)
cat README.md 2>/dev/null || cat readme.md 2>/dev/null

# CLAUDE.md do projeto (instrucoes existentes)
cat CLAUDE.md 2>/dev/null

# Estrutura de diretorios (top-level)
ls -d */ 2>/dev/null | head -20
```

**Se `has_codebase_map` = true (mapeamento completo existe):**
```bash
cat .plano/codebase/STACK.md 2>/dev/null
cat .plano/codebase/ARCHITECTURE.md 2>/dev/null
cat .plano/codebase/CONCERNS.md 2>/dev/null
cat .plano/codebase/CONVENTIONS.md 2>/dev/null
```

**Se `has_codebase_map` = false E `has_existing_code` = true (mini-scan):**
```bash
# Detectar stack pelos arquivos de config
ls package.json go.mod Cargo.toml requirements.txt pyproject.toml pom.xml build.gradle composer.json Gemfile mix.exs 2>/dev/null

# Detectar estrutura
ls -d src/ app/ lib/ cmd/ internal/ pages/ components/ public/ api/ server/ 2>/dev/null | head -15

# Detectar frameworks (package.json deps)
node -e "try{const p=require('./package.json');console.log(JSON.stringify({deps:Object.keys(p.dependencies||{}),devDeps:Object.keys(p.devDependencies||{})}))}catch{}" 2>/dev/null
```

### Sintetizar informacoes coletadas:

A partir das fontes lidas, extrair:
- **Nome do projeto**: de package.json name, ou nome do diretorio
- **Descricao**: de package.json description, ou primeiro paragrafo do README, ou inferir do codigo
- **Stack**: frameworks, linguagens, dependencias principais
- **Estrutura**: organizacao de diretorios, entry points
- **Contexto adicional**: do CLAUDE.md, README, ou codebase map

## 3. Gerar PROJECT.md (AUTOMATICO)

Escrever `.plano/PROJECT.md` sintetizando tudo que foi coletado:

```markdown
# [Nome do Projeto]

## O que e Isso

[Descricao gerada automaticamente a partir de package.json, README, e/ou analise do codigo.
2-3 frases descrevendo o que o produto faz e para quem.]

## Valor Central

[Inferido do codigo/README. Se nao for possivel inferir com confianca, usar:]
[A definir -- sera refinado conforme o projeto evolui]

## Requisitos

### Validados

<!-- Inferidos do codebase existente -->

- [x] [Feature existente 1 detectada no codigo]
- [x] [Feature existente 2 detectada no codigo]
- [x] [Feature existente 3 detectada no codigo]

### Ativos

<!-- Adicione objetivos com /up:planejar-fase ou /up:discutir-fase -->

(Nenhum ainda)

### Fora do Escopo

(A definir)

## Contexto

**Stack:** [linguagens, frameworks, dependencias principais]
**Estrutura:** [organizacao do projeto]
[Se codebase map existe:]
**Mapeamento detalhado:** .plano/codebase/
[Se README existe:]
**Documentacao:** README.md
[Se CLAUDE.md existe:]
**Instrucoes de desenvolvimento:** CLAUDE.md

## Restricoes

- **Stack**: [stack detectada] -- projeto existente
[Outras restricoes inferidas, ex: se tem TypeScript strict, se tem ESLint, etc.]

## Decisoes-Chave

| Decisao | Justificativa | Resultado |
|---------|---------------|-----------|
| Registrado via /up:iniciar | Adocao incremental do UP | -- |

---
*Ultima atualizacao: [data] apos registro inicial*
```

**IMPORTANTE:** Preencher Requisitos Validados com features REAIS detectadas no codigo. Se tem codebase map, usar ARCHITECTURE.md como fonte. Se nao, inferir das dependencias e estrutura (ex: "Sistema de autenticacao com NextAuth", "API REST com Express", "Interface com React e Tailwind").

Nao inventar features. So listar o que e evidente no codigo.

**Commit PROJECT.md:**

```bash
mkdir -p .plano
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs: registrar projeto via /up:iniciar" --files .plano/PROJECT.md
```

## 4. Criar config.json padrao

Criar `.plano/config.json` com valores padrao (sem perguntar):

```json
{
  "mode": "yolo",
  "granularity": "standard",
  "parallelization": true,
  "commit_docs": true
}
```

**Commit config.json:**

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "chore: config padrao do projeto" --files .plano/config.json
```

## 5. Finalizar

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > PROJETO REGISTRADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**[Nome do Projeto]**

[Descricao curta -- 1 linha do "O que e Isso"]

| Artefato  | Localizacao          |
|-----------|----------------------|
| Projeto   | `.plano/PROJECT.md`  |
| Config    | `.plano/config.json` |
[Se codebase map existe:]
| Codebase  | `.plano/codebase/`   |

**[N] features existentes documentadas**

───────────────────────────────────────────────────────────────

## Proximos Passos

O UP esta pronto. Use conforme precisar:

- `/up:mapear-codigo` -- Analise profunda do codebase (se ainda nao mapeou)
- `/up:melhorias` -- Auditoria de UX, performance, modernidade
- `/up:ideias` -- Sugestoes de features novas
- `/up:planejar-fase` -- Quando tiver algo especifico para implementar
- `/up:rapido` -- Tarefa rapida sem fase formal

PROJECT.md e um documento vivo -- sera atualizado conforme voce planeja e executa fases.

<sub>/clear antes do proximo comando -- janela de contexto limpa</sub>

───────────────────────────────────────────────────────────────
```

</process>

<success_criteria>

- [ ] .plano/ diretorio criado
- [ ] Git repo inicializado (se nao existia)
- [ ] Informacoes coletadas automaticamente (sem perguntas ao usuario)
- [ ] PROJECT.md gerado com features existentes documentadas -> **committed**
- [ ] config.json criado com valores padrao -> **committed**
- [ ] NENHUM questionario, NENHUM REQUIREMENTS.md, NENHUM ROADMAP.md
- [ ] Proximos passos apresentados

</success_criteria>
