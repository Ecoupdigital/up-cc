# Pesquisa: Auditoria de UX/Navegabilidade por Analise Estatica de Codigo

**Dominio:** Auditoria de UX sem execucao da aplicacao (static-only)
**Pesquisado:** 2026-03-09
**Confianca geral:** MEDIUM

---

## Sumario Executivo

A auditoria de UX por analise estatica de codigo e um campo emergente mas fragmentado. Nao existe uma ferramenta unica que faca "UX lint" completo -- o ecossistema e composto de ferramentas especializadas em camadas diferentes (CSS, componentes, acessibilidade) que precisam ser orquestradas. A abordagem mais promissora para o projeto UP e usar o LLM como o "motor de avaliacao heuristica" que interpreta o codigo com contexto semantico, complementado por extracao programatica de metricas concretas (cores, font-sizes, spacing) via parsers de AST.

Pesquisa academica recente (dez/2024) demonstrou que GPT-4o consegue identificar problemas de UX em codigo-fonte (loading indicators ausentes, feedback de erro insuficiente, navegacao confusa) com 82-85% de concordancia entre avaliacoes -- mas com variabilidade significativa em severidade (56% concordancia exata). A Baymard Institute atingiu 95% de acuracia em avaliacao heuristica automatizada, mas usando abordagem hibrida: IA probabilistica apenas para deteccao de padroes, com logica deterministica para avaliacao -- e trabalhando com screenshots/URLs, nao codigo.

A conclusao principal: analise estatica consegue detectar **sinais** de problemas de UX (ausencia de padroes esperados, inconsistencias de design tokens, violacoes de contraste), mas a **interpretacao** do impacto no usuario requer raciocinio semantico -- exatamente onde LLMs se destacam. O agente UP deve combinar ambos.

---

## 1. O Que E Possivel Detectar SEM Rodar a Aplicacao

### 1.1 Deteccao de Alta Confianca (Programatica)

Estes problemas podem ser detectados por parsing de AST/CSS sem ambiguidade:

| Categoria | O Que Detectar | Como | Confianca |
|-----------|---------------|------|-----------|
| **Consistencia de cores** | Quantas cores unicas existem, duplicatas proximas (ex: #333 vs #343434) | Parse CSS, extrair todas as cores, agrupar por proximidade | HIGH |
| **Consistencia de tipografia** | Quantos font-sizes unicos, font-families, line-heights | Parse CSS, contar valores unicos | HIGH |
| **Consistencia de spacing** | Quantos valores de margin/padding unicos, se seguem escala (4px, 8px, 16px...) | Parse CSS, extrair e verificar padrao | HIGH |
| **Media queries** | Presenca/ausencia de breakpoints responsivos, quais breakpoints usados | Parse CSS, listar @media rules | HIGH |
| **Contraste de cores** | Pares color/background-color que violam WCAG 2.0 (4.5:1 normal, 3:1 large) | PostCSS ou calculo manual de luminancia | MEDIUM (limitado a pares explicitos no CSS) |
| **Font-size minimo** | Textos com font-size < 12px (ilegivel em mobile) | Parse CSS, verificar valores | HIGH |
| **Touch targets** | Elementos clicaveis com width/height < 44px (padrao Apple) ou 48dp (Material) | Parse CSS de botoes/links + dimensoes | MEDIUM |
| **z-index chaos** | Valores de z-index espalhados sem padrao (1, 9, 99, 999, 9999) | Parse CSS, listar z-indexes | HIGH |
| **Specificity** | Seletores com alta especificidade que causam cascade hell | css-tree ou Stylelint | HIGH |

### 1.2 Deteccao de Media Confianca (Pattern Matching em Componentes)

Requer analise de AST de componentes (JSX/Vue/HTML templates):

| Categoria | O Que Detectar | Como | Confianca |
|-----------|---------------|------|-----------|
| **Loading states** | Ausencia de indicadores de loading (spinner, skeleton) em operacoes async | Buscar fetch/axios/useQuery sem correspondente loading UI | MEDIUM |
| **Error handling visual** | Fetch/submit sem tratamento visual de erro (try/catch sem setState de erro) | AST: buscar catch blocks sem update de estado de erro | MEDIUM |
| **Formularios sem validacao** | Forms com inputs sem validacao client-side (required, pattern, onChange validation) | Parse JSX: form elements sem atributos de validacao | MEDIUM |
| **Links mortos internos** | Rotas definidas sem componente correspondente, links para rotas inexistentes | Parse imports de roteamento, comparar rotas vs links | MEDIUM |
| **Botoes sem feedback** | onClick handlers sem mudanca visual (disabled, loading, success state) | AST: onClick sem state toggle | MEDIUM |
| **Imagens sem alt** | `<img>` sem atributo alt | Parse HTML/JSX | HIGH |
| **Headings fora de ordem** | h1 seguido de h3 (pulou h2) | Parse HTML/JSX, verificar sequencia | HIGH |

### 1.3 Deteccao de Baixa Confianca (Requer Interpretacao Semantica -- LLM)

O LLM interpreta o codigo com contexto de UX:

| Categoria | O Que o LLM Avalia | Por Que So LLM |
|-----------|--------------------|----|
| **Fluxo de navegacao** | Se o usuario consegue voltar de qualquer tela, se ha dead-ends | Requer entendimento de hierarquia de rotas e intencao |
| **Hierarquia visual** | Se a pagina tem hierarquia clara (titulo > subtitulo > conteudo) | Requer interpretar combinacao de font-size + weight + color |
| **Feedback de estado** | Se acoes do usuario tem feedback visivel adequado | Requer entender o fluxo usuario-sistema |
| **Complexidade de formulario** | Se formularios longos tem steps/progress ou sao intimidadores | Requer interpretar quantidade de campos vs contexto |
| **Nomenclatura de UI** | Se labels, botoes, mensagens sao claros para o usuario | Requer analise semantica de texto |
| **Consistencia de padroes** | Se mesmo tipo de acao usa mesmo padrao em telas diferentes | Requer comparar componentes across files |
| **Mobile-friendliness** | Se layout e conteudo fazem sentido em tela pequena | Requer interpretar media queries + layout em contexto |

---

## 2. Ferramentas e Bibliotecas do Ecossistema

### 2.1 Analise de CSS/SCSS

| Ferramenta | O Que Faz | Relevancia para UX Audit | Confianca |
|------------|-----------|--------------------------|-----------|
| **@projectwallace/css-analyzer** | 150+ metricas de CSS: cores, font-sizes, spacing, specificity, z-indexes, media queries | ALTA -- extrai exatamente as metricas de consistencia de design que precisamos | HIGH |
| **@projectwallace/css-code-quality** | Score de qualidade de CSS baseado em guards de qualidade | MEDIA -- complementa com score geral | HIGH |
| **Stylelint** | Linter de CSS com 100+ regras built-in, extensivel via plugins | ALTA -- enforcement de convencoes, detecta erros | HIGH |
| **stylelint-a11y** | Plugin de acessibilidade: font-size-is-readable, no-outline-none, prefers-reduced-motion | MEDIA -- foco a11y, mas overlap com UX | MEDIUM |
| **postcss-wcag-contrast** | Verifica contraste de cores WCAG em pares color/background-color | MEDIA -- util mas projeto parece abandonado (sem releases recentes) | MEDIUM |
| **css-tree** | Parser CSS rapido para AST, walker, generator, lexer | ALTA -- base para extracao customizada de metricas | HIGH |
| **PostCSS** | Framework de transformacao CSS com ecossistema de plugins | ALTA -- parse CSS para AST, permite analise programatica | HIGH |
| **analyze-css** | Metricas de performance e complexidade de CSS | BAIXA -- foco em performance, menos em UX | MEDIUM |

**Recomendacao:** Use `@projectwallace/css-analyzer` como ferramenta primaria de extracao de metricas CSS. E o mais completo (150+ metricas), ativo, e retorna dados estruturados prontos para analise. Para regras de enforcement, use Stylelint com regras customizadas. Para parsing fino (valores individuais), use `css-tree` diretamente.

### 2.2 Analise de Componentes (React/Vue/HTML)

| Ferramenta | O Que Faz | Relevancia | Confianca |
|------------|-----------|------------|-----------|
| **eslint-plugin-jsx-a11y** | 33+ regras de acessibilidade para JSX (alt em imagens, labels, ARIA, headings) | ALTA -- cobre muitos sinais de UX em componentes React | HIGH |
| **eslint-plugin-react** | Regras de boas praticas React (key em listas, prop types, etc.) | MEDIA -- qualidade de codigo que afeta UX indiretamente | HIGH |
| **eslint-plugin-vue** | Regras de boas praticas Vue | MEDIA -- equivalente para Vue | HIGH |
| **eslint-plugin-css** | Verifica objetos CSS-in-JS (styled-components, emotion) | MEDIA -- bridge entre CSS e JS analysis | HIGH |
| **react-component-analyzer** | Analisa arvore de componentes React via AST (typescript-estree) | MEDIA -- visualiza hierarquia mas nao avalia UX | MEDIUM |
| **vue-mess-detector** | Detecta code smells e violacoes de best practices em Vue/Nuxt | MEDIA -- mais qualidade de codigo que UX | HIGH |
| **DeepScan** | Analise de fluxo de dados JS, encontra bugs praticos em React/Vue | BAIXA -- foco em bugs, nao UX | MEDIUM |

**Recomendacao:** `eslint-plugin-jsx-a11y` e o mais proximo de um "UX linter" para componentes que existe. Para analise de arvore de rotas, nao ha ferramenta pronta -- o LLM deve analisar a configuracao de rotas diretamente (react-router config, vue-router config, Next.js pages/).

### 2.3 Design System Compliance

| Abordagem | O Que Faz | Relevancia | Confianca |
|-----------|-----------|------------|-----------|
| **Design Lint (Figma)** | Detecta estilos faltantes, inconsistencias em designs Figma | BAIXA -- opera no Figma, nao no codigo | HIGH |
| **Stylelint + custom rules** | Regras que proibem valores hardcoded (ex: cores fora do design token) | ALTA -- enforcement de design system no codigo | HIGH |
| **ESLint custom rules** | Detectar uso de cores/espacamentos hardcoded em CSS-in-JS | ALTA -- para projetos que usam CSS-in-JS | MEDIUM |
| **Style Dictionary** | Transforma design tokens em CSS custom properties, valida schema | MEDIA -- mais build tool que audit tool | HIGH |
| **CI/CD token validation** | Pipeline que valida uso consistente de tokens em PRs | ALTA -- enforcement automatico | MEDIUM |

**Recomendacao:** Para auditoria (nao enforcement), a abordagem e: extrair todos os valores usados (cores, font-sizes, spacing), agrupar por proximidade, e reportar inconsistencias. Nao depende de ter um design system formal -- a auditoria *descobre* o design system implicito e aponta desvios.

### 2.4 Ferramentas de AI/LLM para UX

| Ferramenta/Abordagem | O Que Faz | Relevancia | Confianca |
|----------------------|-----------|------------|-----------|
| **Baymard UX-Ray** | Avaliacao heuristica automatizada de ecommerce (209 heuristicas, 95% acuracia) | INSPIRACAO -- opera com screenshots/URLs, nao codigo. Mas a abordagem hibrida (AI + logica deterministica) e referencia | HIGH |
| **GPT-4o para UX (pesquisa acadmica)** | Avaliacao heuristica de Nielsen em codigo-fonte (82-85% concordancia) | ALTA -- prova de conceito que LLMs detectam UX issues em codigo | MEDIUM |
| **RepoAudit** | Auditoria de repositorio com LLM agents, foco em bugs/seguranca | BAIXA -- foco seguranca, mas arquitetura de agentes e referencia | MEDIUM |
| **Custom LLM prompts** | Prompt estruturado com heuristicas de Nielsen para avaliar componentes | ALTA -- exatamente o que o agente UP deve fazer | MEDIUM |

**Recomendacao:** O agente UP deve seguir a abordagem Baymard: usar LLM para *deteccao de padroes* (o que parece um problema) e logica deterministica para *validacao* (metricas concretas confirmam). Traduzir as heuristicas de Nielsen em prompts estruturados que guiam o LLM a inspecionar codigo.

---

## 3. Abordagem Recomendada para o Agente UP

### 3.1 Arquitetura de Duas Camadas

```
Camada 1: EXTRACAO PROGRAMATICA (deterministica, alta confianca)
  |
  |-- CSS Analyzer: cores, font-sizes, spacing, media queries, z-indexes
  |-- AST Scan: headings hierarchy, img alt, form validation, loading states
  |-- Route Scan: rotas definidas, links internos, dead-ends
  |
  v
Camada 2: INTERPRETACAO SEMANTICA (LLM, media confianca)
  |
  |-- Recebe metricas da Camada 1 + codigo relevante
  |-- Aplica heuristicas de Nielsen ao contexto
  |-- Identifica problemas de UX que metricas sozinhas nao captam
  |-- Gera sugestoes com arquivo, linha, problema, solucao
```

### 3.2 Heuristicas de Nielsen Traduzidas para Analise Estatica

| Heuristica | O Que Buscar no Codigo |
|------------|----------------------|
| **1. Visibilidade do status** | Loading states, progress indicators, feedback apos acoes |
| **2. Correspondencia com mundo real** | Labels/textos claros, icones descritivos, terminologia do usuario |
| **3. Controle do usuario** | Botao voltar, cancelar, desfazer; confirmacao em acoes destrutivas |
| **4. Consistencia** | Mesmos padroes visuais para mesmas acoes; design tokens uniformes |
| **5. Prevencao de erros** | Validacao client-side, disabled states, confirmacao em acoes criticas |
| **6. Reconhecimento > memoria** | Labels visiveis, breadcrumbs, navigation state indicators |
| **7. Flexibilidade** | Atalhos, filtros, busca, configuracoes do usuario |
| **8. Design minimalista** | Excesso de elementos, informacao desnecessaria, visual cluttered |
| **9. Recuperacao de erros** | Mensagens de erro claras com acao sugerida, try again, fallbacks |
| **10. Ajuda** | Tooltips, help text, documentacao inline, onboarding |

### 3.3 Checklist de Deteccao por Tipo de Arquivo

**CSS/SCSS:**
- [ ] Quantas cores unicas? (> 15 = flag de inconsistencia)
- [ ] Quantos font-sizes unicos? (> 8 = flag de inconsistencia)
- [ ] Spacing segue escala? (4/8/16/24/32/48/64)
- [ ] Tem media queries para mobile? (min 1 breakpoint < 768px)
- [ ] Contraste de pares color/background-color >= 4.5:1?
- [ ] Font-size minimo >= 12px?
- [ ] Touch targets >= 44px?
- [ ] z-index usa escala controlada? (nao valores arbitrarios)
- [ ] Especificidade maxima < 0,3,0? (evitar cascade hell)
- [ ] Usa CSS custom properties / design tokens?

**Componentes (JSX/Vue/HTML):**
- [ ] Todas imagens tem alt text?
- [ ] Headings em ordem hierarquica (h1 > h2 > h3)?
- [ ] Forms tem validacao client-side (required, pattern, onChange)?
- [ ] Operacoes async tem loading state?
- [ ] Fetch/submit tem tratamento visual de erro?
- [ ] Botoes tem estado disabled durante operacoes?
- [ ] Links internos apontam para rotas existentes?
- [ ] Formularios longos (> 6 campos) tem steps/progress?
- [ ] Acoes destrutivas tem confirmacao?
- [ ] Mensagens de erro sao descritivas (nao apenas "Erro")?

**Roteamento/Navegacao:**
- [ ] Toda rota tem componente correspondente?
- [ ] Ha rotas orfas (definidas mas nunca linkadas)?
- [ ] Ha dead-ends (telas sem caminho de volta)?
- [ ] Existe pagina 404 / fallback?
- [ ] Navegacao principal cobre todas as secoes?
- [ ] Breadcrumbs ou indicador de posicao?

---

## 4. Formato de Output para Relatorio de Auditoria

### 4.1 Formato Recomendado: Markdown Estruturado (nao SARIF)

SARIF e o padrao industria para resultados de analise estatica (JSON schema, suportado por GitHub, SonarQube, etc.), mas para o contexto UP:

**Por que NAO SARIF:**
- Formato machine-readable demais; o output do UP e lido por humanos e LLMs
- Overhead de schema para algo que sera consumido como Markdown
- O valor do UP e sugestoes acionaveis, nao integracao com security dashboards

**Por que Markdown estruturado:**
- Consistente com todos os outros outputs do UP (.plano/*)
- Legivel tanto por humanos quanto por LLMs (para sintetizador)
- Pode conter tabelas, checklists, exemplos de codigo

### 4.2 Schema de Sugestao Individual

```markdown
### [CATEGORIA-NN] Titulo curto do problema

| Campo | Valor |
|-------|-------|
| **Arquivo** | `src/components/LoginForm.jsx` |
| **Linha(s)** | 42-58 |
| **Heuristica** | 5. Prevencao de erros |
| **Severidade** | ALTA / MEDIA / BAIXA |
| **Impacto UX** | Usuario pode submeter email invalido sem feedback |
| **Esforco** | BAIXO (< 1h) / MEDIO (1-4h) / ALTO (> 4h) |

**Problema:**
Formulario de login aceita submit sem validacao de formato de email. Campo `<input type="text">` deveria ser `<input type="email">` com validacao.

**Sugestao:**
Trocar type para "email", adicionar pattern ou onChange validation, mostrar mensagem de erro inline.

**Evidencia:**
[trecho de codigo relevante]
```

### 4.3 Secoes do Relatorio Completo

```markdown
# Auditoria de UX: [Nome do Projeto]

## Resumo Executivo
- Total de problemas: X (Y criticos, Z moderados, W menores)
- Score geral: [1-10]
- Areas mais problematicas: [lista]

## Metricas de Design System
| Metrica | Valor | Status |
|---------|-------|--------|
| Cores unicas | 23 | ALERTA (> 15) |
| Font-sizes unicos | 12 | ALERTA (> 8) |
| Breakpoints responsivos | 3 | OK |
| ...

## Problemas por Heuristica de Nielsen
### 1. Visibilidade do Status do Sistema
[sugestoes individuais]

### 2. Correspondencia com o Mundo Real
[sugestoes individuais]
...

## Mapa de Cobertura
| Arquivo | Analisado | Problemas |
|---------|-----------|-----------|
| src/App.jsx | SIM | 2 |
| src/components/Header.jsx | SIM | 0 |
...
| **Cobertura total** | **85%** | **12** |

## Matriz Esforco x Impacto
### Quick Wins (Baixo esforco, Alto impacto)
1. [sugestao]

### Investimentos Estrategicos (Alto esforco, Alto impacto)
1. [sugestao]

### Melhorias Incrementais (Baixo esforco, Baixo impacto)
1. [sugestao]

### Considerar Depois (Alto esforco, Baixo impacto)
1. [sugestao]
```

---

## 5. Armadilhas e Limitacoes

### 5.1 Armadilhas Criticas

**Armadilha: Falsos positivos de contraste em CSS dinamico**
- CSS custom properties (`var(--cor-primaria)`) nao podem ser resolvidas estaticamente
- CSS-in-JS com valores dinamicos (`color: ${theme.primary}`) idem
- Impacto: reportar contraste ruim quando na verdade o valor vem de um tema que e ok
- Mitigacao: reportar como "nao verificavel estaticamente", listar variaveis que precisam verificacao manual

**Armadilha: Confundir ausencia de padrao com problema**
- Nem todo componente sem loading state e um bug (pode ser operacao sincrona)
- Nem todo form sem validacao JS precisa de validacao (pode ter validacao server-side adequada)
- Mitigacao: reportar como "verificar se aplicavel" em vez de "problema confirmado"

**Armadilha: CSS frameworks ocultam responsividade**
- Tailwind, Bootstrap, Material UI tem responsividade built-in via classes utilitarias
- Analisar CSS raw sem considerar o framework gera falsos positivos
- Mitigacao: detectar framework usado e ajustar heuristicas (classes como `md:`, `sm:`, `col-`)

**Armadilha: Superestimar capacidade de deteccao estatica**
- Baymard demonstrou que IA generica (ChatGPT) tem 80% de taxa de erro em auditorias de UX
- Pesquisa academica mostra 82-85% concordancia mas 56% em severidade
- Mitigacao: comunicar claramente que sao *sinais* que precisam validacao humana, nao diagnosticos definitivos

### 5.2 Armadilhas Moderadas

**Armadilha: Component libraries mascaram a realidade**
- Projetos que usam Ant Design, MUI, Chakra UI ja tem muitos padroes de UX resolvidos
- Auditar CSS gerado por essas libs gera ruido
- Mitigacao: detectar component library e focar em codigo customizado

**Armadilha: Single Page Apps vs Multi Page**
- Analise de navegacao muda completamente entre SPA e MPA
- SPA: rotas no router config; MPA: links entre paginas HTML
- Mitigacao: detectar tipo de app e ajustar estrategia de analise

**Armadilha: Dark mode e temas**
- Um app com dark mode tem o dobro de cores legitimamente
- Mitigacao: agrupar cores por contexto de tema antes de contar "cores unicas"

---

## 6. Pesquisa Academica Relevante

### "Catching UX Flaws in Code" (Dez 2024, arXiv:2512.04262)

**Metodologia:** GPT-4o pipeline com instrucoes embutidas sobre heuristicas de Nielsen, avaliacao de 30 websites open-source, JSON output estruturado, 3 avaliacoes independentes por site.

**Resultados:**
- 82-85% concordancia exata na deteccao de issues
- Cohen's Kappa 0.50 (concordancia moderada)
- 56% concordancia exata em severidade (problematico)
- Krippendorff's Alpha perto de zero (sensivel a inconsistencias menores)

**Tipos de issues detectados:** Loading indicators ausentes, mensagens de erro insuficientes, navegacao confusa, falta de controle do usuario, ausencia de documentacao de ajuda.

**Limitacoes:** Capacidade de julgar severidade varia e requer supervisao humana. Algumas heuristicas (Help and Documentation) tiveram Kappa de 0.08 (quase aleatorio).

**Implicacao para UP:** O LLM e bom em *encontrar* problemas de UX no codigo, mas ruim em *classificar severidade*. A severidade deve ser determinada por regras programaticas ou revisao humana.

**Confianca:** MEDIUM (estudo unico, amostra limitada, pre-print nao peer-reviewed)

### Baymard Institute UX-Ray (2025-2026)

**Abordagem:** Hibrida -- IA probabilistica para deteccao de padroes visuais, logica deterministica para avaliacao. Opera com screenshots/URLs, nao codigo.

**Resultados:** 95% acuracia comparado com auditores humanos experts em 48 websites.

**Contraste com IA generica:** ChatGPT-4 em auditoria de UX mostrou 80% de taxa de erro e 14-26% de taxa de descoberta (Baymard, 2024).

**Implicacao para UP:** A acuracia alta vem da abordagem hibrida. O agente UP deve separar deteccao (LLM) de validacao (regras). Nunca depender so do LLM para o veredito.

**Confianca:** HIGH (Baymard e autoridade reconhecida, dados publicos de benchmark)

---

## 7. Recomendacoes para Implementacao no UP

### 7.1 O Agente Deve Fazer (Pratico, Valor Alto)

1. **Extrair metricas de design system implicito** -- cores, fonts, spacing, z-indexes do CSS, agrupar e reportar inconsistencias
2. **Verificar checklist de componentes** -- alt text, heading order, form validation, loading states, error handling
3. **Mapear rotas e navegacao** -- listar todas as rotas, links internos, identificar orfas e dead-ends
4. **Avaliar responsividade** -- presenca de media queries, breakpoints cobertos, framework detection
5. **Aplicar heuristicas de Nielsen** -- prompt estruturado que guia o LLM a avaliar cada heuristica contra o codigo

### 7.2 O Agente NAO Deve Fazer (Fora do Escopo Estatico)

1. **Medir performance real** -- requer execucao (Core Web Vitals, tempo de carregamento)
2. **Testar interacoes** -- hover states, animacoes, transicoes requerem browser
3. **Validar layout visual** -- posicionamento real requer renderizacao
4. **Garantir acuracia de contraste em temas dinamicos** -- CSS variables nao resolvem estaticamente
5. **Avaliar experiencia emocional** -- tom, branding, estetica sao subjetivos demais para code analysis

### 7.3 Como Estruturar o Prompt do Agente

Baseado na pesquisa academica, o prompt deve:

1. **Definir persona:** "Voce e um auditor de UX senior avaliando codigo-fonte"
2. **Fornecer heuristicas:** Listar as 10 heuristicas de Nielsen com exemplos de violacao em codigo
3. **Exigir evidencia:** Cada finding deve citar arquivo e linha especificos
4. **Separar deteccao de severidade:** Encontre o problema primeiro, classifique depois com criterios objetivos
5. **Incluir metricas extraidas:** Passar as metricas da Camada 1 como contexto para a Camada 2
6. **Formato JSON/estruturado:** Saida em formato consistente para o sintetizador processar

### 7.4 Metricas CSS a Extrair (Input para o LLM)

```javascript
// Exemplo de metricas que o agente deve extrair antes de interpretar
{
  "cores_unicas": 23,
  "cores_duplicatas_proximas": [["#333", "#343434"], ["#f5f5f5", "#f6f6f6"]],
  "font_sizes_unicos": ["10px", "12px", "13px", "14px", "16px", "18px", "20px", "24px", "32px", "48px"],
  "spacing_valores": ["4px", "8px", "10px", "12px", "15px", "16px", "20px", "24px", "32px"],
  "media_queries": ["(max-width: 768px)", "(max-width: 1024px)"],
  "z_indexes": [1, 2, 10, 100, 999, 9999],
  "css_custom_properties": 12,
  "max_specificity": "0,4,2",
  "framework_detectado": "tailwind"
}
```

---

## 8. Fontes e Referencias

### Pesquisa Academica
- [Catching UX Flaws in Code: Leveraging LLMs (arXiv:2512.04262)](https://arxiv.org/html/2512.04262) -- GPT-4o para avaliacao heuristica em codigo-fonte
- [The role of large language models in UI/UX design (arXiv)](https://arxiv.org/html/2507.04469v1) -- Survey de LLMs em design UI/UX

### Ferramentas de Analise CSS
- [Project Wallace CSS Analyzer](https://www.projectwallace.com/) -- 150+ metricas CSS
- [@projectwallace/css-analyzer no npm](https://www.npmjs.com/package/@projectwallace/css-analyzer)
- [Stylelint](https://stylelint.io/) -- Linter de CSS
- [stylelint-a11y](https://github.com/YozhikM/stylelint-a11y) -- Plugin de acessibilidade
- [css-tree](https://github.com/csstree/csstree) -- Parser CSS para AST
- [postcss-wcag-contrast](https://github.com/csstools/postcss-wcag-contrast) -- Contraste WCAG em CSS

### Ferramentas de Analise de Componentes
- [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y) -- Acessibilidade em JSX
- [eslint-plugin-css](https://github.com/ota-meshi/eslint-plugin-css) -- Lint CSS-in-JS
- [vue-mess-detector](https://github.com/rrd108/vue-mess-detector) -- Code smells Vue
- [react-component-analyzer](https://github.com/activeguild/react-component-analyzer) -- Arvore de componentes

### UX e Heuristicas
- [Nielsen's 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
- [Baymard AI Heuristic Evaluations](https://baymard.com/blog/ai-heuristic-evaluations) -- 95% acuracia
- [Baymard: Testing ChatGPT-4 for UX Audits (80% error rate)](https://baymard.com/blog/gpt-ux-audit)

### Formato de Output
- [SARIF Standard (OASIS)](https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html) -- Formato industria (rejeitado para UP)
- [SARIF Guide (Sonar)](https://www.sonarsource.com/resources/library/sarif/) -- Overview de SARIF

### Curadoria de Ferramentas
- [30 CSS Static Analysis Tools](https://analysis-tools.dev/tag/css)
- [Static Analysis Tools (GitHub curated list)](https://github.com/analysis-tools-dev/static-analysis)
- [State of CSS 2025: Other Tools](https://2025.stateofcss.com/en-US/other-tools/)
- [ESLint CSS Support (2025)](https://eslint.org/blog/2025/02/eslint-css-support/)
