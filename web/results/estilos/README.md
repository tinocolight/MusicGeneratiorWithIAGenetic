# Heurísticas de composição por estilo: tabelas

Os CSV estão em UTF-8 (com BOM, para o Excel), separados por vírgulas, com ponto decimal. O relatório está em `../estilos.md`.

| Ficheiro | Conteúdo |
|---|---|
| `literatura.csv` | O registo da pesquisa: um achado por linha, com a regra que se tirou dele e a fonte (`G..` regras gerais, `E..` estilos). As regras do código citam estes ids. |
| `confronto.csv` | Cada regra geral da literatura contra as regras que já existiam (campo de atratores e modo clássico), o valor das melodias do AG antes, e o que se acrescentou. |
| `regras.csv` | Todas as regras que a página usa, por estilo e compasso: a medida, o alvo, a tolerância, de onde vem o alvo (corpus ou literatura), o peso e as fontes. Gerado por `node tools/build_styles.mjs`. |
| `calibracao.csv` | P10 / P50 / P90 de cada regra nas melodias reais (todas, por compasso; e as de cada estilo que o corpus tem). |
| `validacao.csv` | Melodias reais contra as mesmas notas baralhadas, e reconhecimento dos estilos do corpus, com validação cruzada em 5 dobras. |
| `ga.csv` | Estudo no algoritmo genético: cada estilo com o peso das heurísticas a 0 e a 4 (`node tools/styles_ga_study.mjs 4 400`). |

Colunas de `literatura.csv`: `id`, `ambito` (geral / estilo), `estilo`, `compassos`, `categoria` (intervalos, contorno, ritmo, métrica, forma, cadência, escala, repetição, andamento, registo), `achado`, `regra_derivada`, `fonte`, `url`, `tipo_de_evidencia`.

Colunas de `regras.csv`: `estilo`, `compasso`, `regra` (id no código e nos textos `rule.<id>`), `tipo` (do estilo / geral), `medida` (característica de `src/fitness/heuristics.js`, ou partilha de figuras de um tempo: `x` ataque, `_` continuação, `.` pausa), `alvo` (intervalo ou valores aceites), `tolerancia` (distância além do alvo a que a regra vale −1), `origem_do_alvo`, `peso`, `fontes` (ids de `literatura.csv`).
