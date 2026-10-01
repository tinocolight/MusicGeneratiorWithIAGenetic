# Heurísticas de composição no algoritmo genético

Gerado por `node tools/styles_ga_study.mjs 4 400`: 4 sementes por estilo, 400 gerações, população 80, pesos por omissão com «não maximizar», população inicial dos blocos do corpus; com as definições que cada estilo sugere (compasso, frase, forma, compassos) e o peso das heurísticas a 0 («sem») ou a 4, o valor que um estilo recebe quando é escolhido («com»). Tabela também em `results/estilos/ga.csv`.

| Estilo | Compasso | Pontuação do estilo: sem → com | Regras no intervalo: sem → com | Crítico: sem → com | Típicas /26: sem → com | Regras que mais falham (com) |
|---|---|---|---|---|---|---|
| nenhum (só regras gerais) | 4/4 | 0,81 → 1,00 | 63 % → 96 % | 0,88 → 0,83 | 21,5 → 20,0 | leaps (2/4) |
| folk | 4/4 | 0,87 → 1,00 | 75 % → 97 % | 0,88 → 0,88 | 21,5 → 22,0 | motifs (2/4) |
| children | 4/4 | 0,72 → 0,98 | 72 % → 91 % | 0,88 → 0,74 | 21,5 → 23,5 | motifs (3/4); leaps (2/4); pentatonic (1/4) |
| lullaby | 6/8 | 0,61 → 1,00 | 67 % → 100 % | 0,92 → 0,90 | 20,3 → 22,5 | — |
| hymn | 4/4 | 0,70 → 0,82 | 74 % → 91 % | 0,88 → 0,84 | 21,5 → 22,8 | firstOnset (4/4); leaps (2/4) |
| pentatonic | 4/4 | 0,73 → 1,00 | 70 % → 92 % | 0,88 → 0,71 | 21,5 → 19,5 | leaps (3/4); finalLength (1/4); pentatonic (1/4) |
| fado | 4/4 | 0,69 → 1,00 | 65 % → 97 % | 0,88 → 0,88 | 21,5 → 20,5 | leaps (1/4); inertia (1/4) |
| reel | 4/4 | 0,25 → 0,82 | 51 % → 85 % | 0,68 → 0,69 | 19,5 → 19,3 | arpeggio (3/4); leaps (3/4); fig:eighths (2/4) |
| jig | 6/8 | 0,39 → 1,00 | 61 % → 91 % | 0,88 → 0,90 | 18,0 → 21,0 | motifs (4/4); leaps (1/4); finalLength (1/4) |
| singleJig | 6/8 | 0,47 → 1,00 | 65 % → 97 % | 0,88 → 0,89 | 18,0 → 22,5 | leaps (1/4); finalLength (1/4) |
| slipJig | 9/8 | 0,76 → 1,00 | 71 % → 96 % | 0,96 → 0,94 | 19,5 → 20,8 | leaps (3/4) |
| hornpipe | 4/4 | 0,34 → 0,84 | 52 % → 90 % | 0,68 → 0,69 | 19,5 → 18,5 | density (4/4); motifs (3/4) |
| strathspey | 4/4 | 0,53 → 0,87 | 69 % → 82 % | 0,78 → 0,67 | 19,8 → 19,0 | fig:dotted (4/4); density (4/4); leaps (4/4) |
| polka | 2/4 | 0,73 → 1,00 | 70 % → 97 % | 0,85 → 0,88 | 18,3 → 19,0 | leaps (2/4) |
| march | 4/4 | 0,70 → 1,00 | 64 % → 97 % | 0,78 → 0,87 | 19,8 → 21,3 | finalLength (1/4); density (1/4) |
| waltz | 3/4 | 0,75 → 1,00 | 75 % → 97 % | 0,80 → 0,63 | 18,3 → 18,0 | leaps (1/4); syncBar (1/4) |
| mazurka | 3/4 | 0,66 → 1,00 | 69 % → 99 % | 0,80 → 0,79 | 18,3 → 18,5 | motifs (1/4) |
| polonaise | 3/4 | 0,46 → 1,00 | 69 % → 100 % | 0,80 → 0,91 | 18,3 → 20,5 | — |
| tarantella | 6/8 | 0,51 → 1,00 | 60 % → 99 % | 0,91 → 0,93 | 21,5 → 21,8 | leaps (1/4) |
| vira | 6/8 | 0,63 → 1,00 | 66 % → 96 % | 0,91 → 0,92 | 21,5 → 22,5 | leaps (3/4) |
| habanera | 2/4 | 0,67 → 0,98 | 70 % → 93 % | 0,85 → 0,86 | 18,3 → 17,5 | fig:sincopa (4/4); leaps (1/4) |
| palestrina | 4/4 | 0,82 → 1,00 | 69 % → 96 % | 0,88 → 0,84 | 21,5 → 22,0 | leaps (2/4); steps (1/4) |
| chorale | 4/4 | 0,71 → 1,00 | 60 % → 97 % | 0,88 → 0,88 | 21,5 → 23,3 | stepDown (1/4); leaps (1/4) |
| minuet | 3/4 | 0,83 → 1,00 | 83 % → 100 % | 0,84 → 0,77 | 19,0 → 20,5 | — |
| gavotte | 4/4 | 0,56 → 0,94 | 61 % → 93 % | 0,68 → 0,78 | 19,5 → 20,5 | leaps (2/4); density (2/4); firstOnset (1/4) |
| bourree | 4/4 | 0,47 → 0,77 | 57 % → 93 % | 0,68 → 0,94 | 19,5 → 22,8 | firstOnset (4/4); leaps (1/4) |
| sarabande | 3/4 | 0,65 → 1,00 | 80 % → 100 % | 0,84 → 0,74 | 19,0 → 18,3 | — |
| gigue | 6/8 | 0,48 → 0,99 | 56 % → 90 % | 0,88 → 0,81 | 18,0 → 19,8 | leaps (4/4); arpeggio (3/4) |
| siciliana | 6/8 | 0,56 → 1,00 | 62 % → 97 % | 0,92 → 0,89 | 20,3 → 20,8 | leaps (1/4); bigLeaps (1/4) |
| passepied | 3/8 | 0,45 → 1,00 | 69 % → 100 % | 0,91 → 0,88 | 18,8 → 19,0 | — |
| allemande | 4/4 | 0,34 → 0,50 | 56 % → 82 % | 0,88 → 0,82 | 21,5 → 21,0 | firstOnset (4/4); fig:sixteenths (4/4); density (4/4) |
| fortspinnung | 4/4 | 0,35 → 0,80 | 52 % → 85 % | 0,88 → 0,84 | 21,5 → 21,8 | density (4/4); fig:sixteenths (4/4); sequences (1/4) |
| classical | 4/4 | 0,59 → 0,96 | 58 % → 89 % | 0,88 → 0,77 | 21,5 → 21,5 | sequences (4/4); recovery (1/4); range (1/4) |
| hunt | 6/8 | 0,60 → 1,00 | 64 % → 94 % | 0,91 → 0,80 | 21,5 → 20,8 | leaps (3/4); finalLength (1/4) |
| blues | 4/4 | 0,68 → 0,89 | 69 % → 86 % | 0,72 → 0,67 | 18,0 → 21,3 | restShare (4/4); syncBar (4/4); leaps (1/4) |
| jazz | 4/4 | 0,46 → 0,95 | 47 % → 82 % | 0,88 → 0,61 | 21,5 → 18,5 | leaps (4/4); syncBar (3/4); arpeggio (3/4) |
| pop | 4/4 | 0,54 → 0,91 | 58 % → 78 % | 0,88 → 0,73 | 21,5 → 22,5 | syncBar (4/4); restShare (4/4); motifs (3/4) |

Média dos 37 casos: pontuação 0,60 → 0,95, regras no intervalo 65 % → 93 %, crítico 0,84 → 0,81, típicas 20,0 → 20,7.
