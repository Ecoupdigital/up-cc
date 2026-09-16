# Padrão de Product Engineer

Referência única de engenharia e produto para quem implementa (sessão ou `up-executor`, seja qual for
o domínio). Funde três fontes que antes viviam separadas: o padrão de Product Engineer do dono, os 71
requisitos de produção por categoria (UIST, ERR, PERF, FORM, RESP, META, A11Y, SEC, POLISH) e as
regras de domínio (frontend, backend, banco) que antes moravam soltas em `up-executor.md`.

Carregada inteira por quem executa. Não é um checklist para citar de volta ao usuário: é o padrão que
orienta a análise "antes de codificar" (seção 11) e o checklist de completude do SUMMARY (seção 13).

> Vocabulário UP: fase, plano, onda, evidência, worktree, escape hatch, verificação e laço DCRV têm
> definição única em `$HOME/.claude/up/references/glossario-up.md`. Use o termo, não redefina.

---

## Objetivo

Quem implementa não deve apenas atender o pedido ao pé da letra. Analise o contexto como um **Product
Engineer Sênior**: identifique necessidades implícitas e entregue uma funcionalidade completa,
consistente e utilizável, sem esperar que o plano especifique cada detalhe óbvio de UX, produto ou
engenharia. Ao mesmo tempo, evite overengineering: implemente o que tem justificativa real para o
contexto, priorizando simplicidade, consistência e utilidade.

---

## 1. Regra principal

Antes de implementar qualquer entrega:

1. Entenda o objetivo da funcionalidade.
2. Entenda quem vai usá-la e como.
3. Analise funcionalidades relacionadas já existentes no sistema (`grep` por padrão similar).
4. Identifique requisitos implícitos necessários para uma boa experiência (a linha `Implícitos:` do
   plano aponta o que não é óbvio; o resto desta referência cobre o resto).
5. Escolha padrões coerentes com o restante do projeto.
6. Implemente a solução completa, não só o caminho feliz.

---

## 2. Telas de listagem e gestão

Toda listagem, tabela, grid, catálogo, CRM ou tela administrativa: avalie a necessidade de busca
textual, filtros relevantes, limpar filtros, ordenação por coluna, paginação (servidor, não local:
ver seção 7), quantidade total de registros, seleção de registros, ações individuais e em massa,
criar/ver/editar/excluir, duplicar quando fizer sentido, ativar/desativar ou mudar status quando
aplicável, exportar/importar quando relevante, persistência de filtro quando útil, estado vazio,
loading/skeleton, tratamento de erro, feedback de sucesso/erro e confirmação para ação destrutiva.

Decida o que faz sentido no contexto e implemente sem depender de pedido explícito. IDs de referência
(seção 5 detalha): `PERF-04` (paginação), `PERF-03` (debounce na busca), `UIST-08` (confirmação
destrutiva), `RESP-04` (tabela vira card no mobile).

---

## 3. CRUD completo

Entidade com gestão administrativa: pense no ciclo Create/Read/Update/Delete e avalie duplicação,
arquivamento, soft delete, restauração, histórico de alterações, status ativo/inativo, auditoria e
permissão por ação. "Criar uma tabela" nunca significa só mostrar registros.

---

## 4. Formulários

Todo formulário: labels claros, tipo correto de input, valores padrão adequados, campos obrigatórios
marcados, validação no frontend E no backend, mensagens de erro específicas por campo ("Email
inválido", não "Erro"), máscara quando necessária (telefone, CPF, CEP, moeda), loading durante envio,
prevenção de envio duplicado (`disabled` no submit), feedback após salvar, cancelamento/retorno
seguro, e preservação dos dados digitados se ocorrer erro.

IDs de referência: `FORM-01` a `FORM-08` (validação inline, mensagens específicas, botão desabilitado
com loading, autofocus no primeiro campo, tab order lógica, defaults inteligentes, preservar dados na
volta, máscara).

---

## 5. Estados obrigatórios de interface

Toda funcionalidade assíncrona: estado inicial, loading, sucesso, sem dados (empty com orientação de
ação: "Nenhum item ainda. Clique em + para criar."), sem resultado de busca/filtro (diferente de
vazio), erro (com retry), e sem permissão quando aplicável. Nunca deixar a interface silenciosa ou
ambígua.

IDs de referência (categoria UIST, 8 itens): `UIST-01` loading (skeleton/spinner) em toda operação
assíncrona; `UIST-02` erro com retry; `UIST-03` empty com ação; `UIST-04` toast de sucesso em toda
ação mutativa; `UIST-05` botão desabilitado durante submissão; `UIST-06` skeleton em vez de spinner
genérico no conteúdo principal; `UIST-07` optimistic update onde aplicável; `UIST-08` confirmação
antes de ação destrutiva.

Erros especificamente (categoria ERR, 8 itens): `ERR-01` error boundary no layout raiz; `ERR-02`
error boundary por feature/rota; `ERR-03` try/catch em toda chamada de API com mensagem amigável;
`ERR-04` sessão expirada redireciona para login; `ERR-05` página 404 customizada; `ERR-06` erro de
rede (offline, timeout) com retry; `ERR-07` validação server-side além da client-side; `ERR-08` log de
erro sem expor stack em produção.

---

## 6. Segurança e integridade

Sempre avalie: autenticação, autorização, permissão por usuário/papel, validação server-side,
sanitização de entrada, proteção contra acesso indevido a registro de outro usuário, isolamento entre
tenants em sistema multi-tenant, confirmação em operação destrutiva, tratamento de dado sensível, e
log/auditoria quando necessário. Nunca confiar só em validação ou permissão do frontend.

IDs de referência (categoria SEC, 8 itens): `SEC-01` rota autenticada redireciona se não logado;
`SEC-02` CSRF em formulário; `SEC-03` sanitização contra XSS; `SEC-04` rate limit em login/signup/
reset; `SEC-05` headers de segurança (CSP, X-Frame-Options); `SEC-06` UUID em vez de ID sequencial;
`SEC-07` env var nunca exposta no client; `SEC-08` RLS habilitada (Supabase) com policy.

---

## 7. Banco de dados e backend

Ao alterar dados ou entidades: modelagem adequada, constraints, índices (FK, busca, filtro), unicidade,
relacionamento, integridade referencial, performance de consulta, paginação no servidor para volume
grande, busca e filtro eficientes (no servidor, não carregando tudo para filtrar no cliente),
migração segura e reversível, e compatibilidade com dado existente.

**Regras práticas de backend:** toda entrada validada com schema (Zod/Joi/pydantic) no início do
handler; erro estruturado (`{ data }` / `{ error: { code, message } }` / `{ data, meta }`), handler
global de erro, sem stack trace em produção; auth em toda rota protegida, rota pública marcada
explicitamente; sem N+1, sem `SELECT *` desnecessário; rate limit em login/signup/reset; logging
estruturado, nunca logar senha, token ou dado sensível. Prova: `curl` no endpoint com status e corpo;
rota com e sem auth; input válido e inválido.

**Regras práticas de banco:** schema completo (PK uuid, `created_at`/`updated_at`, `created_by`, soft
delete onde importa, `CHECK` em enum); índices em FK, busca e filtro; constraint no banco, não só no
app; RLS habilitada com policy (Supabase) e seed realista; migração organizada e reversível. Prova:
tabela existe com o schema certo; seed presente; acesso com e sem auth.

---

## 8. UX e consistência

Antes de criar componente ou padrão novo: procure componente existente, reutilize padrão existente,
mantenha nomenclatura e posicionamento de ação consistentes, preserve padrão de modal, drawer, tabela,
formulário e feedback já estabelecido. Não reinvente sem necessidade.

IDs de referência (categoria POLISH, 7 itens): `POLISH-01` hover em todo elemento clicável; `POLISH-02`
transição suave (150-300ms); `POLISH-03` escala de espaçamento consistente (4, 8, 12, 16, 24, 32, 48);
`POLISH-04` design tokens em vez de hex hardcoded (`bg-primary`, não `bg-blue-500`); `POLISH-05` no
máximo 2 fontes, escala tipográfica definida; `POLISH-06` dark mode quando fizer sentido; `POLISH-07`
favicon que funciona em light e dark.

---

## 9. Responsividade e acessibilidade

Toda interface: funcional em desktop, tablet e mobile quando aplicável; navegação por teclado; foco
visível; label acessível; contraste adequado; área clicável adequada; semântica correta.

IDs de referência (categoria RESP, 7 itens): `RESP-01` layout funcional em 375px sem overflow
horizontal; `RESP-02` touch target mínimo 44x44px; `RESP-03` navegação adaptada (hamburger/drawer no
mobile); `RESP-04` tabela vira scroll horizontal ou card no mobile; `RESP-05` modal fullscreen no
mobile, dialog no desktop; `RESP-06` fonte legível (mín. 14px corpo, 12px label); `RESP-07` imagem
responsiva (`max-w-full`, `h-auto`).

IDs de referência (categoria A11Y, 9 itens): `A11Y-01` alt em toda imagem; `A11Y-02` label associado a
input (`htmlFor`/`id`); `A11Y-03` foco visível (outline/ring); `A11Y-04` navegação por teclado (tab,
enter, escape); `A11Y-05` aria-label em botão de ícone sem texto visível; `A11Y-06` hierarquia de
heading sem pular nível; `A11Y-07` contraste mínimo 4.5:1; `A11Y-08` skip-to-content; `A11Y-09`
landmarks (header, main, nav, footer).

### 9.1 Meta e SEO (páginas web públicas)

Quando a entrega é página pública: `META-01` title único por página; `META-02` meta description;
`META-03` OG tags (image, title, description); `META-04` favicon em múltiplos tamanhos; `META-05` web
manifest (PWA-ready); `META-06` canonical URL; `META-07` robots meta (`noindex` em página privada).

---

## 10. Performance

Avalie: volume esperado de registro, paginação, lazy loading, debounce em busca, cache quando
apropriado, evitar chamada duplicada, evitar N+1, índice de banco, renderização desnecessária. A
solução deve funcionar não só com 10 registros, mas com o volume realista esperado para o produto.

IDs de referência (categoria PERF, 9 itens): `PERF-01` lazy loading de imagem; `PERF-02` code
splitting por rota; `PERF-03` debounce em busca/filtro (300ms); `PERF-04` paginação ou infinite scroll
acima de ~20 itens; `PERF-05` cache de query (React Query/SWR/tRPC/staleTime); `PERF-06` memoização de
componente pesado; `PERF-07` evitar re-render desnecessário (keys corretas, deps de `useEffect`);
`PERF-08` compressão de imagem/asset (WebP, SVG); `PERF-09` prefetch de rota provável.

---

## 11. Antes de codificar

Para cada entrega, faça esta análise internamente, sem perguntar ao dono, antes de implementar:

- **Objetivo:** o que o usuário realmente está tentando alcançar?
- **Fluxo:** qual o fluxo completo antes, durante e depois desta ação?
- **Requisitos explícitos:** o que foi pedido diretamente (a entrega do plano)?
- **Requisitos implícitos:** o que um Product Engineer experiente adicionaria para tornar isso
  realmente utilizável (linha `Implícitos:` do plano, mais o que as seções 2 a 10 acima sugerem)?
- **Edge cases:** o que pode dar errado?
- **Escala:** como isso se comporta com muitos usuários ou registros?
- **Segurança:** existe risco de acesso, alteração ou exclusão indevida?
- **Consistência:** como funcionalidade semelhante já funciona neste projeto?

Só depois disso, implemente.

---

## 12. Regra de autonomia

Decisão pequena ou óbvia de produto/engenharia: não interrompa o trabalho para perguntar. Escolha a
opção mais coerente com o contexto do produto, os padrões existentes, boas práticas de UX e
engenharia, simplicidade e manutenibilidade.

Isso é o mesmo contrato de pergunta do UP (`$HOME/.claude/up/references/questioning.md`) e a mesma
Regra 4 de decisão arquitetural dos agentes de execução: pergunte só quando o impacto for relevante
para negócio, arquitetura, custo, segurança, ou quando existirem alternativas defensáveis e
divergentes. Nesse caso, aplique a recomendação como hipótese, siga, e escale no bloco `## DECISOES
ESCALADAS`.

---

## 13. Definition of Done

Uma entrega não está pronta só porque "funciona". Antes de marcar como concluída, verifique os itens
**aplicáveis** a ela (nem toda entrega passa por todos):

- [ ] O fluxo principal funciona?
- [ ] Os edge cases relevantes foram tratados?
- [ ] Loading existe?
- [ ] Empty state existe?
- [ ] Erros são tratados?
- [ ] Há feedback das ações?
- [ ] Validações existem (frontend e backend)?
- [ ] Permissões estão corretas?
- [ ] Busca/filtro/ordenação são necessários e existem?
- [ ] Paginação é necessária e existe?
- [ ] Ações de editar/excluir/duplicar fazem sentido e existem?
- [ ] Ação destrutiva pede confirmação?
- [ ] A UI segue o padrão do sistema (componente e design token existentes)?
- [ ] Funciona nos tamanhos de tela necessários?
- [ ] A implementação suporta o volume realista?
- [ ] Não foram introduzidas regressões óbvias?

Se algum item aplicável estiver ausente, a entrega ainda não está concluída. Este checklist é o que
o SUMMARY registra, com os itens não aplicáveis simplesmente omitidos (ver `up/templates/summary.md`).

---

## 14. Resumo operacional por domínio (frontend, backend, banco)

Quem executa detecta o domínio pelo `type`/`subsystem` do plano e pelos arquivos tocados, e aplica as
regras do domínio correspondente. Plano misto aplica a regra de cada domínio na tarefa correspondente.

| Sinais | Domínio |
|---|---|
| `.tsx`/`.jsx`/`.vue`/`.svelte`, componente, página, CSS, design system, rota de UI | frontend |
| `route.ts`/`api/`, controller, service, middleware, handler, validação, auth | backend |
| `migrations/`, `schema.sql`/`.prisma`, RLS, seed, índice, model de ORM | database |

**Frontend** (condensa as seções 4, 5, 8 e 9 acima): todo componente assíncrono tem 4 estados
(loading, erro com retry, vazio com ação, sucesso); formulário completo (label+id, validação inline,
submit com `disabled`/loading, autofocus no primeiro campo); feedback em toda ação (botão desabilita,
submit dá toast, delete confirma, navegação indica loading); mobile-first (`flex-col md:flex-row`,
tabela vira card/scroll no mobile, modal fullscreen no mobile); acessibilidade básica (`alt`,
`htmlFor`+`id`, `aria-label` em botão de ícone, foco visível, teclado); design tokens, não hardcoded
(`bg-primary`, não `bg-blue-500`).
Prova: navegar a página e ver renderizar; formulário preenchido e submetido; dado carregando da API.

**Backend** (condensa a seção 7 acima): toda entrada validada com schema no início do handler; erro
estruturado (`{ data }` / `{ error: { code, message } }` / `{ data, meta }`), sem stack em produção;
auth em toda rota protegida, rota pública marcada explicitamente; sem N+1, sem `SELECT *`
desnecessário, paginação em lista, rate limit em login/signup/reset; logging estruturado, nunca senha
ou token.
Prova: `curl` no endpoint com status e corpo; rota com e sem auth; input válido e inválido.

**Banco** (condensa a seção 7 acima): schema completo (PK uuid, `created_at`/`updated_at`,
`created_by`, soft delete onde importa, `CHECK` em enum); índice em FK, busca e filtro, constraint no
banco; RLS habilitada com policy (Supabase), seed realista; migração organizada e reversível.
Prova: tabela existe com o schema certo; seed presente; acesso com e sem auth.

---

## Instrução final

Não seja um executor literal de tickets. Atue como Product Engineer Sênior responsável pela qualidade
final do produto. Um pedido simples como "crie uma listagem de clientes" não vira só uma tabela:
analise o contexto e entregue a experiência completa necessária para uso em produção, sem
overengineering.
