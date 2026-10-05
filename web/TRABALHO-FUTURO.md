# Trabalho futuro

Ideias e pedidos deixados para depois, complementares ao projeto. Cada entrada diz de onde veio,
o que se quer e o que já existe no código para lhe pegar. Nada disto está implementado.

## 1. Voz livre com acompanhamento sintético de guitarra (módulo opcional, primeiro só no fado)

**Pedido:** criar um módulo opcional para a **voz livre**. É a melodia que não se acompanha a si
mesma (não é um cânone, as outras vozes não repetem a mesma linha). Começa só no fado, com um
**acompanhamento sintético de guitarra**: a guitarra portuguesa e a viola (guitarra clássica),
como num fado real.

**O que a pesquisa já diz** ([`results/fado/pesquisa.md`](results/fado/pesquisa.md),
[`results/fado/harmonias.csv`](results/fado/harmonias.csv)):

- **Harmonia:** nos fados primitivos (Menor, Corrido, Mouraria) é I (2 compassos) – V7 (4) – I (2).
  Nos fados de autor, os dois primeiros versos fazem i–V7 / V7–i; o terceiro sai para a
  subdominante (I7 → iv) ou para a relativa maior (VII7 → III); o remate é i V7 i. Coimbra passa
  ao maior homónimo.
- **Viola:** marca o tempo e a harmonia, com o baixo no tempo forte e o acorde no fraco, e
  passagens de baixo entre acordes. Ernesto Vieira (1890) descreve um acompanhamento arpejado em
  semicolcheias.
- **Guitarra portuguesa:**
  - responde à voz, comenta ou intensifica o que acabou de ser cantado;
  - toca sobretudo **nas respirações** entre os versos e na introdução, e por baixo da voz em
    notas longas;
  - faz trinados, contracantos e variações (as «guitarradas» são o repertório instrumental).
- **Rubato:** as guitarras mantêm o tempo e a voz atrasa-se ou adianta-se. Num acompanhamento
  sintético, o tempo é o das guitarras.

**Como poderia ser:**

1. **Harmonia por verso:** dado o fado gerado, escolher os acordes por verso com o esquema
   alternado que a aptidão já pede.
   - O que já existe: `cadence: 'alternate'` em [`src/fitness/styles.js`](src/fitness/styles.js),
     com os fins de verso suspensos na dominante e o repouso na tónica.
   - Confirmar cada acorde com as notas longas da melodia, com o mesmo critério das tríades em
     `heuristics.js`.
2. **Viola:** baixo nos tempos 1 (e 3 em 4/4) e acorde nos tempos fracos. No 2/4 do fado corrido,
   baixo–acorde a cada colcheia. Passagem de baixo por grau conjunto antes de cada mudança de
   acorde.
3. **Guitarra portuguesa:**
   - nas respirações, uma resposta curta: um motivo de 1 a 2 tempos derivado do fim do verso
     cantado, transposto ou invertido;
   - por baixo da voz, notas longas do acorde ou silêncio;
   - uma introdução de 2 a 4 compassos com o motivo inicial.
   - Isto pode usar o mesmo algoritmo genético, com uma aptidão de contracanto. As regras de
     `canon.js` (consonância, movimento contrário, não cobrir a voz) servem de ponto de partida.
4. **Síntese:**
   - a guitarra portuguesa com um preset próprio em [`src/ui/audio.js`](src/ui/audio.js): 12
     cordas metálicas em pares, ataque brilhante e decaimento rápido, com um ligeiro desafinar
     entre as cordas do par;
   - a viola com o preset `pluck` mais grave;
   - no MIDI, os programas GM 24/25 (guitarra de nylon / aço) ou 105 (banjo, o mais próximo do
     timbre metálico).
5. **Partitura:** as guitarras numa pauta à parte (ou cifras por cima da voz) e uma opção «voz
   livre» no Início rápido e nas vozes.
6. **Depois do fado:** cada família de estilos pode ter o seu acompanhamento: o baixo de Alberti
   no clássico, o *stride* no jazz, o bordão nas canções.

**Ligações úteis:**

- o esquema harmónico de cada fado em `results/fado/harmonias.csv`;
- a dinâmica da voz em [`src/core/expression.js`](src/core/expression.js), que o acompanhamento
  deve seguir em *forte* no último verso (Sergl, `F13` em
  [`results/estilos/literatura.csv`](results/estilos/literatura.csv));
- a análise de áudio em [`tools/fado_audio.py`](tools/fado_audio.py), que separa a voz das guitarras
  pela forma como o som decai e pode medir onde as guitarras tocam (nas respirações ou por baixo
  da voz).

## 2. Início rápido com o fado

Pedido do utilizador, deixado para depois da secção do fado:

1. **Compassos e modo:** com o fado escolhido, bloquear os compassos que não são do fado (só 2/4 e
   4/4; o ternário só no fado de Coimbra) e fixar o modo pelo grupo: fado triste em menor, fado
   alegre em maior.
2. **Ondas:** mostrar a cinzento, para desencorajar sem proibir, as ondas que contrariam a frase de
   fado: a caótica e as três ondas. O verso de fado sobe cedo ao ápice e desce para a nota
   suspensa.
3. **Segunda voz:** sugerir uma voz uma oitava ou uma quinta abaixo, para deixar a voz brilhar.
   - A voz grave afasta-se em frequência e não tapa a melodia.
   - O ideal é que entre nas respirações, como a guitarra. O ponto 1 (voz livre) é a versão
     completa desta ideia.

## 3. Áudio real para a dinâmica do fado

- [`tools/fado_audio.py`](tools/fado_audio.py) mede a dinâmica da voz em gravações: o nível no
  início e no fim de cada verso, o ápice, o esmorecer da nota suspensa, o vibrato e os acentos.
- Neste ambiente a rede bloqueia o YouTube e o archive.org, por isso ainda não correu sobre
  gravações reais.
- A coleção sugerida pelo utilizador, https://archive.org/details/fados (inclui o Zeca Afonso),
  fica pronta a analisar quando a rede o permitir, com `archive.org` e `*.us.archive.org` nos
  domínios autorizados.
- Com os números medidos, recalibrar os perfis `sad` e `happy` de `src/core/expression.js`: a
  descida ao longo do verso, o esmorecer da nota suspensa, o vibrato e o forte da última estrofe.
