---
phase: 04-references-auditoria
plan: 04-001
type: feature
autonomous: true
wave: 1
depends_on: []
requirements: [INFRA-05]
must_haves:
  truths:
    - "Reference contem catalogo de anti-padroes de performance organizados por categoria com exemplos de codigo e solucoes"
    - "Categorias cobrem: re-renders, bundle, queries, assets, CSS, rede, configs, deps"
    - "Cada anti-padrao tem sinal detectavel em codigo (grep pattern ou heuristica) para o agente auditor"
    - "Reference inclui secao de deteccao de framework/stack para ajustar heuristicas de performance"
  artifacts:
    - path: "up/references/audit-performance.md"
      provides: "Catalogo de anti-padroes de performance com exemplos, sinais de deteccao e solucoes por categoria"
  key_links:
    - from: "audit-performance.md"
      to: "up/templates/suggestion.md"
      via: "Agente auditor de performance (Fase 5) le o reference e produz sugestoes no formato do template"
---

# Fase 4 Plano 1: Reference de Performance

**Objetivo:** Criar o documento de referencia `up/references/audit-performance.md` que serve como catalogo de anti-padroes de performance para o agente auditor (Fase 5). O agente usara este catalogo para analise sistematica em vez de depender de conhecimento ad-hoc, garantindo cobertura consistente e reproduzivel.

## Contexto

@up/references/checkpoints.md -- Exemplo de reference existente (formato com XML tags semanticas: `<overview>`, `<type>`, `<anti_patterns>`, etc.)
@up/references/verification-patterns.md -- Exemplo mais proximo: catalogo de padroes organizados por tipo com grep patterns e checklists
@up/templates/suggestion.md -- Formato de saida que o agente produzira (campo Dimensao = "Performance", campos Arquivo/Linha/Problema/Sugestao/Esforco/Impacto)
@up/references/ui-brand.md -- Referencia de estilo para UP references

## Pesquisa de Dominio

O reference deve cobrir anti-padroes de performance detectaveis via analise estatica de codigo (sem rodar o app). O agente auditor de Fase 5 vai ler arquivos fonte e comparar contra estes padroes. As categorias obrigatorias sao:

1. **Re-renders** (React/Vue): componentes re-renderizando desnecessariamente
2. **Bundle** (todos): deps pesadas, falta de tree-shaking, imports nao-otimizados
3. **Queries** (backend): N+1, falta de paginacao, queries sem indice
4. **Assets** (todos): imagens nao-otimizadas, falta de lazy loading, fontes bloqueantes
5. **CSS** (todos): seletores pesados, layout thrashing, forced reflows
6. **Rede** (todos): waterfalls, falta de cache, payloads grandes
7. **Configs** (todos): source maps em prod, falta de minificacao, configs de dev em prod
8. **Deps** (todos): dependencias pesadas com alternativas leves

Para cada padrao, o reference deve fornecer:
- Nome do anti-padrao
- Sinal de deteccao: regex ou heuristica que o agente pode usar via Grep/Read
- Exemplo de codigo ruim (antes)
- Exemplo de codigo bom (depois/solucao)
- Frameworks afetados (para pular padroes irrelevantes)
- Estimativa de impacto tipico (P/M/G) para alinhar com template de sugestao

## Tarefas

<task id="1" type="auto">
<files>up/references/audit-performance.md</files>
<action>
Criar o arquivo `up/references/audit-performance.md` seguindo o formato de references UP existentes (XML tags semanticas como estrutura, markdown como conteudo).

**Estrutura obrigatoria do arquivo:**

1. `<overview>` -- Proposito do reference, como o agente deve usa-lo, link ao template de sugestao

2. `<stack_detection>` -- Secao de deteccao de framework/stack (INFRA-05). Deve conter:
   - Instrucoes para detectar React vs Vue vs Svelte vs vanilla JS (checar package.json, imports, extensoes de arquivo)
   - Instrucoes para detectar Next.js vs Nuxt vs SvelteKit vs SPA pura (checar configs, pastas especiais)
   - Instrucoes para detectar Tailwind vs Bootstrap vs CSS puro (checar configs, imports, classes)
   - Instrucoes para detectar ORM (Prisma, Drizzle, Sequelize, TypeORM) vs queries raw
   - Formato: para cada framework, listar o sinal de deteccao (arquivo ou padrao que confirma presenca) e quais categorias de anti-padrao sao relevantes
   - Exemplo: "Se `react` em package.json dependencies -> habilitar categoria re-renders; se `next` em dependencies -> habilitar tambem SSR patterns"

3. `<category name="re-renders">` -- Anti-padroes de re-render. Minimo 5 padroes. Incluir:
   - Inline object/array literals em props (`style={{}}`, `options={[]}`)
   - Funcoes anonimas em props (`onClick={() => fn()}`)
   - Falta de React.memo em componentes de lista
   - Estado no componente pai que causa re-render em filhos
   - Falta de useMemo/useCallback em computacoes caras
   - Marcar como "React/Vue only" onde aplicavel

4. `<category name="bundle">` -- Anti-padroes de bundle. Minimo 5 padroes. Incluir:
   - Import direto de biblioteca inteira (`import _ from 'lodash'` vs `import debounce from 'lodash/debounce'`)
   - Dependencias pesadas com alternativas leves (moment->date-fns/dayjs, lodash->lodash-es, axios->fetch nativo)
   - Falta de dynamic import / code splitting para rotas
   - Dependencias dev em dependencies (vs devDependencies)
   - Import de polyfills desnecessarios para targets modernos

5. `<category name="queries">` -- Anti-padroes de queries/dados. Minimo 4 padroes. Incluir:
   - N+1 queries (loop com query dentro)
   - Falta de paginacao em listagens
   - SELECT * / findMany sem select de campos
   - Falta de indice em campos usados em WHERE/ORDER

6. `<category name="assets">` -- Anti-padroes de assets. Minimo 4 padroes. Incluir:
   - Imagens sem dimensoes explicitas (causa CLS)
   - Falta de lazy loading em imagens abaixo do fold
   - Fontes customizadas sem font-display
   - SVGs inline grandes que poderiam ser componentes importados

7. `<category name="css">` -- Anti-padroes de CSS. Minimo 4 padroes. Incluir:
   - Seletores universais caros (`*`, `div *`)
   - Layout thrashing (leitura + escrita alternada de propriedades de layout em JS)
   - Animacoes nao-composited (animando width/height/top/left em vez de transform/opacity)
   - CSS nao-utilizado em bundles grandes

8. `<category name="network">` -- Anti-padroes de rede. Minimo 4 padroes. Incluir:
   - Fetch waterfall (requests sequenciais que poderiam ser paralelos)
   - Falta de cache headers em respostas de API
   - Payloads JSON grandes sem paginacao
   - Falta de compressao (gzip/brotli) em server config

9. `<category name="configs">` -- Anti-padroes de configuracao. Minimo 3 padroes. Incluir:
   - Source maps habilitados em build de producao
   - Console.log em codigo de producao (sem tree-shake de logs)
   - Variaveis de ambiente de dev hardcoded em codigo (localhost em prod)

10. `<category name="deps">` -- Anti-padroes de dependencias pesadas. Minimo 4 padroes. Incluir:
    - Tabela de dependencias comuns pesadas com alternativas leves (moment.js, lodash, jQuery, axios, classnames vs clsx)
    - Dependencias abandonadas (last publish > 2 anos como heuristica)
    - Multiplas libs para o mesmo proposito (ex: moment + date-fns no mesmo projeto)
    - Dependencias com vulnerabilidades conhecidas (sinal: npm audit output)

**Para cada anti-padrao dentro de cada categoria, usar este formato consistente:**

```markdown
### [NOME-DO-ANTIPADRAO]

**Frameworks:** [React, Vue, All, Next.js, etc. -- ou "All" se universal]
**Impacto tipico:** [P/M/G] -- alinhado com escala de suggestion.md
**Sinal de deteccao:**
\`\`\`bash
# Grep pattern ou heuristica para o agente encontrar este padrao
grep -rn "padrao" src/ --include="*.tsx"
\`\`\`

**Exemplo ruim:**
\`\`\`typescript
// Codigo problematico com comentario explicando o problema
\`\`\`

**Solucao:**
\`\`\`typescript
// Codigo corrigido com comentario explicando a melhoria
\`\`\`
```

**Regras de escrita:**
- Texto em portugues brasileiro (nomes de secoes, descricoes) mas exemplos de codigo em ingles (nomes de variaveis, imports)
- Usar XML tags semanticas para estrutura (`<overview>`, `<stack_detection>`, `<category name="X">`)
- Cada categoria deve ter uma breve intro antes dos padroes
- Sinais de deteccao devem ser comandos grep/heuristica reais que funcionam
- Nao inventar padroes obscuros -- focar nos anti-padroes mais comuns e impactantes que um agente de analise estatica pode detectar em codebases reais
- O arquivo resultante deve ter entre 400-600 linhas (profundo o suficiente para ser util, curto o suficiente para caber no contexto do agente)
</action>
<verify>
<automated>
# Verificar estrutura e conteudo minimo do reference
FILE="up/references/audit-performance.md"
test -f "$FILE" && \
grep -q "<overview>" "$FILE" && \
grep -q "<stack_detection>" "$FILE" && \
grep -q '<category name="re-renders">' "$FILE" && \
grep -q '<category name="bundle">' "$FILE" && \
grep -q '<category name="queries">' "$FILE" && \
grep -q '<category name="assets">' "$FILE" && \
grep -q '<category name="css">' "$FILE" && \
grep -q '<category name="network">' "$FILE" && \
grep -q '<category name="configs">' "$FILE" && \
grep -q '<category name="deps">' "$FILE" && \
grep -q "Sinal de deteccao" "$FILE" && \
grep -q "Exemplo ruim" "$FILE" && \
grep -q "Solucao" "$FILE" && \
grep -c "### " "$FILE" | xargs -I{} test {} -ge 30 && \
echo "PASS: audit-performance.md validado" || echo "FAIL: estrutura incompleta"
</automated>
</verify>
<done>
- Arquivo `up/references/audit-performance.md` existe com todas as 8 categorias obrigatorias
- Cada categoria contem no minimo o numero de padroes especificado (total >= 35 anti-padroes)
- Cada anti-padrao tem: frameworks afetados, impacto tipico, sinal de deteccao (grep/heuristica), exemplo ruim, solucao
- Secao `<stack_detection>` cobre React/Vue/Svelte, Next/Nuxt/SvelteKit, Tailwind/Bootstrap/CSS puro, ORMs
- Formato segue convencao de references UP (XML tags semanticas, markdown como conteudo, texto em PT-BR)
</done>
</task>

## Criterios de Sucesso

- [ ] Reference contem catalogo de anti-padroes de performance organizados por 8 categorias
- [ ] Cada anti-padrao tem sinal de deteccao automatizavel (grep pattern ou heuristica)
- [ ] Exemplos de codigo ruim e solucao presentes para cada padrao
- [ ] Secao de deteccao de framework/stack presente e funcional (INFRA-05)
- [ ] Formato alinhado com references UP existentes (XML tags semanticas)
