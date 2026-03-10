---
phase: 06-sintetizador-melhorias
plan: 06-001
type: feature
autonomous: true
wave: 1
depends_on: ["05-001", "05-002", "05-003"]
requirements: [MELH-05, MELH-06]
must_haves:
  truths:
    - "Agente up-sintetizador-melhorias.md existe com logica de deduplicacao cross-dimensao baseada em arquivo+linha+similaridade"
    - "Agente detecta e sinaliza conflitos entre dimensoes (ex: performance vs UX sugerindo acoes opostas no mesmo componente)"
    - "Agente define regra de dimensao primaria para findings multi-dimensao"
    - "Agente produz relatorio consolidado no formato exato do template report.md em .plano/melhorias/RELATORIO.md"
    - "Relatorio contem tabela de visao geral com totais por dimensao e quadrante, e secao de conflitos entre dimensoes"
  artifacts:
    - path: "up/agents/up-sintetizador-melhorias.md"
      provides: "Agente sintetizador especializado em cross-dimensao de melhorias"
    - path: "agents/up-sintetizador-melhorias.md"
      provides: "Copia local do agente para instalacao"
  key_links:
    - from: "up-sintetizador-melhorias.md"
      to: "up/templates/report.md"
      via: "Read tool carrega template no context_loading"
    - from: "up-sintetizador-melhorias.md"
      to: "up/templates/suggestion.md"
      via: "Read tool carrega formato de sugestao para validacao"
    - from: "up-sintetizador-melhorias.md"
      to: ".plano/melhorias/ux-sugestoes.md"
      via: "Read tool carrega sugestoes do auditor UX"
    - from: "up-sintetizador-melhorias.md"
      to: ".plano/melhorias/performance-sugestoes.md"
      via: "Read tool carrega sugestoes do auditor de performance"
    - from: "up-sintetizador-melhorias.md"
      to: ".plano/melhorias/modernidade-sugestoes.md"
      via: "Read tool carrega sugestoes do auditor de modernidade"
---

# Fase 6 Plano 1: Agente Sintetizador de Melhorias

**Objetivo:** Criar o agente `up-sintetizador-melhorias.md` que recebe sugestoes dos 3 auditores de dimensao (UX, Performance, Modernidade), deduplica, detecta conflitos cross-dimensao e produz relatorio consolidado com priorizacao na matriz esforco x impacto.

## Pesquisa Inline

**Agente existente `up-sintetizador.md`:** E dedicado exclusivamente a sintese de pesquisa do `/up:novo-projeto` (le STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md e produz SUMMARY.md). NAO pode ser reutilizado para melhorias -- proposito completamente diferente. Necessario criar agente novo `up-sintetizador-melhorias.md`.

**Input esperado (3 arquivos de sugestoes):**
- `.plano/melhorias/ux-sugestoes.md` -- frontmatter YAML (dimensao, data, stack, total_sugestoes, cobertura) + sugestoes UX-NNN no formato padrao + mapa de cobertura
- `.plano/melhorias/performance-sugestoes.md` -- frontmatter YAML (dimensao, data, stack, total_sugestoes, categorias por tipo) + sugestoes PERF-NNN no formato padrao + mapa de cobertura
- `.plano/melhorias/modernidade-sugestoes.md` -- frontmatter YAML (dimensao, data, stack, total_sugestoes, criticos/medios/baixos) + sugestoes MOD-NNN no formato padrao + mapa de cobertura

**Output esperado (template report.md):**
- Frontmatter YAML (projeto, data, stack, agentes, total_sugestoes, cobertura)
- Sumario Executivo (2-3 paragrafos, opinativo)
- Visao Geral (tabela dimensao x quadrante)
- Matriz 4 quadrantes (Quick Wins, Estrategicos, Preenchimentos, Evitar)
- Cobertura consolidada (uniao dos mapas)
- Conflitos entre dimensoes (com recomendacao)
- Proximos passos

**Regra de dimensao primaria (TODO do STATE.md):**
Quando um finding pertence a multiplas dimensoes (tag secundaria entre parenteses, ex: `Performance (UX)`, `Modernidade (Performance)`), a dimensao primaria e a que GEROU o finding (a primeira, sem parenteses). Na tabela de Visao Geral, o finding conta na dimensao primaria. O parentesco aparece no corpo da sugestao para contexto.

**Deteccao de duplicatas:**
Dois findings sao duplicatas cross-dimensao quando:
1. Mesmo arquivo (caminho exato)
2. Mesma linha ou linhas sobrepostas (ranges se interceptam)
3. Problema semanticamente similar (mesmo componente/funcao/padrao)

Ex: jQuery detectado como MOD-005 (obsoleto) e PERF-012 (bundle pesado) -- mesclado em uma unica sugestao com ambas dimensoes citadas.

**Deteccao de conflitos:**
Dois findings conflitam quando:
1. Mesmo arquivo ou componente
2. Acoes mutuamente exclusivas (ex: "remover animacao" vs "adicionar transicao suave")
Conflitos sao sinalizados na secao dedicada com recomendacao de resolucao.

## Contexto

@up/agents/up-sintetizador.md -- agente existente para pesquisa (NAO reutilizar, referencia de estilo e convencoes apenas)
@up/templates/report.md -- template de relatorio consolidado (output deste agente)
@up/templates/suggestion.md -- formato de sugestao individual (input que este agente recebe)
@up/agents/up-auditor-ux.md -- agente UX (entender formato de output em ux-sugestoes.md)
@up/agents/up-auditor-performance.md -- agente performance (entender formato de output em performance-sugestoes.md)
@up/agents/up-auditor-modernidade.md -- agente modernidade (entender formato de output em modernidade-sugestoes.md)

## Tarefas

<task id="1" type="auto">
<files>up/agents/up-sintetizador-melhorias.md</files>
<action>
Criar o agente `up/agents/up-sintetizador-melhorias.md` com a seguinte estrutura:

**Frontmatter YAML:**
```yaml
---
name: up-sintetizador-melhorias
description: Cruza sugestoes de auditores UX/Performance/Modernidade, deduplica, detecta conflitos e produz relatorio consolidado com priorizacao
tools: Read, Write, Bash, Grep, Glob
color: purple
---
```

**Estrutura de XML tags (seguir padrao dos agentes da Fase 5):**

1. `<role>` -- Identidade de sintetizador cross-dimensao. Explicar que recebe 3 arquivos de sugestoes e produz relatorio consolidado unico. Enfatizar: NAO e o sintetizador de pesquisa (up-sintetizador.md), e o sintetizador de MELHORIAS.

2. `<context_loading>` -- Step inicial obrigatorio para carregar:
   - `$HOME/.claude/up/templates/report.md` -- formato do relatorio de output
   - `$HOME/.claude/up/templates/suggestion.md` -- formato das sugestoes de input
   - `.plano/melhorias/ux-sugestoes.md` -- sugestoes do auditor UX
   - `.plano/melhorias/performance-sugestoes.md` -- sugestoes do auditor de performance
   - `.plano/melhorias/modernidade-sugestoes.md` -- sugestoes do auditor de modernidade
   - `./CLAUDE.md` -- contexto do projeto (se existir)

3. `<process>` com 6 steps:

   **Step 1: `parse_suggestions` -- Parsear todas as sugestoes**
   - Ler os 3 arquivos de sugestoes
   - Extrair frontmatter de cada um (total, stack, cobertura)
   - Parsear cada sugestao individual pelo padrao `### [ID]: [titulo]` seguido de tabela e campos texto
   - Montar lista unificada com campos: id_original, dimensao, arquivo, linha, problema, sugestao, esforco, impacto, referencia
   - Contar totais: UX=N, PERF=N, MOD=N
   - Se algum arquivo de sugestoes nao existir, registrar a dimensao como ausente e prosseguir com as disponiveis

   **Step 2: `dedup_cross_dimension` -- Deduplicar cross-dimensao (MELH-05)**
   - Para cada par de sugestoes de dimensoes DIFERENTES:
     a. Verificar se mesmo arquivo (caminho exato)
     b. Se sim, verificar se mesma linha ou linhas sobrepostas (range intersection)
     c. Se sim, ler os campos Problema e Sugestao e avaliar similaridade semantica
     d. Se os 3 criterios sao verdadeiros: MESCLAR
   - Regra de mesclagem:
     - Manter a sugestao com descricao mais completa (mais caracteres no campo Problema + Sugestao)
     - Adicionar ao campo Dimensao todas as dimensoes envolvidas: ex. `Modernidade (Performance)`
     - Dimensao primaria = a da sugestao mantida (a mais completa)
     - IDs descartados: registrar em nota no campo Problema: "Originalmente tambem detectado como [ID-descartado]"
     - Esforco: manter o MAIOR entre as sugestoes mescladas (conservador)
     - Impacto: manter o MAIOR entre as sugestoes mescladas (a sugestao importa em mais de uma dimensao)
   - Registrar quantas sugestoes foram mescladas e quais IDs foram descartados
   - Output: lista deduplicada com IDs renumerados sequencialmente (MELH-001, MELH-002, ...) mantendo referencia ao ID original entre parenteses

   **Step 3: `detect_conflicts` -- Detectar conflitos entre dimensoes (MELH-05)**
   - Para cada par de sugestoes de dimensoes DIFERENTES na lista deduplicada:
     a. Verificar se mesmo arquivo ou componente logicamente relacionado
     b. Verificar se as acoes sugeridas sao mutuamente exclusivas ou contraditoras
     c. Exemplos de conflito: "remover animacao CSS" (performance) vs "adicionar feedback visual com transicao" (UX); "remover dependencia X" (modernidade) vs "usar funcionalidade Y de X" (performance como workaround)
   - Para cada conflito detectado:
     - Registrar ambas as sugestoes envolvidas com IDs
     - Descrever a natureza do conflito
     - Fornecer recomendacao de resolucao (qual priorizar e por que, ou solucao que atende ambas)
   - Se nenhum conflito: registrar "Nenhum conflito detectado entre dimensoes" -- NAO forcar conflitos onde nao existem
   - Output: lista de conflitos com recomendacoes

   **Step 4: `classify_quadrants` -- Classificar nos 4 quadrantes (MELH-06)**
   - Aplicar regras de classificacao do template report.md:
     - Quick Wins: Esforco=P + Impacto=M ou G
     - Projetos Estrategicos: Esforco=M ou G + Impacto=M ou G (inclui empate M/M por Decisao #7)
     - Preenchimentos: Esforco=P + Impacto=P
     - Evitar: Esforco=M ou G + Impacto=P
   - Ordenar dentro de cada quadrante: Impacto decrescente (G antes de M), empate por Esforco crescente (P antes de M)
   - Contar totais por quadrante e por dimensao (tabela cruzada)
   - Verificar que soma dos quadrantes = total de sugestoes deduplicadas

   **Step 5: `build_report` -- Montar relatorio consolidado (MELH-06)**
   - Usar o formato EXATO do template report.md
   - Preencher frontmatter YAML: projeto (extrair de CLAUDE.md ou .plano/PROJECT.md ou usar nome do diretorio), data, stack (do frontmatter dos auditores), agentes (lista dos 3), total_sugestoes (pos-dedup), cobertura (uniao dos mapas de cobertura)
   - Escrever Sumario Executivo: 2-3 paragrafos OPINATIVOS -- recomendar por onde comecar, areas de maior preocupacao, estado geral do codebase
   - Preencher tabela Visao Geral (dimensao x quadrante): contar sugestoes por dimensao primaria e quadrante; totais na ultima linha devem bater
   - Preencher cada secao de quadrante com sugestoes no formato padrao de suggestion.md
   - Consolidar Cobertura: unir mapas dos 3 auditores, listar arquivos por diretorio, calcular porcentagem total (uniao de arquivos analisados / total de arquivos do projeto)
   - Preencher secao Conflitos entre Dimensoes (do step 3) ou omitir se nenhum conflito
   - Escrever Proximos Passos: 3-5 acoes concretas baseadas nos quick wins de maior impacto

   **Step 6: `write_output` -- Salvar e retornar**
   - Escrever `.plano/melhorias/RELATORIO.md` via Write tool
   - NAO sobrescrever os arquivos de sugestoes individuais -- eles permanecem como referencia

4. `<output_format>` -- Formato de retorno ao workflow chamador:
```markdown
## SINTESE DE MELHORIAS COMPLETA

**Sugestoes recebidas:** N (UX: X, Performance: Y, Modernidade: Z)
**Sugestoes apos dedup:** M (N-M mescladas)
**Conflitos detectados:** C
**Arquivo:** .plano/melhorias/RELATORIO.md

### Distribuicao por Quadrante
| Quadrante | Total |
|-----------|-------|
| Quick Wins | N |
| Projetos Estrategicos | N |
| Preenchimentos | N |
| Evitar | N |
```

5. `<critical_rules>` -- Regras inviolaveis (pelo menos 10):
   1. NUNCA descartar sugestao sem justificativa. Toda sugestao recebida deve aparecer em exatamente um quadrante ou ter sido mesclada com outra (com registro).
   2. Deduplicacao exige os 3 criterios: mesmo arquivo, linhas sobrepostas, problema semanticamente similar. NAO mesclar apenas por arquivo ou apenas por dimensao.
   3. Regra de dimensao primaria: a dimensao que GEROU o finding com descricao mais completa e a primaria. A(s) outra(s) aparecem entre parenteses.
   4. Conflitos exigem acoes MUTUAMENTE EXCLUSIVAS. Sugestoes complementares (ex: "otimizar CSS" e "modernizar CSS") NAO sao conflitos.
   5. Tabela de Visao Geral deve ter soma das colunas de quadrantes = coluna Total para cada linha.
   6. Sumario Executivo DEVE ser opinativo. Nao listar -- recomendar.
   7. Maximo 1 sugestao por bloco no relatorio (mesma regra dos auditores).
   8. IDs renumerados para MELH-NNN no relatorio consolidado, com ID original entre parenteses para rastreabilidade.
   9. Esforco e Impacto NUNCA mudam na classificacao exceto em mesclagem (onde se usa o MAIOR).
   10. Se arquivo de sugestoes de uma dimensao nao existir, prosseguir com as disponiveis e registrar dimensao ausente.
   11. Todo texto em PT-BR, tags XML em ingles (convencao UP).
   12. NUNCA ler ou citar conteudo de arquivos .env, credentials.*, *.key, *.pem.

6. `<success_criteria>` -- Checklist de auto-verificacao do agente:
   - Todos os arquivos de sugestoes disponiveis foram lidos
   - Deduplicacao cross-dimensao executada com registro de mesclagens
   - Conflitos analisados com recomendacao (ou ausencia registrada)
   - Todas as sugestoes classificadas em exatamente 1 quadrante
   - Tabela de Visao Geral com somas corretas
   - Sumario Executivo opinativo escrito
   - Cobertura consolidada presente
   - RELATORIO.md segue formato exato do template report.md
   - Retorno estruturado fornecido ao workflow chamador

**Tamanho alvo: 350-500 linhas** (similar aos auditores da Fase 5 que tem 378-426 linhas, mas este agente tem mais logica de processamento).

**IMPORTANTE: Seguir convencoes do codebase:**
- Frontmatter: tools como string separada por virgulas (nao array YAML)
- XML tags em ingles: `<role>`, `<process>`, `<step name="...">`, `<critical_rules>`, `<output_format>`, `<success_criteria>`
- Texto de interface em PT-BR
- Referenciar arquivos via Read tool (nao @-reference, pois e executado como subagente)
</action>
<verify>
<automated>
# Verificar existencia e tamanho minimo
test -f up/agents/up-sintetizador-melhorias.md && wc -l up/agents/up-sintetizador-melhorias.md | awk '{if ($1 >= 300) print "OK: "$1" linhas"; else print "FAIL: apenas "$1" linhas"}'

# Verificar frontmatter obrigatorio
head -10 up/agents/up-sintetizador-melhorias.md | grep -q "name: up-sintetizador-melhorias" && echo "OK: name" || echo "FAIL: name"
head -10 up/agents/up-sintetizador-melhorias.md | grep -q "tools:" && echo "OK: tools" || echo "FAIL: tools"
head -10 up/agents/up-sintetizador-melhorias.md | grep -q "color:" && echo "OK: color" || echo "FAIL: color"

# Verificar XML tags obrigatorias
grep -c '<role>' up/agents/up-sintetizador-melhorias.md | awk '{if ($1 >= 1) print "OK: role tag"; else print "FAIL: role tag"}'
grep -c '<process>' up/agents/up-sintetizador-melhorias.md | awk '{if ($1 >= 1) print "OK: process tag"; else print "FAIL: process tag"}'
grep -c 'parse_suggestions' up/agents/up-sintetizador-melhorias.md | awk '{if ($1 >= 1) print "OK: parse step"; else print "FAIL: parse step"}'
grep -c 'dedup_cross_dimension' up/agents/up-sintetizador-melhorias.md | awk '{if ($1 >= 1) print "OK: dedup step"; else print "FAIL: dedup step"}'
grep -c 'detect_conflicts' up/agents/up-sintetizador-melhorias.md | awk '{if ($1 >= 1) print "OK: conflict step"; else print "FAIL: conflict step"}'
grep -c 'classify_quadrants' up/agents/up-sintetizador-melhorias.md | awk '{if ($1 >= 1) print "OK: classify step"; else print "FAIL: classify step"}'
grep -c 'build_report' up/agents/up-sintetizador-melhorias.md | awk '{if ($1 >= 1) print "OK: report step"; else print "FAIL: report step"}'
grep -c 'write_output' up/agents/up-sintetizador-melhorias.md | awk '{if ($1 >= 1) print "OK: output step"; else print "FAIL: output step"}'
grep -c '<critical_rules>' up/agents/up-sintetizador-melhorias.md | awk '{if ($1 >= 1) print "OK: critical_rules"; else print "FAIL: critical_rules"}'

# Verificar mencoes de deduplicacao e conflito (MELH-05)
grep -c 'dedup' up/agents/up-sintetizador-melhorias.md | awk '{if ($1 >= 3) print "OK: dedup logic present"; else print "FAIL: dedup logic missing"}'
grep -c 'conflito' up/agents/up-sintetizador-melhorias.md | awk '{if ($1 >= 3) print "OK: conflict logic present"; else print "FAIL: conflict logic missing"}'

# Verificar mencoes do template report.md (MELH-06)
grep -c 'RELATORIO.md' up/agents/up-sintetizador-melhorias.md | awk '{if ($1 >= 2) print "OK: RELATORIO.md referenced"; else print "FAIL: RELATORIO.md not referenced"}'
grep -c 'report.md' up/agents/up-sintetizador-melhorias.md | awk '{if ($1 >= 1) print "OK: report template referenced"; else print "FAIL: report template not referenced"}'

# Verificar regra de dimensao primaria
grep -c 'dimensao primaria' up/agents/up-sintetizador-melhorias.md | awk '{if ($1 >= 1) print "OK: primary dimension rule"; else print "FAIL: primary dimension rule missing"}'

# Verificar quadrantes
grep -c 'Quick Wins' up/agents/up-sintetizador-melhorias.md | awk '{if ($1 >= 1) print "OK: Quick Wins quadrant"; else print "FAIL: Quick Wins missing"}'
grep -c 'Projetos Estrategicos' up/agents/up-sintetizador-melhorias.md | awk '{if ($1 >= 1) print "OK: Strategic quadrant"; else print "FAIL: Strategic missing"}'
</automated>
</verify>
<done>
- Arquivo `up/agents/up-sintetizador-melhorias.md` existe com 350-500 linhas
- Frontmatter valido com name, description, tools, color
- 6 steps no process: parse, dedup, conflicts, classify, build, write
- Logica de deduplicacao cross-dimensao com 3 criterios (arquivo, linha, similaridade semantica) implementada no step 2
- Logica de deteccao de conflitos com recomendacao de resolucao implementada no step 3
- Regra de dimensao primaria definida (finding mais completo e primario)
- Classificacao nos 4 quadrantes com regras exatas do template report.md
- Output em .plano/melhorias/RELATORIO.md no formato exato do template
- Pelo menos 10 regras criticas definidas
- IDs renumerados para MELH-NNN com rastreabilidade ao ID original
</done>
</task>

<task id="2" type="auto">
<files>agents/up-sintetizador-melhorias.md</files>
<action>
Copiar o arquivo `up/agents/up-sintetizador-melhorias.md` para `agents/up-sintetizador-melhorias.md` (copia local para instalacao, padrao seguido por todos os agentes UP).

Apos copiar, verificar que os dois arquivos sao identicos via diff. Se houver diferenca, copiar novamente.

Tambem verificar que o arquivo `up/agents/up-sintetizador-melhorias.md` nao referencia caminhos hardcoded (deve usar `$HOME/.claude/up/` para templates e references). Corrigir se necessario.

Finalmente, verificar que o agente NAO conflita com o `up-sintetizador.md` existente:
- Nome diferente (up-sintetizador-melhorias vs up-sintetizador)
- Description diferente (melhorias vs pesquisa)
- Proposito diferente (claramente separado)
</action>
<verify>
<automated>
# Verificar copia existe
test -f agents/up-sintetizador-melhorias.md && echo "OK: copia local existe" || echo "FAIL: copia local nao existe"

# Verificar arquivos identicos
diff up/agents/up-sintetizador-melhorias.md agents/up-sintetizador-melhorias.md > /dev/null 2>&1 && echo "OK: arquivos identicos" || echo "FAIL: arquivos diferem"

# Verificar que nao conflita com sintetizador existente
grep -q "up-sintetizador-melhorias" agents/up-sintetizador-melhorias.md && echo "OK: nome correto na copia" || echo "FAIL: nome errado"
grep -q "up-sintetizador$" up/agents/up-sintetizador.md && echo "OK: sintetizador original intacto" || echo "FAIL: sintetizador original alterado"

# Verificar caminhos usam $HOME
grep -c '\$HOME/.claude/up/' up/agents/up-sintetizador-melhorias.md | awk '{if ($1 >= 2) print "OK: usa $HOME paths"; else print "FAIL: caminhos hardcoded"}'
</automated>
</verify>
<done>
- Arquivo `agents/up-sintetizador-melhorias.md` existe e e identico a `up/agents/up-sintetizador-melhorias.md`
- Agente nao conflita com `up-sintetizador.md` existente (nomes e propositos distintos)
- Caminhos de referencia usam `$HOME/.claude/up/` (nao hardcoded)
</done>
</task>

## Criterios de Sucesso

- [ ] Agente `up-sintetizador-melhorias.md` criado com 350-500 linhas seguindo convencoes dos agentes UP
- [ ] Logica de deduplicacao cross-dimensao baseada em 3 criterios (arquivo, linha, similaridade) (MELH-05)
- [ ] Logica de deteccao de conflitos entre dimensoes com recomendacao de resolucao (MELH-05)
- [ ] Regra de dimensao primaria definida e documentada no agente (resolve TODO do STATE.md)
- [ ] Classificacao nos 4 quadrantes com regras do template report.md (MELH-06)
- [ ] Output em .plano/melhorias/RELATORIO.md no formato exato do template (MELH-06)
- [ ] Copia local em `agents/up-sintetizador-melhorias.md` identica a fonte canonica
- [ ] Agente nao conflita com `up-sintetizador.md` existente
