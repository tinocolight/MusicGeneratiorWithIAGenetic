# Os blocos por compasso no algoritmo genético

Gerado por `node tools/meters_ga_study.mjs 8 400`: 8 sementes por variante, 400 gerações, população 80, uma melodia de cerca de 32 tempos (8 compassos de 4/4, 11 de 3/4, 16 de 6/8), pesos por omissão com «não maximizar». Tabela também em `results/meters/ga.csv`.

| Compasso | População inicial | Crítico | Típicas /26 | Distância às figuras reais | Maior trecho copiado (tempos): média / máx. | Entre melodias reais |
|---|---|---|---|---|---|---|
| 4/4 | padrões musicais | 0,88 ± 0,08 | 18,6 | 0,34 ± 0,06 | 4,3 / 5 | 7,4 |
| 4/4 | **blocos do corpus** | 0,88 ± 0,04 | 21,3 | 0,30 ± 0,04 | 5,8 / 8 | 7,4 |
| 3/4 | padrões musicais | 0,83 ± 0,09 | 18,3 | 0,34 ± 0,04 | 4,3 / 5 | 9,2 |
| 3/4 | **blocos do corpus** | 0,82 ± 0,04 | 18,9 | 0,25 ± 0,06 | 5,5 / 7 | 9,2 |
| 6/8 | padrões musicais | 0,92 ± 0,03 | 18,4 | 0,66 ± 0,08 | 2,3 / 3 | 5,0 |
| 6/8 | **blocos do corpus** | 0,92 ± 0,05 | 21,3 | 0,53 ± 0,08 | 2,0 / 3 | 5,0 |

- **Distância às figuras reais**: metade da soma das diferenças entre a frequência de cada figura na melodia gerada e nas melodias reais do mesmo compasso (0 = o mesmo vocabulário rítmico, na mesma proporção).
- **Maior trecho copiado**: o maior número de tempos seguidos (figura, contorno e intervalo de entrada iguais) que a melodia partilha com alguma melodia real do corpus; na última coluna, o mesmo para melodias reais comparadas com as outras (as fórmulas comuns que qualquer melodia partilha).
- O crítico foi treinado com melodias em compassos simples; em 6/8 usa o tempo de semínima com ponto nas suas características, mas deve ler-se com cautela.
