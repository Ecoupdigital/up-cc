# Template de Sugestao

Template para sugestoes individuais produzidas por agentes auditores e idealizadores. Cada sugestao e um bloco autocontido com formato padrao para agregacao e priorizacao.

<template>

```markdown
### [ID]: [titulo curto do problema]

| Campo | Valor |
|-------|-------|
| Arquivo | `caminho/do/arquivo.ext` |
| Linha | 42 (ou range 42-58, ou N/A para problemas estruturais) |
| Dimensao | UX / Performance / Modernidade / Codigo / Ideias |
| Esforco | P / M / G |
| Impacto | P / M / G |

**Problema:** Descricao concreta do problema encontrado, com evidencia do codigo.

**Sugestao:** Acao especifica para resolver, com exemplo de codigo se aplicavel.

**Referencia:** Link ou nome do padrao/best practice que fundamenta a sugestao (opcional mas recomendado).
```

</template>

<field_definitions>

### Campos Obrigatorios

**ID**
Formato `[DIM]-[NNN]` onde DIM e abreviatura da dimensao e NNN e sequencial por dimensao.
Abreviaturas: `UX`, `PERF`, `MOD`, `COD`, `IDEA`.
Exemplos: `PERF-003`, `UX-012`, `MOD-001`.
IDs sao sequenciais dentro de cada dimensao, resetados por relatorio.

**Arquivo**
Caminho relativo a raiz do projeto. NUNCA generico ("varios arquivos").
Se afetar multiplos arquivos, criar uma sugestao para o arquivo mais representativo e notar "Afeta tambem: arquivo2.ext, arquivo3.ext" na descricao do problema.

**Linha**
Numero de linha ou range (ex: `42`, `42-58`).
Use `N/A` apenas para problemas estruturais (ex: "falta de testes", "ausencia de arquivo de config").

**Dimensao**
Categoria da analise que originou o finding. Valores fixos:
- `UX` -- Usabilidade, acessibilidade, experiencia do usuario
- `Performance` -- Velocidade, eficiencia, otimizacao
- `Modernidade` -- Padroes atuais, dependencias, compatibilidade
- `Codigo` -- Qualidade, legibilidade, manutencao
- `Ideias` -- Features novas, melhorias funcionais

Um finding pode ter tag secundaria entre parenteses: `Performance (UX)` se impacta ambas dimensoes.

**Esforco**
Estimativa de trabalho para implementar:
- `P` (Pequeno) -- Menos de 30 minutos. Rename, config, import, ajuste pontual.
- `M` (Medio) -- 30 minutos a 2 horas. Refatorar funcao, adicionar componente, ajustar modulo.
- `G` (Grande) -- Mais de 2 horas. Reescrever modulo, migrar dependencia, reestruturar.

Se Esforco=G, a justificativa DEVE aparecer no campo Sugestao.

**Impacto**
Beneficio esperado se implementado:
- `P` (Pequeno) -- Melhoria marginal, nice-to-have.
- `M` (Medio) -- Melhoria notavel para usuario ou desenvolvedor.
- `G` (Grande) -- Melhoria critica, resolve dor real.

### Campo Obrigatorio Condicional

**Problema**
DEVE conter evidencia concreta: trecho de codigo, metrica, sintoma observavel.
NAO aceitar descricoes vagas como "codigo poderia melhorar" ou "nao esta bom".

**Sugestao**
DEVE ser acao implementavel. Incluir exemplo de codigo quando possivel.
NAO aceitar "considerar melhorar X" -- deve ser "trocar X por Y porque Z".

### Campo Opcional (Recomendado)

**Referencia**
Padrao, documentacao ou best practice que fundamenta a sugestao.
Exemplos: "React docs: useMemo", "Web Vitals: CLS", "OWASP Top 10: A03", "MDN: Intersection Observer".

</field_definitions>

<guidelines>

### Orientacoes de Preenchimento

- Cada agente auditor produz uma lista de sugestoes neste formato
- IDs sao sequenciais dentro de cada dimensao, resetados por relatorio
- Sugestoes devem ser autocontidas -- quem le uma sugestao individual entende o problema e a solucao sem contexto externo
- Se uma sugestao depende de outra, referenciar o ID: "Prerequisito: PERF-001"
- Maximo 1 sugestao por bloco. Nunca agrupar problemas distintos
- Se o mesmo padrao aparece em N arquivos, criar 1 sugestao para o arquivo mais representativo e notar "Afeta tambem: arquivo2.ext, arquivo3.ext" na descricao do problema
- Ordenar sugestoes por impacto decrescente dentro de cada dimensao

### Exemplo Completo

```markdown
### PERF-003: Re-render desnecessario em lista de produtos

| Campo | Valor |
|-------|-------|
| Arquivo | `src/components/ProductList.tsx` |
| Linha | 24-38 |
| Dimensao | Performance (UX) |
| Esforco | P |
| Impacto | M |

**Problema:** O componente `ProductList` recria o array filtrado a cada render porque `products.filter()` e chamado diretamente no JSX (linha 31). Com 500+ produtos, causa jank visivel ao digitar no campo de busca.

**Sugestao:** Envolver o filtro em `useMemo` com dependencia em `[products, searchTerm]`:
\```tsx
const filtered = useMemo(
  () => products.filter(p => p.name.includes(searchTerm)),
  [products, searchTerm]
);
\```

**Referencia:** React docs: useMemo -- https://react.dev/reference/react/useMemo
```

</guidelines>

<anti_patterns>

### Anti-padroes (Sugestoes Invalidas)

Estes padroes tornam uma sugestao invalida e devem ser corrigidos antes de incluir no relatorio:

1. **Sugestao sem arquivo concreto**
   Invalido: "O projeto deveria usar TypeScript"
   Valido: "src/utils/helpers.js linha 12 -- funcao `parseDate` sem tipagem causa erro silencioso em input invalido"

2. **Problema vago**
   Invalido: "O codigo pode melhorar"
   Valido: "Funcao `calculateTotal` (linha 45) usa loop aninhado O(n^2) para lookup que poderia ser O(1) com Map"

3. **Sugestao vaga**
   Invalido: "Considerar refatorar"
   Valido: "Extrair logica de validacao das linhas 23-67 para funcao `validateOrder()` -- reduz complexidade ciclomatica de 12 para 4"

4. **Esforco/impacto sem justificativa para G**
   Invalido: Esforco=G sem explicar por que no campo Sugestao
   Valido: Esforco=G com "Requer migrar de Moment.js para date-fns em 14 arquivos, incluindo formatacao de datas no backend"

5. **Sugestao duplicada entre dimensoes**
   Se performance e modernidade encontram o mesmo problema, uma dimensao cria a sugestao e a outra referencia via ID: "Ver PERF-005"

</anti_patterns>
