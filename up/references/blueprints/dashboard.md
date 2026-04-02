# Blueprint: Dashboard & Analytics

Aplicar quando: "dashboard", "painel", "metricas", "KPIs", "relatorios", "analytics", "gestor".

---

## KPIs & Cards (KPI)

- KPI-01: Cards de metricas principais no topo (3-6 KPIs)
- KPI-02: Cada card mostra: valor atual, variacao vs periodo anterior (% e seta)
- KPI-03: Cores semanticas: verde=crescimento, vermelho=queda, cinza=neutro
- KPI-04: Skeleton loading individual por card
- KPI-05: Tooltip com detalhes ao hover

## Graficos (CHART)

- CHART-01: Pelo menos 1 grafico de linha/area (tendencia temporal)
- CHART-02: Pelo menos 1 grafico de barra ou pizza (distribuicao)
- CHART-03: Graficos responsivos (redimensionam com o container)
- CHART-04: Tooltip interativo ao hover nos pontos
- CHART-05: Legenda clicavel (toggle series)
- CHART-06: Empty state quando sem dados
- CHART-07: Loading skeleton para graficos

## Filtros (FILTER)

- FILTER-01: Date range picker (hoje, 7d, 30d, 90d, custom)
- FILTER-02: Filtros persistem na URL (compartilhavel)
- FILTER-03: Filtros persistem entre sessoes (localStorage)
- FILTER-04: Botao "limpar filtros"
- FILTER-05: Filtros por categoria/segmento relevante ao dominio

## Tabelas de Dados (TABLE)

- TABLE-01: Tabela com sort por coluna (click no header)
- TABLE-02: Busca/filtro inline
- TABLE-03: Paginacao (server-side para datasets grandes)
- TABLE-04: Export CSV/PDF
- TABLE-05: Selecao multipla com bulk actions
- TABLE-06: Responsiva (scroll horizontal ou card layout em mobile)
- TABLE-07: Loading skeleton rows

## Refresh & Realtime (REFRESH)

- REFRESH-01: Botao de refresh manual
- REFRESH-02: Indicador de "ultima atualizacao: X min atras"
- REFRESH-03: Auto-refresh configuravel (a cada 5min, desligavel)
- REFRESH-04: Realtime updates se stack suporta (Supabase Realtime, WebSocket)
