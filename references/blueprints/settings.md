# Blueprint: Settings & Configuration

Aplicar quando: sistema tem configuracoes ajustaveis pelo usuario ou admin.
Praticamente TODO sistema SaaS precisa deste blueprint.

---

## Perfil & Conta (ACCT)

- ACCT-01: Pagina de configuracoes com sidebar/tabs por secao
- ACCT-02: Secao "Perfil" (nome, foto, bio, contato)
- ACCT-03: Secao "Seguranca" (alterar senha, sessoes ativas)
- ACCT-04: Secao "Notificacoes" (preferencias de canal e tipo)
- ACCT-05: Secao "Aparencia" (tema claro/escuro, idioma)
- ACCT-06: Secao "Dados" (export dos meus dados, deletar conta)
- ACCT-07: Save com feedback (toast de sucesso)

## Configuracao do Negocio — Admin Only (BIZ)

- BIZ-01: Dados do negocio (nome, logo, endereco, CNPJ, contato)
- BIZ-02: Horario de funcionamento
- BIZ-03: Configuracao de moeda e locale
- BIZ-04: Configuracao de email (remetente, templates)
- BIZ-05: Integrações ativas (toggle on/off, chaves de API)
- BIZ-06: Plano atual e billing info (se SaaS multi-tenant)

## Customizacao Visual — Admin Only (THEME)

- THEME-01: Logo upload
- THEME-02: Cores primarias (se white-label)
- THEME-03: Favicon customizado
