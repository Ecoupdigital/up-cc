<purpose>
Workflow de intake de projeto conduzido pelo CEO.

Usado pelo `/up:modo-builder` e comandos similares quando um projeto novo comeca.
Diferente do onboarding (que e sobre conhecer o dono), este e sobre conhecer o PROJETO.

Apos intake, gera:
- `.plano/BRIEFING.md` — briefing do projeto
- `.plano/OWNER.md` — contexto especifico do projeto
- `.plano/PENDING.md` — assets faltantes
- `.plano/DESIGN-TOKENS.md` — se dono passou, senao marca pending
</purpose>

<prerequisites>
Antes de rodar este workflow, verificar:
1. `~/.claude/up/owner-profile.md` existe → se nao, rodar `/up:onboard` primeiro
2. Ler owner-profile pra pegar ceo_name, preferred_name, ceo_tone, stack preferida
</prerequisites>

<process>

## Passo 0: Carregar Perfil do Dono

```bash
# Obrigatorio — CEO precisa saber quem e o dono
if [ ! -f ~/.claude/up/owner-profile.md ]; then
  echo "Onboarding necessario. Execute /up:onboard primeiro."
  exit 1
fi

cat ~/.claude/up/owner-profile.md
```

Extrair:
- `$PREFERRED_NAME`
- `$CEO_NAME`
- `$CEO_TONE`
- Preferencias de stack (usar como defaults)

## Passo 1: Apresentacao

Com base no `ceo_tone`:

**Tom amigavel (default):**
```
Ola {PREFERRED_NAME}. Aqui e o {CEO_NAME}, pronto pra conduzir
seu proximo projeto UP.

Me conta um pouco sobre o que voce quer construir.
```

**Tom formal:**
```
Prezado {PREFERRED_NAME}. {CEO_NAME} falando. Estou pronto
para iniciar seu proximo projeto.

Por favor, descreva o que deseja construir.
```

**Tom direto:**
```
{PREFERRED_NAME}: {CEO_NAME} aqui. Projeto novo?
Descreve o que voce quer construir.
```

## Passo 2: Bloco 1 — Briefing (obrigatorio)

**Se `$ARGUMENTS` ja tem briefing**: usar direto, pular AskUserQuestion.

**Se nao:**

```python
AskUserQuestion(
  header="Briefing",
  question="O que voce quer construir? Me conta em texto livre.",
  followUp=None
)
```

Salvar como `$BRIEFING`.

## Passo 3: Validacao de Briefing (rejeicao possivel)

Avaliar o briefing:
- E especifico ou vago demais?
- Escopo e viavel?
- Ha contradicoes?
- Falta contexto critico?

**Se briefing e VAGO/INVIAVEL:**

```python
AskUserQuestion(
  header="Precisando de mais contexto",
  question="""{PREFERRED_NAME}, antes de comecar preciso entender melhor.
  
  Voce disse: "{BRIEFING}"
  
  Isso e {muito amplo | inviavel porque X | ambiguo em Y}.
  
  Preciso saber:
  - {pergunta especifica 1}
  - {pergunta especifica 2}
  - {pergunta especifica 3}
  
  Pode detalhar?""",
  followUp=None
)
```

Receber resposta e atualizar `$BRIEFING`.

**Se ainda esta vago apos 2 tentativas:** CEO assume responsabilidade, define escopo minimo e segue.

## Passo 4: Bloco 2 — Design System (opcional)

```python
AskUserQuestion(
  header="Design System",
  question="""{PREFERRED_NAME}, voce tem um design system definido?
  
  Pode passar:
  - Cores (primaria, secundaria, semanticas)
  - Tipografia (fontes)
  - Componentes base (shadcn, MUI, custom?)
  - Ou link pro Figma / brand book
  
  Se nao tiver, eu crio um placeholder e marco como PENDENTE.""",
  followUp=None
)
```

**Se passou:**
- Salvar em `.plano/DESIGN-TOKENS.md`
- Marcar E1.2 como completed no CHECKLIST

**Se nao passou:**
- Gerar placeholder em `.plano/DESIGN-TOKENS.md` com defaults (shadcn neutro)
- Adicionar entry em `.plano/PENDING.md` com severity non-blocker
- Marcar E1.2 como completed (resolvido como pending)

## Passo 5: Bloco 3 — Credenciais de API (opcional)

```python
AskUserQuestion(
  header="Credenciais de API",
  question="""{PREFERRED_NAME}, quais integracoes voce quer usar neste projeto?
  
  Pode passar credenciais de:
  - Supabase (URL + anon key + service key)
  - Email (Resend/SendGrid/Postmark)
  - Pagamentos (Stripe/Asaas)
  - WhatsApp (Evolution/UazAPI/Meta)
  - Outras APIs que voce tem
  
  Se nao passar, eu uso mocks/stubs e marco como PENDENTE.""",
  followUp=None
)
```

**Processar cada credencial:**

Para cada credencial passada:
- Salvar em `.env.local` (sem commitar)
- Marcar integracao como disponivel

Para cada credencial NAO passada:
- Adicionar em `.plano/PENDING.md` com severity:
  - `blocker` se credencial e critica pra funcionalidade core
  - `non_blocker` se pode usar stub

## Passo 6: Bloco 4 — Referencias (opcional)

```python
AskUserQuestion(
  header="Referencias",
  question="""{PREFERRED_NAME}, tem alguma referencia que voce quer que eu siga?
  
  - URL de um app que voce gosta (tipo 'igual ao Linear')
  - Screenshots de inspiracao
  - Brand book / moodboard
  - Ou 'parecido com X'
  
  Se nao tiver, eu pesquiso concorrentes do dominio.""",
  followUp=None
)
```

Salvar em `.plano/OWNER.md` na secao Referencias.

**Se URL foi passada + flag `--clone`:** Entrar em modo clone-builder.

## Passo 7: Bloco 5 — Restricoes (opcional)

```python
AskUserQuestion(
  header="Restricoes",
  question="""{PREFERRED_NAME}, ha algo que NAO deve estar no projeto?
  
  Exemplos:
  - Features explicitamente rejeitadas
  - Tecnologias banidas
  - Abordagens que voce nao quer
  
  Ou enter pra pular.""",
  followUp=None
)
```

Salvar em `.plano/OWNER.md` na secao Restricoes.

## Passo 8: Confirmar Intake

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 {CEO_NAME}: Intake Completo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Entendi. Resumo:

✓ {resumo do briefing em 1 frase}
✓ Stack: {stack detectada/definida}
✓ Design: {custom passado | defaults com pending}
✓ Credenciais: {quais passou}
✓ Referencias: {o que passou}
✓ Restricoes: {lista curta}

⚠ Pendencias: {N}
{lista curta de PENDING.md}

Vou montar o time: {N} chiefs, {M} supervisores, agentes operacionais.
Estimativa: {N} fases.

Updates {verbose/normal/silent} conforme seu perfil.

Comecando agora...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Passo 9: Gerar Arquivos

**`.plano/BRIEFING.md`:**
```markdown
---
collected_at: [timestamp]
collected_by: [ceo_name]
owner: [preferred_name]
---

# Briefing

## Briefing Original
[texto completo]

## Contexto Adicional (de respostas)
[se houve rejeicao/re-perguntas]

## Decisoes Iniciais
- Stack: [...]
- Design: [custom | defaults]
- Modo: [greenfield | brownfield]
```

**`.plano/OWNER.md`:** usar template.

**`.plano/PENDING.md`:** usar template, populado com pendencias detectadas.

**`.plano/DESIGN-TOKENS.md`:** custom ou defaults.

## Passo 10: Commit Inicial

```bash
git init 2>/dev/null
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs: intake completo — {projeto}" \
  --files .plano/BRIEFING.md .plano/OWNER.md .plano/PENDING.md .plano/DESIGN-TOKENS.md
```

## Passo 11: Atualizar Checklist

Marcar items E1.1 ate E1.5 como completed em `.plano/CHECKLIST.md`.

## Passo 12: Passar Controle Pros Chiefs

Apos intake, CEO NAO continua executando. Ele passa controle pro pipeline do builder que spawna os chiefs.

CEO so volta a agir quando:
- Chief escala algum problema
- Fase completa (pra mandar update)
- Pre-delivery audit
- Delivery final

</process>

<success_criteria>
- [ ] owner-profile.md carregado
- [ ] Briefing coletado e validado
- [ ] 5 blocos processados (briefing, design, credenciais, referencias, restricoes)
- [ ] BRIEFING.md gerado
- [ ] OWNER.md gerado
- [ ] PENDING.md gerado (com items se ha)
- [ ] DESIGN-TOKENS.md gerado (custom ou defaults)
- [ ] CHECKLIST E1.* marcados como completed
- [ ] Commit inicial feito
- [ ] Controle passado pros chiefs
</success_criteria>
