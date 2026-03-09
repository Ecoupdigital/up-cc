# UP: Agentes de Auditoria e Ideias

## O que e Isso

Dois novos comandos para o sistema UP (`up-cc`): `/up:melhorias` e `/up:ideias`. O primeiro faz auditoria completa do codigo existente do ponto de vista do usuario final, identificando problemas de UX, performance e modernidade com sugestoes estruturadas. O segundo sugere novas features baseado na analise do codigo e pesquisa de mercado/concorrentes. Ambos sao standalone (nao exigem `/up:novo-projeto`) e geram relatorio + fases no roadmap.

## Valor Central

Garantir cobertura completa do codebase (todo arquivo analisado, com mapa de cobertura) e sugestoes concretas e acionaveis (arquivo, linha, problema, solucao, esforco, impacto).

## Requisitos

### Validados

<!-- Inferidos do codebase existente -- ja funcionam em producao -->

- [x] Sistema UP com 19 comandos, 8 agentes, 2 hooks publicado no npm
- [x] Padrao de agentes paralelos (usado em mapear-codigo e pesquisador-projeto)
- [x] Padrao command → workflow → agent estabelecido
- [x] CLI tools para gerenciamento de estado (.plano/)
- [x] Installer multi-runtime (Claude, Gemini, OpenCode)
- [x] Suporte brownfield com deteccao automatica e codebase map

### Ativos

<!-- Novos objetivos para este trabalho -->

- [ ] MELH-01: Comando `/up:melhorias` standalone que analisa codebase completo
- [ ] MELH-02: Agentes paralelos por dimensao: UX/navegabilidade, performance, modernidade
- [ ] MELH-03: Sintetizador que cruza insights entre dimensoes e valida conflitos
- [ ] MELH-04: Mapa de cobertura obrigatorio (lista todo arquivo analisado + % cobertura)
- [ ] MELH-05: Formato estruturado por sugestao (arquivo, linha, problema, sugestao, esforco, impacto)
- [ ] MELH-06: Matriz esforco x impacto para priorizacao das sugestoes
- [ ] MELH-07: Geracao automatica de fases no roadmap a partir das sugestoes aprovadas
- [ ] IDEIA-01: Comando `/up:ideias` standalone que sugere features novas
- [ ] IDEIA-02: Pesquisa de concorrentes/mercado via web + analise do codigo
- [ ] IDEIA-03: Perspectiva do usuario final (se colocar no lugar de quem usa)
- [ ] IDEIA-04: Geracao de fases no roadmap a partir das ideias aprovadas

### Fora do Escopo

- Navegacao em browser (Playwright) -- analise estatica de CSS/HTML/componentes e suficiente
- Acessibilidade (ARIA, screen readers) -- pode ser adicionado depois como dimensao extra
- Testes automatizados das sugestoes -- o agente sugere, humano decide
- Execucao automatica das melhorias -- gera roadmap, execucao e via /up:executar-fase

## Contexto

**Codebase existente mapeado em:** .plano/codebase/

- **Stack:** Node.js (CommonJS), zero deps, meta-prompting system
- **Arquitetura:** Commands → Workflows → Agents → CLI Tools (7 camadas)
- **Convencoes:** Ver .plano/codebase/CONVENTIONS.md
- **Divida tecnica:** Init EN/PT desalinhado, up-tools monolitico, zero testes UP
- **Testes:** Apenas GSD tem testes, UP sem cobertura

**Padrao a seguir:**
- `/up:mapear-codigo` como referencia de agentes paralelos que escrevem docs direto
- Cada agente recebe foco especifico, analisa arquivos relevantes, escreve documento estruturado
- Sintetizador consolida e cruza insights

**Analise estatica (sem browser):**
- CSS/SCSS: responsividade, contraste, hierarquia visual, animacoes, media queries
- HTML/JSX/componentes: fluxos de navegacao, hierarquia, formularios, feedback ao usuario
- Dependencias: versoes, alternativas modernas, bundles
- Codigo: patterns de performance (re-renders, queries, lazy loading, caching)

## Restricoes

- **Stack**: Node.js CommonJS, zero deps (padrao UP)
- **Formato**: Markdown com YAML frontmatter (commands, agents, workflows)
- **Idioma**: User-facing em portugues brasileiro
- **Compatibilidade**: Funcionar em Claude Code, Gemini CLI, OpenCode

## Decisoes-Chave

| Decisao | Justificativa | Resultado |
|---------|---------------|-----------|
| Dois comandos separados (/up:melhorias e /up:ideias) | Melhorias analisa o existente, ideias sugere o novo -- escopos distintos | Pendente |
| Agentes paralelos + sintetizador (hibrido) | Cobertura completa por dimensao + cruzamento de insights | Pendente |
| Standalone (sem /up:novo-projeto) | Baixa barreira de entrada, cria .plano/ se nao existir | Pendente |
| Analise estatica sem browser | CSS/HTML/componentes dao contexto suficiente de UX | Pendente |
| Mapa de cobertura obrigatorio | Garantir que nenhum arquivo relevante foi ignorado | Pendente |
| Formato estruturado por sugestao | Arquivo, linha, problema, sugestao, esforco, impacto -- acionavel | Pendente |
| Matriz esforco x impacto | Priorizacao objetiva em quadrantes | Pendente |
| /up:ideias pesquisa web + codigo | Concorrentes e tendencias alem do que ja existe no codigo | Pendente |

---
*Ultima atualizacao: 2026-03-09 apos inicializacao*
