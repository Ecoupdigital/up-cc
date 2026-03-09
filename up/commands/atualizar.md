---
name: up:atualizar
description: Atualizar up-cc para ultima versao via npm
allowed-tools:
  - Bash
  - AskUserQuestion
---

<objective>
Verificar atualizacoes do up-cc via npm, mostrar mudancas, e instalar se disponivel.
</objective>

<process>

## 1. Detectar Versao Instalada

```bash
# Verificar versao local
for dir in .claude .config/opencode .gemini; do
  if [ -f "./$dir/up/package.json" ]; then
    node -e "console.log(require('./$dir/up/package.json').version)" 2>/dev/null
    echo "LOCAL"
    break
  fi
done

# Verificar versao global
for dir in .claude .config/opencode .gemini; do
  if [ -f "$HOME/$dir/up/package.json" ]; then
    node -e "console.log(require('$HOME/$dir/up/package.json').version)" 2>/dev/null
    echo "GLOBAL"
    break
  fi
done
```

Se versao nao encontrada, tratar como 0.0.0.

## 2. Verificar Ultima Versao

```bash
npm view up-cc version 2>/dev/null
```

Se falhar: informar que nao foi possivel verificar (offline ou npm indisponivel). Sair.

## 3. Comparar Versoes

**Se instalada == ultima:**
```
UP > JA ATUALIZADO

Instalada: X.Y.Z
Ultima: X.Y.Z
```
Sair.

## 4. Confirmar e Atualizar

```
UP > ATUALIZACAO DISPONIVEL

Instalada: {old}
Disponivel: {new}

A instalacao limpa substitui:
- commands/up/ (comandos substituidos)
- up/ (workflows, agentes, templates substituidos)

Seus arquivos customizados sao preservados:
- Comandos fora de commands/up/ ✓
- Agentes sem prefixo up- ✓
- Hooks customizados ✓
- Seus CLAUDE.md ✓
```

Perguntar: "Atualizar agora?" (Sim / Nao)

Se nao: sair.

Se sim:

**Install local:**
```bash
npx -y up-cc@latest --local
```

**Install global:**
```bash
npx -y up-cc@latest --global
```

## 5. Resultado

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > ATUALIZADO: v{old} -> v{new}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reinicie o Claude Code para usar os novos comandos.
```

</process>
