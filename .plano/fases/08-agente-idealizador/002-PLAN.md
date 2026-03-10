---
phase: 08-agente-idealizador
plan: 08-002
type: feature
autonomous: true
wave: 2
depends_on: ["08-001"]
requirements: [IDEIA-04, IDEIA-05]
must_haves:
  truths:
    - "Agente up-consolidador-ideias recebe sugestoes de ambos agentes e aplica score ICE (Impact x Confidence x Ease, escala 1-10) a cada sugestao"
    - "Score ICE e calculado com formula transparente e justificativa por dimensao para cada sugestao"
    - "Para cada 3 sugestoes positivas, pelo menos 1 anti-feature e gerada (feature que NAO deve ser implementada, com justificativa)"
    - "Consolidador deduplica sugestoes entre analista de codigo e pesquisador de mercado quando se referem a mesma feature"
    - "Relatorio consolidado em .plano/ideias/RELATORIO.md usa formato do template report.md adaptado para ideias com secao ICE e anti-features"
  artifacts:
    - path: "up/agents/up-consolidador-ideias.md"
      provides: "Agente que consolida sugestoes dos 2 agentes, aplica ICE scoring, gera anti-features e produz relatorio final"
    - path: "agents/up-consolidador-ideias.md"
      provides: "Copia local do agente para instalacao"
  key_links:
    - from: "up-consolidador-ideias.md"
      to: ".plano/ideias/codigo-sugestoes.md"
      via: "Read tool carrega sugestoes do analista de codigo"
    - from: "up-consolidador-ideias.md"
      to: ".plano/ideias/mercado-sugestoes.md"
      via: "Read tool carrega sugestoes do pesquisador de mercado"
    - from: "up-consolidador-ideias.md"
      to: "up/templates/report.md"
      via: "Read tool carrega template de relatorio para formato base"
    - from: "up-consolidador-ideias.md"
      to: "up/templates/suggestion.md"
      via: "Read tool carrega formato de sugestao para validacao e anti-features"
---

# Fase 8 Plano 2: Agente Consolidador de Ideias

**Objetivo:** Criar o agente `up-consolidador-ideias` que recebe sugestoes dos 2 agentes idealizadores (analista de codigo + pesquisador de mercado), deduplica, aplica score ICE a cada sugestao para priorizacao objetiva, gera anti-features proporcionais e produz relatorio consolidado em `.plano/ideias/RELATORIO.md`.

## Contexto

@up/agents/up-sintetizador-melhorias.md -- Referencia principal: agente consolidador existente (mesmo padrao de input/dedup/output, adaptado para ideias)
@up/templates/report.md -- Template de relatorio consolidado (base para adaptar com secoes ICE e anti-features)
@up/templates/suggestion.md -- Template de sugestao (formato de input e output)

## Pesquisa de Dominio

**Padrao do sintetizador de melhorias (up-sintetizador-melhorias.md) como referencia:**
O sintetizador de melhorias segue: parse sugestoes -> deduplicar cross-dimensao -> detectar conflitos -> classificar em quadrantes -> montar relatorio. O consolidador de ideias seguira padrao similar mas com diferencas chave:

| Aspecto | Sintetizador Melhorias | Consolidador Ideias |
|---------|----------------------|---------------------|
| Input | 3 arquivos (UX, performance, modernidade) | 2 arquivos (codigo, mercado) |
| Dedup | Cross-dimensao (mesmo arquivo+linha+problema) | Cross-fonte (mesma feature proposta) |
| Priorizacao | Matriz esforco x impacto (4 quadrantes) | ICE scoring (Impact x Confidence x Ease, 1-10) |
| Extra | Conflitos entre dimensoes | Anti-features obrigatorias |
| IDs | MELH-NNN | IDEA-NNN (mantidos, nao renumerados -- ja sao IDEA-NNN) |
| Output | .plano/melhorias/RELATORIO.md | .plano/ideias/RELATORIO.md |

**ICE Scoring (IDEIA-04):**
ICE = Impact x Confidence x Ease (cada dimensao 1-10).
- **Impact (Impacto):** Quanto a feature beneficia o usuario final. 1=marginal, 5=notavel, 10=transformador.
- **Confidence (Confianca):** Quao certo estamos de que a feature tera o impacto esperado. 1=especulacao, 5=baseado em tendencia, 10=concorrentes provam demanda.
- **Ease (Facilidade):** Quao facil e implementar dado o codebase atual. 1=reescrever modulo inteiro, 5=novo componente/endpoint, 10=config/flag simples.
- **Score total:** Impact x Confidence x Ease (max 1000).
- Mapeamento de Esforco P/M/G do template -> Ease: P=8, M=5, G=2 (inversao -- esforco baixo = facilidade alta).
- Mapeamento de Impacto P/M/G do template -> Impact: P=3, M=6, G=9.
- Confidence: derivado da fonte -- analise de codigo puro=5, concorrente confirmado=8, tendencia sem validacao=3.

**Anti-features (IDEIA-05):**
Proporcao: 1 anti-feature para cada 3 sugestoes positivas (arredondando para cima).
- Se 10 sugestoes positivas: 4 anti-features (ceil(10/3) = 4).
- Anti-feature = feature que parece atrativa mas NAO deve ser implementada.
- Justificativa obrigatoria: por que NAO implementar (complexidade desproporcional, foge do escopo, fragmenta experiencia, etc.)
- Formato: mesmo template suggestion.md mas com tag `[ANTI-FEATURE]` no titulo e Impacto negativo (P/M/G = quanto dano faria se implementada).

**Adaptacao do template report.md para ideias:**
O consolidador adapta o template existente:
- Substituir "Melhorias" por "Ideias" no titulo
- Substituir quadrantes (Quick Wins etc.) por ranking ICE (Top por score, ordenado decrescente)
- Adicionar secao "Anti-Features" apos as sugestoes positivas
- Manter secao de deduplicacao cross-fonte
- Manter sumario executivo opinativo
- Manter proximos passos

## Tarefas

<task id="1" type="auto">
<files>up/agents/up-consolidador-ideias.md</files>
<files>agents/up-consolidador-ideias.md</files>
<action>
Criar o arquivo `up/agents/up-consolidador-ideias.md` (fonte canonica) e copiar identico para `agents/up-consolidador-ideias.md` (instalacao local).

**Frontmatter:**
```yaml
---
name: up-consolidador-ideias
description: Consolida sugestoes de features dos agentes analista-codigo e pesquisador-mercado. Aplica ICE scoring, gera anti-features e produz relatorio final.
tools: Read, Write, Bash, Grep, Glob
color: purple
---
```
- Tools: Read para ler sugestoes e templates, Write para salvar relatorio, Grep/Glob/Bash para auxiliar.
- NAO precisa de WebSearch/WebFetch (consolidacao e offline).
- Color `purple` para alinhar com up-sintetizador-melhorias (mesmo tipo de trabalho: consolidacao).

**Corpo do agente -- seguir estrutura do up-sintetizador-melhorias.md como modelo:**

1. `<role>` -- Definir papel: consolidador de ideias que recebe sugestoes de 2 fontes (analise de codigo e pesquisa de mercado), deduplica, aplica score ICE para priorizacao objetiva, gera anti-features e produz relatorio consolidado.
   - Voce NAO e o sintetizador de melhorias (up-sintetizador-melhorias.md) -- aquele consolida melhorias de auditoria.
   - Voce NAO e o sintetizador de pesquisa (up-sintetizador.md) -- aquele sintetiza pesquisa do /up:novo-projeto.
   - Input: 2 arquivos em .plano/ideias/ (codigo-sugestoes.md e mercado-sugestoes.md)
   - Output: 1 relatorio em .plano/ideias/RELATORIO.md
   - Inclui regra CRITICA de leitura inicial de `<files_to_read>`.

2. `<context_loading>` -- Step inicial obrigatorio:
   - Carregar template: `$HOME/.claude/up/templates/report.md` (formato base)
   - Carregar template: `$HOME/.claude/up/templates/suggestion.md` (formato de sugestao)
   - Carregar `.plano/ideias/codigo-sugestoes.md` (sugestoes do analista de codigo)
   - Carregar `.plano/ideias/mercado-sugestoes.md` (sugestoes do pesquisador de mercado)
   - Carregar `./CLAUDE.md` (se existir -- contexto do projeto)
   - Se algum arquivo de sugestoes nao existir: registrar fonte como ausente e prosseguir. Minimo 1 fonte necessaria.

3. `<process>` com 6 steps:

   **Step 1 (parse_suggestions):** Parsear todas as sugestoes.
   - Extrair frontmatter de cada arquivo (dimensao, fonte, data, stack, total_sugestoes, etc.)
   - Parsear sugestoes individuais pelo padrao `### IDEA-NNN: [titulo]`
   - Para cada sugestao extrair: id, arquivo, linha, problema, sugestao, esforco, impacto, referencia
   - Validar contagens (parseadas vs declaradas no frontmatter)
   - Registrar totais por fonte:
     ```
     Analise de codigo: N sugestoes
     Pesquisa de mercado: M sugestoes
     Total bruto: N+M sugestoes
     Fontes ausentes: [lista ou "nenhuma"]
     ```

   **Step 2 (dedup_cross_source):** Deduplicar cross-fonte.
   Sugestoes de fontes diferentes podem propor a MESMA feature. Criterios de duplicata (AMBOS devem ser verdadeiros):
   a. **Mesma feature proposta:** As sugestoes descrevem funcionalidade equivalente ou muito similar (ex: ambas sugerem "adicionar busca" ou "adicionar autenticacao OAuth")
   b. **Sobreposicao de escopo:** As features se resolveriam com a mesma implementacao

   Regra de mesclagem:
   - Manter a sugestao com descricao mais completa (mais caracteres em Problema + Sugestao)
   - Adicionar informacao da outra fonte ao campo Problema: "Tambem identificado por [pesquisa de mercado|analise de codigo]: [contexto adicional]"
   - Manter o MAIOR Impacto e o MAIOR Esforco entre as duas (abordagem conservadora)
   - ID: manter o da sugestao mantida, notar o descartado

   **Step 3 (ice_scoring):** Aplicar ICE scoring a cada sugestao.
   Para CADA sugestao (apos dedup), calcular:

   **Impact (1-10):** Baseado no campo Impacto + contexto
   - P (Pequeno) do template -> base 3 (ajustar -1 a +1 pelo contexto)
   - M (Medio) do template -> base 6 (ajustar -1 a +1 pelo contexto)
   - G (Grande) do template -> base 9 (ajustar -1 a +1 pelo contexto)
   - Contexto: feature resolve dor real? atende muitos usuarios? diferencial competitivo?

   **Confidence (1-10):** Baseado na fonte e evidencia
   - Analise de codigo puro (gap obvio sem validacao de mercado) -> base 5
   - Pesquisa de mercado com concorrente confirmado -> base 8
   - Pesquisa de mercado com tendencia apenas -> base 4
   - Ambas fontes concordam (sobreviveu a dedup mas ambas fontes sugerem) -> base 9
   - LOW confidence sinalizado pelo pesquisador -> base 2

   **Ease (1-10):** Inversao do campo Esforco + contexto
   - P (Pequeno) do template -> base 8 (facil de implementar)
   - M (Medio) do template -> base 5
   - G (Grande) do template -> base 2 (dificil de implementar)
   - Contexto: infraestrutura ja existe? ponto de extensao claro? dependencia necessaria?

   **Score total:** Impact x Confidence x Ease (escala 1-1000)

   Para cada sugestao, adicionar ao bloco:
   ```markdown
   **ICE Score:** [total] (I:[impact] x C:[confidence] x E:[ease])
   **Justificativa ICE:** Impact=[valor] porque [razao]. Confidence=[valor] porque [razao]. Ease=[valor] porque [razao].
   ```

   **Step 4 (anti_features):** Gerar anti-features.
   Contagem: ceil(total_sugestoes_positivas / 3)
   - Se 10 sugestoes: 4 anti-features
   - Se 7 sugestoes: 3 anti-features
   - Se 4 sugestoes: 2 anti-features

   Para cada anti-feature:
   - Analisar o dominio do projeto e as sugestoes geradas
   - Identificar features que parecem atrativas mas que NAO devem ser implementadas
   - Categorias comuns de anti-features:
     a. **Scope creep:** Feature que expande o projeto para alem do foco central
     b. **Complexidade desproporcional:** Feature com esforco G e impacto P que parece "legal" mas nao justifica
     c. **Fragmentacao de experiencia:** Feature que dividiria atencao/UX sem beneficio claro
     d. **Reinvencao da roda:** Feature onde usar servico/lib externo e claramente melhor que implementar
     e. **Armadilha de manutencao:** Feature que criaria divida tecnica desproporcional ao valor

   Formato de cada anti-feature (usar suggestion.md adaptado):
   ```markdown
   ### [ANTI] IDEA-ANT-NNN: [titulo da feature que NAO implementar]

   | Campo | Valor |
   |-------|-------|
   | Arquivo | N/A |
   | Linha | N/A |
   | Dimensao | Ideias [ANTI-FEATURE] |
   | Esforco | P / M / G (quanto custaria se implementada) |
   | Impacto | P / M / G (quanto DANO faria -- distorcao de foco, manutencao, complexidade) |

   **Por que parece atrativa:** [razao pela qual alguem poderia querer implementar]

   **Por que NAO implementar:** [justificativa concreta -- ex: foge do core, servico externo resolve melhor, retorno nao justifica custo]

   **Alternativa (se aplicavel):** [o que fazer em vez disso -- ex: usar servico X, delegar para plugin, manter como configuracao do usuario]
   ```

   Anti-features NAO recebem ICE score (sao recomendacoes negativas, nao priorizaveis).

   **Step 5 (build_report):** Montar relatorio consolidado.
   Adaptar formato do template report.md para ideias:

   Frontmatter YAML:
   ```yaml
   ---
   projeto: [nome do projeto]
   data: YYYY-MM-DD
   dominio: [dominio do projeto]
   agentes: [up-analista-codigo, up-pesquisador-mercado]
   total_sugestoes: N (positivas)
   total_anti_features: M
   cobertura: [do analista de codigo]
   ---
   ```

   Secoes do relatorio (nesta ordem):
   1. **Titulo:** `# Relatorio de Ideias: [Nome do Projeto]`
   2. **Sumario Executivo:** 2-3 paragrafos OPINATIVOS. Recomendar as top 3 features por ICE score. Mencionar dominio e concorrentes analisados. Terminar com recomendacao clara.
   3. **Visao Geral:** Tabela com contagens por fonte e categoria.
      | Fonte | Sugestoes | Top ICE (>400) | Medio ICE (100-400) | Baixo ICE (<100) |
      |-------|-----------|----------------|---------------------|-------------------|
      | Analise de Codigo | N | N | N | N |
      | Pesquisa de Mercado | N | N | N | N |
      | **Total** | **N** | **N** | **N** | **N** |
   4. **Ranking por ICE Score:** Todas as sugestoes positivas ordenadas por score ICE decrescente. Cada sugestao no formato padrao suggestion.md + campos ICE Score e Justificativa ICE.
   5. **Anti-Features:** Todas as anti-features no formato definido no Step 4. Incluir header: "Features que NAO devem ser implementadas neste projeto."
   6. **Deduplicacao:** Se houve mesclagens, listar: "IDEA-X + IDEA-Y -> IDEA-Z (razao)"
   7. **Proximos Passos:** 3-5 acoes concretas baseadas nas sugestoes com maior ICE score.

   **Step 6 (write_output):** Salvar e retornar.
   - Criar diretorio: `mkdir -p .plano/ideias`
   - Escrever `.plano/ideias/RELATORIO.md` com conteudo montado no Step 5
   - NUNCA sobrescrever arquivos de sugestoes individuais
   - Retornar resumo estruturado

4. `<output_format>` -- Formato de retorno ao workflow:
   ```markdown
   ## CONSOLIDACAO DE IDEIAS COMPLETA

   **Sugestoes recebidas:** N (codigo: X, mercado: Y)
   **Sugestoes apos dedup:** M (N-M mescladas)
   **Anti-features geradas:** K
   **Top 3 ICE:** IDEA-NNN (score), IDEA-NNN (score), IDEA-NNN (score)
   **Arquivo:** .plano/ideias/RELATORIO.md
   ```

5. `<critical_rules>` -- Regras inviolaveis:
   1. NUNCA descartar sugestao sem justificativa (toda sugestao aparece no ranking ou foi mesclada com registro)
   2. ICE scoring DEVE ter justificativa por dimensao (Impact/Confidence/Ease) para cada sugestao -- sem scores "magicos"
   3. Anti-features sao OBRIGATORIAS na proporcao ceil(positivas/3) -- nunca omitir
   4. Anti-features DEVEM ter justificativa concreta de POR QUE nao implementar
   5. Deduplicacao cross-fonte exige ambos criterios: mesma feature E sobreposicao de escopo
   6. Sumario executivo DEVE ser opinativo -- recomendar por onde comecar, nao apenas listar
   7. IDs mantidos como IDEA-NNN (nao renumerar para MELH-NNN -- ideias tem seu proprio namespace)
   8. Score ICE e transparente: mostrar I:N x C:N x E:N = total para cada sugestao
   9. Ranking por ICE decrescente (maior score primeiro)
   10. Se arquivo de sugestoes de uma fonte nao existir, prosseguir com a disponivel. Minimo 1 fonte necessaria.
   11. Todo texto em PT-BR, tags XML em ingles
   12. NUNCA ler/citar conteudo de .env, credentials.*, *.key, *.pem

6. `<success_criteria>` -- Checklist de auto-verificacao antes de retornar:
   - [ ] Ambos arquivos de sugestoes lidos e parseados (ou ausencia registrada)
   - [ ] Deduplicacao cross-fonte executada
   - [ ] ICE score calculado para TODAS as sugestoes positivas com justificativa
   - [ ] Anti-features geradas na proporcao correta (ceil(positivas/3))
   - [ ] Relatorio segue formato adaptado do template report.md
   - [ ] Sugestoes ordenadas por ICE score decrescente
   - [ ] Sumario executivo opinativo com top 3 recomendacoes
   - [ ] RELATORIO.md salvo em .plano/ideias/
   - [ ] Arquivos de sugestoes individuais NAO foram modificados
   - [ ] Retorno estruturado fornecido ao workflow chamador
</action>
<verify>
<automated>
# Verificar existencia e estrutura basica
test -f up/agents/up-consolidador-ideias.md && test -f agents/up-consolidador-ideias.md && echo "PASS: Files exist" || echo "FAIL: Missing files"

# Verificar frontmatter obrigatorio
head -10 up/agents/up-consolidador-ideias.md | grep -q "name: up-consolidador-ideias" && echo "PASS: Name correct" || echo "FAIL: Name missing"
head -10 up/agents/up-consolidador-ideias.md | grep -q "tools:" && echo "PASS: Tools defined" || echo "FAIL: Tools missing"
head -10 up/agents/up-consolidador-ideias.md | grep -q "color:" && echo "PASS: Color defined" || echo "FAIL: Color missing"

# Verificar tags XML semanticas essenciais
grep -q "<role>" up/agents/up-consolidador-ideias.md && echo "PASS: role tag" || echo "FAIL: role tag missing"
grep -q "<process>" up/agents/up-consolidador-ideias.md && echo "PASS: process tag" || echo "FAIL: process tag missing"
grep -q "<critical_rules>" up/agents/up-consolidador-ideias.md && echo "PASS: critical_rules tag" || echo "FAIL: critical_rules tag missing"
grep -q "<output_format>" up/agents/up-consolidador-ideias.md && echo "PASS: output_format tag" || echo "FAIL: output_format tag missing"

# Verificar steps essenciais
grep -q "ice_scoring\|ICE.*scoring\|ICE Score" up/agents/up-consolidador-ideias.md && echo "PASS: ICE scoring step" || echo "FAIL: ICE scoring missing"
grep -q "anti_features\|anti-feature\|ANTI-FEATURE\|Anti-Feature" up/agents/up-consolidador-ideias.md && echo "PASS: anti-features step" || echo "FAIL: anti-features missing"
grep -q "dedup_cross_source\|dedup.*cross\|Deduplicar" up/agents/up-consolidador-ideias.md && echo "PASS: dedup step" || echo "FAIL: dedup missing"
grep -q "build_report\|relatorio" up/agents/up-consolidador-ideias.md && echo "PASS: report building step" || echo "FAIL: report step missing"

# Verificar ICE formula
grep -q "Impact.*Confidence.*Ease\|I:.*C:.*E:" up/agents/up-consolidador-ideias.md && echo "PASS: ICE formula present" || echo "FAIL: ICE formula missing"

# Verificar anti-feature proporcao
grep -q "ceil\|3 sugestoes\|cada 3" up/agents/up-consolidador-ideias.md && echo "PASS: Anti-feature ratio defined" || echo "FAIL: Anti-feature ratio missing"

# Verificar referencia ao template
grep -q "report.md" up/agents/up-consolidador-ideias.md && echo "PASS: References report.md" || echo "FAIL: No reference to report.md"
grep -q "suggestion.md" up/agents/up-consolidador-ideias.md && echo "PASS: References suggestion.md" || echo "FAIL: No reference to suggestion.md"

# Verificar input files
grep -q "codigo-sugestoes.md" up/agents/up-consolidador-ideias.md && echo "PASS: References codigo-sugestoes.md" || echo "FAIL: No reference to codigo-sugestoes.md"
grep -q "mercado-sugestoes.md" up/agents/up-consolidador-ideias.md && echo "PASS: References mercado-sugestoes.md" || echo "FAIL: No reference to mercado-sugestoes.md"

# Verificar output dir
grep -q ".plano/ideias/RELATORIO.md" up/agents/up-consolidador-ideias.md && echo "PASS: Output path correct" || echo "FAIL: Output path wrong"

# Verificar que copias sao identicas
diff up/agents/up-consolidador-ideias.md agents/up-consolidador-ideias.md && echo "PASS: Files identical" || echo "FAIL: Files differ"
</automated>
</verify>
<done>
- Arquivo up/agents/up-consolidador-ideias.md existe com frontmatter valido
- Agente tem 6 steps: parse_suggestions, dedup_cross_source, ice_scoring, anti_features, build_report, write_output
- ICE scoring aplicado a cada sugestao com formula transparente (I:N x C:N x E:N = total) e justificativa por dimensao
- Anti-features geradas na proporcao ceil(positivas/3) com justificativa de por que NAO implementar
- Relatorio consolidado salvo em .plano/ideias/RELATORIO.md com ranking por ICE score decrescente
- Deduplicacao cross-fonte para features propostas por ambos agentes
- Copia identica em agents/up-consolidador-ideias.md
</done>
</task>

## Criterios de Sucesso

- [ ] up/agents/up-consolidador-ideias.md criado com 6 steps e formato padrao de agente UP
- [ ] ICE scoring definido com formula (Impact x Confidence x Ease, 1-10 cada, max 1000)
- [ ] Anti-features obrigatorias com proporcao ceil(positivas/3) e formato definido
- [ ] Deduplicacao cross-fonte com 2 criterios (mesma feature + sobreposicao de escopo)
- [ ] Relatorio adaptado do template report.md com ranking ICE e secao anti-features
- [ ] Copia identica em agents/ para instalacao local
