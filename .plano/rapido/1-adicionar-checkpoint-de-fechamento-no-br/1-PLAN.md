---
phase: rapido-1-adicionar-checkpoint-de-fechamento-no-br
plan: "1"
type: feature
autonomous: true
wave: 1
depends_on: []
requirements: []
must_haves:
  truths:
    - "SKILL.md do up-brainstorm define o checkpoint de fechamento como regra transversal: toda rodada de perguntas dos tiers Pequena, full e exploracao fecha com AskUserQuestion de 2 opcoes (Fechar e seguir / Mais perguntas), em loop ate o usuario liberar"
    - "Tier Trivial permanece fora do checkpoint (0 perguntas, so anuncia)"
    - "Os 3 pontos de fluxo existentes (linha Pequena da tabela, passo 3 do Brainstorm full, passos 4-5 do Modo exploracao) referenciam o checkpoint"
    - "A copia instalada em ~/.claude/skills/up-brainstorm/SKILL.md contem o checkpoint (sync via installer)"
  artifacts:
    - path: "up/skills/up-brainstorm/SKILL.md"
      provides: "Secao nova 'Checkpoint de fechamento' + 3 referencias nos fluxos existentes"
    - path: "$HOME/.claude/skills/up-brainstorm/SKILL.md"
      provides: "Copia instalada sincronizada com o repo"
  key_links:
    - from: "tabela de profundidade (tier Pequena)"
      to: "secao Checkpoint de fechamento"
      via: "mencao textual 'checkpoint de fechamento' na linha do tier"
    - from: "Brainstorm full passo 3"
      to: "secao Checkpoint de fechamento"
      via: "frase 'Feche a rodada com o checkpoint de fechamento antes de avancar pro passo 4'"
    - from: "Modo exploracao passos 4-5"
      to: "secao Checkpoint de fechamento"
      via: "passo 4 fecha com o checkpoint; passo 5 so roda apos 'Fechar e seguir'"
    - from: "up/skills/up-brainstorm/SKILL.md"
      to: "$HOME/.claude/skills/up-brainstorm/SKILL.md"
      via: "node up/bin/install.js --claude --global (copyDirWithReplace)"
---

# Rapido 1: Checkpoint de fechamento no up-brainstorm

**Objetivo:** Toda rodada de perguntas do brainstorm (tiers Pequena, full e exploracao) passa a fechar com um AskUserQuestion de controle que devolve o comando ao usuario: "Fechar e seguir" avanca pro proximo passo do tier, "Mais perguntas" abre nova rodada mais especifica (loop ate o usuario liberar). Tier Trivial fica fora (0 perguntas). Design JA APROVADO pelo usuario no brainstorm: NAO re-decidir nada, so aplicar exatamente como especificado abaixo.

## Contexto

@up/skills/up-brainstorm/SKILL.md (100 linhas): arquivo alvo. Secoes na ordem: HARD-GATE, Red flags, Profundidade escalada (tabela de tiers, linha Pequena na linha 38), Override de profundidade (termina na linha 53), Modo exploracao (passos 4-5 nas linhas 64-65), Trilha NAO-codigo, Brainstorm full (passo 3 na linha 87), Estado terminal.
@up/bin/install.js: installer. Para Claude, copia `up/skills/<nome>/` verbatim para `<config>/skills/<nome>/` via copyDirWithReplace (linhas 1096-1115).

**Regras duras de texto (valem para TODO texto novo deste plano):**
- Portugues SEM acentos, seguindo o padrao do arquivo atual: escrever "secao", "nao", "exploracao", "opcoes", "proximo", "ate", "ja", "so", "avanca", "especifica".
- ZERO em-dash e ZERO en-dash. Usar ponto, virgula, dois-pontos, parenteses ou hifen normal (-).
- Baseline verificado: o arquivo atual tem 0 acentos, 0 em/en-dashes e 0 ocorrencias de "checkpoint de fechamento". Os comandos de verificacao abaixo dependem disso.

## Tarefas

<task id="1" type="auto">
<files>up/skills/up-brainstorm/SKILL.md</files>
<action>
Fazer 4 edits com a ferramenta Edit, usando exatamente os old_string/new_string abaixo (o arquivo atual casa com os old_string; nao parafrasear).

**Edit A: inserir a secao nova apos "Override de profundidade" e antes de "Modo exploracao".**

old_string:
```
Pressa nunca remove o gate; muda so quantas perguntas.

## Modo exploracao (ideia crua, acima do full)
```

new_string:
```
Pressa nunca remove o gate; muda so quantas perguntas.

## Checkpoint de fechamento (toda rodada de perguntas)

Regra transversal aos tiers **Pequena**, **full** e **exploracao**. Tier Trivial fica FORA (0 perguntas, so anuncia e segue).

Toda rodada de perguntas termina com um AskUserQuestion de controle com exatamente 2 opcoes:

- **"Fechar e seguir"**: encerra as perguntas e avanca pro proximo passo do tier (design em 3 frases, propor abordagens ou destilar a ideia).
- **"Mais perguntas"**: abre nova rodada, mais especifica que a anterior. Essa rodada termina com este mesmo checkpoint. Loop ate o usuario escolher fechar.

Nao adicione opcao de resposta livre: o "Other" nativo do AskUserQuestion ja cobre. Se o usuario responder algo livre, incorpore como novo insumo e feche a rodada seguinte com o mesmo checkpoint.

## Modo exploracao (ideia crua, acima do full)
```

**Edit B: linha do tier Pequena na tabela de profundidade (linha 38).**

old_string:
```
| **Pequena** (1 subsistema, 1 escolha de design) | 1 pergunta via AskUserQuestion (a decisao-chave) + design em 3 frases. Aprova e segue. |
```

new_string:
```
| **Pequena** (1 subsistema, 1 escolha de design) | 1 pergunta via AskUserQuestion (a decisao-chave) + checkpoint de fechamento + design em 3 frases. Aprova e segue. |
```

**Edit C: passos 4-5 do Modo exploracao (linhas 64-65): checkpoint antes de destilar.**

old_string:
```
4. **Uma pergunta por vez**, multipla escolha quando der. Vai estreitando do amplo pro especifico.
5. **Destile** a ideia num paragrafo claro: o que e, pra quem, por que, o diferencial. Confirme com o usuario.
```

new_string:
```
4. **Uma pergunta por vez**, multipla escolha quando der. Vai estreitando do amplo pro especifico. Feche a rodada com o checkpoint de fechamento.
5. So depois do "Fechar e seguir" do checkpoint, **destile** a ideia num paragrafo claro: o que e, pra quem, por que, o diferencial. Confirme com o usuario.
```

**Edit D: passo 3 do Brainstorm full (linha 87): checkpoint antes de propor abordagens no passo 4.**

old_string:
```
3. **Perguntas uma por vez.** Multipla escolha preferida. Foco: proposito, restricoes, criterio de sucesso. Se o escopo for multiplos subsistemas independentes, sinalize JA e ajude a decompor em sub-projetos.
```

new_string:
```
3. **Perguntas uma por vez.** Multipla escolha preferida. Foco: proposito, restricoes, criterio de sucesso. Se o escopo for multiplos subsistemas independentes, sinalize JA e ajude a decompor em sub-projetos. Feche a rodada com o checkpoint de fechamento antes de avancar pro passo 4.
```

NAO alterar mais nada no arquivo: frontmatter, HARD-GATE, Red flags, linha do tier Trivial, Override, Trilha NAO-codigo e Estado terminal ficam intactos.
</action>
<verify><automated>test "$(grep -ci 'checkpoint de fechamento' up/skills/up-brainstorm/SKILL.md)" -ge 4 && grep -q '^## Checkpoint de fechamento (toda rodada de perguntas)$' up/skills/up-brainstorm/SKILL.md && ! grep -qP '[\x{2013}\x{2014}áàâãéêíóôõúüç]' up/skills/up-brainstorm/SKILL.md && echo PASS</automated></verify>
<done>SKILL.md contem a secao "## Checkpoint de fechamento (toda rodada de perguntas)" entre "Override de profundidade" e "Modo exploracao", com as 2 opcoes ("Fechar e seguir" / "Mais perguntas"), a nota do "Other" nativo e a exclusao do tier Trivial. As 3 mencoes de fluxo (linha Pequena, full passo 3, exploracao passos 4-5) citam o checkpoint. Arquivo segue sem acentos e sem em/en-dash (comando de verificacao imprime PASS).</done>
</task>

<task id="2" type="auto">
<files>up/skills/up-brainstorm/SKILL.md</files>
<action>
Commit atomico na branch atual (main), sem worktree, sem PR, so o arquivo da skill:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "feat(up-brainstorm): checkpoint de fechamento em toda rodada de perguntas" --files up/skills/up-brainstorm/SKILL.md
```

Fallback se o helper falhar (fail-open):

```bash
git add up/skills/up-brainstorm/SKILL.md && git commit -m "feat(up-brainstorm): checkpoint de fechamento em toda rodada de perguntas"
```

NAO incluir outros arquivos no commit (nem os .plano/ deste plano). NAO fazer push.
</action>
<verify><automated>git log -1 --pretty=%s | grep -q 'checkpoint de fechamento' && test -z "$(git status --porcelain up/skills/)" && echo PASS</automated></verify>
<done>HEAD da main contem o commit "feat(up-brainstorm): checkpoint de fechamento em toda rodada de perguntas" com apenas up/skills/up-brainstorm/SKILL.md alterado; working tree limpo em up/skills/.</done>
</task>

<task id="3" type="auto">
<files>$HOME/.claude/skills/up-brainstorm/SKILL.md</files>
<action>
Sincronizar a copia instalada rodando o installer a partir da raiz do repo (/home/projects/up-cc):

```bash
node up/bin/install.js --claude --global
```

O installer copia up/skills/up-brainstorm/ inteira para $HOME/.claude/skills/up-brainstorm/ (copyDirWithReplace limpa e recopia o diretorio da skill; skills de terceiros nao sao tocadas). Ele tambem re-sincroniza o restante dos arquivos UP (comandos, agentes, hooks), o que e esperado e desejado: o repo em main e a fonte de verdade.
</action>
<verify><automated>test "$(grep -ci 'checkpoint de fechamento' "$HOME/.claude/skills/up-brainstorm/SKILL.md")" -ge 4 && echo PASS</automated></verify>
<done>~/.claude/skills/up-brainstorm/SKILL.md contem a secao e as referencias do checkpoint de fechamento (mesmo conteudo do repo); installer terminou sem erro.</done>
</task>

## Criterios de Sucesso

- [ ] Secao "## Checkpoint de fechamento (toda rodada de perguntas)" existe em up/skills/up-brainstorm/SKILL.md, entre "Override de profundidade" e "Modo exploracao", com as opcoes "Fechar e seguir" e "Mais perguntas" e a regra de loop
- [ ] Tier Trivial explicitamente fora do checkpoint (0 perguntas, so anuncia)
- [ ] Linha Pequena da tabela, passo 3 do Brainstorm full e passos 4-5 do Modo exploracao referenciam o checkpoint
- [ ] Nenhum acento, em-dash ou en-dash no arquivo (grep de verificacao passa)
- [ ] Commit atomico unico na main tocando apenas up/skills/up-brainstorm/SKILL.md
- [ ] Copia instalada ~/.claude/skills/up-brainstorm/SKILL.md sincronizada via node up/bin/install.js --claude --global
