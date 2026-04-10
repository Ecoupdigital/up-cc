# Engineering Principles

Principios que governam TODA decisao de implementacao no UP.
Carregado por todos os agentes executores (up-executor, up-frontend-specialist, up-backend-specialist, up-database-specialist).

Estes principios existem porque IAs tendem a escolher o caminho mais facil, nao o melhor. Cada principio combate um vicio especifico.

---

## Principio 1: Implementacao real, nao simulacao

NUNCA entregue codigo que PARECE funcionar mas nao funciona de verdade.

**Violacoes comuns (PROIBIDO):**

```typescript
// ❌ Handler vazio
onClick={() => {}}

// ❌ Componente placeholder
function UserList() {
  return <div>User List</div>
}

// ❌ API que retorna estatico
export async function GET() {
  return Response.json({ ok: true })
}

// ❌ Form que nao envia
onSubmit={(e) => e.preventDefault()}

// ❌ Estado que nunca popula
const [users, setUsers] = useState([])
// ... nunca chama setUsers com dados reais

// ❌ Import decorativo
import { analytics } from './analytics'
// ... nunca chama analytics

// ❌ Fetch sem uso
const data = await fetch('/api/users')
// ... nunca usa data
```

**O que fazer quando nao pode implementar agora:**

Se falta API externa, credencial ou dependencia:
1. NAO finja que funciona
2. Declare explicitamente no SUMMARY como "nao implementado — motivo: X"
3. Deixe o codigo com erro CLARO, nao silencio enganoso:

```typescript
// ✅ Correto: explicitamente nao implementado
function exportCSV() {
  throw new Error('Export CSV nao implementado — aguardando endpoint /api/export')
}
```

---

## Principio 2: A implementacao correta, nao a mais rapida

Quando existem duas abordagens — a rapida que funciona superficialmente e a correta que trata todos os cenarios — SEMPRE escolha a correta.

| Situacao | ❌ Atalho | ✅ Correto |
|----------|----------|-----------|
| Validar email | `.includes('@')` | Regex ou library (zod, yup) |
| Tipagem | `any` para compilar | Interface/type definido |
| Catch erro | `catch(e) {}` vazio | `catch(e) { toast.error(e.message) }` |
| Query SQL | `WHERE id = ${id}` | `WHERE id = $1`, [id] |
| Acesso array | `data[0]` direto | `data?.length ? data[0] : null` |
| Checar null | `if (data)` generico | `if (data !== null && data !== undefined)` |
| Comparacao | `==` | `===` |
| Copiar objeto | `Object.assign` raso | `structuredClone` ou spread profundo |
| Lidar com datas | String manipulation | Library (date-fns, dayjs) |
| Gerar ID | `Math.random()` | `crypto.randomUUID()` |

**Teste mental:** "Se um dev senior revisasse esse codigo, ele aceitaria ou pediria mudanca?"
Se pediria mudanca → faca a versao correta agora.

---

## Principio 3: Conectado de ponta a ponta

Codigo NAO esta "pronto" ate que esteja WIRED — conectado e funcionando do ponto de vista do usuario final.

**Checklist de wiring:**

| Criado | Conectado a | Verificacao |
|--------|-------------|-------------|
| Componente | Layout/pagina + rota navegavel | Acessar URL, componente renderiza |
| API endpoint | Frontend chama + response tratado | curl funciona + UI mostra dados |
| Schema/migration | Migration rodada + queries usando | Dados persistem e retornam |
| Validacao | Aplicada no form + feedback visivel | Submeter invalido, ver mensagem |
| Estado (store) | Mutations conectadas + UI reflete | Mutar, UI atualiza |
| Auth guard | Rota protegida + redirect se nao logado | Acessar sem login, redireciona |
| Event handler | Botao/elemento + acao executa | Clicar, algo acontece |

**"O arquivo existe" ≠ "funciona".**
**"Funciona" = usuario final consegue usar no browser.**

Apos CADA tarefa, verificar wiring:
- Backend: `curl` o endpoint, verificar response
- Frontend: navegar a pagina, verificar que renderiza e responde
- Integracao: frontend chama backend, dados fluem

---

## Principio 4: Consistencia sobre criatividade

NAO invente patterns novos quando o projeto ja tem um pattern estabelecido.

**Antes de implementar qualquer coisa:**

```bash
# 1. Buscar implementacao similar no codebase
grep -r "similar_pattern" src/ --include="*.ts" --include="*.tsx"

# 2. Se existe: SEGUIR o mesmo pattern
# 3. Se nao existe: estabelecer pattern e ser consistente daqui pra frente
```

**Exemplos:**

| Projeto usa | ❌ NAO faca | ✅ Faca |
|-------------|-----------|--------|
| React Query | `fetch` manual com useState | `useQuery`/`useMutation` |
| Componente Button | `<button className="...">` raw | `<Button variant="primary">` |
| Tailwind | `style={{ color: 'blue' }}` | `className="text-blue-500"` |
| Zod validation | `if (!email.includes('@'))` manual | `z.string().email()` |
| Toast via Sonner | `alert('Sucesso')` | `toast.success('Sucesso')` |
| tRPC | REST fetch manual | `trpc.resource.query()` |
| Supabase client | `fetch('/api/...')` wrapper | `supabase.from('...').select()` |

**Regra geral:** Se o codebase ja resolveu esse problema, use a mesma solucao.

---

## Principio 5: Dados reais desde o primeiro momento

NAO use mock data como solucao permanente.

**Ordem de preferencia:**
1. Banco de dados real com seed data → IDEAL
2. API real com dados de teste → BOM
3. Mock temporario removido antes do commit → ACEITAVEL
4. Hardcoded no componente como solucao final → PROIBIDO

**Se o banco existe:** Conecte desde o primeiro componente.
**Se precisa seed:** Crie migration/seed file, NAO hardcode:

```typescript
// ❌ PROIBIDO: dados fake no componente
const transactions = [
  { id: 1, amount: 100, description: 'Test' },
  { id: 2, amount: 200, description: 'Test 2' },
]

// ✅ CORRETO: buscar do banco
const { data: transactions } = useQuery({
  queryKey: ['transactions'],
  queryFn: () => supabase.from('transactions').select('*')
})

// ✅ E criar seed separado:
// supabase/seed.sql ou prisma/seed.ts
```

**Mock aceitavel APENAS em:**
- Testes automatizados (vi.mock, jest.mock)
- Desenvolvimento temporario (removido antes do commit)
- API externa indisponivel (documentar explicitamente)

---

## Principio 6: Cada decisao tem custo futuro

Antes de escolher a abordagem facil, pergunte: **"Se o projeto crescer 10x, essa decisao vai causar retrabalho?"**

| Atalho agora | Custo futuro |
|-------------|-------------|
| Tudo num arquivo so | Refatorar quando ficar ilegivel |
| Sem tipagem | Bugs silenciosos, refatorar depois |
| Sem validacao | Dados lixo no banco, limpar depois |
| Sem pagination | App trava com 10k items |
| Sem error handling | Crash em producao, debug cego |
| Sem indices no banco | Queries lentas com volume |
| Sem loading states | UX ruim, usuario acha que travou |
| CSS inline/hardcoded | Inconsistencia visual, refatorar tema |
| Sem env vars | Credenciais expostas, security breach |
| Sem testes | Medo de mudar codigo, regressoes |

**Se a resposta for "sim, vai causar retrabalho":** faca certo agora. O custo de fazer certo e linear. O custo de refatorar depois e exponencial.

---

## Como aplicar durante execucao

1. **Antes de cada tarefa:** Reler os principios mentalmente
2. **Durante implementacao:** A cada decisao, checar se viola algum principio
3. **Antes de commitar:** Self-review rapido contra os 6 principios
4. **No SUMMARY:** Documentar decisoes onde o principio influenciou a escolha

**Se violar um principio para cumprir deadline:** Documentar como debito tecnico no SUMMARY, NAO fingir que esta correto.
