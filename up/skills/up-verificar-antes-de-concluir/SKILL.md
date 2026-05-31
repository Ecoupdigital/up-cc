---
name: up-verificar-antes-de-concluir
description: "Use quando estiver prestes a afirmar que um trabalho esta completo, corrigido, funcionando ou passando. Exige rodar o comando de prova e confirmar a saida ANTES de qualquer afirmacao de sucesso. Evidencia antes de afirmacao, sempre."
---

# UP Verificar Antes de Concluir

**Lei de Ferro:** NENHUMA AFIRMACAO DE CONCLUSAO SEM EVIDENCIA FRESCA NESTA MENSAGEM.

Se voce nao rodou o comando de prova NESTA mensagem, voce nao pode afirmar que passa. Afirmar conclusao sem verificar e desonestidade, nao eficiencia.

## A funcao de gate

Antes de afirmar qualquer status ou expressar satisfacao:

1. **IDENTIFIQUE:** qual comando prova essa afirmacao?
2. **RODE:** execute o comando COMPLETO (fresco, inteiro).
3. **LEIA:** saida inteira, exit code, conte as falhas.
4. **VERIFIQUE:** a saida confirma a afirmacao?
5. **SO ENTAO:** faca a afirmacao.

Pulou um passo = mentir, nao verificar.

## Afirmacao -> exige -> nao basta

| Afirmacao | Exige | NAO basta |
|-----------|-------|-----------|
| "Testes passam" | Saida do comando: 0 falhas | "rodou antes" / "deveria passar" |
| "Bug corrigido" | Repro falha antes, passa depois | "mudei a linha certa" |
| "UI ajustada" | Captura visual depois (Playwright) | "o CSS parece certo" |
| "Integracao funciona" | Smoke-test com resposta real | "o endpoint existe" |
| "Subagente concluiu" | Diff do VCS mostra as mudancas | "o agente relatou sucesso" |
| "Pronto" | Todas as provas acima do tipo certo | satisfacao |

Confie no diff do VCS, nao no relatorio. Subagente terminou rapido demais? Inspecione o codigo de verdade.

A prova exigida por tipo (logic=teste red-green / ui=captura / glue=smoke) e o campo `evidence=<tipo>:<resultado>` que o gate de fase le no `approvals.log` estao na ref `tdd-evidence-types`. O `up-revisor` so APROVA com a `evidence=` do tipo certo logada.

## Red flags (racionalizacoes que matam o atalho)

- "Isso e obviamente certo, nao preciso rodar." -> Rode.
- "Ja rodei algo parecido antes." -> Saida antiga nao prova esta mudanca.
- "Vou expressar satisfacao" ("Otimo!", "Perfeito!", "Pronto!") antes de verificar. -> PARE. Verifique primeiro.
- "E so um ajuste pequeno." -> Pequeno tambem quebra. Prove.
- "Violar a letra da regra e violar o espirito da regra." Nao ha "estou seguindo o espirito".

## Cultura anti-bajulacao

Honestidade e valor central. Proibido bajular ("voce tem toda razao", "otimo ponto") ou agradecer feedback antes de verifica-lo contra o codebase. Acao fala: declare a correcao, nao o agradecimento. Se um review aponta erro, cheque se e tecnicamente correto PARA ESTE codebase antes de implementar. Se voce estava errado, corrija sem desculpa longa.
