# Blueprint: Audit & Activity Logs

Aplicar quando: sistema tem roles/permissoes, dados sensiveis, ou necessidade de rastreabilidade.
Recomendado para TODO sistema com multiplos usuarios.

---

## Logs de Atividade (LOG)

- LOG-01: Registrar acoes importantes: criar, editar, deletar, alterar status, alterar permissao
- LOG-02: Cada log contem: quem, o que, quando, detalhes da mudanca
- LOG-03: Pagina de logs acessivel para admin
- LOG-04: Filtro por usuario, tipo de acao, data
- LOG-05: Busca por texto
- LOG-06: Paginacao (server-side, logs podem ser muitos)
- LOG-07: Retencao: definir periodo (ex: 90 dias)
- LOG-08: Nao editavel/deletavel (append-only)

## Auditoria de Dados (AUDIT)

- AUDIT-01: Historico de alteracoes por registro (quem mudou o que, quando)
- AUDIT-02: Diff visual (valor anterior → novo valor)
- AUDIT-03: Acessivel na pagina de detalhes do registro

## Sessoes (SESSION)

- SESSION-01: Listar sessoes ativas do usuario (dispositivo, IP, ultimo acesso)
- SESSION-02: Revogar sessao especifica
- SESSION-03: Revogar todas as sessoes (exceto atual)
