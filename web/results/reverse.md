# Análise inversa: a música real passada pelas regras

Gerado por `node tools/reverse.mjs`. 235 melodias reais completas em 4/4 (4–16 compassos, alinhadas no 1.º tempo forte, finais verdadeiros), comparadas com as mesmas melodias lidas de trás para a frente (retrógrado), com as notas baralhadas, com ruído castanho e branco na mesma tonalidade e âmbito, e com 6 saídas do AG em cada modo.

## Totais

| Grupo | Clássico (por compasso) | Campo de atratores | Crítico |
|---|---|---|---|
| Melodias reais | 988.00 | 10.33 | 0.91 |
| Reais em retrógrado | 933.38 | 10.13 | 0.84 |
| Reais baralhadas | 988.63 | 7.63 | 0.23 |
| Ruído castanho | 986.63 | 7.84 | 0.80 |
| Ruído branco | 988.34 | 5.34 | 0.09 |
| AG clássico | 1564.50 | -0.05 | 0.00 |
| AG campo de atratores | 529.76 | 20.19 | 0.76 |

A aptidão clássica dá à música real mais pontos do que ao ruído branco em 50 % dos pares e mais do que às próprias saídas do AG clássico em 0 %. A aptidão nova dá à música real mais do que ao ruído branco em 96 %, mais do que à melodia baralhada em 82 %, mais do que ao retrógrado em 52 % e mais do que às saídas do AG em 0 %.

## Regras do campo de atratores

| Regra | Reais | Retrógrado | Baralhadas | Ruído branco | AG clássico | AG campo | d (real vs branco) | direto > retrógrado / < |
|---|---|---|---|---|---|---|---|---|
| key | 0.61 ± 0.07 | 0.61 | 0.58 | 0.58 | 0.38 | 0.73 | 0.50 | 0 % / 0 % |
| attractor | -0.37 ± 0.51 | -0.38 | -0.35 | -0.43 | -0.51 | 0.69 | 0.12 | 46 % / 54 % |
| proximity | 0.50 ± 0.11 | 0.50 | 0.05 | -0.14 | -0.52 | 0.49 | 4.04 | 0 % / 0 % |
| regression | -0.19 ± 0.54 | -0.03 | -0.60 | -0.79 | -1.07 | 1.00 | 1.34 | 23 % / 35 % |
| forces | 0.19 ± 0.21 | 0.18 | -0.40 | -0.57 | -0.76 | 1.00 | 3.96 | 53 % / 47 % |
| metric | 0.48 ± 0.12 | 0.41 | 0.42 | 0.33 | -0.02 | 0.98 | 1.27 | 69 % / 28 % |
| cadence | 0.41 ± 0.18 | 0.42 | 0.32 | 0.27 | -0.03 | 0.77 | 0.81 | 48 % / 50 % |
| rhythm | 0.97 ± 0.09 | 0.92 | 0.97 | 0.97 | 0.26 | 0.96 | 0.00 | 49 % / 1 % |
| form | 0.68 ± 0.13 | 0.66 | 0.70 | 0.68 | 0.62 | 1.00 | -0.02 | 53 % / 47 % |
| tension | 0.23 ± 0.22 | 0.21 | 0.03 | 0.03 | 0.04 | 0.68 | 0.87 | 57 % / 43 % |
| variety | 1.03 ± 0.53 | 1.03 | 1.04 | 0.59 | 0.81 | 1.50 | 0.85 | 0 % / 0 % |

## Regras do C# original (por compasso)

| Regra | Reais | Retrógrado | Baralhadas | Ruído branco | AG clássico | AG campo | d (real vs branco) | direto > retrógrado / < |
|---|---|---|---|---|---|---|---|---|
| rhythmicPatterns | 26.34 ± 7.13 | 26.38 | 26.34 | 26.34 | 11.36 | 11.38 | 0.00 | 11 % / 9 % |
| selfHarm1 | -1.06 ± 1.38 | -1.37 | -1.15 | -0.92 | -1.47 | -1.53 | -0.11 | 60 % / 37 % |
| selfHarm2 | -1.28 ± 2.04 | -1.43 | -1.04 | -0.66 | 0.41 | -6.30 | -0.38 | 57 % / 40 % |
| aba | -2.41 ± 4.63 | -2.37 | -3.59 | -3.87 | -23.06 | -4.94 | 0.31 | 30 % / 38 % |
| leitmotif | 43.30 ± 5.58 | 40.04 | 43.30 | 43.30 | 24.71 | 25.88 | 0.00 | 81 % / 16 % |
| wave1 | -16.59 ± 5.04 | -17.37 | -16.61 | -16.60 | -38.78 | -24.43 | 0.00 | 62 % / 37 % |
| wave2 | -22.02 ± 7.45 | -21.53 | -21.98 | -20.71 | -45.60 | -29.55 | -0.18 | 25 % / 52 % |
| range | 19.99 ± 1.11 | 19.99 | 19.99 | 19.97 | 26.69 | 21.02 | 0.02 | 0 % / 0 % |
| scale | 3.69 ± 1.17 | 3.69 | 3.69 | 3.53 | 7.02 | 5.02 | 0.14 | 0 % / 0 % |
| pauseProlongation | 3.51 ± 1.07 | 3.51 | 3.51 | 3.51 | -1.56 | 5.00 | 0.00 | 0 % / 0 % |
| reduceRepetitions | -0.02 ± 0.08 | -0.01 | -0.04 | -0.04 | -0.04 | -0.45 | 0.16 | 2 % / 5 % |
| intervals | -3.58 ± 1.02 | -3.63 | -3.67 | -3.71 | 3.11 | -3.04 | 0.13 | 72 % / 13 % |
| niceRepetitions | 2.46 ± 2.93 | 2.47 | 2.63 | 2.53 | 3.77 | 3.58 | -0.02 | 22 % / 25 % |
| ending | 1.61 ± 0.21 | 1.74 | 1.61 | 1.61 | 5.87 | 1.60 | 0.00 | 0 % / 4 % |
| balance | -44.87 ± 17.19 | -44.87 | -44.87 | -44.87 | 0.03 | -51.54 | 0.00 | 0 % / 0 % |

## Pesos aprendidos (real vs modelos nulos, regressão logística)

- Regras novas: AUC 0.96 (5-fold). Pesos padronizados: key -0.09 · attractor +0.06 · proximity +0.50 · regression +0.01 · forces +1.04 · metric +0.39 · cadence +0.15 · rhythm -0.02 · form -0.12 · tension +0.53 · variety +0.60.
- Regras originais: AUC 0.67. Pesos padronizados: rhythmicPatterns -0.09 · selfHarm1 +0.27 · selfHarm2 -0.18 · aba +0.49 · leitmotif -0.11 · wave1 -0.09 · wave2 -0.22 · range +0.08 · scale +0.16 · pauseProlongation -0.02 · reduceRepetitions +0.23 · intervals +0.10 · niceRepetitions -0.11 · ending +0.00 · balance +0.04.
- Preset «Pesos aprendidos do corpus» (ritmo, forma e tonalidade ficam com os pesos por omissão, porque os modelos nulos conservam o ritmo e a tonalidade da melodia real; as outras regras recebem os pesos positivos aprendidos, com a mesma soma que os por omissão): key 3, attractor 0.17, proximity 1.95, regression 0.04, forces 3.88, metric 3.71, cadence 1.21, rhythm 3, form 2, tension 2.92, variety 1.12.

## Telemann, Sonata III (Spirituoso), como cânone a 2 violinos

Aptidão 8.60; key 0.54, attractor -0.19, proximity 0.32, regression -0.99, forces 0.01, metric 0.35, cadence 0.08, rhythm 0.95, form 0.52, tension -0.09, variety -0.34, canon 0.64.
