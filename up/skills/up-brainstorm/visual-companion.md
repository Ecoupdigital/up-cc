# Companion visual (brainstorm)

Carregue isto quando o brainstorm tocar em algo visual (UI, layout, fluxo de telas, comparacao de opcoes). O Jonathan e visual: em tarefa de UI, ofereca por DEFAULT.

## Quando oferecer

Ofereca o companion visual se o topico envolve QUALQUER um:
- aparencia de tela, componente, layout, tema, design system
- comparar 2-3 opcoes de design lado a lado
- fluxo de navegacao (onde o usuario clica, pra onde vai)
- antes/depois de uma mudanca visual

NAO ofereca em: logica pura, schema de banco, API sem UI, script, automacao, glue.

## Como oferecer (regra dura)

O convite vai em UMA mensagem SOZINHA, sem nenhum outro conteudo junto (nem pergunta, nem design, nem codigo). O usuario precisa decidir sobre o visual sem ruido. Exemplo:

> Quer que eu gere um mockup rapido das opcoes de layout antes de a gente decidir? Posso montar 2-3 variacoes pra voce comparar na tela.

Espere a resposta. So depois siga com as perguntas do brainstorm.

## Como produzir o companion

Conforme o caso, do mais leve ao mais pesado:
1. **ASCII / wireframe em texto** dentro da propria conversa: rapido, zero dependencia, bom pra estrutura e hierarquia.
2. **Mockup HTML/CSS renderizado** via skill `image-creator` ou `gemini` (quando ja instaladas): bom pra cor, tipografia, sensacao real.
3. **Referencias da web** via skill `image-fetcher`: quando o usuario quer "algo no estilo de X".
4. **Comparacao A/B/C:** monte as variacoes lado a lado e peca o usuario escolher por numero (mesma logica de "multipla escolha preferida").

## Depois do visual

A escolha visual do usuario vira uma decisao travada no BRIEFING.md (secao de design/componentes). Os DESIGN-TOKENS extraidos (cores, espacamento, tipografia) alimentam o `up-arquiteto` e, na execucao, o `up-executor` (dominio frontend) e o `up-tester` (passe visual, baseline de consistencia).
