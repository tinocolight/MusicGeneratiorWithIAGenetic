# Figuras rítmicas e blocos melódicos por compasso

Gerado por `node tools/build_meters.mjs` a partir de `data/corpus-meters.json` (`python3 tools/extract_meter_corpus.py`). Todas as tabelas estão em `results/meters/`: um CSV por tabela e um só livro de Excel, `analise-compassos.xlsx` (`python3 tools/export_xlsx.py`), com fórmulas nas colunas derivadas e um comentário a explicar cada coluna; o dicionário das colunas está em `results/meters/README.md`. Correr os três comandos outra vez dá os mesmos números.

## 1. Porquê separar os compassos

Num compasso simples o tempo é uma semínima e divide-se em duas colcheias; num composto o tempo é uma semínima com ponto e divide-se em três. 3/4 e 6/8 têm o mesmo comprimento (12 semicolcheias), mas o primeiro tem três tempos de duas colcheias e o segundo dois tempos de três. O programa lia todas as melodias em tempos de semínima e juntava as de 2/4, 3/4 e 4/4 (as de 6/8 nem entravam). Lido compasso a compasso, o ritmo real fica muito mais previsível para o modelo — o que quer dizer que as figuras aprendidas são as certas para cada compasso:

| Compasso | como antes (1.ª ordem) | sem segmentar, 2.ª ordem | por compasso, 2.ª ordem | por compasso, modelo escolhido | x vezes mais provável só por segmentar | x vezes, segmentar e modelo escolhido |
|---|---|---|---|---|---|---|
| 2/4 | 4,49 | 4,26 | 4,26 | 4,02 | 1,00 | 1,38 |
| 3/4 | 5,90 | 5,63 | 4,75 | 4,28 | 1,83 | 3,07 |
| 4/4 | 6,73 | 6,36 | 6,28 | 5,75 | 1,06 | 1,97 |
| 3/8 | 3,34 | 3,21 | 3,12 | 3,08 | 1,06 | 1,20 |
| 6/8 | 4,99 | 4,46 | 3,76 | 3,55 | 1,63 | 2,72 |
| 9/8 | 6,11 | 5,81 | 4,92 | 4,45 | 1,85 | 3,17 |

(Bits por compasso: -log2 da probabilidade que o modelo dá ao ritmo de um compasso de uma melodia que não viu, em validação cruzada de 5 dobras por melodia; 1 bit a menos = duas vezes mais provável.) Só por separar os compassos, com o mesmo modelo, o ritmo real de um compasso fica em média 1,8 vezes mais provável em 3/4 e 1,6 vezes em 6/8 — precisamente os dois compassos que o programa confundia (12 semicolcheias). Em 2/4 e 4/4 a separação quase não muda nada (já eram lidos em tempos de semínima); aí o ganho vem da memória mais longa (secção 5).

## 2. O corpus

| Compasso | Família | Melodias | Tempos | Fontes principais |
|---|---|---|---|---|
| 2/4 | simples | 2689 | 86688 | Essen Folksong Collection 2133, Ryan's Mammoth Collection (1883) 250, Aird's Airs 215 |
| 3/4 | simples | 1514 | 65313 | Essen Folksong Collection 1342, O'Neill's Music of Ireland (1850) 99, Aird's Airs 37 |
| 4/4 (e 2/2) | simples | 3038 | 158138 | Essen Folksong Collection 1867, Aird's Airs 428, O'Neill's Music of Ireland (1850) 306 |
| 3/8 | composto | 333 | 5672 | Essen Folksong Collection 322, Aird's Airs 7, O'Neill's Music of Ireland (1850) 4 |
| 6/8 | composto | 1911 | 56669 | Essen Folksong Collection 869, O'Neill's Music of Ireland (1850) 530, Aird's Airs 322 |
| 9/8 | composto | 143 | 5000 | O'Neill's Music of Ireland (1850) 69, Ryan's Mammoth Collection (1883) 41, Aird's Airs 28 |
| 12/8 | composto | 7 | 262 | Aird's Airs 3, O'Neill's Music of Ireland (1850) 2, J. S. Bach, corais (soprano) 1 |

Ficaram de fora as melodias que mudam de compasso e as que têm tercinas ou fusas, que a grelha de semicolcheias do programa não escreve (por exemplo 526 reels e hornpipes em 2/2), e as 480 do crítico, que continua a ser um juiz independente (`corpus_excluidas.csv`). 12/8 tem só 7 melodias: a app usa para ele o modelo de 6/8 (um compasso de 12/8 lê-se como dois de 6/8).

## 3. As figuras mais comuns de cada compasso

Uma figura é o ritmo de um tempo; as sílabas são as de Takadimi (Hoffman, Pelto & White 1996), uma por posição no tempo. As seis mais comuns (percentagem dos tempos):

- **2/4**: ♪ ♪ *ta di* 39,6 % · ♩ *ta* 23,0 % · sc sc sc sc *ta ka di mi* 11,3 % · ♪ sc sc *ta di mi* 7,3 % · ♪. sc *ta mi* 5,3 % · (lig.) ♩ *(lig.)* 3,2 %
- **3/4**: ♩ *ta* 55,0 % · ♪ ♪ *ta di* 21,1 % · (lig.) ♩ *(lig.)* 9,8 % · (lig.) ♪ ♪ *(lig.) di* 5,1 % · ♪. sc *ta mi* 3,4 % · pausa ♩ *(pausa)* 2,0 %
- **4/4**: ♩ *ta* 47,6 % · ♪ ♪ *ta di* 29,1 % · (lig.) ♩ *(lig.)* 6,9 % · ♪. sc *ta mi* 5,8 % · (lig.) ♪ ♪ *(lig.) di* 4,0 % · pausa ♩ *(pausa)* 2,3 %
- **3/8**: ♪ ♪ ♪ *ta ki da* 34,6 % · ♩ ♪ *ta da* 19,1 % · ♪. sc ♪ *ta di da* 9,5 % · ♩. *ta* 4,9 % · ♪ ♪ sc sc *ta ki da ma* 3,5 % · ♩ sc sc *ta da ma* 3,5 %
- **6/8**: ♪ ♪ ♪ *ta ki da* 49,8 % · ♩ ♪ *ta da* 26,4 % · ♩. *ta* 7,6 % · ♪. sc ♪ *ta di da* 4,1 % · pausa ♩ ♪ *(pausa) da* 3,3 % · ♩ sc sc *ta da ma* 1,7 %
- **9/8**: ♪ ♪ ♪ *ta ki da* 56,8 % · ♩ ♪ *ta da* 31,6 % · ♩. *ta* 2,7 % · sc sc ♪ ♪ *ta va ki da* 1,8 % · ♪. sc ♪ *ta di da* 1,7 % · pausa ♩ ♪ *(pausa) da* 1,1 %

As figuras que os manuais de ritmo apresentam primeiro são também as que mais aparecem na música real, mas com pesos muito diferentes de compasso para compasso (`literatura_simples.csv`, `literatura_composto.csv`):

- em 6/8 as três colcheias (*ta ki da*) ocupam 49,8 % dos tempos e a semínima com colcheia (*ta da*) 26,4 %; o inverso, colcheia e semínima (*ta ki*), só 0,38 %; o ritmo pontuado da siciliana (*ta di da*) 4,13 %;
- em 3/4 a semínima (*ta*) domina (55,0 %), e o tempo ligado de uma mínima ou mínima com ponto (continuação) vale 9,8 %;
- em 2/4 as colcheias (*ta di*) valem 39,6 % e as semicolcheias (*ta ka di mi*) 11,3 %; em 4/4 as colcheias valem 29,1 %.

## 4. A regra simples: a figura e a direção da última nota

A pergunta: «se esta figura acaba com a última nota a subir em relação à penúltima, a figura seguinte tem uma certa probabilidade; se desce, outra». Mediu-se quanto a direção da última nota (sobe/desce/repete, ou com grau/salto) melhora a previsão de duas coisas, em bits por evento (menos é melhor):

| Compasso | ritmo: figura anterior | + direção (sobe/desce/repete) | + direção (grau/salto) | melodia: grau da última nota | + direção (sobe/desce/repete) | + direção (grau/salto) |
|---|---|---|---|---|---|---|
| 2/4 | 2,239 | 2,234 | 2,226 | 2,722 | 2,636 | 2,579 |
| 3/4 | 1,642 | 1,636 | 1,630 | 2,611 | 2,541 | 2,473 |
| 4/4 | 1,664 | 1,652 | 1,638 | 2,655 | 2,563 | 2,484 |
| 3/8 | 3,160 | 3,171 | 3,165 | 2,585 | 2,473 | 2,432 |
| 6/8 | 1,951 | 1,954 | 1,951 | 2,648 | 2,526 | 2,464 |
| 9/8 | 1,654 | 1,657 | 1,643 | 2,722 | 2,642 | 2,595 |

- **Para o ritmo, a direção quase não conta**: no máximo 0,026 bits por tempo (nos compostos, nada). A figura seguinte depende das figuras anteriores e do lugar no compasso, não de a melodia estar a subir ou a descer.
- **Para a melodia, a direção conta muito**: com grau/salto, o intervalo seguinte fica 0,13–0,18 bits mais previsível. É o que a teoria descreve como regresso depois de um salto (*gap-fill*; von Hippel & Huron 2000) e continuação do movimento por grau: em 4/4, depois de um salto a subir a nota seguinte desce em 53,6 % dos casos; depois de subir por grau, desce em 35,8 % e continua a subir em 52,4 %. Em 6/8: 46,0 % e 58,0 % (`entradas.csv`).

Por isso a regra ficou onde ajuda: a direção da última nota (com grau/salto) entra no modelo dos intervalos, não no do ritmo.

## 5. Um passo, uma árvore de dois passos, ou mais?

A árvore de dois passos («se esta figura, com esta direção, então estas duas figuras seguintes têm esta probabilidade, depois estas...») é um modelo de 2.ª ordem: a segunda figura depende das duas anteriores e não só da última. Comparou-se o contexto do ritmo com 0 a 8 figuras anteriores, sempre misturado com os contextos mais curtos (modelo de ordem variável):

| Compasso | só o tempo | 1 figura | 2 figuras (árvore de 2 passos) | 4 figuras | 8 figuras | melhor |
|---|---|---|---|---|---|---|
| 2/4 | 2,599 | 2,239 | 2,132 | 2,041 | 2,009 | R8 (β = 64) |
| 3/4 | 1,859 | 1,642 | 1,585 | 1,479 | 1,424 | R7 (β = 64) |
| 4/4 | 2,040 | 1,664 | 1,569 | 1,481 | 1,436 | R8 (β = 64) |
| 3/8 | 3,435 | 3,160 | 3,118 | 3,084 | 3,074 | R5 (β = 128) |
| 6/8 | 2,262 | 1,951 | 1,879 | 1,804 | 1,774 | R8 (β = 128) |
| 9/8 | 1,765 | 1,654 | 1,636 | 1,532 | 1,474 | R7 (β = 128) |

- Passar de uma para duas figuras (a árvore de dois passos) ajuda em todos os compassos com muitas melodias: 2/4 0,11, 3/4 0,06, 4/4 0,09, 6/8 0,07 bits por tempo.
- Continua a ajudar até cerca de um compasso inteiro de memória (3 figuras em 3/4, 4 em 4/4, 4 em 6/8), e ainda um pouco até dois compassos: as melodias reais repetem padrões rítmicos de compasso para compasso. Uma cadeia de 1.ª ordem não vê isso.
- Uma árvore mais funda só compensa com suavização: um contexto visto poucas vezes não pode decidir sozinho. Aqui cada contexto é misturado com os mais curtos na proporção das vezes que foi visto (Witten–Bell, o método de escape C do PPM) e com uma pseudo-contagem β escolhida por validação cruzada; sem β, as árvores fundas pioram nos compassos com poucas melodias (`modelos.csv`).
- Onde a árvore mais se afasta de uma cadeia de 1.ª ordem (`arvore_2_passos.csv`): em 4/4, depois de ♪. sc (repete), o par ♩ → ♪. sc acontece 29,8 % das vezes, e uma cadeia de 1.ª ordem daria 1,2 % (24,5 vezes).

Conclusão: sim, vale a pena estender a relação em árvore, e mais do que dois passos, desde que cada nível seja misturado com os mais curtos. A direção da nota fica para a melodia (secção 4).

## 6. O que o algoritmo usa agora

Para cada compasso, a app guarda (`src/data/blocks-data.js`): a figura dada as figuras anteriores e o tempo do compasso; o intervalo de entrada dado o grau da última nota, a direção do último intervalo (com grau/salto), a figura e o tempo; o contorno dentro do tempo dado a figura e a direção de entrada; as associações entre figuras da mesma melodia; o primeiro grau. Para caber na página, o ritmo usa no máximo 4 figuras anteriores e deixa de fora os contextos vistos menos de 16 vezes; o custo destes cortes está na tabela (bits por evento em validação cruzada, com as tabelas tal como vão para o navegador):

| Compasso | ritmo (app) | bits | melhor do estudo | 1.ª ordem (antes) | entrada (app) | bits | antes (só o grau) | contorno | bits | tamanho |
|---|---|---|---|---|---|---|---|---|---|---|
| 2/4 | R4 | 2,054 | 2,009 | 2,239 | E1+dir5+fig | 2,541 | 2,722 | C1 | 3,721 | 133 KB |
| 3/4 | R4 | 1,486 | 1,428 | 1,642 | E1+dir5+fig | 2,458 | 2,611 | C1+pos | 2,653 | 74 KB |
| 4/4 | R4+dir5 | 1,480 | 1,436 | 1,664 | E1+dir5+fig | 2,459 | 2,655 | C1+pos | 2,639 | 196 KB |
| 3/8 | R4 | 3,114 | 3,078 | 3,160 | E1+dir5+fig | 2,430 | 2,585 | C1 | 4,749 | 33 KB |
| 6/8 | R4 | 1,821 | 1,774 | 1,951 | E1+dir5+fig | 2,441 | 2,648 | C1+pos | 3,925 | 103 KB |
| 9/8 | R4 | 1,559 | 1,482 | 1,654 | E1+dir5+fig | 2,617 | 2,722 | C1+pos | 3,627 | 23 KB |

O modelo escreve os indivíduos iniciais («Blocos do corpus»), reescreve um ou dois tempos numa mutação e é a regra «Idioma do corpus» do fitness, que pede a uma melodia que seja tão idiomática como uma melodia real típica daquele compasso (entre o P10 e a mediana das melodias reais, medidas fora da amostra), e não mais. Os limites das outras regras («não maximizar») também passaram a ser os das melodias reais de cada compasso.

## 7. Como auditar e melhorar

- Cada número de uma probabilidade está na sua linha com a contagem e a contagem do contexto; no Excel, as probabilidades e frações são fórmulas.
- Para mudar o que o modelo pode usar (outro contexto, outra suavização), acrescente um candidato em `CANDIDATES` em `tools/build_meters.mjs` e corra `node tools/build_meters.mjs` e `python3 tools/export_xlsx.py`: a validação cruzada diz se é melhor, e o mais simples a menos de 0,01 bits do melhor é o escolhido.
- Para outro corpus ou outros compassos, altere `tools/extract_meter_corpus.py` (ou forneça outro `data/corpus-meters.json` com o mesmo formato).
- Limites conhecidos: melodias com tercinas ficaram de fora; as tonalidades são estimadas pelo music21; o grau de uma nota cromática é o grau abaixo; 12/8 e 9/8 têm poucas melodias.

## 8. Como se faz isto sem um modelo de linguagem

Tudo isto são contagens e probabilidades condicionais, a família de modelos estatísticos que se usa em música há décadas:

- **Cadeias de Markov / n-gramas**: a probabilidade do próximo acontecimento dado o anterior (1.ª ordem) ou os n anteriores. É a «relação probabilística simples».
- **Modelos de ordem variável**: em vez de fixar n, misturam todos os contextos, do mais longo que já foi visto ao mais curto. PPM, *Prediction by Partial Matching* (Cleary & Witten 1984), árvores de sufixos probabilísticas (Ron, Singer & Tishby 1996) e CTW, *Context Tree Weighting*. Begleiter, El-Yaniv & Yona (2004) compararam-nos em música e texto; PPM está entre os melhores. É a «árvore» da pergunta, com qualquer profundidade.
- **Suavização**: um contexto visto poucas vezes não pode dar probabilidade 0 ao que nunca viu. Pearce & Wiggins (2004) compararam os métodos em melodias; a mistura interpolada com o escape C (Witten–Bell) é das melhores, e é a que se usa aqui.
- **Pontos de vista múltiplos** (Conklin & Witten 1995): prever cada aspeto (ritmo, intervalo, contorno...) com o seu próprio modelo, ligando-os quando um ajuda o outro. É o que faz o IDyOM de Pearce (2005), um modelo de expectativa musical que junta um modelo de longo prazo, treinado num corpus, com um de curto prazo, que aprende a peça que está a ouvir.
- **Avaliação por entropia cruzada** em melodias deixadas de fora: o melhor modelo é o que dá mais probabilidade à música real que não viu (Temperley 2010 comparou assim seis modelos de ritmo no mesmo corpus de Essen).
- **Cuidado com o plágio**: cadeias de ordem alta tendem a copiar trechos do corpus maiores do que a própria ordem (Papadopoulos, Roy & Pachet 2014). Aqui o contexto do ritmo fica limitado a um compasso de 4/4, a melodia usa só o último intervalo, e o algoritmo genético mistura estas probabilidades com as outras regras; o modelo propõe, não copia.

### Referências

- Begleiter, R., El-Yaniv, R. & Yona, G. (2004). On prediction using variable order Markov models. *Journal of Artificial Intelligence Research* 22, 385–421. https://arxiv.org/abs/1107.0051
- Cleary, J. G. & Witten, I. H. (1984). Data compression using adaptive coding and partial string matching. *IEEE Transactions on Communications* 32(4), 396–402.
- Conklin, D. & Witten, I. H. (1995). Multiple viewpoint systems for music prediction. *Journal of New Music Research* 24(1), 51–73. https://www.ehu.eus/cs-ikerbasque/conklin/papers/jnmr95.pdf
- Dubnov, S., Assayag, G., Lartillot, O. & Bejerano, G. (2003). Using machine-learning methods for musical style modeling. *IEEE Computer* 36(10), 73–80.
- Hoffman, R., Pelto, W. & White, J. W. (1996). Takadimi: a beat-oriented system of rhythm pedagogy. *Journal of Music Theory Pedagogy* 10, 7–30.
- Pachet, F. (2003). The Continuator: musical interaction with style. *Journal of New Music Research* 32(3), 333–341.
- Papadopoulos, A., Roy, P. & Pachet, F. (2014). Avoiding plagiarism in Markov sequence generation. *AAAI 2014*. https://ojs.aaai.org/index.php/AAAI/article/view/9126
- Pearce, M. T. (2005). *The construction and evaluation of statistical models of melodic structure in music perception and composition* (tese de doutoramento, City University London) — IDyOM.
- Pearce, M. T. & Wiggins, G. A. (2004). Improved methods for statistical modelling of monophonic music. *Journal of New Music Research* 33(4), 367–385.
- Ron, D., Singer, Y. & Tishby, N. (1996). The power of amnesia: learning probabilistic automata with variable memory length. *Machine Learning* 25, 117–149.
- Temperley, D. (2010). Modeling common-practice rhythm. *Music Perception* 27(5), 355–376.
- von Hippel, P. & Huron, D. (2000). Why do skips precede reversals? The effect of tessitura on melodic structure. *Music Perception* 18(1), 59–85.
- Open Music Theory — compassos simples e compostos: https://viva.pressbooks.pub/openmusictheory/chapter/simple-meter-and-time-signatures/ e https://viva.pressbooks.pub/openmusictheory/chapter/compound-meters-and-time-signatures/
