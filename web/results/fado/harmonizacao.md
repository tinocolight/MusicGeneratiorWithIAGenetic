# Harmonização e acompanhamento: pesquisa de apoio

Notas reunidas **antes** de escrever o módulo «melodia + acompanhamento desacoplado», a voz com as
guitarras que a harmonizam. O texto é um resumo pelas minhas palavras, com as fontes de cada ponto.
A rede deste ambiente só deixa usar o motor de pesquisa (não abre as páginas), por isso as fontes
foram lidas pelos excertos que a pesquisa devolve.

## 1. Harmonizar uma melodia (técnicas gerais)

- **As notas que mandam:** as que caem nos tempos fortes (1 e 3 em 4/4) e as que a frase segura
  pedem apoio harmónico. Na harmonia fica estável quando são notas do acorde (fundamental, terceira,
  quinta, sétima). Fontes:
  [Songcage, «How to Harmonize a Melody»](https://songcage.com/blog/how-to-harmonize-a-melody/);
  [Piano With Jonny, «10 Techniques to Harmonize a Melody»](https://pianowithjonny.com/piano-lessons/10-techniques-to-harmonize-a-melody-for-piano/).
- **Os acordes primários:** começa-se pelos acordes principais (I, IV, V). Entre os três contêm todas
  as notas da escala, por isso um deles serve sempre. Fonte:
  [Songcage](https://songcage.com/blog/how-to-harmonize-a-melody/).
- **Ritmo harmónico:** é a velocidade com que os acordes mudam, independente do ritmo da melodia.
  - Começa-se com um acorde por compasso, a mudar no tempo forte.
  - Perto da cadência o ritmo harmónico acelera; os acordes da cadência demoram mais e dão a
    sensação de chegada.
  - Fontes: [Harmonic rhythm (Wikipedia)](https://en.wikipedia.org/wiki/Harmonic_rhythm);
    [Iowa State, Harmonic Rhythm](https://iastate.pressbooks.pub/comprehensivemusicianship/chapter/6-4-harmonic-rhythm-tutorial/);
    [School of Composition](https://www.schoolofcomposition.com/harmonic-rhythm-explained-with-examples/).
- **Notas estranhas ao acorde:** nem todas as notas pedem acorde novo.
  - As **de passagem** (entram e saem por grau, no mesmo sentido) e as **bordaduras** (saem de uma
    nota do acorde e voltam a ela) ficam sobretudo nos tempos fracos.
  - As **dissonâncias acentuadas** caem no tempo forte e resolvem por grau: a **apojatura** (chega
    por salto) e o **retardo** (preparado no tempo fraco).
  - A **antecipação** é fraca: chega antes do acorde a que pertence. É precisamente a nota suspensa
    antecipada do fado.
  - Fontes: [Nonharmonic Tones (Harmony and Musicianship)](https://pressbooks.pub/harmonyandmusicianshipwithsolfege/chapter/nonharmonic-tones/);
    [Puget Sound, Non-Chord Tones](https://musictheory.pugetsound.edu/mt21c/NonChordTonesIntroduction.html).
- **Dominantes secundárias:** uma dominante que resolve num acorde que não a tónica *tonaliza*
  esse acorde. A sensível do acorde emprestado sobe para a tónica temporária e a sétima desce por
  grau. Exemplo: I7 → IV, ou i7 maior → iv em menor. Fontes:
  [Secondary Dominants](https://pressbooks.pub/harmonyandmusicianshipwithsolfege/chapter/secondary-dominants-and-secondary-diminished-sevenths/);
  [Tonicization (Wikipedia)](https://en.wikipedia.org/wiki/Tonicization).
- **Harmonização automática:** a forma clássica é um **modelo oculto de Markov**. Os acordes são os
  estados escondidos, as notas da melodia as observações, e o **algoritmo de Viterbi** (programação
  dinâmica) dá a sequência de acordes mais provável. Também se usam algoritmos genéticos, modelos de
  correspondência com modelos de acordes e redes neuronais. Fontes:
  - [Yeh et al. 2021, «Automatic Melody Harmonization with Triad Chords: A Comparative Study»](https://arxiv.org/pdf/2001.02360) (*JNMR* 50(1));
  - [Xu, Peyton & Bhular, «Melody Informed Musical Chord Generation using HMM»](https://hajim.rochester.edu/ece/sites/zduan/teaching/ece477/projects/2018/ShengXu_AlbertPeyton_RyanBhular_ReportFinal.pdf), um estado por compasso;
  - [BacHMMachine](https://arxiv.org/pdf/2109.07623);
  - [AccoMontage2](https://arxiv.org/pdf/2209.00353), harmonização seguida de arranjo do acompanhamento.
- **Texturas de acompanhamento:**
  - **arpejo:** as notas do acorde uma de cada vez;
  - **baixo de Alberti:** baixo–agudo–meio–agudo;
  - **«oom-pah»:** baixo no tempo forte, acorde no fraco;
  - **baixo andante (walking bass):** move-se por grau em valores regulares, com notas de passagem
    a ligar os acordes.
  - Fontes: [Alberti bass (Wikipedia)](https://en.wikipedia.org/wiki/Alberti_bass);
    [Fiveable, Texture Devices](https://fiveable.me/ap-music-theory/unit-2/texture-devices/study-guide/qeppLtbtfyQ6Z4dE9lMd);
    [OUP, Accompaniment Patterns](https://global.oup.com/us/companion.websites/fdscontent/uscompanion/us/static/companion.websites/freedman/student/20_Handout.pdf).

## 2. A harmonia do fado

O que já se sabia, em [`pesquisa.md`](pesquisa.md) §4 e [`harmonias.csv`](harmonias.csv):

- **Ernesto Vieira (1890):** acompanhamento arpejado em semicolcheias, só com tónica e dominante,
  alternadas de dois em dois compassos.
- **Fados primitivos:** I (2) – V7 (4) – I (2) em 8 compassos. São dois acordes (I V7), com o motivo
  da guitarra a desenvolver-se ao longo do tema. Fonte:
  [Sergl](http://www.musimid.mus.br/3encontro/files/pdf/Marcos%20Julio%20Sergl.pdf).
- **Fados de autor** (11 esquemas do fadado):
  - os dois primeiros versos fazem i–V7 / V7–i;
  - no terceiro, saída para a subdominante pela tónica com sétima (I7 → iv), para a relativa maior
    (VII7 → III) ou descida VII7–VI–V;
  - remate i V7 i;
  - no maior, I–ii–V7–I (Adiça), iii–VI7–ii (Perseguição, dominantes secundárias), II7–V7.
- **Baixo:** apoio harmónico com a fundamental no primeiro tempo e arpejos do acorde nos outros.
  Fontes: [Sergl](http://www.musimid.mus.br/3encontro/files/pdf/Marcos%20Julio%20Sergl.pdf);
  [Cantar Mais, Fado Corrido](http://www.cantarmais.pt/pt/cancoes/fado/cancao/fado-corrido).

## 3. Quem toca o quê: a guitarra portuguesa e a viola

O fado de Lisboa é a voz, a **guitarra portuguesa** e a **viola** (guitarra clássica de cordas de
aço, a «viola de fado»), muitas vezes as duas ao mesmo tempo. Junta-se por vezes uma segunda
guitarra ou a **viola-baixo**. David Dinis chama-lhe o «quadrilátero» do fado: voz, guitarra,
viola e viola-baixo. Fontes:
[UNESCO](https://ich.unesco.org/en/RL/fado-urban-popular-song-of-portugal-00563/);
[Portuguese guitar (Wikipedia)](https://en.wikipedia.org/wiki/Portuguese_guitar);
[David Dinis, «O baixo no Fado»](https://daviddinisfresbook2020.blogspot.com/2020/07/o-baixo-no-fado.html).

### A viola: a base

- **Função:** não é um instrumento de destaque melódico. É a base que dá corpo e estabilidade: a
  harmonia dos acordes, o pulso do compasso e a «cadência emocional» da canção. Fonte:
  [Casa da Guitarra, «Viola de Fado: História, Evolução e Papel no Fado Tradicional»](https://casadaguitarra.pt/2020/05/viola-de-fado/).
- **Técnica:** batidas rítmicas com o polegar, **ataques secos nos baixos**, alternância entre
  dedilhados suaves e acentos marcados. Fontes:
  [Casa da Guitarra](https://casadaguitarra.pt/2020/05/viola-de-fado/);
  [«Técnicas da viola de fado»](https://violadefado.wordpress.com/tecnicas-da-viola-de-fado/).
- **Passagens de baixo:** ligam os acordes, e o mesmo repertório de passagens serve dezenas de
  fados na mesma tonalidade. Fontes:
  [Academia Musical, «Fado à viola»](https://www.academiamusical.com.pt/cursos/fado-a-viola-vitalicio-aprende-a-tocar-viola-de-acompanhamento-de-fado-na-pratica/);
  [Passagens de acordes do Fado na viola (vídeo)](https://www.youtube.com/watch?v=HSziRRT340k).
- **Padrão:** baixo e acorde. A fundamental no tempo forte e o acorde (ou o arpejo) nos outros
  tempos (Sergl, Cantar Mais). É o «oom-pah» da secção 1, com o baixo alternado e as passagens de
  baixo.
- **Viola-baixo:** introduzida por Martinho d'Assunção Jr. «Veio completar o ritmo e preencher a
  harmonia.» Fonte: [David Dinis](https://daviddinisfresbook2020.blogspot.com/2020/07/o-baixo-no-fado.html).

### A guitarra portuguesa: o diálogo com a voz

- **O instrumento:** 12 cordas de aço em seis pares, tocadas com as unhas do polegar e do
  indicador. Tem som brilhante e metálico.
  - Afinação de Lisboa, da corda mais fina para a mais grossa: Si–Lá–Mi–Si–Lá–Ré.
  - Os três primeiros pares estão em uníssono; os três graves em oitavas.
  - O Lá é o de 440 Hz.
  - A de Coimbra está um tom abaixo.
  - Fontes: [Portuguese guitar (Wikipedia)](https://en.wikipedia.org/wiki/Portuguese_guitar);
    [Fernandez Music, método](https://www.fernandezmusic.com/PortugueseGuitarMethod.html);
    [Escola de Fado de Coimbra](https://www.facebook.com/escoladefadocoimbra/photos/a-afina%C3%A7%C3%A3o-de-coimbra-da-corda-mais-fina-para-a-mais-grossa-%C3%A9-l%C3%A1-sol-r%C3%A9-l%C3%A1-sol-d/635745580253908/).
- **Introdução («dar o tom»):**
  - apresenta o motivo da guitarra que se desenvolve ao longo do fado;
  - define o campo harmónico e melódico, para a fadista se enquadrar na tonalidade e no ritmo;
  - em Lisboa é tradicionalmente baseada na **segunda metade da melodia cantada**;
  - há prelúdios longos, de 12 compassos.
  - Fontes: [Portuguese guitar (Wikipedia)](https://en.wikipedia.org/wiki/Portuguese_guitar);
    [Cantar Mais, Fado Corrido](http://www.cantarmais.pt/pt/cancoes/fado/cancao/fado-corrido).
- **Respostas à voz (os «remates»):** a guitarra trabalha em pergunta e resposta com a fadista, com
  frases curtas e expressivas que respondem às frases cantadas: nas respirações, entre os versos.
  Fontes: [Portuguese guitar (Wikipedia)](https://en.wikipedia.org/wiki/Portuguese_guitar);
  [Lark in the Morning, «Fado Guitars from Portugal»](https://larkinthemorning.com/blogs/articles/fado-guitars-from-portugal).
- **Contracanto:** sobre a voz e a camada harmónica, a guitarra junta figurações contrameló­dicas.
  Há métodos inteiros só de contracantos, por exemplo Eurico Cebolo, *Guitarra Portuguesa: Fados e
  Contracantos*. Fontes:
  [Britannica, Fado](https://www.britannica.com/art/fado);
  [Fnac, Cebolo](https://www.fnac.pt/Guitarra-Portuguesa-Fados-e-Contracantos-Livro-1-Eurico-A-Cebolo/a511501).
- **Ornamentos:**
  - **trinado:** o indicador para baixo e para cima muito depressa sobre a mesma nota, uma
    sequência rápida de três notas, típica do estilo de Lisboa;
  - **dedilho:** alternância rápida de polegar e indicador, uma série contínua de notas;
  - também o *tremolo* e as mordentes.
  - Fontes: [Portuguese guitar (Wikipedia)](https://en.wikipedia.org/wiki/Portuguese_guitar);
    [Lark in the Morning](https://larkinthemorning.com/blogs/articles/fado-guitars-from-portugal).
- **No fado rápido:** a guitarra improvisa muitas vezes de forma virtuosística o tempo todo,
  incluindo por cima do canto.
- **Diálogo vozes–guitarras:** foi estudado por Salwa Castelo-Branco, «The Dialogue between Voices
  and Guitars in Fado Performance Practice» (em *Fado: Voices and Shadows*, 1994). Fonte:
  [INET-md](https://www.inetmd.pt/en/team/salwa-el-shawan-castelo-branco/).
- **Na última estrofe:** as guitarras entram em *forte* com o crescendo da voz (Sergl, F13).

## 4. O que isto pede ao algoritmo

**Desacoplado:** a melodia é composta primeiro (o algoritmo genético, como até aqui) e a
harmonização vem depois, a partir dela. É a ordem de quem acompanha um fado: a guitarra e a viola
seguem a voz.

1. **Acordes:** escolhê-los com o algoritmo de Viterbi sobre o vocabulário do fado, com:
   - o ajuste de cada acorde às notas da melodia, pesado pela duração e pelo tempo do compasso: as
     notas de passagem e as bordaduras nos tempos fracos não contam contra o acorde, e a apojatura
     que resolve por grau conta pouco;
   - as passagens entre acordes que os fados reais usam (i ↔ V7; I7 → iv → V7; VII7 → III → VI →
     V7; no maior I–ii–V7, I7–IV, VI7–ii–V7);
   - um ritmo harmónico lento, com acordes de 1 ou 2 compassos e mudanças ao meio compasso só na
     cadência;
   - o plano dos versos: a nota suspensa dos versos ímpares sobre a dominante, a dos pares sobre a
     tónica, o fim em V7–i.
2. **Viola:** baixo e acorde.
   - Em 4/4 (fado triste), baixo nos tempos 1 e 3 (fundamental e quinta alternadas) e acorde nos
     tempos 2 e 4.
   - Em 2/4 (fado alegre, corrido), baixo e acorde a cada colcheia.
   - Antes de uma mudança de acorde, uma passagem de baixo por grau até à nova fundamental.
3. **Guitarra portuguesa:**
   - **introdução** com a segunda metade da melodia (o último verso, uma oitava acima), com trinados
     nas notas longas;
   - **respostas** nas respirações da voz, com uma frase curta que acaba por grau na primeira nota
     do verso seguinte;
   - por baixo das notas suspensas, um contracanto discreto em notas do acorde, longe do registo da
     voz;
   - mais forte nas respostas do que por baixo da voz, e em *forte* na última estrofe.
4. **Partitura:**
   - a voz, a guitarra portuguesa (clave de sol, som real) e a viola (clave de sol oitavada, como
     se escreve a guitarra);
   - as cifras dos acordes por cima da voz, como numa *lead sheet*;
   - no LilyPond, os acordes em `ChordNames`.
5. **Sons:**
   - guitarra portuguesa: duas cordas metálicas ligeiramente desafinadas entre si (os pares),
     ataque brilhante e decaimento rápido;
   - viola: dedilhado mais grave e quente;
   - no MIDI, os programas GM 25 (guitarra de aço) e 24 (guitarra de nylon), os mais próximos.
6. **Só no fado, por agora:** no Início rápido, a opção «Melodia + acompanhamento» só deixa
   escolher os estilos de fado.
