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

