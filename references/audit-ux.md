<overview>
Referencia de heuristicas de UX para analise estatica de codigo. Este documento traduz as heuristicas de usabilidade de Nielsen em sinais detectaveis via analise de arquivos de codigo (CSS, SCSS, componentes TSX/JSX/Vue/Svelte, HTML, templates).

**Abordagem:** O agente auditor de UX NAO tem acesso visual a interface renderizada. Ele le arquivos fonte e detecta padroes que indicam problemas de usabilidade com alta probabilidade. Cada heuristica neste catalogo foi traduzida para um sinal de codigo verificavel via grep, analise de AST simplificada, ou heuristica de leitura de arquivo.

**Limitacoes importantes:**
- Analise estatica de UX e inerentemente imprecisa -- sinais de codigo sao proxies, nao provas definitivas
- False positives sao esperados; o campo "Limitacao" de cada heuristica documenta cenarios conhecidos
- Este reference complementa (nao substitui) testes com usuarios reais
- Heuristicas puramente visuais (harmonia de cores, equilibrio de layout, estetica subjetiva) estao excluidas por serem indetectaveis via codigo

**Como o agente usa este reference:**
1. Detecta a stack do projeto (secao `stack_detection`)
2. Ajusta sinais de deteccao conforme framework identificado
3. Percorre cada categoria aplicando as heuristicas relevantes
4. Produz sugestoes no formato do template `suggestion.md` com Dimensao = "UX"
</overview>

<stack_detection>
## Deteccao de Stack

Antes de aplicar heuristicas, o agente deve detectar a stack do projeto para ajustar sinais de deteccao. A ordem de deteccao e: CSS framework, component framework, UI library, form library.

### CSS Framework

| Framework | Sinal de deteccao | Ajuste nas heuristicas |
|-----------|-------------------|----------------------|
| Tailwind CSS | `tailwind.config.js/ts` na raiz, ou `@tailwind` em CSS, ou classes `sm:`, `md:`, `lg:` em componentes | Responsividade: procurar classes `sm:`, `md:`, `lg:` em vez de `@media`. Consistencia: procurar `bg-[#xxx]` e `text-[#xxx]` (cores arbitrarias) em vez de `color: #xxx`. Espacamento: verificar mistura inconsistente de classes de spacing |
| Bootstrap | `bootstrap` em package.json, ou `import 'bootstrap'`, ou classes `col-`, `row`, `container` | Responsividade: procurar grid classes (`col-sm-`, `col-md-`). Consistencia: verificar se usa variaveis Bootstrap (`--bs-*`) vs valores hardcoded |
| CSS Modules | Arquivos `*.module.css` ou `*.module.scss` | Consistencia: escopo local reduz problemas globais, focar em valores hardcoded dentro dos modulos |
| Styled Components | `import styled from 'styled-components'` ou `import { css } from 'styled-components'` | Consistencia: verificar se usa theme provider vs valores hardcoded nos templates |
| CSS puro | Nenhum dos acima detectado, arquivos `.css` ou `.scss` presentes | Aplicar todas as heuristicas CSS padrao (media queries, variaveis CSS, etc.) |

### Component Framework

| Framework | Sinal de deteccao | Ajuste nas heuristicas |
|-----------|-------------------|----------------------|
| React | Arquivos `.tsx` ou `.jsx`, ou `react` em package.json | Formularios: procurar `onChange`, `onSubmit`, `useState`. Feedback: procurar `useState` para loading/error states. Erros: procurar `ErrorBoundary` |
| Vue | Arquivos `.vue`, ou `vue` em package.json | Formularios: procurar `v-model`, `@submit`. Feedback: procurar `ref()` ou `reactive()` para loading states. Estrutura: verificar `<template>`, `<script>`, `<style>` |
| Svelte | Arquivos `.svelte`, ou `svelte` em package.json | Formularios: procurar `bind:value`, `on:submit`. Feedback: procurar `{#if loading}` patterns |
| Next.js | `next` em package.json, pasta `app/` ou `pages/` | Navegacao: verificar `not-found.tsx`, `error.tsx`, `loading.tsx`. Metadata: verificar `metadata` export ou `<Head>` |
| Vanilla HTML | Arquivos `.html` sem framework detectado | Aplicar heuristicas HTML puro (labels, form validation attributes, semantic HTML) |

### UI Library

| Library | Sinal de deteccao | Ajuste nas heuristicas |
|---------|-------------------|----------------------|
| shadcn/ui | `@/components/ui/` imports, ou `components.json` com `"style"` | Feedback: Toast, Alert, Dialog ja disponiveis -- verificar se sao usados apos acoes. Formularios: Form components disponiveis -- verificar uso |
| Radix UI | `@radix-ui/` em package.json ou imports | Feedback: Dialog, Toast primitives disponiveis. Acessibilidade: Radix e acessivel por padrao, focar em uso correto |
| Material UI | `@mui/material` em package.json | Feedback: Snackbar, Alert, Dialog disponiveis. Consistencia: verificar se usa theme vs estilos inline |
| Ant Design | `antd` em package.json | Feedback: message, notification, Modal disponiveis. Formularios: Form component com validacao integrada |
| Chakra UI | `@chakra-ui/react` em package.json | Feedback: useToast, Alert disponiveis. Consistencia: verificar se usa theme tokens |
| Nenhuma | Nenhuma UI library detectada | Verificar implementacao manual de feedback (alert, modal customizado). Maior probabilidade de problemas de consistencia |

### Form Library

| Library | Sinal de deteccao | Ajuste nas heuristicas |
|---------|-------------------|----------------------|
| React Hook Form | `react-hook-form` em package.json ou `useForm` import | Formularios: validacao integrada, verificar se `errors` object e exibido ao usuario |
| Formik | `formik` em package.json ou `useFormik`/`<Formik>` | Formularios: validacao integrada, verificar se `errors`/`touched` sao usados no JSX |
| Zod + form | `zod` em package.json com form library | Formularios: schema validation presente, verificar se erros do schema sao exibidos |
| VeeValidate | `vee-validate` em package.json (Vue) | Formularios: validacao integrada para Vue |
| Nenhuma | Nenhuma form library detectada | Maior probabilidade de formularios sem validacao client-side, verificar validacao manual |

</stack_detection>

<category name="feedback-status">
## Feedback e Visibilidade do Status

Heuristicas relacionadas a Heuristica #1 de Nielsen: "Visibilidade do status do sistema". O sistema deve manter o usuario informado sobre o que esta acontecendo por meio de feedback apropriado em tempo razoavel.

Em analise estatica, detectamos a ausencia de feedback verificando se handlers de acoes e operacoes assincronas incluem gerenciamento de estados visuais (loading, sucesso, erro).

### LOADING-SUBMIT

**Heuristica de Nielsen:** #1 - Visibilidade do status do sistema
**Frameworks:** React, Vue, Svelte
**Impacto tipico:** M
**Sinal de deteccao:**
```bash
# Procurar handlers de submit sem estado de loading
# Em React: onSubmit handler que nao referencia isLoading/isPending/isSubmitting
grep -rn "onSubmit" src/ --include="*.tsx" --include="*.jsx"
# Verificar se o mesmo componente tem useState com loading/pending/submitting
# Se handler existe mas nao ha estado de loading no componente -> problema
```

**Problema em codigo:**
```tsx
// Usuario clica "Salvar" e nao sabe se a acao esta sendo processada
function handleSubmit(data: FormData) {
  await api.saveProfile(data); // Nenhum feedback visual durante a espera
}

return <button onClick={handleSubmit}>Salvar</button>;
```

**Solucao:**
```tsx
// Usuario ve indicacao de que a acao esta sendo processada
const [isLoading, setIsLoading] = useState(false);

async function handleSubmit(data: FormData) {
  setIsLoading(true);
  try {
    await api.saveProfile(data);
    toast.success("Perfil salvo com sucesso");
  } finally {
    setIsLoading(false);
  }
}

return <button onClick={handleSubmit} disabled={isLoading}>
  {isLoading ? "Salvando..." : "Salvar"}
</button>;
```

**Limitacao:** Componentes que usam libraries como React Query/SWR gerenciam loading automaticamente via hooks (useMutation). Verificar se o componente importa essas libraries antes de reportar.

---

### LOADING-FETCH

**Heuristica de Nielsen:** #1 - Visibilidade do status do sistema
**Frameworks:** React, Vue, Svelte
**Impacto tipico:** M
**Sinal de deteccao:**
```bash
# Procurar useEffect com fetch/axios sem estado de loading
grep -rn "useEffect" src/ --include="*.tsx" --include="*.jsx"
# No mesmo componente, verificar se existe useState para loading
# Alternativamente: procurar fetch/axios.get sem isLoading associado
grep -rn "fetch\|axios\.get\|axios\.post" src/ --include="*.tsx" --include="*.jsx"
```

**Problema em codigo:**
```tsx
// Pagina fica em branco enquanto dados carregam -- usuario nao sabe se esta funcionando
const [users, setUsers] = useState([]);

useEffect(() => {
  fetch("/api/users").then(r => r.json()).then(setUsers);
}, []);

return <UserList users={users} />;
```

**Solucao:**
```tsx
// Usuario ve skeleton/spinner enquanto dados carregam
const [users, setUsers] = useState([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  fetch("/api/users")
    .then(r => r.json())
    .then(setUsers)
    .finally(() => setIsLoading(false));
}, []);

if (isLoading) return <UserListSkeleton />;
return <UserList users={users} />;
```

**Limitacao:** Componentes usando React Query (`useQuery`), SWR (`useSWR`), ou Next.js `loading.tsx` gerenciam loading automaticamente. Verificar imports antes de reportar.

---

### DESTRUTIVA-SEM-CONFIRMACAO

**Heuristica de Nielsen:** #1 - Visibilidade do status do sistema / #5 - Prevencao de erros
**Frameworks:** All
**Impacto tipico:** G
**Sinal de deteccao:**
```bash
# Procurar handlers de delete/remove sem dialog/confirm/modal
grep -rn "delete\|remove\|destroy\|reset" src/ --include="*.tsx" --include="*.jsx" --include="*.vue" --include="*.svelte"
# No mesmo componente ou handler, verificar se existe confirm(), Dialog, Modal, AlertDialog
# Se handler de delecao existe sem confirmacao -> problema
```

**Problema em codigo:**
```tsx
// Clicar "Excluir" remove o item imediatamente sem confirmacao
function handleDelete(id: string) {
  await api.deleteProject(id);
  router.refresh();
}

return <button onClick={() => handleDelete(project.id)}>Excluir</button>;
```

**Solucao:**
```tsx
// Usuario confirma antes de acao irreversivel
const [showConfirm, setShowConfirm] = useState(false);

return (
  <>
    <button onClick={() => setShowConfirm(true)}>Excluir</button>
    <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
      <AlertDialogContent>
        <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
        <AlertDialogDescription>
          Esta acao nao pode ser desfeita.
        </AlertDialogDescription>
        <AlertDialogAction onClick={() => api.deleteProject(project.id)}>
          Confirmar exclusao
        </AlertDialogAction>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
      </AlertDialogContent>
    </AlertDialog>
  </>
);
```

**Limitacao:** Nem toda acao "delete" e destrutiva para o usuario (ex: remover item de carrinho de compras e reversivel). Avaliar contexto do handler. Soft deletes com undo sao alternativa valida.

---

### SUCESSO-SEM-FEEDBACK

**Heuristica de Nielsen:** #1 - Visibilidade do status do sistema
**Frameworks:** All
**Impacto tipico:** M
**Sinal de deteccao:**
```bash
# Procurar handlers de API (POST/PUT/PATCH) que nao mostram feedback de sucesso
grep -rn "\.post\|\.put\|\.patch\|fetch.*POST\|fetch.*PUT" src/ --include="*.tsx" --include="*.jsx"
# No mesmo handler, verificar se existe toast/alert/message/notification apos chamada
# Se chamada API de mutacao existe sem feedback de sucesso ao usuario -> problema
```

**Problema em codigo:**
```tsx
// Usuario salva configuracoes mas nao recebe confirmacao de que funcionou
async function handleSave(settings: Settings) {
  await api.updateSettings(settings);
  // Nenhum feedback -- usuario fica na duvida se salvou
}
```

**Solucao:**
```tsx
// Usuario recebe confirmacao visual de sucesso
async function handleSave(settings: Settings) {
  await api.updateSettings(settings);
  toast.success("Configuracoes salvas com sucesso");
}
```

**Limitacao:** Algumas acoes nao precisam de feedback explicito (ex: auto-save que mostra indicador sutil). Verificar se o componente tem algum mecanismo de feedback mesmo que nao seja toast (ex: icone de check, texto "Salvo").

---

### EMPTY-STATE

**Heuristica de Nielsen:** #1 - Visibilidade do status do sistema
**Frameworks:** React, Vue, Svelte
**Impacto tipico:** M
**Sinal de deteccao:**
```bash
# Procurar listas renderizadas com .map() sem condicional para array vazio
grep -rn "\.map(" src/ --include="*.tsx" --include="*.jsx"
# Verificar se antes do .map() existe check para length === 0 ou array vazio
# Se .map() direto sem empty state check -> problema
grep -rn "\.length === 0\|\.length == 0\|!.*\.length" src/ --include="*.tsx" --include="*.jsx"
```

**Problema em codigo:**
```tsx
// Lista vazia mostra area em branco -- usuario nao sabe se e bug ou nao tem dados
return (
  <div>
    <h2>Seus Projetos</h2>
    {projects.map(p => <ProjectCard key={p.id} project={p} />)}
  </div>
);
```

**Solucao:**
```tsx
// Lista vazia mostra mensagem contextual com acao
return (
  <div>
    <h2>Seus Projetos</h2>
    {projects.length === 0 ? (
      <EmptyState
        title="Nenhum projeto ainda"
        description="Crie seu primeiro projeto para comecar"
        action={<Button onClick={onCreateProject}>Criar projeto</Button>}
      />
    ) : (
      projects.map(p => <ProjectCard key={p.id} project={p} />)
    )}
  </div>
);
```

**Limitacao:** Componentes que recebem dados ja filtrados pelo pai podem ter empty state no componente pai. Verificar hierarquia de componentes antes de reportar.

---

### SKELETON-AUSENTE

**Heuristica de Nielsen:** #1 - Visibilidade do status do sistema
**Frameworks:** React, Vue, Svelte
**Impacto tipico:** P
**Sinal de deteccao:**
```bash
# Procurar condicionais de loading que mostram apenas texto simples
grep -rn "loading.*?.*Carregando\|loading.*?.*Loading\|isLoading.*?.*\.\.\." src/ --include="*.tsx" --include="*.jsx"
# Se loading state existe mas feedback e apenas texto ("Carregando...") sem skeleton/spinner -> problema
# Verificar se componente importa Skeleton, Spinner, ou tem CSS de shimmer
```

**Problema em codigo:**
```tsx
// Texto "Carregando..." causa layout shift quando dados chegam
if (isLoading) return <p>Carregando...</p>;
return <ComplexDashboard data={data} />;
```

**Solucao:**
```tsx
// Skeleton preserva layout e da impressao de velocidade
if (isLoading) return <DashboardSkeleton />;
return <ComplexDashboard data={data} />;
```

**Limitacao:** Para areas pequenas ou acoes rapidas (<200ms tipicamente), texto simples ou spinner e aceitavel. Skeletons sao mais importantes para conteudo principal da pagina e listas longas.

</category>

<category name="consistencia">
## Consistencia e Padroes Visuais

Heuristicas relacionadas a Heuristica #4 de Nielsen: "Consistencia e padroes". Usuarios nao devem ter que se perguntar se diferentes palavras, situacoes ou acoes significam a mesma coisa. Seguir convencoes da plataforma.

Em analise estatica, detectamos inconsistencia verificando uso de valores hardcoded em vez de tokens de design, e variacao sem padrao em propriedades visuais entre componentes.

### CORES-HARDCODED

**Heuristica de Nielsen:** #4 - Consistencia e padroes
**Frameworks:** All
**Impacto tipico:** M
**Sinal de deteccao:**
```bash
# CSS puro: procurar cores hex/rgb repetidas em multiplos arquivos
grep -rn "color:\s*#\|background:\s*#\|background-color:\s*#\|border.*:\s*#" src/ --include="*.css" --include="*.scss"
# Tailwind: procurar cores arbitrarias (brackets) repetidas
grep -rn "bg-\[#\|text-\[#\|border-\[#" src/ --include="*.tsx" --include="*.jsx" --include="*.vue"
# Se mesma cor hex aparece em 3+ arquivos sem ser variavel CSS / token -> problema
```

**Problema em codigo:**
```css
/* Mesma cor azul hardcoded em 5 arquivos diferentes -- trocar requer mudar todos */
.header { background-color: #3b82f6; }
.button-primary { background-color: #3b82f6; }
.link { color: #3b82f6; }
```

**Solucao:**
```css
/* Design token centralizado -- mudar a marca requer mudar um valor */
:root { --color-primary: #3b82f6; }
.header { background-color: var(--color-primary); }
.button-primary { background-color: var(--color-primary); }
.link { color: var(--color-primary); }
```

**Limitacao:** Cores usadas uma unica vez (ex: gradiente decorativo) nao precisam ser tokens. Focar em cores que aparecem em 3+ locais. Tailwind com config customizado ja centraliza cores.

---

### ESPACAMENTO-INCONSISTENTE

**Heuristica de Nielsen:** #4 - Consistencia e padroes
**Frameworks:** All
**Impacto tipico:** P
**Sinal de deteccao:**
```bash
# CSS puro: verificar variedade de valores de padding/margin sem padrao
grep -rn "padding:\|margin:" src/ --include="*.css" --include="*.scss" | sort
# Tailwind: verificar mistura inconsistente de classes de spacing em componentes similares
# Ex: componente A usa p-4 e componente B similar usa p-3 e p-6 sem razao aparente
grep -rn "class.*p-[0-9]\|class.*m-[0-9]\|class.*gap-[0-9]" src/ --include="*.tsx" --include="*.jsx"
```

**Problema em codigo:**
```css
/* Spacing arbitrario sem escala -- 13px, 17px, 21px nao seguem logica */
.card { padding: 13px; }
.sidebar { padding: 17px; }
.modal { padding: 21px; }
```

**Solucao:**
```css
/* Escala de spacing consistente baseada em multiplos de 4 */
:root {
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
}
.card { padding: var(--space-md); }
.sidebar { padding: var(--space-md); }
.modal { padding: var(--space-lg); }
```

**Limitacao:** Valores de spacing que nao seguem multiplos de 4/8 nao sao necessariamente errados -- podem ser intencionais para ajuste fino. Reportar apenas quando a variacao e claramente arbitraria (muitos valores unicos sem padrao).

---

### TIPOGRAFIA-SEM-ESCALA

**Heuristica de Nielsen:** #4 - Consistencia e padroes
**Frameworks:** All
**Impacto tipico:** M
**Sinal de deteccao:**
```bash
# Procurar font-size com muitos valores unicos sem custom properties
grep -rn "font-size:" src/ --include="*.css" --include="*.scss" | sort -t: -k3
# Tailwind: verificar se usa classes padrao (text-sm, text-base, text-lg) vs valores arbitrarios
grep -rn "text-\[" src/ --include="*.tsx" --include="*.jsx"
# Se mais de 5 valores de font-size unicos sem --font-* custom properties -> problema
```

**Problema em codigo:**
```css
/* 8 tamanhos de fonte diferentes sem escala definida -- hierarquia confusa */
.title { font-size: 28px; }
.subtitle { font-size: 19px; }
.body { font-size: 15px; }
.caption { font-size: 11px; }
.small { font-size: 13px; }
```

**Solucao:**
```css
/* Escala tipografica definida -- hierarquia visual clara e previsivel */
:root {
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
}
.title { font-size: var(--text-2xl); }
.subtitle { font-size: var(--text-lg); }
.body { font-size: var(--text-base); }
```

**Limitacao:** Projetos com Tailwind ja tem escala tipografica integrada. Verificar se o projeto usa as classes padrao antes de reportar.

---

### BORDAS-SOMBRAS-INCONSISTENTES

**Heuristica de Nielsen:** #4 - Consistencia e padroes
**Frameworks:** All
**Impacto tipico:** P
**Sinal de deteccao:**
```bash
# Verificar variedade de border-radius sem padrao
grep -rn "border-radius:" src/ --include="*.css" --include="*.scss" | sort -t: -k3
# Verificar variedade de box-shadow
grep -rn "box-shadow:" src/ --include="*.css" --include="*.scss" | sort -t: -k3
# Tailwind: verificar mistura de classes de rounded/shadow
grep -rn "rounded-\|shadow-" src/ --include="*.tsx" --include="*.jsx"
# Se mais de 4 valores unicos de border-radius sem variavel CSS -> problema
```

**Problema em codigo:**
```css
/* Cada componente com border-radius diferente -- visual incoerente */
.card { border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.button { border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
.modal { border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
.input { border-radius: 6px; }
.badge { border-radius: 16px; }
```

**Solucao:**
```css
/* Tokens de borda e sombra padronizados */
:root {
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.15);
}
.card { border-radius: var(--radius-md); box-shadow: var(--shadow-sm); }
.button { border-radius: var(--radius-sm); }
.modal { border-radius: var(--radius-lg); box-shadow: var(--shadow-md); }
```

**Limitacao:** Variacao intencional (ex: botoes com radius diferente de cards) e valida. Reportar apenas quando componentes do mesmo tipo tem valores visuais inconsistentes entre si.

---

### BOTOES-SEM-ESTILO-PADRAO

**Heuristica de Nielsen:** #4 - Consistencia e padroes
**Frameworks:** All
**Impacto tipico:** M
**Sinal de deteccao:**
```bash
# Procurar botoes sem classe de estilo
grep -rn "<button\|<Button\|type=\"submit\"\|type=\"button\"" src/ --include="*.tsx" --include="*.jsx" --include="*.vue" --include="*.html"
# Verificar se botoes tem className/class ou se usam componente Button padrao
# Se <button> sem className ou com estilos inline variados -> problema
grep -rn "<button[^>]*style=" src/ --include="*.tsx" --include="*.jsx"
```

**Problema em codigo:**
```tsx
// Cada botao com estilo inline diferente -- usuario nao reconhece padrao de acao
<button style={{ background: "blue", color: "white", padding: "8px" }}>Salvar</button>
<button style={{ background: "red", color: "white", padding: "10px 16px" }}>Excluir</button>
<button style={{ background: "gray", padding: "6px 12px" }}>Cancelar</button>
```

**Solucao:**
```tsx
// Componente Button padrao com variantes -- acoes sao visualmente previsiveis
<Button variant="primary">Salvar</Button>
<Button variant="destructive">Excluir</Button>
<Button variant="secondary">Cancelar</Button>
```

**Limitacao:** Projetos com UI library (shadcn, MUI, etc.) ja tem componente Button padronizado. Verificar imports antes de reportar. Botoes com estilo inline podem ser intencionais em prototipos.

</category>

<category name="formularios">
## Prevencao de Erros e Formularios

Heuristicas relacionadas a Heuristica #5 de Nielsen: "Prevencao de erros". Melhor que boas mensagens de erro e um design cuidadoso que previne a ocorrencia do problema. Eliminar condicoes propensas a erro ou apresentar confirmacao antes de acoes.

Em analise estatica, detectamos ausencia de prevencao verificando se formularios tem validacao, labels, e mecanismos que guiam o usuario a evitar erros.

### INPUT-SEM-LABEL

**Heuristica de Nielsen:** #5 - Prevencao de erros / #6 - Reconhecimento em vez de memorizacao
**Frameworks:** All
**Impacto tipico:** G
**Sinal de deteccao:**
```bash
# Procurar inputs sem label associada
grep -rn "<input\|<Input\|<textarea\|<Textarea\|<select\|<Select" src/ --include="*.tsx" --include="*.jsx" --include="*.vue" --include="*.html"
# Verificar se proximo ao input existe <label htmlFor> ou <Label> ou aria-label ou aria-labelledby
# Se input existe sem nenhuma forma de label -> problema de acessibilidade e usabilidade
```

**Problema em codigo:**
```tsx
// Usuario nao sabe o que digitar -- campo sem identificacao
<input type="text" placeholder="Digite aqui..." />
<input type="email" />
```

**Solucao:**
```tsx
// Label associada informa o proposito do campo; acessivel para screen readers
<div>
  <label htmlFor="email">Email</label>
  <input id="email" type="email" placeholder="seu@email.com" />
</div>
```

**Limitacao:** Inputs com `aria-label` ou dentro de componentes de UI library que adicionam label automaticamente (ex: FormField do shadcn) sao validos mesmo sem `<label>` visivel. Verificar atributos ARIA.

---

### FORMULARIO-SEM-VALIDACAO

**Heuristica de Nielsen:** #5 - Prevencao de erros
**Frameworks:** All
**Impacto tipico:** G
**Sinal de deteccao:**
```bash
# Procurar forms com onSubmit mas sem validacao
grep -rn "onSubmit\|@submit\|handleSubmit" src/ --include="*.tsx" --include="*.jsx" --include="*.vue"
# No mesmo componente, verificar se existe: schema validation (zod/yup), field validation, required checks
# Se form com submit handler mas sem nenhuma validacao client-side -> problema
grep -rn "z\.object\|yup\.object\|validate\|required\|\.errors" src/ --include="*.tsx" --include="*.jsx"
```

**Problema em codigo:**
```tsx
// Formulario envia dados sem validar -- usuario descobre erro so na resposta do servidor
function handleSubmit(e: FormEvent) {
  e.preventDefault();
  const data = new FormData(e.target);
  api.createUser(Object.fromEntries(data)); // Sem validacao
}

return (
  <form onSubmit={handleSubmit}>
    <input name="email" />
    <input name="age" />
    <button type="submit">Criar</button>
  </form>
);
```

**Solucao:**
```tsx
// Validacao client-side previne envio de dados invalidos
const schema = z.object({
  email: z.string().email("Email invalido"),
  age: z.number().min(18, "Idade minima: 18 anos"),
});

function handleSubmit(e: FormEvent) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  const result = schema.safeParse(data);
  if (!result.success) {
    setErrors(result.error.flatten().fieldErrors);
    return;
  }
  api.createUser(result.data);
}
```

**Limitacao:** Formularios simples (ex: campo de busca) nao precisam de validacao complexa. Focar em formularios que coletam dados do usuario para envio ao servidor.

---

### ERRO-GENERICO

**Heuristica de Nielsen:** #9 - Ajudar usuarios a reconhecer, diagnosticar e recuperar de erros
**Frameworks:** All
**Impacto tipico:** M
**Sinal de deteccao:**
```bash
# Procurar mensagens de erro genericas hardcoded
grep -rn '"Erro"\|"Error"\|"Invalido"\|"Invalid"\|"Algo deu errado"\|"Something went wrong"' src/ --include="*.tsx" --include="*.jsx" --include="*.vue"
# Verificar se mensagens de erro sao contextuais (especificas para o campo/acao)
# Se mensagem de erro e texto generico sem contexto -> problema
```

**Problema em codigo:**
```tsx
// Mensagem nao ajuda o usuario a corrigir o problema
{error && <p className="text-red-500">Erro ao processar</p>}
```

**Solucao:**
```tsx
// Mensagem especifica para cada tipo de erro
{error?.type === "email" && <p className="text-red-500">Email ja cadastrado. Tente fazer login.</p>}
{error?.type === "network" && <p className="text-red-500">Sem conexao. Verifique sua internet e tente novamente.</p>}
{error?.type === "validation" && <p className="text-red-500">{error.message}</p>}
```

**Limitacao:** Erros genericos em catch-all handlers podem ser aceitaveis como fallback, desde que erros especificos sejam tratados antes. Verificar se existe tratamento granular alem do generico.

---

### REQUIRED-SEM-INDICACAO

**Heuristica de Nielsen:** #5 - Prevencao de erros / #6 - Reconhecimento
**Frameworks:** All
**Impacto tipico:** P
**Sinal de deteccao:**
```bash
# Procurar inputs com required mas sem indicacao visual
grep -rn "required" src/ --include="*.tsx" --include="*.jsx" --include="*.vue" --include="*.html"
# No mesmo contexto, verificar se existe asterisco (*), texto "obrigatorio", ou classe visual de required
# Se input tem required attribute mas sem indicacao visual -> problema
```

**Problema em codigo:**
```tsx
// Campo obrigatorio sem indicacao -- usuario descobre so ao tentar enviar
<label htmlFor="name">Nome</label>
<input id="name" required />
```

**Solucao:**
```tsx
// Asterisco ou texto indica que o campo e obrigatorio
<label htmlFor="name">Nome <span className="text-red-500">*</span></label>
<input id="name" required aria-required="true" />
```

**Limitacao:** Se todos os campos do formulario sao obrigatorios, indicar "todos obrigatorios" no topo e mais limpo que asterisco em cada campo. Verificar proporacao de campos required no form.

---

### AUTOCOMPLETE-AUSENTE

**Heuristica de Nielsen:** #6 - Reconhecimento em vez de memorizacao / #7 - Flexibilidade e eficiencia
**Frameworks:** All
**Impacto tipico:** P
**Sinal de deteccao:**
```bash
# Procurar inputs de campos comuns sem atributo autocomplete
grep -rn 'type="email"\|type="tel"\|type="password"\|name="address"\|name="city"\|name="zip"\|name="name"' src/ --include="*.tsx" --include="*.jsx" --include="*.vue" --include="*.html"
# Verificar se estes inputs tem atributo autocomplete
# Se input de email/telefone/endereco sem autocomplete -> problema
```

**Problema em codigo:**
```tsx
// Usuario precisa digitar email manualmente mesmo que o browser saiba
<input type="email" name="email" />
<input type="tel" name="phone" />
```

**Solucao:**
```tsx
// Browser oferece preenchimento automatico -- menos digitacao para o usuario
<input type="email" name="email" autoComplete="email" />
<input type="tel" name="phone" autoComplete="tel" />
```

**Limitacao:** Campos de busca e filtros nao devem ter autocomplete de endereco/email. Aplicar apenas a formularios de cadastro, perfil, checkout, e contato.

---

### SUBMIT-SEM-DISABLED

**Heuristica de Nielsen:** #5 - Prevencao de erros
**Frameworks:** All
**Impacto tipico:** M
**Sinal de deteccao:**
```bash
# Procurar botoes de submit sem disabled durante loading
grep -rn 'type="submit"' src/ --include="*.tsx" --include="*.jsx" --include="*.vue"
# Verificar se o botao tem disabled={isLoading} ou disabled={isPending} ou equivalente
# Se botao submit existe sem condicao de disabled e componente tem estado de loading -> problema
```

**Problema em codigo:**
```tsx
// Duplo clique envia formulario duas vezes
const [isLoading, setIsLoading] = useState(false);
// ... handler que seta isLoading
<button type="submit">Enviar</button>
```

**Solucao:**
```tsx
// Botao desabilitado previne envio duplicado
<button type="submit" disabled={isLoading}>
  {isLoading ? "Enviando..." : "Enviar"}
</button>
```

**Limitacao:** Formularios que usam React Hook Form com `formState.isSubmitting` ja controlam isso automaticamente. Verificar se form library gerencia o estado antes de reportar.

</category>

<category name="navegacao">
## Reconhecimento e Navegacao

Heuristicas relacionadas a Heuristica #6 de Nielsen: "Reconhecimento em vez de memorizacao". Minimizar a carga de memoria do usuario tornando objetos, acoes e opcoes visiveis. O usuario nao deve ter que memorizar informacoes de uma parte da interface para outra.

Em analise estatica, detectamos problemas de navegacao verificando a estrutura de links, rotas, titulos e elementos de orientacao.

### LINK-SEM-TEXTO-DESCRITIVO

**Heuristica de Nielsen:** #6 - Reconhecimento em vez de memorizacao
**Frameworks:** All
**Impacto tipico:** M
**Sinal de deteccao:**
```bash
# Procurar links com texto generico
grep -rn ">clique aqui<\|>click here<\|>saiba mais<\|>learn more<\|>here<\|>aqui<" src/ --include="*.tsx" --include="*.jsx" --include="*.vue" --include="*.html"
# Procurar links que sao apenas icones sem texto acessivel
grep -rn "<a [^>]*>\s*<[A-Z][a-zA-Z]*Icon\|<Link [^>]*>\s*<[A-Z][a-zA-Z]*Icon" src/ --include="*.tsx" --include="*.jsx"
# Se link tem apenas icone sem aria-label ou sr-only text -> problema
```

**Problema em codigo:**
```tsx
// "Clique aqui" nao informa o destino -- usuario precisa ler contexto
<p>Para ver seus pedidos, <a href="/orders">clique aqui</a>.</p>
// Icone sem texto acessivel -- usuario de screen reader nao sabe o destino
<Link href="/settings"><GearIcon /></Link>
```

**Solucao:**
```tsx
// Texto do link descreve o destino
<p>Veja seus <a href="/orders">pedidos recentes</a>.</p>
// Icone com texto acessivel
<Link href="/settings" aria-label="Configuracoes"><GearIcon /></Link>
```

**Limitacao:** Links em menus de navegacao com contexto visual claro (ex: icone + label adjacente) podem nao precisar de aria-label adicional. Avaliar contexto visual do componente pai.

---

### BREADCRUMB-AUSENTE

**Heuristica de Nielsen:** #6 - Reconhecimento em vez de memorizacao
**Frameworks:** All
**Impacto tipico:** P
**Sinal de deteccao:**
```bash
# Verificar se existem rotas aninhadas (3+ niveis)
# Next.js: pastas aninhadas em app/ ou pages/
ls -R src/app/ 2>/dev/null | grep -c "/" # Contar niveis de aninhamento
# Verificar se existe componente Breadcrumb
grep -rn "Breadcrumb\|breadcrumb" src/ --include="*.tsx" --include="*.jsx" --include="*.vue"
# Se rotas com 3+ niveis existem sem componente Breadcrumb -> problema
```

**Problema em codigo:**
```tsx
// Rota /admin/users/123/edit sem breadcrumb -- usuario nao sabe como voltar
export default function EditUserPage({ params }) {
  return (
    <div>
      <h1>Editar Usuario</h1>
      {/* Sem breadcrumb -- usuario perde contexto de navegacao */}
      <UserForm userId={params.id} />
    </div>
  );
}
```

**Solucao:**
```tsx
// Breadcrumb mostra caminho hierarquico com links para cada nivel
export default function EditUserPage({ params }) {
  return (
    <div>
      <Breadcrumb>
        <BreadcrumbItem href="/admin">Admin</BreadcrumbItem>
        <BreadcrumbItem href="/admin/users">Usuarios</BreadcrumbItem>
        <BreadcrumbItem>Editar</BreadcrumbItem>
      </Breadcrumb>
      <h1>Editar Usuario</h1>
      <UserForm userId={params.id} />
    </div>
  );
}
```

**Limitacao:** Apps simples com poucos niveis de navegacao (1-2 niveis) nao precisam de breadcrumbs. Aplicar apenas quando existem 3+ niveis de profundidade. SPAs com tabs laterais podem usar outra forma de orientacao.

---

### PAGINA-SEM-TITULO

**Heuristica de Nielsen:** #6 - Reconhecimento em vez de memorizacao
**Frameworks:** All
**Impacto tipico:** M
**Sinal de deteccao:**
```bash
# Next.js App Router: verificar se paginas exportam metadata
grep -rn "export.*metadata\|export.*generateMetadata" src/app/ --include="*.tsx" --include="*.ts"
# Next.js Pages Router: verificar uso de Head
grep -rn "<Head>\|import Head" src/pages/ --include="*.tsx" --include="*.jsx"
# HTML: verificar <title>
grep -rn "<title>" src/ --include="*.html"
# Contar paginas sem titulo vs total de paginas
```

**Problema em codigo:**
```tsx
// Pagina sem titulo -- aba do browser mostra URL ou titulo padrao
// app/dashboard/page.tsx
export default function DashboardPage() {
  return <div>Dashboard content</div>;
}
// Sem export de metadata -> aba mostra "localhost:3000" ou titulo generico
```

**Solucao:**
```tsx
// Titulo descritivo para cada pagina
// app/dashboard/page.tsx
export const metadata = {
  title: "Dashboard | MeuApp",
  description: "Visao geral dos seus projetos e metricas",
};

export default function DashboardPage() {
  return <div>Dashboard content</div>;
}
```

**Limitacao:** Layouts pai em Next.js podem definir titulo base com template (`title: { template: "%s | App" }`). Verificar se layout.tsx ja define titulo antes de reportar paginas individuais.

---

### PAGINA-404-AUSENTE

**Heuristica de Nielsen:** #9 - Ajudar usuarios a recuperar de erros
**Frameworks:** All
**Impacto tipico:** M
**Sinal de deteccao:**
```bash
# Next.js App Router: verificar not-found.tsx
find src/app -name "not-found.tsx" -o -name "not-found.jsx" 2>/dev/null
# Next.js Pages Router: verificar 404.tsx
find src/pages -name "404.tsx" -o -name "404.jsx" 2>/dev/null
# Rota catch-all generica
grep -rn "\[\.\.\.slug\]\|\[\[\.\.\.slug\]\]" src/ --include="*.tsx"
# Se nenhuma pagina 404 customizada encontrada -> problema
```

**Problema em codigo:**
```
// Nenhum arquivo not-found.tsx ou 404.tsx no projeto
// Usuario que acessa URL invalida ve pagina de erro padrao do framework
// sem orientacao sobre como encontrar o que procurava
```

**Solucao:**
```tsx
// app/not-found.tsx -- pagina 404 customizada com navegacao
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold">Pagina nao encontrada</h1>
      <p className="mt-4 text-gray-600">
        A pagina que voce procura nao existe ou foi movida.
      </p>
      <Link href="/" className="mt-6 text-blue-600 hover:underline">
        Voltar para a pagina inicial
      </Link>
    </div>
  );
}
```

**Limitacao:** Projetos com apenas API routes (sem frontend) nao precisam de pagina 404 visual. Aplicar apenas a projetos com interface de usuario.

---

### TAB-ORDER-QUEBRADO

**Heuristica de Nielsen:** #7 - Flexibilidade e eficiencia de uso
**Frameworks:** All
**Impacto tipico:** M
**Sinal de deteccao:**
```bash
# Procurar tabIndex com valores positivos (quebra ordem natural)
grep -rn "tabIndex=[\"']\?[1-9]" src/ --include="*.tsx" --include="*.jsx" --include="*.vue" --include="*.html"
# Valores positivos de tabIndex criam ordem de tab customizada que confunde usuarios
# tabIndex="0" e tabIndex="-1" sao validos e comuns
```

**Problema em codigo:**
```tsx
// tabIndex positivo cria ordem de navegacao confusa
<input tabIndex={3} placeholder="Nome" />
<input tabIndex={1} placeholder="Email" />  {/* Tab vai aqui primeiro */}
<input tabIndex={2} placeholder="Telefone" />
```

**Solucao:**
```tsx
// Sem tabIndex positivo -- ordem segue o DOM (previsivel para o usuario)
<input placeholder="Email" />
<input placeholder="Nome" />
<input placeholder="Telefone" />
```

**Limitacao:** `tabIndex={0}` e `tabIndex={-1}` sao usos validos e comuns (tornar elemento focavel ou remover do tab order). Reportar apenas valores positivos (1, 2, 3...).

</category>

<category name="responsividade">
## Flexibilidade e Responsividade

Heuristicas relacionadas a Heuristica #7 de Nielsen: "Flexibilidade e eficiencia de uso". A interface deve acomodar tanto usuarios novatos quanto experientes, e deve funcionar em diferentes dispositivos e contextos.

Em analise estatica, detectamos problemas de responsividade verificando meta tags, media queries, unidades de medida e suporte a temas.

### META-VIEWPORT-AUSENTE

**Heuristica de Nielsen:** #7 - Flexibilidade e eficiencia de uso
**Frameworks:** Vanilla HTML
**Impacto tipico:** G
**Sinal de deteccao:**
```bash
# Procurar meta viewport em HTML
grep -rn 'name="viewport"' src/ --include="*.html" public/ --include="*.html"
# Em Next.js: verificar layout.tsx (App Router gera viewport automaticamente)
# Se projeto tem HTML customizado sem meta viewport -> problema critico em mobile
```

**Problema em codigo:**
```html
<!-- Pagina nao tem meta viewport -- mobile mostra versao desktop minuscula -->
<html>
<head>
  <title>Meu App</title>
  <!-- Sem meta viewport -->
</head>
```

**Solucao:**
```html
<!-- Meta viewport garante que mobile renderiza na escala correta -->
<html>
<head>
  <title>Meu App</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
```

**Limitacao:** Frameworks modernos (Next.js, Nuxt, SvelteKit) adicionam viewport automaticamente. Verificar apenas em projetos com HTML customizado ou templates manuais. Nao reportar se framework gera o HTML.

---

### LARGURA-FIXA-PX

**Heuristica de Nielsen:** #7 - Flexibilidade e eficiencia de uso
**Frameworks:** All
**Impacto tipico:** M
**Sinal de deteccao:**
```bash
# Procurar larguras fixas em pixels em containers principais
grep -rn "width:\s*[0-9]\{3,\}px" src/ --include="*.css" --include="*.scss"
# Tailwind: procurar w-[NNNpx] sem max-w
grep -rn "w-\[[0-9]\{3,\}px\]" src/ --include="*.tsx" --include="*.jsx"
# Se container/wrapper/main/section tem width fixa em px sem max-width -> problema
```

**Problema em codigo:**
```css
/* Container com largura fixa -- cortado em telas menores */
.main-content {
  width: 960px; /* Nao se adapta a telas menores que 960px */
}
```

**Solucao:**
```css
/* max-width com width relativa -- se adapta a qualquer tela */
.main-content {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
}
```

**Limitacao:** Larguras fixas em componentes internos pequenos (icones, avatares, badges) sao aceitaveis. Focar em containers de layout (main, section, wrapper, content area). Modais com largura fixa e max-width sao validos.

---

### BREAKPOINTS-AUSENTES

**Heuristica de Nielsen:** #7 - Flexibilidade e eficiencia de uso
**Frameworks:** All
**Impacto tipico:** G
**Sinal de deteccao:**
```bash
# CSS puro: verificar se existem media queries
grep -rn "@media" src/ --include="*.css" --include="*.scss" | wc -l
# Tailwind: verificar se existem classes responsivas
grep -rn "sm:\|md:\|lg:\|xl:" src/ --include="*.tsx" --include="*.jsx" --include="*.vue" | wc -l
# Se projeto tem componentes de UI mas zero ou muito poucas media queries/classes responsivas -> problema
```

**Problema em codigo:**
```css
/* Nenhuma media query no projeto -- layout identico em mobile e desktop */
.sidebar { width: 250px; float: left; }
.content { margin-left: 260px; }
/* Em mobile, sidebar ocupa 70% da tela e conteudo fica espremido */
```

**Solucao:**
```css
/* Media queries adaptam layout para diferentes tamanhos de tela */
.sidebar { width: 250px; }
.content { margin-left: 260px; }

@media (max-width: 768px) {
  .sidebar { display: none; } /* Ou transforma em drawer/menu */
  .content { margin-left: 0; }
}
```

**Limitacao:** APIs e projetos sem interface visual nao precisam de responsividade. Admin panels internos com audiencia conhecida (desktop-only) podem ser menos responsivos. Verificar se o projeto tem usuario final mobile.

---

### IMAGEM-SEM-MAX-WIDTH

**Heuristica de Nielsen:** #7 - Flexibilidade e eficiencia de uso
**Frameworks:** All
**Impacto tipico:** M
**Sinal de deteccao:**
```bash
# Procurar imagens sem restricao de largura
grep -rn "<img " src/ --include="*.tsx" --include="*.jsx" --include="*.vue" --include="*.html"
# Verificar se img tem max-width ou classe responsiva
# CSS global: verificar se existe reset de img
grep -rn "img.*max-width\|img.*width.*100%" src/ --include="*.css" --include="*.scss"
# Tailwind: verificar se img tem w-full, max-w-*, ou classe de tamanho
# Se <img> sem restricao de largura e sem reset CSS global -> problema
```

**Problema em codigo:**
```tsx
// Imagem maior que o container estoura o layout em mobile
<img src="/hero-banner.jpg" alt="Banner" />
/* Imagem de 1920px de largura estoura container de 375px em mobile */
```

**Solucao:**
```tsx
// Imagem se adapta ao container
<img src="/hero-banner.jpg" alt="Banner" className="w-full max-w-full h-auto" />
// Ou no CSS global:
// img { max-width: 100%; height: auto; }
```

**Limitacao:** Projetos com CSS reset moderno (Tailwind preflight, normalize.css, modern-normalize) ja incluem `img { max-width: 100% }`. Verificar se existe reset antes de reportar. Next.js `Image` component ja gerencia isso.

---

### DARK-MODE-INCOMPLETO

**Heuristica de Nielsen:** #7 - Flexibilidade e eficiencia de uso
**Frameworks:** Tailwind, CSS custom properties
**Impacto tipico:** P
**Sinal de deteccao:**
```bash
# Verificar se Tailwind tem dark mode configurado
grep -rn "darkMode" tailwind.config.* 2>/dev/null
# Verificar se dark: classes sao usadas
grep -rn "dark:" src/ --include="*.tsx" --include="*.jsx" --include="*.vue" | wc -l
# CSS: verificar prefers-color-scheme
grep -rn "prefers-color-scheme" src/ --include="*.css" --include="*.scss" | wc -l
# Se Tailwind configurado com dark mode mas poucas classes dark: usadas -> incompleto
# Comparar: total de classes bg-* vs total de classes dark:bg-*
```

**Problema em codigo:**
```tsx
// Tailwind configurado com dark mode, mas componentes nao usam
// tailwind.config.js: darkMode: "class"
// Componentes:
<div className="bg-white text-gray-900">
  <h1 className="text-black">Titulo</h1>
  {/* Nenhuma classe dark: -- dark mode fica com fundo branco e texto escuro */}
</div>
```

**Solucao:**
```tsx
// Classes dark: aplicadas para adaptar ao tema escuro
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  <h1 className="text-black dark:text-white">Titulo</h1>
</div>
```

**Limitacao:** Nem todo projeto precisa de dark mode. Reportar apenas quando o framework esta configurado para suportar dark mode (darkMode habilitado no Tailwind, ou prefers-color-scheme presente) mas componentes nao implementam. Nao reportar se dark mode nao esta configurado.

</category>

<category name="hierarquia-visual">
## Estetica e Hierarquia Visual

Heuristicas relacionadas a Heuristica #8 de Nielsen: "Design estetico e minimalista". Dialogos nao devem conter informacoes irrelevantes ou raramente necessarias. Cada unidade extra de informacao compete com as unidades relevantes e diminui sua visibilidade relativa.

Em analise estatica, detectamos problemas de hierarquia verificando uso de headings, espacamento, e estrutura visual dos componentes.

### HEADING-LEVELS-PULADOS

**Heuristica de Nielsen:** #8 - Design estetico e minimalista / #6 - Reconhecimento
**Frameworks:** All
**Impacto tipico:** M
**Sinal de deteccao:**
```bash
# Procurar headings e verificar se a sequencia e logica
grep -rn "<h[1-6]\|<H[1-6]" src/ --include="*.tsx" --include="*.jsx" --include="*.vue" --include="*.html"
# Ordenar e verificar se h1 existe e se niveis nao sao pulados (h1 -> h3 sem h2)
# Verificar se pagina tem h1
grep -rn "<h1\|<H1" src/ --include="*.tsx" --include="*.jsx" | wc -l
# Se h1 ausente ou heading levels pulados -> problema
```

**Problema em codigo:**
```tsx
// h1 seguido de h3 -- h2 ausente. Hierarquia confusa para screen readers e SEO
<div>
  <h1>Dashboard</h1>
  <h3>Projetos Recentes</h3>  {/* Pulou h2 */}
  <h5>Ver todos</h5>           {/* Pulou h4 */}
</div>
```

**Solucao:**
```tsx
// Headings em sequencia logica -- hierarquia clara
<div>
  <h1>Dashboard</h1>
  <h2>Projetos Recentes</h2>
  <h3>Ver todos</h3>
</div>
```

**Limitacao:** Componentes reutilizaveis podem usar headings que fazem sentido no contexto onde sao inseridos. Avaliar a pagina completa, nao componentes isolados. Bibliotecas de UI podem definir headings internamente.

---

### CONTEUDO-SEM-QUEBRA-VISUAL

**Heuristica de Nielsen:** #8 - Design estetico e minimalista
**Frameworks:** All
**Impacto tipico:** P
**Sinal de deteccao:**
```bash
# Procurar componentes com muito texto corrido sem headings ou listas
# Heuristica: contar linhas de texto JSX entre headings em componentes de conteudo
grep -rn "<p>" src/ --include="*.tsx" --include="*.jsx" --include="*.vue"
# Se componente tem mais de 5 paragrafos consecutivos sem heading, lista, ou separador visual -> problema
# Verificar presenca de <ul>, <ol>, <hr>, headings entre paragrafos
```

**Problema em codigo:**
```tsx
// Bloco de texto longo sem quebra visual -- usuario desiste de ler
<div>
  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
  <p>Sed do eiusmod tempor incididunt ut labore et dolore...</p>
  <p>Ut enim ad minim veniam, quis nostrud exercitation...</p>
  <p>Duis aute irure dolor in reprehenderit in voluptate...</p>
  <p>Excepteur sint occaecat cupidatat non proident...</p>
  <p>Sed ut perspiciatis unde omnis iste natus error...</p>
</div>
```

**Solucao:**
```tsx
// Conteudo organizado com headings, listas e espacamento
<div>
  <h2>Como funciona</h2>
  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>

  <h3>Beneficios</h3>
  <ul>
    <li>Primeiro beneficio com descricao</li>
    <li>Segundo beneficio com descricao</li>
  </ul>

  <h3>Proximos passos</h3>
  <p>Duis aute irure dolor in reprehenderit...</p>
</div>
```

**Limitacao:** Paginas de artigos/blog com paragrafos longos podem ser intencionais no design editorial. Aplicar principalmente a paginas de produto, landing pages, e documentacao tecnica.

---

### WHITESPACE-INSUFICIENTE

**Heuristica de Nielsen:** #8 - Design estetico e minimalista
**Frameworks:** All
**Impacto tipico:** P
**Sinal de deteccao:**
```bash
# CSS: procurar containers sem padding ou com padding minimo
grep -rn "padding:\s*0\b\|padding: 0;" src/ --include="*.css" --include="*.scss"
# Tailwind: procurar containers sem gap ou space-between
# Heuristica: componentes com filhos diretos sem gap, space-y, space-x, ou py/px
grep -rn "flex\|grid" src/ --include="*.tsx" --include="*.jsx" | head -20
# Verificar se containers flex/grid tem gap- classes
# Se flex/grid containers sem gap e sem space- classes -> problema
```

**Problema em codigo:**
```tsx
// Elementos colados sem espaco -- interface parece apertada e confusa
<div className="flex">
  <Card>Projeto A</Card>
  <Card>Projeto B</Card>
  <Card>Projeto C</Card>
</div>
```

**Solucao:**
```tsx
// Gap entre elementos cria respiracao visual
<div className="flex gap-4">
  <Card>Projeto A</Card>
  <Card>Projeto B</Card>
  <Card>Projeto C</Card>
</div>
```

**Limitacao:** Elementos intencionalmente adjacentes (ex: grupo de botoes conectados, tabs) nao precisam de gap. Avaliar contexto do layout. Componentes de UI library podem gerenciar spacing internamente.

---

### CONTRASTE-INSUFICIENTE

**Heuristica de Nielsen:** #8 - Design estetico e minimalista / Acessibilidade WCAG
**Frameworks:** All
**Impacto tipico:** M
**Sinal de deteccao:**
```bash
# Heuristica aproximada: procurar texto com cores claras em contexto de fundo claro
# Cores de texto problematicas tipicas: cinzas muito claros
grep -rn "color:\s*#[a-fA-F0-9]\{3,6\}" src/ --include="*.css" --include="*.scss"
# Tailwind: procurar classes de texto claro que podem ter contraste baixo
grep -rn "text-gray-300\|text-gray-200\|text-gray-100\|text-slate-300\|text-slate-200" src/ --include="*.tsx" --include="*.jsx"
# NOTA: esta heuristica e MUITO aproximada -- contraste depende da combinacao fundo + texto
# Focar em: texto cinza claro (#ccc, #ddd, gray-300) em componentes SEM fundo escuro
```

**Problema em codigo:**
```tsx
// Texto cinza claro em fundo branco -- dificil de ler
<p className="text-gray-300">Informacao importante sobre o produto</p>
// gray-300 = #d1d5db em fundo branco = contraste ~1.8:1 (WCAG requer 4.5:1)
```

**Solucao:**
```tsx
// Cor de texto com contraste adequado
<p className="text-gray-600">Informacao importante sobre o produto</p>
// gray-600 = #4b5563 em fundo branco = contraste ~7:1 (passa WCAG AA)
```

**Limitacao:** Analise estatica NAO pode calcular contraste real porque depende do fundo efetivo (que pode vir de componente pai, tema, ou CSS em cascata). Esta heuristica so detecta cores conhecidamente problematicas (gray-100/200/300 em contexto sem fundo escuro). False positives sao esperados em dark mode.

</category>

<category name="erros-recuperacao">
## Recuperacao de Erros

Heuristicas relacionadas a Heuristica #9 de Nielsen: "Ajudar usuarios a reconhecer, diagnosticar e recuperar de erros". Mensagens de erro devem ser expressas em linguagem simples, indicar precisamente o problema e sugerir construtivamente uma solucao.

Em analise estatica, detectamos ausencia de recuperacao verificando se blocos de erro exibem informacao ao usuario e oferecem acoes de recuperacao.

### CATCH-SEM-UI-ERRO

**Heuristica de Nielsen:** #9 - Ajudar usuarios a reconhecer, diagnosticar e recuperar de erros
**Frameworks:** All
**Impacto tipico:** G
**Sinal de deteccao:**
```bash
# Procurar catch blocks que nao setam estado de erro para UI
grep -rn "catch\s*(" src/ --include="*.tsx" --include="*.jsx" --include="*.vue"
# No mesmo handler/funcao, verificar se existe setError, setErrorMessage, ou equivalente
# Se catch existe mas so faz console.log/console.error sem setar estado de UI -> problema
grep -rn "catch.*console\.\(log\|error\)" src/ --include="*.tsx" --include="*.jsx"
```

**Problema em codigo:**
```tsx
// Erro engolido silenciosamente -- usuario nao sabe que a acao falhou
async function handleSave(data: FormData) {
  try {
    await api.saveProfile(data);
  } catch (error) {
    console.error("Failed to save:", error);
    // Nenhum feedback visual -- usuario acha que salvou
  }
}
```

**Solucao:**
```tsx
// Erro comunicado ao usuario com acao de recuperacao
const [error, setError] = useState<string | null>(null);

async function handleSave(data: FormData) {
  try {
    setError(null);
    await api.saveProfile(data);
    toast.success("Perfil salvo com sucesso");
  } catch (err) {
    console.error("Failed to save:", err);
    setError("Nao foi possivel salvar o perfil. Verifique sua conexao e tente novamente.");
  }
}

return (
  <>
    {error && <Alert variant="destructive">{error}</Alert>}
    <form onSubmit={handleSave}>...</form>
  </>
);
```

**Limitacao:** Catch blocks em funcoes utilitarias/services (nao componentes) nao precisam de UI -- o erro deve ser propagado para o componente tratar. Focar em catch blocks dentro de componentes ou handlers de evento.

---

### ERROR-BOUNDARY-AUSENTE

**Heuristica de Nielsen:** #9 - Ajudar usuarios a reconhecer, diagnosticar e recuperar de erros
**Frameworks:** React
**Impacto tipico:** G
**Sinal de deteccao:**
```bash
# Verificar se projeto React tem ErrorBoundary
grep -rn "ErrorBoundary\|componentDidCatch\|getDerivedStateFromError" src/ --include="*.tsx" --include="*.jsx"
# Next.js App Router: verificar error.tsx
find src/app -name "error.tsx" -o -name "error.jsx" 2>/dev/null
# Se projeto React sem nenhum ErrorBoundary ou error.tsx -> problema
# Um erro nao tratado em qualquer componente quebra a app inteira
```

**Problema em codigo:**
```
// Nenhum ErrorBoundary no projeto React
// Se qualquer componente lanca erro durante render, toda a app fica em branco
// Usuario ve tela branca sem explicacao e sem forma de recuperar
```

**Solucao:**
```tsx
// ErrorBoundary envolve areas criticas da app
// app/error.tsx (Next.js App Router)
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold">Algo deu errado</h2>
      <p className="mt-2 text-gray-600">{error.message}</p>
      <button onClick={reset} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
        Tentar novamente
      </button>
    </div>
  );
}
```

**Limitacao:** Aplicar apenas a projetos React. Vue e Svelte tem mecanismos diferentes de tratamento de erros (`errorCaptured` no Vue, `onError` no Svelte). Next.js App Router com `error.tsx` substitui ErrorBoundary customizado.

---

### RETRY-AUSENTE

**Heuristica de Nielsen:** #9 - Ajudar usuarios a reconhecer, diagnosticar e recuperar de erros
**Frameworks:** All
**Impacto tipico:** M
**Sinal de deteccao:**
```bash
# Procurar tratamento de erros de rede sem opcao de retry
grep -rn "fetch\|axios\|useMutation\|useQuery" src/ --include="*.tsx" --include="*.jsx"
# Verificar se componentes com erro de rede oferecem botao de retry/tentar novamente
grep -rn "retry\|tentar novamente\|try again\|refetch\|reset" src/ --include="*.tsx" --include="*.jsx"
# Se operacoes de rede existem com UI de erro mas sem acao de retry -> problema
```

**Problema em codigo:**
```tsx
// Erro sem opcao de retry -- usuario precisa recarregar a pagina inteira
if (error) {
  return <p className="text-red-500">Erro ao carregar dados</p>;
}
```

**Solucao:**
```tsx
// Botao de retry permite recuperacao sem recarregar pagina
if (error) {
  return (
    <div className="text-center">
      <p className="text-red-500">Erro ao carregar dados</p>
      <button
        onClick={() => refetch()}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Tentar novamente
      </button>
    </div>
  );
}
```

**Limitacao:** Erros de validacao (400) nao devem ter retry -- o usuario precisa corrigir o input. Retry e para erros de rede (timeout, 500, offline). Verificar o tipo de erro antes de sugerir retry. React Query/SWR tem retry automatico configuravel.

---

### ERRO-PAGE-GENERICA

**Heuristica de Nielsen:** #9 - Ajudar usuarios a reconhecer, diagnosticar e recuperar de erros
**Frameworks:** All
**Impacto tipico:** M
**Sinal de deteccao:**
```bash
# Verificar paginas de erro existentes
find src/ -name "error.*" -o -name "Error.*" -o -name "_error.*" 2>/dev/null
# Verificar se paginas de erro tem informacao util e acoes de recuperacao
grep -rn "error\|Error" src/app/error.tsx src/pages/_error.tsx 2>/dev/null
# Se pagina de erro existe mas so mostra "Algo deu errado" sem acao -> problema
# Verificar se tem: botao de retry, link para home, informacao do erro
```

**Problema em codigo:**
```tsx
// Pagina de erro sem informacao util ou acao de recuperacao
export default function Error() {
  return <h1>Erro</h1>;
}
```

**Solucao:**
```tsx
// Pagina de erro com contexto e acoes de recuperacao
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-3xl font-bold">Algo deu errado</h1>
      <p className="text-gray-600 max-w-md text-center">
        Houve um problema ao carregar esta pagina.
        Se o erro persistir, entre em contato com o suporte.
      </p>
      <div className="flex gap-2">
        <button onClick={reset} className="px-4 py-2 bg-blue-500 text-white rounded">
          Tentar novamente
        </button>
        <a href="/" className="px-4 py-2 border rounded">
          Voltar ao inicio
        </a>
      </div>
    </div>
  );
}
```

**Limitacao:** Em ambiente de desenvolvimento, paginas de erro detalhadas com stack trace sao uteis. Esta heuristica aplica-se a paginas de erro em producao. Verificar se existe diferenciacao dev/prod.

</category>
