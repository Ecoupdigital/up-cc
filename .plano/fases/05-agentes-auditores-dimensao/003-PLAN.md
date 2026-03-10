---
phase: 05-agentes-auditores-dimensao
plan: 05-003
type: feature
autonomous: true
wave: 1
depends_on: []
requirements: [MELH-04, INFRA-03]
must_haves:
  truths:
    - "Agente de modernidade detecta dependencias desatualizadas, padroes obsoletos e sugere alternativas modernas"
    - "Cada padrao detectado tem nivel de urgencia (critico/medio/baixo) mapeado para impacto G/M/P"
    - "Agente usa o template de sugestao padrao com Dimensao = Modernidade"
    - "Agente produz mapa de cobertura listando todo arquivo analisado com porcentagem de cobertura"
  artifacts:
    - path: "up/agents/up-auditor-modernidade.md"
      provides: "Definicao do agente auditor de modernidade com instrucoes de analise, formato de output e mapa de cobertura"
  key_links:
    - from: "up-auditor-modernidade.md"
      to: "up/references/audit-modernidade.md"
      via: "Agente le o reference via Read tool no step de carregamento de contexto"
    - from: "up-auditor-modernidade.md"
      to: "up/templates/suggestion.md"
      via: "Agente le o template para produzir sugestoes no formato padrao"
---

# Fase 5 Plano 3: Agente Auditor de Modernidade

**Objetivo:** Criar o agente `up-auditor-modernidade` que analisa o codebase de um projeto buscando padroes obsoletos, dependencias desatualizadas e oportunidades de modernizacao, produzindo sugestoes estruturadas com nivel de urgencia e mapa de cobertura.

## Contexto

@up/agents/up-executor.md -- Referencia de formato de agente UP (frontmatter YAML, XML tags semanticas, tools, color)
@up/agents/up-mapeador-codigo.md -- Referencia de agente que explora codebase inteiro (padrao de exploracao sistematica)
@up/references/audit-modernidade.md -- Reference de padroes obsoletos que o agente DEVE carregar em runtime (~59KB, stack_detection + categorias: runtime, framework, estado, estilos, build, http, dependencias, padroes-codigo, config, testes)
@up/templates/suggestion.md -- Template de sugestao que o agente DEVE usar para formatar output
@up/templates/report.md -- Template de relatorio com secao de cobertura (INFRA-03)

## Pesquisa de Dominio

Mesmas convencoes de agentes UP documentadas nos planos anteriores. Adicionalmente:
- O reference `audit-modernidade.md` e o maior (~59KB) com categorias extensivas de padroes obsoletos.
- O agente de modernidade foca em ESTADO DO CODIGO (desatualizado, obsoleto, alternativas), diferente de performance (impacto runtime).
- Urgencia do reference mapeia direto: Critico -> Impacto G, Medio -> Impacto M, Baixo -> Impacto P.
- O reference e muito grande (~59KB). O agente NAO deve tentar carregar todo de uma vez se exceder limite. Estrategia: carregar reference, usar as secoes de stack_detection para filtrar quais categorias aplicam, e focar nessas.
- Diferencial critico: quando um finding e tanto modernidade quanto performance (ex: jQuery e pesado E obsoleto), o agente de modernidade foca no aspecto "existe alternativa moderna" e referencia que o agente de performance pode cobrir o aspecto de peso. Nao duplicar sugestoes -- se o mesmo finding aparece em ambos, o agente de modernidade cria a sugestao com tag `Modernidade (Performance)`.

## Tarefas

<task id="1" type="auto">
<files>up/agents/up-auditor-modernidade.md</files>
<files>agents/up-auditor-modernidade.md</files>
<action>
Criar o arquivo `up/agents/up-auditor-modernidade.md` (fonte canonica) e copiar para `agents/up-auditor-modernidade.md` (instalacao local).

**Frontmatter:**
```yaml
---
name: up-auditor-modernidade
description: Analisa codebase para padroes obsoletos, dependencias desatualizadas e oportunidades de modernizacao. Produz sugestoes com nivel de urgencia e mapa de cobertura.
tools: Read, Write, Bash, Grep, Glob
color: blue
---
```

**Estrutura do corpo do agente (XML tags semanticas, seguindo convencao UP):**

1. `<role>` -- Identidade: "Voce e um auditor de modernidade do sistema UP. Analisa codebases para padroes obsoletos, dependencias desatualizadas e oportunidades de modernizacao." Enfatizar que o foco e ATUALIDADE do codigo (nao velocidade/performance). Incluir instrucao de leitura obrigatoria de `<files_to_read>`.

2. `<context_loading>` -- Step inicial obrigatorio:
   - Ler `$HOME/.claude/up/references/audit-modernidade.md` via Read tool
   - NOTA: O reference e grande (~59KB). Instruir o agente a ler e processar por secoes se necessario, focando nas categorias relevantes ao stack detectado.
   - Ler `$HOME/.claude/up/templates/suggestion.md` via Read tool
   - Se existir `CLAUDE.md` na raiz, ler para contexto
   - Memorizar categorias e niveis de urgencia

3. `<process>` com `<step>` tags:

   **Step 1: `stack_detection`** -- Detectar stack conforme secao `<stack_detection>` do reference:
   - Detectar versao do Node.js (via `engines` em package.json, `.nvmrc`, `.node-version`)
   - Detectar TypeScript vs JavaScript (tsconfig.json, extensoes de arquivo)
   - Detectar framework e versao (React/Vue/Angular/Svelte com versao exata)
   - Detectar meta-framework (Next.js/Nuxt com versao para identificar padroes de versao antiga)
   - Detectar sistema de modulos (ESM vs CommonJS -- `"type": "module"`, extensoes)
   - Detectar build tools (webpack/Vite/Parcel/esbuild -- configs, devDependencies)
   - Detectar CSS approach (Tailwind/Bootstrap/CSS-in-JS/CSS puro)
   - Detectar ORM e test runner se presentes
   - Registrar quais categorias do reference sao relevantes baseado no stack

   **Step 2: `file_discovery`** -- Descobrir arquivos analisaveis:
   - Usar Glob para listar todos os arquivos (excluir node_modules, .git, dist, build, coverage, .plano)
   - Incluir: `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.mjs`, `*.cjs`, `*.vue`, `*.svelte`, `*.css`, `*.scss`, `*.html`, `package.json`, `package-lock.json`, configs de build/lint/test, `tsconfig.json`, `.babelrc`, `.eslintrc.*`, `jest.config.*`, `vitest.config.*`
   - Contar total e armazenar lista para cobertura

   **Step 3: `systematic_analysis`** -- Para cada categoria relevante do reference:
   - Categorias do reference (verificar quais existem no documento carregado, tipicamente):
     - **runtime**: Versao do Node.js, APIs obsoletas do Node
     - **framework**: Padroes de versao antiga do framework (class components, Options API, getInitialProps, etc.)
     - **estado**: Gerenciamento de estado obsoleto (Redux boilerplate, mixins Vue)
     - **estilos**: CSS-in-JS obsoleto, padroes CSS antigos, pre-processadores vs alternativas modernas
     - **build**: Webpack 4, Babel sem necessidade, configs desatualizadas
     - **http**: Axios quando fetch nativo disponivel, callbacks vs async/await, XMLHttpRequest
     - **dependencias**: Libs deprecadas, abandonadas, com alternativas modernas
     - **padroes-codigo**: CommonJS em projetos ESM, var vs let/const, Promise chains vs async/await
     - **config**: tsconfig desatualizado, browserslist antigo
     - **testes**: Frameworks de teste obsoletos, padroes antigos
   - Para cada padrao na categoria relevante:
     - Executar sinal de deteccao do reference (grep, bash scripts, leitura de package.json)
     - Confirmar match lendo contexto do arquivo
     - Descartar falsos positivos (contexto documenta cenarios de falso positivo)
     - Criar sugestao com:
       - ID: `MOD-001`, `MOD-002`, etc.
       - Dimensao: `Modernidade` (com tag secundaria se impacta outra: `Modernidade (Performance)`)
       - Impacto: mapeado da urgencia do reference (Critico->G, Medio->M, Baixo->P)
       - Esforco: estimado pelo agente baseado na complexidade da migracao
       - Incluir alternativa moderna concreta (nao apenas "atualize")
       - Incluir exemplo de migracao do padrao obsoleto para o moderno
   - Para dependencias: analisar `package.json` e `package-lock.json`; verificar datas de ultimo publish via `npm view <pkg> time.modified` (com timeout de 5s por pacote, maximo 20 pacotes verificados); listar deps com alternativas modernas do reference
   - Registrar cada arquivo no mapa de cobertura

   **Step 4: `coverage_map`** -- Produzir mapa de cobertura (INFRA-03):
   - Mesmo formato dos outros agentes auditores:
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
   - Escrever `.plano/melhorias/modernidade-sugestoes.md` com:
     - Header (stack detectada, versoes identificadas, data, total de sugestoes)
     - Sugestoes agrupadas por urgencia (Critico primeiro, depois Medio, depois Baixo)
     - Dentro de cada grupo, ordenar por esforco crescente (quick wins primeiro)
     - Mapa de cobertura ao final
   - Retornar resumo ao workflow chamador

4. `<output_format>` -- Formato de retorno:
   ```markdown
   ## AUDITORIA MODERNIDADE COMPLETA

   **Stack:** [stack detectada com versoes]
   **Sugestoes:** [N total] (Criticos: X, Medios: Y, Baixos: Z)
   **Cobertura:** [X de Y arquivos = Z%]
   **Arquivo:** .plano/melhorias/modernidade-sugestoes.md

   ### Resumo por Urgencia
   | Urgencia | Findings | Exemplos |
   |----------|----------|----------|
   | Critico | N | [top 2 findings] |
   | Medio | N | [top 2 findings] |
   | Baixo | N | [top 2 findings] |
   ```

5. `<critical_rules>` -- Regras inviolaveis:
   - NUNCA produzir sugestao sem arquivo concreto
   - NUNCA produzir sugestao com acao vaga ("considerar atualizar")
   - Toda sugestao de modernidade DEVE incluir a alternativa moderna concreta com exemplo de migracao
   - Se Esforco=G, justificativa obrigatoria (ex: "migrar de Webpack 4 para Vite requer reescrever 8 configs e adaptar 3 plugins custom")
   - Mapa de cobertura OBRIGATORIO (INFRA-03)
   - Distinguir entre modernidade (este agente) e performance (agente de performance): se finding e "jQuery e pesado E obsoleto", este agente foca no aspecto "jQuery e obsoleto, DOM nativo e o padrao moderno" com tag `Modernidade (Performance)`
   - NUNCA executar `npm install`, `npm update` ou modificar dependencias
   - Timeout de 5s por pacote ao verificar datas de publish (maximo 20 pacotes)
   - Nao sugerir migracao de framework inteiro (ex: "migrar de React para Svelte") -- fora do escopo
   - Focar em migracoes DENTRO do ecossistema existente (ex: class components -> hooks, Options API -> Composition API)
   - Maximo 1 sugestao por bloco; se mesmo padrao em N arquivos, agrupar com "Afeta tambem: ..."

**Tamanho alvo:** 350-450 linhas.
**Idioma:** PT-BR para interface, ingles para tags XML e exemplos de codigo.
</action>
<verify>
<automated>
# Verificar existencia e estrutura do agente
FILE_SRC="up/agents/up-auditor-modernidade.md"
FILE_COPY="agents/up-auditor-modernidade.md"
test -f "$FILE_SRC" && \
test -f "$FILE_COPY" && \
grep -q "^name: up-auditor-modernidade" "$FILE_SRC" && \
grep -q "^tools:" "$FILE_SRC" && \
grep -q "<role>" "$FILE_SRC" && \
grep -q "<process>" "$FILE_SRC" && \
grep -q "stack_detection" "$FILE_SRC" && \
grep -q "coverage" "$FILE_SRC" && \
grep -q "suggestion.md" "$FILE_SRC" && \
grep -q "audit-modernidade.md" "$FILE_SRC" && \
grep -q "MOD-" "$FILE_SRC" && \
grep -q "melhorias" "$FILE_SRC" && \
grep -q "urgencia\|Critico\|critico" "$FILE_SRC" && \
diff "$FILE_SRC" "$FILE_COPY" > /dev/null && \
echo "PASS: up-auditor-modernidade.md validado" || echo "FAIL: estrutura incompleta ou copia divergente"
</automated>
</verify>
<done>
- Arquivo `up/agents/up-auditor-modernidade.md` existe com frontmatter valido (name, description, tools, color)
- Copia identica em `agents/up-auditor-modernidade.md`
- Agente carrega reference audit-modernidade.md e template suggestion.md via Read
- Agente detecta stack completa com versoes (Node.js, framework, build tools, modulos, CSS, ORM)
- Agente analisa categorias relevantes ao stack: runtime, framework, estado, estilos, build, http, dependencias, padroes-codigo, config, testes
- Cada padrao tem nivel de urgencia (Critico/Medio/Baixo) mapeado para impacto (G/M/P)
- Sugestoes incluem alternativa moderna concreta com exemplo de migracao
- Mapa de cobertura presente com lista e porcentagem (INFRA-03)
- Output salvo em `.plano/melhorias/modernidade-sugestoes.md`
- Tamanho 350-450 linhas, PT-BR, tags XML em ingles
</done>
</task>

## Criterios de Sucesso

- [ ] Agente `up-auditor-modernidade` existe em `up/agents/` e `agents/` com conteudo identico
- [ ] Agente carrega reference `audit-modernidade.md` e template `suggestion.md` via Read tool
- [ ] Agente detecta stack completa com versoes para ajustar categorias relevantes
- [ ] Agente analisa padroes obsoletos com nivel de urgencia (Critico/Medio/Baixo)
- [ ] Sugestoes incluem alternativa moderna concreta e exemplo de migracao
- [ ] Sugestoes usam formato do template com IDs MOD-NNN e urgencia mapeada para impacto
- [ ] Mapa de cobertura presente com lista de arquivos e porcentagem (INFRA-03)
- [ ] Formato segue convencoes de agentes UP (frontmatter, XML tags, PT-BR)
