<purpose>
Remover fase futura nao iniciada do roadmap do projeto, deletar seu diretorio, renumerar todas as fases subsequentes para manter sequencia linear limpa e commitar a mudanca. O commit git serve como registro historico da remocao.
</purpose>

<required_reading>
Ler todos os arquivos referenciados pelo execution_context do prompt invocador antes de comecar.
</required_reading>

<process>

<step name="parse_arguments">
Parsear argumentos do comando:
- Argumento e o numero da fase a remover (inteiro ou decimal)
- Exemplo: `/up:remover-fase 17` → fase = 17
- Exemplo: `/up:remover-fase 16.1` → fase = 16.1

Se nenhum argumento fornecido:

```
ERRO: Numero da fase obrigatorio
Uso: /up:remover-fase <numero-fase>
Exemplo: /up:remover-fase 17
```

Sair.
</step>

<step name="init_context">
Carregar contexto de operacao de fase:

```bash
INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init operacao-fase "${target}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Extrair: `phase_found`, `phase_dir`, `phase_number`, `commit_docs`, `roadmap_exists`.

Tambem ler STATE.md e ROADMAP.md para parsear posicao atual.
</step>

<step name="validate_future_phase">
Verificar que a fase e futura (nao iniciada):

1. Comparar fase alvo com fase atual do STATE.md
2. Alvo deve ser > numero da fase atual

Se alvo <= fase atual:

```
ERRO: Nao e possivel remover Fase {alvo}

Apenas fases futuras podem ser removidas:
- Fase atual: {atual}
- Fase {alvo} e atual ou concluida

Para abandonar trabalho atual, use /up:pausar.
```

Sair.
</step>

<step name="confirm_removal">
Apresentar resumo da remocao e confirmar:

```
Removendo Fase {alvo}: {Nome}

Isso vai:
- Deletar: .plano/fases/{alvo}-{slug}/
- Renumerar todas as fases subsequentes
- Atualizar: ROADMAP.md, STATE.md

Prosseguir? (s/n)
```

Aguardar confirmacao.
</step>

<step name="execute_removal">
**Delegar operacao completa de remocao ao up-tools:**

```bash
RESULT=$(node "$HOME/.claude/up/bin/up-tools.cjs" phase remove "${target}")
```

Se a fase tem planos executados (arquivos SUMMARY.md), up-tools vai retornar erro. Usar `--force` apenas se usuario confirmar:

```bash
RESULT=$(node "$HOME/.claude/up/bin/up-tools.cjs" phase remove "${target}" --force)
```

O CLI faz:
- Deletar diretorio da fase
- Renumerar todos os diretorios subsequentes (em ordem reversa para evitar conflitos)
- Renomear todos os arquivos dentro dos diretorios renumerados (PLAN.md, SUMMARY.md, etc.)
- Atualizar ROADMAP.md (removendo secao, renumerando todas as referencias de fase, atualizando dependencias)
- Atualizar STATE.md (decrementando contagem de fases)

Extrair do resultado: `removed`, `directory_deleted`, `renamed_directories`, `renamed_files`, `roadmap_updated`, `state_updated`.
</step>

<step name="commit">
Preparar e commitar a remocao:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "chore: remover fase {alvo} ({nome-original-fase})" --files .plano/
```

A mensagem de commit preserva o registro historico do que foi removido.
</step>

<step name="completion">
Apresentar resumo:

```
Fase {alvo} ({nome-original}) removida.

Mudancas:
- Deletado: .plano/fases/{alvo}-{slug}/
- Renumerados: {N} diretorios e {M} arquivos
- Atualizado: ROADMAP.md, STATE.md
- Commitado: chore: remover fase {alvo} ({nome-original})

---

## Proximo

Gostaria de:
- `/up:progresso` — ver status atualizado do roadmap
- Continuar com fase atual
- Revisar roadmap

---
```
</step>

</process>

<anti_patterns>

- Nao remover fases concluidas (com arquivos SUMMARY.md) sem --force
- Nao remover fases atuais ou passadas
- Nao renumerar manualmente — usar `up-tools phase remove` que cuida de toda renumeracao
- Nao adicionar notas "fase removida" ao STATE.md — commit git e o registro
- Nao modificar diretorios de fases concluidas
</anti_patterns>

<success_criteria>
Remocao de fase esta completa quando:

- [ ] Fase alvo validada como futura/nao iniciada
- [ ] `up-tools phase remove` executado com sucesso
- [ ] Mudancas commitadas com mensagem descritiva
- [ ] Usuario informado das mudancas
</success_criteria>
