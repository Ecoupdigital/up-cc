---
name: up:modo-builder
description: Construir projeto completo de forma autonoma — greenfield (do zero) ou brownfield (feature nova em projeto existente)
argument-hint: "[descricao do projeto ou feature]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - WebFetch
  - WebSearch
  - AskUserQuestion
  - mcp__context7__*
  - mcp__plugin_playwright_playwright__*
---
<objective>
Modo Builder: construir projeto completo de forma totalmente autonoma.

Detecta automaticamente o modo:
- **Greenfield** (sem codigo existente): cria projeto do zero
- **Brownfield** (codigo existente): mapeia codebase, planeja e implementa feature/mudanca

O usuario fornece um briefing, responde perguntas criticas (apenas sobre credenciais/APIs/ambiguidades), e o sistema faz TUDO sozinho:

1. **Detecta** modo (greenfield vs brownfield)
2. **Mapeia** codebase existente (brownfield) ou **Pesquisa** ecossistema (greenfield)
3. **Estrutura** o projeto (PROJECT.md, REQUIREMENTS.md, ROADMAP.md)
4. **Planeja** cada fase com planos executaveis
5. **Executa** cada fase com commits atomicos
6. **Verifica** cada fase contra requisitos
7. **Audita** o resultado (UX, performance, modernidade)
8. **Aplica** melhorias de alto impacto automaticamente
9. **Gera** ideias para proximos passos com ICE scoring
10. **Entrega** relatorio completo com instrucoes de setup

Usa TODOS os processos existentes do UP orquestrados em sequencia sem parar para perguntar.
Em brownfield, respeita stack, convencoes e estrutura existentes.
</objective>

<execution_context>
@~/.claude/up/workflows/builder.md
@~/.claude/up/workflows/builder-e2e.md
@~/.claude/up/workflows/ux-tester.md
@~/.claude/up/references/ui-brand.md
</execution_context>

<context>
$ARGUMENTS

O argumento e o briefing em texto livre. Pode incluir:

**Greenfield (projeto novo):**
- O que quer construir
- Para quem (publico)
- Stack desejada (ou usa builder-defaults.md)
- Features principais
- Credenciais/APIs que ja tem

**Brownfield (projeto existente):**
- Que feature/mudanca quer implementar
- Como se integra com o existente
- Novas APIs/integrações necessarias
- Restricoes ou areas que nao devem ser tocadas

Se $ARGUMENTS estiver vazio, o workflow pedira o briefing interativamente.

**Deteccao automatica:** Se ha codigo existente no diretorio (package.json, src/, etc.) ou .plano/ existente, o builder entra em modo brownfield automaticamente.

**Defaults:** Lidos de `~/.claude/up/builder-defaults.md` (se existir).
Em brownfield, convencoes do codebase existente tem prioridade sobre defaults.
</context>

<process>
Execute the builder workflow from @~/.claude/up/workflows/builder.md end-to-end.

**CRITICO:** A partir do Estagio 2, ZERO interacao com usuario. NAO use AskUserQuestion apos coletar o briefing e respostas criticas. Toda decisao e tomada autonomamente.

Preserve all workflow gates:
- Estagio 1: Intake (detectar modo + briefing + perguntas criticas)
- Estagio 2: Arquitetura (mapear codebase OU pesquisar ecossistema + up-arquiteto)
- Estagio 3: Build (loop planejar → executar → verificar por fase)
- Estagio 4: Polish (melhorias + quick wins + ideias)
- Estagio 5: Entrega (DELIVERY.md + resumo)

Falhas sao contornadas, nunca bloqueiam. O builder SEMPRE entrega algo.
</process>
