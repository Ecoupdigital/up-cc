<purpose>
Orquestrar agentes mapeadores de codebase paralelos para analisar codebase e produzir documentos estruturados em .plano/codebase/

Cada agente tem contexto fresco, explora uma area de foco especifica, e **escreve documentos diretamente**. O orquestrador recebe apenas confirmacao + contagem de linhas, depois escreve um resumo.

Output: Pasta .plano/codebase/ com 7 documentos estruturados sobre o estado do codebase.
</purpose>

<philosophy>
**Por que agentes mapeadores dedicados:**
- Contexto fresco por dominio (sem contaminacao de tokens)
- Agentes escrevem documentos diretamente (sem transferencia de contexto de volta ao orquestrador)
- Orquestrador apenas resume o que foi criado (uso minimo de contexto)
- Execucao mais rapida (agentes rodam simultaneamente)

**Qualidade do documento acima de tamanho:**
Inclua detalhe suficiente para ser util como referencia. Priorize exemplos praticos (especialmente padroes de codigo) sobre brevidade arbitraria.

**Sempre inclua caminhos de arquivo:**
Documentos sao material de referencia para Claude ao planejar/executar. Sempre inclua caminhos reais com backticks: `src/services/user.ts`.
</philosophy>

<process>

<step name="check_existing">
Verifique se .plano/codebase/ ja existe.

```bash
ls -la .plano/codebase/ 2>/dev/null
```

**Se existir:**

```
.plano/codebase/ ja existe com estes documentos:
[Listar arquivos encontrados]

O que fazer?
1. Atualizar - Deletar existente e remapear codebase
2. Pular - Usar mapa existente como esta
```

Aguardar resposta do usuario.

Se "Atualizar": Deletar .plano/codebase/, continuar para create_structure
Se "Pular": Encerrar workflow

**Se nao existir:**
Continuar para create_structure.
</step>

<step name="create_structure">
Criar diretorio .plano/codebase/:

```bash
mkdir -p .plano/codebase
```

**Arquivos de saida esperados:**
- STACK.md (do mapeador tech)
- INTEGRATIONS.md (do mapeador tech)
- ARCHITECTURE.md (do mapeador arch)
- STRUCTURE.md (do mapeador arch)
- CONVENTIONS.md (do mapeador quality)
- TESTING.md (do mapeador quality)
- CONCERNS.md (do mapeador concerns)

Continuar para spawn_agents.
</step>

<step name="spawn_agents">
Spawnar 4 agentes up-mapeador-codigo paralelos.

Usar ferramenta Agent com `subagent_type="up-mapeador-codigo"` e `run_in_background=true` para execucao paralela.

**CRITICO:** Use o agente dedicado `up-mapeador-codigo`, NAO `Explore`. O agente mapeador escreve documentos diretamente.

**Agente 1: Foco Tech**

```
Agent(
  subagent_type="up-mapeador-codigo",
  run_in_background=true,
  description="Mapear stack de tecnologia",
  prompt="Foco: tech

Analise este codebase para stack de tecnologia e integracoes externas.

Escreva estes documentos em .plano/codebase/:
- STACK.md - Linguagens, runtime, frameworks, dependencias, configuracao
- INTEGRATIONS.md - APIs externas, bancos de dados, provedores de auth, webhooks

Explore profundamente. Escreva documentos diretamente usando templates. Retorne apenas confirmacao."
)
```

**Agente 2: Foco Arquitetura**

```
Agent(
  subagent_type="up-mapeador-codigo",
  run_in_background=true,
  description="Mapear arquitetura do codebase",
  prompt="Foco: arch

Analise a arquitetura e estrutura de diretorios deste codebase.

Escreva estes documentos em .plano/codebase/:
- ARCHITECTURE.md - Padrao, camadas, fluxo de dados, abstracoes, entry points
- STRUCTURE.md - Layout de diretorios, localizacoes chave, convencoes de nomeacao

Explore profundamente. Escreva documentos diretamente usando templates. Retorne apenas confirmacao."
)
```

**Agente 3: Foco Qualidade**

```
Agent(
  subagent_type="up-mapeador-codigo",
  run_in_background=true,
  description="Mapear convencoes do codebase",
  prompt="Foco: quality

Analise este codebase para convencoes de codigo e padroes de teste.

Escreva estes documentos em .plano/codebase/:
- CONVENTIONS.md - Estilo de codigo, nomeacao, padroes, tratamento de erros
- TESTING.md - Framework, estrutura, mocking, cobertura

Explore profundamente. Escreva documentos diretamente usando templates. Retorne apenas confirmacao."
)
```

**Agente 4: Foco Preocupacoes**

```
Agent(
  subagent_type="up-mapeador-codigo",
  run_in_background=true,
  description="Mapear preocupacoes do codebase",
  prompt="Foco: concerns

Analise este codebase para divida tecnica, problemas conhecidos e areas de preocupacao.

Escreva este documento em .plano/codebase/:
- CONCERNS.md - Divida tecnica, bugs, seguranca, performance, areas frageis

Explore profundamente. Escreva documento diretamente usando template. Retorne apenas confirmacao."
)
```

Continuar para collect_confirmations.
</step>

<step name="collect_confirmations">
Aguardar todos os 4 agentes completarem.

Ler output de cada agente para coletar confirmacoes.

**Formato de confirmacao esperado de cada agente:**
```
## Mapeamento Completo

**Foco:** {foco}
**Documentos escritos:**
- `.plano/codebase/{DOC1}.md` ({N} linhas)
- `.plano/codebase/{DOC2}.md` ({N} linhas)

Pronto para resumo do orquestrador.
```

**O que voce recebe:** Apenas caminhos de arquivo e contagem de linhas. NAO conteudo dos documentos.

Se algum agente falhou, note a falha e continue com documentos bem-sucedidos.

Continuar para verify_output.
</step>

<step name="verify_output">
Verificar se todos os documentos foram criados:

```bash
ls -la .plano/codebase/
wc -l .plano/codebase/*.md
```

**Checklist de verificacao:**
- Todos os 7 documentos existem
- Nenhum documento vazio (cada um deve ter >20 linhas)

Se documentos faltando ou vazios, note quais agentes podem ter falhado.

Continuar para scan_for_secrets.
</step>

<step name="scan_for_secrets">
**CHECAGEM DE SEGURANCA CRITICA:** Escanear arquivos de saida para segredos acidentalmente vazados antes de commitar.

```bash
grep -E '(sk-[a-zA-Z0-9]{20,}|sk_live_[a-zA-Z0-9]+|sk_test_[a-zA-Z0-9]+|ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|glpat-[a-zA-Z0-9_-]+|AKIA[A-Z0-9]{16}|xox[baprs]-[a-zA-Z0-9-]+|-----BEGIN.*PRIVATE KEY|eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.)' .plano/codebase/*.md 2>/dev/null && SECRETS_FOUND=true || SECRETS_FOUND=false
```

**Se SECRETS_FOUND=true:**
Alertar usuario e pausar antes do commit.

**Se SECRETS_FOUND=false:**
Continuar para commit.
</step>

<step name="commit_codebase_map">
Commitar o mapa do codebase:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs: mapear codebase existente" --files .plano/codebase/*.md
```

Continuar para offer_next.
</step>

<step name="offer_next">
Apresentar resumo de conclusao e proximos passos.

```bash
wc -l .plano/codebase/*.md
```

**Formato de saida:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > MAPEAMENTO COMPLETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Criado .plano/codebase/:
- STACK.md ([N] linhas) - Tecnologias e dependencias
- ARCHITECTURE.md ([N] linhas) - Design do sistema e padroes
- STRUCTURE.md ([N] linhas) - Layout de diretorios e organizacao
- CONVENTIONS.md ([N] linhas) - Estilo de codigo e padroes
- TESTING.md ([N] linhas) - Estrutura e praticas de teste
- INTEGRATIONS.md ([N] linhas) - Servicos externos e APIs
- CONCERNS.md ([N] linhas) - Divida tecnica e problemas

---

Proximo Passo

Inicializar projeto -- usar contexto do codebase para planejamento

`/up:novo-projeto`

---
```

Encerrar workflow.
</step>

</process>
