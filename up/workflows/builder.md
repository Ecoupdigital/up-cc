<purpose>
Modo Builder: construir projeto completo de forma autonoma. Funciona em dois modos:

**Greenfield:** Projeto do zero. Usuario descreve o que quer, sistema cria tudo.
**Brownfield:** Projeto existente. Usuario descreve a feature/mudanca, sistema mapeia o codigo, planeja e implementa.

**Dois niveis:**
- **Full (padrao):** 5 estagios completos — Intake → Arquitetura → Build → Polish → Entrega
- **Light (`--light`):** Pipeline enxuto — Intake rapido → Mini-scan → Build + E2E → Fim

A partir do Estagio 2, ZERO interacao com usuario. Todas as decisoes sao tomadas autonomamente.

**IMPORTANTE: Verificar flag `--light` no $ARGUMENTS antes de iniciar.**
Se `--light` presente: pular direto para `<light_process>` no final deste workflow.
Se ausente: seguir o `<process>` normal (full).
</purpose>

<core_principle>
Este workflow REUTILIZA os processos existentes do UP. Nao reinventa — apenas orquestra os comandos existentes em sequencia sem parar para perguntar.

Onde o UP normal para e pergunta, o modo builder decide sozinho.
Onde o UP normal espera /clear entre fases, o modo builder continua automaticamente.

**Deteccao automatica de modo:**
- Codigo existente detectado (package.json, src/, app/, etc.) → BROWNFIELD
- Sem codigo → GREENFIELD
- `.plano/` existente com ROADMAP.md → BROWNFIELD (adiciona fases ao roadmap existente)
</core_principle>

<process>

## Estagio 1: INTAKE (Interativo)

Este e o UNICO estagio com interacao.

### 1.0 Verificar Crash Recovery (LOCK.md)

**PRIMEIRO PASSO OBRIGATORIO — antes de qualquer outra coisa:**

```bash
ls .plano/LOCK.md 2>/dev/null
```

**Se LOCK.md existe e `status: running`:**

Ler frontmatter do LOCK.md para extrair: `stage`, `phase`, `step`, `total_phases`.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > BUILDER — SESSAO ANTERIOR DETECTADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sessao anterior crashou ou foi interrompida.

Estagio: {stage}
Fase: {phase}/{total_phases}
Ultimo passo: {step}

Retomando de onde parou...
```

**Retomar baseado no estado do LOCK:**

| stage | step | Retomar de |
|-------|------|-----------|
| `build` | `planning` | Estagio 3: re-planejar fase {phase} |
| `build` | `executing` | Estagio 3: re-executar fase {phase} (pula planos com SUMMARY) |
| `build` | `verifying` | Estagio 3: re-verificar fase {phase} |
| `build` | `e2e-testing` | Estagio 3: re-testar E2E fase {phase} |
| `build` | `reassessing` | Estagio 3: pular reassessment, avancar para fase {phase+1} |
| `build` | `completed` | Estagio 3: avancar para fase {phase+1} |
| `polish` | qualquer | Estagio 4: re-executar polish |
| `delivery` | qualquer | Estagio 5: re-gerar DELIVERY.md |

**Pular direto para o estagio/fase correto.** NAO re-executar estagios ja completos.
NAO fazer intake novamente. Ler BRIEFING.md e PROJECT.md para contexto.

**Se LOCK.md existe e `status: completed`:**
Deletar LOCK.md e iniciar normalmente (sessao anterior terminou com sucesso).

**Se LOCK.md NAO existe:**
Continuar normalmente para 1.1.

### 1.1 Carregar Defaults e Detectar Modo

```bash
DEFAULTS_PATH="$HOME/.claude/up/builder-defaults.md"
```

Ler `$DEFAULTS_PATH` se existir. Se nao existir, informar: "Sem builder-defaults.md. Usando inferencia inteligente para decisoes nao especificadas. Crie ~/.claude/up/builder-defaults.md para personalizar."

**Detectar modo automaticamente:**

```bash
# Verificar se ha codigo existente
ls package.json go.mod Cargo.toml requirements.txt pyproject.toml pom.xml build.gradle composer.json Gemfile 2>/dev/null
ls -d src/ app/ lib/ cmd/ internal/ pages/ components/ 2>/dev/null | head -10
ls .plano/ROADMAP.md .plano/PROJECT.md 2>/dev/null
```

| Resultado | Modo |
|-----------|------|
| Sem manifesto de pacote e sem src/ | **GREENFIELD** |
| Manifesto ou diretorios de codigo existem | **BROWNFIELD** |
| `.plano/ROADMAP.md` existe | **BROWNFIELD** (projeto UP existente) |

Definir `$MODE` = `greenfield` ou `brownfield`.

### 1.2 Receber Briefing

O briefing vem como $ARGUMENTS do comando. Se vazio, pedir freeform adaptado ao modo:

**GREENFIELD:**
"Descreva o que voce quer construir. Inclua: objetivo, publico, features principais, stack (se tiver preferencia), e qualquer contexto relevante."

**BROWNFIELD:**
"Codigo existente detectado. O que voce quer implementar? Descreva a feature, mudanca ou refatoracao. Inclua: o que deve fazer, como se integra com o existente, e qualquer contexto relevante."

Esperar resposta.

### 1.3 Analisar e Classificar Gaps

Analisar o briefing e classificar informacoes faltantes:

**CRITICO (deve perguntar):**
- Integrações externas que precisam de credenciais (Supabase, Stripe, etc.)
- Tokens/chaves de API necessarias
- Ambiguidades de negocio que afetam arquitetura fundamentalmente
  - Ex: "sistema multiusuario" → precisa de roles? multi-tenant?
  - Ex: "pagamentos" → qual gateway? quais metodos?

**BROWNFIELD EXTRA — CRITICO:**
- Se a feature pode impactar funcionalidades existentes de forma ambigua
  - Ex: "refatorar auth" → manter backward compatibility? migrar usuarios?
- Se ha integrações existentes que podem ser afetadas

**DECIDIR SOZINHO (nao perguntar):**
- Stack (usar defaults ou inferir; em brownfield: usar stack EXISTENTE)
- Design visual, cores, fontes (em brownfield: seguir design system existente)
- Estrutura de pastas, padroes de codigo (em brownfield: seguir convencoes existentes)
- Nomes de tabelas, modelos, rotas, componentes
- Arquitetura de API (em brownfield: seguir padrao existente)
- Quantidade e granularidade de fases
- Tudo que nao e ambiguo

### 1.4 Fazer Perguntas Criticas

Se ha gaps criticos, fazer UMA UNICA rodada de perguntas usando AskUserQuestion:

```
AskUserQuestion(
  header: "Informacoes Necessarias",
  question: "[Listar todos os gaps criticos em uma unica pergunta]

  1. [Pergunta critica 1]
  2. [Pergunta critica 2]
  ...

  Responda todas de uma vez.",
  followUp: null
)
```

**Se NAO ha gaps criticos:** Pular direto para 1.5.

### 1.5 Confirmar e Iniciar

**GREENFIELD:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > MODO BUILDER (GREENFIELD)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Entendi o projeto. A partir de agora, vou construir tudo autonomamente.

**Briefing:** [resumo em 2-3 frases]
**Stack:** [stack que sera usada]
**Estimativa:** [N] fases

Decisoes nao especificadas serao tomadas automaticamente.

Iniciando...
```

**BROWNFIELD:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > MODO BUILDER (BROWNFIELD)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Entendi a feature. Vou mapear o codigo existente e implementar autonomamente.

**Feature:** [resumo em 2-3 frases]
**Stack detectada:** [stack existente]
**Estimativa:** [N] fases

Convencoes e padroes existentes serao respeitados.

Iniciando mapeamento do codebase...
```

**NAO pedir confirmacao.** Iniciar direto.

═══════════════════════════════════════════════════════
 FIM DA INTERACAO COM USUARIO
═══════════════════════════════════════════════════════

---

## Estagio 2: ARQUITETURA (Autonomo)

### 2.1 Inicializar Projeto

```bash
mkdir -p .plano .plano/captures
git init 2>/dev/null
```

**Iniciar Dashboard automaticamente:**
```bash
node "$HOME/.claude/up/dashboard/server.js" 4040 "$(pwd)/.plano" &
DASH_PID=$!
echo "Dashboard: http://localhost:4040 (PID: $DASH_PID)"
```

Informar ao usuario:
```
Dashboard: http://localhost:4040 — acompanhe o progresso em tempo real
```

### 2.2 Pipeline de Arquitetura (3 Agentes em Sequencia)

**Pipeline:** Product Analyst → System Designer → Architect
Cada agente produz um documento que alimenta o proximo.

**O que acontece ANTES do pipeline depende do modo:**

#### MODO GREENFIELD — Pesquisa de Ecossistema

Spawnar 4 pesquisadores em paralelo (mesmo processo do novo-projeto):

```bash
mkdir -p .plano/pesquisa
```

```
Task(prompt="<research_type>
Pesquisa de Projeto -- Dimensao Stack para [dominio].
</research_type>

<question>
Qual e a stack padrao de 2025 para [dominio]? Confirme versoes e compatibilidade de: [frameworks do briefing/defaults].
</question>

<briefing>
[Briefing completo do usuario]
</briefing>

<output>
Write to: .plano/pesquisa/STACK.md
</output>
", subagent_type="up-pesquisador-projeto", description="Pesquisa Stack")

Task(prompt="<research_type>
Pesquisa de Projeto -- Dimensao Features para [dominio].
</research_type>

<question>
Quais features produtos de [dominio] tem? O que e obrigatorio vs diferenciador?
</question>

<briefing>
[Briefing completo do usuario]
</briefing>

<output>
Write to: .plano/pesquisa/FEATURES.md
</output>
", subagent_type="up-pesquisador-projeto", description="Pesquisa Features")

Task(prompt="<research_type>
Pesquisa de Projeto -- Dimensao Arquitetura para [dominio].
</research_type>

<question>
Como sistemas de [dominio] sao tipicamente estruturados? Componentes principais e padroes?
</question>

<briefing>
[Briefing completo do usuario]
</briefing>

<output>
Write to: .plano/pesquisa/ARCHITECTURE.md
</output>
", subagent_type="up-pesquisador-projeto", description="Pesquisa Arquitetura")

Task(prompt="<research_type>
Pesquisa de Projeto -- Dimensao Armadilhas para [dominio].
</research_type>

<question>
O que projetos de [dominio] comumente erram? Erros criticos a evitar?
</question>

<briefing>
[Briefing completo do usuario]
</briefing>

<output>
Write to: .plano/pesquisa/PITFALLS.md
</output>
", subagent_type="up-pesquisador-projeto", description="Pesquisa Armadilhas")
```

**IMPORTANTE:** Os 4 Task DEVEM ser spawnados na MESMA mensagem para execucao paralela.

Apos os 4 retornarem, spawnar sintetizador:

```
Task(prompt="
<task>
Sintetizar outputs de pesquisa em SUMMARY.md.
</task>

<files_to_read>
- .plano/pesquisa/STACK.md
- .plano/pesquisa/FEATURES.md
- .plano/pesquisa/ARCHITECTURE.md
- .plano/pesquisa/PITFALLS.md
</files_to_read>

<output>
Write to: .plano/pesquisa/SUMMARY.md
Commit apos escrever.
</output>
", subagent_type="up-sintetizador", description="Sintetizar pesquisa")
```

#### MODO BROWNFIELD — Mapeamento do Codebase + Pesquisa Focada

**Passo 1: Mapear codebase existente (4 agentes paralelos)**

Verificar se `.plano/codebase/` ja existe:
- Se existe e tem menos de 7 dias: reutilizar (pular mapeamento)
- Se nao existe ou esta desatualizado: mapear

```bash
mkdir -p .plano/codebase
```

```
Task(subagent_type="up-mapeador-codigo", prompt="
<focus>tech</focus>
<files_to_read>
- ./CLAUDE.md (se existir)
</files_to_read>
Mapear stack de tecnologia e integracoes externas.
Escrever .plano/codebase/STACK.md e .plano/codebase/INTEGRATIONS.md
", description="Mapear stack e integracoes")

Task(subagent_type="up-mapeador-codigo", prompt="
<focus>arch</focus>
<files_to_read>
- ./CLAUDE.md (se existir)
</files_to_read>
Mapear arquitetura e estrutura de arquivos.
Escrever .plano/codebase/ARCHITECTURE.md e .plano/codebase/STRUCTURE.md
", description="Mapear arquitetura e estrutura")

Task(subagent_type="up-mapeador-codigo", prompt="
<focus>quality</focus>
<files_to_read>
- ./CLAUDE.md (se existir)
</files_to_read>
Mapear convencoes de codigo e padroes de teste.
Escrever .plano/codebase/CONVENTIONS.md e .plano/codebase/TESTING.md
", description="Mapear convencoes e testes")

Task(subagent_type="up-mapeador-codigo", prompt="
<focus>concerns</focus>
<files_to_read>
- ./CLAUDE.md (se existir)
</files_to_read>
Identificar divida tecnica e problemas.
Escrever .plano/codebase/CONCERNS.md
", description="Mapear preocupacoes e divida tecnica")
```

**IMPORTANTE:** Os 4 Task DEVEM ser spawnados na MESMA mensagem para execucao paralela.

Verificar que os 7 documentos foram criados:
```bash
ls -la .plano/codebase/*.md | wc -l
```

Commitar mapeamento:
```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs: mapear codebase existente" --files .plano/codebase/
```

**Passo 2: Pesquisa focada (apenas tecnologias NOVAS)**

Se o briefing menciona tecnologias/APIs que NAO existem no codebase atual:

```bash
mkdir -p .plano/pesquisa
```

Spawnar pesquisadores APENAS para tecnologias novas (ex: usuario quer adicionar Stripe mas o projeto nao tem):

```
Task(prompt="<research_type>
Pesquisa de Projeto -- Tecnologia nova para projeto existente.
</research_type>

<question>
[Perguntas focadas APENAS nas tecnologias/padroes NOVOS que serao adicionados]
Stack existente: [de .plano/codebase/STACK.md]
Novo: [tecnologia/API do briefing]
Como integrar o novo com o existente?
</question>

<briefing>
[Briefing do usuario]
</briefing>

<output>
Write to: .plano/pesquisa/NOVAS-TECNOLOGIAS.md
</output>
", subagent_type="up-pesquisador-projeto", description="Pesquisar tecnologias novas")
```

Se NAO ha tecnologias novas: pular pesquisa.

### 2.3 Salvar Briefing

Use a ferramenta Write para criar `.plano/BRIEFING.md` com:
- Modo (greenfield/brownfield)
- Briefing completo do usuario
- Respostas das perguntas criticas (se houve)
- Credenciais/APIs fornecidas
- **BROWNFIELD extra:** resumo do codebase (de .plano/codebase/), o que NAO mudar

### 2.4 Agente 1: Product Analyst

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > ANALISANDO PRODUTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pesquisando concorrentes e features do mercado...
```

```
Task(prompt="
<objective>
Analisar o mercado e produto: pesquisar concorrentes, definir personas, listar features obrigatorias e esperadas, mapear modulos do sistema.
Modo autonomo — NAO pergunte nada.
</objective>

<files_to_read>
- .plano/BRIEFING.md (Briefing do usuario)
- .plano/pesquisa/SUMMARY.md (Pesquisa de ecossistema, se existir)
</files_to_read>

<output>
Escrever .plano/PRODUCT-ANALYSIS.md
Commit apos escrever.
Retornar: ## PRODUCT ANALYSIS COMPLETE
</output>
", subagent_type="up-product-analyst", description="Analisar produto e mercado")
```

Verificar retorno `## PRODUCT ANALYSIS COMPLETE`. Se falhou: registrar e continuar (System Designer usara blueprints como fallback).

```
Produto: [N] concorrentes | [X] features obrigatorias | [Y] personas | [Z] modulos
```

### 2.5 Agente 2: System Designer

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > PROJETANDO SISTEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Definindo modulos, roles, schema, rotas e requisitos de producao...
```

```
Task(prompt="
<objective>
Projetar o sistema tecnico completo: modulos, roles, permissoes, schema de banco, rotas, integracoes.
Aplicar blueprints de producao e requisitos universais. Compilar requisitos das 5 camadas.
Modo autonomo — NAO pergunte nada.
</objective>

<mode>{greenfield|brownfield}</mode>

<files_to_read>
- .plano/BRIEFING.md (Briefing e stack)
- .plano/PRODUCT-ANALYSIS.md (Analise de produto — features, personas, modulos)
- .plano/pesquisa/SUMMARY.md (Pesquisa, se existir)
- $HOME/.claude/up/references/production-requirements.md (Requisitos universais)
- $HOME/.claude/up/references/blueprints/ (Blueprints — ler os relevantes ao dominio)
{BROWNFIELD EXTRA:}
- .plano/codebase/STACK.md (Stack existente)
- .plano/codebase/ARCHITECTURE.md (Arquitetura existente)
- .plano/codebase/CONVENTIONS.md (Convencoes a seguir)
- .plano/codebase/STRUCTURE.md (Estrutura existente)
- .plano/codebase/CONCERNS.md (Divida tecnica)
- .plano/codebase/INTEGRATIONS.md (Integracoes existentes)
</files_to_read>

<output>
Escrever .plano/SYSTEM-DESIGN.md
Commit apos escrever.
Retornar: ## SYSTEM DESIGN COMPLETE
</output>
", subagent_type="up-system-designer", description="Projetar sistema completo")
```

```
Sistema: [N] modulos | [X] roles | [Y] tabelas | [Z] requisitos compilados (5 camadas)
```

### 2.6 Agente 3: Architect

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > ESTRUTURANDO PROJETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Gerando PROJECT.md, REQUIREMENTS.md, ROADMAP.md...
```

```
Task(prompt="
<objective>
Transformar analise de produto e design de sistema em documentos executaveis do UP:
PROJECT.md, REQUIREMENTS.md (com TODOS os requisitos das 5 camadas), ROADMAP.md, STATE.md, config.json.
Modo autonomo — NAO pergunte nada.
</objective>

<mode>{greenfield|brownfield}</mode>

<files_to_read>
- .plano/BRIEFING.md (Briefing original)
- .plano/PRODUCT-ANALYSIS.md (Analise de produto — features, personas)
- .plano/SYSTEM-DESIGN.md (Design tecnico — modulos, roles, schema, requisitos compilados)
- $HOME/.claude/up/builder-defaults.md (Defaults do usuario, se existir)
- $HOME/.claude/up/templates/project.md (Template PROJECT.md)
{BROWNFIELD EXTRA:}
- .plano/PROJECT.md (Existente — ATUALIZAR)
- .plano/ROADMAP.md (Existente — ADICIONAR fases)
- .plano/REQUIREMENTS.md (Existente — ADICIONAR requisitos)
- .plano/codebase/CONVENTIONS.md (Convencoes)
- ./CLAUDE.md (Instrucoes do projeto)
</files_to_read>

<critical>
O SYSTEM-DESIGN.md contem requisitos COMPILADOS das 5 camadas (explicitos + blueprints + universais + stack + mercado).
TODOS esses requisitos devem aparecer no REQUIREMENTS.md com REQ-IDs.
TODAS as features devem ter fases no ROADMAP.md.
O resultado deve ser um sistema COMPLETO pronto para producao, nao um MVP basico.
</critical>

<brownfield_rules>
Se brownfield:
1. RESPEITAR stack existente
2. SEGUIR convencoes existentes
3. ATUALIZAR documentos existentes (nao criar do zero)
4. ADICIONAR fases apos as existentes
5. ADICIONAR requisitos continuando numeracao
</brownfield_rules>

<constraints>
- builder_mode=true no config.json
- mode=yolo
- parallelization=true
- Commit todos arquivos ao final
</constraints>
", subagent_type="up-arquiteto", description="Estruturar projeto executavel")
```

### 2.7 Validar Requisitos (Quality Gate de Planejamento)

**ANTES de iniciar o build, validar que os requisitos sao completos e testaveis.**

```
Validando requisitos (13 checks)...
```

```
Task(
  subagent_type="up-requirements-validator",
  prompt="
    <objective>
    Validar REQUIREMENTS.md com 13 checks automaticos.
    Calcular score e determinar se esta pronto para build.
    </objective>

    <files_to_read>
    - .plano/REQUIREMENTS.md
    - .plano/PROJECT.md
    </files_to_read>
  ",
  description="Validar requisitos (13 checks)"
)
```

Ler resultado:

**Se score >= 75% (ACCEPTABLE ou melhor):** Prosseguir.
```
Requisitos: {score}% — {GRADE} ({passed}/13 checks)
```

**Se score < 75% (NEEDS_WORK):** Re-spawnar arquiteto com feedback.

```
Requisitos insuficientes ({score}%). Refinando...
```

```
Task(
  subagent_type="up-arquiteto",
  prompt="
    <objective>
    Refinar REQUIREMENTS.md. A validacao encontrou problemas.
    Ler REQUIREMENTS-VALIDATION.md para saber o que falta.
    Adicionar requisitos que faltam SEM remover os existentes.
    </objective>

    <files_to_read>
    - .plano/REQUIREMENTS-VALIDATION.md (feedback do validador)
    - .plano/REQUIREMENTS.md (requisitos atuais)
    - .plano/PROJECT.md
    - .plano/SYSTEM-DESIGN.md
    </files_to_read>
  ",
  description="Refinar requisitos apos validacao"
)
```

Re-validar (max 2 ciclos). Se apos 2 ciclos ainda < 75%: prosseguir com advertencia.

### 2.8 Reportar Arquitetura

Ler ROADMAP.md e exibir resumo:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > ARQUITETURA DEFINIDA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**[Nome do Projeto]**

[N] fases | [X] requisitos (5 camadas) | [Y] modulos | [Z] roles
Stack: [resumo]

Pipeline: Product Analyst → System Designer → Architect

| # | Fase | Objetivo |
|---|------|----------|
| 1 | [Nome] | [Objetivo] |
| 2 | [Nome] | [Objetivo] |
...

Iniciando build...
```

---

## Estagio 3: BUILD (Autonomo — Loop de Fases)

### 3.0 Carregar Roadmap e Inicializar Lock

```bash
ROADMAP=$(node "$HOME/.claude/up/bin/up-tools.cjs" roadmap analyze)
```

Extrair lista de fases e total.

**Criar/atualizar LOCK.md (crash recovery):**

Use a ferramenta Write para criar `.plano/LOCK.md`:
```markdown
---
status: running
stage: build
phase: 1
step: planning
total_phases: [N]
started: [timestamp ISO]
updated: [timestamp ISO]
pid: [process info]
---

# Builder Lock

Builder em execucao. Se a sessao morreu, use `/up:modo-builder` novamente para retomar.
O builder detectara este LOCK e continuara de onde parou.
```

**O LOCK.md e atualizado a cada transicao:**
- Antes de planejar: `step: planning, phase: X`
- Antes de executar: `step: executing, phase: X`
- Antes de verificar: `step: verifying, phase: X`
- Antes de E2E: `step: e2e-testing, phase: X`
- Antes de reassessment: `step: reassessing, phase: X`
- Ao completar fase: `step: completed, phase: X`
- Ao entrar no Polish: `stage: polish`
- Ao entrar na Entrega: `stage: delivery`
- Ao finalizar: `status: completed` (e depois deletar o LOCK.md)

**Formato de atualizacao rapida:**
```bash
# Atualizar LOCK via sed (rapido, sem reescrever arquivo inteiro)
sed -i "s/^step: .*/step: executing/" .plano/LOCK.md
sed -i "s/^phase: .*/phase: ${PHASE_NUMBER}/" .plano/LOCK.md
sed -i "s/^updated: .*/updated: $(date -u +%Y-%m-%dT%H:%M:%SZ)/" .plano/LOCK.md
```

### 3.1 Loop Principal

Para cada fase no ROADMAP (da primeira a ultima):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > FASE {X}/{TOTAL}: {Nome}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 3.1.1 Planejar Fase

Spawnar up-planejador com flag de modo builder:

```
Task(prompt="
<planning_context>
**Fase:** {phase_number}
**Modo:** builder (autonomo -- NAO use AskUserQuestion)

<files_to_read>
- .plano/STATE.md (Estado do Projeto)
- .plano/ROADMAP.md (Roteiro)
- .plano/REQUIREMENTS.md (Requisitos)
- .plano/pesquisa/SUMMARY.md (Pesquisa - se existir)
- .plano/codebase/CONVENTIONS.md (Convencoes - se existir, BROWNFIELD)
- .plano/codebase/CONCERNS.md (Divida tecnica - se existir, BROWNFIELD)
- .plano/codebase/ARCHITECTURE.md (Arquitetura - se existir, BROWNFIELD)
- .plano/codebase/STRUCTURE.md (Estrutura - se existir, BROWNFIELD)
- ./CLAUDE.md (Instrucoes do projeto, se existir)
</files_to_read>

**IDs de requisitos da fase:** {phase_req_ids}
**Instrucoes do projeto:** Ler ./CLAUDE.md se existir

<builder_mode>
Voce esta no modo builder. Regras especiais:
1. NAO use AskUserQuestion em hipotese alguma
2. Se falta CONTEXT.md, planeje usando pesquisa + requisitos
3. Se ha ambiguidade, tome a decisao mais razoavel e documente no plano
4. Se precisa de informacao que normalmente perguntaria, infira e registre como decisao
5. Pesquisa inline: SEMPRE faca (nivel 2+) para garantir implementacoes corretas
6. CAPTURES: Se durante o planejamento voce descobrir algo importante (incompatibilidade, risco, oportunidade, decisao critica), registre em .plano/captures/ como arquivo markdown curto
</builder_mode>

<self_check>
Apos criar os planos, auto-verificar:
- [ ] Cada requisito da fase mapeado a um plano
- [ ] Frontmatter valido (wave, depends_on, files_modified, autonomous)
- [ ] Tarefas sao especificas e acionaveis
- [ ] Dependencias corretamente identificadas
- [ ] Waves atribuidas para execucao paralela
- [ ] must_haves derivados do objetivo da fase
Se algo falhar, corrija antes de retornar.
</self_check>

<output>
Escrever PLAN.md em: .plano/fases/{phase_dir}/
Retornar: ## PLANNING COMPLETE com resumo dos planos
</output>
", subagent_type="up-planejador", description="Planejar Fase {phase_number}")
```

Verificar retorno:
- `## PLANNING COMPLETE` → prosseguir para execucao
- `## PLANNING INCONCLUSIVE` → tentar novamente com mais contexto (max 2 tentativas)

```
Fase {X}: Planejada — {N} planos em {M} waves
```

#### 3.1.2 Executar Fase (com Specialist Routing)

Usar o mesmo processo do workflow executar-fase.md:

```bash
INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init executar-fase "${PHASE_NUMBER}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON para obter: `phase_dir`, `plan_count`, `incomplete_count`, `parallelization`.

```bash
PLAN_INDEX=$(node "$HOME/.claude/up/bin/up-tools.cjs" phase-plan-index "${PHASE_NUMBER}")
```

Parse para obter waves e planos.

**Specialist Routing — escolher o agente certo por plano:**

Para cada plano, ler o frontmatter e detectar o dominio:

| Se o plano envolve... | Usar agente |
|----------------------|-------------|
| Componentes React, paginas, UI, CSS, Tailwind | `up-frontend-specialist` |
| API routes, endpoints, middleware, validacao | `up-backend-specialist` |
| Schema, migrations, seeds, RLS, queries | `up-database-specialist` |
| Misto ou infra | `up-executor` (generico) |

**Deteccao:** Ler campo `type` do frontmatter do PLAN.md. Se nao existir, inferir dos `<files>` das tasks:
- Arquivos em `app/`, `components/`, `*.tsx` com JSX → frontend
- Arquivos em `api/`, `server/`, `middleware/`, `route.ts` → backend
- Arquivos `.sql`, `migrations/`, `schema/`, `seed` → database
- Misto → usar executor generico

**Executar waves:**

Para cada wave, spawnar agentes especializados em paralelo (se parallelization=true):

```
Task(
  subagent_type="{up-frontend-specialist | up-backend-specialist | up-database-specialist | up-executor}",
  prompt="
    <objective>
    Executar plano {plan_number} da fase {phase_number}-{phase_name}.
    Commitar cada tarefa atomicamente. Criar SUMMARY.md. Atualizar STATE.md e ROADMAP.md.
    </objective>

    <execution_context>
    @~/.claude/up/workflows/executar-plano.md
    @~/.claude/up/references/checkpoints.md
    </execution_context>

    <builder_mode>
    Modo builder ativo. Regras especiais:
    1. NAO use AskUserQuestion
    2. Checkpoints tipo checkpoint:human-verify → auto-aprovar e registrar
    3. Checkpoints tipo checkpoint:decision → tomar a decisao mais razoavel
    4. Checkpoints tipo checkpoint:human-action → se possivel automatizar, faca; se nao, registrar como pendente
    5. Deviation Rule 4 (architectural changes) → decidir autonomamente e registrar no SUMMARY
    6. CAPTURES: Se durante a execucao voce descobrir algo importante (padrao no codigo, problema potencial, oportunidade de melhoria, decisao arquitetural nao-obvia), registre em .plano/captures/ como arquivo markdown curto. Formato: `capture-{timestamp}-{slug}.md` com frontmatter: type (pattern|problem|opportunity|decision), severity (info|warning|critical), phase (numero). Corpo: 2-5 frases descrevendo o insight.
    </builder_mode>

    <files_to_read>
    Ler estes arquivos no inicio da execucao usando a ferramenta Read:
    - {phase_dir}/{plan_file} (Plano)
    - .plano/STATE.md (Estado)
    - .plano/config.json (Config)
    - ./CLAUDE.md (Instrucoes do projeto, se existir)
    </files_to_read>

    <success_criteria>
    - [ ] Todas tarefas executadas
    - [ ] Cada tarefa committed individualmente
    - [ ] SUMMARY.md criado no diretorio do plano
    - [ ] STATE.md atualizado
    - [ ] ROADMAP.md atualizado com progresso
    </success_criteria>
  "
)
```

**Spot-check apos cada wave:**
- Verificar que SUMMARYs existem
- Verificar que commits existem via `git log --oneline --grep`
- Se falha: tentar re-executar o plano falho (max 1 retry)

```
Wave {N}: {count} planos executados
```

#### 3.1.3 Reflect (Code Review)

**O passo "Reflect" do ciclo RARV — revisa codigo ANTES da verificacao formal.**

```
Fase {X}: Revisando codigo...
```

Spawnar code reviewer:

```
Task(
  subagent_type="up-code-reviewer",
  prompt="
    <objective>
    Revisar codigo da fase {phase_number} contra production-requirements e padroes de qualidade.
    Identificar problemas com localizacao exata e sugestao de fix.
    </objective>

    <files_to_read>
    - {phase_dir}/*-SUMMARY.md (O que foi implementado)
    - $HOME/.claude/up/references/production-requirements.md (Checklist de producao)
    - ./CLAUDE.md (Convencoes do projeto, se existir)
    </files_to_read>

    <constraints>
    - Revisar TODOS os arquivos modificados na fase (via git log --grep)
    - Verificar 6 dimensoes: production requirements, code quality, security, performance, edge cases, consistency
    - Gerar CODE-REVIEW.md com issues priorizadas e fixes sugeridos
    </constraints>
  ",
  description="Code Review da Fase {phase_number}"
)
```

Ler resultado do code review:

**Se ha issues CRITICAS (score < 7):**
- Spawnar executor para corrigir issues criticas
- Re-rodar code review (max 2 ciclos de correcao)

**Se score >= 7:**
- Registrar score e prosseguir

```
Reflect: score {N}/10 | {criticas} criticas | {importantes} importantes | {menores} menores
```

#### 3.1.4 Verificar Fase

Spawnar verificador autonomo:

```
Task(
  prompt="Verificar atingimento do objetivo da fase {phase_number}.
Diretorio da fase: {phase_dir}
Objetivo da fase: {goal do ROADMAP.md}
IDs de requisitos da fase: {phase_req_ids}

<builder_mode>
Modo builder. NAO use AskUserQuestion.
- Verificar must_haves contra codebase real
- Cross-referenciar requisitos do frontmatter contra REQUIREMENTS.md
- Rodar testes automatizados se existirem
- Se human_needed: considerar como PASSED (sera verificado no final)
- Criar VERIFICATION.md
</builder_mode>
",
  subagent_type="up-verificador"
)
```

Ler status da verificacao:

```bash
grep "^status:" "$PHASE_DIR"/*-VERIFICATION.md | cut -d: -f2 | tr -d ' '
```

| Status | Acao no Builder |
|--------|----------------|
| `passed` | Marcar fase completa, avancar |
| `gaps_found` | Tentar corrigir (planejar gaps + executar, max 1 ciclo) |
| `human_needed` | Registrar para revisao final, avancar |

#### 3.1.5 Teste E2E da Fase (Playwright)

**Executar APENAS se a fase tem UI/rotas** (pular para fases de infra, schema, config).

Detecao: Se PLANs da fase criam/modificam arquivos em `app/`, `pages/`, `src/components/`, `src/features/` ou arquivos `page.tsx`/`route.ts` → tem UI, testar.

**Referencia:** `@~/.claude/up/workflows/builder-e2e.md` — Passo 3 (Teste por Fase)

1. Subir dev server (se ainda nao esta rodando):
```bash
# Detectar e subir — ver builder-e2e.md Passo 1
# Manter rodando entre fases (nao matar apos cada fase)
```

2. Extrair must_haves da fase e traduzir em testes E2E

3. Para cada teste:
   - Navegar para rota relevante
   - `browser_snapshot()` para obter refs dos elementos
   - Verificar que elementos esperados existem
   - Interagir (clicar, preencher, submeter) se necessario
   - `browser_snapshot()` para verificar resultado
   - `browser_take_screenshot()` como evidencia em `.plano/fases/[fase]/screenshots/`
   - `browser_console_messages(level: "error")` — checar erros JS
   - `browser_network_requests()` — checar falhas de API

4. Se bugs encontrados:
   - Para cada bug: loop de correcao (max 5 tentativas)
     - Analisar (screenshot + console + network + codigo)
     - Se tentativa > 1: analisar por que correcao anterior falhou
     - Corrigir inline
     - Commit: `fix(fase-{X}): [descricao] (tentativa N)`
     - Re-testar o teste que falhou
     - Se passou: proximo bug. Se falhou: proxima tentativa
   - Apos 5 tentativas sem sucesso: registrar como nao corrigido

5. Criar `.plano/fases/[fase]/E2E-RESULTS.md` com resultados

```
Fase {X}: E2E — {passed}/{total} testes passaram [{bugs} bugs, {fixed} corrigidos]
```

**Se nao tem UI:** Pular silenciosamente.
**Se dev server falha:** Registrar e pular E2E (nao bloqueia).

#### 3.1.6 Marcar Fase Completa

```bash
COMPLETION=$(node "$HOME/.claude/up/bin/up-tools.cjs" phase complete "${PHASE_NUMBER}")
```

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs(fase-{X}): completar execucao" --files .plano/ROADMAP.md .plano/STATE.md .plano/REQUIREMENTS.md
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > FASE {X}/{TOTAL} COMPLETA ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 3.1.7 Reassessment (Re-avaliacao do Roadmap)

Apos cada fase completa, verificar se o roadmap ainda faz sentido ANTES de planejar a proxima.

**Quando fazer reassessment:**
- SEMPRE apos completar uma fase (rapido, ~30 segundos)
- NAO requer agente separado — o orquestrador faz inline

**Processo:**

1. Ler ROADMAP.md (fases futuras) e SUMMARYs da fase recem-completa
2. Verificar 3 coisas:

   **a) Fases futuras ainda sao necessarias?**
   - A fase recem-completa pode ter resolvido algo que uma fase futura faria
   - Ex: Fase 3 (auth) pode ter adicionado RBAC que Fase 6 (permissoes) planejava
   - Se sim: marcar fase futura como "Removida (coberta pela Fase X)" no ROADMAP

   **b) Fases futuras precisam de ajuste?**
   - Decisoes arquiteturais da fase atual podem mudar o escopo de fases futuras
   - Ex: Escolheu tRPC ao inves de REST — fases de API precisam refletir isso
   - Se sim: atualizar objetivo/criterios da fase futura no ROADMAP

   **c) Surgiram necessidades novas?**
   - Ler `.plano/captures/` para insights capturados durante a fase
   - Se algum insight e CRITICO (bloqueia fases futuras): adicionar nova fase
   - Se e melhoria: ignorar (sera coberto pelo estagio Polish)

3. Se houve mudancas no roadmap:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs: reassessment apos fase {X}" --files .plano/ROADMAP.md
```

```
Reassessment: [sem mudancas | X fases ajustadas | Y fases removidas | Z fases adicionadas]
```

**Se NAO houve mudancas:** Seguir silenciosamente (1 linha de log apenas).

#### 3.1.8 Avancar para Proxima Fase

Voltar para 3.1.1 com a proxima fase. Sem /clear — continuar no mesmo contexto.

**Gestao de contexto:** Se o contexto estiver acima de ~60%, fazer um checkpoint:
- Salvar estado atual em STATE.md
- Registrar fase atual e status
- Continuar (com 1M de contexto, a maioria dos projetos cabe)

---

## Estagio 4: QUALITY GATE LOOP (Autonomo)

Executado APOS todas as fases do build completarem.
Ciclo de avaliacao → correcao → re-avaliacao ate atingir score >= 9.0/10.

**Score Composto (6 dimensoes):**

| Dimensao | Peso | Como mede |
|----------|------|-----------|
| Funcionalidade | 25% | Requisitos atendidos / total (REQUIREMENTS.md) |
| E2E | 20% | Testes passando / total (Playwright) |
| UX | 15% | Score do UX tester (6 sub-dimensoes) |
| Responsividade | 15% | Score do mobile-first |
| Codigo | 15% | Score do melhorias (UX+perf+modernidade) |
| Completude | 10% | Paginas sem erro / total (smoke test) |

**Limites de seguranca:**
- Max 5 ciclos de refinamento
- Se ciclo melhorou < 0.3 pontos: parar (diminishing returns)
- Nunca entregar abaixo de 7.0 (se ta abaixo, tem bug grave)
- Meta: score >= 9.0

### 4.0 Iniciar Quality Gate

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > QUALITY GATE — CICLO 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Definir `$CYCLE = 1`, `$PREVIOUS_SCORE = 0`.

### 4.1 Rodar Avaliadores (Todos em Paralelo)

**4.1a Melhorias de Codigo** (3 auditores paralelos → sintetizador)

Mesmo processo existente: spawnar up-auditor-ux, up-auditor-performance, up-auditor-modernidade em paralelo, depois up-sintetizador-melhorias.

### 4.1 Rodar Melhorias

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > POLIMENTO — AUDITORIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```bash
mkdir -p .plano/melhorias
```

Spawnar 3 auditores em paralelo (mesmo processo do melhorias.md):

```
Task(subagent_type="up-auditor-ux", prompt="
<objective>
Executar auditoria completa de UX/usabilidade do codebase deste projeto.
Salvar resultado em .plano/melhorias/ux-sugestoes.md
</objective>
<files_to_read>
- ./CLAUDE.md (se existir)
</files_to_read>
<constraints>
- Carregar reference: $HOME/.claude/up/references/audit-ux.md
- Carregar template: $HOME/.claude/up/templates/suggestion.md
- Salvar resultado em .plano/melhorias/ux-sugestoes.md
- Retornar resumo: ## AUDITORIA UX COMPLETA
</constraints>
", description="Auditoria UX")

Task(subagent_type="up-auditor-performance", prompt="
<objective>
Executar auditoria completa de performance do codebase deste projeto.
Salvar resultado em .plano/melhorias/performance-sugestoes.md
</objective>
<files_to_read>
- ./CLAUDE.md (se existir)
</files_to_read>
<constraints>
- Carregar reference: $HOME/.claude/up/references/audit-performance.md
- Carregar template: $HOME/.claude/up/templates/suggestion.md
- Salvar resultado em .plano/melhorias/performance-sugestoes.md
- Retornar resumo: ## AUDITORIA PERFORMANCE COMPLETA
</constraints>
", description="Auditoria Performance")

Task(subagent_type="up-auditor-modernidade", prompt="
<objective>
Executar auditoria completa de modernidade do codebase deste projeto.
Salvar resultado em .plano/melhorias/modernidade-sugestoes.md
</objective>
<files_to_read>
- ./CLAUDE.md (se existir)
</files_to_read>
<constraints>
- Carregar reference: $HOME/.claude/up/references/audit-modernidade.md
- Carregar template: $HOME/.claude/up/templates/suggestion.md
- Salvar resultado em .plano/melhorias/modernidade-sugestoes.md
- Retornar resumo: ## AUDITORIA MODERNIDADE COMPLETA
</constraints>
", description="Auditoria Modernidade")
```

Apos os 3 retornarem, spawnar sintetizador:

```
Task(subagent_type="up-sintetizador-melhorias", prompt="
<objective>
Sintetizar sugestoes dos 3 auditores em relatorio consolidado.
Salvar em .plano/melhorias/RELATORIO.md
</objective>
<files_to_read>
- .plano/melhorias/ux-sugestoes.md
- .plano/melhorias/performance-sugestoes.md
- .plano/melhorias/modernidade-sugestoes.md
- ./CLAUDE.md (se existir)
</files_to_read>
<constraints>
- Carregar template: $HOME/.claude/up/templates/report.md
- Carregar template: $HOME/.claude/up/templates/suggestion.md
- Deduplicar, detectar conflitos, classificar em 4 quadrantes
- Retornar resumo: ## SINTESE DE MELHORIAS COMPLETA
</constraints>
", description="Sintetizar melhorias")
```

### 4.2 Aplicar Quick Wins

Ler `.plano/melhorias/RELATORIO.md` e extrair sugestoes do quadrante "Quick Wins" (alto impacto, baixo esforco).

**Filtro:** Aplicar apenas Quick Wins com impacto >= "Grande" ou "Medio".

Se ha Quick Wins para aplicar:

1. Gerar fases a partir do relatorio:
```bash
echo '{"source":"melhorias","report_path":".plano/melhorias/RELATORIO.md","approved_ids":["MELH-001","MELH-003"],"grouping":"auto"}' | node "$HOME/.claude/up/bin/up-tools.cjs" phase generate-from-report
```

2. Para cada fase gerada de melhoria:
   - Planejar (up-planejador com builder_mode)
   - Executar (up-executor com builder_mode)
   - Verificar rapidamente

3. Commitar melhorias:
```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "polish: aplicar quick wins de melhorias" --files .plano/ROADMAP.md .plano/STATE.md
```

```
Melhorias: [N] quick wins aplicadas
```

Se nao ha Quick Wins ou todas tem impacto baixo:
```
Melhorias: auditoria completa, sem quick wins para aplicar automaticamente
Relatorio completo em .plano/melhorias/RELATORIO.md
```

### 4.3 UX Tester (Navegar como Usuario Real)

**Executar APENAS se o projeto tem UI web.** Pular para CLIs, APIs puras, bibliotecas.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > POLIMENTO — UX REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Referencia:** `@~/.claude/up/workflows/ux-tester.md`

Executar o workflow completo do UX Tester:

1. Subir dev server (se nao esta rodando do E2E)
2. Descobrir fluxos (de PROJECT.md/REQUIREMENTS.md)
3. Definir 2-3 personas
4. Navegar cada fluxo como cada persona, avaliando 6 dimensoes:
   - Clareza, Eficiencia, Feedback, Consistencia, Acessibilidade, Performance
5. Gerar `.plano/ux-review/UX-REPORT.md` com issues e scores
6. **Implementar TODAS as melhorias seguras automaticamente:**
   - Textos/copy confusos → reescrever
   - Feedback ausente → adicionar loading, toasts, hover states
   - Acessibilidade → alt, labels, aria, focus visible
   - Espacamento/layout → padding, margin, fontes
   - Consistencia → unificar estilos, terminologia
   - Performance simples → lazy loading, debounce, memo
7. Commit atomico por melhoria: `ux({area}): {descricao}`
8. Screenshots antes/depois para cada melhoria
9. Re-navegar para confirmar

```
UX Review: score [N]/10 | [X] issues | [Y] implementadas (incluindo componentes novos e ajustes de fluxo) | [Z] tentativas falhas
```

**Se nao tem UI:** Pular silenciosamente.
**Se dev server falha:** Registrar e pular.

### 4.4 Mobile First (Responsividade)

**Executar APENAS se o projeto tem UI web.** Pular para CLIs, APIs puras, bibliotecas.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > POLIMENTO — RESPONSIVIDADE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Referencia:** `@~/.claude/up/workflows/mobile-first.md`

Executar o workflow completo do Mobile First:

1. Detectar stack CSS (Tailwind, CSS Modules, etc.)
2. Scan: capturar todas as paginas em mobile (390px), tablet (768px), desktop (1920px)
3. Detectar problemas: overflow, texto pequeno, alvos de toque, grid quebrado
4. Para cada problema:
   - Capturar referencia desktop
   - Corrigir com classes responsivas / media queries
   - Verificar mobile melhorou
   - Verificar desktop INTACTO (se mudou: reverter, tentar outra abordagem)
   - Commit atomico
5. Gerar `.plano/mobile-review/MOBILE-REPORT.md`

```
Mobile First: score [N]/10 | [X] problemas | [Y] corrigidos | desktop intacto
```

**Se nao tem UI:** Pular silenciosamente.
**Se dev server falha:** Registrar e pular.

### 4.5 Rodar Ideias

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > POLIMENTO — IDEIAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```bash
mkdir -p .plano/ideias
```

Spawnar 2 agentes em paralelo:

```
Task(subagent_type="up-analista-codigo", prompt="
<objective>
Analisar codebase para identificar gaps funcionais e oportunidades de features novas.
Salvar em .plano/ideias/codigo-sugestoes.md
</objective>
<files_to_read>
- ./CLAUDE.md (se existir)
- .plano/PROJECT.md
</files_to_read>
", description="Analise de codigo para ideias")

Task(subagent_type="up-pesquisador-mercado", prompt="
<objective>
Pesquisar concorrentes e tendencias de mercado para sugerir features novas.
Salvar em .plano/ideias/mercado-sugestoes.md
</objective>
<files_to_read>
- .plano/PROJECT.md
</files_to_read>
", description="Pesquisa de mercado para ideias")
```

Apos os 2 retornarem, spawnar consolidador:

```
Task(subagent_type="up-consolidador-ideias", prompt="
<objective>
Consolidar sugestoes de features. Aplicar ICE scoring, gerar anti-features.
Salvar em .plano/ideias/RELATORIO.md
</objective>
<files_to_read>
- .plano/ideias/codigo-sugestoes.md
- .plano/ideias/mercado-sugestoes.md
- .plano/PROJECT.md
</files_to_read>
", description="Consolidar ideias com ICE scoring")
```

**NAO implementar ideias.** Apenas salvar o relatorio.

```
Ideias: [N] sugestoes geradas com ICE scoring
Relatorio em .plano/ideias/RELATORIO.md
```

### 4.6 Blind Validation (Testar como Usuario Final)

**Validar requisitos SEM ler codigo — apenas navegando o app.**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 QUALITY GATE — BLIND VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```
Task(
  subagent_type="up-blind-validator",
  prompt="
    <objective>
    Validar requisitos SEM ler codigo. Apenas navegar o app via Playwright e curl.
    Testar cada requisito como usuario final: renderiza? funciona? feedback existe?
    </objective>

    <files_to_read>
    - .plano/REQUIREMENTS.md (UNICO doc de especificacao)
    - .plano/PROJECT.md (contexto do produto)
    </files_to_read>

    <constraints>
    - NAO ler arquivos de codigo (.ts, .tsx, .py, .css)
    - NAO ler SUMMARYs, PLANs, ARCHITECTURE
    - APENAS navegar o app e testar como usuario
    - Gerar BLIND-VALIDATION.md com screenshots
    </constraints>
  ",
  description="Blind Validation — testar como usuario final"
)
```

```
Blind Validation: {score}% | {passed} PASS | {failed} FAIL | {partial} PARTIAL
```

### 4.7 Calcular Score Composto

Agregar scores de todos os avaliadores:

```
Funcionalidade (20%): requisitos [x] / total no REQUIREMENTS.md → 0-10
Blind Valid. (20%):   score do BLIND-VALIDATION.md → 0-10
E2E (15%):            testes passaram / total no E2E mais recente → 0-10
UX (10%):             score do UX-REPORT.md → 0-10
Responsividade (10%): score do MOBILE-REPORT.md → 0-10
Codigo (15%):         (10 - problemas_criticos) do RELATORIO.md melhorias → 0-10
Completude (10%):     rotas sem erro / total no smoke test → 0-10

Score = (func × 0.20) + (blind × 0.20) + (e2e × 0.15) + (ux × 0.10) + (resp × 0.10) + (cod × 0.15) + (comp × 0.10)
```

**Se algum avaliador nao rodou** (ex: sem UI, sem E2E): redistribuir peso proporcionalmente entre os que rodaram.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 QUALITY GATE — CICLO {CYCLE} — SCORE: {SCORE}/10
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Dimensao | Score | Peso | Contribuicao |
|----------|-------|------|-------------|
| Funcionalidade | [N]/10 | 25% | [X] |
| E2E | [N]/10 | 20% | [X] |
| UX | [N]/10 | 15% | [X] |
| Responsividade | [N]/10 | 15% | [X] |
| Codigo | [N]/10 | 15% | [X] |
| Completude | [N]/10 | 10% | [X] |
| **TOTAL** | **[SCORE]/10** | | |
```

### 4.8 Decidir: Continuar ou Entregar

**Se score >= 9.0:** Ir para Estagio 5 (Entrega). Sistema pronto.

**Se score < 9.0 E cycle < 5 E (score - previous_score) >= 0.3:**

```
Score {SCORE} < 9.0 — identificando gaps para correcao...
```

Identificar top gaps (dimensoes com menor score):
1. Ordenar dimensoes por score (menor primeiro)
2. Para cada dimensao abaixo de 9.0:
   - Ler relatorio correspondente
   - Extrair issues nao corrigidas / requisitos pendentes
   - Priorizar por impacto no score

**Implementar correcoes:**
- Issues de codigo: planejar mini-fase → executar → commit
- Issues de UX: aplicar fixes (mesmo processo do UX tester)
- Issues de responsividade: aplicar fixes (mesmo processo do mobile-first)
- Requisitos pendentes: planejar mini-fase → executar
- Issues de E2E: corrigir bugs (max 5 tentativas)

Apos implementar:

```
$PREVIOUS_SCORE = $SCORE
$CYCLE += 1
```

**Voltar para 4.1** (re-rodar avaliadores no proximo ciclo).

**Se cycle >= 5:** Entregar com score atual.
```
Quality Gate: max ciclos atingido. Entregando com score {SCORE}/10.
```

**Se (score - previous_score) < 0.3:** Diminishing returns. Entregar.
```
Quality Gate: melhoria < 0.3 pontos. Entregando com score {SCORE}/10.
```

### 4.9 DevOps — Artefatos de Producao

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > PRODUCTION ARTIFACTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Spawnar devops agent:

```
Task(
  subagent_type="up-devops-agent",
  prompt="
    <objective>
    Gerar artefatos de producao para o projeto: Dockerfile, docker-compose, CI/CD, .env.example, seed data, scripts.
    </objective>

    <files_to_read>
    - .plano/PROJECT.md
    - .plano/SYSTEM-DESIGN.md (schema, integracoes)
    - ./package.json
    - ./CLAUDE.md (se existir)
    </files_to_read>

    <builder_mode>
    Modo builder. NAO pergunte nada. Gere tudo autonomamente.
    Adapte ao stack real do projeto.
    </builder_mode>
  ",
  description="Gerar artefatos de producao"
)
```

```
DevOps: Dockerfile + docker-compose + CI/CD + .env.example + seed data
```

### 4.10 Technical Writer — Documentacao

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > DOCUMENTACAO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Spawnar technical writer:

```
Task(
  subagent_type="up-technical-writer",
  prompt="
    <objective>
    Gerar documentacao completa: README.md, API docs, CHANGELOG.md, setup guide.
    Documentacao com conteudo REAL do projeto (nao placeholders).
    </objective>

    <files_to_read>
    - .plano/PROJECT.md
    - .plano/REQUIREMENTS.md
    - .plano/SYSTEM-DESIGN.md
    - .plano/PRODUCT-ANALYSIS.md
    - ./package.json
    - ./CLAUDE.md (se existir)
    </files_to_read>

    <builder_mode>
    Modo builder. NAO pergunte nada. Gere documentacao autonomamente.
    README deve ter instrucoes de setup que FUNCIONAM.
    </builder_mode>
  ",
  description="Gerar documentacao completa"
)
```

```
Docs: README.md + CHANGELOG.md + API docs
```

### 4.11 Security Review

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > SECURITY AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Spawnar security reviewer:

```
Task(
  subagent_type="up-security-reviewer",
  prompt="
    <objective>
    Auditar codigo para vulnerabilidades de seguranca (OWASP Top 10, auth, injection, data exposure).
    </objective>

    <files_to_read>
    - ./CLAUDE.md (se existir)
    - .plano/SYSTEM-DESIGN.md (roles, auth design)
    </files_to_read>

    <builder_mode>
    Modo builder. Gere SECURITY-REVIEW.md com vulnerabilidades encontradas.
    </builder_mode>
  ",
  description="Auditoria de seguranca"
)
```

Se ha vulnerabilidades CRITICAS: corrigir automaticamente (spawnar executor com fix sugerido).

```
Security: score {N}/10 | {criticas} criticas | {altas} altas
```

### 4.12 QA — Testes Automatizados

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > QA — TESTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Spawnar QA agent:

```
Task(
  subagent_type="up-qa-agent",
  prompt="
    <objective>
    Identificar gaps de cobertura de testes, escrever testes que faltam, executar todos.
    </objective>

    <files_to_read>
    - .plano/PROJECT.md
    - ./package.json
    - ./CLAUDE.md (se existir)
    </files_to_read>

    <builder_mode>
    Modo builder. Escreva testes e rode autonomamente.
    Foco: API routes (90%+), logica de negocio (80%+), componentes com logica (70%+).
    </builder_mode>
  ",
  description="QA — escrever e rodar testes"
)
```

```
QA: {N} testes escritos | {X} passando | cobertura estimada {%}
```

### 4.13 Rodar Ideias (Uma Vez, Apos Quality Gate)

**Rodar ideias apenas UMA VEZ, apos o loop de qualidade terminar (nao a cada ciclo).**

Mesmo processo de ideias existente (2 agentes paralelos + consolidador).
NAO implementar ideias — apenas salvar relatorio para proximos passos.

---

## Estagio 5: ENTREGA (Autonomo)

### 5.1 Teste E2E Final Completo (Playwright)

**Referencia:** `@~/.claude/up/workflows/builder-e2e.md` — Passo 4 (Teste Final)

**Executar APENAS se o projeto tem UI web.** Pular para CLIs, APIs puras, bibliotecas.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > TESTE E2E FINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

1. Subir dev server (se nao esta rodando)
2. Criar diretorios:
```bash
mkdir -p .plano/e2e/smoke .plano/e2e/responsive .plano/e2e/flows
```

3. **Smoke test de rotas:**
   - Descobrir todas as rotas do projeto (de arquivos page.tsx/route.ts)
   - Visitar cada rota
   - Screenshot de cada uma
   - Checar console errors
   - Registrar rotas OK vs quebradas

4. **Fluxos E2E principais (3-5 fluxos):**
   - Derivar de REQUIREMENTS.md os fluxos criticos
   - Para cada fluxo: navegar → interagir → verificar → screenshot
   - Se auth necessario: criar usuario de teste ou usar seed data

5. **Teste de responsividade:**
   - Desktop (1920x1080), Tablet (768x1024), Mobile (375x812)
   - Screenshot da pagina principal em cada viewport
   - Verificar se layout adapta (nao overflow, nao cortado)

6. **Correcao de bugs encontrados:**
   - Para cada bug: loop de correcao (max 5 tentativas por bug)
     - Analisar → corrigir → commit → re-testar
     - Se tentativa > 1: analisar por que tentativa anterior falhou
   - Apos 5 tentativas: registrar como nao corrigido e seguir

7. Gerar `.plano/e2e/E2E-REPORT.md` com resultados completos

8. Matar dev server e fechar browser:
```bash
kill $DEV_PID 2>/dev/null
```
`browser_close()`

```
Teste E2E: {routes_ok}/{routes_total} rotas | {flows_passed}/{flows_total} fluxos | {bugs} bugs [{fixed} corrigidos]
```

**Se nao tem UI:** Pular silenciosamente.
**Se dev server falha:** Registrar e pular (nao bloqueia entrega).

### 5.2 Verificacao de Requisitos

Ler REQUIREMENTS.md e verificar cobertura:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" progress json
```

Contar requisitos completos vs total.

Se ha requisitos pendentes: listar com motivo (fase falhou, verificacao pendente, etc.).

### 5.3 Triagem de Captures (Insights)

Ler todos os arquivos em `.plano/captures/`:

```bash
ls .plano/captures/*.md 2>/dev/null | wc -l
```

Se ha captures:

1. Ler cada arquivo e classificar:

| type | Acao |
|------|------|
| `critical` + `problem` | Listar no DELIVERY.md como "Problemas Criticos Detectados" |
| `warning` + `problem` | Listar no DELIVERY.md como "Alertas" |
| `opportunity` | Listar no DELIVERY.md como "Oportunidades Detectadas" |
| `pattern` | Listar no DELIVERY.md como "Padroes Identificados" |
| `decision` | Ja registrado no PROJECT.md — ignorar |
| `info` | Ignorar (informativo apenas) |

2. Gerar `.plano/captures/TRIAGE.md`:

```markdown
# Triagem de Insights

**Total capturado:** [N] insights durante o build

## Criticos
[insights criticos que precisam de atencao]

## Alertas
[problemas potenciais detectados]

## Oportunidades
[melhorias e features descobertas durante o build]

## Padroes
[padroes identificados no codebase]

## Estatisticas
| Tipo | Quantidade |
|------|-----------|
| critical | [N] |
| warning | [N] |
| opportunity | [N] |
| pattern | [N] |
| decision | [N] |
| info | [N] |
```

Se NAO ha captures: pular silenciosamente.

### 5.4 Gerar DELIVERY.md (incluindo resultados E2E)

Carregar template de `$HOME/.claude/up/templates/delivery.md`.

Preencher com dados de:
- PROJECT.md (nome, stack, core value)
- ROADMAP.md (fases completadas)
- REQUIREMENTS.md (cobertura)
- SUMMARYs de cada fase (o que foi construido)
- .plano/e2e/E2E-REPORT.md (resultados do teste E2E final, se existir)
- E2E-RESULTS.md de cada fase (resultados por fase, se existirem)
- .plano/captures/TRIAGE.md (insights capturados durante o build, se existir)
- .plano/melhorias/RELATORIO.md (melhorias aplicadas, se existir)
- .plano/ideias/RELATORIO.md (top 5 ideias por ICE, se existir)
- package.json (como rodar)
- .env.example ou env vars usados (credenciais necessarias)

Contar commits:
```bash
git rev-list --count HEAD
```

Escrever `.plano/DELIVERY.md`.

### 5.5 Commit Final e Cleanup

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs: relatorio de entrega (modo builder)" --files .plano/DELIVERY.md
```

**Remover LOCK.md (sessao concluida com sucesso):**
```bash
rm -f .plano/LOCK.md
```

**Fechar Dashboard:**
```bash
kill $DASH_PID 2>/dev/null
```

### 5.6 Apresentar Resultado

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > BUILDER — PROJETO ENTREGUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**[Nome do Projeto]**

[Resumo em 2-3 frases do que foi construido]

## O que foi Entregue

| Fase | O que Construiu | Status |
|------|----------------|--------|
| 1 | [resumo] | Completo |
| 2 | [resumo] | Completo |
| ... | ... | ... |

## Metricas

| Metrica | Valor |
|---------|-------|
| Fases | [N] completadas |
| Requisitos | [X]/[Y] atendidos |
| Commits | [N] |
| Melhorias aplicadas | [N] |
| Ideias geradas | [N] |

## Itens para Revisao Humana

[Lista de itens marcados como human_needed durante verificacao]
[Se nenhum: "Nenhum — todas verificacoes automaticas passaram"]

## Proximos Passos (Top 5 Ideias)

1. [Ideia 1] — ICE: [score]
2. [Ideia 2] — ICE: [score]
3. [Ideia 3] — ICE: [score]
4. [Ideia 4] — ICE: [score]
5. [Ideia 5] — ICE: [score]

───────────────────────────────────────────────────────────────

Relatorio completo: .plano/DELIVERY.md

Como rodar:
[Instrucoes de setup do DELIVERY.md]

───────────────────────────────────────────────────────────────
```

</process>

<light_process>
## MODO LIGHT — Pipeline Enxuto

**Ativado quando `--light` esta nos $ARGUMENTS.**
Extrair `--light` dos argumentos. O restante e o briefing.

### L1. Intake Rapido

#### L1.1 Detectar Modo

Mesmo processo do full: verificar codigo existente para determinar greenfield/brownfield.

```bash
ls package.json go.mod Cargo.toml requirements.txt pyproject.toml 2>/dev/null
ls -d src/ app/ lib/ pages/ components/ 2>/dev/null | head -10
```

#### L1.2 Receber Briefing

Se briefing veio nos $ARGUMENTS: usar direto.
Se vazio: pedir freeform (mesma logica do full).

#### L1.3 Perguntas Criticas

Mesma logica do full — perguntar APENAS o essencial (credenciais, APIs, ambiguidades criticas).

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > BUILDER LIGHT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature:** [resumo em 1-2 frases]
**Modo:** [greenfield/brownfield]
**Stack:** [detectada ou inferida]

Pipeline enxuto: planejar → executar → testar.
Iniciando...
```

═══════════════════════════════════════════════════════
 FIM DA INTERACAO COM USUARIO
═══════════════════════════════════════════════════════

---

### L2. Estrutura Inline (Sem Agente Separado)

**NAO spawnar up-arquiteto.** Fazer tudo inline para economizar tokens.

#### L2.1 Entender o Codebase (Brownfield)

**Se `.plano/codebase/` existe e recente (< 7 dias):** Ler STACK.md e CONVENTIONS.md apenas. Pular mapeamento.

**Se nao existe:** Mini-scan inline:
```bash
# Stack
cat package.json 2>/dev/null | head -50
ls tsconfig.json next.config.* vite.config.* 2>/dev/null

# Estrutura
find . -type d -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/.plano/*' -maxdepth 3 | head -30

# Arquivos principais
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | head -30
```

**Greenfield:** Pular. Inferir stack do briefing ou defaults.

#### L2.2 Criar/Atualizar Documentos

```bash
mkdir -p .plano
git init 2>/dev/null
```

**PROJECT.md** — Criar ou atualizar inline (sem template elaborado):
```markdown
# [Nome do Projeto/Feature]

## O que e
[Briefing do usuario em 2-3 frases]

## Stack
[Stack detectada ou inferida]

## Requisitos
- [ ] [REQ-01]: [requisito 1]
- [ ] [REQ-02]: [requisito 2]
...
```

**ROADMAP.md** — Criar ou atualizar com 1-3 fases:
- Se feature simples: 1 fase
- Se feature media: 2-3 fases
- Cada fase com objetivo e criterios de sucesso

**STATE.md** — Inicializar ou atualizar.

**config.json:**
```json
{
  "mode": "yolo",
  "granularity": "coarse",
  "parallelization": true,
  "commit_docs": true,
  "builder_mode": true,
  "builder_type": "light"
}
```

Commit:
```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs: estruturar feature (builder light)" --files .plano/PROJECT.md .plano/ROADMAP.md .plano/STATE.md .plano/config.json
```

Se REQUIREMENTS.md foi criado/atualizado:
```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs: requisitos (builder light)" --files .plano/REQUIREMENTS.md
```

---

### L3. Build + E2E

Mesmo loop do full (3.1.1 → 3.1.5), mas:
- **Sem LOCK.md** (sessao curta)
- **Sem reassessment** (poucas fases)
- **Sem captures** (sessao curta)
- **COM E2E Playwright** (se tem UI)

Para cada fase no ROADMAP:

#### L3.1 Planejar Fase

Spawnar up-planejador (mesmo do full):

```
Task(prompt="
<planning_context>
**Fase:** {phase_number}
**Modo:** builder light (autonomo -- NAO use AskUserQuestion)

<files_to_read>
- .plano/STATE.md
- .plano/ROADMAP.md
- .plano/REQUIREMENTS.md (se existir)
- ./CLAUDE.md (se existir)
</files_to_read>

**IDs de requisitos da fase:** {phase_req_ids}

<builder_mode>
Modo builder light. Regras:
1. NAO use AskUserQuestion
2. Se ha ambiguidade, tome a decisao mais razoavel
3. Pesquisa inline: nivel 1 apenas (verificacao rapida, nao pesquisa profunda)
4. Planos devem ser CONCISOS — minimo de tarefas necessarias
</builder_mode>

<output>
Escrever PLAN.md em: .plano/fases/{phase_dir}/
Retornar: ## PLANNING COMPLETE
</output>
", subagent_type="up-planejador", description="Planejar Fase {phase_number} (light)")
```

#### L3.2 Executar Fase

Mesmo processo do full — spawnar up-executor por wave.

#### L3.3 Verificar Fase (Quick Check)

**NAO spawnar up-verificador.** Verificacao inline rapida:

1. Checar que SUMMARYs existem para todos os planos
2. Checar que commits existem: `git log --oneline --grep="fase-{X}"`
3. Se ha testes automatizados no projeto: rodar
```bash
# Detectar e rodar testes
npm test 2>/dev/null || pnpm test 2>/dev/null || echo "sem testes"
```
4. Se tudo OK: marcar fase completa

Se falha: tentar gap closure (1 ciclo max), mesmo do full.

#### L3.4 Teste E2E (Playwright)

**Mesmo processo do full** (referencia: builder-e2e.md Passo 3).
Executar APENAS se a fase tem UI.

- Subir dev server (se nao esta rodando)
- Traduzir must_haves em testes E2E
- Navegar, interagir, verificar, screenshot
- Bugs: corrigir (max 5 tentativas por bug)
- Criar E2E-RESULTS.md

#### L3.5 Marcar Fase Completa

```bash
COMPLETION=$(node "$HOME/.claude/up/bin/up-tools.cjs" phase complete "${PHASE_NUMBER}")
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs(fase-{X}): completar (light)" --files .plano/ROADMAP.md .plano/STATE.md
```

Avancar para proxima fase. Sem reassessment.

---

### L4. Resumo Final

Apos todas as fases:

```bash
# Matar dev server se rodando
kill $DEV_PID 2>/dev/null
```

`browser_close()` (se Playwright aberto)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > BUILDER LIGHT — COMPLETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature:** [resumo do briefing]

## O que foi Feito

| Fase | O que Construiu | Status |
|------|----------------|--------|
| [N] | [resumo] | Completo |
| [N+1] | [resumo] | Completo |

## Metricas

| Metrica | Valor |
|---------|-------|
| Fases | [N] |
| Commits | [N] |
| E2E testes | [X] passaram de [Y] |
| Bugs corrigidos | [N] |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quer polir? /up:ux-tester ou /up:melhorias
Quer mais? /up:modo-builder "proxima feature"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**NAO gerar DELIVERY.md. NAO rodar polish. NAO rodar ideias.**

</light_process>

<failure_handling>

## Tratamento de Falhas

### Planejamento falha (PLANNING INCONCLUSIVE)
- Retry 1: Adicionar mais contexto da pesquisa ao prompt
- Retry 2: Simplificar escopo da fase (dividir em 2)
- Se ainda falha: Pular fase, registrar em DELIVERY.md como "Nao implementada"

### Execucao falha (agente nao retorna SUMMARY)
- Retry 1: Re-spawnar executor para o plano falho
- Se ainda falha: Registrar plano como incompleto, continuar com proxima wave/fase

### Verificacao encontra gaps
- Ciclo 1: Planejar gaps + executar gap closure
- Se gaps persistem: Registrar como pendente, avancar (sera listado no DELIVERY.md)

### Melhorias/Ideias falham
- Estas etapas sao opcionais no builder
- Se algum agente falha: Continuar com os que completaram
- Se todos falham: Pular estagio, registrar no DELIVERY.md

**Principio:** O builder NUNCA para. Falhas sao registradas e contornadas. O usuario recebe o maximo possivel.

</failure_handling>

<context_management>

## Gestao de Contexto (1M tokens)

Com 1M de contexto, a maioria dos projetos cabe sem /clear. Mas monitore:

**Orquestrador fica enxuto:**
- NAO leia conteudo de SUMMARYs inteiros — apenas verifique existencia
- NAO leia PLANs apos planejamento — apenas passe caminhos ao executor
- NAO leia codigo fonte — apenas verifique via git log/ls

**Subagentes recebem contexto limpo:**
- Cada Task() spawna com contexto fresco
- Passe apenas caminhos de arquivos, nao conteudo

**Se contexto atingir ~70%:**
- Reduzir output de status (1 linha por fase ao inves de tabelas)
- Pular estagio Polish (melhorias + ideias) se necessario
- Priorizar completar build sobre polimento

</context_management>

<success_criteria>

## Criterios de Sucesso do Builder

- [ ] Estagio 1: Briefing coletado, perguntas criticas respondidas
- [ ] Estagio 2: Product Analyst executado (concorrentes, features, personas)
- [ ] Estagio 2: System Designer executado (modulos, roles, schema, blueprints, 5 camadas)
- [ ] Estagio 2: Architect executou (PROJECT.md, REQUIREMENTS.md, ROADMAP.md criados)
- [ ] Estagio 2: Requisitos completos (50-100 requisitos, 5 camadas)
- [ ] Estagio 3: Todas as fases planejadas
- [ ] Estagio 3: Todas as fases executadas (com specialist routing)
- [ ] Estagio 3: Reflect (code review) apos cada fase
- [ ] Estagio 3: Todas as fases verificadas
- [ ] Estagio 3: Fases com UI testadas via Playwright (E2E-RESULTS.md)
- [ ] Estagio 3: Bugs E2E corrigidos (quando possivel)
- [ ] Estagio 3: Reassessment apos cada fase (roadmap re-avaliado)
- [ ] Estagio 3: Commits atomicos por tarefa
- [ ] Estagio 3: LOCK.md atualizado a cada transicao de estado
- [ ] Estagio 3: Insights capturados em .plano/captures/ (se descobertos)
- [ ] Estagio 4: Auditoria de melhorias executada (3 dimensoes)
- [ ] Estagio 4: Quick wins aplicadas
- [ ] Estagio 4: UX Review executado (navegar como usuario, 6 dimensoes)
- [ ] Estagio 4: Melhorias UX implementadas automaticamente
- [ ] Estagio 4: UX-REPORT.md gerado com scores e screenshots
- [ ] Estagio 4: Mobile First executado (responsividade verificada em 3 viewports)
- [ ] Estagio 4: MOBILE-REPORT.md gerado com score e screenshots comparativos
- [ ] Estagio 4: Score composto calculado (6 dimensoes)
- [ ] Estagio 4: Quality gate loop executado (ate score >= 9.0 ou max 5 ciclos)
- [ ] Estagio 4: DevOps artifacts gerados (Dockerfile, CI/CD, .env.example, seed)
- [ ] Estagio 4: Documentacao gerada (README, CHANGELOG, API docs)
- [ ] Estagio 4: Security review executado
- [ ] Estagio 4: QA — testes escritos e rodados
- [ ] Estagio 4: Ideias geradas com ICE scoring (apos quality gate)
- [ ] Estagio 5: Teste E2E final (smoke + fluxos + responsividade)
- [ ] Estagio 5: E2E-REPORT.md gerado com screenshots
- [ ] Estagio 5: Captures triados em TRIAGE.md
- [ ] Estagio 5: DELIVERY.md gerado (incluindo E2E + captures + reassessments)
- [ ] Estagio 5: LOCK.md removido (sessao concluida)
- [ ] Estagio 5: Resumo apresentado ao usuario

**Minimo viavel:** Estagios 1-3 + Estagio 5. Estagios 4 (Polish) e E2E sao bonus.

</success_criteria>
