# Melodia só: que omissão?

Gerado por `node tools/solo_defaults.mjs 24`. Configuração por omissão (arco de frase, 8 compassos, 600 gerações) com «não maximizar»; 24 sementes; média ± desvio-padrão entre sementes. Crítico nos primeiros 8 compassos.

| População inicial e regra «idioma» | Crítico | Típicas /26 | 1.ª nota tónica / dominante / mediante |
|---|---|---|---|
| Padrões musicais, sem idioma | 0,93 ± 0,04 | 18,8 ± 1,4 | 42 % / 0 % / 21 % |
| **Blocos do corpus, sem idioma** (omissão) | 0,91 ± 0,05 | 20,8 ± 2,0 | 50 % / 0 % / 8 % |
| Blocos + idioma 0,75 | 0,87 ± 0,06 | 20,5 ± 2,1 | 46 % / 0 % / 29 % |
| Blocos + idioma 1,5 | 0,84 ± 0,09 | 20,5 ± 2,3 | 38 % / 0 % / 42 % |

A regra «idioma» na aptidão baixa o crítico à medida que o peso sobe, sem tornar as melodias mais típicas; os blocos na população inicial e na mutação dão ~2 características típicas a mais com o crítico praticamente igual. Por isso a omissão é «blocos, sem idioma», e o idioma fica disponível nos pesos.
