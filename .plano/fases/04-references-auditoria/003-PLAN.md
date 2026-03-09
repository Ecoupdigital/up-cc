---
phase: 04-references-auditoria
plan: 04-003
type: feature
autonomous: true
wave: 1
depends_on: []
requirements: [INFRA-05]
must_haves:
  truths:
    - "Reference contem heuristicas de UX traduzidas para sinais detectaveis em codigo (CSS, componentes, fluxos)"
    - "Heuristicas cobrem: consistencia visual, feedback ao usuario, formularios, navegacao, responsividade, hierarquia visual, acessibilidade basica"
    - "Cada heuristica tem sinal detectavel em codigo (grep/heuristica em CSS, componentes, HTML) para o agente auditor"
    - "Reference inclui secao de deteccao de framework/stack para ajustar heuristicas de UX (Tailwind vs CSS puro, React vs Vue)"
  artifacts:
    - path: "up/references/audit-ux.md"
      provides: "Catalogo de heuristicas UX com sinais de deteccao em codigo, exemplos de problemas e solucoes"
  key_links:
    - from: "audit-ux.md"
      to: "up/templates/suggestion.md"
      via: "Agente auditor de UX (Fase 5) le o reference e produz sugestoes no formato do template"
---

# Fase 4 Plano 3: Reference de UX

**Objetivo:** Criar o documento de referencia `up/references/audit-ux.md` que serve como catalogo de heuristicas de UX traduzidas para sinais detectaveis em codigo para o agente auditor de UX (Fase 5). Diferente de UX heuristics tradicionais (que requerem interacao com a interface), este reference foca em sinais que podem ser detectados via analise estatica de CSS, componentes, e estrutura de fluxos.

## Contexto

@up/references/checkpoints.md -- Exemplo de reference existente (formato com XML tags semanticas)
@up/references/verification-patterns.md -- Exemplo de catalogo de padroes organizados por tipo
@up/templates/suggestion.md -- Formato de saida que o agente produzira (campo Dimensao = "UX")
@up/references/ui-brand.md -- Referencia de estilo para UP references

## Pesquisa de Dominio

O desafio central deste reference e traduzir heuristicas de UX (normalmente avaliadas visualmente) em sinais detectaveis via analise estatica de codigo. O agente NAO tem acesso visual a interface -- ele so le arquivos. Portanto, cada heuristica deve ser expressa como padrao de codigo detectavel.

Exemplos de traducao:
- "Feedback visual apos acao" -> Procurar handlers de click/submit que NAO setam estado de loading/success/error
- "Hierarquia visual clara" -> Verificar se h1 existe e h1-h6 sao usados em ordem
- "Formularios amigaveis" -> Verificar labels associados a inputs, validacao inline, mensagens de erro
- "Responsividade" -> Verificar media queries ou classes responsivas (sm:/md:/lg: em Tailwind)
- "Consistencia visual" -> Verificar uso de design tokens/variaveis CSS vs cores hardcoded

As categorias devem cobrir as heuristicas de Nielsen traduzidas para sinais de codigo:
1. **Visibilidade do status** -> loading states, progress indicators, feedback de acoes
2. **Consistencia** -> design tokens, variaveis CSS, padrao de espacamento
3. **Prevencao de erros** -> validacao de formularios, confirmacao de acoes destrutivas
4. **Reconhecimento** -> labels, placeholders, textos auxiliares, empty states
5. **Flexibilidade** -> responsividade, temas, preferencias de usuario
6. **Estetica** -> hierarquia visual, whitespace, tipografia
7. **Recuperacao de erros** -> mensagens de erro, retry, undo

## Tarefas

<task id="1" type="auto">
<files>up/references/audit-ux.md</files>
<action>
Criar o arquivo `up/references/audit-ux.md` seguindo o formato de references UP existentes (XML tags semanticas como estrutura, markdown como conteudo).

**Estrutura obrigatoria do arquivo:**

1. `<overview>` -- Proposito do reference, a abordagem de traduzir heuristicas UX em sinais de codigo, limitacoes (analise estatica nao substitui testes com usuarios). Explicar que o agente le CSS/SCSS, componentes (TSX/JSX/Vue/Svelte), e HTML/templates para detectar problemas.

2. `<stack_detection>` -- Secao de deteccao de framework/stack (INFRA-05). Deve conter:
   - Deteccao de CSS framework: Tailwind (tailwind.config), Bootstrap (bootstrap import), CSS Modules (*.module.css), Styled Components (styled import), CSS puro
   - Deteccao de component framework: React (JSX/TSX), Vue (SFC .vue), Svelte (.svelte), vanilla HTML
   - Deteccao de UI library: Radix, shadcn/ui, Material UI, Ant Design, Chakra UI (sinais em package.json ou imports)
   - Deteccao de form library: React Hook Form, Formik, VeeValidate, nenhuma
   - Para cada deteccao: listar quais heuristicas se aplicam e como ajustar os sinais de deteccao
   - Exemplo: "Se Tailwind detectado -> procurar classes responsivas (sm:, md:, lg:) em vez de media queries em CSS; se CSS puro -> procurar @media em stylesheets"
   - Exemplo: "Se shadcn/ui detectado -> componentes de feedback (Toast, Alert) ja disponiveis, verificar se sao usados; se nenhuma UI lib -> verificar implementacao manual de feedback"

3. `<category name="feedback-status">` -- Visibilidade do status do sistema. Minimo 5 heuristicas. Incluir:
   - Handlers de submit/click sem estado de loading (sinal: onClick/onSubmit sem useState de isLoading ou pending state)
   - Fetch/mutations sem tratamento de loading state (sinal: useEffect/useQuery sem estado de carregamento)
   - Acoes destrutivas sem confirmacao (sinal: delete/remove handlers sem modal/confirm/dialog)
   - Falta de feedback de sucesso apos acoes (sinal: handlers de API que nao mostram toast/alert/message)
   - Falta de empty states (sinal: listas renderizadas com `.map()` mas sem condicional para array vazio)
   - Falta de skeleton/placeholder durante loading (sinal: condicional de loading que mostra apenas texto "Carregando..." sem skeleton)

4. `<category name="consistencia">` -- Consistencia e padroes. Minimo 5 heuristicas. Incluir:
   - Cores hardcoded em vez de variaveis CSS / design tokens (sinal: `color: #xxx` ou `bg-[#xxx]` repetidos em multiplos arquivos)
   - Espacamento inconsistente (sinal: valores de padding/margin variados sem padrao em CSS; em Tailwind: mistura de p-2, p-3, p-4 sem logica)
   - Multiplos tamanhos de fonte sem escala tipografica (sinal: font-size variando sem `--font-*` custom properties ou classes de texto padronizadas)
   - Bordas e sombras inconsistentes (sinal: valores de border-radius e box-shadow variando entre componentes)
   - Botoes sem estilo padrao (sinal: `<button>` ou `type="submit"` sem classe de estilo, ou botoes com estilos inline variados)

5. `<category name="formularios">` -- Prevencao de erros e formularios. Minimo 5 heuristicas. Incluir:
   - Inputs sem label associada (sinal: `<input>` sem `<label htmlFor>` ou `aria-label`)
   - Formularios sem validacao client-side (sinal: `<form>` com onSubmit mas sem schema validation ou checks antes de submit)
   - Mensagens de erro genericas (sinal: texto de erro hardcoded tipo "Erro" ou "Invalido" sem contexto)
   - Campos required sem indicacao visual (sinal: `required` attribute mas sem `*` ou texto indicativo visivel)
   - Falta de autocomplete em campos comuns (sinal: inputs de email/phone/address sem atributo `autocomplete`)
   - Botao de submit sem disabled durante loading (sinal: `<button type="submit">` sem `disabled={isLoading}` ou equivalente)

6. `<category name="navegacao">` -- Reconhecimento e navegacao. Minimo 4 heuristicas. Incluir:
   - Links sem indicacao visual de destino (sinal: `<a>` ou `<Link>` sem texto descritivo, so icone ou "clique aqui")
   - Falta de breadcrumbs em apps com hierarquia (sinal: rotas aninhadas `/a/b/c` sem componente Breadcrumb)
   - Paginas sem titulo (sinal: ausencia de `<title>`, `<Head>`, ou `metadata.title` em Next.js App Router)
   - Falta de 404 page (sinal: ausencia de `not-found.tsx` em Next.js, ou rota catch-all)
   - Tab order quebrado (sinal: `tabIndex` com valores positivos, ou elementos interativos sem tabIndex quando necessario)

7. `<category name="responsividade">` -- Flexibilidade e responsividade. Minimo 4 heuristicas. Incluir:
   - Falta de meta viewport (sinal: ausencia de `<meta name="viewport">` em HTML)
   - Larguras fixas em pixels (sinal: `width: XXXpx` em containers principais, sem max-width ou media queries)
   - Falta de breakpoints responsivos (sinal: ausencia de media queries em CSS ou classes responsivas em Tailwind)
   - Imagens sem max-width (sinal: `<img>` sem `max-width: 100%` ou classe responsiva; em Tailwind sem `w-full` ou `max-w-*`)
   - Falta de suporte a dark mode quando framework suporta (sinal: Tailwind configurado sem classes `dark:`, ou CSS sem `prefers-color-scheme`)

8. `<category name="hierarquia-visual">` -- Estetica e hierarquia visual. Minimo 4 heuristicas. Incluir:
   - Heading levels pulados (sinal: h1 seguido de h3 sem h2, ou pagina sem h1)
   - Excesso de texto sem quebra visual (sinal: paragrafos longos sem headings, listas ou spacers entre eles em componentes de conteudo)
   - Falta de whitespace (sinal: containers com padding zero ou minimo, elementos sem gap/space-between)
   - Contraste insuficiente em texto (sinal: texto com cor clara em fundo claro, detectavel via analise de valores hex em CSS -- heuristica aproximada)

9. `<category name="erros-recuperacao">` -- Recuperacao de erros. Minimo 3 heuristicas. Incluir:
   - Catch blocks sem UI de erro (sinal: try/catch ou .catch() que nao seta estado de erro para exibicao ao usuario)
   - Error boundaries ausentes em React (sinal: ausencia de `componentDidCatch` ou `ErrorBoundary` component em app React)
   - Falta de retry em operacoes de rede (sinal: fetch/mutation sem logica de retry ou botao de "tentar novamente")
   - Pagina de erro generica (sinal: error page sem informacao util ou acao de recuperacao)

**Para cada heuristica dentro de cada categoria, usar este formato consistente:**

```markdown
### [NOME-DA-HEURISTICA]

**Heuristica de Nielsen:** [Qual heuristica de usabilidade corresponde]
**Frameworks:** [React, Vue, All, Tailwind, CSS puro, etc.]
**Impacto tipico:** P / M / G
**Sinal de deteccao:**
\`\`\`bash
# Grep pattern ou heuristica para o agente detectar este problema
# NOTA: indicar se precisa de logica alem de grep (ex: "verificar se componente X importa Y")
grep -rn "padrao" src/ --include="*.tsx"
\`\`\`

**Problema em codigo:**
\`\`\`tsx
// Exemplo de codigo que tem o problema de UX, com comentario explicando o impacto no usuario
\`\`\`

**Solucao:**
\`\`\`tsx
// Codigo melhorado com comentario explicando a melhoria de UX
\`\`\`

**Limitacao:** [Explicar quando este sinal pode dar false positive/negative -- essencial para heuristicas de UX via analise estatica]
```

**Regras de escrita:**
- Texto em portugues brasileiro (nomes de secoes, descricoes) mas exemplos de codigo em ingles (nomes de variaveis, imports)
- Usar XML tags semanticas para estrutura (`<overview>`, `<stack_detection>`, `<category name="X">`)
- Cada categoria deve ter uma breve intro antes das heuristicas
- Sinais de deteccao devem ser comandos grep/heuristica reais que funcionam, mas DEVEM incluir campo "Limitacao" reconhecendo que analise estatica de UX e inerentemente imprecisa
- Focar em sinais que tem alta probabilidade de indicar problema real (poucos false positives)
- Quando o sinal requer logica alem de grep (ex: "verificar se componente que faz fetch tambem tem loading state"), descrever a logica que o agente deve seguir
- Referenciar "Heuristica de Nielsen" correspondente em cada padrao para dar credibilidade e contexto
- O arquivo resultante deve ter entre 400-600 linhas
- NAO incluir heuristicas que so podem ser avaliadas visualmente (ex: "cores harmonicas", "layout equilibrado") -- apenas sinais detectaveis em codigo
</action>
<verify>
<automated>
# Verificar estrutura e conteudo minimo do reference
FILE="up/references/audit-ux.md"
test -f "$FILE" && \
grep -q "<overview>" "$FILE" && \
grep -q "<stack_detection>" "$FILE" && \
grep -q '<category name="feedback-status">' "$FILE" && \
grep -q '<category name="consistencia">' "$FILE" && \
grep -q '<category name="formularios">' "$FILE" && \
grep -q '<category name="navegacao">' "$FILE" && \
grep -q '<category name="responsividade">' "$FILE" && \
grep -q '<category name="hierarquia-visual">' "$FILE" && \
grep -q '<category name="erros-recuperacao">' "$FILE" && \
grep -q "Heuristica de Nielsen" "$FILE" && \
grep -q "Sinal de deteccao" "$FILE" && \
grep -q "Limitacao" "$FILE" && \
grep -c "### " "$FILE" | xargs -I{} test {} -ge 25 && \
echo "PASS: audit-ux.md validado" || echo "FAIL: estrutura incompleta"
</automated>
</verify>
<done>
- Arquivo `up/references/audit-ux.md` existe com todas as 7 categorias obrigatorias
- Cada categoria contem no minimo o numero de heuristicas especificado (total >= 30 heuristicas)
- Cada heuristica tem: heuristica de Nielsen correspondente, frameworks, impacto tipico, sinal de deteccao, exemplo de problema, solucao, limitacao
- Secao `<stack_detection>` cobre CSS framework (Tailwind/Bootstrap/CSS puro), component framework (React/Vue/Svelte), UI library, form library
- Formato segue convencao de references UP (XML tags semanticas, markdown como conteudo, texto em PT-BR)
- Todas as heuristicas sao detectaveis via analise estatica de codigo (nenhuma requer interacao visual)
</done>
</task>

## Criterios de Sucesso

- [ ] Reference contem heuristicas de UX traduzidas para sinais detectaveis em codigo, organizadas por 7 categorias
- [ ] Cada heuristica referencia a heuristica de Nielsen correspondente
- [ ] Sinais de deteccao sao realistas para analise estatica (grep/heuristica) com campo de limitacao explicito
- [ ] Secao de deteccao de framework/stack presente com ajuste para Tailwind vs CSS puro (INFRA-05)
- [ ] Formato alinhado com references UP existentes (XML tags semanticas)
