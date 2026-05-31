# Verificacao da Fundacao UP v2

Provas reais executadas em 2026-05-30. Repo: `/home/projects/up-cc`.
Cada check abaixo foi rodado de fato (nao opiniao) com evidencia de output real.

## Tabela resumida

| # | Check | Resultado |
|---|-------|-----------|
| 1 | Sintaxe JS (`install.js` + `up-session-start.js`) | PASS |
| 2 | Hook roda sem travar (startup / clear / payload vazio) | PASS |
| 3 | Frontmatter das skills (name + description) | PASS |
| 4 | Deletes limpos (`adicionar-fase.md`) | PASS |
| 5 | `up-tools.cjs` nao quebrou (timestamp + slug) | PASS |
| 6 | Contagem (4 skills, hook presente) | PASS |

Total: 6/6 PASS. Nenhum FAIL.

---

## 1. Sintaxe JS — PASS

Comandos:
```
node -c /home/projects/up-cc/up/bin/install.js
node -c /home/projects/up-cc/up/hooks/up-session-start.js
```

Evidencia:
```
install.js exit=0
session-start exit=0
```

Ambos compilam sem erro de sintaxe.

---

## 2. Hook roda sem travar — PASS

Comando (repetido com `source=startup`, `source=clear`, e payload vazio `{}`):
```
echo '{"hook_event_name":"SessionStart","source":"startup"}' | timeout 6 node up/hooks/up-session-start.js
echo '{"hook_event_name":"SessionStart","source":"clear"}'   | timeout 6 node up/hooks/up-session-start.js
echo '{}'                                                     | timeout 6 node up/hooks/up-session-start.js
```

Evidencia (resumo):
- `source=startup` -> exit=0, emitiu JSON valido `hookSpecificOutput.additionalContext` com o bootstrap UP (skill `usando-up` inline).
- `source=clear` -> exit=0, mesmo output valido.
- payload vazio `{}` -> exit=0, mesmo output valido.

Os tres saem 0 dentro do `timeout 6`, sem pendurar e sem erro em stderr. O output e o bloco
`<EXTREMELY_IMPORTANT> ... Voce tem o UP ...` contendo a skill `usando-up` completa, serializado como JSON valido.

---

## 3. Frontmatter das skills — PASS

Nota: `up-tools.cjs summary-extract <path>` retornou `{"error":"File not found"}` para esses
caminhos porque esse subcomando resolve path relativo ao layout `.plano/` (e nao a um arquivo
arbitrario), entao foi usado o mesmo extrator (`extractFrontmatter`, linha 39 de `up-tools.cjs`)
via node direto. Os arquivos existem (confirmado por `find` e pelo hook que le `usando-up`).

Cada `up/skills/*/SKILL.md` tem frontmatter YAML com `name` e `description`:

| Arquivo | name | description (resumo) |
|---------|------|----------------------|
| up-brainstorm/SKILL.md | `up-brainstorm` | Use antes de QUALQUER trabalho criativo: criar feature, montar componente, adicionar funcionalidade... Explora intencao, requisitos e design antes de implementar. |
| up-tdd/SKILL.md | `up-tdd` | Use ao implementar qualquer feature, ajuste ou bugfix, antes do codigo. Prova varia por tipo: red-green para logica, captura visual para UI, smoke-test para integracao. |
| up-verificar-antes-de-concluir/SKILL.md | `up-verificar-antes-de-concluir` | Use quando estiver prestes a afirmar trabalho completo/corrigido/funcionando. Exige rodar o comando de prova e confirmar a saida ANTES de afirmar sucesso. |
| usando-up/SKILL.md | `usando-up` | Use no inicio de toda sessao e antes de qualquer trabalho de codigo, design ou decisao. Bootstrap do UP injetado pelo hook SessionStart. |

Todos: `frontmatter present: true`, `has name: true`, `has description: true` -> VERDICT PASS para os 4.

---

## 4. Deletes limpos — PASS

Comandos:
```
test ! -f up/commands/adicionar-fase.md && echo OK-deletado
grep -rn "adicionar-fase" up
```

Evidencia:
```
OK-deletado
/home/projects/up-cc/up/workflows/planejar-fase.md:82:Atualizar STATE.md (mesma logica do antigo adicionar-fase):
/home/projects/up-cc/up/commands/planejar-fase.md:31:If a description is given instead of a number and the phase doesn't exist in the roadmap, offers to create it automatically (absorbs /up:adicionar-fase functionality).
```

O comando `adicionar-fase.md` foi removido. As duas referencias restantes sao documentais/historicas
(explicam que `planejar-fase` absorveu a funcao do antigo `adicionar-fase`), nao referencias quebradas
a um arquivo/comando inexistente. PASS.

---

## 5. up-tools.cjs nao quebrou — PASS

Comandos:
```
node up/bin/up-tools.cjs timestamp
node up/bin/up-tools.cjs slug "teste de slug"
```

Evidencia:
```
{ "timestamp": "2026-05-30T14:35:47.321Z" }   timestamp exit=0
{ "slug": "teste-de-slug" }                    slug exit=0
```

Ambos rodam e retornam JSON valido. PASS.

---

## 6. Contagem — PASS

`up/skills/` (esperado 4 dirs):
```
up-brainstorm
up-tdd
up-verificar-antes-de-concluir
usando-up
```
4 diretorios, cada um com `SKILL.md`. OK.

`up/hooks/`:
```
up-context-monitor.js
up-session-start.js
up-statusline.js
```
`up-session-start.js` -> PRESENT. PASS.
