---
name: up:saude
description: Diagnosticar integridade do diretorio .plano/ e opcionalmente reparar
argument-hint: [--reparar]
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<objective>
Validar integridade do diretorio `.plano/` e reportar problemas acionaveis. Verifica arquivos ausentes, configuracoes invalidas, estado inconsistente e planos orfaos.
</objective>

<process>

## 1. Verificar Flag

Checar se `--reparar` esta presente nos argumentos.

## 2. Executar Checagens

Executar todas as verificacoes e coletar erros, avisos e informacoes:

**Erros (criticos):**
- E001: Diretorio `.plano/` nao existe
- E002: `PROJECT.md` nao encontrado
- E003: `ROADMAP.md` nao encontrado
- E004: `STATE.md` nao encontrado (reparavel — regenerar do ROADMAP)
- E005: `config.json` com erro de parse (reparavel — recriar com defaults)

**Avisos:**
- W001: `STATE.md` referencia fase que nao existe no disco
- W002: `config.json` nao encontrado (reparavel — criar com defaults)
- W003: Diretorio de fase nao segue padrao NN-nome
- W004: Fase no ROADMAP sem diretorio correspondente
- W005: Diretorio de fase no disco mas nao no ROADMAP

**Info:**
- I001: Plano sem SUMMARY (pode estar em progresso)

```bash
# Verificacoes basicas
ls -la .plano/ 2>/dev/null
ls .plano/PROJECT.md .plano/ROADMAP.md .plano/STATE.md .plano/config.json 2>/dev/null
cat .plano/config.json 2>/dev/null | node -e "JSON.parse(require('fs').readFileSync(0,'utf-8'))" 2>&1

# Fases no disco
ls -d .plano/fases/*/ 2>/dev/null

# Fases no ROADMAP
grep -E '#{2,4}\s*Phase\s+\d' .plano/ROADMAP.md 2>/dev/null

# Planos sem SUMMARY
for plan in .plano/fases/*/*-PLAN.md; do
  summary="${plan/-PLAN.md/-SUMMARY.md}"
  [ ! -f "$summary" ] && echo "SEM_SUMMARY: $plan"
done 2>/dev/null
```

## 3. Reparar (se --reparar)

| Acao | Efeito |
|------|--------|
| Criar config.json | Cria com defaults |
| Resetar config.json | Deleta e recria |
| Regenerar STATE.md | Cria do template com dados do ROADMAP |

**Nao reparavel (muito arriscado):**
- PROJECT.md, ROADMAP.md (conteudo do usuario)
- Renomear diretorios de fase
- Limpar planos orfaos

## 4. Exibir Resultado

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > SAUDE DO PROJETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status: SAUDAVEL | DEGRADADO | QUEBRADO
Erros: N | Avisos: N | Info: N
```

Se erros: listar com codigo e sugestao de correcao.
Se avisos: listar com codigo e sugestao.
Se info: listar.

Se reparos foram feitos: listar acoes executadas.

Se ha problemas reparaveis e `--reparar` NAO foi usado:
```
---
N problemas podem ser reparados automaticamente.
Executar: /up:saude --reparar
```

## 5. Verificar Reparos

Se reparos foram feitos, re-executar checagens para confirmar resolucao.

</process>
