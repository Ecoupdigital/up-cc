---
phase: 07-comando-melhorias
plan: 07-001
type: feature
autonomous: true
wave: 0
depends_on: []
requirements: [MELH-01, INFRA-04]
must_haves:
  truths:
    - "up-tools.cjs responde a 'init melhorias' retornando JSON com planning_exists, melhorias_dir, date, stack_hints"
    - "Arquivo up/commands/melhorias.md existe com frontmatter valido e referencia ao workflow melhorias.md"
    - "Copias raiz existem em commands/up/melhorias.md e sao identicas a fonte canonica"
  artifacts:
    - path: "up/bin/up-tools.cjs"
      provides: "cmdInitMelhorias com deteccao standalone e stack hints"
    - path: "up/commands/melhorias.md"
      provides: "Slash command /up:melhorias com frontmatter e estrutura XML"
    - path: "commands/up/melhorias.md"
      provides: "Copia raiz do command para instalacao local"
  key_links:
    - from: "up/commands/melhorias.md"
      to: "up/workflows/melhorias.md"
      via: "@~/.claude/up/workflows/melhorias.md no execution_context"
    - from: "up/workflows/melhorias.md (futuro)"
      to: "up/bin/up-tools.cjs"
      via: "node $HOME/.claude/up/bin/up-tools.cjs init melhorias"
---

# Fase 7 Plano 1: Infraestrutura do comando /up:melhorias

**Objetivo:** Criar o command file, a funcao CLI init, e as copias raiz necessarias para que o workflow (plano 002) possa ser executado. Este plano entrega a camada de entry point e infraestrutura CLI.

## Pesquisa Inline -- Achados

**Padrao command file (de rapido.md, executar-fase.md, mapear-codigo.md):**
- Frontmatter YAML: `name: up:nome`, `description`, `argument-hint`, `allowed-tools` (array YAML)
- Corpo XML: `<objective>`, `<execution_context>` (com `@~/.claude/up/workflows/...`), `<context>`, `<process>`
- allowed-tools inclui Task para spawn de agentes

**Padrao CLI init (de up-tools.cjs linhas 174-207):**
- Cada workflow tem `cmdInit*` no switch `init` do `main()`
- Retorna JSON com flags de existencia, paths, config
- Usa `loadConfig(cwd)`, `pathExistsInternal(cwd, path)`, `output(result, raw)`

**Padrao standalone (INFRA-04):**
- `/up:rapido` exige `roadmap_exists=true` -- NAO e standalone
- `/up:mapear-codigo` verifica `.plano/codebase/` e cria se nao existe -- este e o padrao standalone correto
- Para `/up:melhorias`: NAO exigir `.plano/`, ROADMAP.md, ou STATE.md. Criar `.plano/melhorias/` automaticamente no workflow.

**Padrao de copias raiz (de STRUCTURE.md linhas 263-268):**
- Fonte canonica: `up/commands/melhorias.md`
- Copia raiz: `commands/up/melhorias.md` (identica)
- Agentes novos NAO precisam de copia raiz neste plano (auditores e sintetizador ja existem da fase 5/6)

## Contexto

@up/bin/up-tools.cjs -- CLI tools, adicionar cmdInitMelhorias e case no switch init
@up/commands/rapido.md -- referencia de padrao de command file
@up/commands/mapear-codigo.md -- referencia de padrao standalone
@up/bin/lib/core.cjs -- utilitarios compartilhados (loadConfig, pathExistsInternal, output, error)

## Tarefas

<task id="1" type="auto">
<files>up/bin/up-tools.cjs</files>
<action>
Adicionar suporte ao subcomando `init melhorias` no CLI tools. Duas mudancas necessarias:

**1. No switch `init` dentro de `main()` (~linha 203, antes do `default`):**
Adicionar case:
```javascript
case 'melhorias':
  cmdInitMelhorias(cwd, raw);
  break;
```

Atualizar a mensagem de erro do `default` para incluir 'melhorias' na lista de workflows disponiveis.

**2. Criar funcao `cmdInitMelhorias(cwd, raw)` (adicionar apos `cmdInitVerificarTrabalho`, ~linha 700+):**

```javascript
function cmdInitMelhorias(cwd, raw) {
  const config = loadConfig(cwd);
  const now = new Date();

  // Detectar stack hints do projeto para ajustar auditoria
  const pkgPath = path.join(cwd, 'package.json');
  let stackHints = {};
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDeps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});
    stackHints = {
      has_react: !!allDeps.react,
      has_next: !!allDeps.next,
      has_vue: !!allDeps.vue,
      has_nuxt: !!allDeps.nuxt,
      has_svelte: !!allDeps.svelte,
      has_tailwind: !!allDeps.tailwindcss,
      has_prisma: !!(allDeps['@prisma/client'] || allDeps.prisma),
      has_typescript: !!(allDeps.typescript || pathExistsInternal(cwd, 'tsconfig.json')),
      type_module: pkg.type === 'module',
    };
  } catch {}

  const result = {
    planning_exists: pathExistsInternal(cwd, '.plano'),
    melhorias_dir: '.plano/melhorias',
    melhorias_exists: pathExistsInternal(cwd, '.plano/melhorias'),
    has_claude_md: pathExistsInternal(cwd, 'CLAUDE.md'),
    has_package_json: pathExistsInternal(cwd, 'package.json'),
    date: now.toISOString().split('T')[0],
    timestamp: now.toISOString(),
    commit_docs: config.commit_docs,
    stack_hints: stackHints,
  };

  output(result, raw);
}
```

**Convencoes a seguir (CONVENTIONS.md):**
- Nome de funcao: `cmdInitMelhorias` (camelCase, prefixo `cmd`)
- Chaves de retorno: `snake_case` (planning_exists, melhorias_dir, etc.)
- Tratamento de erro: try/catch silencioso para leitura de package.json (retorna {} se falhar)
- Usar `pathExistsInternal` de core.cjs (ja importado)
- Usar `loadConfig`, `output` de core.cjs (ja importado)
- NAO exigir .plano/ ou ROADMAP.md (standalone INFRA-04)
</action>
<verify>
<automated>node /home/projects/up-dev-code/up/bin/up-tools.cjs init melhorias --cwd /home/projects/up-dev-code 2>&1 | head -20</automated>
</verify>
<done>Comando `up-tools.cjs init melhorias` retorna JSON valido com campos planning_exists, melhorias_dir, melhorias_exists, has_claude_md, has_package_json, date, timestamp, commit_docs, stack_hints. Funciona sem .plano/ existir (standalone).</done>
</task>

<task id="2" type="auto">
<files>up/commands/melhorias.md, commands/up/melhorias.md</files>
<action>
Criar o command file para /up:melhorias em dois locais (fonte canonica + copia raiz).

**Arquivo: `up/commands/melhorias.md`** (fonte canonica):

Frontmatter YAML:
```yaml
---
name: up:melhorias
description: Auditoria completa do codebase com sugestoes priorizadas (UX, performance, modernidade)
argument-hint: ""
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - AskUserQuestion
---
```

Corpo com tags XML seguindo padrao dos commands existentes:

```xml
<objective>
Run a full codebase audit with 3 parallel specialized agents (UX, Performance, Modernidade), synthesize findings into a single prioritized report.

Standalone: works without /up:novo-projeto. Creates .plano/melhorias/ automatically if not exists.
Detects project stack (React/Vue/Next/Tailwind/etc.) and adjusts analysis heuristics.

Output: .plano/melhorias/RELATORIO.md with suggestions organized in effort x impact matrix (4 quadrants).
</objective>

<execution_context>
@~/.claude/up/workflows/melhorias.md
@~/.claude/up/references/ui-brand.md
</execution_context>

<context>
$ARGUMENTS

**Standalone mode:** This command does NOT require /up:novo-projeto or .plano/ to exist.
It creates .plano/melhorias/ automatically and runs the full audit pipeline.

**If .plano/melhorias/ already exists:** Asks user if they want to overwrite previous audit or cancel.
</context>

<process>
Execute the melhorias workflow from @~/.claude/up/workflows/melhorias.md end-to-end.
Preserve all workflow gates (init, stack detection, agent spawn, synthesis, report presentation).
</process>
```

**Arquivo: `commands/up/melhorias.md`** (copia raiz):
Conteudo IDENTICO ao arquivo em `up/commands/melhorias.md`. Copiar byte-a-byte.

**Convencoes a seguir:**
- `name: up:melhorias` (prefixo up: com kebab-case) -- seguindo CONVENTIONS.md
- `allowed-tools` como array YAML (nao string separada por virgula -- isso e para agentes)
- Task incluido em allowed-tools (necessario para spawn de agentes auditores)
- AskUserQuestion incluido (necessario para confirmacao de sobrescrita)
- Objetivo em ingles (padrao dos commands existentes, ex: rapido.md, executar-fase.md)
- Sem `argument-hint` significativo (comando nao recebe argumentos obrigatorios)
</action>
<verify>
<automated>test -f /home/projects/up-dev-code/up/commands/melhorias.md && test -f /home/projects/up-dev-code/commands/up/melhorias.md && grep -c "name: up:melhorias" /home/projects/up-dev-code/up/commands/melhorias.md && diff /home/projects/up-dev-code/up/commands/melhorias.md /home/projects/up-dev-code/commands/up/melhorias.md && echo "PASS" || echo "FAIL"</automated>
</verify>
<done>Arquivo up/commands/melhorias.md existe com frontmatter valido (name: up:melhorias, allowed-tools com Task), referencia workflow melhorias.md no execution_context. Copia raiz commands/up/melhorias.md e identica a fonte canonica.</done>
</task>

<task id="3" type="auto">
<files>up/commands/ajuda.md</files>
<action>
Adicionar /up:melhorias na referencia de comandos em ajuda.md.

**1. Adicionar nova secao "Auditoria" na tabela de comandos, ANTES da secao "Utilitarios":**

```markdown
### Auditoria

| Comando | Descricao | Uso |
|---------|-----------|-----|
| `/up:melhorias` | Auditoria completa do codebase (UX, performance, modernidade) | `/up:melhorias` |
```

**2. Adicionar workflow de auditoria na secao "Fluxos de Trabalho Comuns", ANTES de "Correcao Rapida":**

```markdown
### Auditoria de Codebase
```
/up:melhorias   # Auditoria completa (standalone, nao requer /up:novo-projeto)
```
Resultado em .plano/melhorias/RELATORIO.md com sugestoes priorizadas.
```

**NAO alterar nenhum conteudo existente.** Apenas adicionar as novas linhas.
</action>
<verify>
<automated>grep -c "up:melhorias" /home/projects/up-dev-code/up/commands/ajuda.md</automated>
</verify>
<done>Comando /up:melhorias aparece na referencia de ajuda na secao Auditoria e nos fluxos de trabalho comuns.</done>
</task>

## Criterios de Sucesso

- [ ] `up-tools.cjs init melhorias` retorna JSON valido com stack_hints, planning_exists, melhorias_dir
- [ ] `up-tools.cjs init melhorias` funciona sem .plano/ existir (standalone)
- [ ] up/commands/melhorias.md existe com frontmatter correto e referencia ao workflow
- [ ] commands/up/melhorias.md e copia identica da fonte canonica
- [ ] /up:ajuda lista o novo comando /up:melhorias
