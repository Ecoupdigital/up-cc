---
phase: 05-agentes-auditores-dimensao
plan: 05-001
type: feature
autonomous: true
wave: 1
depends_on: []
requirements: [MELH-02, INFRA-03]
must_haves:
  truths:
    - "Agente de UX analisa CSS/SCSS, componentes e fluxos de navegacao produzindo sugestoes com sinais de problemas de usabilidade"
    - "Agente usa o template de sugestao padrao (arquivo, linha, problema, sugestao, esforco, impacto) com Dimensao = UX"
    - "Agente produz mapa de cobertura listando todo arquivo analisado com porcentagem de cobertura"
    - "Agente detecta stack do projeto antes de aplicar heuristicas (Tailwind vs Bootstrap vs CSS puro, React vs Vue vs Svelte)"
  artifacts:
    - path: "up/agents/up-auditor-ux.md"
      provides: "Definicao do agente auditor de UX com instrucoes de analise, formato de output e mapa de cobertura"
  key_links:
    - from: "up-auditor-ux.md"
      to: "up/references/audit-ux.md"
      via: "Agente le o reference via Read tool no step de carregamento de contexto"
    - from: "up-auditor-ux.md"
      to: "up/templates/suggestion.md"
      via: "Agente le o template para produzir sugestoes no formato padrao"
---

# Fase 5 Plano 1: Agente Auditor de UX

**Objetivo:** Criar o agente `up-auditor-ux` que analisa o codebase de um projeto buscando problemas de usabilidade detectaveis via analise estatica de codigo (CSS, componentes, fluxos de navegacao, formularios), produzindo sugestoes estruturadas no formato do template padrao e um mapa de cobertura de arquivos analisados.

## Contexto

@up/agents/up-executor.md -- Referencia de formato de agente UP (frontmatter YAML, XML tags semanticas, tools, color)
@up/agents/up-mapeador-codigo.md -- Referencia de agente que explora codebase inteiro (padrao de exploracao sistematica)
@up/references/audit-ux.md -- Reference de heuristicas UX que o agente DEVE carregar em runtime (66KB, stack_detection + 8 categorias)
@up/templates/suggestion.md -- Template de sugestao que o agente DEVE usar para formatar output (ID, arquivo, linha, dimensao, esforco, impacto)
@up/templates/report.md -- Template de relatorio com secao de cobertura (INFRA-03) que o agente deve alimentar

## Pesquisa de Dominio

Agentes UP seguem estas convencoes (pesquisado em up/agents/):
- **Frontmatter:** `name`, `description`, `tools` (string separada por virgulas), `color` (nome simples). Sem `model` (herda do chamador).
- **Corpo:** XML tags semanticas (`<role>`, `<process>`, `<step>`, `<critical_rules>`, etc.) com markdown como conteudo.
- **Tools disponiveis para auditor:** `Read, Bash, Grep, Glob` (precisa ler arquivos, buscar padroes, listar arquivos; NAO precisa Write/Edit pois nao modifica codigo).
- **Output do agente:** Retornado ao workflow chamador via stdout. O agente escreve o arquivo de sugestoes em `.plano/melhorias/ux-sugestoes.md` via Write.
- **References nao sao carregadas via @-reference no agente.** O agente usa a ferramenta `Read` para carregar `$HOME/.claude/up/references/audit-ux.md` e `$HOME/.claude/up/templates/suggestion.md` durante execucao.
- **Fonte canonica:** `up/agents/up-auditor-ux.md`. Copia em `agents/up-auditor-ux.md` para instalacao local.

## Tarefas

<task id="1" type="auto">
<files>up/agents/up-auditor-ux.md</files>
<files>agents/up-auditor-ux.md</files>
<action>
Criar o arquivo `up/agents/up-auditor-ux.md` (fonte canonica) e copiar para `agents/up-auditor-ux.md` (instalacao local).

**Frontmatter:**
```yaml
---
name: up-auditor-ux
description: Analisa codebase para problemas de UX/usabilidade detectaveis via codigo. Produz sugestoes estruturadas com mapa de cobertura.
tools: Read, Write, Bash, Grep, Glob
color: magenta
---
```
Nota: `Write` e necessario para salvar o arquivo de sugestoes em `.plano/melhorias/`.

**Estrutura do corpo do agente (XML tags semanticas, seguindo convencao UP):**

1. `<role>` -- Identidade: "Voce e um auditor de UX do sistema UP. Analisa codebases para problemas de usabilidade detectaveis via analise estatica de codigo." Mencionar que NAO tem acesso visual a interface, trabalha apenas com arquivos fonte. Incluir instrucao de leitura obrigatoria de `<files_to_read>`.

2. `<context_loading>` -- Step inicial obrigatorio:
   - Ler `$HOME/.claude/up/references/audit-ux.md` via Read tool (reference de heuristicas)
   - Ler `$HOME/.claude/up/templates/suggestion.md` via Read tool (formato de output)
   - Se existir `CLAUDE.md` na raiz do projeto, ler para contexto do projeto
   - Salvar mentalmente as categorias de heuristicas e o formato de sugestao

3. `<process>` com `<step>` tags para cada etapa:

   **Step 1: `stack_detection`** -- Detectar stack do projeto:
   - Executar deteccao de CSS framework (Tailwind/Bootstrap/CSS Modules/Styled Components/CSS puro) conforme secao `<stack_detection>` do reference audit-ux.md
   - Executar deteccao de component framework (React/Vue/Svelte/Next.js/vanilla HTML)
   - Executar deteccao de UI library (shadcn/Radix/MUI/Ant Design/Chakra/nenhuma)
   - Executar deteccao de form library (React Hook Form/Formik/Zod/VeeValidate/nenhuma)
   - Registrar stack detectado para ajustar heuristicas nas etapas seguintes

   **Step 2: `file_discovery`** -- Descobrir arquivos analisaveis:
   - Usar Glob para listar TODOS os arquivos do projeto (excluir node_modules, .git, dist, build, coverage, .plano)
   - Filtrar arquivos relevantes para UX: `*.css`, `*.scss`, `*.tsx`, `*.jsx`, `*.vue`, `*.svelte`, `*.html`, `*.ts` (componentes)
   - Contar total de arquivos no projeto e total de arquivos analisaveis
   - Armazenar lista completa para mapa de cobertura

   **Step 3: `systematic_analysis`** -- Para cada categoria do reference audit-ux.md, aplicar heuristicas:
   - Iterar pelas categorias: feedback-status, consistencia-visual, formularios, navegacao-fluxos, hierarquia-informacao, responsividade, prevencao-erros, acessibilidade-basica (as categorias que existem no reference)
   - Para cada heuristica na categoria, executar o sinal de deteccao (grep pattern ou heuristica de leitura) ajustado pela stack detectada
   - Para cada match encontrado, ler o arquivo/contexto para confirmar que e um problema real (evitar falsos positivos)
   - Criar sugestao no formato exato do template suggestion.md com:
     - ID sequencial: `UX-001`, `UX-002`, etc.
     - Dimensao: `UX`
     - Arquivo: caminho relativo
     - Linha: numero ou range
     - Problema: descricao concreta com evidencia do codigo
     - Sugestao: acao implementavel com exemplo de codigo quando possivel
     - Esforco: P/M/G
     - Impacto: P/M/G
     - Referencia: heuristica de Nielsen ou best practice que fundamenta
   - Registrar cada arquivo analisado no mapa de cobertura (mesmo que sem findings)

   **Step 4: `coverage_map`** -- Produzir mapa de cobertura (INFRA-03):
   - Listar TODOS os arquivos que foram analisados, agrupados por diretorio
   - Listar arquivos excluidos com razao (binario, node_modules, gerado, vendor)
   - Calcular porcentagem: (arquivos analisados / total de arquivos relevantes) * 100
   - Formato:
   ```markdown
   ## Mapa de Cobertura

   **Cobertura:** X de Y arquivos relevantes analisados (Z%)

   ### Arquivos Analisados
   [lista agrupada por diretorio]

   ### Arquivos Excluidos
   [lista com razao de exclusao]
   ```

   **Step 5: `write_output`** -- Salvar resultado:
   - Criar diretorio `.plano/melhorias/` se nao existir (`mkdir -p`)
   - Escrever arquivo `.plano/melhorias/ux-sugestoes.md` contendo:
     - Header com metadata (stack detectada, data, total de sugestoes)
     - Todas as sugestoes ordenadas por impacto decrescente
     - Mapa de cobertura ao final
   - Retornar resumo estruturado ao workflow chamador

4. `<output_format>` -- Formato de retorno ao workflow:
   ```markdown
   ## AUDITORIA UX COMPLETA

   **Stack:** [stack detectada]
   **Sugestoes:** [N total] (Quick Wins: X, Estrategicos: Y, Preenchimentos: Z, Evitar: W)
   **Cobertura:** [X de Y arquivos = Z%]
   **Arquivo:** .plano/melhorias/ux-sugestoes.md
   ```

5. `<critical_rules>` -- Regras inviolaveis:
   - NUNCA produzir sugestao sem arquivo concreto (anti-padrao #1 do template)
   - NUNCA produzir sugestao com problema vago (anti-padrao #2)
   - NUNCA produzir sugestao com acao vaga "considerar melhorar" (anti-padrao #3)
   - Se Esforco=G, justificativa DEVE aparecer no campo Sugestao
   - Mapa de cobertura e OBRIGATORIO (INFRA-03) -- nunca omitir
   - Se nenhum problema encontrado em uma categoria, registrar "Nenhum problema detectado" (nao omitir categoria)
   - Ordenar sugestoes por impacto decrescente dentro do output
   - Maximo 1 sugestao por bloco, nunca agrupar problemas distintos
   - Se mesmo padrao em N arquivos, criar 1 sugestao para o mais representativo e notar "Afeta tambem: ..."

**Tamanho alvo do agente:** 350-450 linhas (consistente com agentes UP existentes: executor ~410, planejador ~390, roteirista ~400).

**Idioma:** Todo texto de interface em portugues brasileiro. Nomes de funcoes/variaveis nos exemplos em ingles. Tags XML em ingles (seguindo convencao UP).
</action>
<verify>
<automated>
# Verificar existencia e estrutura do agente
FILE_SRC="up/agents/up-auditor-ux.md"
FILE_COPY="agents/up-auditor-ux.md"
test -f "$FILE_SRC" && \
test -f "$FILE_COPY" && \
grep -q "^name: up-auditor-ux" "$FILE_SRC" && \
grep -q "^tools:" "$FILE_SRC" && \
grep -q "<role>" "$FILE_SRC" && \
grep -q "<process>" "$FILE_SRC" && \
grep -q "stack_detection" "$FILE_SRC" && \
grep -q "coverage" "$FILE_SRC" && \
grep -q "suggestion.md" "$FILE_SRC" && \
grep -q "audit-ux.md" "$FILE_SRC" && \
grep -q "UX-" "$FILE_SRC" && \
grep -q "melhorias" "$FILE_SRC" && \
diff "$FILE_SRC" "$FILE_COPY" > /dev/null && \
echo "PASS: up-auditor-ux.md validado" || echo "FAIL: estrutura incompleta ou copia divergente"
</automated>
</verify>
<done>
- Arquivo `up/agents/up-auditor-ux.md` existe com frontmatter valido (name, description, tools, color)
- Copia identica em `agents/up-auditor-ux.md`
- Agente contem instrucoes para carregar reference audit-ux.md e template suggestion.md via Read
- Agente contem step de deteccao de stack (CSS framework, component framework, UI library, form library)
- Agente contem step de analise sistematica por categoria de heuristica UX
- Agente contem step de mapa de cobertura (INFRA-03) com contagem de arquivos e porcentagem
- Agente produz sugestoes no formato exato do template (ID UX-NNN, arquivo, linha, dimensao, esforco, impacto)
- Agente escreve output em `.plano/melhorias/ux-sugestoes.md`
- Tamanho entre 350-450 linhas, texto em PT-BR, tags XML em ingles
</done>
</task>

## Criterios de Sucesso

- [ ] Agente `up-auditor-ux` existe em `up/agents/` e `agents/` com conteudo identico
- [ ] Agente carrega reference `audit-ux.md` e template `suggestion.md` via Read tool
- [ ] Agente detecta stack do projeto antes de aplicar heuristicas
- [ ] Agente analisa sistematicamente todas as categorias de heuristicas UX
- [ ] Sugestoes usam formato exato do template (UX-NNN, arquivo, linha, problema, sugestao, esforco, impacto)
- [ ] Mapa de cobertura presente com lista de arquivos analisados e porcentagem (INFRA-03)
- [ ] Formato segue convencoes de agentes UP (frontmatter, XML tags, PT-BR)
