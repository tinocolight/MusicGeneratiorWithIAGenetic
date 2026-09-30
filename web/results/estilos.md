# Heurísticas de composição por estilo

Pedido: procurar na literatura regras de composição para diferentes estilos e como as frases melódicas aparecem em cada estilo e compasso; registar tudo num CSV com as fontes; confrontar as regras que já existiam com as da literatura; acrescentar as novas à aptidão num campo «Heurísticas de composição»; e criar uma entrada «Estilo» que, quando ativa, obriga esse peso a ser diferente de zero.

As tabelas estão em [`estilos/`](estilos/), com a descrição das colunas em [`estilos/README.md`](estilos/README.md).

## 1. Pesquisa

Foram registados 66 achados com a fonte e o URL em [`estilos/literatura.csv`](estilos/literatura.csv):

- **19 regras gerais (G01–G19)**:
  - proximidade de altura, declinação por grau e o arco melódico (Huron);
  - inércia do grau, que existe na prática comum mas não na pop (Chiu & Temperley 2024);
  - regressão depois de um salto (von Hippel & Huron 2000) e implicação-realização (Narmour; Schellenberg);
  - alongamento e descida no fim da frase (Tierney, Russo & Patel 2011);
  - universais de repetição (Savage et al. 2015);
  - cantus firmus e estilo de Palestrina (Fux, Jeppesen);
  - frase e período (Caplin, Koch, Schoenberg) e cadências melódicas (Hutchinson & Poon);
  - preferência métrica (Lerdahl & Jackendoff);
  - síncopa na música popular (Huron & Ommen; Temperley).
- **47 achados de estilo (E01–E47)**:
  - danças irlandesas e escocesas: reel, jigs, slip jig, hornpipe, strathspey, e os andamentos de competição;
  - polca e marcha (com o clarim);
  - valsa, mazurca, polonesa;
  - danças barrocas: minueto, gavota, bourrée, sarabanda, giga, siciliana, passepied, alemanda;
  - Fortspinnung e os tópicos de Ratner (caça, pastoral);
  - canção de embalar (Unyk, Trehub et al.; Mehr et al. 2019) e canção infantil (Kodály);
  - coral de Bach e hino;
  - blues, jazz, pop, habanera e tango;
  - fado, vira, malhão e corridinho, e a canção popular portuguesa (Lopes-Graça);
  - canção chinesa pentatónica e canto gregoriano (este não se codifica: não tem compasso).

A pesquisa usou a pesquisa web. Ler as páginas diretamente (por exemplo, a Wikipédia) estava bloqueado pela política de rede do ambiente, por isso cada achado resume o que as fontes dizem e aponta o URL onde se pode confirmar.

## 2. As regras que já existiam, face à literatura

Em [`estilos/confronto.csv`](estilos/confronto.csv), cada regra geral da literatura está ao lado das regras do campo de atratores e do modo clássico que a cobrem.

A proximidade, a regressão, a tonalidade, a cadência e a forma já estavam cobertas. Mas várias destas regras eram **maximizadas**: o AG levava-as ao extremo. Medido nas melodias que o AG gerava antes (4 sementes, 400 gerações, pesos por omissão), comparadas com o P10–P90 das melodias reais do mesmo compasso:

| Característica | AG antes (4/4) | Melodias reais |
|---|---|---|
| saltos de 4.ª ou mais | 0–3 % | 3–20 % |
| graus que descem | 0,40 | 0,43–0,82 |
| compassos que repetem um ritmo | 0,14–0,20 | 0,29–0,82 |
| alongamento da nota final da frase | 1,14 (0,96 em 6/8) | 1,03–2,2 (1,22–2,6 em 6/8) |
| frases em arco | todas | 0–83 % |
| saltos compensados (3/4) | todos | 0–60 % |

Não havia nenhuma regra de estilo: só o modelo de blocos por compasso.

## 3. Codificação

Cada regra mede uma característica da melodia ([`src/fitness/heuristics.js`](../src/fitness/heuristics.js)) e compara-a com um **intervalo-alvo**:

- vale 1 dentro do intervalo e desce linearmente até −1 a uma tolerância para fora dele (ou compara com um conjunto de valores aceites, por exemplo a posição da anacrusa);
- a componente «Heurísticas de composição» é a média pesada das regras, em [−1, 1];
- nada se maximiza: é a mesma ideia do «não maximizar» das outras regras.

As medidas incluem:

- intervalos (graus, saltos, saltos grandes, dissonantes, arpejos, declinação, inércia, compensação, saltos seguidos fora de um acorde);
- âmbito, clímax, escala pentatónica e notas cromáticas;
- por frase: arco, fim abaixo da média, descida, alongamento final e fins fora do tempo;
- ritmo: densidade, pausas, síncopas, notas longas nos tempos e a partilha de cada figura de um tempo (em geral ou num tempo do compasso);
- repetição do ritmo dos compassos e sequências;
- nota longa no 1.º ou no 2.º tempo, fim de parte em três semínimas, posição da 1.ª nota e tempo da nota final.

Os estilos ([`src/fitness/styles.js`](../src/fitness/styles.js)) são **dados, não código**. Cada estilo:

- lista as suas regras (medida, alvo, peso e ids das fontes no CSV);
- herda as regras gerais que não substitui;
- sugere o compasso, a frase, a forma, o comprimento, a anacrusa, o andamento e o modo.

Os alvos vêm de dois sítios:

- **Do corpus**, nas regras marcadas `cal`: o P10–P90 das melodias reais. Para as regras gerais, todas as melodias do compasso. Para os estilos que o corpus tem, as melodias desse estilo: 6547 canções do Essen, 300 corais de Bach, 264 reels, 219 jigs, 138 slip jigs, 166 hornpipes, 70 strathspeys e as marchas e quick steps. Os reels e hornpipes que o Ryan's escreve em 2/4 com semicolcheias leem-se em 4/4 com colcheias. Ferramenta: `node tools/build_styles.mjs`.
- **Da literatura**, nos restantes estilos, quando a fonte dá o valor (por exemplo, 1,2–1,8 síncopas por compasso na música popular americana).

Todas as regras, com o alvo e a origem, estão em [`estilos/regras.csv`](estilos/regras.csv).

## 4. Validação com melodias reais (validação cruzada em 5 dobras)

**Melodias reais contra as mesmas notas baralhadas.** As regras gerais põem a melodia real acima da baralhada em 89,8 % dos 9644 pares (pontuação média 0,91 contra 0,72). As regras de intervalos são as que separam as duas:

| Regra | Cumprida nas reais | Cumprida nas baralhadas |
|---|---|---|
| saltos | 80 % | 12 % |
| inércia | 84 % | 47 % |
| saltos seguidos fora de um acorde | 94 % | 56 % |
| intervalos dissonantes | 91 % | 37 % |

As regras de ritmo e de âmbito não mudam ao baralhar as notas. Servem para corrigir os desvios do AG da secção 2.

**Reconhecimento dos estilos do corpus**: em quantas melodias o próprio estilo pontua mais alto entre os estilos do mesmo compasso (os empates dividem o crédito).

| Estilo | Próprio estilo mais alto | Ao acaso |
|---|---|---|
| reel | 74 % | 5 % |
| strathspey | 69 % | 5 % |
| canção popular | 56–84 % | 5–33 % |
| marcha 2/4 | 50 % | 11 % |
| coral 3/4 | 46 % | 8 % |
| hornpipe | 34 % | 5 % |
| jig | 28 % | 10 % |
| coral 4/4 | 20 % | 5 % |
| marcha 6/8 | 5 % | 10 % |

As confusões fazem sentido musicalmente: jig com tarantela (colcheias contínuas em 6/8), coral com hino e com Palestrina, marcha em 6/8 com giga e jig, hornpipe com reel. Os estilos são descritos por poucas regras e aceitam muitas melodias. Servem para puxar o AG para as características próprias de cada estilo, não para classificar melodias.

## 5. No algoritmo genético

[`estilos-ga.md`](estilos-ga.md) e [`estilos/ga.csv`](estilos/ga.csv): 37 casos (os 36 estilos e «nenhum»), 4 sementes cada, 400 gerações, com as definições que cada estilo sugere e o peso das heurísticas a 0 e a 4.

**Média dos 37 casos:**

| | Peso a 0 | Peso a 4 |
|---|---|---|
| pontuação do estilo | 0,60 | 0,95 |
| regras dentro do intervalo | 65 % | 93 % |
| crítico | 0,84 | 0,81 |
| características típicas (de 26) | 20,0 | 20,7 |

**O AG aprende as marcas de cada estilo:**

- a anacrusa da gavota;
- o final feminino da polonesa;
- as três colcheias da jig (0,39 → 1,00);
- os pontuados do hornpipe (0,34 → 0,84);
- a nota longa no 2.º tempo da sarabanda.

**Onde o crítico sobe ou se mantém:** nos estilos próximos do seu corpus de treino (canções do Essen, música irlandesa, corais de Bach). Exemplos: bourrée 0,68 → 0,94, polonesa 0,80 → 0,91, marcha 0,78 → 0,87, jig 0,88 → 0,90.

**Onde o crítico desce:** nos estilos longe desse corpus. Exemplos: jazz 0,88 → 0,61, valsa 0,80 → 0,63, pentatónica 0,88 → 0,71, infantil 0,88 → 0,74. O crítico mede a proximidade a canções populares e corais, não a qualidade de um jazz ou de uma valsa.

**Regras mais difíceis de cumprir:**

- a anacrusa da alemanda e da bourrée: o AG raramente cria uma pausa inicial da duração certa;
- as semicolcheias contínuas da alemanda e do Fortspinnung;
- as síncopas e pausas do blues e da pop: os operadores escrevem ritmos alinhados com o tempo.

**Nota sobre as regras gerais sozinhas** («nenhum»): cumprem-se todas (0,81 → 1,00), mas o crítico desce um pouco (0,88 → 0,83). Por isso o peso fica a 0 por omissão e só entra quando se escolhe um estilo, ou à mão.

## 6. Limitações

- **Grelha de semicolcheias:** sem tercinas, o que afeta os ornamentos irlandeses e o swing. O swing, a síncopa do tango e o rubato do fado só se aproximam.
- **Operadores diatónicos:** não escrevem as notas cromáticas do bebop nem os ♭3 e ♭7 do blues em modo maior. No blues, o modo menor dá a pentatónica menor.
- **Estilos sem corpus:** os alvos são da literatura ou estimados a partir da descrição das fontes. Devem ser revistos com melodias reais desses estilos, e o `tools/build_styles.mjs` aceita novos grupos.
- **Modo clássico:** só escreve em 4/4, por isso só lá funcionam os estilos em 4/4.
- **Avaliação:** a escuta humana continua a ser a avaliação decisiva.
