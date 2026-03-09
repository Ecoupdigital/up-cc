# Pesquisa: Como Sugerir Features Novas via Agente AI

**Dominio:** Sugestao automatizada de features para projetos de software
**Pesquisado:** 2026-03-09
**Confianca geral:** MEDIUM (multiplas fontes concordam nos padroes, mas implementacao especifica para agentes LLM-based e emergente)

---

## Sumario Executivo

Sistemas modernos de sugestao de features operam em tres camadas complementares: **analytics de uso** (o que usuarios fazem), **analise competitiva** (o que concorrentes oferecem), e **inferencia de dominio** (o que o tipo de produto deveria ter). Para um agente AI sem telemetria de uso real, as duas ultimas camadas sao as mais relevantes. A abordagem mais promissora combina analise estatica do codebase (para entender o que ja existe) com pesquisa web de mercado/concorrentes (para mapear gaps) e conhecimento de dominio do LLM (para inferir features esperadas por tipo de produto).

A pesquisa revela que ferramentas como GapsFinder e Competely ja automatizam comparacao de features entre produtos via multi-LLM, produzindo matrizes de comparacao em JSON/CSV. Frameworks de priorizacao como RICE e ICE sao naturalmente adaptaveis para scoring automatizado por LLMs, enquanto o modelo Kano oferece categorizacao qualitativa (must-have, delighter, indifferent) que LLMs conseguem inferir sem survey de usuarios.

O principal insight para o comando `/up:ideias`: o agente deve operar como um **product manager sintetico** -- analisar codigo para mapear capacidades existentes, pesquisar web para entender expectativas do dominio e concorrentes, e produzir sugestoes estruturadas com justificativa, esforco estimado e impacto projetado, priorizadas em uma matriz esforco-impacto.

---

## 1. Product Analytics para Sugestao de Features

**Confianca: MEDIUM** (fontes oficiais dos produtos confirmam capacidades)

### O Que Ferramentas de Analytics Fazem

Ferramentas como PostHog, Mixpanel e Amplitude rastreiam comportamento real de usuarios para informar decisoes de produto:

| Ferramenta | Capacidade Relevante | Como Informa Features |
|------------|---------------------|----------------------|
| PostHog | Stickiness metrics, feature adoption tracking, group analytics | Identifica features com baixa adocao, mapeia jornadas de usuario, detecta onde usuarios abandonam |
| Mixpanel | Funnels, cohorts, retention analysis | Mostra onde usuarios travamn em fluxos, quais features correlacionam com retencao |
| Amplitude | Behavioral analysis, conversion paths, engagement decline | Rastreia como usuarios interagem com features, identifica onde engajamento cai |

**PostHog AI** (Max AI) vai alem: analisa dados em linguagem natural, assiste session recordings automaticamente, e sugere insights de produto.

### Relevancia para o `/up:ideias`

**Uso direto: BAIXO.** Essas ferramentas exigem telemetria real de usuarios. O `/up:ideias` opera pre-deploy ou em projetos sem analytics configurado.

**Uso indireto: ALTO.** Os *padroes de analise* que essas ferramentas usam sao replicaveis por um LLM analisando codigo:

| Padrao de Analytics | Equivalente no Agente AI |
|--------------------|-------------------------|
| Feature adoption tracking | Analisar rotas/endpoints/componentes para mapear features existentes |
| Funnel drop-off analysis | Analisar fluxos de UI (formularios, wizards, checkout) para gaps de UX |
| Retention correlation | Inferir quais features correlacionam com valor para o usuario baseado em dominio |
| Stickiness metrics | Identificar features "core" vs "nice-to-have" pela frequencia de referencia no codigo |

**Recomendacao:** O agente deve adotar a mentalidade de analytics -- mapear "o que existe" antes de sugerir "o que falta" -- mas via analise de codigo, nao telemetria.

### Fontes
- [PostHog Product Analytics](https://posthog.com/product-analytics)
- [PostHog AI](https://posthog.com/ai)
- [Mixpanel vs Amplitude comparison](https://userpilot.com/blog/mixpanel-vs-amplitude/)
- [Product Analytics Tools for Adoption Tracking](https://jimo.ai/blog/best-product-analytics-tools-for-adoption-tracking)

---

## 2. Analise Competitiva Automatizada

**Confianca: MEDIUM** (ferramentas verificadas em sites oficiais, capacidades confirmadas)

### Ferramentas de AI para Competitive Analysis

O mercado de competitive intelligence cresce ~20% ao ano (projecao de $1.46B ate 2030). Ferramentas chave:

| Ferramenta | Como Funciona | Output |
|------------|--------------|--------|
| **GapsFinder** | Multi-LLM (ChatGPT + Gemini + Perplexity), analisa URLs de ate 5 concorrentes, compara features/pricing/posicionamento | JSON/CSV com feature comparison matrix, market gaps, pricing analysis |
| **Competely** | Gera comparacoes side-by-side automaticas de features e pricing dado URL do produto | Matriz de overlap/divergencia de features |
| **Crayon** | Enterprise CI, monitora mudancas em sites de concorrentes continuamente | Battlecards, alertas de mudanca |
| **Klue** | Battlecards + agentic AI para posicionamento competitivo | Battlecards, SWOT automatizado |
| **Beam AI** | SWOT automatizado, pricing comparison, feature gap analysis, market mapping | Analise estruturada de diferenciacao |

### Padrao de Feature Gap Analysis

A abordagem mais eficaz para identificar gaps de features segue este fluxo:

```
1. MAPEAR features do produto atual (via codigo)
2. IDENTIFICAR concorrentes (via web search ou input do usuario)
3. EXTRAIR features dos concorrentes (via sites, docs, changelogs)
4. COMPARAR em matriz (produto vs concorrente por feature)
5. CLASSIFICAR gaps:
   - "Table stakes faltantes" (concorrentes todos tem, produto nao)
   - "Diferenciadores potenciais" (ninguem tem, oportunidade)
   - "Catch-up necessario" (lider de mercado tem, produto nao)
6. PRIORIZAR por impacto e esforco
```

### Como Aplicar no `/up:ideias`

O agente pode replicar o workflow do GapsFinder:

1. **Analisar codigo** para extrair lista de features existentes (rotas, componentes, endpoints, models)
2. **Perguntar ao usuario** quais sao os concorrentes (ou inferir do dominio)
3. **Pesquisar web** para features dos concorrentes (landing pages, docs, changelogs)
4. **Gerar matriz** de comparacao features-existentes vs features-concorrentes
5. **Identificar gaps** como sugestoes priorizadas

**Output recomendado:** Matriz de comparacao em Markdown com colunas: Feature | Produto | Concorrente A | Concorrente B | Gap?

### Fontes
- [GapsFinder](https://www.gapsfinder.com/en)
- [AI Competitor Analysis Tools - Visualping](https://visualping.io/blog/best-ai-tools-competitor-analysis)
- [AI Competitor Analysis Tools - Figma](https://www.figma.com/resource-library/ai-competitor-analysis-tools/)
- [AI Competitive Analysis Framework - Miro](https://miro.com/ai/ai-competitive-analysis/)

---

## 3. LLM/AI Inferindo Features Faltantes via Analise de Codigo

**Confianca: MEDIUM** (pesquisa academica + pratica da industria convergem, mas campo emergente)

### Capacidades Atuais dos LLMs para Code Analysis

LLMs modernos (GPT-5 com 400K context, Claude com 200K) conseguem:

- **Analisar codebases inteiros** em uma unica sessao para entender arquitetura e features existentes
- **Detectar padroes e anti-padroes** comparando contra conhecimento de dominio treinado
- **Inferir dominio do projeto** a partir de imports, models, rotas, nomes de variaveis
- **Sugerir melhorias** baseado em melhores praticas da industria

### Estrategia de Inferencia de Features para o Agente

O agente deve operar em 3 fases:

**Fase 1: Mapear o Que Existe (Analise de Codigo)**

```
Para cada tipo de artefato:
- Rotas/Endpoints -> Features de API
- Componentes de UI -> Features de interface
- Models/Schemas -> Entidades de dominio
- Services/Controllers -> Logica de negocio
- Middleware -> Capacidades transversais (auth, logging, rate limit)
- Config -> Integracao com servicos externos
```

**Fase 2: Inferir o Que Deveria Existir (Conhecimento de Dominio)**

O LLM possui conhecimento extenso sobre o que produtos de cada dominio tipicamente oferecem. Por exemplo:

| Tipo de Produto | Features Esperadas (Table Stakes) |
|----------------|----------------------------------|
| E-commerce | Carrinho, checkout, pagamento, historico de pedidos, busca, filtros, wishlist |
| SaaS B2B | Auth multi-tenant, RBAC, billing, onboarding, dashboard analytics, export dados |
| App Social | Feed, perfis, follow/unfollow, notificacoes, messaging, busca, reports |
| CMS | CRUD conteudo, media upload, preview, versionamento, taxonomia, busca |
| API Platform | Documentacao, rate limiting, API keys, webhooks, sandbox, monitoring |

**Fase 3: Calcular Gap (Existente vs Esperado)**

```
features_existentes = analise_codigo()
features_esperadas = conhecimento_dominio(tipo_produto)
features_faltantes = features_esperadas - features_existentes
features_diferenciadores = pesquisa_web(concorrentes) - features_existentes
sugestoes = priorizar(features_faltantes + features_diferenciadores)
```

### Tecnica de Adaptive Multi-Stage Prompting (AMP)

Pesquisa academica propoe decomposicao em estagios sequenciais:

1. **Analise** -- entender o codebase
2. **Identificacao de restricoes** -- mapear limites tecnicos e de dominio
3. **Geracao** -- propor features
4. **Validacao** -- verificar viabilidade contra o codigo existente

Use esta tecnica no workflow do agente: nao gere sugestoes diretamente, mas passe por analise e restricoes primeiro.

### Limitacoes Conhecidas

- LLMs podem sugerir features que sao tecnicamente impossiveis com a stack atual
- Conhecimento de dominio pode estar desatualizado (6-18 meses de defasagem)
- Context window limita a profundidade de analise de codebases muito grandes
- LLMs tendem a sugerir demais -- priorizacao e critica

**Mitigacao:** Combinar analise de codigo (viabilidade) com pesquisa web (atualidade) e validacao humana (relevancia).

### Fontes
- [LLMs for Source Code Analysis - arXiv](https://arxiv.org/html/2503.17502v1)
- [Can LLMs Infer Domain Knowledge from Code - ACM](https://dl.acm.org/doi/10.1145/3640544.3645228)
- [My LLM Coding Workflow 2026 - Addy Osmani](https://addyosmani.com/blog/ai-coding-workflow/)
- [Agentic Coding Guide 2026](https://www.teamday.ai/blog/complete-guide-agentic-coding-2026)

---

## 4. Frameworks de Priorizacao Aplicaveis a Automacao

**Confianca: HIGH** (frameworks bem documentados, multiplas fontes oficiais concordam)

### RICE (Reach, Impact, Confidence, Effort)

**Formula:** Score = (Reach x Impact x Confidence) / Effort

| Componente | Escala | O Que Mede | Automatizavel? |
|-----------|--------|-----------|----------------|
| Reach | Usuarios/periodo | Quantos usuarios se beneficiam | PARCIAL -- LLM pode estimar baseado em analise de rotas/paginas mais acessadas ou inferir por tipo de feature |
| Impact | 0.25 (minimo) a 3 (massivo) | Intensidade do beneficio | SIM -- LLM pode classificar baseado em dominio (auth = 3, dark mode = 0.5) |
| Confidence | 50-100% | Certeza da estimativa | SIM -- LLM pode auto-avaliar baseado em qualidade das fontes |
| Effort | Pessoa-meses | Custo de implementacao | PARCIAL -- LLM pode estimar complexidade via analise de codigo similar |

**Melhor para:** Roadmap de medio prazo, decisoes multi-stakeholder, comparacao defensavel.

### ICE (Impact, Confidence, Ease)

**Formula:** Score = Impact x Confidence x Ease (escala 1-10 cada)

**Vantagem sobre RICE:** Mais simples, mais rapido. Remove "Reach" que e dificil de estimar sem dados.

**Melhor para:** Decisoes rapidas, backlogs de crescimento, iteracao frequente.

**Recomendacao para `/up:ideias`:** Use **ICE modificado** porque:
1. O agente nao tem dados de "Reach" (sem analytics)
2. A escala 1-10 e intuitiva para output em Markdown
3. Rapido de calcular e facil de ajustar

### Kano Model (Categorizacao Qualitativa)

**Categorias:**

| Categoria | Significado | Exemplo | Automatizavel? |
|-----------|-------------|---------|----------------|
| Must-have (Basico) | Esperado, ausencia causa insatisfacao | Login, logout, reset password | SIM -- LLM conhece table stakes por dominio |
| Performance | Melhor execucao = maior satisfacao | Velocidade de busca, UX de checkout | SIM -- LLM pode avaliar qualidade vs baseline |
| Delighter (Excitacao) | Inesperado, presenca causa encantamento | AI-powered search, real-time collab | SIM -- LLM pode sugerir baseado em tendencias |
| Indifferent | Nao afeta satisfacao | Mudar cor do footer | SIM -- LLM pode filtrar sugestoes de baixo impacto |
| Reverse | Presenca causa insatisfacao | Ads intrusivos, notificacoes excessivas | SIM -- LLM pode identificar anti-features |

**Insight critico:** O Kano e tradicionalmente baseado em surveys de usuarios (perguntas pareadas: "como se sente se feature existe/nao existe"). Pesquisa recente mostra que **deep learning pode classificar em categorias Kano automaticamente** a partir de reviews online usando RCNN (Recurrent Convolutional Neural Network).

**Recomendacao para `/up:ideias`:** Use Kano para **categorizar** as sugestoes (e mais intuitivo que scores numericos puros), e ICE para **ordenar** dentro de cada categoria.

### Abordagem Combinada Recomendada

```
1. CATEGORIZAR via Kano: Must-have | Performance | Delighter
2. PONTUAR via ICE: Impact (1-10) x Confidence (1-10) x Ease (1-10)
3. PLOTAR em matriz: Esforco (eixo X) vs Impacto (eixo Y)
4. RECOMENDAR por quadrante:
   - Quick wins (alto impacto, baixo esforco) -> Fazer primeiro
   - Big bets (alto impacto, alto esforco) -> Planejar cuidadosamente
   - Fill-ins (baixo impacto, baixo esforco) -> Fazer se sobrar tempo
   - Money pits (baixo impacto, alto esforco) -> Nao fazer
```

### Fontes
- [RICE vs ICE vs Kano - Plane.so](https://plane.so/blog/rice-vs-ice-vs-kano-which-framework-works-best-in-2025-)
- [RICE Scoring Model - ProductPlan](https://www.productplan.com/glossary/rice-scoring-model/)
- [Feature Prioritization Frameworks - Plane.so](https://plane.so/blog/feature-prioritization-frameworks-rice-moscow-and-kano-explained)
- [Kano Model - Product School](https://productschool.com/blog/product-fundamentals/kano-model)
- [Automated Kano Classification - MDPI](https://www.mdpi.com/2673-2688/5/1/18)
- [Prioritization Frameworks - Atlassian](https://www.atlassian.com/agile/product-management/prioritization-framework)

---

## 5. Formato Estruturado de Output para Sugestoes

**Confianca: HIGH** (sintetizado de padroes consolidados da industria)

### Formato Recomendado por Sugestao

Cada sugestao de feature deve conter:

```markdown
### [ID]: [Nome da Feature]

**Categoria Kano:** Must-have | Performance | Delighter
**Perspectiva:** Usuario Final | Desenvolvedor | Negocio

| Dimensao | Valor |
|----------|-------|
| Impacto | [1-10] -- [justificativa curta] |
| Confianca | [1-10] -- [fonte: codigo/web/dominio] |
| Facilidade | [1-10] -- [justificativa curta] |
| Score ICE | [calculo] |

**O Que:** [descricao em 1-2 frases]
**Por Que:** [justificativa baseada em evidencia: gap competitivo, expectativa do dominio, tendencia de mercado]
**Evidencia:** [fonte -- analise de codigo, concorrente X, padrao do dominio]

**Escopo Tecnico:**
- Componentes afetados: [lista de arquivos/modulos]
- Dependencias: [features que precisam existir antes]
- Complexidade estimada: [Baixa/Media/Alta]

**Quadrante:** Quick Win | Big Bet | Fill-in | Evitar
```

### Formato do Relatorio Completo

```markdown
# Sugestoes de Features: [Nome do Projeto]

**Data:** [data]
**Analista:** Agente AI (up-ideias)
**Fontes:** Analise de codigo + Pesquisa de mercado + Conhecimento de dominio

## Resumo Executivo
[3-4 paragrafos com principais descobertas]

## Concorrentes Analisados
| Concorrente | URL | Foco Principal | Features Unicas |
|-------------|-----|---------------|----------------|

## Matriz de Comparacao Competitiva
| Feature | Produto | Conc. A | Conc. B | Conc. C | Gap? |
|---------|---------|---------|---------|---------|------|

## Sugestoes Priorizadas

### Quick Wins (Alto Impacto, Baixo Esforco)
[sugestoes no formato estruturado acima]

### Big Bets (Alto Impacto, Alto Esforco)
[sugestoes]

### Fill-ins (Baixo Impacto, Baixo Esforco)
[sugestoes]

## Anti-Features (Nao Implementar)
| Feature | Por Que Evitar |
|---------|---------------|

## Dependencias entre Features
Feature A -> Feature B (B requer A)

## Fases Sugeridas para Roadmap
1. **[Nome]** -- [features incluidas, racional]

## Matriz Esforco x Impacto
[representacao visual em ASCII ou tabela]
```

### Formato de Mapa de Cobertura de Analise

Para garantir que o agente analisou todo o codebase (requisito MELH-04):

```markdown
## Mapa de Cobertura

| Area | Arquivos Analisados | Total | % Cobertura |
|------|-------------------|-------|-------------|
| Rotas/Endpoints | [lista] | N | 100% |
| Componentes UI | [lista] | N | 100% |
| Models/Schemas | [lista] | N | 100% |
| Services | [lista] | N | 100% |
| Config | [lista] | N | 100% |

**Cobertura Total:** [arquivos analisados] / [total relevante] = [%]
```

---

## 6. Arquitetura Recomendada para o Comando `/up:ideias`

**Confianca: HIGH** (baseado em padroes estabelecidos do sistema UP + pesquisa acima)

### Workflow Proposto

```
/up:ideias [dominio] [--concorrentes url1,url2]
    |
    v
[Step 1: Init]
  - Detectar .plano/ (criar se nao existir)
  - Carregar codebase map se disponivel (.plano/codebase/)
  - Perguntar dominio do produto se nao informado
  - Perguntar concorrentes se nao informados
    |
    v
[Step 2: Spawn 3 Agentes em Paralelo]
  |
  +-- up-analista-codigo (foco: mapear features existentes)
  |     - Glob/Read rotas, componentes, models, services
  |     - Extrair lista estruturada de features existentes
  |     - Escrever .plano/ideias/FEATURES-EXISTENTES.md
  |
  +-- up-pesquisador-mercado (foco: competitive analysis)
  |     - WebSearch concorrentes + dominio
  |     - Extrair features dos concorrentes
  |     - Escrever .plano/ideias/ANALISE-MERCADO.md
  |
  +-- up-idealizador (foco: inferir features do dominio)
        - Combinar conhecimento de dominio + tendencias
        - Gerar lista de features esperadas e inovadoras
        - Escrever .plano/ideias/FEATURES-DOMINIO.md
    |
    v
[Step 3: Spawn Sintetizador]
  up-sintetizador-ideias:
  - Ler os 3 outputs
  - Gerar matriz de comparacao
  - Calcular gap (existente vs esperado vs concorrentes)
  - Pontuar via ICE + categorizar via Kano
  - Plotar matriz esforco x impacto
  - Escrever .plano/ideias/SUGESTOES.md (relatorio final)
    |
    v
[Step 4: Apresentar ao Usuario]
  - Mostrar resumo executivo
  - Apresentar quick wins primeiro
  - Perguntar quais sugestoes aprovar
  - Gerar fases no roadmap para as aprovadas
```

### Agentes Necessarios

| Agente | Ferramentas | Responsabilidade |
|--------|------------|------------------|
| up-analista-codigo | Read, Glob, Grep, Bash | Extrair features existentes do codebase |
| up-pesquisador-mercado | WebSearch, WebFetch, Read, Write | Pesquisar concorrentes e mercado |
| up-idealizador | WebSearch, Read, Write | Inferir features por conhecimento de dominio e tendencias |
| up-sintetizador-ideias | Read, Write, Bash | Consolidar, priorizar e gerar relatorio |

### Perspectiva do Usuario Final (IDEIA-03)

O agente deve se colocar no lugar do usuario final, nao do desenvolvedor. Para cada sugestao, responder:

1. **Que problema do usuario isso resolve?** (nao "que endpoint adiciona")
2. **Como o usuario descobre esta feature?** (discoverability)
3. **O usuario pediria isso?** (demanda real vs tech-driven)
4. **Isso melhora a retencao?** (voltaria por causa disso)

---

## 7. Armadilhas e Riscos

### Armadilha 1: Sugestao de Feature Creep
**O Que Da Errado:** Agente sugere 50+ features sem filtro, overwhelm o usuario
**Prevencao:** Limitar a 15-20 sugestoes no relatorio final, priorizadas por ICE score. Anti-features explicitamente listadas.

### Armadilha 2: Desconexao Codigo-Sugestao
**O Que Da Errado:** Sugestao exige stack completamente diferente (ex: sugerir real-time para app sem WebSocket)
**Prevencao:** up-analista-codigo deve mapear capacidades tecnicas alem de features (frameworks, protocolos, integracao). Sintetizador deve verificar viabilidade tecnica.

### Armadilha 3: Pesquisa Web Desatualizada ou Superficial
**O Que Da Errado:** Concorrentes mudaram features recentemente, agente usa dados antigos
**Prevencao:** Sempre incluir data da pesquisa no output. Marcar confidence. Preferir landing pages e changelogs recentes.

### Armadilha 4: Bias do LLM para "Mais e Melhor"
**O Que Da Errado:** LLM tende a sugerir adicionar features, raramente sugere "nao faca isso"
**Prevencao:** Secao explicita de "Anti-Features" no output. Regra no prompt: "Para cada 3 sugestoes positivas, identifique 1 anti-feature."

### Armadilha 5: Ignorar Restricoes do Projeto
**O Que Da Errado:** Sugerir features que exigem infra/budget/equipe que o projeto nao tem
**Prevencao:** Input do usuario sobre restricoes (solo dev, equipe pequena, sem budget). Agente adapta scoring de Facilidade.

---

## 8. Implicacoes para Implementacao no UP

### Fase Sugerida para o Roadmap

1. **Infraestrutura de Ideias** -- Comando, workflow, templates de output
   - Criar `up/commands/ideias.md`
   - Criar `up/workflows/ideias.md`
   - Criar templates para outputs estruturados
   - Criar diretorio `.plano/ideias/` no init

2. **Agente Analista de Codigo** -- Extrair features existentes
   - Reutilizar padrao do up-mapeador-codigo
   - Output: lista estruturada de features existentes com mapa de cobertura

3. **Agente Pesquisador de Mercado** -- Competitive analysis
   - Reutilizar padrao do up-pesquisador-projeto (WebSearch + WebFetch)
   - Output: matriz de comparacao com concorrentes

4. **Agente Idealizador** -- Inferir features de dominio
   - Novo agente, combina conhecimento de dominio + tendencias web
   - Output: lista de features esperadas e inovadoras categorizadas por Kano

5. **Sintetizador de Ideias** -- Consolidar e priorizar
   - Reutilizar padrao do up-sintetizador
   - Output: relatorio final com priorizacao ICE e matriz esforco-impacto

6. **Integracao com Roadmap** -- Gerar fases das sugestoes aprovadas
   - Reutilizar `up-tools.cjs roadmap add-phase`
   - Interacao com usuario para selecionar quais sugestoes implementar

### Decisoes Tecnicas Recomendadas

| Decisao | Recomendacao | Racional |
|---------|-------------|----------|
| Framework de priorizacao | ICE (nao RICE) | Sem dados de Reach; ICE e mais simples e intuitivo |
| Categorizacao | Kano simplificado (3 categorias: Must-have, Performance, Delighter) | Mais facil de entender e automatizar que 5 categorias |
| Numero de agentes paralelos | 3 + 1 sintetizador | Equilibrio entre profundidade e custo de contexto |
| Output de concorrentes | Matriz Markdown | Sem dependencia de ferramentas externas |
| Diretorio de output | `.plano/ideias/` | Separado de `.plano/pesquisa/` para nao conflitar |
| Formato de scoring | Tabela com ICE 1-10 + quadrante | Visualmente claro em Markdown |
| Limite de sugestoes | 15-20 maximo | Evita feature creep |
| Anti-features | Secao obrigatoria | Contrabalanca bias positivo do LLM |

---

## Avaliacao de Confianca por Area

| Area | Confianca | Notas |
|------|-----------|-------|
| Product Analytics (PostHog/Mixpanel/Amplitude) | MEDIUM | Capacidades verificadas em docs oficiais, mas uso direto no agente e limitado |
| Competitive Analysis automatizado | MEDIUM | GapsFinder e Competely verificados, abordagem validada por multiplas fontes |
| LLM para inferencia de features via codigo | MEDIUM | Campo emergente, pesquisa academica suporta mas implementacao pratica e nova |
| Frameworks RICE/ICE/Kano | HIGH | Amplamente documentados, formulas claras, automatizacao viavel |
| Formato estruturado de output | HIGH | Sintetizado de padroes consolidados, adaptado ao padrao UP existente |
| Arquitetura de agentes para o comando | HIGH | Baseado em padroes comprovados do sistema UP (mapear-codigo, pesquisador-projeto) |

## Lacunas a Investigar

- **Validacao pratica:** Nenhuma ferramenta existente faz exatamente o que o `/up:ideias` propoe (analise de codigo + pesquisa web + inferencia de dominio em um so fluxo). A abordagem e sintetica.
- **Qualidade das sugestoes de dominio do LLM:** Nao ha benchmark de quao precisas sao as inferencias de features esperadas por tipo de produto. Precisara de testes com projetos reais.
- **Custo de contexto:** 3 agentes paralelos + sintetizador consomem contexto significativo. Avaliar se 2 agentes seriam suficientes (mesclar idealizador + pesquisador-mercado).
- **Internacionalizacao:** Pesquisa web retorna resultados majoritariamente em ingles. Sugestoes devem ser apresentadas em portugues brasileiro.

---

## Fontes Consolidadas

### Product Analytics
- [PostHog Product Analytics](https://posthog.com/product-analytics)
- [PostHog AI](https://posthog.com/ai)
- [PostHog Series E - UXWizz](https://www.uxwizz.com/blog/posthog-series-e-september-2025-analytics-ai-devtools-implications-developers-startups)

### Competitive Analysis
- [GapsFinder](https://www.gapsfinder.com/en)
- [AI Competitor Analysis Tools - Visualping](https://visualping.io/blog/best-ai-tools-competitor-analysis)
- [AI Competitive Analysis Framework - Miro](https://miro.com/ai/ai-competitive-analysis/)
- [SaaS Competitive Analysis Guide](https://www.madx.digital/learn/saas-competitor-analysis)

### LLM Code Analysis
- [LLMs for Source Code Analysis - arXiv](https://arxiv.org/html/2503.17502v1)
- [Can LLMs Infer Domain Knowledge from Code - ACM](https://dl.acm.org/doi/10.1145/3640544.3645228)
- [Beyond Blind Spots: LLM Evaluation - arXiv](https://arxiv.org/html/2512.16272)
- [LLM Coding Workflow 2026 - Addy Osmani](https://addyosmani.com/blog/ai-coding-workflow/)

### Prioritization Frameworks
- [RICE vs ICE vs Kano - Plane.so](https://plane.so/blog/rice-vs-ice-vs-kano-which-framework-works-best-in-2025-)
- [RICE Scoring Model - ProductPlan](https://www.productplan.com/glossary/rice-scoring-model/)
- [Kano Model - Product School](https://productschool.com/blog/product-fundamentals/kano-model)
- [Prioritization Frameworks - Atlassian](https://www.atlassian.com/agile/product-management/prioritization-framework)
- [Automated Kano Classification via Deep Learning - MDPI](https://www.mdpi.com/2673-2688/5/1/18)

### AI Product Discovery
- [AI Product Discovery - Miro](https://miro.com/ai/product-development/ai-product-discovery/)
- [How AI Is Reshaping Product Discovery 2026 - Productboard](https://www.productboard.com/events/rethinking-product-discovery-2026/)
- [AI for Product Roadmap Prioritization - Productboard](https://www.productboard.com/blog/using-ai-for-product-roadmap-prioritization/)
- [AGENTS.md Best Practices - GitHub Blog](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/)

### Domain Analysis
- [Domain Analysis - Wikipedia](https://en.wikipedia.org/wiki/Domain_analysis)
- [Software Competitive Analysis - G2](https://learn.g2.com/software-competitive-analysis)
