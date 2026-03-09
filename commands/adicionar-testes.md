---
name: up:adicionar-testes
description: Gerar testes para uma fase completa baseado na implementacao e criterios UAT
argument-hint: "<fase> [instrucoes adicionais]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
argument-instructions: |
  Parse o argumento como numero de fase (inteiro, decimal ou sufixo-letra), mais texto livre opcional.
  Exemplo: /up:adicionar-testes 3
  Exemplo: /up:adicionar-testes 3 focar em edge cases no modulo de precos
---

<objective>
Gerar testes unitarios e E2E para uma fase completa, usando SUMMARY.md, CONTEXT.md e VERIFICATION.md como especificacoes.

Analisa arquivos de implementacao, classifica em TDD (unitario), E2E (browser) ou Pular, apresenta plano de testes para aprovacao, e gera testes seguindo convencoes RED-GREEN.

Output: Arquivos de teste commitados com mensagem `test(fase-{N}): adicionar testes unitarios e E2E`
</objective>

<context>
Fase: $ARGUMENTS

@.plano/STATE.md
@.plano/ROADMAP.md
</context>

<process>

## 1. Carregar Contexto da Fase

```bash
INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init operacao-fase "${FASE_ARG}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Extrair: `phase_dir`, `phase_number`, `phase_name`.

Se fase nao existe: erro e sair.
Se nao ha SUMMARY.md: erro — fase precisa estar completa primeiro.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > ADICIONAR TESTES — Fase ${phase_number}: ${phase_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Ler artefatos da fase:
1. `${phase_dir}/*-SUMMARY.md` — o que foi implementado, arquivos modificados
2. `${phase_dir}/CONTEXT.md` — criterios de aceite, decisoes
3. `${phase_dir}/*-VERIFICATION.md` — cenarios verificados pelo usuario (se UAT feito)

## 2. Analisar e Classificar Arquivos

Para cada arquivo modificado pela fase, classificar:

| Categoria | Criterio | Tipo de Teste |
|-----------|----------|---------------|
| **TDD** | Funcoes puras, logica de negocio, validacoes, parsers, transformacoes | Unitario |
| **E2E** | Interacoes UI, navegacao, formularios, shortcuts, modais | Browser/E2E |
| **Pular** | Layout/CSS, config, glue code, migrations, tipos sem logica | Nenhum |

Ler cada arquivo para confirmar classificacao — nao classificar so pelo nome.

## 3. Aprovar Classificacao

```
AskUserQuestion(
  header: "Classificacao de Testes",
  question: |
    ### TDD (Unitarios) — {N} arquivos
    {lista com motivo breve}

    ### E2E (Browser) — {M} arquivos
    {lista com motivo breve}

    ### Pular — {K} arquivos
    {lista com motivo breve}

    Como prosseguir?
  options:
    - "Aprovar e gerar plano de testes"
    - "Ajustar classificacao"
    - "Cancelar"
)
```

## 4. Descobrir Estrutura de Testes do Projeto

Identificar:
- Diretorios de teste existentes
- Convencoes de nomeacao (`.test.ts`, `.spec.ts`, etc.)
- Comandos do test runner
- Framework de teste

## 5. Gerar Plano de Testes

Para cada arquivo aprovado, criar plano detalhado:
- **TDD:** funcoes testaveis, cenarios de input, outputs esperados, edge cases
- **E2E:** cenarios de usuario, acoes, outcomes, assertions

Apresentar plano completo para aprovacao.

## 6. Gerar Testes

**TDD:** Arrange/Act/Assert. Executar cada teste. Flaggar falhas como possiveis bugs (NAO corrigir implementacao).

**E2E:** Criar testes de cenario. Executar. Reportar blockers.

## 7. Resumo e Commit

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > TESTES GERADOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Categoria | Gerados | Passando | Falhando | Bloqueados |
|-----------|---------|----------|----------|------------|
| Unitario  | {N}     | {n1}     | {n2}     | {n3}       |
| E2E       | {M}     | {m1}     | {m2}     | {m3}       |

Arquivos criados: {lista}
Gaps de cobertura: {areas nao testaveis e motivo}
Bugs descobertos: {falhas que indicam bugs na implementacao}
```

Commitar testes passando:
```bash
git add {arquivos de teste}
git commit -m "test(fase-${phase_number}): adicionar testes unitarios e E2E"
```

Proximos passos:
- Se bugs: `/up:rapido corrigir {N} falhas de teste na fase ${phase_number}`
- Se blockers: descrever o que falta
- Se tudo ok: "Todos os testes passando!"

</process>
