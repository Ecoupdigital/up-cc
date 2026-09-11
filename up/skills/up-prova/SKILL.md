---
name: up-prova
description: "Use antes de afirmar que um trabalho esta pronto, corrigido, funcionando ou passando, e ao decidir que prova rodar para uma mudanca. Uma prova por tipo de codigo (teste, captura ou smoke), rodada nesta sessao, lida antes de afirmar."
---

# UP Prova

Uma regra: **nenhuma afirmacao de pronto sem prova fresca nesta sessao.** Rode o comando, leia a saida, so entao afirme. "Deveria passar" e "rodei antes" nao contam.

## A prova certa por tipo

O tipo da mudanca decide a prova. Escolha uma, rode uma. Nao empilhe.

| Tipo de mudanca | Prova | O que conta |
|-----------------|-------|-------------|
| Logica, parser, calculo, API propria, bugfix | Teste automatizado | Runner com 0 falhas no comportamento-alvo. Bugfix: o teste reproduz o bug antes do fix |
| UI, CSS, layout, pagina | Captura de tela | Screenshot depois da mudanca (Playwright ou o dev server na tela). Antes/depois quando a mudanca e visual |
| Integracao externa (API de terceiro, webhook, banco, pagamento) | Smoke-test | Uma chamada real ou em sandbox com a resposta esperada |

Mudanca que mistura tipos leva uma prova por tipo. Projeto sem suite de teste nao ganha suite so pra provar um ajuste: use a prova mais barata que exercita o comportamento (smoke ou captura) e diga isso.

O valor esperado de um teste vem de fonte independente (literal conhecido, exemplo feito a mao, o requisito), nunca recomputado do mesmo jeito que o codigo. Teste que recomputa passa por construcao e nao prova nada.

## Onde a prova fica

- Na sessao: o comando rodado e a saida lida, na mesma mensagem em que voce afirma pronto.
- No resumo do plano (`SUMMARY.md`) ou da tarefa rapida: secao `## Prova` com o comando, o resultado e o tipo. E o unico registro que o build le.

## O que nao vale

| Afirmacao | Nao basta |
|-----------|-----------|
| "Testes passam" | rodou antes, deveria passar |
| "Bug corrigido" | mudei a linha certa |
| "UI ajustada" | o CSS parece certo |
| "Integracao funciona" | o endpoint existe |
| "Subagente concluiu" | o agente relatou sucesso (confie no diff, nao no relato) |

Excecoes, so com o dono ciente: prototipo descartavel, codigo gerado, arquivo de config.
