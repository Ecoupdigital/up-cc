# TDD por Tipo: Evidência Exigida pelo Gate

Referência operacional carregada sob demanda pelo `up-verificador` e citada pelas skills
`up-tdd` e `up-verificar-antes-de-concluir`. Define os 3 tipos de evidência, a prova
exigida de cada um e o formato do campo `evidence=` no `approvals.log`.

A Lei de Ferro do UP nao é "TDD-unit sempre". É "evidência fresca do TIPO CERTO antes de
afirmar pronto". TDD-unit red-green é UMA das três provas. O tipo de código decide qual prova
o gate de fase aceita. Sem a evidência do tipo certo, o veredito do revisor NAO pode ser APPROVE.

---

## Os 3 tipos e a prova de cada

| Tipo | Natureza do código | Prova exigida (evidência) | `evidence=` |
|------|--------------------|---------------------------|-------------|
| **logic** | lógica pura, parser, cálculo, algoritmo, API própria, bugfix | teste red-green VISTO falhar antes de passar | `evidence=logic:test_pass` |
| **ui** | componente visual, CSS, layout, estilo, página | captura visual ANTES e DEPOIS (Playwright / `up-tester`) | `evidence=ui:visual` |
| **glue** | integração externa (Asaas, uazapi, Supabase, Shopify, webhook, OAuth, payment) | smoke-test: UMA chamada real (ou sandbox) com resposta esperada | `evidence=glue:smoke` |

### logic -> teste red-green visto falhar
A prova NAO é "tem teste". É ter visto o teste FALHAR antes do código existir e PASSAR depois.
Teste que passa de primeira nao prova nada (pode estar testando o nada). Para bugfix: o teste
reproduz o bug (falha antes do fix), passa depois, e ao reverter o fix volta a falhar (regressão).
Resultado aceito: saída do runner com 0 falhas no comportamento-alvo, depois de tê-lo visto vermelho.

### ui -> captura visual antes/depois
NAO é red-green com mock. "O CSS parece certo" nao prova nada. A prova é o par de screenshots
(antes e depois) da mudança, via Playwright ou `up-tester`. Sem o par antes/depois, o gate nao passa.
Resultado aceito: existem as duas capturas e a diferença bate com a mudança pretendida.

### glue -> smoke-test
Nao dá pra red-green de verdade contra dependência externa. "O endpoint existe" nao prova integração.
A prova é UMA chamada real (ou contra sandbox/staging) confirmando a resposta esperada.
Resultado aceito: a chamada retornou o status/payload esperado nesta sessão.

---

## Como determinar o tipo (heurística)

O tipo sai do `classify-task` (`frontmatter_type` + `reasons`) do `up-tools.cjs`, com fallback
pela natureza da mudança quando nao há plano formal:

1. **glue** se: `frontmatter_type=integration`, ou `reasons` contém `external_integration` /
   `payment`, ou o código toca Asaas / uazapi / Supabase / Shopify / webhook / OAuth / API de terceiro.
2. **ui** se (e nao for glue): `frontmatter_type=frontend`, ou a mudança toca componente /
   `.css` / `.tsx` de view / layout / estilo, sem lógica de negócio testável isolada.
3. **logic** caso contrário (default): `frontmatter_type` backend / database / refactor / docs-com-código,
   ou parser / cálculo / algoritmo / API-própria / bugfix. Lógica pura sempre cai aqui.

Uma fase pode misturar tipos (ex: filtro de data = lógica do filtro `logic` + render `ui`).
Nesse caso exija a evidência de CADA tipo presente e registre uma linha `evidence=` por tipo.

---

## Formato no approvals.log (formato estendido, Fase 3)

O gate de fase só APROVA com uma entrada `up-revisor` que carregue o campo `evidence=` do tipo certo.
Formato da linha (uma por veredito; o `evidence=` vai na MESMA linha):

```
<timestamp ISO> | phase-N | up-revisor | <DECISAO> | <motivo> | evidence=<tipo>:<resultado>
```

- `<tipo>` ∈ `{logic, ui, glue}`
- `<resultado>` ∈ `{test_pass, visual, smoke}` (test_pass casa com logic, visual com ui, smoke com glue)
- `<DECISAO>` ∈ `{APPROVE, REQUEST_CHANGES, BLOCK}`

Múltiplos tipos na mesma fase -> várias linhas, uma por tipo:

```
2026-05-30T14:00:00Z | phase-3 | up-revisor | APPROVE | filtro ok | evidence=logic:test_pass
2026-05-30T14:00:01Z | phase-3 | up-revisor | APPROVE | render ok | evidence=ui:visual
```

Regra dura do gate: existe entrada `phase-N` do `up-revisor` COM `evidence=` preenchido e o
`<resultado>` corresponde ao `<tipo>`. Sem isso (campo ausente ou tipo errado), trate como
evidência faltando e NAO aprove a fase: volte e produza a prova do tipo certo.

Exceções (só com permissão explícita do dono): protótipo descartável, código gerado, arquivo de config.
Nesses casos registre `evidence=<tipo>:exempted` com o motivo no `<motivo>`.
