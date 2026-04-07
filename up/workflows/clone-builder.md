<purpose>
Clone Builder: analisar app existente via Playwright e recriar com o modo-builder.

Pipeline:
1. Intake (perguntas)
2. Crawl (navegar e coletar)
3. Analyze (design + features em paralelo)
4. PRD (sintetizar)
5. Builder (recriar — usa pipeline existente do modo-builder)
6. Clone Verify (verificar fidelidade no quality gate)
</purpose>

<process>

## Fase 1: Intake

### 1.1 Parsear Argumentos

Extrair do $ARGUMENTS:
- URL do app (obrigatorio)
- Modo: `--exact` (default), `--improve`, `--inspiration`

### 1.2 Perguntas

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > CLONE BUILDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

App a clonar: {URL}
Modo: {exact|improve|inspiration}
```

Perguntar via AskUserQuestion:

1. **Credenciais do app** (se precisa login):
   - Email e senha de demo/trial
   - Ou "nao precisa" se app e publico

2. **Stack desejada** (ou "usar defaults"):
   - Frontend, backend, banco
   - Ou: "usar builder-defaults.md"

3. **Credenciais do banco** (para o clone):
   - Supabase URL + anon key + service role key
   - Ou outro banco

4. **Se modo improve/inspiration:** O que quer diferente?

═══════════════════════════════════════════════════════
 FIM DA INTERACAO
═══════════════════════════════════════════════════════

### 1.3 Setup

```bash
mkdir -p .plano/clone/screenshots/desktop .plano/clone/screenshots/mobile .plano/clone/network .plano/clone/forms .plano/clone/snapshots .plano/clone/verify
git init 2>/dev/null
```

Salvar `.plano/BRIEFING.md` com URL, credenciais, stack, modo.

Iniciar dashboard:
```bash
node "$HOME/.claude/up/dashboard/server.js" 4040 "$(pwd)/.plano" &
DASH_PID=$!
```

---

## Fase 2: Crawl

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CLONE > NAVEGANDO APP ORIGINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```
Task(
  subagent_type="up-clone-crawler",
  prompt="
    <objective>
    Navegar o app em {URL} completamente. Screenshots de todas paginas,
    interceptar APIs, extrair forms, mapear navegacao.
    {Se credenciais: fazer login com {EMAIL}/{PASSWORD}}
    </objective>

    <credentials>
    URL: {URL}
    Email: {EMAIL ou 'nenhum'}
    Password: {PASSWORD ou 'nenhum'}
    </credentials>
  ",
  description="Crawl do app original"
)
```

```
Crawl: {N} rotas | {M} screenshots | {X} APIs | {Y} forms
```

---

## Fase 3: Analyze (2 agentes em PARALELO)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CLONE > ANALISANDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Spawnar em PARALELO:

```
Task(
  subagent_type="up-clone-design-extractor",
  prompt="
    <objective>
    Analisar screenshots e extrair design system completo do app em {URL}.
    </objective>

    <files_to_read>
    - .plano/clone/CRAWL-DATA.md
    </files_to_read>

    <app_url>{URL}</app_url>
  ",
  description="Extrair design system"
)

Task(
  subagent_type="up-clone-feature-mapper",
  prompt="
    <objective>
    Mapear modulos, features, roles, data model, fluxos e integracoes do app.
    </objective>

    <files_to_read>
    - .plano/clone/CRAWL-DATA.md
    - .plano/clone/network/ (ler todos)
    - .plano/clone/forms/ (ler todos)
    </files_to_read>
  ",
  description="Mapear features e data model"
)
```

```
Design: {N} cores | {M} componentes | Layout: {tipo}
Features: {N} modulos | {M} features | {X} roles | {Y} entidades
```

---

## Fase 4: PRD

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CLONE > GERANDO PRD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```
Task(
  subagent_type="up-clone-prd-writer",
  prompt="
    <objective>
    Sintetizar analise em PRD completo para o modo-builder.
    </objective>

    <files_to_read>
    - .plano/BRIEFING.md (stack e preferencias)
    - .plano/clone/CRAWL-DATA.md
    - .plano/clone/DESIGN-SYSTEM.md
    - .plano/clone/FEATURE-MAP.md
    </files_to_read>

    <clone_mode>{exact|improve|inspiration}</clone_mode>
  ",
  description="Gerar PRD do clone"
)
```

```
PRD: {N} modulos | {M} features | {X} fluxos | Modo: {modo}
```

---

## Fase 5: Modo Builder

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CLONE > CONSTRUINDO COM MODO BUILDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Alimentar o modo-builder com o CLONE-PRD.md como briefing.

**IMPORTANTE:** Configurar builder para modo clone:

config.json deve ter:
```json
{
  "builder_mode": true,
  "builder_type": "clone",
  "clone_source": "{URL}",
  "clone_mode": "{exact|improve|inspiration}",
  "clone_data": ".plano/clone/"
}
```

**O builder recebe instrucoes especiais no modo clone:**

1. **Product Analyst:** Se modo exact — NAO sugerir mudancas, apenas validar. Se improve — pode sugerir adicoes.
2. **System Designer:** Usar data model do FEATURE-MAP.md como base. Usar design system do DESIGN-SYSTEM.md.
3. **Frontend Specialist:** LER screenshots de .plano/clone/screenshots/ e replicar layout/design.
4. **Code Reviewer:** Verificar fidelidade visual alem de production-requirements.
5. **Quality Gate:** Incluir dimensao "Fidelidade" com clone-verifier.

Executar o pipeline COMPLETO do builder:
- Estagio 2: Arquitetura (3 agentes + validator)
- Estagio 3: Build (RARV + specialist routing)
- Estagio 4: Quality Gate (com clone-verifier como dimensao extra)
- Estagio 5: Entrega

**O builder sabe que e clone** pelo `builder_type: "clone"` no config.json. Cada agente que le config.json adapta seu comportamento.

---

## Fase 6: Clone Verification (integrado no Quality Gate)

O clone-verifier roda como parte do quality gate do builder:

```
Task(
  subagent_type="up-clone-verifier",
  prompt="
    <objective>
    Verificar fidelidade do clone contra o app original.
    Testar feature a feature (funcional) e pagina a pagina (visual).
    </objective>

    <files_to_read>
    - .plano/clone/FEATURE-MAP.md (lista de features CLONE-*)
    - .plano/clone/CRAWL-DATA.md (rotas do original)
    - .plano/clone/DESIGN-SYSTEM.md (design reference)
    - .plano/config.json (clone_source URL)
    </files_to_read>
  ",
  description="Verificar fidelidade do clone"
)
```

Se fidelidade < 9.0:
- Features MISSING → criar planos + executar
- Features BROKEN → debugar + corrigir
- Visual off → ajustar CSS/componentes
- Re-verificar

---

## Fase 7: Entrega

O DELIVERY.md do builder inclui secao extra de clone:

```markdown
## Fidelidade ao Original

**Score:** {N}/10
**Funcional:** {N}/10 ({match}/{total} features)
**Visual:** {N}/10

| Status | Quantidade |
|--------|-----------|
| MATCH | {N} |
| IMPROVED | {N} |
| PARTIAL | {N} |
| MISSING | {N} |
| BROKEN | {N} |

Screenshots comparativos: .plano/clone/verify/
```

Cleanup:
```bash
kill $DASH_PID 2>/dev/null
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CLONE BUILDER > COMPLETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Original:** {URL}
**Clone:** http://localhost:{PORT}
**Fidelidade:** {N}/10

Features: {match} MATCH | {partial} PARTIAL | {missing} MISSING | {broken} BROKEN
Quality Score: {N}/10

Relatorio: .plano/DELIVERY.md
Comparativo: .plano/clone/verify/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</process>

<success_criteria>
- [ ] App original crawled (todas rotas, screenshots, APIs, forms)
- [ ] Design system extraido
- [ ] Features mapeadas com IDs CLONE-*
- [ ] PRD gerado completo
- [ ] Builder executou com config clone
- [ ] Clone verificado feature a feature contra original
- [ ] Clone verificado visualmente contra original
- [ ] Score de fidelidade >= 9.0 (ou max esforco)
- [ ] DELIVERY.md com secao de fidelidade
</success_criteria>
