# Persistência de Estado entre Sessões

<purpose>
Instruções para Claude Code salvar estado do projeto automaticamente, mesmo fora de comandos /up:.
Quando o projeto tem `.plano/STATE.md`, TODA sessão produtiva deve registrar o que foi feito.
</purpose>

## Regra Principal

Se o diretório `.plano/` existe com `STATE.md`, você DEVE salvar o estado da sessão ao final de trabalho significativo — independente de ter usado comandos `/up:` ou não.

**Trabalho significativo** = qualquer coisa que mude o projeto de forma relevante:
- Correção de bugs
- Implementação de features (parcial ou completa)
- Refatoração
- Decisões de arquitetura
- Debug e investigação com conclusões
- Configuração de infra/deploy

**NÃO é significativo** (não precisa salvar):
- Leitura exploratória sem conclusão
- Perguntas conceituais
- Revisão sem alterações

## Como Salvar

Um único comando faz tudo (atualiza timestamp, descrição, atividade, e commita):

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" state save-session --summary "descrição do que foi feito"
```

**Se houve decisão importante:**

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" state save-session \
  --summary "descrição do que foi feito" \
  --decision "decisão tomada e por quê" \
  --phase 2
```

**Se não quer commitar automaticamente:**

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" state save-session --summary "descrição" --no-commit
```

## Quando Salvar

1. **Final da conversa** — quando o trabalho está concluído ou pausado
2. **Após resolver um bug** — mesmo que veio de continuação pós-agente
3. **Após implementar algo** — mesmo parcialmente
4. **Antes de sugerir /clear** — salvar estado garante continuidade

## O que Escrever no --summary

Seja específico e útil para a próxima sessão:

- BOM: "Corrigido bug de autenticação — token expirado não redirecionava para login. Alterado middleware em src/auth.ts"
- BOM: "Implementado componente de filtro de datas. Falta integrar com API de relatórios"
- RUIM: "Feitas correções"
- RUIM: "Trabalhado no projeto"

## Integração com CLAUDE.md do Projeto

Quando `/up:novo-projeto` ou `/up:modo-builder` inicializa um projeto, adicionar ao CLAUDE.md do projeto:

```markdown
## UP: Persistência de Estado

Este projeto usa o sistema UP. Se `.plano/STATE.md` existir:
- Ao final de trabalho significativo, salvar estado: `node "$HOME/.claude/up/bin/up-tools.cjs" state save-session --summary "o que foi feito"`
- Isso garante continuidade entre sessões mesmo sem usar comandos /up:
```
