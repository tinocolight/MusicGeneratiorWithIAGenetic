# Os blocos por compasso no algoritmo genético

Gerado por `node tools/meters_ga_study.mjs 8 400`: 8 sementes por variante, 400 gerações, população 80, uma melodia de cerca de 32 tempos (8 compassos de 4/4, 11 de 3/4, 16 de 6/8), pesos por omissão com «não maximizar». Tabela também em `results/meters/ga.csv`.

| Compasso | População inicial | Crítico | Típicas /26 | Distância às figuras reais | Maior trecho copiado (tempos): média / máx. | Entre melodias reais |
|---|---|---|---|---|---|---|
| 4/4 | padrões musicais | 0,88 ± 0,08 | 18,6 | 0,34 ± 0,06 | 4,3 / 5 | 7,4 |
| 4/4 | blocos do corpus | 0,88 ± 0,04 | 21,3 | 0,30 ± 0,04 | 5,8 / 8 | 7,4 |
| 4/4 | blocos + idioma 0,75 | 0,86 ± 0,06 | 21,3 | 0,29 ± 0,04 | 5,9 / 6 | 7,4 |
| 4/4 | blocos + idioma 1,5 | 0,84 ± 0,07 | 20,6 | 0,30 ± 0,07 | 6,4 / 8 | 7,4 |
| 3/4 | padrões musicais | 0,83 ± 0,09 | 18,3 | 0,34 ± 0,04 | 4,3 / 5 | 9,2 |
| 3/4 | blocos do corpus | 0,82 ± 0,04 | 18,9 | 0,25 ± 0,06 | 5,5 / 7 | 9,2 |
| 3/4 | blocos + idioma 0,75 | 0,73 ± 0,12 | 18,8 | 0,22 ± 0,04 | 5,8 / 7 | 9,2 |
| 3/4 | blocos + idioma 1,5 | 0,78 ± 0,11 | 19,3 | 0,22 ± 0,05 | 6,1 / 9 | 9,2 |
| 6/8 | padrões musicais | 0,92 ± 0,03 | 18,4 | 0,66 ± 0,08 | 2,3 / 3 | 5,0 |
| 6/8 | blocos do corpus | 0,92 ± 0,05 | 21,3 | 0,53 ± 0,08 | 2,0 / 3 | 5,0 |
| 6/8 | blocos + idioma 0,75 | 0,89 ± 0,07 | 20,8 | 0,46 ± 0,11 | 2,8 / 3 | 5,0 |
| 6/8 | blocos + idioma 1,5 | 0,89 ± 0,04 | 21,5 | 0,41 ± 0,12 | 2,8 / 3 | 5,0 |

- **Distância às figuras reais**: metade da soma das diferenças entre a frequência de cada figura na melodia gerada e nas melodias reais do mesmo compasso (0 = o mesmo vocabulário rítmico, na mesma proporção).
- **Maior trecho copiado**: o maior número de tempos seguidos (figura, contorno e intervalo de entrada iguais) que a melodia partilha com alguma melodia real do corpus; na última coluna, o mesmo para melodias reais comparadas com as outras (as fórmulas comuns que qualquer melodia partilha).
- O crítico foi treinado com melodias em compassos simples; em 6/8 usa o tempo de semínima com ponto nas suas características, mas deve ler-se com cautela.

**Conclusão.** Os blocos de cada compasso na população inicial e na mutação dão melodias mais típicas e com figuras mais perto das reais, sem baixar o crítico, e não copiam trechos do corpus (o maior trecho igual a uma melodia real é mais curto do que o que as melodias reais partilham entre si). Durante a evolução as regras chegam aos seus valores típicos («não maximizar») e deixam de puxar; a regra das ondas favorece notas longas, e em 6/8 o ritmo deriva para a semínima com ponto. A regra «Idioma do corpus» corrige essa deriva (em 6/8 a distância às figuras reais desce de 0,53 para 0,41), mas baixa o crítico 0,02–0,09, como no estudo anterior em 4/4: fica a 0 por omissão e disponível nos pesos para quem queira mais fidelidade às figuras de cada compasso.
