# Convergência a partir de uma população musical ou aleatória

Gerado por `node tools/convergence.mjs 4 2000`. Melhor indivíduo em cada geração, média de 4 sementes; configurações de «Auto-configurar» (a melodia só com a configuração por omissão). Crítico nos primeiros 8 compassos.

| Conjunto | População inicial | g. 0 | g. 10 | g. 50 | g. 100 | g. 300 | g. 600 | g. 1000 | g. 1500 | g. 2000 |
|---|---|---|---|---|---|---|---|---|---|---|
| Só a melodia | blocos do corpus | 13.39 · 0.85 | 14.92 · 0.78 | 15.95 · 0.76 | 16.21 · 0.85 | 16.43 · 0.87 | 16.51 · 0.88 | 16.54 · 0.90 | 16.55 · 0.90 | 16.56 · 0.90 |
| Só a melodia | com padrões musicais | 11.48 · 0.69 | 13.78 · 0.67 | 15.75 · 0.85 | 16.10 · 0.87 | 16.38 · 0.94 | 16.45 · 0.91 | 16.51 · 0.94 | 16.52 · 0.95 | 16.53 · 0.95 |
| Só a melodia | aleatória, sem padrões | -5.54 · 0.00 | 3.89 · 0.02 | 15.10 · 0.84 | 16.10 · 0.86 | 16.45 · 0.93 | 16.48 · 0.93 | 16.51 · 0.92 | 16.52 · 0.94 | 16.53 · 0.95 |
| 2 violinos (c. 2) | com padrões musicais | 15.68 · 0.89 | 17.10 · 0.89 | 18.75 · 0.88 | 19.19 · 0.91 | 19.84 · 0.90 | 20.11 · 0.90 | 20.19 · 0.91 | 20.22 · 0.90 | 20.24 · 0.90 |
| 2 violinos (c. 2) | aleatória, sem padrões | -4.20 · 0.00 | 2.01 · 0.00 | 12.18 · 0.05 | 15.42 · 0.40 | 18.78 · 0.80 | 19.56 · 0.83 | 19.87 · 0.83 | 20.07 · 0.86 | 20.21 · 0.88 |
| Trio | com padrões musicais | 16.04 · 0.81 | 17.14 · 0.63 | 18.95 · 0.84 | 19.65 · 0.80 | 20.31 · 0.82 | 20.69 · 0.83 | 20.87 · 0.77 | 20.99 · 0.77 | 21.03 · 0.74 |
| Trio | aleatória, sem padrões | -6.73 · 0.00 | -1.83 · 0.00 | 8.63 · 0.08 | 12.54 · 0.42 | 16.32 · 0.74 | 17.88 · 0.80 | 18.93 · 0.77 | 19.77 · 0.75 | 20.08 · 0.74 |

Cada célula: aptidão · crítico.
