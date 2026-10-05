# Dinâmica e rubato para todos os estilos

**Pedido:** depois da secção do fado, ver o que dela faz sentido nos outros modos e avançar por
ordem de importância. A primeira prioridade foi a **dinâmica e o rubato com perfis por família**:
é o que mais muda o que se ouve, custa pouco e está bem apoiado na literatura.

Até aqui só o fado tinha dinâmica (`src/core/expression.js`). Os outros estilos tocavam todas as
notas ao mesmo volume e no mesmo andamento, como um sequenciador.

Agora cada estilo do modo campo toca com o **perfil** da sua família, ou com um perfil próprio
quando o estilo o pede. O modo clássico continua sem dinâmica, como o original. O perfil chega a
quatro sítios:

- **reprodução:** volume de cada nota, crescendo ou esmorecer dentro da nota, acento no ataque e
  vibrato;
- **MIDI:** velocidade, CC 11 e mudanças de andamento;
- **partitura da página e PDF:** *pp*–*ff*, reguladores, acentos, *rit.* e fermatas;
- **LilyPond:** as mesmas marcas.

A caixa **«Dinâmica e rubato»** liga e desliga tudo. A dica dessa caixa descreve o perfil do estilo
escolhido.

## 1. Fontes

As fontes estão em [`estilos/literatura.csv`](estilos/literatura.csv), com os ids `X01`–`X08`.

| id | fonte | o que se usou |
|---|---|---|
| X01 | Friberg, Bresin & Sundberg (2006), *Overview of the KTH rule system for musical performance*, Advances in Cognitive Psychology 2(2–3):145–161 | Regras com décadas de experiências de audição: o **arco de frase** (crescendo e acelerando até ao meio da frase, depois diminuendo e rallentando), o **agudo-forte** (*high loud*), o **rallentando final** e a pontuação das frases. |
| X02 | Friberg & Sundberg (1999), *Does music performance allude to locomotion? A model of final ritardandi derived from measurements of stopping runners*, JASA 105(3):1469–1484 | O modelo do rallentando final v(x) = (1 + (w^q − 1)·x)^(1/q): tempo v na posição x (0..1) do rallentando, w o tempo final, q a curvatura. q = 2 é a força de travagem constante e q = 3 a potência constante, como um corredor que pára. |
| X03 | Todd (1992), *The dynamics of dynamics: a model of musical expression*, JASA 91(6):3540–3550 | A dinâmica segue a estrutura das frases, em arcos que se encaixam (frase dentro da secção, secção dentro da peça), acoplada ao tempo: mais depressa é mais forte. |
| X04 | Medição própria em ~1000 interpretações do conjunto ASAP (Foscarin et al., ISMIR 2020) | Os números: o rallentando final, o alongamento no fim das frases, os acentos métricos e o agudo-forte (secção 2). |
| X05 | Guias de prática barroca: [Practising the Piano](https://practisingthepiano.com/the-baroque-urtext-score-2-dynamics/) e [Sheet Music Plus](https://blog.sheetmusicplus.com/2014/05/01/a-brief-guide-to-baroque-performance-practice/) | A dinâmica em **terraços**: mudanças súbitas, sem crescendos graduais. A frase repetida toca-se como **eco** (*piano*). A evidência é fraca: o [*Affettuoso di molto* de Quantz](https://theory.esm.rochester.edu/integral/wp-content/uploads/2019/06/INTEGRAL_30_jones.pdf) mostra uma dinâmica muito mais graduada, por isso os terraços são uma simplificação. |
| X06 | [Open Music Theory, «Swing rhythms»](https://viva.pressbooks.pub/openmusictheory/chapter/swing-rhythms/) e guias de fraseado de jazz | No jazz acentuam-se as colcheias em contratempo, ao contrário da música clássica, que acentua os tempos 1 e 3. |
| X07 | Trainor, Clark, Huntley & Adams (1997), Infant Behavior and Development 20(3):383–396; [Nguyen et al. (2023)](https://www.sciencedirect.com/science/article/pii/S1878929323001184) | As canções de embalar cantam-se mais devagar, mais graves e com menos variação do que as canções de brincar; as de brincar têm mais ritmo e mais variação dinâmica. |
| X08 | [Fermata (Wikipedia)](https://en.wikipedia.org/wiki/Fermata); [discussões em bach-cantatas.com](https://www.bach-cantatas.com/Topics/Fermata.htm) | Nos corais de Bach a fermata marca o fim de cada verso do texto, onde se respira, com ou sem tempo a mais. |

Do que já existia no projeto vieram:

- o **2.º tempo** da mazurca (E26) e da sarabanda (E13);
- as **notas blue** do blues;
- o fado (F12, F13, F15).

## 2. Medição em interpretações reais (ASAP)

[`tools/expression_study.py`](../tools/expression_study.py) lê o
[ASAP](https://github.com/fosfrancesco/asap-dataset) (licença CC BY-NC-SA 4.0). O conjunto tem
1067 interpretações de piano (MIDI do concurso Maestro), com os tempos e os primeiros tempos
anotados na interpretação e na partitura. Ficam só números, em [`expressao/asap.csv`](expressao/asap.csv);
o conjunto não é copiado.

O script mede o seguinte:

- **tempo de cada tempo:** a duração na partitura a dividir pela duração na interpretação,
  normalizado pela mediana da peça;
- **velocidade de cada nota:** e onde a nota cai no compasso;
- **voz superior:** a nota mais aguda de cada ataque (notas a menos de 40 ms), tomada como melodia.

Foram 1036 interpretações utilizáveis, agrupadas por período:

- **barroco:** Bach, 169 interpretações;
- **clássico:** Haydn, Mozart e Beethoven, 319;
- **romântico:** os restantes, 548;
- **danças:** as polonaises de Chopin e a Valsa Mefisto de Liszt, 15.

| medida (mediana) | barroco | clássico | romântico | danças |
|---|---|---|---|---|
| tempo do **último tempo** antes da nota final (1 = andamento da peça) | **0,47** | **0,69** | 0,69 | 0,79 |
| tempo médio do **último compasso** | **0,72** | **0,80** | 0,79 | 0,79 |
| duração do rallentando final (compassos) | 1,0 | 1,0 | 0,75 | 2,0 |
| curvatura q que melhor ajusta (Friberg & Sundberg) | 2; q > 1 em 55 % | 1 (linear) em 78 % | 1 em 88 % | 1 |
| **alongamento do último tempo** de cada grupo de 4 compassos | +0,6 % | +2,5 % | +5,8 % | +10 % |
| velocidade no **1.º tempo** face às notas fora do tempo (desvios-padrão) | −0,07 | −0,04 | +0,19 | **+0,46** |
| correlação **altura–velocidade** da voz superior em cada grupo de 4 compassos | **0,45** | **0,39** | 0,35 | 0,32 |
| onde fica o trecho mais forte da peça (fração da peça) | 0,75 | 0,49 | 0,62 | 0,72 |

### O que se tira

1. **O rallentando final é universal e grande.** O último tempo vai a metade (barroco) ou a dois
   terços (clássico) do andamento, ao longo de cerca de um compasso.
   - No barroco a curva é côncava (q = 2). Isto confirma o modelo de Friberg & Sundberg, que
     foi medido precisamente em música barroca.
   - No clássico e no romântico a curva é sobretudo linear (q = 1).
2. **O agudo-forte (KTH) confirma-se em todos os períodos:** r ≈ 0,35–0,45 dentro de cada grupo
   de quatro compassos.
   - A velocidade varia cerca de 11–17 unidades (desvio-padrão, em 127).
   - Daí uma diferença de cerca de 0,1–0,15 (em 0..1) entre a nota mais grave e a mais aguda
     de uma frase. É o parâmetro `height`.
3. **O alongamento no fim das frases depende do período.**
   - É quase nulo no barroco: o «andamento motor» dos pianistas em Bach.
   - É pequeno no clássico, maior no romântico e nas danças de concerto.
4. **O acento do 1.º tempo só existe nas danças** (+0,46 desvios-padrão face às notas fora do
   tempo, cerca de 9 unidades de velocidade, ou 0,07 em 0..1). Em Bach e nas sonatas clássicas
   não há acento métrico de dinâmica.
5. **O ponto mais forte da peça** fica em média a cerca de 0,6 da peça; no barroco a 0,75.

### O que não se tira

- **O arco de dinâmica dentro das frases fica inconclusivo com esta medida.**
  - Os grupos fixos de quatro compassos não coincidem com as frases reais (há anacruses e frases
    de outros tamanhos), e a média dilui o arco.
  - No barroco vê-se um crescendo pequeno até 3/4 do grupo e uma descida no fim (±0,06 desvios-padrão).
  - No clássico o perfil oscila compasso a compasso.
  - Por isso o arco segue a literatura (X01, X03) com uma amplitude moderada, não um número
    medido.
- **É piano, e são intérpretes modernos.**
  - Uma voz cantada, uma flauta ou um cravo comportam-se de outra maneira.
  - Para o folk, as canções, o pop e o jazz não há aqui dados de interpretação: esses perfis
    seguem a literatura e as convenções descritas na secção 3.
- **As «danças» são poucas (15) e são danças de concerto românticas.** Por isso o rallentando
  dos perfis de dança é menor do que o medido: quem dança precisa de um tempo firme.

## 3. Os perfis

Os perfis estão em `src/core/expression.js` (`SHAPED`). A escolha por estilo é
`expressionProfile` de `src/fitness/styles.js`:

- o **perfil da família**, por omissão;
- o **perfil próprio** do estilo (`perform`), quando o tem;
- `'sad'` / `'happy'` no **fado**;
- `'general'` **sem estilo**.

| perfil | estilos | dinâmica | rubato |
|---|---|---|---|
| `general` | sem estilo | arco de frase (0,1), arco da peça até ao ápice, agudo-forte 0,12, ápice com crescendo, nota longa do fim da frase a esmorecer | fim de frase +3 %, rallentando de 1 compasso (q = 2, w = 0,5), última nota ×1,5 |
| `song` | folk, pentatónica, Palestrina | arco 0,12, esmorecer mais nítido | respiração no fim de frase (+4–5 %), rallentando, **fermata** final |
| `children` | infantil | nível vivo, 1.º tempo marcado, pouco arco (X07) | quase sem rubato |
| `lullaby` | embalar | **suave** (0,46), pouca variação, cada vez mais suave na última estrofe (X07) | fim de frase +5–6 %, rallentando de **2 compassos**, fermata |
| `chorale` | coral, hino | arco suave | **fermata em cada fim de frase** (×1,3; X08), rallentando, fermata final |
| `dance` | reel, jiga, hornpipe, polca, marcha, vira, tarantela, *hunt*… | **1.º tempo +0,07** (medido), 3.º tempo de 4/4 +0,03, sem esmorecer | **tempo firme**; só a última nota ligeiramente alargada |
| `waltz` | valsa | 1.º tempo +0,1 (um-pá-pá) | como a dança |
| `mazurka` | mazurca | acento no **2.º tempo** (E26) | como a dança |
| `baroque` | minueto, gavota, bourrée, giga, alemanda, siciliana, passepied, Fortspinnung | **terraços**: *f*, e a repetição exata de uma frase (4 notas e 1 compasso ou mais) em ***p*** (eco, X05); sem reguladores nem acentos métricos (medido) | **sem rubato de frase** (medido: +0,6 %); rallentando de 1 compasso **q = 2, w = 0,35** (ajustado ao ASAP), fermata |
| `sarabande` | sarabanda | terraços e o **2.º tempo** apoiado (E13) | como o barroco |
| `classical` | clássico | arco de frase 0,12 (X01, X03), agudo-forte 0,1 | fim de frase **+3 %** (medido: +2,5 %); rallentando **linear**, w = 0,62 (ajustado ao ASAP) |
| `popular` | pop | nível constante, **síncopas** acentuadas | **nenhum** (tempo de metrónomo) |
| `jazz` | jazz | síncopas e **colcheias em contratempo** acentuadas (X06) | nenhum |
| `blues` | blues | cada frase começa forte e apaga-se (pergunta e resposta, como o verso de fado), **notas blue** (♭3, ♭5, ♭7) apoiadas e escritas com acento, vibrato largo (0,25 meio-tom) | fim de frase +3–4 %, rallentando, fermata |
| `sad`, `happy` | fado triste, fado alegre | o modelo do fado, sem mudanças ([`fado.md`](fado.md)) | o rubato do fado |

### O rallentando final contra as medições

O tempo de cada tempo do último compasso é calculado como o script o mede (tempo de partitura a
dividir pelo tempo tocado).

| perfil | último tempo: modelo / medido | último compasso: modelo / medido |
|---|---|---|
| `baroque` (q = 2, w = 0,35) | 0,468 / 0,467 | 0,724 / 0,724 |
| `classical` (q = 1, w = 0,62) | 0,666 / 0,687 | 0,809 / 0,800 |

O teste `test/expression.test.mjs` lê `expressao/asap.csv` e falha se o modelo se afastar mais de
0,03 destes valores.

### Como se escrevem

- **Letras.** Uma letra (*pp*–*ff*) onde uma frase começa num nível novo, tomada do nível da frase
  e não da nota, para que um acento não mude a letra. Leva também letra o ápice que cresce.
- **Reguladores.** Nos perfis de arco nítido (≥ 0,08: geral, canção, clássico) há um crescendo até
  à nota mais aguda da frase e um diminuendo depois. Cada um só se escreve se cobrir duas notas e
  meio compasso de 4/4.
  - Nos outros perfis só se escreve o esmorecer de uma nota suspensa quando é audível (para 0,75
    ou menos do nível).
- **Acentos.** Só se escrevem os de dor (fado), as notas blue e o ápice. Os acentos métricos das
  danças e do jazz ouvem-se, mas não se escrevem: são do estilo e não se escrevem na partitura
  (ninguém escreve um acento em cada primeiro tempo de uma valsa).
- ***rit.*** Escreve-se onde começa o rallentando final, nos perfis em que ele é nítido.
  - **Fermata** na última nota de **cada pauta**.
  - No coral, fermata também em cada fim de frase.

### Cânones

- **Dinâmica.** Todas as vozes tocam a dinâmica da melodia (cada entrada é o tema). Fora do fado não
  se baixa o volume das outras vozes, porque num cânone as vozes são iguais.
- **Rubato.** Só o rallentando final, a partir da última entrada de qualquer voz. As vozes respiram
  em sítios diferentes, e alargar o fim de frase de uma atrasaria as outras.

## 4. Validação

- **Testes** (`test/expression.test.mjs`, 7 testes). Os 117 testes do projeto passam. Os testes
  verificam:
  - que cada estilo tem um perfil;
  - o arco de frase e a correlação agudo-forte (r > 0,4 na melodia de teste);
  - o eco barroco (*f* / *p* / *f*) sem reguladores;
  - os acentos da dança, da valsa (1.º tempo), da mazurca (2.º tempo) e do jazz (contratempo);
  - a embalar mais suave no fim, as notas blue e o pop sem rubato;
  - o rallentando contra o ASAP;
  - os cânones (só o fim abranda, fermata em cada pauta) e as fermatas do coral.
- **No navegador**, com melodias geradas para gavota, folk, valsa, blues e um cânone de minueto a duas
  vozes:
  - a caixa aparece em todos;
  - as letras, os reguladores, o *rit.* e as fermatas aparecem na partitura da página, no PDF
    (exportado e convertido em imagem) e no LilyPond;
  - o MIDI do minueto tem as velocidades por nota e 14 mudanças de andamento no rallentando
    final.
- **Primeira versão corrigida.** Uma nota repetida isolada era tomada como eco *p*, e uma última
  nota cortada pela grelha de frases ficava sozinha. Agora:
  - o eco exige uma frase de 4 notas e 1 compasso;
  - a última nota junta-se à frase anterior.

## 5. Limites e próximos passos

- **Dados de outros instrumentos.** Os números medidos são de piano. Ficam por medir:
  - **canções cantadas e danças tocadas para dançar**, com gravações reais (a ferramenta de áudio
    do fado serve para isso, quando a rede o permitir);
  - **música popular**, por exemplo com um conjunto aberto de interpretações de jazz como o *Weimar
    Jazz Database*, que tem as intensidades das notas.
- **Jazz.** O *swing* (colcheias desiguais) não está feito: aqui só os acentos.
- **Barroco.** Os terraços tratam só a repetição exata. Uma sequência (o mesmo desenho transposto)
  também se tocava muitas vezes em eco, e a dinâmica pela dissonância de Quantz (mais forte nas
  dissonâncias) precisa da harmonia, que a melodia sozinha não dá.
