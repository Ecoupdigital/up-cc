<purpose>
UX Tester: navegar o sistema como um usuario real, avaliar a experiencia, e implementar melhorias automaticamente.

NAO e teste funcional (isso e o E2E). E um auditor de experiencia que USA o sistema e pensa:
- "Isso ta confuso"
- "Muitos cliques pra fazer algo simples"
- "Cadê o feedback?"
- "Isso ta lento"
- "Eu nao sei o que fazer nessa tela"

Dois modos:
- **Standalone:** `/up:ux-tester` — roda em qualquer projeto, qualquer momento
- **Builder:** roda no Estagio 4 (Polish) e implementa tudo automaticamente
</purpose>

<tools_required>
Ferramentas Playwright MCP:
- `browser_navigate` — navegar para URL
- `browser_snapshot` — capturar acessibilidade (para interagir)
- `browser_take_screenshot` — capturar visual (para avaliar)
- `browser_click` — clicar
- `browser_type` — digitar
- `browser_fill_form` — preencher formularios
- `browser_select_option` — selecionar opcao
- `browser_press_key` — teclar
- `browser_hover` — hover
- `browser_navigate_back` — voltar
- `browser_console_messages` — erros JS
- `browser_network_requests` — lentidao de APIs
- `browser_resize` — testar responsividade
- `browser_evaluate` — medir tempos, checar acessibilidade
- `browser_close` — fechar

Ferramentas de codigo:
- Read, Write, Edit, Glob, Grep, Bash — para implementar melhorias
</tools_required>

<process>

## Passo 1: Setup

### 1.1 Detectar Stack e Dev Server

```bash
# Detectar stack
if [ -f package.json ]; then
  node -e "const p=require('./package.json'); console.log(JSON.stringify({scripts: p.scripts, deps: Object.keys(p.dependencies||{}).slice(0,20)}))"
fi
```

Subir dev server em background:
```bash
[DEV_COMMAND] &
DEV_PID=$!
```

Esperar ficar pronto (max 30s):
```bash
for i in $(seq 1 30); do
  curl -s http://localhost:[PORT] > /dev/null 2>&1 && break
  sleep 1
done
```

Se nao subir: ERRO — "Dev server nao subiu. Verifique se as dependencias estao instaladas e as env vars configuradas."

### 1.2 Descobrir Fluxos do Sistema

**Opcao A — De REQUIREMENTS.md / PROJECT.md (se existir):**
Ler `.plano/PROJECT.md` e `.plano/REQUIREMENTS.md` para entender o que o sistema faz e quais sao os fluxos principais.

**Opcao B — De codigo (se nao ha .plano/):**
```bash
# Descobrir rotas
find . -name "page.tsx" -o -name "page.ts" 2>/dev/null | grep -v node_modules | head -20
find . -path "*/pages/*.tsx" -o -path "*/pages/*.ts" 2>/dev/null | grep -v node_modules | grep -v "_app\|_document" | head -20
```

**Opcao C — Navegando (fallback):**
Navegar para `/` e explorar links e navegacao.

### 1.3 Definir Personas

Criar 2-3 personas para os testes:

**Persona 1: Usuario Novo (primeira vez)**
- Nunca viu o sistema
- Nao sabe onde as coisas estao
- Espera que seja obvio o que fazer
- Testa: onboarding, clareza, primeiros passos

**Persona 2: Usuario Frequente (dia a dia)**
- Usa o sistema regularmente
- Quer eficiencia (poucos cliques)
- Testa: fluxos principais, atalhos, velocidade

**Persona 3: Usuario com Pressa (mobile/distraido)**
- Tela pequena ou multitask
- Quer resolver rapido
- Testa: responsividade, tamanho de alvos, hierarquia visual

### 1.4 Criar Diretorio de Resultados

```bash
mkdir -p .plano/ux-review/screenshots
```

## Passo 2: Navegacao como Usuario (6 Dimensoes)

Para cada fluxo principal do sistema, navegar como cada persona e avaliar:

### Dimensao 1: Clareza
**Pergunta:** "Eu sei o que fazer nessa tela?"

Para cada tela/pagina:
1. `browser_navigate(url)` → `browser_take_screenshot(filename: ".plano/ux-review/screenshots/[rota]-first-impression.png")`
2. `browser_snapshot()` — ler estrutura da pagina
3. Avaliar:
   - Existe um titulo/heading claro?
   - A hierarquia visual guia o olho? (tamanhos, cores, espacamento)
   - CTAs sao obvios? (botoes primarios vs secundarios)
   - Ha textos ambiguos? (ex: "Enviar" vs "Salvar Rascunho")
   - Labels dos forms sao descritivos?
   - Ha instrucoes ou tooltips onde necessario?
   - Estados vazios (empty states) explicam o que fazer?
4. Registrar problemas encontrados

### Dimensao 2: Eficiencia (Cliques)
**Pergunta:** "Quantos passos pra completar a tarefa?"

Para cada fluxo principal:
1. Contar cliques necessarios do inicio ao fim
2. Navegar o fluxo completo, registrando cada interacao
3. Avaliar:
   - Ha passos desnecessarios? (confirmacoes excessivas, paginas intermediarias)
   - Formularios poderiam ter defaults inteligentes?
   - Campos poderiam ser agrupados ou removidos?
   - Existe atalho para acoes frequentes?
   - Navegacao entre secoes e direta ou exige muitos cliques?
4. Calcular: cliques atuais vs cliques ideais

### Dimensao 3: Feedback
**Pergunta:** "O sistema me diz o que esta acontecendo?"

Para cada acao (submeter form, clicar botao, deletar):
1. Executar a acao
2. Avaliar imediatamente:
   - Ha loading indicator durante operacoes? (spinner, skeleton, progress)
   - Aparece mensagem de sucesso apos acao? (toast, banner, redirect)
   - Erros sao claros e acionaveis? ("Email invalido" vs "Erro 422")
   - Ha feedback visual ao clicar? (hover states, active states)
   - Transicoes sao suaves ou abruptas?
3. Testar erro proposital:
   - Submeter form vazio
   - Inserir dados invalidos
   - `browser_console_messages(level: "error")` — checar erros nao tratados

### Dimensao 4: Consistencia
**Pergunta:** "O sistema se comporta de forma previsivel?"

Navegar por TODAS as telas e comparar:
1. Botoes primarios sao sempre do mesmo estilo/cor?
2. Espacamento e tipografia sao consistentes?
3. Navegacao esta no mesmo lugar em todas as paginas?
4. Padroes de formulario sao iguais? (labels, validacao, botoes)
5. Icones significam a mesma coisa em contextos diferentes?
6. Terminologia e consistente? (nao mistura "Salvar/Enviar/Confirmar" pro mesmo conceito)

### Dimensao 5: Acessibilidade Basica
**Pergunta:** "Qualquer pessoa consegue usar?"

```javascript
// Rodar via browser_evaluate
browser_evaluate(function: "() => {
  const issues = [];
  // Imagens sem alt
  document.querySelectorAll('img:not([alt])').forEach(img => issues.push('img sem alt: ' + img.src));
  // Inputs sem label
  document.querySelectorAll('input:not([aria-label]):not([id])').forEach(i => issues.push('input sem label'));
  // Contraste (simplificado)
  // Botoes sem texto acessivel
  document.querySelectorAll('button:empty').forEach(b => issues.push('botao vazio'));
  // Links sem texto
  document.querySelectorAll('a:not([aria-label])').forEach(a => { if(!a.textContent.trim()) issues.push('link sem texto'); });
  return JSON.stringify(issues);
}")
```

Tambem:
- Tab navigation funciona? (pressionar Tab e ver se foco e visivel)
- Tamanho minimo de toque (44x44px para mobile)?
- Texto legivel? (min 14px body, min 12px labels)

### Dimensao 6: Performance Percebida
**Pergunta:** "Parece rapido?"

Para cada pagina:
```javascript
// Medir tempo de carregamento
browser_evaluate(function: "() => {
  const perf = performance.getEntriesByType('navigation')[0];
  return JSON.stringify({
    ttfb: Math.round(perf.responseStart - perf.requestStart),
    domReady: Math.round(perf.domContentLoadedEventEnd - perf.fetchStart),
    fullLoad: Math.round(perf.loadEventEnd - perf.fetchStart),
    lcp: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime
  });
}")
```

Checar network:
```
browser_network_requests(static: false, requestBody: false, requestHeaders: false)
```
- APIs > 1s: LENTO
- APIs > 3s: MUITO LENTO
- APIs falhando: BUG

Avaliar:
- Ha skeleton/placeholder enquanto carrega?
- Conteudo aparece progressivamente ou tudo de uma vez?
- Transicoes de pagina sao suaves?
- Ha jank visual (layout shifts)?

## Passo 3: Gerar Relatorio

Criar `.plano/ux-review/UX-REPORT.md`:

```markdown
---
tested: [timestamp]
server: [dev command] @ [port]
personas: 3
flows_tested: [N]
issues_found: [N]
quick_fixes: [N]
improvements: [N]
---

# Relatorio UX Review

## Resumo Executivo

[2-3 paragrafos: impressao geral do sistema, pontos fortes, areas criticas]

**Score Geral:** [1-10] (onde 1=inutilizavel, 10=experiencia impecavel)

| Dimensao | Score (1-10) | Issues |
|----------|-------------|--------|
| Clareza | [N] | [N] |
| Eficiencia | [N] | [N] |
| Feedback | [N] | [N] |
| Consistencia | [N] | [N] |
| Acessibilidade | [N] | [N] |
| Performance | [N] | [N] |

## Issues por Prioridade

### Criticas (Implementar Agora)
[Issues que prejudicam significativamente a experiencia]

#### UX-001: [Titulo do problema]
**Dimensao:** [qual]
**Tela:** [rota]
**Problema:** [descricao do que esta errado]
**Impacto:** [como afeta o usuario]
**Solucao:** [o que fazer para corrigir]
**Arquivo(s):** [caminhos dos arquivos a modificar]
**Screenshot:** screenshots/[nome].png
**Esforco:** P/M/G

### Importantes (Implementar Depois)
[Issues que incomodam mas nao bloqueiam]

### Menores (Nice to Have)
[Polimentos que melhoram a experiencia]

## Analise por Fluxo

### Fluxo: [Nome do Fluxo]
**Persona:** [qual persona testou]
**Cliques atuais:** [N]
**Cliques ideais:** [N]
**Tempo estimado:** [N] segundos

| Passo | Acao | Problema? | Screenshot |
|-------|------|-----------|------------|
| 1 | [acao] | [sim/nao - descricao] | [path] |
| 2 | [acao] | [sim/nao - descricao] | [path] |

## Performance por Pagina

| Pagina | TTFB | DOM Ready | Full Load | APIs Lentas |
|--------|------|-----------|-----------|-------------|
| / | [ms] | [ms] | [ms] | [N] |
| /dashboard | [ms] | [ms] | [ms] | [N] |

## Acessibilidade

| Problema | Quantidade | Paginas |
|----------|-----------|---------|
| Imagens sem alt | [N] | [lista] |
| Inputs sem label | [N] | [lista] |
| Botoes vazios | [N] | [lista] |
| Links sem texto | [N] | [lista] |
| Foco invisivel | [N] | [lista] |
```

## Passo 4: Implementar Melhorias

**NAO perguntar ao usuario.** Implementar TODAS as melhorias que sao seguras de aplicar.

### 4.1 Classificar Issues por Implementabilidade

| Tipo | Implementar? | Exemplos |
|------|-------------|----------|
| **Texto/copy** | SIM | Labels confusos, mensagens de erro genericas, CTAs ambiguos, empty states |
| **Feedback visual** | SIM | Adicionar loading states, toasts de sucesso, hover states, transicoes |
| **Acessibilidade** | SIM | Alt em imagens, labels em inputs, aria-labels, focus visible |
| **Espacamento/layout** | SIM | Padding, margin, gap, alinhamento, tamanho de fonte |
| **Consistencia** | SIM | Unificar cores de botoes, padronizar espacamento, terminologia |
| **Ordem de tabs** | SIM | tabIndex, autofocus em primeiro campo |
| **Defaults inteligentes** | SIM | Valores padrao em forms, selecao inicial |
| **Performance** | SIM | Lazy loading, debounce, memo, skeleton, suspense, caching |
| **Reestruturacao de fluxo** | SIM | Simplificar navegacao, reorganizar steps, reduzir cliques |
| **Novo componente** | SIM | Criar wizard, tour guiado, empty states ricos, confirmacao modal, search |
| **Ajuste de API** | SIM | Novo endpoint pra otimizar UX, ajustar response shape, adicionar paginacao |

**UNICA restricao:** NAO fazer mudancas que quebrem funcionalidade existente sem poder verificar. Especificamente:
- NAO deletar tabelas/colunas do banco
- NAO remover endpoints que outros sistemas consomem
- NAO alterar schemas de auth/sessao

**Para mudancas estruturais (novo componente, novo fluxo, ajuste de API):**
1. Implementar a mudanca
2. Verificar via Playwright que o fluxo afetado ainda funciona
3. Se quebrou: reverter via `git checkout -- [arquivos]` e registrar como "tentativa falha"
4. Se funcionou: commit e seguir

### 4.2 Executar Implementacao

Para cada issue implementavel (ordenada por prioridade: critica → importante → menor):

1. Ler arquivo(s) alvo
2. Implementar a correcao
3. Commit atomico: `ux({area}): {descricao da melhoria}`
4. Re-navegar a tela afetada para verificar
5. Screenshot "depois" para comparacao

```
UX-001: [descricao] → Implementado ✓
UX-002: [descricao] → Implementado ✓ (novo componente criado)
UX-003: [descricao] → Implementado ✓ (fluxo reestruturado)
UX-004: [descricao] → Falhou (revertido — quebrou funcionalidade X)
```

**Para mudancas estruturais (novo componente, novo fluxo, ajuste de API):**

1. Implementar a mudanca completa (componente, rota, API)
2. Re-navegar via Playwright para verificar que funciona
3. Se funciona: commit e continuar
4. Se quebrou algo: `git checkout -- [arquivos afetados]` para reverter e registrar como "tentativa falha — [motivo]"
5. Max 2 tentativas por mudanca estrutural

### 4.3 Atualizar Relatorio

Adicionar secao ao UX-REPORT.md:

```markdown
## Melhorias Implementadas

| ID | Melhoria | Arquivo(s) | Commit |
|----|----------|-----------|--------|
| UX-001 | [descricao] | [paths] | [hash] |
| UX-002 | [descricao] | [paths] | [hash] |

**Implementadas:** [N] de [M] issues
**Tentativas falhas (revertidas):** [N] (quebraram funcionalidade existente)

## Antes vs Depois

### UX-001: [Titulo]
| Antes | Depois |
|-------|--------|
| screenshots/ux-001-antes.png | screenshots/ux-001-depois.png |
```

## Passo 5: Cleanup

```bash
kill $DEV_PID 2>/dev/null
```

`browser_close()`

Apresentar resumo:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > UX REVIEW COMPLETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Score Geral:** [N]/10

| Dimensao | Score |
|----------|-------|
| Clareza | [N]/10 |
| Eficiencia | [N]/10 |
| Feedback | [N]/10 |
| Consistencia | [N]/10 |
| Acessibilidade | [N]/10 |
| Performance | [N]/10 |

**Issues encontradas:** [N]
**Melhorias implementadas:** [N] (incluindo [X] componentes novos, [Y] ajustes de fluxo)
**Tentativas falhas:** [N] (revertidas — ver relatorio)

Relatorio: .plano/ux-review/UX-REPORT.md
Screenshots: .plano/ux-review/screenshots/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</process>

<heuristics>
## Heuristicas de Avaliacao UX

### Clareza
- Heading H1 visivel em < 2s? Se nao → issue
- CTA primario e o elemento mais proeminente? Se nao → issue
- Form labels descrevem o que digitar? Se nao → issue
- Empty state diz o que fazer? Se nao → issue
- Mais de 3 acoes competindo por atencao na mesma area? → issue

### Eficiencia
- Fluxo principal leva > 5 cliques? → issue (meta: 3 cliques)
- Form tem > 6 campos visiveis de uma vez? → issue (agrupar em steps)
- Acao frequente requer > 2 cliques? → issue (considerar atalho)
- Navegacao principal tem > 7 items? → issue (agrupar)
- Busca/filtro ausente em lista > 10 items? → issue

### Feedback
- Acao sem resposta em < 200ms? → issue (adicionar loading)
- Operacao > 1s sem indicator? → issue critica
- Submissao sem mensagem de sucesso? → issue
- Erro generico ("Algo deu errado")? → issue (ser especifico)
- Nenhum estado de hover em elementos clicaveis? → issue

### Consistencia
- Mais de 2 estilos de botao primario? → issue
- Espacamento diferente entre secoes similares? → issue
- Mesmo conceito com nomes diferentes? → issue
- Icones usados inconsistentemente? → issue

### Acessibilidade
- Imagem sem alt text? → issue
- Input sem label associado? → issue
- Contraste < 4.5:1 em texto? → issue
- Alvo de clique < 44x44px em mobile? → issue
- Focus ring invisivel? → issue
- Pagina sem landmark regions? → issue

### Performance Percebida
- TTFB > 500ms? → warning
- Full load > 3s? → issue
- API response > 1s? → issue
- Layout shift visivel? → issue critica
- Sem skeleton/loading placeholder? → issue
</heuristics>

<failure_handling>
## Tratamento de Falhas

**Dev server nao sobe:**
Sair com erro claro e instrucoes de como subir manualmente.

**Pagina em branco:**
Checar console, registrar como issue critica de UX (usuario ve pagina em branco = pior experiencia possivel).

**Auth necessario:**
Tentar criar conta de teste ou usar seed data. Se nao conseguir: testar apenas paginas publicas.

**Componentes dinamicos nao carregam:**
Esperar ate 5s, retry snapshot. Se persistir: registrar como issue de performance.
</failure_handling>

<success_criteria>
- [ ] Dev server subiu
- [ ] Fluxos principais identificados
- [ ] Cada fluxo navegado como pelo menos 1 persona
- [ ] 6 dimensoes avaliadas com score
- [ ] Screenshots de cada tela e problema
- [ ] UX-REPORT.md gerado com issues priorizadas
- [ ] Issues implementaveis corrigidas com commits atomicos
- [ ] Screenshots antes/depois para melhorias implementadas
- [ ] Re-verificacao apos implementacao
- [ ] Dev server fechado
- [ ] Browser fechado
</success_criteria>
