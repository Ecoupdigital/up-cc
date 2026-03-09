<purpose>
Adicionar nova fase inteira ao final do milestone atual no roadmap. Calcula automaticamente proximo numero de fase, cria diretorio de fase e atualiza estrutura do roadmap.
</purpose>

<required_reading>
Ler todos os arquivos referenciados pelo execution_context do prompt invocador antes de comecar.
</required_reading>

<process>

<step name="parse_arguments">
Parsear argumentos do comando:
- Todos os argumentos viram a descricao da fase
- Exemplo: `/up:adicionar-fase Adicionar autenticacao` → descricao = "Adicionar autenticacao"
- Exemplo: `/up:adicionar-fase Corrigir problemas criticos de performance` → descricao = "Corrigir problemas criticos de performance"

Se nenhum argumento fornecido:

```
ERRO: Descricao da fase obrigatoria
Uso: /up:adicionar-fase <descricao>
Exemplo: /up:adicionar-fase Adicionar sistema de autenticacao
```

Sair.
</step>

<step name="init_context">
Carregar contexto de operacao de fase:

```bash
INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init operacao-fase "0")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Verificar `roadmap_exists` do JSON de init. Se false:
```
ERRO: Nenhum roadmap encontrado (.plano/ROADMAP.md)
Execute /up:novo-projeto para inicializar.
```
Sair.
</step>

<step name="add_phase">
**Delegar adicao da fase ao up-tools:**

```bash
RESULT=$(node "$HOME/.claude/up/bin/up-tools.cjs" phase add "${descricao}")
```

O CLI faz:
- Encontrar o maior numero de fase inteiro existente
- Calcular proximo numero (max + 1)
- Gerar slug da descricao
- Criar diretorio da fase (`.plano/fases/{NN}-{slug}/`)
- Inserir entrada da fase no ROADMAP.md com secoes Objetivo, Depende de e Planos

Extrair do resultado: `phase_number`, `padded`, `name`, `slug`, `directory`.
</step>

<step name="update_project_state">
Atualizar STATE.md para refletir nova fase:

1. Ler `.plano/STATE.md`
2. Em "## Contexto Acumulado" → "### Evolucao do Roadmap" adicionar:
   ```
   - Fase {N} adicionada: {descricao}
   ```

Se secao "Evolucao do Roadmap" nao existe, criar.
</step>

<step name="completion">
Apresentar resumo:

```
Fase {N} adicionada ao milestone atual:
- Descricao: {descricao}
- Diretorio: .plano/fases/{fase-num}-{slug}/
- Status: Ainda nao planejada

Roadmap atualizado: .plano/ROADMAP.md

---

## Proximo

**Fase {N}: {descricao}**

`/up:planejar-fase {N}`

<sub>`/clear` primeiro → janela de contexto limpa</sub>

---

**Tambem disponivel:**
- `/up:adicionar-fase <descricao>` — adicionar outra fase
- Revisar roadmap

---
```
</step>

</process>

<success_criteria>
- [ ] `up-tools phase add` executado com sucesso
- [ ] Diretorio da fase criado
- [ ] Roadmap atualizado com nova entrada
- [ ] STATE.md atualizado com nota de evolucao do roadmap
- [ ] Usuario informado dos proximos passos
</success_criteria>
