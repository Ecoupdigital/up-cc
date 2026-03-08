<trigger>
Use este workflow quando:
- Iniciando nova sessao em projeto existente
- Usuario diz "continuar", "o que vem", "onde paramos", "retomar"
- Qualquer operacao de planejamento quando .plano/ ja existe
- Usuario retorna apos tempo longe do projeto
</trigger>

<purpose>
Restaurar instantaneamente contexto completo do projeto para que "Onde paramos?" tenha resposta imediata e completa.
</purpose>

<process>

<step name="initialize">
Carregar contexto:

```bash
INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init resume)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON: `state_exists`, `roadmap_exists`, `project_exists`, `planning_exists`, `commit_docs`.

**Se `state_exists` = true:** Prosseguir para load_state
**Se `state_exists` = false mas `roadmap_exists` ou `project_exists` = true:** Oferecer reconstruir STATE.md
**Se `planning_exists` = false:** Projeto novo - rotear para /up:novo-projeto
</step>

<step name="load_state">

Ler e parsear STATE.md, depois PROJECT.md:

```bash
cat .plano/STATE.md
cat .plano/PROJECT.md
```

**Do STATE.md extrair:**

- **Referencia do Projeto**: Valor central e foco atual
- **Posicao Atual**: Fase X de Y, Plano A de B, Status
- **Progresso**: Barra de progresso visual
- **Decisoes Recentes**: Decisoes-chave afetando trabalho atual
- **Bloqueios/Preocupacoes**: Problemas herdados
- **Continuidade de Sessao**: Onde paramos, arquivos de retomada

**Do PROJECT.md extrair:**

- **O que e Isso**: Descricao atual precisa
- **Requisitos**: Validados, Ativos, Fora do Escopo
- **Decisoes-Chave**: Log completo de decisoes
</step>

<step name="check_incomplete_work">
Procurar trabalho incompleto que precisa atencao:

```bash
# Verificar arquivos continue-aqui (retomada mid-plano)
ls .plano/fases/*/.continue-aqui.md 2>/dev/null

# Verificar planos sem summaries (execucao incompleta)
for plan in .plano/fases/*/*-PLAN.md; do
  summary="${plan/PLAN/SUMMARY}"
  [ ! -f "$summary" ] && echo "Incompleto: $plan"
done 2>/dev/null
```

**Se arquivo .continue-aqui existe:**
- Este e um ponto de retomada mid-plano
- Ler arquivo para contexto especifico de retomada
- Flag: "Encontrado checkpoint mid-plano"

**Se PLAN sem SUMMARY existe:**
- Execucao foi iniciada mas nao completada
- Flag: "Encontrada execucao de plano incompleta"
</step>

<step name="present_status">
Apresentar status completo do projeto:

```
==============================================================
  STATUS DO PROJETO
==============================================================
  Construindo: [one-liner do PROJECT.md "O que e Isso"]

  Fase: [X] de [Y] - [Nome da fase]
  Plano: [A] de [B] - [Status]
  Progresso: [##########----------] XX%

  Ultima atividade: [data] - [o que aconteceu]
==============================================================

[Se trabalho incompleto encontrado:]
Trabalho incompleto detectado:
    - [arquivo .continue-aqui ou plano incompleto]

[Se bloqueios existem:]
Preocupacoes herdadas:
    - [bloqueio 1]
    - [bloqueio 2]
```
</step>

<step name="determine_next_action">
Baseado no estado do projeto, determinar acao mais logica:

**Se arquivo .continue-aqui existe:**
-> Primaria: Retomar do checkpoint
-> Opcao: Comecar limpo no plano atual

**Se plano incompleto (PLAN sem SUMMARY):**
-> Primaria: Completar plano incompleto
-> Opcao: Abandonar e seguir em frente

**Se fase em progresso, todos planos completos:**
-> Primaria: Transicionar para proxima fase

**Se fase pronta para planejar:**
-> Verificar se CONTEXT.md existe:
  - Se CONTEXT.md faltando: Primaria = discutir fase
  - Se CONTEXT.md existe: Primaria = planejar fase

**Se fase pronta para executar:**
-> Primaria: Executar proximo plano
</step>

<step name="offer_options">
Apresentar opcoes contextuais baseadas no estado:

```
O que voce gostaria de fazer?

[Acao primaria baseada no estado - ex:]
1. Executar fase (/up:executar-fase {fase})
   OU
1. Discutir contexto da Fase 3 (/up:discutir-fase 3)
   OU
1. Planejar Fase 3 (/up:planejar-fase 3)

[Opcoes secundarias:]
2. Revisar status da fase atual
3. Algo diferente
```

Esperar selecao do usuario.
</step>

<step name="route_to_workflow">
Baseado na selecao do usuario, rotear para workflow apropriado:

- **Executar plano** -> Mostrar comando:
  ```
  ---

  ## Proximo

  **{fase}-{plano}: [Nome do Plano]** -- [objetivo]

  `/up:executar-fase {fase}`

  <sub>`/clear` primeiro -> janela de contexto limpa</sub>

  ---
  ```
- **Planejar fase** -> Mostrar comando:
  ```
  ---

  ## Proximo

  **Fase [N]: [Nome]** -- [Objetivo do ROADMAP.md]

  `/up:planejar-fase [numero-fase]`

  <sub>`/clear` primeiro -> janela de contexto limpa</sub>

  ---

  **Tambem disponivel:**
  - `/up:discutir-fase [N]` -- reunir contexto primeiro

  ---
  ```
</step>

<step name="update_session">
Antes de prosseguir, atualizar continuidade de sessao no STATE.md:

```markdown
## Continuidade de Sessao

Ultima sessao: [agora]
Parado em: Sessao retomada, prosseguindo para [acao]
Arquivo de retomada: [atualizado se aplicavel]
```
</step>

</process>

<reconstruction>
Se STATE.md faltando mas outros artefatos existem:

"STATE.md faltando. Reconstruindo a partir de artefatos..."

1. Ler PROJECT.md -> Extrair "O que e Isso" e Valor Central
2. Ler ROADMAP.md -> Determinar fases, encontrar posicao atual
3. Escanear *-SUMMARY.md -> Extrair decisoes, preocupacoes
4. Verificar arquivos .continue-aqui -> Continuidade de sessao

Reconstruir e escrever STATE.md, depois prosseguir normalmente.
</reconstruction>

<quick_resume>
Se usuario diz "continuar" ou "vai":
- Carregar estado silenciosamente
- Determinar acao primaria
- Executar imediatamente sem apresentar opcoes

"Continuando de [estado]... [acao]"
</quick_resume>

<success_criteria>
- [ ] STATE.md carregado (ou reconstruido)
- [ ] Trabalho incompleto detectado e sinalizado
- [ ] Status claro apresentado ao usuario
- [ ] Proximas acoes contextuais oferecidas
- [ ] Usuario sabe exatamente onde projeto esta
- [ ] Continuidade de sessao atualizada
</success_criteria>