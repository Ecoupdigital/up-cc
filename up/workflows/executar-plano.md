<purpose>
Executar um prompt de fase (PLAN.md) e criar o resumo do resultado (SUMMARY.md).

**PRINCIPIO CENTRAL: Verificacao funcional por task.**
Cada task NAO esta completa ate que funcione DE VERDADE — nao apenas que o arquivo exista.
Backend task → curl o endpoint, verificar resposta.
Frontend task → abrir no browser, verificar que renderiza e interage.
Integracao → verificar que frontend chama backend corretamente.
</purpose>

<required_reading>
Ler STATE.md antes de qualquer operacao para carregar contexto do projeto.
Ler config.json para configuracoes de comportamento de planejamento.
</required_reading>

<process>

<step name="init_context" priority="first">
Carregar contexto de execucao:

```bash
INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init executar-fase "${PHASE}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Extrair do init JSON: `commit_docs`, `phase_dir`, `phase_number`, `plans`, `summaries`, `incomplete_plans`, `state_path`, `config_path`.

Se `.plano/` faltando: erro.
</step>

<step name="start_dev_server">
## CRITICO: Subir Dev Server ANTES de Executar Qualquer Task

Detectar e subir o servidor de desenvolvimento:

```bash
# Detectar comando de dev
if [ -f package.json ]; then
  DEV_CMD=$(node -e "const p=require('./package.json'); const s=p.scripts||{}; console.log(s.dev||s.start||'')")
fi

# Subir em background
if [ -n "$DEV_CMD" ]; then
  npm run dev > /tmp/up-dev-server.log 2>&1 &
  DEV_PID=$!

  # Esperar ficar pronto (max 30s)
  PORT=$(node -e "const p=require('./package.json'); const s=p.scripts||{}; const d=s.dev||''; const m=d.match(/--port\s+(\d+)|PORT=(\d+)/); console.log(m?m[1]||m[2]:'3000')" 2>/dev/null || echo "3000")
  for i in $(seq 1 30); do
    curl -s http://localhost:$PORT > /dev/null 2>&1 && break
    sleep 1
  done
fi
```

Se o servidor subiu: `$DEV_SERVER_ACTIVE = true`, `$DEV_PORT = $PORT`
Se nao subiu: `$DEV_SERVER_ACTIVE = false` — continuar sem verificacao funcional runtime (fallback para verificacao estatica)

**Manter o servidor rodando durante TODA a execucao do plano.**
</step>

<step name="identify_plan">
```bash
ls .plano/fases/XX-nome/*-PLAN.md 2>/dev/null | sort
ls .plano/fases/XX-nome/*-SUMMARY.md 2>/dev/null | sort
```

Encontrar primeiro PLAN sem SUMMARY correspondente.

<if mode="yolo">
Auto-aprovar: `Executar {fase}-{plano}-PLAN.md [Plano X de Y para Fase Z]` -> parse_segments.
</if>

<if mode="interactive">
Apresentar identificacao do plano, esperar confirmacao.
</if>
</step>

<step name="record_start_time">
```bash
PLAN_START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PLAN_START_EPOCH=$(date +%s)
```
</step>

<step name="load_prompt">
```bash
cat .plano/fases/XX-nome/{fase}-{plano}-PLAN.md
```
Este E as instrucoes de execucao. Seguir exatamente. Se plano referencia CONTEXT.md: honrar visao do usuario em tudo.
</step>

<step name="execute">
Desvios sao normais -- tratar via regras abaixo.

1. Ler arquivos de @contexto do prompt
2. Por tarefa:
   - `type="auto"`: Implementar → **verificar funcionalmente** → commitar → registrar
   - `type="checkpoint:*"`: PARAR -> checkpoint_protocol -> esperar usuario -> continuar
3. Executar verificacoes `<verification>`
4. Confirmar `<success_criteria>` atendido
5. Documentar desvios no Summary
</step>

<runtime_verification>
## VERIFICACAO FUNCIONAL POR TASK (CRITICO)

**Apos CADA task implementada, ANTES de commitar, verificar que FUNCIONA:**

### Task de Backend (API route, endpoint, middleware)

```bash
# 1. Verificar que o servidor recarregou (hot reload)
sleep 2

# 2. Testar o endpoint criado/modificado
# Exemplo: POST /api/messages
curl -s -X POST http://localhost:$DEV_PORT/api/messages \
  -H "Content-Type: application/json" \
  -d '{"content":"teste"}' \
  -w "\n%{http_code}"

# 3. Verificar response
# - Status code correto (200, 201, etc.)?
# - Response body tem a estrutura esperada?
# - Nao retornou 500 ou erro?
```

**Se resposta inesperada:**
1. Ler log do servidor: `tail -20 /tmp/up-dev-server.log`
2. Identificar erro (import faltando, typo, tipo errado)
3. Corrigir inline
4. Re-testar (max 3 tentativas)
5. Se ainda falha: registrar como issue e continuar

### Task de Frontend (componente, pagina, UI)

Se Playwright MCP disponivel:
```
browser_navigate(url: "http://localhost:$DEV_PORT/[rota]")
browser_snapshot()
```

Verificar:
- Pagina renderiza sem erro? (nao tela branca)
- Componente esperado existe no snapshot?
- Console sem erros? `browser_console_messages(level: "error")`

Se Playwright NAO disponivel:
```bash
# Fallback: verificar que a pagina responde
curl -s http://localhost:$DEV_PORT/[rota] | head -20
# Deve retornar HTML, nao erro
```

**Se tela branca ou erro:**
1. Checar console/logs
2. Corrigir (import faltando, componente errado, props faltando)
3. Re-testar (max 3 tentativas)

### Task de Integracao (frontend chamando backend)

```
# 1. Navegar para a pagina
browser_navigate(url: "http://localhost:$DEV_PORT/[rota]")

# 2. Interagir (clicar botao, submeter form)
browser_snapshot()
browser_click(ref: "[ref-do-botao]")
# ou
browser_fill_form(fields: [...])
browser_press_key(key: "Enter")

# 3. Verificar que a acao funcionou
browser_snapshot()  # novo estado
browser_network_requests()  # API foi chamada?

# 4. Checar erros
browser_console_messages(level: "error")
```

**Se a acao nao funcionou:**
1. Checar network requests — API retornou erro?
2. Checar console — erro no frontend?
3. Comparar URL do fetch com a rota real do backend
4. Corrigir conexao frontend↔backend
5. Re-testar (max 3 tentativas)

### Task de Database (schema, migration, seed)

```bash
# Verificar que migration rodou
npx prisma migrate status 2>/dev/null || npx supabase db push --dry-run 2>/dev/null

# Verificar que seed populou
# (se seed task)
curl -s http://localhost:$DEV_PORT/api/[recurso] | head -5
# Deve retornar dados, nao lista vazia
```

### Quando Pular Verificacao Funcional

- Task de config/setup (tsconfig, eslint, deps): pular
- Task de types/interfaces only: pular
- Task de testes (escrita de testes): pular (testes sao a verificacao)
- `$DEV_SERVER_ACTIVE = false`: pular runtime, usar verificacao estatica

### Quando Precisa de Credencial/Acesso Externo

Se a verificacao requer algo que o executor NAO tem:
- Cookies de sessao do usuario (Instagram, WhatsApp, etc.)
- Login em servico externo (dashboard de terceiro, admin panel externo)
- Token OAuth com permissoes especificas
- Acesso fisico (camera, microfone, GPS)
- Pagamento real (testar checkout com cartao)

**NAO perguntar ao usuario. NAO parar o builder.**

Em vez disso:
1. Testar o maximo possivel SEM a credencial (mock, dados locais, dry-run)
2. Registrar no SUMMARY.md como `[PRECISA-CREDENCIAL]`:

```markdown
## Verificacoes Pendentes (Credenciais Necessarias)

| Task | O que testar | Credencial necessaria | Como obter |
|------|-------------|----------------------|-----------|
| 3 | Integração Instagram | Cookie de sessão Instagram | Login manual no Playwright |
| 5 | Webhook WhatsApp | Token UazAPI configurado | Configurar em .env |
| 7 | Checkout Stripe | Chave de teste Stripe | Dashboard Stripe > API Keys |
```

Estas verificacoes serao agregadas no DELIVERY.md na secao "Testes Pendentes de Credenciais".

### Verificacao Estatica (Fallback)

Se dev server nao esta ativo:
```bash
# TypeScript compila?
npx tsc --noEmit 2>&1 | tail -10

# ESLint passa?
npx eslint src/ --quiet 2>&1 | tail -10

# Build funciona?
npm run build 2>&1 | tail -10
```

</runtime_verification>

<task_completion_protocol>
## Protocolo de Conclusao por Task

Uma task SO esta completa quando:

1. **Codigo escrito** — arquivo(s) criado(s)/modificado(s)
2. **Verificacao funcional PASSOU** — endpoint responde / pagina renderiza / acao funciona
3. **Commit feito** — atomico, com mensagem descritiva
4. **Hash registrado** — para o SUMMARY

Se verificacao funcional FALHA apos 3 tentativas:
- Registrar como `[FUNCIONAL-FALHA]` no SUMMARY com descricao do problema
- Commitar o que tem (codigo pode estar correto mas dependencia de outra task)
- Continuar para proxima task
- O code reviewer (Reflect step) vai pegar isso depois

</task_completion_protocol>

<deviation_rules>

## Regras de Desvio

Voce VAI descobrir trabalho nao planejado. Aplicar automaticamente, rastrear todos para Summary.

| Regra | Gatilho | Acao | Permissao |
|-------|---------|------|-----------|
| **1: Bug** | Comportamento quebrado, erros, queries erradas, erros de tipo, vulns de seguranca | Corrigir -> testar -> verificar -> rastrear `[Regra 1 - Bug]` | Auto |
| **2: Critico Faltante** | Essenciais faltando: tratamento de erro, validacao, auth, CSRF/CORS | Adicionar -> testar -> verificar -> rastrear `[Regra 2 - Critico Faltante]` | Auto |
| **3: Bloqueante** | Impede conclusao: deps faltando, tipos errados, imports quebrados | Corrigir bloqueio -> verificar que prossegue -> rastrear `[Regra 3 - Bloqueante]` | Auto |
| **4: Arquitetural** | Mudanca estrutural: nova tabela DB, mudanca de schema, novo servico | PARAR -> apresentar decisao -> rastrear `[Regra 4 - Arquitetural]` | Perguntar usuario |
| **5: Conexao Frontend↔Backend** | Frontend chama URL errada, payload errado, response shape diferente | Corrigir URL/payload/parsing -> re-testar -> rastrear `[Regra 5 - Conexao]` | Auto |

**Regra 5 e NOVA e CRITICA.** A maioria dos problemas "nada funciona" vem de:
- Frontend fazendo fetch para `/api/messages` mas backend tem `/api/message` (sem s)
- Frontend enviando `{ message: "oi" }` mas backend espera `{ content: "oi" }`
- Frontend esperando `response.data.messages` mas backend retorna `response.messages`
- Frontend usando `GET` mas backend espera `POST`
- CORS bloqueando a requisicao

**SEMPRE verificar**: URL + metodo HTTP + payload shape + response shape + CORS.

**Prioridade:** Regra 4 (PARAR) > Regra 5 (conexao) > Regras 1-3 (auto) > incerto -> Regra 4

</deviation_rules>

<task_commit>
## Protocolo de Commit por Tarefa

Apos cada tarefa (verificacao funcional PASSOU, criterios de conclusao atendidos), commitar imediatamente.

**1. Verificar:** `git status --short`

**2. Stagear individualmente** (NUNCA `git add .` ou `git add -A`):
```bash
git add src/api/auth.ts
git add src/types/user.ts
```

**3. Tipo de commit:**

| Tipo | Quando | Exemplo |
|------|--------|---------|
| `feat` | Nova funcionalidade | feat(08-02): criar endpoint de registro |
| `fix` | Correcao de bug | fix(08-02): corrigir regex de validacao de email |
| `test` | Apenas teste | test(08-02): adicionar teste para hashing de senha |
| `refactor` | Sem mudanca de comportamento | refactor(08-02): extrair validacao para helper |
| `docs` | Documentacao | docs(08-02): adicionar docs da API |
| `chore` | Config/deps | chore(08-02): adicionar dependencia bcrypt |

**4. Formato:** `{tipo}({fase}-{plano}): {descricao}`

**5. Registrar hash:**
```bash
TASK_COMMIT=$(git rev-parse --short HEAD)
```

</task_commit>

<step name="checkpoint_protocol">
Em `type="checkpoint:*"`: automatizar tudo possivel primeiro. Checkpoints sao apenas para verificacao/decisoes.

Exibir: box `CHECKPOINT: [Tipo]` -> Progresso {X}/{Y} -> Nome da tarefa -> conteudo especifico do tipo -> `SUA ACAO: [sinal]`

| Tipo | Conteudo | Sinal de retomada |
|------|----------|-------------------|
| human-verify (90%) | O que foi construido + passos de verificacao | "aprovado" ou descrever problemas |
| decision (9%) | Decisao necessaria + contexto + opcoes | "Selecionar: opcao-id" |
| human-action (1%) | O que foi automatizado + UM passo manual | "feito" |
</step>

<step name="wave_integration_check">
## Verificacao de Integracao por Wave

**Apos TODAS as tasks de uma wave completarem**, verificar que as pecas se conectam:

```bash
# 1. App ainda roda? (hot reload pode ter quebrado)
curl -s http://localhost:$DEV_PORT/ > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "DEV SERVER CAIU — reiniciando"
  npm run dev > /tmp/up-dev-server.log 2>&1 &
  DEV_PID=$!
  sleep 5
fi
```

Se Playwright disponivel:
```
# 2. Navegar para pagina principal da feature
browser_navigate(url: "http://localhost:$DEV_PORT/[rota-principal]")
browser_snapshot()

# 3. Verificar que nao ha erros de console
browser_console_messages(level: "error")

# 4. Verificar que dados carregam (se aplicavel)
# O snapshot deve mostrar dados reais, nao loading infinito ou erro

# 5. Tentar interacao basica
browser_click(ref: "[botao-principal]")  # se existir
browser_snapshot()  # verificar resultado
```

**Se integracao quebrada:**
- Identificar: e problema de URL? payload? auth? CORS?
- Corrigir (Regra 5 de desvio)
- Re-testar
- Commitar fix: `fix({fase}-{plano}): corrigir integracao [descricao]`

</step>

<step name="create_summary">
Criar `{fase}-{plano}-SUMMARY.md` em `.plano/fases/XX-nome/`.

**Frontmatter:** fase, plano, subsistema, tags | requer/fornece/afeta | tech-stack.adicionado/padroes | key-files.criados/modificados | decisoes-chave | requisitos-completados | duracao, completado.

Titulo: `# Fase [X] Plano [Y]: [Nome] Resumo`

One-liner SUBSTANCIAL: "Auth JWT com rotacao de refresh usando jose library" nao "Autenticacao implementada"

**NOVO — Secao de verificacao funcional no SUMMARY:**

```markdown
## Verificacao Funcional

| Task | Tipo | Verificacao | Resultado |
|------|------|------------|-----------|
| 1 | backend | curl POST /api/messages → 201 | PASSOU |
| 2 | frontend | /chat renderiza, input existe | PASSOU |
| 3 | integracao | enviar mensagem → aparece na lista | PASSOU |
| 4 | backend | curl GET /api/messages → 200 + array | PASSOU |

**Dev server:** ativo na porta {PORT}
**Problemas de conexao frontend↔backend:** {0 | N encontrados e corrigidos}
```
</step>

<step name="cleanup_dev_server">
**NAO matar o dev server ao finalizar o plano.**
O proximo plano da mesma fase vai precisar dele.
O servidor so e morto no final da FASE (pelo orquestrador executar-fase.md).
</step>

<step name="update_current_position">
Atualizar STATE.md:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" state advance-plan
node "$HOME/.claude/up/bin/up-tools.cjs" state update-progress
```
</step>

<step name="update_roadmap">
```bash
node "$HOME/.claude/up/bin/up-tools.cjs" roadmap update-plan-progress "${PHASE}"
```
</step>

<step name="update_requirements">
Marcar requisitos completados do campo `requirements:` do frontmatter do PLAN.md:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" requirements mark-complete ${REQ_IDS}
```
</step>

<step name="git_commit_metadata">
Codigo da tarefa ja committed por tarefa. Commitar metadados do plano:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs({fase}-{plano}): completar plano [nome]" --files .plano/fases/XX-nome/{fase}-{plano}-SUMMARY.md .plano/STATE.md .plano/ROADMAP.md .plano/REQUIREMENTS.md
```
</step>

<step name="offer_next">
```bash
ls -1 .plano/fases/[dir-fase-atual]/*-PLAN.md 2>/dev/null | wc -l
ls -1 .plano/fases/[dir-fase-atual]/*-SUMMARY.md 2>/dev/null | wc -l
```

| Condicao | Rota | Acao |
|----------|------|------|
| summaries < plans | **A: Mais planos** | Encontrar proximo PLAN sem SUMMARY. Yolo: auto-continuar. Interativo: mostrar proximo plano. |
| summaries = plans, atual < maior fase | **B: Fase pronta** | Mostrar conclusao, sugerir `/up:planejar-fase {Z+1}` |
| summaries = plans, atual = maior fase | **C: Todas fases prontas** | Mostrar banner de conclusao |
</step>

</process>

<success_criteria>
- Todas tarefas do PLAN.md completadas
- **Verificacao funcional passou por task (endpoint responde, pagina renderiza, acao funciona)**
- **Integracao frontend↔backend verificada**
- Todas verificacoes passam
- SUMMARY.md criado com conteudo substancial E secao de verificacao funcional
- STATE.md atualizado (posicao, decisoes, problemas, sessao)
- ROADMAP.md atualizado
</success_criteria>
