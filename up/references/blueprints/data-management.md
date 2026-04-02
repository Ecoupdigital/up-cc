# Blueprint: Data Management

Aplicar quando: sistema tem listas de dados, tabelas, registros que o usuario precisa gerenciar.
Praticamente TODO sistema com CRUD precisa deste blueprint.

---

## CRUD Avancado (CRUD)

- CRUD-01: Listagem com busca por texto
- CRUD-02: Filtros por campo (status, categoria, data, responsavel)
- CRUD-03: Ordenacao por coluna (click no header)
- CRUD-04: Paginacao (server-side para > 100 registros)
- CRUD-05: Selecao multipla (checkboxes)
- CRUD-06: Bulk actions (deletar selecionados, alterar status, exportar)
- CRUD-07: Criar registro (modal ou pagina dedicada)
- CRUD-08: Editar registro (inline ou modal ou pagina)
- CRUD-09: Deletar com confirmacao
- CRUD-10: Soft delete (desativar, nao deletar permanentemente)

## Import/Export (IO)

- IO-01: Export CSV (filtros aplicados)
- IO-02: Export PDF (relatorio formatado)
- IO-03: Import CSV (com preview e validacao antes de importar)
- IO-04: Template de CSV para download (formato esperado)
- IO-05: Feedback de progresso durante import

## Busca Avancada (SEARCH)

- SEARCH-01: Busca global (barra de busca no header, cmd+k)
- SEARCH-02: Resultados agrupados por tipo (clientes, pedidos, etc.)
- SEARCH-03: Busca com debounce (300ms)
- SEARCH-04: Historico de buscas recentes
- SEARCH-05: Atalho de teclado (Cmd+K / Ctrl+K)

## Filtros Persistentes (FILT)

- FILT-01: Filtros salvos na URL (compartilhavel)
- FILT-02: Filtros salvos pelo usuario (favoritos)
- FILT-03: Botao "limpar filtros"
- FILT-04: Contador de resultados apos filtrar
