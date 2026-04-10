# Severity Levels

Niveis de severidade usados pelo CEO para decidir quando interromper o dono.
Carregado pelo up-project-ceo.

---

## 🔴 CRITICO — Sempre Interrompe

Situacoes que SEMPRE requerem input do dono, independente de configuracao.

### Exemplos

- **Credencial expirada durante build**
  - API key Supabase expirou
  - Token GitHub invalido
  - OAuth precisa renovar

- **Erro irrecuperavel em dependencia externa**
  - API externa retorna 500 consistentemente
  - Package no npm foi descontinuado
  - Servico crashed e nao volta

- **Conflito arquitetural irreversivel**
  - Mudanca que afeta decisoes previas
  - Quebra de compatibilidade significativa
  - Escolha de stack que muda rumo do projeto

- **Custo de tokens excedeu limite**
  - Projeto consumiu mais que o budget configurado
  - Risco de continuar sem aprovacao

- **Build falhando apos 5 tentativas**
  - Specialist nao consegue corrigir
  - Specialist escalou pro chief
  - Chief nao conseguiu resolver

- **Ambiguidade de negocio que muda direcao**
  - Briefing contradiz premissas
  - Descoberta durante execucao revela que o projeto e outra coisa
  - Duvida fundamental sobre o que construir

### Formato da Interrupcao

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 🔴 CRITICO — {nome_ceo} precisa do seu input
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{nome_dono}, precisei parar. Situacao:

**O que aconteceu:**
[descricao clara]

**Por que nao posso decidir sozinho:**
[explicacao]

**Opcoes:**
a) [opcao 1]
b) [opcao 2]
c) [opcao 3]

**Minha recomendacao:** [opcao + porque]

Qual voce prefere?
```

---

## 🟡 IMPORTANTE — Interrompe em modo interactive

Situacoes que perguntam ao dono APENAS se a flag `--interactive` estiver ativa.
Senao, o CEO decide sozinho e registra como decisao delegada.

### Exemplos

- **Feature inferida que pode ser equivocada**
  - Briefing menciona "sistema de notificacoes" mas nao diz email/push/in-app
  - CEO infere "in-app" mas dono pode querer email

- **Trade-off arquitetural significativo**
  - Escolha entre 2 bibliotecas validas (ex: Zustand vs Redux)
  - Performance vs simplicidade

- **Escolha de biblioteca com impacto de longo prazo**
  - ORM especifico
  - Framework de teste
  - Design system base

- **Pendente que vai virar bloqueador em producao**
  - Ex: "Credencial Resend nao foi passada. Em dev funciona com mock, mas em producao vai falhar."

### Formato da Interrupcao

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 🟡 IMPORTANTE — {nome_ceo} tem uma decisao pra tomar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{nome_dono}, situacao:

[descricao]

**Opcoes viáveis:**
a) [opcao 1] — [pros/contras]
b) [opcao 2] — [pros/contras]

**Minha recomendacao:** [opcao]
**Por que:** [explicacao]

Voce confirma? Ou prefere outra opcao?
```

---

## 🟢 FYI — So Registra, Nao Interrompe

Decisoes que o CEO toma sozinho e apenas registra em `.plano/OWNER.md`.
Nao interrompe o dono em nenhum modo.

### Exemplos

- **Decisao tomada com base em defaults**
  - Stack ja definida no owner-profile
  - Padrao da industria obvio

- **Pequenos ajustes de escopo dentro do briefing**
  - Reorganizacao de fases
  - Ordem de implementacao

- **Feature inferida obvia**
  - CRUD basico em todo modulo
  - Loading states
  - Error handling
  - Responsive

### Formato de Registro

```markdown
## Feedback Durante Execucao (em OWNER.md)

| Timestamp | Feedback | Acao tomada |
|-----------|----------|-------------|
| [YYYY-MM-DD HH:MM] | 🟢 Inferencia automatica | Adicionei loading state em todas paginas |
```

---

## Configuracao por Usuario

O dono pode customizar quais niveis interrompem via `owner-profile.md`:

```yaml
interruption_preferences:
  critical: always       # sempre interrompe
  important: interactive # so em modo --interactive
  fyi: never            # nunca interrompe
```

Defaults:
- Se `updates: verbose` → important interrompe
- Se `updates: normal` → so critical interrompe
- Se `updates: silent` → so critical interrompe (e mesmo assim, pergunta breve)

---

## Escalacao

Se a interrupcao tem timeout (usuario nao responde):

- **Critico:** espera indefinidamente (nao prossegue sem resposta)
- **Importante:** default 10min, depois decide sozinho com recomendacao
- **FYI:** nunca espera

---

## Anti-Patterns

**NAO INTERROMPER POR:**
- Coisas que voce pode decidir com base em defaults
- Decisoes que ja foram tomadas implicitamente no briefing
- Detalhes de implementacao (escolha de nome de variavel, estrutura de pasta)
- Erros que voce mesmo pode resolver

**SEMPRE INTERROMPER POR:**
- Coisas que mudam o rumo do projeto
- Decisoes irreversiveis
- Situacoes sem boa opcao default
- Descobertas que o dono provavelmente nao sabia
