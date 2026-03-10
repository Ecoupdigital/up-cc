---
phase: 10-integracao-roadmap
plan: 10-001
type: feature
autonomous: true
wave: 0
depends_on: []
requirements: [INTEG-01]
must_haves:
  truths:
    - "CLI aceita lista de sugestoes aprovadas e gera fases no ROADMAP.md"
    - "Fases geradas usam formato portugues identico ao ROADMAP existente (Fase, Objetivo, Criterios de Sucesso)"
    - "Sugestoes sao agrupadas em fases coerentes por dimensao e proximidade funcional"
    - "Fases geradas sao executaveis via /up:executar-fase sem adaptacao"
  artifacts:
    - path: "up/bin/up-tools.cjs"
      provides: "Novo subcomando phase generate-from-report com logica de agrupamento e escrita ROADMAP"
  key_links:
    - from: "up-tools.cjs cmdPhaseGenerateFromReport"
      to: ".plano/ROADMAP.md"
      via: "Leitura do RELATORIO.md + escrita de novas fases no ROADMAP"
    - from: "up-tools.cjs regex patterns"
      to: ".plano/ROADMAP.md"
      via: "Regex atualizado para suportar tanto Phase quanto Fase"
---

# Fase 10 Plano 001: CLI para geracao de fases a partir de sugestoes aprovadas

**Objetivo:** Criar subcomando CLI `phase generate-from-report` em up-tools.cjs que recebe sugestoes aprovadas de um RELATORIO.md e gera fases executaveis no ROADMAP.md, com agrupamento inteligente e formato portugues completo.

## Pesquisa Inline (achados)

1. **Regex `Phase` vs `Fase`:** Todas as funcoes de parsing do ROADMAP em up-tools.cjs (linhas 1104, 1115, 1139, 1149, 1328, 1570) e core.cjs (linha 211, 218) usam `Phase` (ingles) nos regex patterns, mas o ROADMAP.md deste projeto e de projetos UP em geral usam `Fase` (portugues). O `cmdPhaseAdd` (linha 1328) gera entradas em ingles (`### Phase N:`, `**Goal:**`). Isso precisa ser corrigido para suportar ambos idiomas.

2. **Formato do ROADMAP.md portugues** (observado no projeto atual):
   - Checkbox: `- [ ] **Fase N: Nome** - Descricao curta`
   - Header: `### Fase N: Nome`
   - Campos: `**Objetivo**:`, `**Depende de**:`, `**Requisitos**:`, `**Criterios de Sucesso**`, `**Planos**:`

3. **Formato de sugestao no RELATORIO.md:** Sugestoes tem ID (MELH-NNN ou IDEA-NNN), Arquivo, Linha, Dimensao, Esforco, Impacto, Problema, Sugestao. Organizadas em quadrantes (Quick Wins, Projetos Estrategicos, Preenchimentos, Evitar).

4. **`cmdPhaseAdd` existente (linha 1319-1363):** Calcula maxPhase via regex, cria diretorio, insere entrada simples no ROADMAP. Precisa extensao para suportar entradas ricas (com Objetivo, Criterios de Sucesso, etc.) e formato PT.

## Contexto

@up/bin/up-tools.cjs -- CLI principal, onde adicionar novo subcomando e corrigir regex
@up/bin/lib/core.cjs -- Helpers compartilhados, onde corrigir getRoadmapPhaseInternal regex
@up/templates/roadmap.md -- Template de referencia para formato de fases
@.plano/ROADMAP.md -- Exemplo real de ROADMAP em portugues
@up/templates/report.md -- Formato do RELATORIO.md que sera parseado
@up/templates/suggestion.md -- Formato das sugestoes individuais

## Tarefas

<task id="1" type="auto">
<files>up/bin/lib/core.cjs</files>
<files>up/bin/up-tools.cjs</files>
<action>
Corrigir todas as regex de parsing de ROADMAP para suportar tanto `Phase` quanto `Fase`:

**Em core.cjs (`getRoadmapPhaseInternal`, linha 211):**
- Mudar `Phase` para `(?:Phase|Fase)` no phasePattern (linha 211)
- Mudar `Phase` para `(?:Phase|Fase)` no nextHeaderMatch (linha 218)

**Em up-tools.cjs:**
- `cmdRoadmapGetPhase` (linha 1104): `Phase` -> `(?:Phase|Fase)`
- `cmdRoadmapGetPhase` (linha 1115): `Phase` -> `(?:Phase|Fase)`
- `cmdRoadmapAnalyze` (linha 1139): `Phase` -> `(?:Phase|Fase)`
- `cmdRoadmapAnalyze` (linha 1149): `Phase` -> `(?:Phase|Fase)`
- `cmdRoadmapAnalyze` (linha 1178): Tambem suportar `Fase` no checkbox pattern
- `cmdPhaseAdd` (linha 1328): `Phase` -> `(?:Phase|Fase)`
- `cmdPhaseComplete` area de regex (~linha 1491+): `Phase` -> `(?:Phase|Fase)`
- `cmdRoadmapUpdatePlanProgress` area de regex (~linha 1212+): verificar e corrigir
- `cmdPhasePlanIndex` (~linha 1570): `Phase` -> `(?:Phase|Fase)`

Padrao consistente: usar `(?:Phase|Fase)` em todas as regex que parsam headers de ROADMAP.

NAO mudar nomes de funcoes, parametros ou saida JSON. Apenas as regex internas.

Tambem atualizar `cmdPhaseAdd` (linha 1344) para detectar o idioma do ROADMAP antes de inserir. Se o ROADMAP contem `### Fase `, usar formato portugues (`### Fase N:`, `**Objetivo:**`). Se contem `### Phase `, usar formato ingles. Default: portugues.
</action>
<verify>
<automated>cd /home/projects/up-dev-code && node -e "
const fs = require('fs');
const code = fs.readFileSync('up/bin/up-tools.cjs', 'utf-8');
const core = fs.readFileSync('up/bin/lib/core.cjs', 'utf-8');

// Verificar que nao ha mais 'Phase\\\\s+' sem alternativa Fase
const purePhaseRegex = /Phase\\\\s\+/g;
const codeMatches = (code.match(/(?:Phase\|Fase)/g) || []).length;
const coreMatches = (core.match(/(?:Phase\|Fase)/g) || []).length;

console.log('up-tools.cjs Phase|Fase occurrences:', codeMatches);
console.log('core.cjs Phase|Fase occurrences:', coreMatches);

// Deve ter pelo menos 8 ocorrencias em up-tools.cjs e 2 em core.cjs
if (codeMatches < 8) { console.error('FALHOU: up-tools.cjs precisa de pelo menos 8 regex corrigidas'); process.exit(1); }
if (coreMatches < 2) { console.error('FALHOU: core.cjs precisa de pelo menos 2 regex corrigidas'); process.exit(1); }
console.log('PASSOU: Regex corrigidas em ambos arquivos');
"
</automated>
</verify>
<done>Todas as regex de parsing de ROADMAP suportam tanto "Phase" (EN) quanto "Fase" (PT). cmdPhaseAdd detecta idioma do ROADMAP e gera entrada no idioma correto.</done>
</task>

<task id="2" type="auto">
<files>up/bin/up-tools.cjs</files>
<action>
Adicionar novo subcomando `phase generate-from-report` em up-tools.cjs.

**1. Registrar no dispatcher (funcao main, ~linha 280-290):**
Adicionar case no switch de `phase`:
```javascript
case 'generate-from-report':
  cmdPhaseGenerateFromReport(cwd, args.slice(2), raw);
  break;
```

**2. Implementar `cmdPhaseGenerateFromReport(cwd, args, raw)`:**

**Input:** Recebe via stdin um JSON com:
```json
{
  "source": "melhorias" | "ideias",
  "report_path": ".plano/melhorias/RELATORIO.md" | ".plano/ideias/RELATORIO.md",
  "approved_ids": ["MELH-001", "MELH-003", "MELH-007"],
  "grouping": "auto" | "single"
}
```
Se nao receber JSON via stdin, aceitar args:
- args[0] = source ("melhorias" ou "ideias")
- args[1] = report_path
- args[2..] = approved_ids separados por virgula

**3. Logica de parseamento do RELATORIO.md:**

- Ler o arquivo report_path
- Extrair todas as sugestoes que estao nos approved_ids
- Para cada sugestao, extrair: ID, titulo, Arquivo, Dimensao, Esforco, Impacto, Problema, Sugestao
- Usar regex para parsear o formato de suggestion.md:
  ```
  ### [ID]: [titulo]
  | Campo | Valor |
  |-------|-------|
  | Arquivo | `caminho` |
  | Linha | N |
  | Dimensao | X |
  | Esforco | P/M/G |
  | Impacto | P/M/G |
  **Problema:** ...
  **Sugestao:** ...
  ```

**4. Logica de agrupamento (grouping="auto"):**

Agrupar sugestoes aprovadas em fases coerentes com estas regras:
- a) Agrupar por Dimensao primaria (UX, Performance, Modernidade, Codigo, Ideias)
- b) Dentro de cada dimensao, se houver 5+ sugestoes, subdividir por diretorio de arquivo (ex: `src/components/` vs `src/api/`)
- c) Cada grupo vira uma fase
- d) Se um grupo tem apenas 1 sugestao com Esforco=P, tentar mesclar com grupo adjacente da mesma dimensao
- e) Nome da fase: "[Dimensao]: [descricao sintetica do grupo]" (ex: "Performance: Otimizar re-renders e bundle size")
- Se grouping="single", todas as sugestoes viram uma unica fase

**5. Geracao de fases no ROADMAP.md:**

Para cada grupo/fase:
- Detectar idioma do ROADMAP (buscar `### Fase ` ou `### Phase `)
- Calcular proximo numero de fase (parsear ROADMAP para max phase number, usando regex `(?:Phase|Fase)`)
- Gerar entrada completa no formato correto:

Formato portugues:
```markdown
### Fase N: [Nome da fase]
**Objetivo**: Implementar [N] melhorias/ideias de [dimensao] identificadas pela auditoria
**Depende de**: Fase [ultima_existente]
**Criterios de Sucesso** (o que deve ser VERDADE):
  1. [Criterio derivado das sugestoes do grupo]
  2. [Criterio derivado das sugestoes do grupo]
**Planos**: TBD

Sugestoes incluidas:
- [ID1]: [titulo1] (Esforco: X, Impacto: Y)
- [ID2]: [titulo2] (Esforco: X, Impacto: Y)
```

Formato ingles (se ROADMAP usa Phase):
```markdown
### Phase N: [Nome da fase]
**Goal**: Implement [N] improvements/ideas for [dimension] identified by audit
**Depends on**: Phase [last_existing]
**Success Criteria** (what must be TRUE):
  1. [Criteria derived from group suggestions]
  2. [Criteria derived from group suggestions]
**Plans**: TBD

Included suggestions:
- [ID1]: [title1] (Effort: X, Impact: Y)
- [ID2]: [title2] (Effort: X, Impact: Y)
```

- Adicionar checkbox na secao "## Fases" / "## Phases": `- [ ] **Fase N: Nome** - Descricao curta`
- Adicionar linha na tabela de progresso: `| N. Nome | 0/? | Nao iniciado | - |`
- Criar diretorio da fase: `.plano/fases/{NN}-{slug}/` com `.gitkeep`

**6. Criterios de sucesso automaticos:**
- Para sugestoes de melhorias: "Sugestao MELH-NNN implementada: [titulo resumido]"
- Para sugestoes de ideias: "Feature IDEA-NNN implementada: [titulo resumido]"
- Maximo 5 criterios por fase; se mais sugestoes, usar "[N] sugestoes de [dimensao] implementadas conforme RELATORIO.md"

**7. Output JSON:**
```json
{
  "phases_created": [
    {
      "phase_number": 11,
      "name": "Performance: Otimizar re-renders e bundle size",
      "suggestion_count": 4,
      "suggestion_ids": ["MELH-001", "MELH-003", "MELH-005", "MELH-007"],
      "directory": ".plano/fases/11-performance-otimizar-re-renders-e-bundle-size/"
    }
  ],
  "total_phases": 2,
  "total_suggestions": 7,
  "roadmap_updated": true
}
```

**Convencoes a seguir:**
- Funcao nomeada `cmdPhaseGenerateFromReport` (padrao cmd*)
- Usar `error()` de core.cjs para falhas fatais
- Usar `output()` para resultado JSON
- Criar diretorios com `fs.mkdirSync({ recursive: true })`
- Ler stdin com `fs.readFileSync('/dev/stdin', 'utf-8')` envolto em try/catch (fallback para args)
- Separar secoes com `// --- Phase Generate From Report ---`
- Estilo: 2 espacos, aspas simples, ponto-e-virgula, sem trailing commas
</action>
<verify>
<automated>cd /home/projects/up-dev-code && node -e "
const fs = require('fs');
const code = fs.readFileSync('up/bin/up-tools.cjs', 'utf-8');

// Verificar que funcao existe
if (!code.includes('cmdPhaseGenerateFromReport')) {
  console.error('FALHOU: funcao cmdPhaseGenerateFromReport nao encontrada');
  process.exit(1);
}

// Verificar que esta registrada no dispatcher
if (!code.includes(\"'generate-from-report'\")) {
  console.error('FALHOU: subcomando generate-from-report nao registrado no dispatcher');
  process.exit(1);
}

// Verificar que funcao parseia sugestoes
if (!code.includes('approved_ids') && !code.includes('approvedIds')) {
  console.error('FALHOU: funcao nao referencia approved_ids');
  process.exit(1);
}

// Verificar que funcao detecta idioma
if (!code.includes('Fase') && !code.includes('fase')) {
  console.error('FALHOU: funcao nao detecta idioma portugues');
  process.exit(1);
}

console.log('PASSOU: cmdPhaseGenerateFromReport existe, registrada, e parseia sugestoes');
" && echo "Verificacao de estrutura OK"
</automated>
</verify>
<done>Subcomando `phase generate-from-report` implementado. Aceita lista de IDs aprovados, agrupa por dimensao/proximidade, gera fases completas no ROADMAP.md em formato PT/EN auto-detectado, cria diretorios de fase, e retorna JSON com fases criadas.</done>
</task>

## Criterios de Sucesso

- [ ] Regex de ROADMAP parsing suportam tanto "Phase" quanto "Fase" em up-tools.cjs e core.cjs
- [ ] `cmdPhaseAdd` detecta idioma do ROADMAP e gera entradas no idioma correto
- [ ] Novo subcomando `phase generate-from-report` registrado e funcional
- [ ] Subcomando parseia RELATORIO.md e extrai sugestoes por ID
- [ ] Sugestoes agrupadas em fases coerentes por dimensao
- [ ] Fases geradas com formato completo (Objetivo, Criterios de Sucesso, lista de sugestoes)
- [ ] Diretorios de fase criados com .gitkeep
- [ ] Checkbox e linha de progresso adicionados ao ROADMAP.md
