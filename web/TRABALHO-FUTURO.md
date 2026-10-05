# Trabalho futuro

Ideias e pedidos deixados para depois, complementares ao projeto. Cada entrada diz de onde veio,
o que se quer e o que já existe no código para lhe pegar. A secção 0 é o trabalho em curso; o
resto está por fazer.

## 0. Em curso: o que veio do fado para os outros estilos (retomar aqui)

Pedido do utilizador: ver o que da secção do fado faz sentido nos outros modos e avançar por ordem
de importância, validando e fechando cada ponto. O trabalho está no ramo
`claude/wonderful-gates-jxkn4u`, PR #16 (aberto). O modo clássico fica de fora de tudo isto.

| # | ponto | estado |
|---|---|---|
| 1 | Dinâmica e rubato com perfis por família | **feito**: [`results/expressao.md`](results/expressao.md), secção no README, `test/expression.test.mjs` |
| 2 | Traços de aptidão do fado no blues e no pop | **feito**: [`results/estilos-tracos.md`](results/estilos-tracos.md), secção «Heurísticas» do README |
| 3 | Acompanhamento para valsa, polca, marcha, folk, infantil e blues | **código feito e testado**; falta a documentação (ver abaixo) |
| 4 | Cifras da harmonia implícita para qualquer melodia | por fazer (plano abaixo) |
| 5 | Medidas de verso para os estilos cantados | por fazer (plano abaixo) |

### Ponto 3: o que está feito e o que falta

**Feito:**

- **`src/accomp/harmony.js`:** o harmonizador geral (Viterbi). O do fado passou a usá-lo, sem
  mudar o resultado (160 de 160 acompanhamentos iguais aos de antes). Tem também:
  - `implyChords`: vocabulários `simple`, `folk`, `dance`, movimentos segundo a tabela de Piston
    e cadências alternadas;
  - `bluesChords`: os 12 compassos, com a «quick change» quando a melodia a pede.
- **`src/accomp/patterns.js`:** as texturas e uma introdução de 1–2 compassos:
  - valsa: «um-pá-pá» ao piano;
  - polca e marcha: «um-pá» ao piano;
  - folk: guitarra clássica (instrumento novo `guitar`) com baixo alternado;
  - infantil: acordes plaquê;
  - blues: baixo boogie-woogie e acorde no 2.º e no 4.º tempo.
- **Página:** `accompanimentFor` em `src/ui/app.js` escolhe entre o fado e estes estilos. O piano do
  acompanhamento é escrito em clave de fá. No Início rápido, «Melodia + acompanhamento» mostra só
  os estilos que o têm (`ACCOMP_STYLES`).
- **Testes:** `test/patterns.test.mjs` (4 testes) e o teste do Início rápido em
  `test/accomp.test.mjs`; 122 testes passam.
- **No navegador:** valsa, blues e folk com acompanhamento.

**Falta:**

1. **Verificação:** ver no navegador a clave de fá do piano depois da correção (valsa em mi menor)
   e exportar um PDF.
2. **Relatório** `results/acompanhamento.md`, com as fontes já encontradas:
   - [Twelve-bar blues (Wikipedia)](https://en.wikipedia.org/wiki/Twelve-bar_blues);
   - [Guitar Noise, «quick change»](https://www.guitarnoise.com/guide/standard-twelve-bar-blues/);
   - [StudyBass, «The Boogie-Woogie Blues Pattern»](https://www.studybass.com/lessons/blues-bass/the-boogie-woogie-blues-pattern/)
     (raiz–3–5–6 / ♭7–6–5–3);
   - [Oom-pah (Wikipedia)](https://en.wikipedia.org/wiki/Oom-pah) (baixo 1 e 5 da tuba, acorde no
     contratempo);
   - [Soundbrenner, «Waltz rhythm»](https://www.soundbrenner.com/blogs/articles/waltz-rhythm)
     (baixo no 1, acorde no 2 e no 3);
   - [Acoustic Guitar, «What is Travis picking?»](https://acousticguitar.com/what-is-travis-picking/)
     (baixo alternado com o polegar);
   - Piston, *Harmony* (1941), tabela das progressões de fundamentais habituais;
   - a secção 1 de [`results/fado/harmonizacao.md`](results/fado/harmonizacao.md).
3. **Documentação:** secção no README (e na lista de ficheiros: `src/accomp/harmony.js`,
   `src/accomp/patterns.js`, o instrumento `guitar`), a descrição do PR #16, a reconstrução do
   `dist` e a publicação do artefacto. O artefacto da página é
   https://claude.ai/artifact/8Q4eLGb6F5jp3mgDc9CnSS: ler antes de publicar.
4. **Opcional:** um acordeão para a valsa, a polca e a marcha, que é o instrumento típico destas
   danças em Portugal; hoje é o piano.

### Ponto 4: cifras para qualquer melodia (plano)

- **Cálculo:** `implyChords` de `src/accomp/harmony.js`, já testado, com o vocabulário por família:
  - `trad`: `folk` (infantil e embalar: `simple`);
  - `dance`, `baroque`, `classical`: `dance`;
  - blues: `bluesChords`;
  - pop e jazz: `dance`;
  - sem estilo: `dance`.
- **Página:** uma caixa «Cifras» junto a «Pautas», ligada por omissão quando só se vê uma voz e não
  há acompanhamento. O modo clássico fica de fora.
- **Partitura:** passar as cifras a `scoreModel({ chords })`, que já as desenha na página e no PDF e
  as escreve como `ChordNames` no LilyPond.
- **Testes:** as notas nos tempos pertencem ao acorde em 80 % ou mais; as cifras aparecem no
  LilyPond.

### Ponto 5: medidas de verso nos estilos cantados (plano)

- **Medidas:** usar `verseFeatures` de `src/fitness/heuristics.js` (feitas para o fado: notas por
  verso, nota final longa, final por grau descendente) como regras dos estilos `folk`, `lullaby`,
  `hymn` e `children`.
- **Calibração:** P10–P90 nas melodias do corpus de cada grupo, com `tools/build_styles.mjs`; onde não
  houver corpus, os valores da literatura.
- **Validação:** com `tools/styles_ga_study.mjs` (a pontuação e o crítico, antes e depois).

## 1. Voz livre com acompanhamento de guitarra: a primeira versão está feita (fado)

O módulo «melodia + acompanhamento desacoplado» existe para o fado, em
[`src/accomp/fado.js`](src/accomp/fado.js); a pesquisa está em
[`results/fado/harmonizacao.md`](results/fado/harmonizacao.md) e as partituras analisadas em
[`results/fado/partituras.md`](results/fado/partituras.md). **O que falta:**

- **Forma estrofe + estribilho** (fado-canção) e a alternância *Voz / Côro*: a melodia é hoje uma
  só secção repetida.
- **Mudanças de andamento e de compasso** dentro da peça (*Lento ↔ Vivo*, 2/4 ↔ 3/4, como na
  «Presunção e Água Benta»).
- **Mais harmonia:** o ♯iv°7 de Coimbra, os acordes de passagem cromáticos do «Fado dos Fados», a
  passagem ao maior homónimo a meio do fado.
- **A guitarra:**
  - no fado rápido (corrido), improvisar por cima do canto, em vez de só responder nas
    respirações;
  - variações em semicolcheias como as do método de guitarra.
- **A viola-baixo**, o quarto instrumento do «quadrilátero» do fado.
- **Escolhas na página:** a densidade do acompanhamento (só a viola; viola e guitarra; guitarra mais
  ativa), a afinação de Coimbra (um tom abaixo).
- **Outros estilos:** um acompanhamento próprio por família (baixo de Alberti no clássico, *stride*
  no jazz, bordão nas canções).

## 2. Início rápido com o fado

Pedido do utilizador, deixado para depois da secção do fado:

1. **Compassos e modo:** com o fado escolhido, bloquear os compassos que não são do fado (só 2/4 e
   4/4; o ternário só no fado de Coimbra) e fixar o modo pelo grupo: fado triste em menor, fado
   alegre em maior.
2. **Ondas:** mostrar a cinzento, para desencorajar sem proibir, as ondas que contrariam a frase de
   fado: a caótica e as três ondas. O verso de fado sobe cedo ao ápice e desce para a nota
   suspensa.
3. **Segunda voz:** sugerir uma voz uma oitava ou uma quinta abaixo, para deixar a voz brilhar.
   «Melodia + acompanhamento» já faz parte disto (as guitarras ficam por baixo e nas
   respirações). Falta a sugestão para os cânones de fado.
   - A voz grave afasta-se em frequência e não tapa a melodia.
   - O ideal é que entre nas respirações, como a guitarra. O ponto 1 (voz livre) é a versão
     completa desta ideia.

## 3. Áudio real para a dinâmica do fado

- [`tools/fado_audio.py`](tools/fado_audio.py) mede a dinâmica da voz em gravações: o nível no
  início e no fim de cada verso, o ápice, o esmorecer da nota suspensa, o vibrato e os acentos.
- Neste ambiente a rede bloqueia o YouTube e o archive.org, por isso ainda não correu sobre
  gravações reais.
- A coleção sugerida pelo utilizador, https://archive.org/details/fados (inclui o Zeca Afonso),
  fica pronta a analisar quando a rede o permitir, com `archive.org` e `*.us.archive.org` nos
  domínios autorizados.
- As partituras do Museu do Fado (https://www.museudofado.pt/colecao/partituras) também ficam à
  espera: com `www.museudofado.pt` autorizado, as digitalizações podem ser transcritas à mão para
  o leitor de fados e dar mais melodias para calibrar as regras, sobretudo as do fado alegre.
- Com os números medidos, recalibrar os perfis `sad` e `happy` de `src/core/expression.js`: a
  descida ao longo do verso, o esmorecer da nota suspensa, o vibrato e o forte da última estrofe.

## 4. Dinâmica e rubato: o que fica por medir

Os perfis de todos os estilos estão feitos ([`results/expressao.md`](results/expressao.md)), mas
os números medidos vêm de piano (ASAP).

- **Canções cantadas e danças tocadas para dançar**: medir em gravações reais o rallentando final,
  o fim de frase e os acentos, com `tools/fado_audio.py` adaptado, quando a rede deixar chegar às
  gravações.
- **Jazz**: o *swing* (colcheias desiguais, cerca de 2:1 a tempos médios) e as intensidades das
  notas de um conjunto aberto de solos transcritos (por exemplo o *Weimar Jazz Database*).
- **Barroco**:
  - o eco também nas sequências (o mesmo desenho transposto);
  - a dinâmica pela dissonância de Quantz, que precisa da harmonia: liga-se ao ponto 1 e às
    cifras implícitas.

