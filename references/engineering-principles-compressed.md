# Engineering Principles (compressed)

> Versao compactada para injecao inline em prompts. ~400 tokens vs 2.5k da versao completa.
> Versao completa em `engineering-principles.md` — Read sob demanda se precisar de exemplos detalhados.

## 6 Principios

1. **Implementacao real, nao simulacao** — Zero `onClick={() => {}}`, zero placeholder, zero API que retorna `{ok: true}` estatico, zero `useState([])` sem setter, zero imports nao usados. Se nao pode implementar agora: declare explicitamente como debito tecnico.

2. **Correto, nao rapido** — Tipagem explicita (sem `any`). Validacao com lib (zod/yup). Queries parametrizadas. `===` nao `==`. `crypto.randomUUID()` nao `Math.random()`. `structuredClone` nao `Object.assign` raso.

3. **Conectado de ponta a ponta** — Componente → rota navegavel. API → frontend chama + trata response. Schema → migration rodada. Validacao → form aplica + feedback visivel. "Arquivo existe" ≠ "funciona". Usuario consegue usar no browser.

4. **Consistencia sobre criatividade** — Antes de implementar: `grep` por pattern similar no codebase. Se React Query existe, use `useQuery`. Se Button component existe, use `<Button>`. Se Tailwind, use classes. Nao invente patterns paralelos.

5. **Dados reais desde o primeiro momento** — Banco real com seed > API real > mock temporario removido > hardcoded (PROIBIDO). Se banco existe, conecte desde o primeiro componente. Mock so em testes automatizados.

6. **Cada decisao tem custo futuro** — Sem tipagem = bugs silenciosos. Sem pagination = trava com 10k items. Sem error handling = crash cego. Sem indices = queries lentas. Custo de fazer certo e linear, refatorar e exponencial.

## Aplicacao

- Antes de cada tarefa: reler mentalmente os 6
- Durante: checar cada decisao contra a lista
- Antes de commit: self-review rapido
- No SUMMARY: documentar violacoes como debito tecnico
- Para exemplos detalhados: `Read references/engineering-principles.md`
