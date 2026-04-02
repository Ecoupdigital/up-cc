# Delivery Report Template

Template para `.plano/DELIVERY.md` -- relatorio de entrega final gerado pelo modo builder.

<template>

```markdown
# Entrega: [Nome do Projeto]

## Resumo

[O que foi construido em 2-3 frases. Descrever o produto, nao o processo.]

## Quality Score

**Score Final: [N]/10** (apos [X] ciclos de refinamento)

| Dimensao | Score | Peso |
|----------|-------|------|
| Funcionalidade | [N]/10 | 25% |
| E2E | [N]/10 | 20% |
| UX | [N]/10 | 15% |
| Responsividade | [N]/10 | 15% |
| Codigo | [N]/10 | 15% |
| Completude | [N]/10 | 10% |

**Ciclos de refinamento:** [N]
**Score inicial:** [N]/10 → **Score final:** [N]/10

## Stack Utilizada

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Frontend | [framework] | [versao] |
| Backend | [framework/servico] | [versao] |
| Database | [banco] | [versao] |
| Auth | [metodo] | -- |
| Deploy | [plataforma] | -- |

## O que foi Entregue

[Para cada fase completada:]

### Fase [N]: [Nome]
- [Entregavel 1]
- [Entregavel 2]
- [Entregavel 3]

## Requisitos Atendidos

**[X] de [Y] requisitos completos**

### Completos
- [x] [REQ-ID]: [Descricao]

### Pendentes (se houver)
- [ ] [REQ-ID]: [Descricao] -- [motivo]

## Testes E2E (Playwright)

[Resultados do teste E2E final — de .plano/e2e/E2E-REPORT.md]

### Rotas Testadas

| Rota | Status | Screenshot |
|------|--------|------------|
| / | OK | .plano/e2e/smoke/index.png |
| /dashboard | OK | .plano/e2e/smoke/dashboard.png |

**Rotas acessiveis:** [N]/[M]

### Fluxos E2E

| Fluxo | Passos | Resultado |
|-------|--------|-----------|
| [Nome do fluxo 1] | [N] | PASSOU |
| [Nome do fluxo 2] | [N] | FALHOU no passo [X] |

### Responsividade

| Viewport | Screenshot | Status |
|----------|-----------|--------|
| Desktop (1920x1080) | .plano/e2e/responsive/desktop.png | OK |
| Tablet (768x1024) | .plano/e2e/responsive/tablet.png | [status] |
| Mobile (375x812) | .plano/e2e/responsive/mobile.png | [status] |

### Bugs Encontrados nos Testes

| # | Descricao | Severidade | Corrigido? |
|---|-----------|-----------|-----------|
| 1 | [bug] | [alta/media/baixa] | Sim/Nao |

**Total:** [N] bugs encontrados, [M] corrigidos automaticamente

Relatorio completo: `.plano/e2e/E2E-REPORT.md`
Screenshots: `.plano/e2e/`

## UX Review (Navegacao como Usuario Real)

[Resultados do UX Tester — de .plano/ux-review/UX-REPORT.md]

**Score Geral:** [N]/10

| Dimensao | Score |
|----------|-------|
| Clareza | [N]/10 |
| Eficiencia | [N]/10 |
| Feedback | [N]/10 |
| Consistencia | [N]/10 |
| Acessibilidade | [N]/10 |
| Performance Percebida | [N]/10 |

### Melhorias UX Implementadas

| ID | Melhoria | Dimensao |
|----|----------|----------|
| UX-001 | [descricao] | [dimensao] |
| UX-002 | [descricao] | [dimensao] |

**Implementadas:** [N] (incluindo componentes novos e ajustes de fluxo)
**Tentativas falhas (revertidas):** [N]

### Tentativas Falhas
[Mudancas que o UX Tester tentou mas reverteu por quebrar funcionalidade]

Relatorio completo: `.plano/ux-review/UX-REPORT.md`
Screenshots: `.plano/ux-review/screenshots/`

## Responsividade Mobile (Mobile First)

[Resultados do Mobile First — de .plano/mobile-review/MOBILE-REPORT.md]

**Score de Responsividade:** [N]/10

| Viewport | Paginas OK | Problemas | Corrigidos |
|----------|-----------|-----------|-----------|
| Mobile (390px) | [N] | [N] | [N] |
| Tablet (768px) | [N] | [N] | [N] |
| Desktop (1920px) | [N] (referencia) | -- | -- |

### Correcoes Implementadas

| ID | Problema | Pagina | Fix |
|----|---------|--------|-----|
| MOB-001 | [desc] | [rota] | [o que foi feito] |

**Desktop intacto:** Verificado apos cada correcao

Relatorio completo: `.plano/mobile-review/MOBILE-REPORT.md`
Screenshots: `.plano/mobile-review/screenshots/`

## Insights Capturados Durante o Build

[Insights descobertos pelos agentes durante a execucao — de .plano/captures/TRIAGE.md]

### Criticos
[Problemas que precisam de atencao imediata]

### Alertas
[Problemas potenciais detectados]

### Oportunidades
[Melhorias e features descobertas organicamente durante o build]

### Padroes
[Padroes identificados no codebase que podem informar futuras decisoes]

**Total:** [N] insights capturados durante [M] fases

Triagem completa: `.plano/captures/TRIAGE.md`

## Melhorias Aplicadas

[Lista das melhorias do Estagio 4 - Polish, se executado]

| ID | Melhoria | Dimensao | Impacto |
|----|----------|----------|---------|
| MELH-001 | [descricao] | UX/Perf/Mod | [resultado] |

## Proximos Passos (Ideias Geradas)

[Top 5 ideias do /up:ideias, ordenadas por ICE score]

1. **[Ideia 1]** -- ICE: [score] | [descricao breve]
2. **[Ideia 2]** -- ICE: [score] | [descricao breve]
3. **[Ideia 3]** -- ICE: [score] | [descricao breve]
4. **[Ideia 4]** -- ICE: [score] | [descricao breve]
5. **[Ideia 5]** -- ICE: [score] | [descricao breve]

Relatorio completo: `.plano/ideias/RELATORIO.md`

## Como Rodar

### Pre-requisitos
- Node.js >= [versao]
- [Outros pre-requisitos]

### Setup
\`\`\`bash
[comandos de instalacao]
\`\`\`

### Variaveis de Ambiente
\`\`\`bash
# Copiar .env.example para .env e preencher:
[VAR_1]=          # [descricao]
[VAR_2]=          # [descricao]
\`\`\`

### Desenvolvimento
\`\`\`bash
[comando para rodar em dev]
\`\`\`

### Build
\`\`\`bash
[comando para build de producao]
\`\`\`

## Metricas do Build

| Metrica | Valor |
|---------|-------|
| Fases completadas | [N] |
| Planos executados | [N] |
| Commits | [N] |
| Testes unitarios | [N] passando |
| Rotas E2E testadas | [N]/[M] OK |
| Fluxos E2E testados | [N]/[M] passaram |
| Bugs E2E encontrados | [N] ([M] corrigidos) |
| UX Score | [N]/10 |
| Melhorias UX implementadas | [N] |
| Responsividade Score | [N]/10 |
| Problemas mobile corrigidos | [N] |
| Insights capturados | [N] |
| Reassessments | [N] ajustes no roadmap |
| Melhorias codigo aplicadas | [N] |
| Ideias geradas | [N] |

---
*Gerado automaticamente por UP modo-builder em [data]*
```

</template>

<guidelines>

**Preenchimento:**
- Secoes preenchidas automaticamente pelo workflow builder.md
- Dados extraidos de: ROADMAP.md, REQUIREMENTS.md, SUMMARYs, E2E-REPORT.md, RELATORIO.md (melhorias e ideias)
- "Como Rodar" inferido do stack + package.json + env vars usados

**Se testes E2E nao executaram:**
- Secao "Testes E2E" mostra: "Testes E2E nao executados (projeto sem UI ou dev server falhou)"

**Se UX Review nao executou:**
- Secao "UX Review" mostra: "UX Review nao executado (projeto sem UI ou dev server falhou)"

**Se nao ha captures:**
- Secao "Insights Capturados" mostra: "Nenhum insight capturado durante o build"

**Se estagio Polish nao executou:**
- Secao "Melhorias Aplicadas" mostra: "Estagio de polimento nao executado"
- Secao "Proximos Passos" mostra: "Ideacao nao executada"

**Se requisitos pendentes:**
- Listar com motivo (falha na verificacao, complexidade, bloqueio externo)

</guidelines>
