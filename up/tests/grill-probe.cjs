/**
 * grill-probe.cjs: sonda de comportamento do modo grill (fase 15, plano 004).
 * Roda: node up/tests/grill-probe.cjs --caso <parada|entrada|precedencia|classifica-grill|classifica-trivial> [--doutrina <caminho>]
 *
 * Monta um prompt com (a) o conteudo integral da doutrina sob teste, (b) uma linha de
 * enquadramento, (c) uma transcricao fabricada do caso escolhido, e (d) a instrucao final pedindo
 * APENAS a proxima mensagem ao dono. Chama o runtime do Claude em modo de impressao com modelo
 * economico, por execucao de arquivo com lista de argumentos (nunca interpolacao em shell), e
 * julga a resposta bruta por regra determinística escrita neste arquivo. Nao pede ao modelo para
 * avaliar a propria resposta, e nao usa um segundo modelo como juiz: o juiz e a regra escrita,
 * conferida por quem revisa este arquivo.
 *
 * Codigo de saida: 0 quando todas as assercoes do caso passam, 1 quando alguma assercao falha
 * (a sonda RODOU, mas reprovou), 2 quando a sonda nao pode rodar (executavel ausente, doutrina
 * ausente, tempo esgotado). Codigo 2 nunca deve ser lido como aprovacao.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

// up/tests -> up -> raiz do repo.
const ROOT = path.resolve(__dirname, '..', '..');
const DOUTRINA_PADRAO = path.join(ROOT, 'up/skills/up-brainstorm/grill.md');
const TIMEOUT_MS = 180000;
const CLAUDE_BIN = 'claude';
const CLAUDE_MODEL = 'fable'; // modelo economico deste runtime

const FRASES_PROIBIDAS = [
  'tem certeza',
  'posso fechar',
  'quer que eu resuma',
  'só mais uma pergunta',
  'antes de fechar',
  'confirma que',
];

const TRANSCRICOES = {
  // Caso 1: tres perguntas em ordem de dependencia, o dono responde as duas primeiras e manda
  // parar no lugar da resposta da terceira.
  parada: `A conversa abaixo ja aconteceu. Continue exatamente a partir do ultimo turno do dono, sem
repetir nada do que ja foi dito.

Dono: Quero exportar um relatorio em arquivo separado, disponivel no painel.

Agente:
[Q1] Depende de: nada
Pergunta: Onde o arquivo deve ser gerado?
Recomendo: No servidor.
Porque: Evita sobrecarregar o navegador do dono com relatorios grandes.
Opções: {No servidor} | {No navegador}

Dono: no servidor.

Agente:
[Q2] Depende de: Q1 (geração no servidor)
Pergunta: Como o arquivo deve ser entregue ao dono depois de gerado?
Recomendo: Download direto.
Porque: E o caminho mais simples pra quem so quer o arquivo na hora.
Opções: {Download direto} | {Enviar por e-mail}

Dono: download direto.

Agente:
[Q3] Depende de: Q2 (download direto)
Pergunta: Existe um teto de linhas por exportação?
Recomendo: Cinquenta mil linhas.
Porque: Protege contra uma exportação gigante travar o navegador do dono.
Opções: {Cinquenta mil} | {Sem teto}

Dono: chega`,

  // Caso 2: uma linha so, tarefa de um subsistema (classificacao pequena), sem palavra de parada
  // nem gatilho manual de grill.
  entrada: `A conversa abaixo ja aconteceu. Continue exatamente a partir do ultimo turno do dono.

Dono: Quero um filtro por data no painel de pedidos, pra eu conseguir ver so os pedidos de um
periodo especifico.`,

  // Caso 3: tarefa trivial (troca de texto de botao) mas o dono pede grill explicitamente.
  precedencia: `A conversa abaixo ja aconteceu. Continue exatamente a partir do ultimo turno do dono.

Dono: Troca o texto do botao "Enviar" pra "Confirmar pedido". Me grelha nessa, quero pensar bem
antes de mexer.`,

  // Caso 4 (RV-001): descricao de projeto que toca schema, API e autenticacao, sem nenhum gatilho
  // manual de grill e sem classificacao previa declarada. Prova que a heuristica de prosa embutida
  // no motor (nao o classify-task da CLI) sobe sozinha pra grill.
  'classifica-grill': `A conversa abaixo ja aconteceu. Continue exatamente a partir do ultimo turno
do dono, sem repetir nada do que ja foi dito.

Dono: Preciso refatorar a arquitetura inteira do modulo de pagamentos: muda o schema do banco, troca
a API de cobranca e adiciona autenticacao nova pra quem pode disparar reembolso.`,

  // Caso 5 (RV-001): tarefa de um arquivo, sem nenhuma decisao de arquitetura, schema, API ou auth.
  // Prova que a mesma heuristica de prosa continua em zero pergunta pra esse caso.
  'classifica-trivial': `A conversa abaixo ja aconteceu. Continue exatamente a partir do ultimo turno
do dono, sem repetir nada do que ja foi dito.

Dono: No arquivo components/Button.tsx, troca o texto do botao de "Enviar" pra "Confirmar pedido".
So isso, nada mais muda.`,
};

function parseArgs(argv) {
  const args = { caso: null, doutrina: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--caso') args.caso = argv[++i];
    else if (argv[i] === '--doutrina') args.doutrina = argv[++i];
  }
  return args;
}

function montarPrompt(doutrinaTexto, transcricao) {
  const enquadramento =
    'Você está conduzindo um brainstorm do UP em modo grill (perguntas ilimitadas, uma por vez, ' +
    'até uma das três portas de saída) e deve obedecer integralmente à doutrina acima, sem exceção.';
  const instrucaoFinal =
    'Produza APENAS a sua próxima mensagem ao dono, sem nenhum comentário sobre este exercício de ' +
    'prova, sem meta-discussão e sem repetir a doutrina.';
  return [doutrinaTexto.trim(), '', enquadramento, '', transcricao.trim(), '', instrucaoFinal].join(
    '\n'
  );
}

function contains(saida, frase) {
  return saida.toLowerCase().includes(frase.toLowerCase());
}

function assertivas(caso, saida) {
  if (caso === 'parada') {
    const fraseAchada = FRASES_PROIBIDAS.find((f) => contains(saida, f));
    return [
      {
        nome: 'sem frase de confirmação',
        ok: !fraseAchada,
        razao: 'encontrada frase proibida: "' + fraseAchada + '"',
      },
      {
        nome: 'sem pergunta nova de grill',
        ok: !/\[Q4\]/i.test(saida) && !/depende de:/i.test(saida),
        razao: 'saída contém "[Q4]" e/ou "Depende de:" (abriu pergunta nova)',
      },
      {
        nome: 'sem abrir o checkpoint',
        ok: !/fechar e seguir/i.test(saida) && !/mais perguntas/i.test(saida),
        razao: 'saída contém o controle de checkpoint ("Fechar e seguir" / "Mais perguntas")',
      },
      {
        nome: 'destila as decisões já fixadas',
        ok: contains(saida, 'servidor') && contains(saida, 'download'),
        razao: 'faltou "servidor" e/ou "download" na destilação',
      },
      {
        nome: 'pede aprovação do design',
        ok: /aprova|posso seguir|segue assim|de acordo/i.test(saida),
        razao: 'nenhuma marca de pedido de aprovação encontrada (aprova/posso seguir/segue assim/de acordo)',
      },
      {
        nome: 'declara o ponto em aberto',
        ok: /ponto em aberto|recomenda[çc][aã]o|assumi|n[aã]o confirmado/i.test(saida),
        razao: 'nenhuma marca do ponto em aberto encontrada (ponto em aberto/recomendação/assumi/não confirmado)',
      },
    ];
  }

  if (caso === 'entrada') {
    const qtdQ1 = (saida.match(/\[Q1\]/g) || []).length;
    const temQ2 = /\[Q2\]/.test(saida);
    return [
      {
        nome: 'exatamente um marcador [Q1] e nenhum [Q2]',
        ok: qtdQ1 >= 1 && !temQ2,
        razao: 'achou ' + qtdQ1 + ' ocorrência(s) de "[Q1]" e ' + (temQ2 ? 'contém' : 'não contém') + ' "[Q2]"',
      },
      {
        nome: 'contém a linha de dependência',
        ok: /depende de:/i.test(saida),
        razao: 'faltou "Depende de:"',
      },
      {
        nome: 'contém recomendação explícita',
        ok: /recomendo:/i.test(saida),
        razao: 'faltou "Recomendo:"',
      },
      {
        nome: 'sem checkpoint nem design pronto',
        ok:
          !/fechar e seguir|mais perguntas/i.test(saida) &&
          !/aprova|posso seguir|segue assim|de acordo/i.test(saida),
        razao: 'saída contém checkpoint ou pedido de aprovação de design (deveria ser só a pergunta)',
      },
    ];
  }

  if (caso === 'precedencia') {
    return [
      {
        nome: 'contém [Q1] com linha de dependência',
        ok: /\[Q1\]/.test(saida) && /depende de:/i.test(saida),
        razao: 'faltou "[Q1]" e/ou "Depende de:" (deveria ter entrado em grill mesmo em tarefa trivial)',
      },
      {
        nome: 'sem anúncio de execução direta',
        ok: !/vou (trocar|alterar|implementar|mudar|fazer)|j[aá] (troquei|alterei|implementei|mudei|fiz)|\bpronto\b|\bfeito\b|executando agora/i.test(
          saida
        ),
        razao: 'saída anuncia execução direta em vez de perguntar primeiro',
      },
    ];
  }

  if (caso === 'classifica-grill') {
    return [
      {
        nome: 'entra em grill: contém [Q1] com linha de dependência',
        ok: /\[Q1\]/.test(saida) && /depende de:/i.test(saida),
        razao: 'faltou "[Q1]" e/ou "Depende de:" (deveria ter subido pra grill: descrição toca schema, API e autenticação)',
      },
      {
        nome: 'sem anúncio de execução direta (não ficou em zero pergunta)',
        ok: !/vou (refatorar|mudar|trocar|implementar|migrar|fazer)|j[aá] (refatorei|troquei|implementei|mudei|migrei|fiz)|\bpronto\b|\bfeito\b|executando agora/i.test(
          saida
        ),
        razao: 'saída anuncia execução direta em vez de perguntar primeiro (ficou em zero pergunta)',
      },
    ];
  }

  if (caso === 'classifica-trivial') {
    return [
      {
        nome: 'não entra em grill: sem [Q1] e sem linha de dependência',
        ok: !/\[Q1\]/.test(saida) && !/depende de:/i.test(saida),
        razao: 'saída contém "[Q1]" e/ou "Depende de:" (deveria ter ficado em zero pergunta: 1 arquivo, sem decisão de arquitetura)',
      },
      {
        nome: 'anuncia e executa em uma linha',
        ok: /zero pergunta|sigo direto|vou (trocar|mudar|alterar|atualizar)|\btroc(o|hei)\b|\balter(o|ei)\b|\batualiz(o|ei)\b|\bpronto\b|\bfeito\b/i.test(
          saida
        ),
        razao: 'saída não anuncia execução direta (esperado: anúncio de 1 linha seguido de execução, sem pergunta)',
      },
    ];
  }

  throw new Error('caso desconhecido: ' + caso);
}

function main() {
  const { caso, doutrina } = parseArgs(process.argv.slice(2));

  if (!caso || !TRANSCRICOES[caso]) {
    console.error(
      'SONDA NAO EXECUTAVEL: uso invalido. node up/tests/grill-probe.cjs --caso <parada|entrada|precedencia> [--doutrina <caminho>]'
    );
    process.exit(2);
  }

  const doutrinaPath = doutrina ? path.resolve(doutrina) : DOUTRINA_PADRAO;
  let doutrinaTexto;
  try {
    doutrinaTexto = fs.readFileSync(doutrinaPath, 'utf8');
  } catch (e) {
    console.error('SONDA NAO EXECUTAVEL: doutrina nao encontrada em ' + doutrinaPath + ' (' + e.message + ')');
    process.exit(2);
  }

  const prompt = montarPrompt(doutrinaTexto, TRANSCRICOES[caso]);

  let tmpFile;
  try {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grill-probe-'));
    tmpFile = path.join(tmpDir, 'prompt-' + caso + '.txt');
    fs.writeFileSync(tmpFile, prompt, 'utf8');
  } catch (e) {
    tmpFile = '(falha ao gravar arquivo temporario: ' + e.message + ')';
  }
  console.log('CASO: ' + caso);
  console.log('DOUTRINA: ' + doutrinaPath);
  console.log('PROMPT salvo em: ' + tmpFile);

  const disponivel = spawnSync('which', [CLAUDE_BIN], { encoding: 'utf8' });
  if (disponivel.status !== 0) {
    console.error('SONDA NAO EXECUTAVEL: executavel "' + CLAUDE_BIN + '" nao encontrado no PATH');
    process.exit(2);
  }

  // O prompt vai por stdin, nunca como argumento posicional: a doutrina sob teste pode comecar com
  // "---" (front matter YAML de skill), e um argumento que comeca com hifen e lido como opcao pelo
  // parser de linha de comando do runtime, mesmo dentro de uma lista de argumentos (sem shell). Ler
  // de stdin evita esse problema sem alterar uma unica letra da doutrina.
  const resultado = spawnSync(CLAUDE_BIN, ['-p', '--model', CLAUDE_MODEL], {
    input: prompt,
    encoding: 'utf8',
    timeout: TIMEOUT_MS,
    maxBuffer: 20 * 1024 * 1024,
  });

  if (resultado.error) {
    console.error('SONDA NAO EXECUTAVEL: ' + resultado.error.message);
    process.exit(2);
  }
  if (resultado.signal) {
    console.error('SONDA NAO EXECUTAVEL: processo encerrado pelo sinal ' + resultado.signal + ' (provavel tempo limite de ' + TIMEOUT_MS / 1000 + 's excedido)');
    process.exit(2);
  }
  if (resultado.status !== 0) {
    console.error('SONDA NAO EXECUTAVEL: "' + CLAUDE_BIN + '" saiu com codigo ' + resultado.status);
    console.error('stderr: ' + (resultado.stderr || '').slice(0, 2000));
    process.exit(2);
  }

  const saida = (resultado.stdout || '').trim();
  console.log('--- RESPOSTA BRUTA DO MODELO ---');
  console.log(saida);
  console.log('--- FIM DA RESPOSTA ---');

  const checks = assertivas(caso, saida);
  let falhas = 0;
  for (const c of checks) {
    if (c.ok) {
      console.log('  ok    - ' + c.nome);
    } else {
      console.log('  FALHA - ' + c.nome + ': ' + c.razao);
      falhas++;
    }
  }

  console.log('\ngrill-probe [' + caso + ']: ' + (checks.length - falhas) + '/' + checks.length + ' asserções passaram');
  process.exit(falhas > 0 ? 1 : 0);
}

main();
