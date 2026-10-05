# O fado no algoritmo

Até aqui o estilo «fado» tinha quatro regras genéricas: a nota final longa, o âmbito, os graus
conjuntos e as pausas. Esta secção substitui-o por uma parte do algoritmo dedicada ao fado,
construída em quatro passos:

1. pesquisa reunida num ficheiro de apoio, antes de qualquer regra:
   [`fado/pesquisa.md`](fado/pesquisa.md);
2. medição de melodias reais de fado, ao lado do corpus do projeto;
3. confronto com as regras que o projeto já tinha;
4. regras novas, mudanças na aptidão e dinâmica, só para o fado.

Por sugestão do utilizador, o fado divide-se em dois grupos: o **fado triste**, em menor, e o
**fado alegre**, em maior. Não é sempre assim (há fados alegres em menor), mas é a divisão mais
segura.

## 1. Os dados

- **Partituras:** cinco melodias reais, da coleção
  [fadado/fado-scores](https://github.com/fadado/fado-scores) (LilyPond, domínio público, Joan
  Josep Ordinas Rosa):
  - Fado Adiça (Armandinho, maior, 4/4);
  - Fado Alberto (Miguel Ramos, menor, 4/4);
  - Coimbra (Raul Ferrão, menor → maior, 2/2);
  - Fado do Marujo (menor, 2/4);
  - Fado Pagem (menor, 4/4).
- **Escrito e cantado:** para Coimbra há também uma **transcrição de como é cantada**, com o
  rubato escrito.
- **Harmonias:** os esquemas de mais nove fados, em [`fado/harmonias.csv`](fado/harmonias.csv).
- **Leitura:** o leitor [`tools/fado_corpus.py`](../tools/fado_corpus.py) lê o LilyPond (modo
  relativo, nomes portugueses, tercinas, ligaduras, repetições) numa grelha de 24 divisões por
  semínima, onde as tercinas e as fusas são exatas.
- **Não redistribuição:** as notas não ficam no repositório (`data/fado-corpus.json` está no
  `.gitignore`); só ficam as estatísticas.
- **Comparação:** as 5727 melodias em 2/4 e 4/4 do corpus do projeto (canções e danças
  tradicionais europeias, corais).
- **Gravações:** não foi possível ouvir nenhuma. A rede deste ambiente bloqueia o YouTube e o
  archive.org. A secção 6 explica a ferramenta de áudio que ficou pronta para elas.

**Limites:** cinco melodias é uma amostra pequena. Os intervalos das regras foram escolhidos a
partir destas mesmas cinco, por isso a validação da secção 3 não é independente. O arquivo de 100
transcrições de Videira & Rosa (2017) seria o passo seguinte, mas está num servidor bloqueado.

## 2. O que distingue o fado (medido)

[`tools/fado_study.mjs`](../tools/fado_study.mjs) →
[`fado/comparacao.csv`](fado/comparacao.csv) e [`fado/frases.csv`](fado/frases.csv).

Uma **frase** (um verso) é o grupo de notas entre duas respirações, isto é, pausas de colcheia ou
mais. Na tabela, «percentil» é a posição da mediana dos fados entre as melodias do corpus (50 =
típico, 99 = quase nenhuma melodia do corpus tem tanto).

| Medida | Fados: mín. / mediana / máx. | Corpus: P10 / P50 / P90 | Percentil |
|---|---|---|---|
| Síncopas por compasso | 0 / 0,43 / 0,49 | 0 / 0 / 0,06 | **99** |
| Pausas (respirações), parte do tempo | 2 % / 11 % / 25 % | 0 / 0 / 7 % | **97** |
| Sensível (7.º grau elevado, menor) | 0 / 1,7 % / 7 % | 0 / 0 / 0 | **95** |
| Nota final do verso × as outras | 2,8 / 3,2 / 4,8 | 1,0 / 1,8 / 3,1 | **91** |
| Nota final do verso antecipada (fora do tempo) | 0 / 36 % / 83 % | 0 / 0 / 0 | **92** |
| Corridas rápidas que levam a uma nota longa | 0 / 8 % / 17 % | 0 / 0 / 0 | **91** |
| Notas longas (mínima ou mais) | 2 % / 9 % / 29 % | 0 / 0 / 12 % | 85 |
| Graus conjuntos a descer | 67 % / 73 % / 76 % | 39 % / 57 % / 79 % | 83 |
| Notas repetidas (recitação) | 8 % / 26 % / 37 % | 4 % / 16 % / 36 % | 76 |
| Verso que chega à nota final por grau a descer | 25 % / 68 % / 83 % | 0 / 33 % / 100 % | 70 |
| Notas por tempo | 0,6 / 1,07 / 1,74 | 0,94 / 1,59 / 2,26 | **19** |
| Notas por verso | 7,6 / 11,5 / 23 | 11 / 31 / 112 | **12** |

**Em resumo, o verso de fado:**

- tem 7 a 12 notas: um verso de 7 sílabas, quase silábico, recitado muitas vezes numa nota
  repetida;
- começa depois do tempo forte e desce por graus;
- chega a uma **nota longa, suspensa**, por um grau a descer (o «suspiro»), muitas vezes cantada
  meio tempo antes do tempo (antecipação, síncopa);
- respira antes do verso seguinte.

**Fins de verso** (graus da nota final; [`fado/frases.csv`](fado/frases.csv)):

| Fado | Graus |
|---|---|
| Adiça | 6 5 6 5 5 5 5 **1** |
| Alberto | 2 ♭3 4 ♭3 2 **1** |
| Pagem | ♭6 5 4 5 ♭6 5 4 1 1 2 5 5 ♭3 1 ♭6 2 1 4 ♭3 ♭3 2 **1** |

A tónica aparece sobretudo no fim da estrofe; os outros versos ficam suspensos no 2.º, no 4.º ou
no 5.º grau. Isto acompanha a harmonia dos 11 fados, que alterna i–V7 / V7–i e só repousa no fim
([`fado/harmonias.csv`](fado/harmonias.csv)). O **♭6 que resolve no 5.º** é uma apojatura de
«dor» que aparece no Pagem e no Coimbra cantado.

**Notas rápidas:** as corridas de semicolcheias são raras (no máximo 0,16 por compasso). Quando
aparecem, como nos 32 avos do Fado Alberto, são **um ornamento que leva à nota suspensa**: todas
as do Alberto acabam numa nota longa. É o que o utilizador ouvia em Amália: raras, mas presentes.
As tercinas do Alberto e do Marujo são outra coisa: recitação silábica rápida sobre uma nota
repetida.

**O ápice:** a nota mais alta do verso fica perto do primeiro terço (mediana 0,33), e a frase
cai daí para a nota suspensa. Já o verso que tem o ápice da estrofe varia de fado para fado, por
isso não se tornou regra.

### Escrito contra cantado (Coimbra)

[`fado/cantado.csv`](fado/cantado.csv). A mesma canção, como está escrita e como é cantada:

| | Escrito | Cantado |
|---|---|---|
| Síncopas por compasso | 0 | **0,56** |
| Notas longas antecipadas | 0 | **19 %** |
| Respirações (parte do tempo) | 2 % | **18 %** |
| Notas repetidas | 28 % | **36 %** |
| Notas por verso | 21 | **8,7** |
| Semínimas / colcheias | 71 % / 0 | 42 % / 38 % |

A fadista **estila**: as semínimas regulares viram ritmo de fala, as notas longas entram antes do
tempo e cada verso respira. As regras do fado descrevem o fado **cantado**; por isso duas das
partituras (Coimbra e Marujo), escritas sem respirações, ficam abaixo das outras na secção 3.

## 3. Confronto com as regras que o projeto já tinha

[`fado/regras-atuais.csv`](fado/regras-atuais.csv) e [`fado/validacao.csv`](fado/validacao.csv).

As **regras gerais** do projeto (Huron, Lerdahl & Jackendoff, Temperley…) **penalizam o fado**,
pelos seguintes motivos:

- **Notas longas no tempo forte** (Lerdahl & Jackendoff, G16): o fado antecipa a nota suspensa.
  O Marujo tem 0,24 e o intervalo pedido era 0,8–1.
- **Síncopas** (0–0,1 por compasso): o fado tem 0,4–0,5.
- **Alongamento final:** é medido em janelas fixas de dois compassos, e o verso de fado, que
  começa depois do tempo forte, atravessa-as.
- **Inércia**, **arco** e **saltos em cadeia:** ficam um pouco fora do intervalo nalguns fados.

**Pontuação** das regras (média, de −1 a 1) e posição entre as melodias do corpus:

| Fado | Regras gerais | Regras do fado triste | Regras do fado alegre |
|---|---|---|---|
| Adiça (maior) | 0,89 (P37) | 0,91 (P96) | **1,00 (P100)** |
| Alberto | 0,60 (**P2**) | **1,00 (P100)** | 0,95 (P83) |
| Coimbra, escrito | 0,91 (P46) | 0,83 (P75) | 0,83 (P33) |
| Coimbra, cantado | 0,63 (**P4**) | **0,92 (P98)** | 0,90 (P64) |
| Marujo | 0,64 (P4) | 0,77 (P55) | 0,65 (P6) |
| Pagem | 0,69 (P6) | **0,99 (P100)** | 0,95 (P83) |
| *mediana do corpus* | *0,92* | *0,75* | *0,87* |

- Com as regras gerais, os fados ficam entre os piores do corpus. Com as do fado, ficam entre os
  melhores, e o corpus desce: a mediana passa de 0,92 para 0,75.
- O Adiça (o único fado em maior) é o primeiro com as regras do fado alegre. Os fados menores
  ficam acima com as do fado triste.
- O Marujo fica a meio porque está escrito sem respirações e com a tónica em dois dos três versos
  interiores.
- Lembrete: os intervalos vêm destas mesmas cinco melodias. Isto mostra que as regras
  descrevem-nas, não que generalizam.

## 4. Regras e mudanças no algoritmo

### Regras

Ficam em [`src/fitness/styles.js`](../src/fitness/styles.js). As fontes `F01`–`F15` estão em
[`estilos/literatura.csv`](estilos/literatura.csv). As medidas por verso são novas, em
[`src/fitness/heuristics.js`](../src/fitness/heuristics.js).

| Regra | Fado triste (menor) | Fado alegre (maior) | Porquê |
|---|---|---|---|
| Nota suspensa no fim do verso (× as outras) | **2,2–5** (peso 2) | 1,8–4,5 | F04: 2,8–4,8 nos fados, P90 do corpus 2,6 |
| Notas por verso | 6–16 | 6–18 | F02: redondilha maior, quase silábica |
| Respirações (parte do tempo em pausas) | **6–22 %** | 3–16 % | F05; F07: a fadista respira |
| Síncopas por compasso | **0,15–0,7** | 0,1–0,6 | F02, F06 (percentil 99) |
| Notas suspensas antecipadas | 10–85 % | — | F06, F07 |
| Notas longas no tempo | 20–100 % (peso ½) | **60–100 %** | o triste antecipa; o alegre dança (F14) |
| Verso que chega à nota final por grau a descer | 40–100 % | 20–100 % | F09: o «suspiro» |
| Versos interiores na tónica | **0–34 %** | 0–40 % | F03, F10: repouso só no fim da estrofe |
| Notas repetidas | 15–42 % | 6–36 % | F08: recitação |
| Graus a descer | 55–85 % | (geral) | G02, F08 |
| Corridas de semicolcheias por compasso | 0–0,35 | 0–0,4 | F11: raras |
| Corridas que levam a uma nota longa | 50–100 % | 30–100 % | F11: ornamento (Amália) |
| Notas por tempo | 0,6–1,6 | 0,9–2,2 | F04; F14: o alegre é mais vivo |
| Âmbito (meios-tons) | 10–19 | 9–17 | F04 |

Algumas regras gerais ficaram aliviadas no fado (alongamento em janelas fixas, arco, inércia,
saltos compensados, saltos em cadeia), para não lutarem contra as do verso.

### Mudanças na aptidão

`styleTraits` em `styles.js` e
[`src/fitness/attractor.js`](../src/fitness/attractor.js). Só os estilos de fado as têm:

- **Pausas:** o alvo passa de 0–8 % para 6–22 % (triste) ou 3–16 % (alegre), porque são as
  respirações.
- **Ritmo:** uma nota de semínima pontuada ou mais que começa meio tempo antes do tempo vale como
  bem colocada (a antecipação).
- **Cadências alternadas:**
  - o 1.º e o 3.º verso acabam suspensos no acorde de dominante (2.º, 4.º, 5.º, 7.º, ou o 6.º a
    apoiar-se no 5.º);
  - o 2.º e o 4.º acabam no acorde de tónica;
  - a própria tónica fica para o fim da estrofe;
  - chegar à nota final por grau a descer vale mais.
- **Variedade:** notas repetidas até quatro seguidas não contam como monotonia (recitação).
- **Tensão:** o pico de cada verso passa para o primeiro terço (0,35 em vez de 0,62).
- **Valores sugeridos:**
  - triste: forma AABB, 8 compassos (uma quadra), ♩ = 72, modo menor;
  - alegre: 2/4, ♩ = 112, modo maior.

## 5. Dinâmica: dá para ter a tensão do fado sem crescendos e diminuendos?

**Em parte.** Uma parte da tensão está nas próprias notas, e a aptidão já a pede:

- o ápice no início do verso;
- a nota suspensa num grau que não é a tónica;
- o ♭6 que se apoia no 5.º;
- a nota cantada antes do tempo;
- a respiração antes do verso seguinte.

Outra parte só existe na voz. É a que o utilizador descreve no «Fado Português» de Amália, e a
que Sergl descreve (F13):

- o verso que começa forte e se apaga («nasceu um dia»);
- o acento de dor numa palavra («o vento **mal** bulia»);
- o ápice segurado e intensificado («o céu o **maaar** prolongava»);
- as quedas bruscas de intensidade;
- a última estrofe mais forte.

Um sintetizador sem dinâmica toca tudo ao mesmo nível: a nota suspensa fica parada em vez de se
apagar, e a nota de dor soa como as outras. **Por isso a dinâmica foi ativada só para o fado**,
em [`src/core/expression.js`](../src/core/expression.js), calculada a partir da melodia:

- **Verso:** cada um começa acima do nível base e desce até ao fim; dentro dele, as notas mais
  agudas são mais fortes.
- **Nota suspensa:** a do fim de cada verso esmorece até cerca de 35 % do nível no fado triste e
  60 % no alegre.
- **Ápice:** a nota mais aguda da peça cresce e é a mais forte, a ***ff***.
- **Notas de dor:** são acentuadas. Isto inclui a nota alcançada por um salto para cima e o ♭2, o
  ♯4, o ♭6 e a sensível num tempo.
- **Última estrofe:** é mais forte (Sergl).
- **Vibrato:** estreito, nas notas longas, com cerca de 0,3 meio-tom a 5,6 Hz (Mendes et al.
  2013: 0,28–0,59 meio-tom, 5,2–6,8 Hz; F12).
- **Fado alegre:** é mais forte no geral e menos afunilado, com acento nos tempos fortes (convida
  a dançar). A alegria canta-se mais forte do que a tristeza (Scherer et al. 2017, F15).

**Onde aparece:**

- **na página:** o sintetizador tem nível, acento, esmorecer e crescendo por nota, e o vibrato
  das fadistas na voz e nas cordas;
- **no MIDI:** a velocidade de cada nota, e o esmorecer e o crescendo como controlador de expressão
  (CC 11);
- **na partitura da página e no PDF:**
  - as letras *pp*–*ff* com o tipo de letra musical, por baixo da pauta, quando o nível do verso
    muda e no ápice;
  - os reguladores de crescendo e diminuendo sobre as notas que crescem ou esmorecem;
  - o acento (>) nas notas de dor;
- **no LilyPond:** `\mf`, `\<`, `\>`, `\!` e `->`.

A caixa **Dinâmica**, ao lado de «Tocar com todas as vozes», só aparece num fado. Desligada,
toca e escreve a mesma melodia sem dinâmica, para comparar de ouvido. Num cânone, as outras vozes
tocam um pouco mais baixo, para a melodia se destacar.

## 6. Áudio: a ferramenta pronta, à espera de gravações

[`tools/fado_audio.py`](../tools/fado_audio.py) mede a dinâmica da voz numa gravação de fado,
apesar da guitarra portuguesa e da viola.

**Como separa a voz das guitarras:**

- segue a voz pela altura (pYIN);
- mede a energia dos harmónicos dessa altura, menos o fundo espectral à volta;
- decide som a som se é voz ou guitarra pela forma como decai: uma corda dedilhada morre a dezenas
  de dB por segundo, a voz sustenta-se;
- os sons de guitarra que ficam a soar nas respirações ficam muito abaixo da voz e também são
  postos de parte;
- mede o vibrato na altura YIN, fotograma a fotograma, com uma janela curta, porque o pYIN e
  janelas longas achatam-no.

**O que mede em cada verso:** o nível no início e no fim, a inclinação, o ápice, a nota suspensa
e o seu esmorecer, o vibrato e os acentos.

**Teste sintético** ([`fado/audio-selftest.txt`](fado/audio-selftest.txt)): uma voz com dinâmica
conhecida sobre cordas dedilhadas.

| | Posto | Medido (guitarra 16 dB abaixo da voz) |
|---|---|---|
| Versos | 6 | 6 |
| Nota suspensa | 1,6 s | 1,58 s |
| Esmorecer da nota suspensa | 9 dB | 9,1 dB |
| Início − fim do verso | ≈ 10 dB | 10,9 dB |
| Vibrato | 5,6 Hz, 0,35 meio-tom | 5,74 Hz, 0,35 meio-tom |

Com a guitarra quase tão forte como a voz, a medição degrada-se: encontra 4 dos 6 versos e o
esmorecer sai achatado. É o compromisso que o acompanhamento impõe, como o utilizador previu.

**Gravações reais:** ainda nenhuma, porque a rede deste ambiente bloqueia o YouTube e o
archive.org. A coleção https://archive.org/details/fados (sugerida pelo utilizador; inclui o Zeca
Afonso) fica pronta a analisar quando `archive.org` e `*.us.archive.org` forem autorizados nas
definições de rede:

```
python3 tools/fado_audio.py gravacao.mp3 [outra.mp3 ...]   → results/fado/audio.csv
```

Com os números medidos, os perfis `sad` e `happy` de `expression.js` passam a ser calibrados em
gravações em vez de na descrição de Sergl e do utilizador. Ver
[`../TRABALHO-FUTURO.md`](../TRABALHO-FUTURO.md).

## 7. No algoritmo genético

[`tools/fado_ga_study.mjs`](../tools/fado_ga_study.mjs) → [`fado/ga.csv`](fado/ga.csv). Seis
sementes, 400 gerações, uma melodia de 8 compassos de 4/4, as mesmas ondas.

| | Sem estilo (menor) | **Fado triste** | Sem estilo (maior) | **Fado alegre** |
|---|---|---|---|---|
| Nota suspensa no fim do verso (× as outras) | 1,30 | **2,51** | 1,22 | **1,92** |
| Notas por verso | 11,9 | **7,1** | 12,1 | 12,5 |
| Respirações (parte do tempo) | 5,3 % | **9,6 %** | 6,9 % | 6,0 % |
| Síncopas por compasso | 0 | **0,27** | 0,02 | **0,17** |
| Notas suspensas antecipadas | 0 | **32 %** | 0 | 8 % |
| Versos que acabam por grau a descer | 18 % | **55 %** | 33 % | **50 %** |
| Versos interiores na tónica | 0 | 19 % | 13 % | 0 |
| Graus a descer | 40 % | **59 %** | 36 % | **52 %** |
| Âmbito (meios-tons) | 9,5 | 12,7 | 9,0 | 9,2 |
| Regras do fado (−1 a 1) | 0,65 | **1,00** | 0,83 | **0,99** |
| As quatro regras antigas do «fado» | 0,61 | 0,71 | 0,52 | 0,49 |

Com o estilo de fado triste, a melodia gerada ganha:

- a nota suspensa (2,5 vezes as outras notas do verso, como nos fados reais);
- versos curtos separados por respirações;
- síncopas e antecipações que sem estilo não aparecem;
- versos que acabam por grau descendente.

O fado alegre fica entre os dois: notas suspensas mais curtas, síncopas, as notas longas no tempo
e versos longos.

A última linha mostra o pouco que as quatro regras antigas distinguiam: o fado alegre gerado
pontua pior nelas do que uma melodia sem estilo, embora cumpra as novas. Sem a gravação, a
dinâmica não entra nestes números, que são só de notas e ritmos.

## 8. Ficheiros

| Ficheiro | O quê |
|---|---|
| [`fado/pesquisa.md`](fado/pesquisa.md) | a pesquisa completa, com as fontes (história, simbolismo, formas, harmonia, ritmo, voz, dinâmica, estudos computacionais) |
| [`fado/harmonias.csv`](fado/harmonias.csv) | esquemas harmónicos de 11 fados |
| [`fado/melodias.csv`](fado/melodias.csv), [`fado/frases.csv`](fado/frases.csv) | medidas por fado e por verso, na grelha fina (tercinas exatas) |
| [`fado/comparacao.csv`](fado/comparacao.csv) | os fados contra as 5727 melodias do corpus em 2/4 e 4/4 |
| [`fado/medidas-verso.csv`](fado/medidas-verso.csv) | as medidas de verso de `heuristics.js`, na grelha de semicolcheias |
| [`fado/cantado.csv`](fado/cantado.csv) | Coimbra escrito contra cantado |
| [`fado/regras-atuais.csv`](fado/regras-atuais.csv), [`fado/validacao.csv`](fado/validacao.csv) | as regras do projeto (gerais e de fado) nos fados reais |
| [`fado/ga.csv`](fado/ga.csv) | o algoritmo genético com e sem os estilos de fado |
| [`fado/audio-selftest.txt`](fado/audio-selftest.txt) | o teste sintético da análise de áudio |
| `tools/fado_corpus.py`, `tools/fado_study.mjs`, `tools/fado_ga_study.mjs`, `tools/fado_audio.py` | as ferramentas que os produzem |
