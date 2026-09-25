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
| Campo: 2 senos do original | 0.84 ± 0.17 | 18.0 ± 1.8 | 7 % ± 1 % | 1.52 ± 0.26 | 0.57 ± 0.07 | 3.37 ± 0.25 | 91 % ± 9 % | 0.48 ± 0.30 | 0.86 ± 0.15 |
| Campo: arco de frase | 0.93 ± 0.03 | 17.5 ± 2.7 | 4 % ± 3 % | 1.63 ± 0.27 | 0.57 ± 0.07 | 3.22 ± 0.14 | 96 % ± 6 % | 0.26 ± 0.26 | 0.93 ± 0.05 |
| Campo: arco, sem bacias (ablação) | 0.94 ± 0.04 | 17.8 ± 1.2 | 4 % ± 3 % | 1.77 ± 0.28 | 0.57 ± 0.07 | 3.21 ± 0.36 | 96 % ± 4 % | 0.21 ± 0.25 | 0.91 ± 0.04 |
| Campo: 1/f | 0.90 ± 0.07 | 18.3 ± 1.9 | 7 % ± 1 % | 1.43 ± 0.22 | 0.59 ± 0.06 | 3.12 ± 0.22 | 93 % ± 6 % | 0.21 ± 0.17 | 0.79 ± 0.29 |
| Campo: Rössler | 0.90 ± 0.06 | 19.7 ± 1.5 | 5 % ± 2 % | 1.48 ± 0.27 | 0.61 ± 0.07 | 3.20 ± 0.26 | 94 % ± 5 % | 0.12 ± 0.17 | 0.90 ± 0.08 |
| Campo: Lorenz | 0.92 ± 0.04 | 20.2 ± 1.5 | 3 % ± 2 % | 1.48 ± 0.28 | 0.62 ± 0.07 | 3.13 ± 0.14 | 86 % ± 14 % | 0.10 ± 0.17 | 0.94 ± 0.03 |
| Campo: melodia composta | 0.75 ± 0.21 | 16.2 ± 1.6 | 5 % ± 3 % | 1.42 ± 0.27 | 0.64 ± 0.03 | 3.38 ± 0.21 | 56 % ± 14 % | 0.24 ± 0.20 | 0.97 ± 0.02 |
| Cânone (2.ª voz a 1 compasso) | 0.89 ± 0.04 | 16.8 ± 1.2 | 8 % ± 1 % | 1.47 ± 0.23 | 0.44 ± 0.07 | 3.44 ± 0.18 | 100 % ± 0 % | 0.00 ± 0.00 | 0.91 ± 0.09 |

## Programa C# original (GeneticSharp 2.6, 40 s por execução)

| Execução | Gerações | Crítico | Pausas | Notas/tempo | Cânone 1 c. |
|---|---|---|---|---|---|
| 1 (onda 1 = 0) | 5019 | 0.00 | 2 % | 2.41 | 61 % |
| 2 | 5351 | 0.00 | 0 % | 3.38 | 46 % |
| 3 | 5420 | 0.00 | 6 % | 3.13 | 50 % |
| 4 | 5337 | 0.00 | 0 % | 3.25 | 50 % |

## Vozes: cânone desde a geração 0

Configurações de `autoConfigure` (ondas no registo comum dos instrumentos). «Desde a geração 0»: a população inicial é construída nota a nota a concordar com as vozes que soam; «só na aptidão»: população inicial aleatória. Contraponto = componente `canon` da aptidão (média dos pares, +0,3 × tríades com 3 vozes).

| Configuração | Contraponto na geração 0 | Contraponto final | Gerações até 0,8 | Consonância forte | 5.as/8.as paral./c. | Tríades | Crítico | Típicas /26 |
|---|---|---|---|---|---|---|---|---|
| Telemann: 2 violinos, 2.º no c. 2 · cânone desde a geração 0 | 0.89 ± 0.07 | 1.10 ± 0.03 | 1 ± 0 | 100 % ± 0 % | 0.00 ± 0.00 | — | 0.84 ± 0.12 | 18.0 ± 1.8 |
| Telemann · cânone só na aptidão | 0.43 ± 0.11 | 1.09 ± 0.04 | 22 ± 5 | 100 % ± 0 % | 0.00 ± 0.00 | — | 0.85 ± 0.08 | 18.3 ± 1.5 |
| Trio: violino, viola (c. 3), violoncelo 8.ª abaixo (c. 5) · desde a geração 0 | 0.89 ± 0.09 | 1.17 ± 0.06 | 2 ± 1 | 87 % ± 2 % | 0.00 ± 0.00 | 87 % ± 11 % | 0.79 ± 0.11 | 18.5 ± 1.5 |
| Trio · cânone só na aptidão | 0.27 ± 0.10 | 1.17 ± 0.04 | 33 ± 7 | 90 % ± 2 % | 0.00 ± 0.00 | 72 % ± 10 % | 0.63 ± 0.17 | 17.5 ± 1.6 |
| Cânone à 5.ª: oboé e fagote (c. 2) | 0.84 ± 0.07 | 0.99 ± 0.03 | 2 ± 2 | 98 % ± 4 % | 0.00 ± 0.00 | — | 0.91 ± 0.04 | 19.3 ± 2.5 |
| Ronda circular a 3 vozes (entradas a cada 2 c.) | 0.97 ± 0.07 | 1.19 ± 0.03 | 1 ± 0 | 87 % ± 1 % | 0.00 ± 0.00 | 80 % ± 5 % | 0.79 ± 0.05 | 19.0 ± 1.3 |
| Só a melodia · pesos por omissão | — | — | — | — | — | — | 0.79 ± 0.18 | 17.7 ± 2.0 |
| Só a melodia · pesos aprendidos da música real | — | — | — | — | — | — | 0.86 ± 0.09 | 17.8 ± 2.3 |

## MAP-Elites

47120 avaliações · 52 células preenchidas (81 %) · 19 com crítico ≥ 0,7 · crítico médio 0.56 ± 0.28 · notas/tempo 1.64 ± 0.65 · âmbito 15.6 ± 3.7

## Estudo das ondas no corpus (n = 480)

R² de uma única onda sinusoidal ajustada à melodia (quartis 25/50/75 %):

| Melodias | Q1 | Mediana | Q3 |
|---|---|---|---|
| Reais | 0.32 | 0.42 | 0.54 |
| Reais baralhadas | 0.00 | 0.15 | 0.21 |
| Ruído castanho | 0.41 | 0.54 | 0.67 |

A melodia real tem R² maior do que a sua versão baralhada em 97 % dos casos. Oscilação do contorno significativa (permutação, p < 0,05): reais 73 %, baralhadas 7 %, castanho 84 %.

Frequência da onda mais lenta escolhida (ciclos por compasso → nº de melodias): 0.000 → 95, 0.063 → 1, 0.083 → 1, 0.125 → 128, 0.167 → 95, 0.250 → 95, 0.333 → 28, 0.500 → 32, 0.667 → 1, 0.750 → 4. Amplitude mediana ±2.89 semitons. Nº de ondas escolhido pelo BIC: {"1":47,"2":159,"3":274}.
