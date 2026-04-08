<purpose>
Teste E2E via Playwright MCP para o modo builder. Abre o browser real, navega pelas funcionalidades, interage com a UI, tira screenshots e registra bugs encontrados.

Usado em dois momentos:
1. **Por fase** (Estagio 3): Testa funcionalidades da fase recem-executada
2. **Final completo** (Estagio 5): Smoke test de todas as rotas + fluxos E2E principais

Autonomo: NAO pergunta ao usuario. Se encontra bug, tenta corrigir (max 1 tentativa por bug).
</purpose>

<tools_available>
Ferramentas Playwright MCP disponiveis:
- `browser_navigate` — navegar para URL
- `browser_snapshot` — capturar acessibilidade da pagina (melhor que screenshot para acoes)
- `browser_take_screenshot` — capturar imagem da pagina (evidencia visual)
- `browser_click` — clicar em elemento (por ref do snapshot)
- `browser_type` — digitar texto em campo
- `browser_fill_form` — preencher multiplos campos de formulario
- `browser_select_option` — selecionar opcao em dropdown
- `browser_press_key` — pressionar tecla
- `browser_hover` — hover em elemento
- `browser_navigate_back` — voltar pagina
- `browser_console_messages` — ver logs do console (erros JS)
- `browser_network_requests` — ver requisicoes de rede (APIs falhando)
- `browser_evaluate` — executar JS na pagina
- `browser_run_code` — executar snippet Playwright completo
- `browser_tabs` — gerenciar abas
- `browser_resize` — redimensionar browser
- `browser_close` — fechar browser
</tools_available>

<process>

## Passo 1: Subir Dev Server

Detectar como subir o servidor baseado na stack:

```bash
# Detectar comando de dev
if [ -f package.json ]; then
  # Checar scripts disponiveis
  node -e "const p=require('./package.json'); console.log(JSON.stringify(p.scripts||{}))"
fi
```

| Stack | Comando | Porta tipica |
|-------|---------|-------------|
| Next.js | `pnpm dev` ou `npm run dev` | 3000 |
| Vite/React | `pnpm dev` ou `npm run dev` | 5173 |
| Python/FastAPI | `uvicorn main:app --reload` | 8000 |
| Python/Flask | `flask run` | 5000 |

Subir servidor em background:
```bash
# Rodar em background e esperar ficar pronto
cd [project_dir]
[DEV_COMMAND] &
DEV_PID=$!
```

Esperar servidor estar pronto:
```bash
# Tentar ate 30 segundos
for i in $(seq 1 30); do
  curl -s http://localhost:[PORT] > /dev/null 2>&1 && break
  sleep 1
done
```

Se nao subir em 30s: registrar como falha, pular testes E2E.

Definir `$BASE_URL` = `http://localhost:[PORT]`

## Passo 2: Descobrir Rotas/Paginas

**Opcao A — Inferir de PLANs/SUMMARYs (preferido):**

Ler SUMMARYs da fase e extrair rotas criadas:
- Procurar padroes: `route.ts`, `page.tsx`, `/api/`, `router.get`, `app.get`
- Montar lista de rotas a testar

**Opcao B — Inferir de arquivos (fallback):**

```bash
# Next.js App Router
find app -name "page.tsx" -o -name "page.ts" 2>/dev/null | head -20

# Next.js Pages Router
find pages -name "*.tsx" -o -name "*.ts" 2>/dev/null | grep -v "_app\|_document\|api/" | head -20

# Vite/React (checar react-router)
grep -r "path:" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | head -20

# API routes
find . -path "*/api/*" -name "*.ts" -o -name "*.py" 2>/dev/null | head -20
```

Montar `$ROUTES` = lista de URLs a visitar.

## Passo 3: Teste por Fase (chamado do Estagio 3)

Para a fase recem-completada, testar as funcionalidades especificas.

### 3.1 Extrair Testes da Fase

Ler os must_haves dos PLANs da fase:
```yaml
must_haves:
  truths:
    - "Usuario pode ver lista de transacoes"
    - "Usuario pode adicionar nova transacao"
```

Cada truth vira um teste E2E:
- Traduzir truth em acoes concretas no browser
- Ex: "Usuario pode ver lista" → navegar → snapshot → verificar se lista existe

### 3.2 Executar Testes

Para cada teste:

```
1. Navegar para a pagina relevante
   mcp__plugin_playwright_playwright__browser_navigate(url: "$BASE_URL/[rota]")

2. Capturar snapshot (para obter refs dos elementos)
   mcp__plugin_playwright_playwright__browser_snapshot()

3. Verificar que elementos esperados existem
   - Procurar refs no snapshot que correspondem ao esperado
   - Se nao encontrou: BUG — funcionalidade ausente

4. Interagir (se o teste requer)
   - Clicar: browser_click(ref: "[ref]")
   - Preencher: browser_fill_form(fields: [...])
   - Submeter: browser_press_key(key: "Enter") ou browser_click no botao

5. Verificar resultado da interacao
   - Novo snapshot apos acao
   - Verificar mudanca esperada (novo item na lista, mensagem de sucesso, redirect)

6. Tirar screenshot como evidencia
   mcp__plugin_playwright_playwright__browser_take_screenshot(
     type: "png",
     filename: ".plano/fases/[fase]/screenshots/teste-[N].png"
   )

7. Checar console por erros
   mcp__plugin_playwright_playwright__browser_console_messages(level: "error")
   - Se ha erros JS: registrar como BUG

8. Checar network por falhas
   mcp__plugin_playwright_playwright__browser_network_requests(static: false, requestBody: false, requestHeaders: false)
   - Filtrar por status >= 400
   - Se ha falhas de API: registrar como BUG
```

### 3.3 Registrar Resultados

Criar `.plano/fases/[fase]/E2E-RESULTS.md`:

```markdown
---
phase: [fase]
tested: [timestamp]
server: [dev command] @ [port]
total: [N]
passed: [N]
failed: [N]
bugs: [N]
---

# Testes E2E — Fase [X]: [Nome]

## Resultados

### Teste 1: [Nome do teste]
**Must-have:** [truth original]
**Rota:** [URL testada]
**Acoes:** [O que foi feito]
**Resultado:** PASSOU | FALHOU
**Screenshot:** screenshots/teste-1.png
[Se falhou:]
**Bug:** [Descricao do que deu errado]
**Console:** [Erros JS, se houver]
**Network:** [Falhas de API, se houver]

### Teste 2: [Nome do teste]
...

## Erros de Console (Globais)
[Lista de erros JS encontrados durante todos os testes]

## Resumo
- Total: [N] testes
- Passou: [N]
- Falhou: [N]
- Bugs encontrados: [N]
```

### 3.4 Tentar Corrigir Bugs

Se bugs foram encontrados:

Para cada bug:

**Loop de correcao (max 5 tentativas por bug):**

```
tentativa = 1
enquanto tentativa <= 5 E bug nao corrigido:
  1. Analisar o bug (screenshot + console + network + codigo)
  2. Se tentativa > 1: analisar POR QUE a correcao anterior nao funcionou
  3. Localizar arquivo provavel (`grep` pela rota/componente/erro)
  4. Corrigir inline (Edit tool)
  5. Commit atomico: `fix(fase-X): [descricao do bug] (tentativa {tentativa})`
  6. Re-testar apenas o teste que falhou
  7. Se passou: marcar como corrigido, sair do loop
  8. Se ainda falha: tentativa += 1, voltar ao passo 1 com novo contexto
```

Apos 5 tentativas sem correcao: registrar no E2E-RESULTS.md como "nao corrigido apos 5 tentativas" com descricao de cada tentativa feita.

## Passo 4: Teste Final Completo (chamado do Estagio 5)

Apos TODAS as fases completarem, fazer teste completo:

### 4.1 Smoke Test de Rotas

Visitar TODAS as rotas descobertas no Passo 2:

Para cada rota:
```
1. browser_navigate(url: rota)
2. Esperar 2 segundos (conteudo carregar)
3. browser_take_screenshot(filename: ".plano/e2e/smoke/[rota-slug].png")
4. browser_console_messages(level: "error") — checar erros
5. Registrar: rota acessivel (200) ou quebrada (erro/blank/404)
```

### 4.2 Fluxos E2E Principais

Identificar 3-5 fluxos criticos do projeto (baseado em REQUIREMENTS.md):

**Exemplos de fluxos por dominio:**

| Dominio | Fluxos tipicos |
|---------|---------------|
| SaaS | Signup → Login → Dashboard → Criar item → Ver item |
| E-commerce | Browse → Add to cart → Checkout → Confirmar |
| Dashboard | Login → Ver graficos → Filtrar → Exportar |
| Social | Signup → Criar post → Feed → Comentar |
| Financeiro | Login → Ver transacoes → Adicionar → Categorizar → Relatorio |

Para cada fluxo:

```
1. Navegar para inicio do fluxo
2. Para cada passo do fluxo:
   a. Snapshot (obter refs)
   b. Interagir (clicar, preencher, submeter)
   c. Verificar resultado esperado
   d. Screenshot de evidencia
   e. Checar console/network
3. Verificar estado final do fluxo
```

### 4.3 Teste de Responsividade

Se o projeto tem UI web:

```
# Desktop (1920x1080)
browser_resize(width: 1920, height: 1080)
browser_navigate(url: $BASE_URL)
browser_take_screenshot(filename: ".plano/e2e/responsive/desktop.png")

# Tablet (768x1024)
browser_resize(width: 768, height: 1024)
browser_take_screenshot(filename: ".plano/e2e/responsive/tablet.png")

# Mobile (375x812)
browser_resize(width: 375, height: 812)
browser_take_screenshot(filename: ".plano/e2e/responsive/mobile.png")
```

### 4.4 Gerar Relatorio Final E2E

Criar `.plano/e2e/E2E-REPORT.md`:

```markdown
---
tested: [timestamp]
server: [dev command] @ [port]
routes_total: [N]
routes_ok: [N]
routes_broken: [N]
flows_total: [N]
flows_passed: [N]
flows_failed: [N]
bugs_found: [N]
bugs_fixed: [N]
---

# Relatorio de Testes E2E

## Smoke Test de Rotas

| Rota | Status | Erros Console | Screenshot |
|------|--------|---------------|------------|
| / | OK | 0 | smoke/index.png |
| /dashboard | OK | 0 | smoke/dashboard.png |
| /settings | ERRO | 1 | smoke/settings.png |

**Rotas acessiveis:** [N]/[M]

## Fluxos E2E

### Fluxo 1: [Nome]
**Passos:** [N]
**Resultado:** PASSOU | FALHOU no passo [X]
**Screenshots:** [lista]
[Se falhou: descricao do bug]

### Fluxo 2: [Nome]
...

## Responsividade

| Viewport | Screenshot | Problemas |
|----------|-----------|-----------|
| Desktop (1920x1080) | responsive/desktop.png | Nenhum |
| Tablet (768x1024) | responsive/tablet.png | [problemas] |
| Mobile (375x812) | responsive/mobile.png | [problemas] |

## Bugs Encontrados

| # | Descricao | Severidade | Rota | Corrigido? |
|---|-----------|-----------|------|-----------|
| 1 | [bug] | [alta/media/baixa] | [rota] | Sim/Nao |

## Erros de Console (Todos)

[Lista agregada de todos erros JS encontrados]

## Metricas

| Metrica | Valor |
|---------|-------|
| Rotas testadas | [N] |
| Rotas OK | [N] |
| Fluxos testados | [N] |
| Fluxos OK | [N] |
| Bugs encontrados | [N] |
| Bugs corrigidos | [N] |
| Screenshots gerados | [N] |
```

## Passo 5: Cleanup

```bash
# Matar dev server
kill $DEV_PID 2>/dev/null

# Fechar browser
```

mcp__plugin_playwright_playwright__browser_close()

</process>

<smart_testing>
## Testes Inteligentes — Adaptar ao Dominio

O builder NAO executa testes genericos. Cada teste e derivado dos REQUIREMENTS e must_haves do projeto.

**Como derivar testes dos must_haves:**

```yaml
# must_have original:
truths:
  - "Usuario pode ver lista de transacoes"

# Teste E2E derivado:
1. Navegar para /transactions (ou rota equivalente)
2. Snapshot: verificar que existe uma lista/tabela
3. Verificar que tem pelo menos headers/colunas esperadas
4. Screenshot de evidencia
```

```yaml
# must_have original:
truths:
  - "Usuario pode criar nova transacao"

# Teste E2E derivado:
1. Navegar para /transactions/new (ou clicar em botao "Nova")
2. Snapshot: verificar que existe formulario
3. Preencher campos obrigatorios com dados de teste
4. Submeter formulario
5. Verificar redirect ou mensagem de sucesso
6. Navegar para lista: verificar que novo item aparece
7. Screenshots em cada passo
```

**Dados de teste:**

Usar dados realistas mas falsos:
- Email: `teste@example.com`
- Nome: `Usuario Teste`
- Valores: numeros redondos (100, 250, 1000)
- Datas: data atual ou proxima semana
- Textos: "Teste automatico - [timestamp]"

**Interacoes com auth:**

Se o projeto tem autenticacao:
1. Primeiro: tentar acessar pagina protegida (deve redirecionar para login)
2. Se Supabase Auth: criar usuario de teste via API
3. Se custom auth: usar formulario de signup
4. Fazer login antes dos testes
5. Manter sessao para todos os testes seguintes

```bash
# Criar usuario de teste via Supabase (se aplicavel)
# O executor ja deve ter criado um seed/migration com dados de teste
# Se nao: usar signup form
```
</smart_testing>

<failure_handling>
## Tratamento de Falhas

**Dev server nao sobe:**
- Checar se porta ja esta em uso: `lsof -i :[PORT]`
- Tentar porta alternativa
- Se nao resolver: pular E2E, registrar no DELIVERY.md

**Pagina em branco:**
- Checar console_messages por erros
- Pode ser hydration error, missing env var, build error
- Registrar como bug critico

**Elemento nao encontrado no snapshot:**
- Pode ser loading state — esperar 2s e re-snapshot
- Pode ser rota errada — verificar SUMMARY para rota correta
- Se persiste: registrar como bug

**Timeout em interacao:**
- Re-tentar ate 3 vezes com espera crescente (1s, 3s, 5s)
- Se persiste: registrar como bug e seguir pro proximo teste

**Principio:** Testes E2E nunca bloqueiam o builder. Falhas sao registradas e contornadas.
</failure_handling>

<directories>
## Estrutura de Arquivos

```
.plano/
  fases/
    XX-nome/
      screenshots/          # Screenshots por fase
        teste-1.png
        teste-2.png
      E2E-RESULTS.md        # Resultados da fase
  e2e/                      # Teste final completo
    smoke/                  # Screenshots do smoke test
      index.png
      dashboard.png
    responsive/             # Screenshots de responsividade
      desktop.png
      tablet.png
      mobile.png
    flows/                  # Screenshots dos fluxos E2E
      flow-1-step-1.png
      flow-1-step-2.png
    E2E-REPORT.md           # Relatorio final completo
```
</directories>

<success_criteria>
**Teste por fase:**
- [ ] Dev server subiu
- [ ] Must-haves da fase traduzidos em testes
- [ ] Cada teste executado (navegar + interagir + verificar)
- [ ] Screenshots tirados como evidencia
- [ ] Console e network checados
- [ ] Bugs registrados com descricao
- [ ] Tentativa de correcao (max 1x por bug)
- [ ] E2E-RESULTS.md criado na pasta da fase

**Teste final:**
- [ ] Todas rotas visitadas (smoke test)
- [ ] 3-5 fluxos E2E principais testados
- [ ] Responsividade verificada (desktop/tablet/mobile)
- [ ] Bugs agregados e priorizados
- [ ] E2E-REPORT.md gerado em .plano/e2e/
- [ ] Dev server fechado
- [ ] Browser fechado
</success_criteria>
