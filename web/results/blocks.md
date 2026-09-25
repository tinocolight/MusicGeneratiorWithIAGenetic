# Blocos de construção aprendidos com melodias reais

Gerado por `node tools/build_blocks.mjs` a partir de `data/corpus-large.json`: 6758 melodias (airds 571, bach-chorale 300, essen 5290, oneills 313, ryans 284), 281647 tempos. As 480 melodias do crítico ficaram de fora. Um bloco é um tempo (4 semicolcheias): ritmo e contorno em graus da escala; 349 blocos aparecem pelo menos 8 vezes e cobrem 99.5 % dos tempos.

## Blocos mais frequentes

| Bloco | Tempos | Melodias que o têm |
|---|---|---|
| ♩ | 44.5 % | 93.4 % |
| ♪ ♪ · desce 1 | 7.2 % | 69.7 % |
| (ligada) ♩ | 7.0 % | 51.8 % |
| ♪ ♪ · repete | 5.2 % | 53.0 % |
| ♪ ♪ · sobe 1 | 4.5 % | 57.4 % |
| (ligada) ♪ ♪ | 4.0 % | 45.0 % |
| ♪ ♪ · desce 2 | 3.7 % | 47.1 % |
| ♪ ♪ · sobe 2 | 3.2 % | 46.3 % |
| pausa ♩ | 1.9 % | 30.9 % |
| pausa ♪ ♪ | 1.7 % | 32.2 % |
| ♪. 𝅘𝅥𝅯 · desce 1 | 1.3 % | 19.5 % |
| ♪. 𝅘𝅥𝅯 · sobe 1 | 1.3 % | 18.0 % |
| ♪ ♪ · sobe 3 | 0.9 % | 19.7 % |
| ♪ ♪ · desce 3 | 0.7 % | 15.8 % |
| ♪. 𝅘𝅥𝅯 · repete | 0.6 % | 10.5 % |
| ♪. 𝅘𝅥𝅯 · desce 2 | 0.6 % | 9.5 % |
| 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 1, desce 1, desce 1 | 0.6 % | 8.7 % |
| ♪ ♪ · sobe 5 | 0.5 % | 11.0 % |
| ♪. 𝅘𝅥𝅯 · sobe 2 | 0.5 % | 8.4 % |
| ♪ ♪ · desce 4 | 0.4 % | 8.3 % |

## Como começam as melodias reais

Primeira nota: grau 5 (dominante) 48.6 % · grau 1 (tónica) 28.4 % · grau 3 (mediante) 13.1 % · grau 7 3.1 % · grau 4 2.6 % · grau 2 2.5 % · grau 6 1.7 %.

Primeiro tempo (a seguir ao início ou à anacrusa):

| Bloco | Melodias |
|---|---|
| ♩ | 38.5 % |
| pausa ♪ ♪ | 24.4 % |
| ♪ ♪ · repete | 7.1 % |
| ♪ ♪ · sobe 1 | 4.5 % |
| ♪ ♪ · sobe 2 | 3.6 % |
| ♪ ♪ · desce 1 | 2.2 % |
| ♪. 𝅘𝅥𝅯 · sobe 1 | 1.7 % |
| pausa ♪ 𝅘𝅥𝅯 𝅘𝅥𝅯 · sobe 1 | 1.7 % |
| pausa ♪ 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 1 | 1.6 % |
| ♪. 𝅘𝅥𝅯 · repete | 1.4 % |
| ♪ ♪ · desce 2 | 1.4 % |
| ♪ ♪ · sobe 3 | 1.4 % |

## Regras de associação (na mesma melodia)

«Se o bloco A aparece, o bloco B aparece com probabilidade p». *Lift* = quantas vezes mais do que se B aparecesse ao acaso (1 = independentes).

| Se aparece | então aparece | p | lift | melodias com ambos |
|---|---|---|---|---|
| 𝅘𝅥𝅯 ♪. · desce 2 | 𝅘𝅥𝅯 ♪. · sobe 2 | 31.1 % | 29.2 | 37 |
| pausa ♪ 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 1 | ♪ 𝅘𝅥𝅯 𝅘𝅥𝅯 · sobe 5, desce 1 | 17.5 % | 26.3 | 25 |
| 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 2, desce 2, sobe 2 | 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 1, sobe 1, desce 2 | 26.9 % | 22.4 | 25 |
| 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 2, desce 2, sobe 2 | 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 1, desce 1, sobe 2 | 29.0 % | 21.6 | 27 |
| 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 2, desce 2, sobe 2 | 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 2, sobe 1, desce 2 | 31.2 % | 20.9 | 29 |
| 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 2, desce 2, desce 2 | 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · sobe 1, sobe 1, desce 2 | 61.0 % | 19.1 | 25 |
| 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · sobe 2, desce 1, desce 1 | 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 2, desce 2, sobe 2 | 25.5 % | 18.5 | 25 |
| 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 2, sobe 1, sobe 1 | 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · sobe 1, sobe 1, desce 2 | 53.2 % | 16.6 | 25 |
| 𝅘𝅥𝅯 ♪. · desce 2 | ♪. 𝅘𝅥𝅯 · sobe 5 | 26.1 % | 14.3 | 31 |
| ♪ 𝅘𝅥𝅯 𝅘𝅥𝅯 · sobe 1, sobe 2 | 𝅘𝅥𝅯 𝅘𝅥𝅯 ♪ · desce 1, desce 2 | 31.0 % | 14.1 | 31 |
| 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · sobe 1, sobe 1, desce 2 | 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 2, desce 2, sobe 2 | 17.6 % | 12.8 | 38 |
| 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · sobe 1, sobe 1, sobe 1 | 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · sobe 1, sobe 1, desce 2 | 32.9 % | 10.3 | 80 |
| 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · sobe 2, desce 2, desce 1 | 𝅘𝅥𝅯 𝅘𝅥𝅯 ♪ · desce 1, desce 2 | 29.2 % | 13.2 | 26 |
| pausa ♪ 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 1 | 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · sobe 2, desce 1, desce 1 | 18.9 % | 13.0 | 27 |
| 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 2, sobe 1, desce 2 | 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · sobe 1, sobe 1, desce 2 | 37.6 % | 11.8 | 38 |
| 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · sobe 1, sobe 1, sobe 1 | 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 2, desce 1, desce 1 | 11.5 % | 12.8 | 28 |
| 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · sobe 1, desce 1, desce 2 | ♪ 𝅘𝅥𝅯 𝅘𝅥𝅯 · repete, desce 2 | 29.6 % | 12.1 | 32 |
| 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · sobe 1, sobe 1, sobe 1 | 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 2, sobe 1, desce 2 | 16.9 % | 11.3 | 41 |
| 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 1, desce 1, sobe 2 | 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 1, desce 1, sobe 1 | 27.5 % | 13.0 | 25 |
| ♪. 𝅘𝅥𝅯 · sobe 5 | ♪. 𝅘𝅥𝅯 · sobe 3 | 36.6 % | 10.9 | 45 |

Associações negativas (raramente juntos):

| Bloco A | Bloco B | lift |
|---|---|---|
| (ligada) ♩ | 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 2, sobe 1, desce 2 | 0.02 |
| (ligada) ♩ | 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 2, desce 2, sobe 2 | 0.02 |
| 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · sobe 1, sobe 1, desce 2 | pausa ♩ | 0.03 |
| 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 1, sobe 1, sobe 1 | pausa ♩ | 0.06 |
| 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · sobe 2, desce 4, sobe 2 | ♩ | 0.07 |
| ♩ | 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 2, desce 2, sobe 2 | 0.08 |
| 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 2, sobe 1, desce 2 | (ligada) ♪ ♪ | 0.09 |
| (ligada) ♩ | 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · sobe 1, sobe 1, desce 2 | 0.09 |
| 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 2, sobe 1, sobe 1 | ♩ | 0.09 |
| 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 𝅘𝅥𝅯 · desce 1, sobe 1, desce 2 | (ligada) ♩ | 0.10 |

## Valor típico das regras na música real (P25 / P50 / P75)

O AG passa a ser recompensado só até ao P75 de cada regra («não maximizar»):

| Regra | P25 | P50 | P75 |
|---|---|---|---|
| key | 0.596 | 0.633 | 0.664 |
| proximity | 0.32 | 0.438 | 0.527 |
| regression | -0.786 | -0.375 | 0 |
| forces | -0.114 | 0.088 | 0.272 |
| metric | 0.429 | 0.515 | 0.6 |
| cadence | 0.1 | 0.261 | 0.4 |
| tension | -0.005 | 0.156 | 0.319 |
| variety | 0.629 | 0.949 | 1.398 |

Log-probabilidade média por tempo nas melodias reais: P10 -5.91, mediana -3.83, P90 -2.38.
