# Blueprint: SaaS Users & Permissions

Aplicar quando: sistema tem login, multiplos usuarios, ou qualquer menção a "admin", "roles", "permissoes".
Praticamente TODO sistema web com auth precisa deste blueprint.

---

## Autenticacao (AUTH)

- AUTH-01: Login com email/senha
- AUTH-02: Signup com verificacao de email
- AUTH-03: Forgot password (enviar link de reset)
- AUTH-04: Reset password (pagina com token)
- AUTH-05: Alteracao de senha (logado, exige senha atual)
- AUTH-06: Logout com limpeza de sessao
- AUTH-07: Sessao persistente (refresh token / remember me)
- AUTH-08: Redirect pos-login para pagina de origem
- AUTH-09: Loading state durante verificacao de auth (nao piscar login)
- AUTH-10: OAuth social (Google, GitHub) — se aplicavel ao dominio

## Perfil de Usuario (PROFILE)

- PROFILE-01: Pagina de perfil (nome, email, foto, contato)
- PROFILE-02: Upload de foto de perfil (com crop/resize)
- PROFILE-03: Edicao de dados pessoais
- PROFILE-04: Visualizacao de plano/role atual
- PROFILE-05: Historico de atividade do usuario

## Roles e Permissoes (ROLE)

- ROLE-01: Definir roles do sistema (ex: admin, gerente, atendente, cliente)
- ROLE-02: Cada role tem permissoes especificas (CRUD por modulo)
- ROLE-03: Tabela de permissoes: role × modulo × acao (ver, criar, editar, deletar)
- ROLE-04: UI adapta baseado no role (menus, botoes, paginas visiveis)
- ROLE-05: API valida permissoes (nao depender apenas do front)
- ROLE-06: Role padrao para novos usuarios (configuravel)
- ROLE-07: Super admin (acesso total, nao removivel)

## Gestao de Usuarios (USRMGMT)

- USRMGMT-01: Listar usuarios (com busca, filtro por role, paginacao)
- USRMGMT-02: Criar usuario (nome, email, role, senha temporaria ou convite)
- USRMGMT-03: Editar usuario (nome, email, role)
- USRMGMT-04: Desativar/reativar usuario (soft delete, nao hard delete)
- USRMGMT-05: Reset de senha por admin (gerar link de reset)
- USRMGMT-06: Alterar role de usuario
- USRMGMT-07: Convite por email (link de signup com role pre-definido)
- USRMGMT-08: Indicador de status (ativo, inativo, pendente convite)
- USRMGMT-09: Acessivel apenas para admin
- USRMGMT-10: Log de alteracoes (quem mudou o que)
