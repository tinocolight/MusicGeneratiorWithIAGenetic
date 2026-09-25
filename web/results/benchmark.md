# Benchmark (6 sementes por configuração)

Gerado por `node tools/benchmark.mjs`. Peças de 8 compassos em Sol maior; ~47–67 mil avaliações por execução. Média ± desvio-padrão entre sementes.

| Configuração | Crítico (real?) | Típicas /26 | Pausas | Notas/tempo | Grau conjunto | Surpresa (bits) | Cânone 1 c.: consonância forte | 5.as/8.as paral./c. | R² 1 onda |
|---|---|---|---|---|---|---|---|---|---|
| *Melodias reais (corpus, n=480)* | 0.86 ± 0.19 | 22.1 ± 2.6 | 3 % ± 5 % | 1.06 ± 0.38 | 0.60 ± 0.14 | 2.85 ± 0.34 | 55 % ± 14 % | 0.14 ± 0.22 | 0.89 ± 0.14 |
| *Nulo: white-diatonic* | 0.00 ± 0.00 | 10.7 ± 1.5 | 7 % ± 4 % | 1.03 ± 0.10 | 0.13 ± 0.06 | 6.26 ± 0.37 | 57 % ± 14 % | 0.02 ± 0.05 | 0.89 ± 0.16 |
| *Nulo: brown* | 0.02 ± 0.04 | 19.8 ± 2.1 | 7 % ± 5 % | 1.03 ± 0.12 | 0.55 ± 0.10 | 3.14 ± 0.32 | 53 % ± 12 % | 0.08 ± 0.13 | 0.90 ± 0.09 |
| *Nulo: pink* | 0.01 ± 0.03 | 17.4 ± 2.0 | 6 % ± 4 % | 1.05 ± 0.10 | 0.41 ± 0.09 | 3.75 ± 0.39 | 53 % ± 10 % | 0.03 ± 0.06 | 0.87 ± 0.15 |
| Clássico (regras e operadores originais) | 0.00 ± 0.00 | 11.5 ± 1.8 | 1 % ± 2 % | 2.80 ± 0.45 | 0.14 ± 0.02 | 6.15 ± 0.13 | 57 % ± 7 % | 0.12 ± 0.11 | 0.47 ± 0.37 |
| Clássico, 1.ª execução (onda 1 = 0) | 0.01 ± 0.01 | 12.0 ± 1.3 | 2 % ± 2 % | 2.51 ± 0.15 | 0.14 ± 0.05 | 6.11 ± 0.15 | 52 % ± 10 % | 0.12 ± 0.11 | 0.43 ± 0.42 |
| Clássico sem ondas | 0.01 ± 0.01 | 12.7 ± 1.8 | 0 % ± 1 % | 3.49 ± 0.21 | 0.14 ± 0.03 | 6.05 ± 0.14 | 54 % ± 12 % | 0.21 ± 0.20 | 0.28 ± 0.40 |
| Clássico + operadores musicais | 0.93 ± 0.04 | 15.5 ± 0.5 | 0 % ± 0 % | 2.84 ± 0.51 | 0.26 ± 0.06 | 3.78 ± 0.29 | 49 % ± 12 % | 1.00 ± 0.59 | 0.81 ± 0.19 |
| Campo: 2 senos do original | 0.90 ± 0.11 | 16.5 ± 2.6 | 7 % ± 1 % | 1.49 ± 0.16 | 0.55 ± 0.08 | 3.17 ± 0.18 | 99 % ± 2 % | 0.17 ± 0.21 | 0.80 ± 0.29 |
| Campo: arco de frase | 0.87 ± 0.03 | 18.8 ± 1.2 | 4 % ± 3 % | 1.51 ± 0.26 | 0.51 ± 0.05 | 3.32 ± 0.06 | 99 % ± 2 % | 0.24 ± 0.27 | 0.79 ± 0.18 |
| Campo: arco, sem bacias (ablação) | 0.91 ± 0.06 | 18.0 ± 1.7 | 3 % ± 3 % | 1.47 ± 0.35 | 0.56 ± 0.06 | 3.31 ± 0.24 | 94 % ± 5 % | 0.19 ± 0.22 | 0.93 ± 0.05 |
| Campo: 1/f | 0.90 ± 0.05 | 18.3 ± 2.0 | 4 % ± 3 % | 1.50 ± 0.18 | 0.58 ± 0.09 | 3.26 ± 0.28 | 94 % ± 5 % | 0.17 ± 0.06 | 0.91 ± 0.07 |
| Campo: Rössler | 0.79 ± 0.20 | 19.5 ± 1.4 | 4 % ± 2 % | 1.30 ± 0.31 | 0.56 ± 0.09 | 3.35 ± 0.25 | 94 % ± 5 % | 0.17 ± 0.23 | 0.94 ± 0.06 |
| Campo: Lorenz | 0.89 ± 0.05 | 19.2 ± 1.0 | 5 % ± 3 % | 1.35 ± 0.08 | 0.59 ± 0.07 | 3.15 ± 0.22 | 86 % ± 7 % | 0.19 ± 0.15 | 0.92 ± 0.05 |
| Campo: melodia composta | 0.53 ± 0.25 | 16.7 ± 1.6 | 6 % ± 1 % | 1.16 ± 0.25 | 0.52 ± 0.06 | 3.71 ± 0.34 | 69 % ± 9 % | 0.07 ± 0.12 | 0.96 ± 0.03 |
| Cânone (2.ª voz a 1 compasso) | 0.78 ± 0.18 | 16.5 ± 1.0 | 8 % ± 1 % | 1.31 ± 0.19 | 0.43 ± 0.09 | 3.67 ± 0.32 | 100 % ± 0 % | 0.00 ± 0.00 | 0.94 ± 0.06 |

## Programa C# original (GeneticSharp 2.6, 40 s por execução)

| Execução | Gerações | Crítico | Pausas | Notas/tempo | Cânone 1 c. |
|---|---|---|---|---|---|
| 1 (onda 1 = 0) | 5019 | 0.00 | 2 % | 2.41 | 61 % |
| 2 | 5351 | 0.00 | 0 % | 3.38 | 46 % |
| 3 | 5420 | 0.00 | 6 % | 3.13 | 50 % |
| 4 | 5337 | 0.00 | 0 % | 3.25 | 50 % |

## MAP-Elites

47120 avaliações · 51 células preenchidas (80 %) · 13 com crítico ≥ 0,7 · crítico médio 0.49 ± 0.28 · notas/tempo 1.63 ± 0.62 · âmbito 15.9 ± 4.5

## Estudo das ondas no corpus (n = 480)

R² de uma única onda sinusoidal ajustada à melodia (quartis 25/50/75 %):

| Melodias | Q1 | Mediana | Q3 |
|---|---|---|---|
| Reais | 0.32 | 0.42 | 0.54 |
| Reais baralhadas | 0.00 | 0.15 | 0.21 |
| Ruído castanho | 0.41 | 0.54 | 0.67 |

A melodia real tem R² maior do que a sua versão baralhada em 97 % dos casos. Oscilação do contorno significativa (permutação, p < 0,05): reais 73 %, baralhadas 7 %, castanho 84 %.

Frequência da onda mais lenta escolhida (ciclos por compasso → nº de melodias): 0.000 → 95, 0.063 → 1, 0.083 → 1, 0.125 → 128, 0.167 → 95, 0.250 → 95, 0.333 → 28, 0.500 → 32, 0.667 → 1, 0.750 → 4. Amplitude mediana ±2.89 semitons. Nº de ondas escolhido pelo BIC: {"1":47,"2":159,"3":274}.
