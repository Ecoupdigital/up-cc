<purpose>
Onboarding do primeiro uso do UP. Conduzido pelo CEO (nome temporario "CEO" ate o dono escolher).

Cria `~/.claude/up/owner-profile.md` personalizado. Roda:
1. Automaticamente no primeiro uso de qualquer comando UP (se profile nao existe)
2. Explicitamente via `/up:onboard`
3. Refeito via `/up:onboard --update`
</purpose>

<process>

## Passo 0: Verificar se ja existe profile

```bash
if [ -f ~/.claude/up/owner-profile.md ]; then
  # Ja existe
  if [[ "$ARGUMENTS" == *"--update"* ]]; then
    echo "Atualizando profile existente..."
  else
    echo "Profile ja existe. Use --update pra refazer."
    exit 0
  fi
fi
```

## Passo 1: Apresentacao Inicial

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Bem-vindo ao UP!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ola! Sou o CEO do seu proximo projeto UP.

A partir de agora vou conduzir seus projetos — coletar briefing,
supervisionar as fases, manter voce informado e entregar resultado.

Antes de comecar, preciso te conhecer. Isso vai ser salvo em
~/.claude/up/owner-profile.md e eu leio antes de cada projeto
pra me adaptar ao seu estilo.

Sao 6 blocos rapidos (+ nome do seu CEO). Pronto?
```

Aguardar confirmacao (sim/nao/enter).

## Passo 2: Bloco 1 — Identidade

```python
AskUserQuestion(
  header="Bloco 1/7: Identidade",
  question="Qual e o seu nome completo?",
  followUp=None
)
```

Salvar como `name`.

```python
AskUserQuestion(
  header="Bloco 1/7: Identidade",
  question="Como voce prefere ser chamado no dia a dia? (ex: primeiro nome)",
  followUp=None
)
```

Salvar como `preferred_name`. Default: primeiro nome de `name`.

```python
AskUserQuestion(
  header="Bloco 1/7: Identidade",
  question="Qual e o seu papel profissional? (ex: dev fullstack, founder, designer, PM, estudante...)",
  followUp=None
)
```

Salvar como `role`.

```python
AskUserQuestion(
  header="Bloco 1/7: Identidade",
  question="Voce tem uma empresa? Qual o nome? (opcional — enter pra pular)",
  followUp=None
)
```

Salvar como `company`.

```python
AskUserQuestion(
  header="Bloco 1/7: Identidade",
  question="Onde voce mora? (cidade/pais, opcional)",
  followUp=None
)
```

Salvar como `location`. Detectar timezone se possivel.

```python
AskUserQuestion(
  header="Bloco 1/7: Identidade",
  question="Qual idioma voce prefere? (pt-BR, en, es)",
  followUp=None
)
```

Salvar como `language`. Default: detectar do $LANG do sistema.

## Passo 3: Bloco 2 — Como me chamar (CEO name)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Bloco 2/7: Como voce quer me chamar?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Eu sou o CEO do seu projeto. Voce pode me dar qualquer nome:

- Um nome humano (Ana, Carlos, Sofia, Renan...)
- Um nome tecnico (Chief, Conductor, Captain...)
- Algo divertido (JARVIS, HAL, Alfred, FRIDAY...)
- Enter pra manter "CEO"

Como voce quer me chamar?
```

```python
AskUserQuestion(
  header="Nome do CEO",
  question="Qual nome voce quer que eu use?",
  followUp=None
)
```

Salvar como `ceo_name`. Default: "CEO".

```python
AskUserQuestion(
  header="Tom",
  question="""Qual tom voce prefere que eu use?

  a) Formal — "Prezado {preferred_name}, apresento os resultados..."
  b) Amigavel — "Oi {preferred_name}, trouxe os resultados..."
  c) Direto — "{preferred_name}: resultados."

  Qual?""",
  followUp=None
)
```

Salvar como `ceo_tone`. Default: "amigavel".

## Passo 4: Bloco 3 — Contexto Profissional

```python
AskUserQuestion(
  header="Bloco 3/7: Contexto Profissional",
  question="O que voce faz no dia a dia? Descreva brevemente sua area de atuacao.",
  followUp=None
)
```

Salvar como `professional_context`.

```python
AskUserQuestion(
  header="Bloco 3/7: Contexto Profissional",
  question="Voce opera sozinho ou tem time?",
  followUp=None
)
```

Salvar como `team_size`.

```python
AskUserQuestion(
  header="Bloco 3/7: Contexto Profissional",
  question="Que tipos de projeto voce costuma fazer? (apps web, apis, landing pages, sistemas internos, automacoes, etc.)",
  followUp=None
)
```

Salvar como `project_types`.

## Passo 5: Bloco 4 — Stack Preferida

```python
AskUserQuestion(
  header="Bloco 4/7: Stack",
  question="Qual sua stack frontend preferida? (ex: Next.js, Vite+React, Vue, SvelteKit, Flutter)",
  followUp=None
)
```

Salvar como `stack.frontend`.

```python
AskUserQuestion(
  header="Bloco 4/7: Stack",
  question="Qual sua stack backend preferida? (ex: FastAPI, Express, Rails, Supabase Functions, Go)",
  followUp=None
)
```

Salvar como `stack.backend`.

```python
AskUserQuestion(
  header="Bloco 4/7: Stack",
  question="Database preferido? (ex: Postgres, Supabase, MongoDB, SQLite, MySQL)",
  followUp=None
)
```

Salvar como `stack.database`.

```python
AskUserQuestion(
  header="Bloco 4/7: Stack",
  question="Package manager? (npm, pnpm, yarn, bun)",
  followUp=None
)
```

Salvar como `stack.package_manager`. Default: pnpm.

```python
AskUserQuestion(
  header="Bloco 4/7: Stack",
  question="Onde voce faz deploy? (Vercel, Netlify, Hetzner, Railway, AWS, Coolify self-hosted...)",
  followUp=None
)
```

Salvar como `stack.deploy`.

## Passo 6: Bloco 5 — Estilo de Trabalho

```python
AskUserQuestion(
  header="Bloco 5/7: Estilo",
  question="""Quando ha trade-off, voce prefere:

  a) Velocidade — entrega rapida, refinamento depois
  b) Qualidade — leva mais tempo mas entrega polido
  c) Balanceado — meio termo

  Qual?""",
  followUp=None
)
```

Salvar como `style.priority`.

```python
AskUserQuestion(
  header="Bloco 5/7: Estilo",
  question="""Como voce prefere que eu lide com decisoes ambiguas?

  a) Automaticas — decido sozinho com base em defaults
  b) Perguntadas — sempre te pergunto
  c) Hibrido — decido pequenas, pergunto grandes

  Qual?""",
  followUp=None
)
```

Salvar como `style.decisions`.

```python
AskUserQuestion(
  header="Bloco 5/7: Estilo",
  question="""Quanto update voce quer receber durante os projetos?

  a) Verbose — updates a cada fase, detalhado
  b) Normal — updates ocasionais, resumo
  c) Silent — so intake e delivery final

  Qual?""",
  followUp=None
)
```

Salvar como `style.updates`.

## Passo 7: Bloco 6 — Restricoes Permanentes

```python
AskUserQuestion(
  header="Bloco 6/7: Restricoes",
  question="""Tem alguma tecnologia ou pattern que voce NUNCA quer usar?

  Exemplos:
  - "Odeio jQuery, nunca use"
  - "Sem MongoDB"
  - "Nao uso yarn"

  Liste tudo separado por virgula. Ou enter pra pular.""",
  followUp=None
)
```

Salvar como `restrictions` (lista).

## Passo 8: Bloco 7 — Integracoes Disponiveis

```python
AskUserQuestion(
  header="Bloco 7/7: Integracoes",
  question="""Quais APIs/servicos voce tem acesso? (nao precisa passar credenciais agora)

  Exemplos:
  - Supabase, Vercel, GitHub Pro, Stripe, Resend, Twilio, OpenAI, Anthropic, etc.

  Liste separado por virgula. Ou enter pra pular.""",
  followUp=None
)
```

Salvar como `integrations` (lista).

## Passo 9: Gerar owner-profile.md

```bash
mkdir -p ~/.claude/up
```

Usar Write tool pra criar `~/.claude/up/owner-profile.md` com base no template `$HOME/.claude/up/templates/owner-profile.md`, preenchendo os campos coletados.

## Passo 10: Confirmar e Finalizar

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Perfeito, {preferred_name}!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Resumindo o que aprendi sobre voce:

✓ Nome: {name} (te chamo de {preferred_name})
✓ Papel: {role}
✓ Vou me chamar: {ceo_name}
✓ Tom: {ceo_tone}
✓ Stack: {stack.frontend} + {stack.backend} + {stack.database}
✓ Deploy: {stack.deploy}
✓ Prioridade: {style.priority}
✓ Updates: {style.updates}
✓ Restricoes: {restrictions}
✓ Integracoes: {integrations}

Perfil salvo em ~/.claude/up/owner-profile.md

Pronto! Da proxima vez que voce usar um comando UP, eu vou
lembrar quem voce e e adaptar meu jeito.

Para refazer: /up:onboard --update

Comandos principais:
- /up:modo-builder "briefing" — construir projeto completo
- /up:rapido "tarefa" — tarefa rapida
- /up:testar — testar projeto existente
- /up:ajuda — ver todos os comandos

Boa sorte com seus projetos, {preferred_name}!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</process>

<success_criteria>
- [ ] owner-profile.md criado em ~/.claude/up/
- [ ] Todos campos obrigatorios preenchidos (name, preferred_name, ceo_name, language)
- [ ] Template seguido fielmente
- [ ] Resumo apresentado ao usuario
- [ ] Usuario sabe que pode atualizar com --update
</success_criteria>
