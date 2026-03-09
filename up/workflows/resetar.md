<trigger>
Use este workflow quando:
- Usuario quer recomecar o projeto do zero
- Usuario quer limpar .plano/ e reinicializar
- Usuario diz "resetar", "limpar", "recomecar", "apagar plano"
</trigger>

<purpose>
Limpar o diretorio .plano/ de forma segura, com confirmacao explicita, para permitir reinicializacao do projeto.
</purpose>

<process>

<step name="diagnosticar">
Verificar o que existe em .plano/:

```bash
# Verificar se .plano/ existe
ls -la .plano/ 2>/dev/null

# Contar arquivos por tipo
echo "---"
find .plano/ -name "*.md" 2>/dev/null | wc -l
find .plano/ -name "*.json" 2>/dev/null | wc -l
ls -d .plano/fases/*/ 2>/dev/null | wc -l

# Listar fases
ls -d .plano/fases/*/ 2>/dev/null

# Verificar artefatos principais
ls .plano/PROJECT.md .plano/ROADMAP.md .plano/STATE.md .plano/config.json .plano/REQUIREMENTS.md 2>/dev/null

# Verificar subdiretorios
ls -d .plano/pesquisa/ .plano/codebase/ .plano/fases/ .plano/rapido/ 2>/dev/null
```

**Se .plano/ nao existe:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > RESETAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nenhum diretorio .plano/ encontrado. Nada para resetar.

-> /up:novo-projeto para inicializar
```

Sair.
</step>

<step name="mostrar_estado">
Apresentar o que existe:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > RESETAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Conteudo de .plano/:

| Artefato | Status |
|----------|--------|
| PROJECT.md | ✓ / ✗ |
| ROADMAP.md | ✓ / ✗ |
| STATE.md | ✓ / ✗ |
| REQUIREMENTS.md | ✓ / ✗ |
| config.json | ✓ / ✗ |
| Fases | N diretorios |
| Pesquisa | ✓ / ✗ |
| Codebase map | ✓ / ✗ |
| Tarefas rapidas | N tarefas |
```
</step>

<step name="escolher_modo">

Verificar se argumento --total ou --parcial foi passado. Se sim, pular para confirmacao com o modo correspondente.

Se nenhum argumento, perguntar:

Use AskUserQuestion:
- header: "Tipo de reset"
- question: "Como voce quer resetar?"
- options:
  - "Reset total" -- Apagar .plano/ inteiro. Comecar do zero absoluto.
  - "Reset parcial" -- Manter PROJECT.md e config.json. Apagar fases, roadmap, state, pesquisa.
  - "Cancelar" -- Nao apagar nada.

**Se "Cancelar":** Sair.

**Se "Reset parcial":**
Sera apagado:
- .plano/ROADMAP.md
- .plano/STATE.md
- .plano/REQUIREMENTS.md
- .plano/fases/ (todos os diretorios de fase)
- .plano/pesquisa/ (toda a pesquisa)
- .plano/rapido/ (tarefas rapidas)

Sera mantido:
- .plano/PROJECT.md (contexto do projeto)
- .plano/config.json (preferencias de workflow)
- .plano/codebase/ (mapeamento do codebase, se existir)

**Se "Reset total":**
Sera apagado:
- .plano/ inteiro (tudo)
</step>

<step name="confirmar">

╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: Confirmacao Obrigatoria                         ║
╚══════════════════════════════════════════════════════════════╝

Use AskUserQuestion:
- header: "Confirmar reset"
- question: "[Reset total/parcial] -- Esta acao e IRREVERSIVEL. [N] arquivos serao apagados. Confirmar?"
- options:
  - "Confirmar reset" -- Apagar agora
  - "Cancelar" -- Nao apagar nada

**Se "Cancelar":** Sair.
</step>

<step name="executar">

**Reset total:**
```bash
rm -rf .plano/
```

**Reset parcial:**
```bash
rm -f .plano/ROADMAP.md .plano/STATE.md .plano/REQUIREMENTS.md
rm -rf .plano/fases/ .plano/pesquisa/ .plano/rapido/
```

Verificar que a limpeza foi feita:
```bash
ls -la .plano/ 2>/dev/null || echo "REMOVIDO"
```
</step>

<step name="resultado">

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > RESET CONCLUIDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Se total:]
Diretorio .plano/ removido completamente.

[Se parcial:]
Fases, roadmap e pesquisa removidos.
Mantidos: PROJECT.md, config.json[, codebase/]
```

---

## Proximo

**Se reset total:**

`/up:novo-projeto` -- inicializar projeto do zero

**Se reset parcial:**

`/up:novo-projeto` -- vai detectar PROJECT.md existente e oferecer "Revisar e atualizar"

<sub>`/clear` primeiro -> janela de contexto limpa</sub>

---
</step>

</process>

<success_criteria>
- [ ] Estado atual de .plano/ diagnosticado
- [ ] Usuario informado do que sera apagado
- [ ] Confirmacao explicita obtida antes de qualquer delecao
- [ ] Reset executado conforme modo escolhido
- [ ] Proximo passo sugerido
</success_criteria>
