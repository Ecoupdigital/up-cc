# Fronteiras de teste (seams)

Referencia operacional carregada sob demanda pelo planejador, pelo executor e pelo gate
`plan-ready`. Define ONDE o teste encosta no sistema. A reference irma
`tdd-evidence-types.md` define QUAL prova; esta define o LUGAR.

---

## O que e uma fronteira de teste

Uma fronteira de teste e o contrato publico onde o teste encosta no sistema.

## Como nomear

Sempre por contrato publico, nunca por caminho de arquivo. Tipos aceitos:

| Tipo | Significado | Exemplo |
|------|-------------|---------|
| `modulo` | modulo exportado e suas funcoes publicas | `parseApprovalLine` (API do leitor de aprovacoes) |
| `interface` | contrato de tipo ou de formato | frontmatter do plano pronto |
| `comando` | comando de linha de comando invocado como subprocesso | `node up/bin/up-tools.cjs gate ...` |
| `rota` | rota de rede | `POST /api/auth/login` |

Caminho de arquivo nao e contrato publico: envelhece no primeiro refactor e por isso e recusado
pela verificacao (`gate plan-ready`).

## As tres regras

1. **Existente vence nova.** Preferir a fronteira que ja existe no codigo a inventar outra.
2. **Mais alta vence mais baixa.** Preferir a superficie publica mais alta que o teste consegue executar.
3. **O numero ideal e UM.** Mais de uma fronteira exige justificativa escrita na propria entrada.

## Formato do campo

Bloco YAML no frontmatter do plano pronto:

```yaml
seams:
  - contrato: "subcomando da CLI de ferramentas do UP, invocado como subprocesso com JSON em stdout"
    tipo: comando
    estado: existente
    nivel: "superficie publica mais alta do sistema que um teste consegue executar"
    justificativa: ""
```

Chaves: `contrato`, `tipo` (`modulo` | `interface` | `comando` | `rota`), `estado`
(`existente` | `nova`), `nivel`, `justificativa` (obrigatoria quando ha mais de uma fronteira).

## Exemplo bom e ruim (mesmo cenario)

Cenario: testar a leitura do historico do log de aprovacoes.

**Bom (uma fronteira, contrato publico, existente, alta):**

```yaml
seams:
  - contrato: "subcomando da CLI de ferramentas do UP, invocado como subprocesso com JSON em stdout"
    tipo: comando
    estado: existente
    nivel: "superficie publica mais alta executavel por teste"
    justificativa: ""
```

**Ruim (tres entradas, caminhos e detalhe interno, sem justificativa):**

```yaml
seams:
  - contrato: "up/bin/lib/gate.cjs"
    tipo: modulo
    estado: existente
    nivel: "arquivo interno"
    justificativa: ""
  - contrato: "parseApprovalLine"
    tipo: modulo
    estado: existente
    nivel: "funcao interna"
    justificativa: ""
  - contrato: "up/bin/up-tools.cjs"
    tipo: modulo
    estado: existente
    nivel: "arquivo"
    justificativa: ""
```

Por que cada linha e ruim:

- `up/bin/lib/gate.cjs`: nomeia caminho de arquivo (morre no refactor).
- `parseApprovalLine` sem o contrato do comando: desce abaixo do contrato publico (testa detalhe).
- Tres entradas sem justificativa: passa de uma sem justificar (espalha o teste).

## Regra de execucao (escalada)

A execucao fica proibida de criar fronteira de teste nao prevista no plano. Ao precisar de uma,
para e escala ao dono com a pergunta no formato do ciclo (pergunta, recomendacao e motivo), em
vez de inventar. Inventar fronteira em tempo de execucao devolve o sistema ao estado anterior,
com teste grudado no detalhe.

## Onde isto e verificado

Subcomando `gate plan-ready` (validacao do campo no plano pronto) e entrada
`evidence=seams:confirmed` no log de aprovacoes (confirmacao com o dono antes de planejar).
