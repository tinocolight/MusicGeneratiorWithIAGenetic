# Estudo do algoritmo original: combinações de partida

Gerado por `node tools/classic_study.mjs`. Algoritmo do modo clássico (regras do C#, operadores de bits, seleção de elite como no GeneticSharp), 8 compassos em Sol maior. Melodias reais: as 8 últimas barras das melodias em maior do corpus grande (sem as 480 do crítico), por estilo.

## 1. Triagem: que valores do original contam? (desenho de experiências)

Plackett–Burman de 32 ensaios (Hadamard de Sylvester) com reflexão (64 ensaios, resolução IV: os efeitos principais não se confundem com interações de 2 fatores), 3 sementes por ensaio, 30 fatores + 1 fictício. Nível −1 = valor do original (para os pesos: regra desligada), +1 = alternativa. Efeito = média com +1 − média com −1. **Negrito**: acima da margem de erro de Lenth (≈ 95 %).

| Fator | −1 | +1 | Crítico | Típicas /26 | Estilo canção | Estilo dança | Estilo coral | Notas por tempo | Graus conjuntos | Âmbito (meios-tons) |
|---|---|---|---|---|---|---|---|---|---|---|
| Peso: Padrões rítmicos | 0 | original | 0,00 | 0,1 | 0,01 | 0,00 | 0,00 | -0,32 | 0,01 | 0,5 |
| Peso: Auto-harmonização 1 | 0 | original | 0,00 | 0,3 | 0,01 | 0,02 | 0,01 | -0,04 | 0,01 | -1,4 |
| Peso: Auto-harmonização 2 | 0 | original | 0,00 | -0,3 | -0,01 | 0,01 | -0,00 | -0,25 | 0,02 | -4,0 |
| Peso: Repetição ABA (4 c.) | 0 | original | 0,01 | 0,1 | 0,01 | -0,01 | -0,00 | -0,05 | 0,01 | -0,8 |
| Peso: Leitmotiv (ritmo do 1.º c.) | 0 | original | 0,01 | **1,0** | 0,00 | 0,02 | 0,03 | 0,35 | **-0,04** | 4,7 |
| Peso: Onda 1 | 0 | original | 0,01 | -0,0 | 0,01 | 0,01 | 0,00 | -0,29 | 0,02 | -5,8 |
| Peso: Onda 2 | 0 | original | 0,01 | 0,1 | 0,00 | -0,00 | 0,01 | 0,08 | 0,02 | -1,3 |
| Peso: Âmbito | 0 | original | -0,00 | **0,6** | **0,05** | 0,03 | **0,04** | -0,08 | **0,07** | **-34,3** |
| Peso: Escala | 0 | original | -0,01 | **1,1** | **0,04** | 0,02 | **0,05** | 0,02 | -0,02 | 4,4 |
| Peso: Pausas e prolongamentos | 0 | original | -0,01 | -0,4 | -0,01 | -0,02 | -0,02 | 0,23 | -0,01 | 3,5 |
| Peso: Repetições excessivas | 0 | original | -0,01 | 0,0 | -0,01 | -0,01 | -0,01 | 0,30 | -0,00 | 0,4 |
| Peso: Intervalos | 0 | original | -0,00 | 0,2 | 0,00 | 0,01 | 0,00 | 0,10 | 0,03 | -1,1 |
| Peso: Repetições interessantes | 0 | original | -0,00 | **0,5** | **0,03** | 0,03 | 0,03 | -0,05 | 0,01 | -2,4 |
| Peso: Terminação (nota longa) | 0 | original | -0,00 | 0,4 | 0,01 | -0,01 | 0,01 | -0,12 | 0,01 | -2,4 |
| Peso: Equilíbrio notas/pausas | 0 | original | 0,00 | **0,5** | **0,02** | 0,01 | 0,02 | -0,52 | 0,03 | -4,2 |
| Peso: Fórmulas de final (corpus) | 0 | 10 | -0,01 | **-0,8** | **-0,02** | -0,02 | -0,03 | -0,15 | -0,00 | 1,9 |
| Âmbito atrator (± meios-tons) | 15 | 7 | -0,01 | -0,1 | 0,02 | 0,02 | 0,01 | -0,49 | 0,04 | -5,4 |
| Pausas + prolongamentos admitidos | 7–40 % | 55–80 % | -0,01 | -0,3 | 0,01 | -0,02 | -0,01 | -0,68 | -0,01 | -3,3 |
| Onda 1: amplitude | 12 | 3 | -0,00 | 0,1 | 0,00 | 0,01 | 0,01 | 0,13 | 0,00 | 1,7 |
| Onda 1: períodos por compasso | 0,5 | 0,125 | 0,00 | 0,3 | 0,02 | 0,02 | 0,01 | -0,01 | 0,01 | -0,3 |
| Onda 1: bacia | 3 | 5 | -0,01 | -0,2 | -0,00 | 0,01 | -0,01 | 0,22 | -0,00 | 1,9 |
| Onda 1: valor médio | Lá4 | Si4 | 0,00 | -0,2 | 0,01 | -0,01 | -0,00 | 0,21 | -0,00 | 0,1 |
| Onda 2: amplitude | 4 | 2 | -0,00 | 0,0 | 0,01 | 0,01 | 0,01 | -0,19 | -0,01 | 1,1 |
| Onda 2: períodos por compasso | 2 | 0,5 | 0,00 | 0,0 | 0,00 | 0,00 | 0,01 | -0,47 | 0,01 | -3,7 |
| Onda 2: valor médio | Ré4 | Si4 | 0,00 | -0,1 | 0,00 | 0,00 | 0,00 | -0,04 | 0,01 | -4,5 |
| Onda 2: bacia | 2 | 4 | 0,00 | -0,1 | -0,01 | 0,01 | 0,00 | -0,16 | 0,02 | -3,9 |
| Corrigir lapsos do original | não | sim | -0,00 | -0,0 | 0,01 | -0,01 | -0,01 | -0,25 | 0,03 | **-7,4** |
| Mutação | 0,1 | 0,3 | 0,01 | -0,1 | -0,00 | -0,01 | 0,00 | -0,45 | 0,00 | 2,0 |
| População | 60 | 120 | 0,01 | **0,5** | 0,02 | 0,01 | 0,02 | 0,22 | 0,02 | -0,7 |
| Grupos de pesos | 1 → 2 (25 %) | só o grupo 2 | 0,01 | -0,3 | -0,01 | -0,01 | -0,02 | 0,50 | -0,00 | 5,1 |
| (fator fictício: estima o ruído) | – | – | 0,01 | -0,1 | -0,00 | 0,00 | -0,01 | -0,00 | -0,00 | -0,2 |
| *Margem de erro (Lenth)* | | | 0,02 | 0,45 | 0,02 | 0,04 | 0,03 | 0,69 | 0,04 | 6,70 |

## 2. Do fim para o início: calibração a partir da música real

As constantes vêm diretamente das melodias reais de cada estilo: âmbito atrator = P90 da distância das notas ao centro da melodia + 2; pausas e prolongamentos admitidos = P10–P90 da percentagem real; onda 1 = centro e meia-amplitude medianos do contorno, um ciclo em 8 compassos, bacia = P75 da distância ao centro. Os pesos das regras são aprendidos para que as melodias reais fiquem acima das suas vizinhas (as mesmas com 2–48 genes trocados, como faz a mutação de bits) e acima do que o AG escreve com os pesos atuais; 6 voltas, 8 sementes por volta, média das 3 últimas.

| Regra | Original (grupo 2) | Canção popular | Dança (reels, hornpipes) | Coral |
|---|---|---|---|---|
| Padrões rítmicos | 7.02 | 1.8 | 0.02 | 1.7 |
| Auto-harmonização 1 | 2 | 0.34 | 0.32 | 0 |
| Auto-harmonização 2 | 4 | 0.13 | 0 | 0.054 |
| Repetição ABA (4 c.) | 0.5 | 3.3 | 3.2 | 2 |
| Leitmotiv (ritmo do 1.º c.) | 16 | 2.3 | 1.8 | 1.7 |
| Onda 1 | 3.1 | 0 | 0.95 | 0.19 |
| Onda 2 | 2.15 | 0.083 | 0.52 | 0.18 |
| Âmbito | 42 | 5.8 | 1.2 | 1.8 |
| Escala | 16 | 20 | 20 | 14 |
| Pausas e prolongamentos | 4 | 0.83 | 1 | 20 |
| Repetições excessivas | 2 | 0 | 0 | 0 |
| Intervalos | 14 | 0.85 | 4.9 | 0.91 |
| Repetições interessantes | 10.05 | 14 | 11 | 10 |
| Terminação (nota longa) | 2 | 0 | 0 | 0 |
| Equilíbrio notas/pausas | 15 | 1.1 | 0 | 0 |
| Fórmulas de final (corpus) | 0 | 13 | 5.6 | 5.8 |

| Constante | Original | Canção popular | Dança (reels, hornpipes) | Coral |
|---|---|---|---|---|
| Âmbito atrator (±) | 15 | 7 | 9 | 7 |
| Pausas + prolongamentos (%) | 7–40 | 55–80 | 9–63 | 71–81 |
| Onda 1 (média, amplitude, períodos, bacia) | +0, 12, 0.5, 3 | +2, 3, 0.125, 4 | +5, 4, 0.125, 5 | +2, 4, 0.125, 4 |
| Onda 2 (média, amplitude, períodos, bacia) | -7, 4, 2, 2 | +2, 2, 1, 3 | +5, 2, 1, 4 | +2, 2, 1, 3 |

Evolução das voltas (8 sementes cada; crítico · estilo próprio · notas por tempo · âmbito):

- Canção popular: 0,00 · 39 % · 0,96 · 30,3 → 0,00 · 38 % · 1,00 · 42,0 → 0,00 · 39 % · 0,93 · 34,1 → 0,00 · 40 % · 1,15 · 33,9 → 0,00 · 37 % · 0,89 · 31,3 → 0,00 · 41 % · 1,26 · 32,3
- Dança (reels, hornpipes): 0,00 · 36 % · 1,62 · 56,9 → 0,00 · 33 % · 1,66 · 54,4 → 0,00 · 31 % · 1,24 · 51,0 → 0,00 · 33 % · 1,50 · 53,0 → 0,00 · 33 % · 1,20 · 45,8 → 0,00 · 31 % · 1,55 · 49,9
- Coral: 0,00 · 32 % · 0,68 · 33,8 → 0,00 · 37 % · 1,44 · 51,8 → 0,00 · 28 % · 1,17 · 31,9 → 0,00 · 36 % · 1,07 · 49,9 → 0,00 · 36 % · 1,00 · 39,4 → 0,00 · 39 % · 1,13 · 56,3

## 3. Do início para o fim: otimização a partir da calibração

Método da entropia cruzada (um desenho sequencial: em cada iteração 16 combinações à volta da média atual, 3 sementes comuns, as 5 melhores definem a nova média e a nova dispersão) sobre os 16 pesos (em escala logarítmica) e 11 constantes (âmbito atrator, intervalo de pausas, as duas ondas, mutação). Objetivo J = 0,4 × crítico + 0,3 × tipicidade do estilo (parte das 26 características dentro do P10–P90 do estilo) + 0,3 × (1 − distância ao estilo / 3), sendo a distância a média de |x − mediana| / dispersão das 26 características, com teto 3; menos 0,3 × uma penalização por sair do que o estilo admite (âmbito acima do P90 real + 3 meios-tons, por cada oitava a mais; notas por tempo acima de 1,2 × P90). Sem a distância e a penalização, a contagem sozinha deixava passar âmbitos de 5 oitavas. Com os operadores de bits, a dança e o coral partem dos pesos encontrados para a canção, com as suas próprias constantes. No fim, a combinação de partida, a média final e as 3 melhores avaliadas são confirmadas com 12 sementes novas; fica a melhor. Primeiro com os operadores de bits do original (14 iterações, a partir da calibração), depois com os operadores musicais da página (12 iterações, a partir do resultado anterior).

**Operadores de bits (o original)**

| Estilo | J por iteração (melhor da iteração) | De partida | Média final | Melhor avaliada | Escolhida |
|---|---|---|---|---|---|
| Canção popular | 0,27 0,30 0,31 0,33 0,31 0,36 0,38 0,35 0,35 0,35 0,34 0,33 0,35 0,34 | -0,18 ± 0,22 (crítico 0,00, estilo 40 %) | 0,31 ± 0,20 (crítico 0,01, estilo 52 %) | 0,29 ± 0,27 (crítico 0,00, estilo 48 %) | média final |
| Dança (reels, hornpipes) | 0,26 0,24 0,26 0,25 0,26 0,27 0,26 0,28 0,25 0,26 0,27 0,27 0,28 0,27 | -0,45 ± 0,20 (crítico 0,00, estilo 34 %) | 0,23 ± 0,03 (crítico 0,00, estilo 37 %) | 0,25 ± 0,04 (crítico 0,00, estilo 40 %) | melhor avaliada 1 |
| Coral | 0,25 0,29 0,27 0,28 0,27 0,30 0,27 0,31 0,30 0,30 0,31 0,29 0,29 0,33 | -0,55 ± 0,30 (crítico 0,00, estilo 39 %) | 0,26 ± 0,20 (crítico 0,00, estilo 44 %) | 0,22 ± 0,20 (crítico 0,00, estilo 45 %) | melhor avaliada 3 |

**Operadores musicais**

| Estilo | J por iteração (melhor da iteração) | De partida | Média final | Melhor avaliada | Escolhida |
|---|---|---|---|---|---|
| Canção popular | 0,73 0,79 0,78 0,79 0,82 0,81 0,82 0,84 0,81 0,82 0,84 0,81 | 0,42 ± 0,03 (crítico 1,00, estilo 42 %) | 0,77 ± 0,04 (crítico 0,89, estilo 70 %) | 0,77 ± 0,04 (crítico 0,93, estilo 67 %) | melhor avaliada 2 |
| Dança (reels, hornpipes) | 0,81 0,78 0,78 0,80 0,82 0,82 0,84 0,84 0,82 0,82 0,83 0,82 | 0,41 ± 0,05 (crítico 0,98, estilo 41 %) | 0,77 ± 0,06 (crítico 0,90, estilo 69 %) | 0,78 ± 0,06 (crítico 0,94, estilo 66 %) | melhor avaliada 3 |
| Coral | 0,63 0,77 0,72 0,72 0,76 0,75 0,77 0,75 0,75 0,77 0,76 0,78 | 0,15 ± 0,01 (crítico 0,98, estilo 40 %) | 0,74 ± 0,04 (crítico 0,96, estilo 58 %) | 0,77 ± 0,03 (crítico 0,95, estilo 65 %) | melhor avaliada 1 |

Valores escolhidos:

| | Original | Canção popular (bits) | Dança (reels, hornpipes) (bits) | Coral (bits) | Canção popular (mus.) | Dança (reels, hornpipes) (mus.) | Coral (mus.) |
|---|---|---|---|---|---|---|---|
| Peso: Padrões rítmicos | 7.02 | 0.58 | 0.13 | 0.013 | 0.26 | 5.9 | 1 |
| Peso: Auto-harmonização 1 | 2 | 0.27 | 0.053 | 0.17 | 1.7 | 4.7 | 0.8 |
| Peso: Auto-harmonização 2 | 4 | 0.17 | 0.11 | 0.27 | 0.39 | 1.4 | 1 |
| Peso: Repetição ABA (4 c.) | 0.5 | 1.4 | 0.078 | 0.18 | 0.46 | 2 | 0.96 |
| Peso: Leitmotiv (ritmo do 1.º c.) | 16 | 1.9 | 0.079 | 0.34 | 0.65 | 1.6 | 0.5 |
| Peso: Onda 1 | 3.1 | 0.59 | 0.071 | 0.069 | 0.17 | 1.5 | 0.48 |
| Peso: Onda 2 | 2.15 | 0.065 | 0.019 | 0.03 | 0.27 | 0.45 | 0.69 |
| Peso: Âmbito | 42 | 20 | 20 | 20 | 1.5 | 20 | 1.1 |
| Peso: Escala | 16 | 18 | 1.9 | 2.2 | 3.1 | 13 | 2 |
| Peso: Pausas e prolongamentos | 4 | 1.8 | 0.34 | 5 | 4.2 | 4.5 | 20 |
| Peso: Repetições excessivas | 2 | 1.3 | 0.97 | 0.67 | 1.1 | 6.4 | 8.2 |
| Peso: Intervalos | 14 | 1.8 | 0.34 | 0.077 | 0.89 | 1.8 | 0.7 |
| Peso: Repetições interessantes | 10.05 | 13 | 0.93 | 1.9 | 3.4 | 1.3 | 2.3 |
| Peso: Terminação (nota longa) | 2 | 4.4 | 0.97 | 16 | 20 | 11 | 11 |
| Peso: Equilíbrio notas/pausas | 15 | 1.1 | 0.032 | 0.17 | 3.2 | 0.82 | 0.46 |
| Peso: Fórmulas de final (corpus) | 0 | 10 | 1.4 | 3.3 | 3 | 10 | 0.71 |
| Âmbito atrator (±) | 15 | 3 | 5 | 3 | 3 | 10 | 4 |
| Pausas + prolongamentos (%) | 7–40 | 52–75 | 6–62 | 78–88 | 50–69 | 23–81 | 70–80 |
| Onda 1 (média, amplitude, períodos, bacia) | +0, 12, 0.5, 3 | +2, 3, 0.0625, 4 | +3, 6, 0.0625, 5 | +2, 2, 0.0625, 3 | +3, 3, 0.0625, 4 | +2, 5, 0.0625, 6 | +2, 1, 0.0625, 2 |
| Onda 2 (média, amplitude, períodos, bacia) | -7, 4, 2, 2 | +2, 1, 1, 2 | +5, 1, 1, 5 | +2, 2, 0.25, 3 | +2, 0, 0.5, 2 | +5, 1, 2, 3 | +2, 3, 0.25, 3 |
| Mutação | 0,1 | 0,176 | 0,208 | 0,167 | 0,89 | 0,939 | 0,869 |
| Operadores · gerações · população | bits · 1500 · 60 | bits · 1500 · 60 | bits · 1500 · 60 | bits · 1500 · 60 | musicais · 600 · 80 | musicais · 600 · 80 | musicais · 600 · 80 |

## 4. O que ainda conta, à volta de cada combinação (triagem local)

Plackett–Burman de 32 ensaios × 3 sementes à volta de cada combinação escolhida: cada peso a metade ou ao dobro, cada constante um passo abaixo ou acima, 6 fatores fictícios. Efeito em J (+ = aumentar o valor ajuda). Só os efeitos acima da margem de erro de Lenth.

- **Canção popular, bits** (J médio 0,19, margem 0,11): nenhum fator acima do ruído.
- **Dança (reels, hornpipes), bits** (J médio 0,22, margem 0,03): nenhum fator acima do ruído.
- **Coral, bits** (J médio 0,14, margem 0,11): nenhum fator acima do ruído.
- **Canção popular, operadores musicais** (J médio 0,68, margem 0,07): nenhum fator acima do ruído.
- **Dança (reels, hornpipes), operadores musicais** (J médio 0,69, margem 0,06): Peso: Escala +0,08.
- **Coral, operadores musicais** (J médio 0,60, margem 0,06): Peso: Padrões rítmicos +0,10.

## 5. Confirmação (24 sementes)

Estilo: parte das 26 características dentro do P10–P90 do estilo · distância ao estilo (0 = na mediana, 3 = teto).

| Configuração | Crítico | Típicas /26 | Canção | Dança | Coral | Notas/tempo | Graus conjuntos | Âmbito | Acaba na tónica |
|---|---|---|---|---|---|---|---|---|---|
| Original (valores do programa de 2020) | 0,00 ± 0,01 | 11,5 | 36 % · 1,80 | 35 % · 1,92 | 43 % · 1,78 | 2,72 | 0,15 | 35,8 | 8 % |
| Original, com os lapsos corrigidos | 0,01 ± 0,01 | 11,6 | 38 % · 1,79 | 33 % · 1,93 | 43 % · 1,78 | 2,69 | 0,17 | 39,1 | 21 % |
| Combinação «Canção popular» | 0,00 ± 0,00 | 12,6 | 50 % · 1,57 | 33 % · 1,91 | 45 % · 1,74 | 0,63 | 0,48 | 13,8 | 33 % |
| Combinação «Dança (reels, hornpipes)» | 0,00 ± 0,00 | 11,8 | 41 % · 1,65 | 39 % · 1,82 | 36 % · 1,89 | 1,52 | 0,34 | 10,6 | 21 % |
| Combinação «Coral» | 0,00 ± 0,00 | 13,5 | 53 % · 1,52 | 34 % · 1,87 | 46 % · 1,70 | 0,93 | 0,49 | 21,0 | 29 % |
| Original + operadores musicais | 0,95 ± 0,04 | 14,8 | 62 % · 1,24 | 73 % · 0,96 | 47 % · 1,54 | 2,98 | 0,35 | 22,0 | 17 % |
| Original, lapsos corrigidos + operadores musicais | 0,95 ± 0,03 | 16,0 | 65 % · 1,13 | 75 % · 0,90 | 51 % · 1,43 | 2,61 | 0,26 | 19,9 | 21 % |
| Combinação «Canção popular» afinada para os operadores musicais | 0,90 ± 0,07 | 18,0 | 75 % · 0,95 | 62 % · 1,20 | 57 % · 1,36 | 1,99 | 0,52 | 9,8 | 71 % |
| Combinação «Dança (reels, hornpipes)» afinada para os operadores musicais | 0,91 ± 0,08 | 16,0 | 67 % · 1,07 | 72 % · 0,92 | 52 % · 1,41 | 2,52 | 0,50 | 11,6 | 75 % |
| Combinação «Coral» afinada para os operadores musicais | 0,92 ± 0,07 | 19,5 | 71 % · 0,97 | 60 % · 1,08 | 58 % · 1,32 | 1,33 | 0,66 | 8,1 | 54 % |
| *Reais: canção popular (433)* | *0,86* | *21,4* | *85 % · 0,73* | *65 % · 1,09* | *72 % · 1,06* | *1,24* | *0,48* | *12,5* | *73 %* |
| *Reais: dança (reels, hornpipes) (159)* | *0,89* | *19,1* | *78 % · 0,91* | *79 % · 0,82* | *62 % · 1,22* | *2,36* | *0,49* | *17,6* | *85 %* |
| *Reais: coral (25)* | *0,90* | *23,1* | *81 % · 0,80* | *56 % · 1,23* | *86 % · 0,73* | *0,94* | *0,68* | *11,7* | *76 %* |

Melodias reais: as de teste (1 em cada 5, não usadas na calibração). Estilo = parte das 26 características dentro do intervalo P10–P90 das melodias reais desse estilo.
