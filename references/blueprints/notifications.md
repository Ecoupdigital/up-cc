# Blueprint: Notifications

Aplicar quando: sistema tem usuarios ativos que precisam ser informados de eventos.
Praticamente TODO sistema com auth precisa deste blueprint.

---

## In-App (NOTIF)

- NOTIF-01: Sino de notificacao com badge de contagem (nao lidas)
- NOTIF-02: Dropdown/painel de notificacoes
- NOTIF-03: Marcar como lida (individual e "marcar todas")
- NOTIF-04: Tipos visiveis: info, sucesso, alerta, erro
- NOTIF-05: Link para a acao/pagina relevante
- NOTIF-06: Timestamp relativo ("5 min atras", "ontem")
- NOTIF-07: Paginacao (carregar mais antigas)
- NOTIF-08: Realtime (nova notificacao aparece sem refresh)

## Email (EMAIL)

- EMAIL-01: Template de email transacional (branding consistente)
- EMAIL-02: Email de boas-vindas apos signup
- EMAIL-03: Email de confirmacao para acoes criticas
- EMAIL-04: Email de reset de senha
- EMAIL-05: Opcao de unsubscribe em cada email

## Preferencias (PREF)

- PREF-01: Pagina de preferencias de notificacao
- PREF-02: Toggle por tipo de notificacao (on/off)
- PREF-03: Toggle por canal (in-app, email, push)
- PREF-04: Defaults razoaveis (tudo ligado, ajusta se quiser)
