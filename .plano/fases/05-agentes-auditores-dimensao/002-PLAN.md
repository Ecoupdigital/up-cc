---
phase: 05-agentes-auditores-dimensao
plan: 05-002
type: feature
autonomous: true
wave: 1
depends_on: []
requirements: [MELH-03, INFRA-03]
must_haves:
  truths:
    - "Agente de performance identifica anti-padroes de performance no codigo com estimativa de impacto"
    - "Agente detecta re-renders, deps pesadas, ausencia de lazy loading, queries ineficientes"
    - "Agente usa o template de sugestao padrao com Dimensao = Performance"
    - "Agente produz mapa de cobertura listando todo arquivo analisado com porcentagem de cobertura"
  artifacts:
    - path: "up/agents/up-auditor-performance.md"
      provides: "Definicao do agente auditor de performance com instrucoes de analise, formato de output e mapa de cobertura"
  key_links:
    - from: "up-auditor-performance.md"
      to: "up/references/audit-performance.md"
      via: "Agente le o reference via Read tool no step de carregamento de contexto"
    - from: "up-auditor-performance.md"
      to: "up/templates/suggestion.md"
      via: "Agente le o template para produzir sugestoes no formato padrao"
---

# Fase 5 Plano 2: Agente Auditor de Performance

**Objetivo:** Criar o agente `up-auditor-performance` que analisa o codebase de um projeto buscando anti-padroes de performance detectaveis via analise estatica (re-renders, bundle size, queries ineficientes, assets nao-otimizados, CSS pesado, problemas de rede, configs de producao, dependencias pesadas), produzindo sugestoes estruturadas e mapa de cobertura.

## Contexto

@up/agents/up-executor.md -- Referencia de formato de agente UP (frontmatter YAML, XML tags semanticas, tools, color)
@up/agents/up-mapeador-codigo.md -- Referencia de agente que explora codebase inteiro (padrao de exploracao sistematica)
@up/references/audit-performance.md -- Reference de anti-padroes de performance que o agente DEVE carregar em runtime (8 categorias: re-renders, bundle, queries, assets, css, network, configs, deps)
@up/templates/suggestion.md -- Template de sugestao que o agente DEVE usar para formatar output
@up/templates/report.md -- Template de relatorio com secao de cobertura (INFRA-03)

## Pesquisa de Dominio

Mesmas convencoes de agentes UP documentadas no Plano 001. Adicionalmente:
- O reference `audit-performance.md` tem ~480 linhas com 8 categorias e ~35 anti-padroes, cada um com sinal de deteccao via bash/grep.
- O agente de performance tem acesso a package.json para analisar dependencias pesadas e executar `npm audit` para vulnerabilidades.
- Diferencial do agente de performance vs modernidade: performance foca em IMPACTO RUNTIME (velocidade, memoria, network), modernidade foca em ESTADO DO CODIGO (desatualizado, obsoleto, alternativas melhores).

## Tarefas

<task id="1" type="auto">
<files>up/agents/up-auditor-performance.md</files>
<files>agents/up-auditor-performance.md</files>
<action>
Criar o arquivo `up/agents/up-auditor-performance.md` (fonte canonica) e copiar para `agents/up-auditor-performance.md` (instalacao local).

**Frontmatter:**
```yaml
---
name: up-auditor-performance
description: Analisa codebase para anti-padroes de performance detectaveis via codigo. Produz sugestoes estruturadas com estimativa de impacto e mapa de cobertura.
tools: Read, Write, Bash, Grep, Glob
color: red
---
```

**Estrutura do corpo do agente (XML tags semanticas, seguindo convencao UP):**

1. `<role>` -- Identidade: "Voce e um auditor de performance do sistema UP. Analisa codebases para anti-padroes de performance detectaveis via analise estatica de codigo." Especificar que trabalha com analise de codigo fonte (nao benchmark, nao profiling, nao Lighthouse). Incluir instrucao de leitura obrigatoria de `<files_to_read>`.

2. `<context_loading>` -- Step inicial obrigatorio:
   - Ler `$HOME/.claude/up/references/audit-performance.md` via Read tool
   - Ler `$HOME/.claude/up/templates/suggestion.md` via Read tool
   - Se existir `CLAUDE.md` na raiz, ler para contexto do projeto
   - Memorizar as 8 categorias de anti-padroes e o formato de sugestao

3. `<process>` com `<step>` tags:

   **Step 1: `stack_detection`** -- Detectar stack conforme secao `<stack_detection>` do reference:
   - Detectar framework frontend (React/Vue/Svelte) via package.json
   - Detectar meta-framework (Next.js/Nuxt/SvelteKit) via package.json
   - Detectar CSS framework (Tailwind/Bootstrap) para ajustar categoria css
   - Detectar ORM (Prisma/Drizzle/Sequelize/TypeORM) para ajustar categoria queries
   - Registrar quais categorias de anti-padrao sao relevantes para a stack detectada

   **Step 2: `file_discovery`** -- Descobrir arquivos analisaveis:
   - Usar Glob para listar todos os arquivos (excluir node_modules, .git, dist, build, coverage, .plano)
   - Filtrar: `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.vue`, `*.svelte`, `*.css`, `*.scss`, `*.html`, `package.json`, configs de build (`webpack.config.*`, `vite.config.*`, `next.config.*`, `tsconfig.json`)
   - Incluir `prisma/schema.prisma` se existir
   - Contar total e armazenar lista para cobertura

   **Step 3: `systematic_analysis`** -- Para cada categoria do reference, aplicar anti-padroes:
   - Iterar pelas 8 categorias: re-renders, bundle, queries, assets, css, network, configs, deps
   - Pular categorias irrelevantes para a stack (ex: pular re-renders se nao e React/Vue; pular queries se nao ha ORM/backend)
   - Para cada anti-padrao na categoria:
     - Executar o sinal de deteccao exato do reference (grep patterns, scripts bash)
     - Para cada match, ler contexto do arquivo (5-10 linhas ao redor) para confirmar problema real
     - Descartar falsos positivos (ex: match em arquivo de teste, comentario, codigo morto)
     - Criar sugestao no formato do template:
       - ID: `PERF-001`, `PERF-002`, etc.
       - Dimensao: `Performance` (com tag secundaria se impacta UX: `Performance (UX)`)
       - Impacto: usar o valor do campo "Impacto" do reference (P/M/G) ajustado pelo contexto real
       - Incluir exemplo de codigo ruim do codebase real (nao do reference)
       - Incluir solucao concreta do reference adaptada ao codigo do projeto
   - Para categoria `deps`: executar script de deteccao de dependencias pesadas do reference; se projeto tem package.json, executar `npm audit` para vulnerabilidades (com timeout de 30s)
   - Registrar cada arquivo no mapa de cobertura

   **Step 4: `coverage_map`** -- Produzir mapa de cobertura (INFRA-03):
   - Mesmo formato do agente UX:
   ```markdown
   ## Mapa de Cobertura

   **Cobertura:** X de Y arquivos relevantes analisados (Z%)

   ### Arquivos Analisados
   [lista agrupada por diretorio]

   ### Arquivos Excluidos
   [lista com razao]
   ```

   **Step 5: `write_output`** -- Salvar resultado:
   - Criar `.plano/melhorias/` se nao existir
   - Escrever `.plano/melhorias/performance-sugestoes.md` com:
     - Header (stack, data, total de sugestoes por categoria)
     - Sugestoes ordenadas por impacto decrescente
     - Mapa de cobertura ao final
   - Retornar resumo ao workflow chamador

4. `<output_format>` -- Formato de retorno:
   ```markdown
   ## AUDITORIA PERFORMANCE COMPLETA

   **Stack:** [stack detectada]
   **Sugestoes:** [N total] (Quick Wins: X, Estrategicos: Y, Preenchimentos: Z, Evitar: W)
   **Cobertura:** [X de Y arquivos = Z%]
   **Arquivo:** .plano/melhorias/performance-sugestoes.md

   ### Resumo por Categoria
   | Categoria | Findings |
   |-----------|----------|
   | Re-renders | N |
   | Bundle | N |
   | Queries | N |
   | Assets | N |
   | CSS | N |
   | Network | N |
   | Configs | N |
   | Deps | N |
   ```

5. `<critical_rules>` -- Regras inviolaveis:
   - NUNCA produzir sugestao sem arquivo concreto
   - NUNCA produzir sugestao com problema ou acao vagos
   - Se Esforco=G, justificativa obrigatoria
   - Mapa de cobertura OBRIGATORIO (INFRA-03)
   - Distinguir entre problemas de performance (este agente) e problemas de modernidade (agente de modernidade): se o problema e "dependencia X e pesada E desatualizada", criar sugestao de performance focando no tamanho/alternativa leve; o agente de modernidade cobrira o aspecto de desatualizacao
   - NUNCA executar `npm install` ou modificar dependencias do projeto
   - Timeout de 30 segundos para `npm audit` (se demorar mais, pular e notar)
   - Maximo 1 sugestao por bloco; se mesmo padrao em N arquivos, agrupar com "Afeta tambem: ..."
   - Ordenar sugestoes por impacto decrescente

**Tamanho alvo:** 350-450 linhas.
**Idioma:** PT-BR para interface, ingles para tags XML e exemplos de codigo.
</action>
<verify>
<automated>
# Verificar existencia e estrutura do agente
FILE_SRC="up/agents/up-auditor-performance.md"
FILE_COPY="agents/up-auditor-performance.md"
test -f "$FILE_SRC" && \
test -f "$FILE_COPY" && \
grep -q "^name: up-auditor-performance" "$FILE_SRC" && \
grep -q "^tools:" "$FILE_SRC" && \
grep -q "<role>" "$FILE_SRC" && \
grep -q "<process>" "$FILE_SRC" && \
grep -q "stack_detection" "$FILE_SRC" && \
grep -q "coverage" "$FILE_SRC" && \
grep -q "suggestion.md" "$FILE_SRC" && \
grep -q "audit-performance.md" "$FILE_SRC" && \
grep -q "PERF-" "$FILE_SRC" && \
grep -q "melhorias" "$FILE_SRC" && \
grep -q "re-renders\|bundle\|queries" "$FILE_SRC" && \
diff "$FILE_SRC" "$FILE_COPY" > /dev/null && \
echo "PASS: up-auditor-performance.md validado" || echo "FAIL: estrutura incompleta ou copia divergente"
</automated>
</verify>
<done>
- Arquivo `up/agents/up-auditor-performance.md` existe com frontmatter valido (name, description, tools, color)
- Copia identica em `agents/up-auditor-performance.md`
- Agente carrega reference audit-performance.md e template suggestion.md via Read
- Agente detecta stack do projeto (frontend framework, meta-framework, CSS framework, ORM)
- Agente analisa sistematicamente as 8 categorias: re-renders, bundle, queries, assets, css, network, configs, deps
- Agente pula categorias irrelevantes para a stack detectada
- Sugestoes no formato exato do template (PERF-NNN, arquivo, linha, problema, sugestao, esforco, impacto)
- Mapa de cobertura presente com lista e porcentagem (INFRA-03)
- Output salvo em `.plano/melhorias/performance-sugestoes.md`
- Tamanho 350-450 linhas, PT-BR, tags XML em ingles
</done>
</task>

## Criterios de Sucesso

- [ ] Agente `up-auditor-performance` existe em `up/agents/` e `agents/` com conteudo identico
- [ ] Agente carrega reference `audit-performance.md` e template `suggestion.md` via Read tool
- [ ] Agente detecta stack e ajusta categorias de anti-padrao relevantes
- [ ] Agente analisa 8 categorias de anti-padroes de performance sistematicamente
- [ ] Sugestoes usam formato do template com IDs PERF-NNN e estimativa de impacto
- [ ] Mapa de cobertura presente com lista de arquivos e porcentagem (INFRA-03)
- [ ] Formato segue convencoes de agentes UP (frontmatter, XML tags, PT-BR)
