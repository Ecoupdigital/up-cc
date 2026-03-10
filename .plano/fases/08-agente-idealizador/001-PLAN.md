---
phase: 08-agente-idealizador
plan: 08-001
type: feature
autonomous: true
wave: 1
depends_on: []
requirements: [IDEIA-02, IDEIA-03]
must_haves:
  truths:
    - "Agente up-analista-codigo analisa features existentes do projeto e identifica gaps funcionais (o que o projeto faz vs o que poderia fazer)"
    - "Agente up-pesquisador-mercado busca concorrentes e tendencias relevantes via WebSearch/WebFetch e apresenta comparativo"
    - "Agente analista produz sugestoes no formato padrao suggestion.md com Dimensao=Ideias e IDs IDEA-NNN"
    - "Agente pesquisador produz sugestoes no formato padrao suggestion.md com Dimensao=Ideias e IDs IDEA-NNN"
    - "Ambos agentes salvam output em .plano/ideias/ (analista: codigo-sugestoes.md, pesquisador: mercado-sugestoes.md)"
  artifacts:
    - path: "up/agents/up-analista-codigo.md"
      provides: "Agente que mapeia features existentes, identifica gaps funcionais e sugere features novas baseadas em analise de codigo"
    - path: "agents/up-analista-codigo.md"
      provides: "Copia local do agente para instalacao"
    - path: "up/agents/up-pesquisador-mercado.md"
      provides: "Agente que pesquisa concorrentes e tendencias de mercado via web search para sugerir features"
    - path: "agents/up-pesquisador-mercado.md"
      provides: "Copia local do agente para instalacao"
  key_links:
    - from: "up-analista-codigo.md"
      to: "up/templates/suggestion.md"
      via: "Read tool carrega template para produzir sugestoes no formato padrao"
    - from: "up-pesquisador-mercado.md"
      to: "up/templates/suggestion.md"
      via: "Read tool carrega template para produzir sugestoes no formato padrao"
    - from: "up-pesquisador-mercado.md"
      to: "WebSearch/WebFetch"
      via: "Tools de pesquisa web para buscar concorrentes e tendencias"
---

# Fase 8 Plano 1: Agentes Analista de Codigo e Pesquisador de Mercado

**Objetivo:** Criar os 2 agentes independentes que alimentam o comando /up:ideias -- um analisa o codebase para identificar gaps funcionais e sugerir features novas, o outro pesquisa concorrentes e tendencias de mercado para sugerir features baseadas no ecossistema competitivo.

## Contexto

@up/agents/up-auditor-ux.md -- Referencia de formato de agente UP (frontmatter, XML tags, process com steps, critical_rules, output_format)
@up/agents/up-auditor-performance.md -- Referencia de agente que explora codebase com deteccao de stack
@up/agents/up-pesquisador-projeto.md -- Referencia de agente que usa WebSearch/WebFetch para pesquisa
@up/templates/suggestion.md -- Template de sugestao que ambos agentes DEVEM usar (Dimensao=Ideias, IDs IDEA-NNN)
@up/templates/report.md -- Template de relatorio (referencia para formato de output consolidado)

## Pesquisa de Dominio

**Padrao de agentes UP (pesquisado em up/agents/):**
- **Frontmatter:** `name`, `description`, `tools` (string separada por virgulas), `color` (nome simples). Sem `model` (herda do chamador).
- **Corpo:** XML tags semanticas (`<role>`, `<context_loading>`, `<process>`, `<step>`, `<output_format>`, `<critical_rules>`, `<success_criteria>`) com markdown como conteudo.
- **Carregamento de contexto:** Step inicial obrigatorio que le references e templates via Read tool.
- **Fonte canonica:** `up/agents/up-*.md`. Copia em `agents/up-*.md` para instalacao local.

**Padrao de auditores (Fase 5) vs idealizadores (Fase 8):**
- Auditores analisam codigo EXISTENTE buscando PROBLEMAS (sugestoes de melhoria).
- Idealizadores analisam codigo EXISTENTE buscando OPORTUNIDADES (sugestoes de features novas).
- Formato de sugestao identico (suggestion.md), mas com Dimensao=Ideias e foco diferente:
  - Problema -> "Oportunidade" ou "Gap funcional" (o que FALTA, nao o que esta errado)
  - Sugestao -> Feature proposta (o que PODERIA existir)
  - Arquivo -> Ponto de extensao no codigo (onde a feature se encaixaria) ou N/A para features estruturais

**Resolucao do TODO do STATE.md (2 vs 3 agentes):**
Decisao: **2 agentes + 1 consolidador** (plano 002). Razoes:
1. ICE scoring requer cruzar analise de codigo com pesquisa de mercado -- melhor feito no consolidador
2. Anti-features requerem perspectiva de ambos agentes -- melhor feito no consolidador
3. Espelha o padrao provado de melhorias (3 auditores paralelos -> 1 sintetizador sequencial)
4. 2 agentes mantem custo de contexto razoavel (cada agente tem 200k tokens frescos)

**Agente pesquisador de mercado -- tools necessarias:**
- `Read, Write, Bash, Grep, Glob` -- padrao para explorar codebase
- `WebSearch, WebFetch` -- ESSENCIAIS para pesquisa de concorrentes e tendencias
- NAO precisa de `mcp__context7__*` (nao consulta docs de bibliotecas, consulta mercado/concorrentes)

**Semantica do campo "Linha" para ideias:**
Para sugestoes de features novas, o campo Linha do template suggestion.md tera frequentemente `N/A` (features novas sao estruturais por natureza). Quando existir ponto de extensao claro no codigo, indicar a linha. Exemplo: "Inserir handler de webhook apos linha 145 de routes.ts".

## Tarefas

<task id="1" type="auto">
<files>up/agents/up-analista-codigo.md</files>
<files>agents/up-analista-codigo.md</files>
<action>
Criar o arquivo `up/agents/up-analista-codigo.md` (fonte canonica) e copiar identico para `agents/up-analista-codigo.md` (instalacao local).

**Frontmatter:**
```yaml
---
name: up-analista-codigo
description: Analisa codebase para identificar gaps funcionais e oportunidades de features novas. Produz sugestoes estruturadas.
tools: Read, Write, Bash, Grep, Glob
color: cyan
---
```
- Tools: Read/Grep/Glob para explorar codebase, Write para salvar output, Bash para comandos de exploracao.
- NAO precisa de WebSearch/WebFetch (analise e local, codigo apenas).
- Color `cyan` para distinguir dos auditores (magenta, orange, teal) e do pesquisador de mercado (blue).

**Corpo do agente -- seguir estrutura XML exata dos auditores (ex: up-auditor-ux.md):**

1. `<role>` -- Definir papel: analista de codigo que mapeia features existentes e identifica gaps funcionais. NAO e um auditor de bugs/problemas -- busca OPORTUNIDADES e features que FALTAM. Inclui regra CRITICA de leitura inicial de `<files_to_read>`.

2. `<context_loading>` -- Step inicial obrigatorio:
   - Carregar template: `$HOME/.claude/up/templates/suggestion.md`
   - Carregar CLAUDE.md do projeto (se existir)
   - NAO carregar references de auditoria (nao e auditor)

3. `<process>` com 5 steps:

   **Step 1 (stack_detection):** Detectar stack do projeto.
   - Verificar package.json para frameworks, linguagem, ORM, auth, API style.
   - Listar dependencias instaladas e seus propositos.
   - Classificar tipo de projeto: webapp, API, CLI, lib, monorepo.
   - Registrar stack detectada.

   **Step 2 (feature_mapping):** Mapear features existentes do projeto.
   - Explorar estrutura de diretorios e entender organizacao.
   - Identificar rotas/endpoints/paginas -- cada uma e uma feature.
   - Identificar modelos de dados/schemas -- cada entidade e um dominio funcional.
   - Identificar integracao com servicos externos (APIs, DBs, auth providers).
   - Produzir lista estruturada: "Feature: [nome] -- Arquivo(s): [path] -- Descricao: [o que faz]"

   **Step 3 (gap_analysis):** Analisar gaps funcionais.
   Para cada feature mapeada, avaliar:
   - **Funcionalidade incompleta:** Feature existe mas falta algo obvio (ex: CRUD sem delete, listagem sem paginacao, formulario sem validacao client-side).
   - **Feature adjacente ausente:** Feature natural que projetos similares tem (ex: tem login mas nao tem recuperacao de senha, tem listagem mas nao tem busca/filtro).
   - **Integracao ausente:** Servicos/APIs comuns que o projeto poderia usar dado seu dominio (ex: projeto de e-commerce sem rastreamento de envio).
   - **Feature de DX ausente:** Ferramentas de developer experience que faltam (ex: sem seeds de DB, sem scripts de setup, sem health check endpoint).

   Para cada gap identificado, criar sugestao no formato do template suggestion.md:
   - ID: `IDEA-NNN` (sequencial)
   - Dimensao: `Ideias`
   - Arquivo: caminho do ponto de extensao mais logico no codigo, ou `N/A` para features estruturais
   - Linha: linha do ponto de extensao ou `N/A`
   - Problema: descrever o GAP -- "O projeto tem X mas nao tem Y, que e esperado/util porque Z"
   - Sugestao: descrever a FEATURE proposta com escopo claro -- "Implementar Y que faz Z, integrando com X existente via [mecanismo]"
   - Esforco: P/M/G baseado na complexidade de implementacao
   - Impacto: P/M/G baseado no valor para o usuario final

   **Step 4 (coverage_map):** Mapa de cobertura (INFRA-03 adaptado para ideias).
   - Listar todos os arquivos/diretorios analisados
   - Calcular cobertura como % de arquivos relevantes examinados
   - Formato identico ao dos auditores para consistencia

   **Step 5 (write_output):** Salvar resultado.
   - Criar diretorio: `mkdir -p .plano/ideias/`
   - Escrever `.plano/ideias/codigo-sugestoes.md` com frontmatter YAML:
     ```yaml
     ---
     dimensao: Ideias
     fonte: analise-codigo
     data: YYYY-MM-DD
     stack: [stack detectada]
     total_sugestoes: N
     features_mapeadas: M
     cobertura: X de Y arquivos (Z%)
     ---
     ```
   - Conteudo: stack detectada, features mapeadas, sugestoes IDEA-NNN, mapa de cobertura

4. `<output_format>` -- Formato de retorno ao workflow:
   ```markdown
   ## ANALISE DE CODIGO COMPLETA

   **Stack:** [stack detectada]
   **Features mapeadas:** N
   **Sugestoes:** M total (gaps funcionais: X, features adjacentes: Y, integracao: Z, DX: W)
   **Cobertura:** X de Y arquivos = Z%
   **Arquivo:** .plano/ideias/codigo-sugestoes.md
   ```

5. `<critical_rules>` -- Regras inviolaveis (adaptar dos auditores):
   - NUNCA sugerir feature sem justificativa de POR QUE o projeto se beneficiaria
   - NUNCA sugerir feature que o projeto JA tem (verificar feature_mapping primeiro)
   - Problema = gap/oportunidade (o que falta), NAO bug/erro (isso e para auditores)
   - Sugestao = feature proposta com escopo CLARO e ponto de integracao definido
   - Se Esforco=G, justificativa DEVE aparecer no campo Sugestao
   - Mapa de cobertura OBRIGATORIO (INFRA-03)
   - NUNCA ler/citar conteudo de .env, credentials.*, *.key, *.pem
   - Todo texto em PT-BR, tags XML em ingles
   - Maximo 1 sugestao por bloco, nunca agrupar features distintas
   - Limitar a no maximo 10-15 sugestoes (foco em qualidade, nao quantidade)

6. `<success_criteria>` -- Checklist de auto-verificacao antes de retornar.
</action>
<verify>
<automated>
# Verificar existencia e estrutura basica
test -f up/agents/up-analista-codigo.md && test -f agents/up-analista-codigo.md && echo "PASS: Files exist" || echo "FAIL: Missing files"

# Verificar frontmatter obrigatorio
head -10 up/agents/up-analista-codigo.md | grep -q "name: up-analista-codigo" && echo "PASS: Name correct" || echo "FAIL: Name missing"
head -10 up/agents/up-analista-codigo.md | grep -q "tools:" && echo "PASS: Tools defined" || echo "FAIL: Tools missing"
head -10 up/agents/up-analista-codigo.md | grep -q "color:" && echo "PASS: Color defined" || echo "FAIL: Color missing"

# Verificar tags XML semanticas essenciais
grep -q "<role>" up/agents/up-analista-codigo.md && echo "PASS: role tag" || echo "FAIL: role tag missing"
grep -q "<process>" up/agents/up-analista-codigo.md && echo "PASS: process tag" || echo "FAIL: process tag missing"
grep -q "<critical_rules>" up/agents/up-analista-codigo.md && echo "PASS: critical_rules tag" || echo "FAIL: critical_rules tag missing"
grep -q "<output_format>" up/agents/up-analista-codigo.md && echo "PASS: output_format tag" || echo "FAIL: output_format tag missing"

# Verificar steps essenciais
grep -q "feature_mapping\|feature mapping" up/agents/up-analista-codigo.md && echo "PASS: feature_mapping step" || echo "FAIL: feature_mapping step missing"
grep -q "gap_analysis\|gap analysis" up/agents/up-analista-codigo.md && echo "PASS: gap_analysis step" || echo "FAIL: gap_analysis step missing"
grep -q "coverage_map\|cobertura" up/agents/up-analista-codigo.md && echo "PASS: coverage_map step" || echo "FAIL: coverage_map step missing"

# Verificar referencia ao template de sugestao
grep -q "suggestion.md" up/agents/up-analista-codigo.md && echo "PASS: References suggestion.md" || echo "FAIL: No reference to suggestion.md"

# Verificar que IDEA-NNN e mencionado como formato de ID
grep -q "IDEA-" up/agents/up-analista-codigo.md && echo "PASS: IDEA-NNN format" || echo "FAIL: IDEA-NNN format missing"

# Verificar que .plano/ideias/ e o diretorio de output
grep -q ".plano/ideias/" up/agents/up-analista-codigo.md && echo "PASS: Output dir correct" || echo "FAIL: Output dir wrong"

# Verificar que copias sao identicas
diff up/agents/up-analista-codigo.md agents/up-analista-codigo.md && echo "PASS: Files identical" || echo "FAIL: Files differ"
</automated>
</verify>
<done>
- Arquivo up/agents/up-analista-codigo.md existe com frontmatter valido (name, description, tools, color)
- Agente tem 5 steps: stack_detection, feature_mapping, gap_analysis, coverage_map, write_output
- Agente produz sugestoes IDEA-NNN no formato do template suggestion.md com Dimensao=Ideias
- Agente salva output em .plano/ideias/codigo-sugestoes.md
- Agente tem critical_rules adaptadas para ideias (nao bugs)
- Copia identica em agents/up-analista-codigo.md
</done>
</task>

<task id="2" type="auto">
<files>up/agents/up-pesquisador-mercado.md</files>
<files>agents/up-pesquisador-mercado.md</files>
<action>
Criar o arquivo `up/agents/up-pesquisador-mercado.md` (fonte canonica) e copiar identico para `agents/up-pesquisador-mercado.md` (instalacao local).

**Frontmatter:**
```yaml
---
name: up-pesquisador-mercado
description: Pesquisa concorrentes e tendencias de mercado via web search para sugerir features novas. Produz sugestoes estruturadas com comparativo competitivo.
tools: Read, Write, Bash, Grep, Glob, WebSearch, WebFetch
color: blue
---
```
- Tools: Read/Grep/Glob para explorar codebase (entender o que o projeto faz), Write para salvar output, Bash para comandos auxiliares.
- WebSearch/WebFetch: ESSENCIAIS para pesquisa de concorrentes e tendencias. Sem esses tools o agente nao funciona.
- Color `blue` para alinhar com up-pesquisador-projeto (mesmo tipo de trabalho: pesquisa externa).

**Corpo do agente -- seguir estrutura XML exata dos auditores com adaptacoes para pesquisa web:**

1. `<role>` -- Definir papel: pesquisador de mercado que busca concorrentes, tendencias e features populares no ecossistema relevante ao projeto. Usa web search para coletar dados e transforma em sugestoes de features concretas. Inclui regra CRITICA de leitura inicial de `<files_to_read>`.

2. `<philosophy>` -- Adaptar da filosofia do up-pesquisador-projeto:
   - Dados de treinamento = hipotese (6-18 meses defasado)
   - Prefira fontes atuais via WebSearch sobre dados de treinamento
   - Reporte honesto: "nao encontrei X" e valioso
   - Investigacao, nao confirmacao: colete evidencia, depois forme conclusoes

3. `<context_loading>` -- Step inicial obrigatorio:
   - Carregar template: `$HOME/.claude/up/templates/suggestion.md`
   - Carregar CLAUDE.md do projeto (se existir)
   - Ler package.json ou equivalente para entender dominio do projeto

4. `<process>` com 5 steps:

   **Step 1 (project_understanding):** Entender o que o projeto faz.
   - Ler README.md, CLAUDE.md, package.json para entender dominio e proposito
   - Listar features principais que o projeto oferece (sem analise profunda -- apenas visao geral)
   - Classificar dominio: e-commerce, SaaS, ferramenta de dev, rede social, fintech, saude, educacao, etc.
   - Registrar keywords de busca derivadas do dominio (ex: "e-commerce platform features 2025", "SaaS dashboard trends")
   - Se nao conseguir determinar dominio: usar nome do projeto + tecnologias como keywords

   **Step 2 (competitor_research):** Pesquisar concorrentes e projetos similares.
   - Usar WebSearch com 3-5 queries derivadas do dominio:
     - "[dominio] alternatives comparison [ano]"
     - "[dominio] features checklist"
     - "best [dominio] open source" (se projeto e open source)
     - "[framework usado] [dominio] examples"
   - Para cada concorrente/projeto similar encontrado:
     - Nome e URL
     - Features principais que oferece
     - Diferenciais competitivos
   - Limite: analisar no maximo 5-8 concorrentes (foco em qualidade)
   - Se WebSearch falhar ou retornar pouco: usar conhecimento de treinamento como fallback, sinalizando "LOW confidence -- baseado em dados de treinamento, nao pesquisa atual"

   **Step 3 (trend_analysis):** Analisar tendencias relevantes.
   - Usar WebSearch com queries de tendencias:
     - "[dominio] trends [ano]"
     - "[framework] new features [ano]"
     - "[dominio] user expectations"
   - Identificar 3-5 tendencias relevantes para o projeto
   - Para cada tendencia: nome, descricao curta, por que e relevante para ESTE projeto
   - Se WebSearch falhar: usar conhecimento de treinamento como fallback com sinal LOW confidence

   **Step 4 (generate_suggestions):** Gerar sugestoes de features baseadas na pesquisa.
   - Para cada gap identificado comparando o projeto com concorrentes/tendencias:
     - Criar sugestao no formato do template suggestion.md
     - ID: `IDEA-NNN` (sequencial, continuando APOS os IDs do analista de codigo se visivel no prompt)
     - Dimensao: `Ideias`
     - Arquivo: ponto de extensao mais logico no codigo ou `N/A` para features estruturais
     - Linha: linha do ponto de extensao ou `N/A`
     - Problema: "Concorrentes [X, Y] oferecem [feature]. Projeto nao tem equivalente. Tendencia de mercado [Z] indica demanda."
     - Sugestao: "Implementar [feature] que [descricao]. Referencia: [concorrente] faz [como]. Possivel integracao com [parte existente do codigo]."
     - Esforco: P/M/G
     - Impacto: P/M/G
     - Referencia: URL do concorrente ou fonte da tendencia
   - Limitar a no maximo 10-15 sugestoes (foco em qualidade)
   - Cada sugestao DEVE ter evidencia de mercado (nao apenas opiniao)

   **Step 5 (write_output):** Salvar resultado.
   - Criar diretorio: `mkdir -p .plano/ideias/`
   - Escrever `.plano/ideias/mercado-sugestoes.md` com frontmatter YAML:
     ```yaml
     ---
     dimensao: Ideias
     fonte: pesquisa-mercado
     data: YYYY-MM-DD
     dominio: [dominio classificado]
     concorrentes_analisados: N
     tendencias_identificadas: M
     total_sugestoes: K
     confianca: HIGH|MIXED|LOW
     ---
     ```
   - Conteudo: dominio, concorrentes analisados (tabela com nome/URL/features), tendencias, sugestoes IDEA-NNN, fontes consultadas

5. `<output_format>` -- Formato de retorno ao workflow:
   ```markdown
   ## PESQUISA DE MERCADO COMPLETA

   **Dominio:** [dominio classificado]
   **Concorrentes analisados:** N
   **Tendencias identificadas:** M
   **Sugestoes:** K total
   **Confianca:** HIGH|MIXED|LOW
   **Arquivo:** .plano/ideias/mercado-sugestoes.md
   ```

6. `<critical_rules>` -- Regras inviolaveis:
   - NUNCA sugerir feature sem evidencia de mercado (concorrente que tem ou tendencia que demanda)
   - NUNCA inventar concorrentes ou features -- se nao encontrou via WebSearch, declarar LOW confidence
   - Sugestao DEVE ser relevante para o projeto ESPECIFICO (nao generica de dominio)
   - Cada sugestao DEVE ter pelo menos 1 fonte (URL ou nome de concorrente)
   - Se WebSearch nao funcionar: usar dados de treinamento como fallback, SEMPRE sinalizar "LOW confidence"
   - Limitar sugestoes a 10-15 no maximo (qualidade sobre quantidade)
   - NUNCA ler/citar conteudo de .env, credentials.*, *.key, *.pem
   - Todo texto em PT-BR, tags XML em ingles
   - Maximo 1 sugestao por bloco

7. `<success_criteria>` -- Checklist de auto-verificacao.
</action>
<verify>
<automated>
# Verificar existencia e estrutura basica
test -f up/agents/up-pesquisador-mercado.md && test -f agents/up-pesquisador-mercado.md && echo "PASS: Files exist" || echo "FAIL: Missing files"

# Verificar frontmatter obrigatorio
head -10 up/agents/up-pesquisador-mercado.md | grep -q "name: up-pesquisador-mercado" && echo "PASS: Name correct" || echo "FAIL: Name missing"
head -10 up/agents/up-pesquisador-mercado.md | grep -q "WebSearch" && echo "PASS: WebSearch in tools" || echo "FAIL: WebSearch missing from tools"
head -10 up/agents/up-pesquisador-mercado.md | grep -q "WebFetch" && echo "PASS: WebFetch in tools" || echo "FAIL: WebFetch missing from tools"
head -10 up/agents/up-pesquisador-mercado.md | grep -q "color:" && echo "PASS: Color defined" || echo "FAIL: Color missing"

# Verificar tags XML semanticas essenciais
grep -q "<role>" up/agents/up-pesquisador-mercado.md && echo "PASS: role tag" || echo "FAIL: role tag missing"
grep -q "<philosophy>" up/agents/up-pesquisador-mercado.md && echo "PASS: philosophy tag" || echo "FAIL: philosophy tag missing"
grep -q "<process>" up/agents/up-pesquisador-mercado.md && echo "PASS: process tag" || echo "FAIL: process tag missing"
grep -q "<critical_rules>" up/agents/up-pesquisador-mercado.md && echo "PASS: critical_rules tag" || echo "FAIL: critical_rules tag missing"
grep -q "<output_format>" up/agents/up-pesquisador-mercado.md && echo "PASS: output_format tag" || echo "FAIL: output_format tag missing"

# Verificar steps essenciais
grep -q "competitor_research\|competitor research\|concorrentes" up/agents/up-pesquisador-mercado.md && echo "PASS: competitor_research step" || echo "FAIL: competitor_research missing"
grep -q "trend_analysis\|trend analysis\|tendencias" up/agents/up-pesquisador-mercado.md && echo "PASS: trend_analysis step" || echo "FAIL: trend_analysis missing"

# Verificar referencia ao template de sugestao
grep -q "suggestion.md" up/agents/up-pesquisador-mercado.md && echo "PASS: References suggestion.md" || echo "FAIL: No reference to suggestion.md"

# Verificar que IDEA-NNN e mencionado como formato de ID
grep -q "IDEA-" up/agents/up-pesquisador-mercado.md && echo "PASS: IDEA-NNN format" || echo "FAIL: IDEA-NNN format missing"

# Verificar que .plano/ideias/ e o diretorio de output
grep -q ".plano/ideias/" up/agents/up-pesquisador-mercado.md && echo "PASS: Output dir correct" || echo "FAIL: Output dir wrong"

# Verificar WebSearch mencionado no corpo (nao so no frontmatter)
grep -c "WebSearch" up/agents/up-pesquisador-mercado.md | awk '{if($1 >= 3) print "PASS: WebSearch used in body"; else print "FAIL: WebSearch not used enough in body"}'

# Verificar que copias sao identicas
diff up/agents/up-pesquisador-mercado.md agents/up-pesquisador-mercado.md && echo "PASS: Files identical" || echo "FAIL: Files differ"
</automated>
</verify>
<done>
- Arquivo up/agents/up-pesquisador-mercado.md existe com frontmatter valido incluindo WebSearch e WebFetch nas tools
- Agente tem 5 steps: project_understanding, competitor_research, trend_analysis, generate_suggestions, write_output
- Agente usa WebSearch para pesquisar concorrentes e tendencias de mercado reais
- Agente produz sugestoes IDEA-NNN no formato do template suggestion.md com Dimensao=Ideias
- Cada sugestao tem evidencia de mercado (concorrente ou tendencia) como fonte
- Agente sinaliza LOW confidence quando usa apenas dados de treinamento
- Agente salva output em .plano/ideias/mercado-sugestoes.md
- Copia identica em agents/up-pesquisador-mercado.md
</done>
</task>

## Criterios de Sucesso

- [ ] up/agents/up-analista-codigo.md criado com 5 steps e formato padrao de agente UP
- [ ] up/agents/up-pesquisador-mercado.md criado com WebSearch/WebFetch e 5 steps
- [ ] Ambos produzem sugestoes IDEA-NNN no formato suggestion.md com Dimensao=Ideias
- [ ] Ambos salvam output em .plano/ideias/ (codigo-sugestoes.md e mercado-sugestoes.md)
- [ ] Copias identicas em agents/ para instalacao local
- [ ] Ambos tem critical_rules, output_format e success_criteria
