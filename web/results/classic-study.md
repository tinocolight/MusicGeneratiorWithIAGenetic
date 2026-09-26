# Estudo do algoritmo original: combinações de partida

Gerado por `node tools/classic_study.mjs`. Algoritmo do modo clássico (regras do C#, operadores de bits, seleção de elite como no GeneticSharp), 8 compassos em Sol maior. Melodias reais: as 8 últimas barras das melodias em maior do corpus grande (sem as 480 do crítico), por estilo.

## 1. Triagem: que valores do original contam? (desenho de experiências)

Plackett–Burman de 32 ensaios (Hadamard de Sylvester) com reflexão (64 ensaios, resolução IV: os efeitos principais não se confundem com interações de 2 fatores), 3 sementes por ensaio, 30 fatores + 1 fictício. Nível −1 = valor do original (para os pesos: regra desligada), +1 = alternativa. Efeito = média com +1 − média com −1. **Negrito**: acima da margem de erro de Lenth (≈ 95 %).

| Fator | −1 | +1 | Crítico | Típicas /26 | Estilo canção | Estilo dança | Estilo coral | Notas por tempo | Graus conjuntos | Âmbito (meios-tons) |
|---|---|---|---|---|---|---|---|---|---|---|
| Peso: Padrões rítmicos | 0 | original | 0,00 | 0,2 | -0,00 | 0,01 | 0,00 | -0,28 | 0,00 | 0,2 |
| Peso: Auto-harmonização 1 | 0 | original | 0,00 | 0,1 | 0,00 | 0,01 | 0,00 | -0,06 | 0,02 | -2,3 |
| Peso: Auto-harmonização 2 | 0 | original | 0,00 | -0,0 | 0,00 | 0,00 | -0,01 | -0,21 | 0,02 | -4,6 |
| Peso: Repetição ABA (4 c.) | 0 | original | 0,01 | -0,2 | -0,01 | -0,00 | -0,01 | -0,02 | 0,01 | -0,9 |
| Peso: Leitmotiv (ritmo do 1.º c.) | 0 | original | 0,01 | **0,9** | -0,01 | 0,00 | 0,02 | 0,39 | -0,03 | 5,3 |
| Peso: Onda 1 | 0 | original | 0,01 | -0,0 | 0,01 | 0,00 | 0,00 | -0,25 | **0,04** | -5,2 |
| Peso: Onda 2 | 0 | original | 0,01 | 0,3 | 0,01 | -0,01 | 0,01 | 0,08 | 0,02 | -1,8 |
| Peso: Âmbito | 0 | original | -0,00 | 0,5 | **0,04** | 0,02 | **0,04** | -0,14 | **0,07** | **-34,0** |
| Peso: Escala | 0 | original | -0,01 | **1,7** | **0,05** | **0,04** | **0,06** | 0,02 | -0,02 | 3,6 |
| Peso: Pausas e prolongamentos | 0 | original | -0,01 | -0,4 | -0,01 | -0,00 | -0,00 | 0,21 | -0,00 | 3,3 |
| Peso: Repetições excessivas | 0 | original | -0,01 | 0,1 | -0,01 | -0,01 | -0,01 | 0,29 | -0,02 | 0,3 |
| Peso: Intervalos | 0 | original | -0,00 | 0,4 | 0,01 | 0,01 | 0,01 | 0,07 | 0,02 | -1,9 |
| Peso: Repetições interessantes | 0 | original | -0,00 | 0,5 | **0,03** | **0,03** | 0,02 | -0,06 | 0,00 | -1,5 |
| Peso: Terminação (nota longa) | 0 | original | -0,00 | -0,1 | 0,00 | -0,01 | 0,00 | -0,19 | 0,02 | -4,1 |
| Peso: Equilíbrio notas/pausas | 0 | original | 0,00 | 0,5 | **0,03** | **0,03** | 0,03 | -0,52 | 0,03 | -2,1 |
| Peso: Fórmulas de final (corpus) | 0 | 10 | -0,01 | -0,4 | -0,00 | -0,00 | -0,01 | -0,09 | -0,00 | 3,1 |
| Âmbito atrator (± meios-tons) | 15 | 7 | -0,01 | -0,4 | 0,01 | 0,00 | 0,00 | -0,50 | **0,04** | -6,3 |
| Pausas + prolongamentos admitidos | 7–40 % | 55–80 % | -0,01 | -0,0 | 0,00 | -0,02 | -0,01 | **-0,63** | -0,01 | -2,4 |
| Onda 1: amplitude | 12 | 3 | -0,01 | 0,1 | 0,00 | 0,02 | 0,01 | 0,14 | 0,00 | 0,1 |
| Onda 1: períodos por compasso | 0,5 | 0,125 | 0,00 | 0,4 | 0,02 | 0,02 | 0,01 | 0,01 | 0,01 | -1,8 |
| Onda 1: bacia | 3 | 5 | -0,01 | -0,1 | -0,01 | 0,00 | -0,02 | 0,25 | 0,00 | 1,7 |
| Onda 1: valor médio | Lá4 | Si4 | 0,00 | -0,2 | -0,01 | -0,00 | -0,02 | 0,24 | 0,00 | 0,1 |
| Onda 2: amplitude | 4 | 2 | -0,01 | -0,3 | -0,01 | 0,00 | 0,01 | -0,15 | -0,00 | 1,1 |
| Onda 2: períodos por compasso | 2 | 0,5 | 0,00 | -0,1 | 0,00 | -0,01 | 0,01 | -0,47 | 0,01 | -2,1 |
| Onda 2: valor médio | Ré4 | Si4 | 0,00 | -0,3 | 0,01 | -0,00 | 0,01 | -0,06 | 0,00 | -3,9 |
| Onda 2: bacia | 2 | 4 | 0,00 | 0,2 | 0,00 | 0,01 | 0,01 | -0,18 | 0,02 | -3,7 |
| Corrigir lapsos do original | não | sim | 0,00 | 0,2 | 0,01 | 0,00 | 0,00 | -0,30 | 0,02 | **-7,7** |
| Mutação | 0,1 | 0,3 | 0,01 | -0,4 | -0,01 | -0,01 | -0,01 | -0,44 | -0,01 | 1,4 |
| População | 60 | 120 | 0,02 | 0,4 | 0,02 | 0,01 | 0,01 | 0,18 | 0,02 | 0,9 |
| Grupos de pesos | 1 → 2 (25 %) | só o grupo 2 | 0,01 | 0,0 | -0,01 | -0,01 | -0,01 | 0,44 | -0,03 | 5,1 |
| (fator fictício: estima o ruído) | – | – | 0,01 | -0,1 | -0,00 | -0,01 | -0,01 | -0,03 | -0,01 | -0,1 |
| *Margem de erro (Lenth)* | | | 0,02 | 0,79 | 0,02 | 0,02 | 0,03 | 0,62 | 0,03 | 6,98 |

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

Método da entropia cruzada (um desenho sequencial: em cada iteração 16 combinações à volta da média atual, 3 sementes comuns, as 5 melhores definem a nova média e a nova dispersão), 14 iterações, sobre os 16 pesos (em escala logarítmica) e 11 constantes (âmbito atrator, intervalo de pausas, as duas ondas, mutação). Objetivo J = ½ crítico + ½ tipicidade do estilo. No fim, a combinação calibrada, a média final e as 3 melhores avaliadas são confirmadas com 12 sementes novas; fica a melhor.

| Estilo | J por iteração (melhor da iteração) | Calibrada | Média final | Melhor avaliada | Escolhida |
|---|---|---|---|---|---|
| Canção popular | 0,22 0,25 0,25 0,22 0,26 0,24 0,26 0,28 0,26 0,26 0,24 0,26 0,24 0,26 | 0,20 ± 0,02 (crítico 0,00) | 0,21 ± 0,07 (crítico 0,01) | 0,22 ± 0,03 (crítico 0,00) | melhor avaliada 2 |
| Dança (reels, hornpipes) | 0,21 0,22 0,22 0,23 0,24 0,23 0,25 0,22 0,24 0,24 0,24 0,25 0,24 0,25 | 0,17 ± 0,04 (crítico 0,00) | 0,23 ± 0,02 (crítico 0,00) | 0,23 ± 0,03 (crítico 0,00) | melhor avaliada 3 |
| Coral | 0,21 0,23 0,22 0,24 0,23 0,23 0,22 0,24 0,24 0,21 0,22 0,24 0,24 0,23 | 0,19 ± 0,03 (crítico 0,00) | 0,20 ± 0,03 (crítico 0,00) | 0,21 ± 0,03 (crítico 0,00) | melhor avaliada 2 |

| Regra | Original (grupo 2) | Canção popular | Dança (reels, hornpipes) | Coral |
|---|---|---|---|---|
| Padrões rítmicos | 7.02 | 1.1 | 0.16 | 0.28 |
| Auto-harmonização 1 | 2 | 0.58 | 0.26 | 0.08 |
| Auto-harmonização 2 | 4 | 0.03 | 0.081 | 0.52 |
| Repetição ABA (4 c.) | 0.5 | 1.6 | 0.77 | 1.3 |
| Leitmotiv (ritmo do 1.º c.) | 16 | 0.67 | 0.34 | 0.64 |
| Onda 1 | 3.1 | 0.17 | 0.18 | 0.1 |
| Onda 2 | 2.15 | 0.25 | 0.092 | 0.088 |
| Âmbito | 42 | 7 | 0.33 | 0.69 |
| Escala | 16 | 15 | 20 | 20 |
| Pausas e prolongamentos | 4 | 1.1 | 0.42 | 8.6 |
| Repetições excessivas | 2 | 2.2 | 0.41 | 0.3 |
| Intervalos | 14 | 0.35 | 1.8 | 0.36 |
| Repetições interessantes | 10.05 | 20 | 14 | 14 |
| Terminação (nota longa) | 2 | 9.7 | 0.56 | 5 |
| Equilíbrio notas/pausas | 15 | 1.2 | 0.019 | 0.031 |
| Fórmulas de final (corpus) | 0 | 11 | 2.1 | 4.3 |
| Âmbito atrator (±) | 15 | 6 | 4 | 6 |
| Pausas + prolongamentos (%) | 7–40 | 48–83 | 0–53 | 90–100 |
| Onda 1 (média, amplitude, períodos, bacia) | +0, 12, 0.5, 3 | +2, 4, 0.125, 4 | +5, 4, 0.125, 5 | +1, 2, 0.0625, 4 |
| Onda 2 (média, amplitude, períodos, bacia) | -7, 4, 2, 2 | +2, 1, 0.25, 3 | +5, 1, 1, 5 | +2, 2, 1, 2 |
| Mutação | 0,1 | 0,137 | 0,212 | 0,118 |

