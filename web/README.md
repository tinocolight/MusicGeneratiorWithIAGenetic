# Ondas Atratoras — versão web

Versão web do *GeneticMusic* (Rui Luz e Rafael Silva, IPCA 2020): um algoritmo genético (AG) compõe
melodias e a aptidão inclui **ondas atratoras**, curvas que puxam as notas para uma bacia à sua volta.
Esta versão corre inteiramente no navegador, mantém o modelo original (para comparação) e acrescenta
extensões da literatura, **cânones a 2 ou 3 vozes** com qualquer instrumento à maneira de Telemann
(considerados desde a população inicial), um **editor de ondas** (várias ondas com frequência,
desfasamento, média e amplitude ou mínimo e máximo, e bacia), **auto-configuração** e um registo de
**experiências**, um **analisador de ondas**, uma **avaliação objetiva** independente das regras de
geração e uma **análise inversa** que passa música real pelas regras.

- [Como abrir](#como-abrir)
- [Guia de utilização](#guia-de-utilização)
- [O que se encontrou no código original](#o-que-se-encontrou-no-código-original)
- [Da literatura para o código](#da-literatura-para-o-código)
- [Avaliação e resultados](#avaliação-e-resultados)
- [O trabalho original à luz da literatura](#o-trabalho-original-à-luz-da-literatura)
- [Estrutura e comandos](#estrutura-e-comandos)
- [Referências](#referências)

## Como abrir

| Opção | Como |
|---|---|
| Ficheiro único | Abrir `web/dist/ondas-atratoras.html` no navegador (funciona a partir do disco). |
| Servidor local | `cd web && python3 -m http.server 8080` e abrir <http://localhost:8080>. Usa os módulos em `src/` diretamente. |
| GitHub Pages | Publicar a pasta `web/` (Settings → Pages). Não há passo de compilação. |

A única dependência em tempo de execução é o VexFlow (MIT), incluído em `web/vendor/` e usado só
quando se abre a partitura; o ficheiro único leva-o embutido e funciona sem rede. Node ≥ 18 só é
preciso para os testes e ferramentas.

## Guia de utilização

A faixa de cima (a **partitura**) é partilhada por todos os separadores: mostra as notas de cada
voz (melodia a negro, 2.ª voz a azul, 3.ª a roxo), as ondas atratoras com as bacias sombreadas (a
opacidade segue a influência da onda a cada distância) e, a tracejado, as ondas da configuração
atual enquanto ainda não foram usadas para gerar. Por baixo:

- **Piano roll / Partitura**: a partitura mostra a peça em notação tradicional, uma pauta por voz,
  gravada com a fonte musical Gonville (desenhada como substituta da fonte do LilyPond) e composta à
  maneira do LilyPond: sistemas justificados e equilibrados, nome dos instrumentos no 1.º sistema,
  número do compasso no início de cada linha, colchete a juntar as vozes, andamento e barra final.
  As notas que soam acendem-se durante a reprodução. Por baixo, **Código LilyPond** mostra (e copia)
  o `.ly` da peça.
- **LilyPond (.ly)**: descarrega esse ficheiro, para gravar a partitura com o próprio LilyPond
  (`lilypond peca.ly` produz o PDF e um MIDI). A ortografia segue a tonalidade (sensível elevada
  no modo menor, bequadros antes de sustenidos ou bemóis), as figuras são divididas nos tempos e nas
  barras com ligaduras, e as vozes que entram mais tarde começam com pausas de compasso.
- **▶ Tocar**: sintetizador no navegador com um timbre por família de instrumento (cordas
  friccionadas, flautas, palheta simples e dupla, metais, cravo, piano, órgão, vozes), tempo
  ajustável; cada voz tem a sua posição no panorama.
- **Tocar com todas as vozes**: desligado, ouve-se só a melodia.
- **Descarregar MIDI**: uma pista por voz, cada uma com o programa General MIDI do seu instrumento
  e já transposta. Dentro do visualizador do claude.ai o MIDI vem dentro de um `.zip` (é a única
  forma de o visualizador aceitar o ficheiro).
- As fichas no topo resumem a peça: aptidão, **crítico** (probabilidade de ser uma melodia real),
  características **típicas** (de 26), **pausas** e, com várias vozes, a **consonância** nos tempos
  fortes entre todas elas, as **quintas/oitavas paralelas**, as **tríades** completas (3 vozes) e as
  notas **fora do registo** de algum instrumento.

Um cânone simples (sem ronda) acaba quando restam menos de duas vozes, como a fermata de Telemann,
onde o 2.º violino pára com o 1.º; uma ronda circular dá duas voltas.

### Compor

O painel está organizado de cima para baixo, do mais geral para o mais técnico. Só é preciso mexer
no que interessa: tudo o resto tem valores sensatos.

1. **Configuração rápida** (opcional): **Auto-configurar** escolhe, a partir das vozes, ondas que
   cabem no registo comum dos instrumentos (um arco de frase para uma melodia; um seno com
   período = n.º de vozes × entrada para um cânone), a forma (livre em cânone), o número de
   compassos (espaço para a última entrada), pesos e algoritmo. **Surpreende-me** sorteia
   tonalidade, conjunto, ondas e forma dentro de valores sensatos. **Repor** volta ao início.
2. **Peça**: modelo (campo de atratores ou clássico), tonalidade, maior/menor, compassos, forma
   musical (A A′ B A′, A B A′ C, …) e duração da frase.
3. **Vozes e cânone**: um **conjunto** pré-definido (2 violinos à Telemann, 2 flautas, trio de
   cordas, ronda a 3 vozes, cânone à 5.ª com oboé e fagote) ou cada voz à mão: **instrumento** (18,
   de cordas a vozes, cada um com o seu registo), **compasso de entrada** (c. 2 a c. 9) e
   **intervalo** (uníssono, 8.ª acima/abaixo, 2 oitavas abaixo, 5.ª ou 4.ª diatónicas). Com duas
   ou mais vozes o contraponto entra na aptidão **e na população inicial**: cada melodia da
   geração 0 já é escrita nota a nota a concordar com as vozes que soam nesse momento.
   **Ronda circular**: a melodia recomeça e as vozes nunca param. Por baixo aparece o registo que a
   melodia pode usar para todas as vozes ficarem tocáveis.
4. **Ondas atratoras** (campo de atratores): uma **predefinição** ou até **4 ondas** editáveis,
   cada uma com:
   - **tipo**: seno, arco de frase, 1/f, Rössler, Lorenz ou constante (tessitura);
   - **frequência** em ciclos por compasso (mostra também «1 ciclo em X compassos»);
   - **desfasamento** em tempos (desloca a onda no tempo; nos atratores caóticos o início é
     aleatório);
   - **valor médio ± amplitude** ou, em alternativa, **mínimo e máximo** (em MIDI, com o nome da
     nota e a frequência em Hz);
   - **bacia**: largura σ em semitons e forma (gaussiana, gravitacional 1/(1+d²) ou degraus como no
     C#).

   **Ondas ← instrumentos** propõe uma onda para o registo das vozes; **Ondas ← melodia real**
   ajusta ondas a uma melodia do corpus e transpõe-as. Um aviso aparece se uma onda sair do registo
   tocável.

   No **modo clássico** aparecem os campos do formulário original para as duas ondas W1 e W2:
   períodos por compasso, valor médio em meios-tons (Lá4 = 0), amplitude e bacia de atração em
   meios-tons e desfasamento horizontal (16 = um ciclo, como em `NoteAtractionFunction`), com
   inteiros onde o C# usava `int.Parse`. Há ainda a opção de simular a 1.ª execução do original
   (onda 1 plana no gene 0) e um botão para repor os valores do original.
5. **Pesos das regras** (expandir): o peso de cada regra, com predefinições (por omissão,
   **aprendidos da música real**, ênfase no contraponto, ênfase nas ondas), incluindo **Idioma do
   corpus (blocos)** (a 0 por omissão, ver abaixo); e **Não maximizar** (ligado por omissão): cada regra conta só até ao seu valor
   típico na música real. No modo clássico, os dois grupos do original.
6. **Algoritmo genético** (expandir): gerações, população, mutação e operadores (musicais ou de bits
   como no GeneticSharp). A **semente** fica à vista: a mesma configuração com a mesma semente dá
   sempre a mesma peça.
7. **Ponto de partida**: cada «Gerar» parte do zero com a **semente** (por omissão; a mesma semente
   dá a mesma população inicial, por isso definições parecidas dão resultados parecidos), do zero
   com uma **semente nova**, ou **continua** da população final da experiência anterior (ou da que
   foi carregada), reavaliada com as definições atuais. A **população inicial** pode ter **padrões
   musicais** (células rítmicas, graus da escala e, com várias vozes, já em cânone), padrões musicais
   sem o cânone, ser **aleatória, sem padrões** (cada semicolcheia é pausa, prolongamento ou uma
   nota cromática ao acaso, para ver o AG convergir a partir do ruído; sobe as gerações para
   1500–2000), ou ser escrita com os **blocos do corpus** (ver «Blocos de construção» abaixo; é a
   omissão para uma melodia só). **Ver a evolução devagar** mostra a geração 0 e depois uma geração de cada vez.
8. **Gerar**, **Outra semente**, ou **Testar 5 sementes**: gera com 5 sementes seguidas e resume
   aptidão, crítico e consonância (média, desvio e extremos), carregando a melhor. Uma mudança só
   «ajudou» se o resumo melhorar, não só uma semente.
9. **Experiências**: cada geração fica numa tabela (configuração, semente, aptidão, crítico,
   consonância entre vozes); **Carregar** repõe a configuração e a peça dessa linha.
10. **Copiar ou colar a configuração**: toda a configuração em JSON, para guardar, partilhar ou
   repetir mais tarde.

À direita: a evolução desde a geração 0 (melhor aptidão, média e diversidade da população), a
**convergência** (o melhor indivíduo nas gerações 0, 1, 2, 5, 10, 20, 50, 100, 200, 500, …, com o
crítico de cada um, para ver e ouvir) e a contribuição de cada regra no melhor indivíduo.

### Explorar (MAP-Elites)

Em vez de uma só melodia, ilumina um mapa de 8 × 8 células com a melhor melodia para cada
combinação de duas características (por omissão: notas por tempo × intervalo médio). Carregar em
**Iluminar mapa**, depois clicar numa célula para a ouvir e carregá-la na partitura. Usa a
configuração do separador Compor (vozes incluídas).

### Variações (Dabby)

Gera variações do tema atual por mapeamento caótico: a **divergência** controla quando a variação
se afasta do tema (valores baixos: só no fim; altos: logo no início). «Só alturas» mantém o ritmo.
**Montar forma A A′ B A″** junta o tema, duas variações e uma secção contrastante numa peça 4 vezes
mais longa (a estratégia de composição completa da secção 2.5 do relatório original).

### Analisar

1. Escolher a peça: a peça atual, os três cânones de Telemann transcritos (Sonatas I, II e III),
   duas rondas, qualquer uma das 480 melodias do corpus ou um **ficheiro MIDI** próprio (a
   polifonia é reduzida à nota mais aguda). Os cânones tocam-se com a 2.ª voz na entrada real.
2. Escolher o número de **partes** (1–8) e a segmentação: partes iguais ou fronteiras de frase
   (LBDM).
3. **Ondas por parte**: automático (BIC) ou 1–3.
4. **Analisar**. Para cada parte aparece a **onda de frequência mais baixa** e as **de frequência mais
   alta**, cada uma com frequência (ciclos por compasso e período), **valor médio** (nota e Hz),
   amplitude, largura da bacia (σ) e percentagem de notas que atrai; a nota mais grave e mais aguda
   e a média das graves e das agudas (em Hz); e o espectro do contorno com as oscilações
   significativas (teste de permutação). As ondas ajustadas aparecem na partitura.
5. **Usar ondas da 1.ª parte no gerador** copia essas ondas para o editor do separador Compor
   (frequência convertida para compassos de 4/4, transpostas para a tonalidade escolhida), onde
   podem ser editadas.

### Avaliar

Crítico, características típicas, surpresa melódica e complexidade; com várias vozes, uma tabela
por voz (instrumento, entrada, intervalo, registo, notas fora do alcance) e uma por par de vozes
(consonância nos tempos fortes, quintas e oitavas paralelas, uníssonos, movimento contrário); a
melodia contra si própria a 1, 2 e 3 compassos, com os três cânones de Telemann como referência; e
as 26 características da peça com o intervalo P10–P90 das melodias reais.

## O que se encontrou no código original

Tudo o que se segue foi verificado executando o C# original: `tools/parity-csharp` compila
`AlgorithmFitness.cs`, `ConfigurationValues.cs` e `MidiSharp.cs` sem alterações com o GeneticSharp
2.6.0 (o pacote do projeto), mais uma cópia idêntica em que só `Parallel.For` passa a ciclo normal.

1. **Aptidão não determinística.** Todas as regras fazem `result +=` dentro de `Parallel.For` sem
   sincronização. O mesmo cromossoma recebe valores diferentes a cada avaliação; o erro mediano
   por regra, face à versão sequencial, é de 20–45 % (`EvaluateScale` também partilha a variável
   `temporaryNote` entre threads). O AG está a otimizar uma aptidão com ruído.
2. **Onda 1 a zero na primeira execução.** `onda1`/`onda2` são criados no inicializador de campo
   com o `lenghtSequence` estático *antes* de o construtor o definir; na primeira execução
   `NoteAtractionFunction` itera sobre um vetor vazio e a onda 1 fica uma linha em 0 (confirmado:
   a partir da 2.ª execução está correta). Nessa execução todas as notas são penalizadas por igual.
3. **Pausas como refúgio.** A regra das ondas só avalia genes de ataque: pausas e prolongamentos
   nunca são penalizados, e várias regras dão-lhes pontos fixos. Com os pesos por defeito o efeito
   não aparece (o `ScoreBalance` puxa para o lado oposto), mas quando se reforçam as ondas o AG foge
   à penalização deixando de atacar notas: os ataques caem de ~0,7 para ~0,2 por semicolcheia e as
   pausas sobem até 10 % (teste `test/rests.test.mjs`).
4. **Ritmo demasiado denso.** O `ScoreBalance` pede 7–40 % de semicolcheias sem ataque; nas 480
   melodias reais esse valor é 58–83 % (mediana 77 %). O programa original produz 2,4–3,4 notas por
   tempo (melodias reais: 0,7–1,7).
5. **Auto-harmonização.** `ScoreMSelfHarmonizationPreviousMeasures` compara *genes*: quando a outra
   voz prolonga uma nota, o «intervalo» é calculado contra o código 74 (ou 0 numa pausa). Além disso
   premeia quartas (+2) e penaliza sextas (−0,5), ao contrário do contraponto a duas vozes, e não
   vê quintas/oitavas paralelas.
6. **Operadores ao nível do bit.** O `FloatingPointChromosome` guarda 8 bits por gene; o
   `UniformCrossover` mistura bits e o `PartialShuffleMutation` baralha um troço da cadeia de bits
   (em média ~43 genes). Valores acima de 74 são cortados para 74 (prolongamento). Quase nenhuma
   variação é um passo musical pequeno.
7. **Pequenas gralhas.** `result = 2f` (em vez de `+=`) no intervalo de 2 semitons e
   `result = +10f` nos padrões rítmicos; o ramo «−8» de `EvaluateRange` é inalcançável; o
   «recozimento» do âmbito usa divisão inteira; a amplitude da onda 2 no formulário é 5, mas o
   construtor copia por cima o valor por defeito (4).

O modo **Clássico** reproduz as regras exatamente (0 diferenças em 795 comparações com a versão
sequencial do C#), sem a corrida entre threads, com a onda 1 correta e com as duas gralhas
corrigidas (a opção `strict: true` mantém-nas, para o teste de paridade).

## Da literatura para o código

O relatório original propõe que as melodias têm componentes oscilatórias e usa senos com uma
bacia de atração. A literatura permite generalizar cada peça desse modelo:

| Ideia | Referência | Onde |
|---|---|---|
| A onda como **arco de frase** (o contorno mais frequente em canções) | Huron 1996 | `core/waves.js` (`arch`) |
| Flutuações **1/f** da altura | Voss & Clarke 1975 | `waves.js` (`pink`) |
| **Atratores estranhos** (Rössler, Lorenz): oscilação que nunca se repete igual | Pressing 1988; Bidlack 1992 | `waves.js` |
| **Bacias contínuas**: a influência decai com a distância (gaussiana, 1/(1+d²)) | Temperley 2008 (perfil de âmbito gaussiano); Lerdahl 2001 (atração ∝ 1/n²) | `fitness/attractor.js` |
| Várias ondas = **várias bacias** (cada nota pertence a uma delas): melodia composta | relatório original, Fig. 1–2; Davis 2006 | `attractor.js` (cobertura) |
| **Proximidade** e **regressão para a média** depois de um salto (a onda é a média móvel) | Temperley 2008; von Hippel & Huron 2000 | `attractor.js` |
| **Forças melódicas**: notas instáveis resolvem para a vizinha mais atrativa | Lerdahl 2001; Larson 2012 | `attractor.js`, `core/theory.js` |
| Hierarquia **tonal-métrica**, cadências | Lerdahl & Jackendoff 1983; Prince & Schmuckler 2014 | `attractor.js` |
| **Onda de tensão**: a tensão segue um perfil alvo | Farbood 2012; Herremans & Chew 2017 (MorpheuS) | `attractor.js` |
| **Forma** A A′ B A″ com variação (semelhança invariante à transposição → sequências) | Caplin 1998; relatório original §2.5 | `attractor.js` |
| **Cânone**: contraponto da melodia contra si própria | Fux 1725; Huron 2001; Telemann TWV 40:118–123 | `fitness/canon.js` |
| **Operadores musicais**: mudar tom/oitava, trocar notas, sequência, inversão, retrógrado | Matić 2010; Biles 1994 (GenJam) | `ga/operators.js` |
| **MAP-Elites**: mapa de variações boas e diferentes | Mouret & Clune 2015 | `ga/mapelites.js` |
| **Variações** por mapeamento caótico | Dabby 1996 | `variation/dabby.js` |
| **Analisador**: ondas por EM, segmentação LBDM, espectro com permutação | Cambouropoulos 2001; Voss & Clarke 1975 | `analysis/wavefit.js` |

Nos modos novos cada regra devolve uma **média** em [−1, 1] (por nota, intervalo ou frase) e não
uma soma, e as pausas são avaliadas por uma densidade alvo explícita (≤ 8 %), por isso deixaram de
ser um refúgio.

### Cânone à Telemann

Nos *XIIX Canons mélodieux* (Paris, 1738; TWV 40:118–123) os dois instrumentos leem a mesma parte: o
segundo começa no sinal 𝄋 (no Vivace da Sonata I, um compasso depois) e termina na fermata. A regra
`canon` avalia, semicolcheia a semicolcheia, as duas notas que soam: consonâncias imperfeitas
(3.as, 6.as) valem mais do que perfeitas, a 4.ª conta como dissonância, dissonâncias só em tempos
fracos como notas de passagem ou em tempos fortes como retardos que resolvem por grau descendente,
quintas e oitavas paralelas são penalizadas, o movimento contrário/oblíquo é premiado e pelo menos
uma voz deve mover-se em cada tempo.

Três andamentos foram transcritos (`src/data/references.js`, a partir das partituras; ornamentos
omitidos, tercinas aproximadas) e servem de validação: em todos a pontuação de cânone tem o máximo
exatamente na entrada verdadeira da 2.ª voz, procurando entre todos os atrasos múltiplos do tempo.

| Andamento | Compasso | Entrada real | Pontuação no atraso real | Consonância nos tempos fortes | 5.as/8.as paralelas |
|---|---|---|---|---|---|
| Sonata I (TWV 40:118), Vivace | 6/4 | 1 compasso | 0,61 (2.º melhor: 0,30) | 83 % | 1 em 33 c. |
| Sonata II (TWV 40:119), Vivace | 3/8 | 2 compassos | 0,64 | 89 % | 1 em 73 c. |
| Sonata III (TWV 40:120), Spirituoso | 4/4 | 1 compasso | 0,64 | 78 % | 0 em 46 c. |

A regra original de auto-harmonização também põe o atraso certo da Sonata I em primeiro, mas por
uma margem mínima (−0,08 contra −0,10) e dá nota negativa ao cânone real. Limitação: com uma
resolução de uma semicolcheia, um atraso de 23 semicolcheias pontua ligeiramente acima do real na
Sonata I (as figuras longas fazem com que um desvio de uma semicolcheia quase não mude as notas
que soam); por isso a procura, na interface e nos testes, é feita em tempos.

### Vozes, instrumentos e cânone desde o início

O cânone deixou de ser um «modo» à parte: qualquer peça pode ter até **3 vozes**, cada uma com o
seu instrumento (18, com registo prático e programa General MIDI), compasso de entrada e intervalo
(cromático — uníssono, oitavas — ou diatónico — 5.ª e 4.ª dentro da escala, como nos cânones à 5.ª
de Bach). Com duas ou mais vozes:

- a aptidão inclui a regra `canon` para **todos os pares** de vozes (cada par como acima), mais um
  bónus para os tempos fortes em que as 3 vozes formam uma **tríade** completa e uma penalização
  para notas fora do registo de algum instrumento (`analyzeEnsemble` em `fitness/canon.js`);
- a **população inicial** já respeita o cânone (`randomCanonGenome` em `ga/operators.js`): o ritmo
  vem das células rítmicas de sempre, mas as alturas são escolhidas da esquerda para a direita, cada
  uma sorteada com peso proporcional à consonância com as notas que as outras vozes tocam nesse
  instante (e à proximidade da nota anterior e das ondas). Assim o cânone é considerado desde a
  geração 0, e não só depois de o AG o descobrir;
- há uma mutação própria (`repitch`) que volta a escolher a altura de uma nota com o mesmo critério.

Consequência prática: se se pede que a melodia faça sentido com uma 2.ª voz a entrar no c. 2 e uma
3.ª no c. 3, isso vale para todos os indivíduos desde o início. Numa medição com 20 indivíduos
iniciais, a componente de contraponto é em média 0,74 (2 violinos) e 0,73 (trio) com esta
inicialização, contra 0,14 e 0,18 com indivíduos aleatórios.

Resultado (`node tools/benchmark.mjs 6`, 6 sementes, configurações de «Auto-configurar»):

| Conjunto | Contraponto na geração 0 | Gerações até 0,8 | Contraponto final | Consonância nos tempos fortes | Paralelas | Tríades | Crítico |
|---|---|---|---|---|---|---|---|
| 2 violinos (c. 2), cânone desde a geração 0 | 0,84 | 3 | 1,13 | 99 % | 0 | — | 0,89 |
| 2 violinos, cânone só na aptidão | 0,43 | 21 | 1,13 | 100 % | 0 | — | 0,88 |
| Trio (viola c. 3, violoncelo 8.ª abaixo c. 5), desde a geração 0 | 0,91 | 1 | 1,24 | 88 % | 0 | 90 % | 0,79 |
| Trio, só na aptidão | 0,27 | 26 | 1,25 | 91 % | 0 | 86 % | 0,68 |
| Cânone à 5.ª diatónica (oboé, fagote c. 2) | 0,84 | 3 | 1,06 | 99 % | 0 | — | 0,91 |
| Ronda circular a 3 vozes | 0,97 | 1 | 1,30 | 88 % | 0 | 96 % | 0,79 |

Com 2 vozes, considerar o cânone desde o início só acelera: o AG acaba no mesmo sítio. Com 3 vozes
também muda o resultado: mais tríades completas (90 % contra 86 %) e melodias mais típicas (crítico
0,79 contra 0,68), porque o AG não gasta a diversidade inicial a reparar o contraponto. Para uma
melodia só (com os blocos do corpus e «não maximizar», ver abaixo), os pesos por omissão deram
crítico 0,85 ± 0,06 contra 0,79 ± 0,15 com os pesos aprendidos da música real; com 6 sementes a
diferença não é conclusiva. (Números com «não maximizar» ligado, como agora por omissão.)

### Ondas editáveis

Cada onda é descrita como um músico a definiria: tipo, **frequência** (ciclos por compasso),
**desfasamento** (em tempos), **valor médio e amplitude** (ou **mínimo e máximo**), e a **bacia**
(largura σ e forma). O arco de frase foi ajustado para que o clímax fique exatamente em média +
amplitude e o fim da frase em média − amplitude (o arco desce no fim, por isso o seu centro não é o
ponto médio da curva); o seno respeita o desfasamento como deslocamento no tempo. Há até 4 ondas
por peça; com mais do que uma, cada nota é atraída pela onda mais próxima (as bacias competem) e
a regra premeia usar todas.

### Blocos de construção do corpus

Pedido: os inícios soavam muitas vezes iguais (nota longa, pausa, a mesma nota, uma abaixo, de
volta). Diagnóstico, em 16 sementes: 13 começavam na tónica, quase sempre repetida no 1.º tempo, e
as regras de regressão, forças melódicas, hierarquia métrica e variedade estavam todas no máximo.
O AG levava cada regra ao extremo, e há muito poucas melodias nesse extremo.

**Corpus.** `tools/extract_large_corpus.py` junta 6758 melodias reais em 2/4, 3/4 e 4/4 do corpus do
music21 (Essen 5290, Aird's Airs 571, O'Neill 313, Bach 300, Ryan's Mammoth 284), sem as 480
melodias do crítico, que continua a ser um juiz independente.

**Blocos.** `tools/build_blocks.mjs` corta cada melodia em tempos. Um bloco é o ritmo do tempo (nota,
prolongamento ou pausa em cada semicolcheia) e o contorno interno em graus da escala, por isso é
transponível. 349 blocos cobrem 99,5 % dos tempos. O modelo guarda:

- que bloco se segue a qual, conforme o tempo do compasso (forte, meio, fraco), à maneira das
  cadeias de Markov de «pontos de vista» de Conklin & Witten (1995);
- o intervalo de entrada em cada bloco, dado o grau da nota anterior e o tempo (tendências tonais);
- **regras de associação** entre blocos da mesma melodia, com suporte, confiança e *lift*
  (Agrawal & Srikant 1994; Brin et al. 1997): «se o bloco A aparece, o bloco B aparece com
  probabilidade p, lift vezes mais do que ao acaso»;
- como começam as melodias reais e o valor típico (P25/P50/P75) de cada regra da aptidão.

Relatório em [`results/blocks.md`](results/blocks.md) e no separador Analisar («Padrões do corpus»).
Algumas conclusões:

- A primeira nota das melodias reais é a **dominante em 49 %**, a tónica em 28 % e a mediante em 13 %;
  24 % começam com anacrusa (pausa + colcheia). O AG começava na tónica em 81–88 %.
- 44 % dos tempos são uma semínima; a seguir vêm duas colcheias por grau (a descer 7 %, a repetir 5 %,
  a subir 4,5 %).
- As associações mostram coerência de estilo. Por exemplo, o «Scotch snap» (semicolcheia + colcheia
  com ponto) a descer traz o mesmo a subir em 31 % das melodias (29× o acaso), e os padrões de
  semicolcheias puxam outros padrões de semicolcheias (lift 10–20). Pelo contrário, semínimas ligadas
  e corridas de semicolcheias quase nunca aparecem juntas (lift 0,02).
- Na música real a regressão após salto fica em 0 no P75, as forças melódicas em 0,27 e a hierarquia
  métrica em 0,60. O AG levava as três a 1,00.

**Uso no AG** (cada peça é opcional):

1. **População «Blocos do corpus»**: cada indivíduo é escrito bloco a bloco pelas transições; os
   blocos associados aos que já foram usados ficam mais prováveis (o produto dos *lifts*, com teto) e a
   1.ª nota segue a distribuição real. É aqui que entram as regras de associação: «se este bloco já
   está na melodia, estes outros ficam mais prováveis».
2. **Mutação por blocos**: reescreve um ou dois tempos com blocos que encaixam no anterior e no resto
   da peça.
3. **Regra «Idioma do corpus»** (nos pesos, a 0 por omissão): log-probabilidade média por tempo (e
   coerência das associações), recompensada só até à mediana das melodias reais. Recompensar o
   máximo daria sempre os blocos mais prováveis, ou seja, o mesmo problema.
4. **Não maximizar**: cada regra conta só até ao seu P75 na música real. É a melhoria que a análise
   inversa sugeria («pontuar a distância ao valor típico em vez do máximo»).

**Resultado** (`node tools/openings.mjs 8`, 8 sementes, [`results/openings.md`](results/openings.md)):

| Conjunto | Variante | Crítico | Típicas /26 | 1.ª nota tónica / dominante / mediante |
|---|---|---|---|---|
| Melodia | Anterior (padrões musicais, regras ao máximo) | 0,93 | 17,5 | 88 % / 0 % / 13 % |
| Melodia | Não maximizar | 0,92 | 18,3 | 63 % / 0 % / 13 % |
| Melodia | Blocos (população + mutação), regras ao máximo | 0,82 | 18,4 | 100 % / 0 % / 0 % |
| Melodia | **Não maximizar + blocos** (nova omissão) | 0,90 | **21,1** | 50 % / 0 % / 13 % |
| Melodia | Não maximizar + blocos + idioma 1,5 | 0,82 | 20,4 | 25 % / 0 % / 63 % |
| 2 violinos | Anterior | 0,84 | 18,1 | 38 % / 13 % / 50 % |
| 2 violinos | **Não maximizar** (nova omissão) | **0,90** | 19,1 | 0 % / 13 % / 38 % |
| 2 violinos | Não maximizar + blocos + idioma 1,5 | 0,70 | 18,1 | 0 % / 75 % / 0 % |

Com 8 sementes, diferenças de crítico de 0,05 ainda são ruído. Por isso as candidatas da melodia só
foram repetidas com 24 sementes (`node tools/solo_defaults.mjs 24`,
[`results/solo-defaults.md`](results/solo-defaults.md)):

| Melodia só, com «não maximizar» | Crítico | Típicas /26 |
|---|---|---|
| Padrões musicais | 0,93 ± 0,05 | 18,8 ± 1,4 |
| **Blocos do corpus** | 0,91 ± 0,05 | **20,8 ± 2,0** |
| Blocos + idioma 0,75 | 0,87 ± 0,06 | 20,5 ± 2,1 |
| Blocos + idioma 1,5 | 0,84 ± 0,09 | 20,5 ± 2,3 |

- **Não maximizar** é uma melhoria sem custo: o crítico mantém-se na melodia e sobe no cânone (0,84 →
  0,90), as melodias ficam mais típicas e menos presas à tónica.
- **Os blocos na população e na mutação** tornam as melodias mais típicas (~21 de 26
  características no intervalo real, contra 17,5–18,8), com o crítico praticamente igual. Sozinhos
  não chegam: com as regras ao máximo o AG puxa tudo de volta à tónica (100 %).
- **A regra «idioma» na aptidão não compensa**: quanto maior o peso, mais baixo o crítico, sem
  ganho em tipicidade. Pedir ao AG que maximize a probabilidade dos blocos leva-o para os blocos
  mais comuns, que isoladamente soam bem mas juntos dão melodias menos parecidas com as reais. As
  associações funcionam melhor a *construir* (população e mutação) do que a *julgar*. A regra fica
  disponível nos pesos, a 0.
- **No cânone os blocos custam contraponto** (crítico 0,70–0,77): por omissão, com duas ou mais vozes a
  população continua a ser a que já nasce em cânone.
- **A dominante quase nunca fica como 1.ª nota numa melodia só**, apesar de ser a mais comum na
  música real: a onda por omissão (arco de frase) começa perto da tónica. Mudar a onda muda isto; as
  regras deixaram de o impor.
- O padrão exato descrito («nota longa, pausa, a mesma, abaixo, a mesma») não apareceu em nenhuma
  destas sementes: o que se repetia era o esqueleto (tónica repetida no 1.º tempo e salto para a 3.ª ou
  a 5.ª). Com a mesma semente a população inicial é a mesma, por isso definições parecidas dão inícios
  parecidos; «Do zero (semente nova)» evita-o.

## Avaliação e resultados

### Método

Para não avaliar a música com as mesmas regras que a geraram, a avaliação usa dados:

- **Corpus**: 480 melodias em domínio público do corpus do music21 (240 canções da coleção Essen,
  120 temas de *O'Neill's Music of Ireland*, 120 sopranos de corais de Bach), cortadas nos primeiros
  8 compassos numa grelha de semicolcheias (`tools/extract_corpus.py`).
- **26 características** (`src/eval/metrics.js`): as de Towsey et al. 2001 (variedade e âmbito,
  centralidade tonal, notas fora da escala, intervalos dissonantes, contorno, movimento por grau,
  retorno após salto, clímax, densidades, variedade rítmica, padrões repetidos), declives de Zipf
  (Manaris et al. 2005), declive espectral 1/f (Voss & Clarke 1975), entropias, complexidade de
  Lempel-Ziv (Schmidhuber 2009) e **surpresa** (informação) sob um modelo de bigramas de intervalos e
  durações aprendido no corpus, à maneira do IDyOM (Pearce & Wiggins 2012).
- **Crítico**: regressão logística que distingue as melodias reais de melodias nulas (ruído branco
  cromático e diatónico, ruído castanho, ruído 1/f, melodias reais com as alturas ou as durações
  baralhadas). Validação cruzada 5-fold: **AUC 0,975**, exatidão 94,5 %. O Vivace de Telemann, que
  não está no corpus, recebe 99 %. Mede quão *típica de uma melodia real* é a peça, não a sua beleza.
- **Cânone**: a análise de contraponto acima, com o Telemann como referência.
- **Típicas**: número de características dentro do intervalo P10–P90 das melodias reais.

### Resultados

`node tools/benchmark.mjs 6` (6 sementes por configuração, ~47–67 mil avaliações por execução;
tabela completa em [`results/benchmark.md`](results/benchmark.md)):

| Configuração | Crítico | Típicas /26 | Notas/tempo | Grau conjunto | Surpresa (bits) | Cânone 1 c. (tempos fortes) | Paralelas/c. |
|---|---|---|---|---|---|---|---|
| *Melodias reais (480)* | 0,86 | 22,1 | 1,06 | 0,60 | 2,85 | 55 % | 0,14 |
| *Ruído branco na escala* | 0,00 | 10,7 | 1,03 | 0,13 | 6,26 | 57 % | 0,02 |
| *Ruído castanho* | 0,02 | 19,8 | 1,03 | 0,55 | 3,14 | 53 % | 0,08 |
| **Programa C# original** (4 × 40 s) | 0,00 | — | 2,4–3,4 | — | — | 46–61 % | — |
| Clássico (port, operadores de bits) | 0,00 | 11,5 | 2,80 | 0,14 | 6,15 | 57 % | 0,12 |
| Clássico, 1.ª execução (onda 1 = 0) | 0,01 | 12,0 | 2,51 | 0,14 | 6,11 | 52 % | 0,12 |
| Clássico sem ondas | 0,01 | 12,7 | 3,49 | 0,14 | 6,05 | 54 % | 0,21 |
| Clássico + operadores musicais | 0,93 | 15,5 | 2,84 | 0,26 | 3,78 | 49 % | 1,00 |
| Campo: 2 senos do original | 0,84 | 18,0 | 1,52 | 0,57 | 3,37 | 91 % | 0,48 |
| Campo: arco de frase | 0,93 | 17,5 | 1,63 | 0,57 | 3,22 | 96 % | 0,26 |
| Campo: arco, **sem bacias** (ablação) | 0,94 | 17,8 | 1,77 | 0,57 | 3,21 | 96 % | 0,21 |
| Campo: 1/f | 0,90 | 18,3 | 1,43 | 0,59 | 3,12 | 93 % | 0,21 |
| Campo: Rössler | 0,90 | 19,7 | 1,48 | 0,61 | 3,20 | 94 % | 0,12 |
| Campo: Lorenz | 0,92 | 20,2 | 1,48 | 0,62 | 3,13 | 86 % | 0,10 |
| Campo: melodia composta | 0,75 | 16,2 | 1,42 | 0,64 | 3,38 | 56 % | 0,24 |
| **Cânone** (2 violinos, 2.ª voz a 1 compasso) | 0,89 | 16,8 | 1,47 | 0,44 | 3,44 | **100 %** | **0,00** |
| MAP-Elites (52 células, 81 % do mapa) | 0,56 (19 células ≥ 0,7) | — | 1,64 | — | — | — | — |

Leitura:

- **As regras originais produzem ruído, estatisticamente.** A surpresa melódica das saídas (6,15
  bits por nota) é a do ruído branco (6,26), o movimento por grau conjunto é o do ruído (0,14), há
  2–3 vezes mais notas do que numa melodia real e o crítico dá 0,00. O programa C# original, corrido
  de verdade, dá o mesmo. Tocadas em cânone a 1 compasso, as saídas têm 57 % de consonâncias nos
  tempos fortes, exatamente o valor do ruído aleatório: as regras de auto-harmonização não
  garantiam que dois violinistas pudessem ler a mesma parte.
- **Os operadores pesam muito.** Com as mesmas regras, só trocar os operadores de bits por operadores
  musicais leva o crítico de 0,00 a 0,93 e a surpresa de 6,15 para 3,78 bits.
- **Os modos de campo aproximam-se das melodias reais** em quase todas as medidas (16–20 de 26
  características típicas; grau conjunto 0,57–0,64; surpresa 3,1–3,4 bits), mas continuam com mais
  notas por tempo (1,4–1,8 contra 1,06).
- **As ondas atratoras não melhoram a «qualidade» por si só.** Na ablação (sem bacias) o crítico e as
  características típicas ficam iguais. As ondas são um controlo de forma — onde a melodia sobe,
  desce e em que registo está — e é isso que permite, por exemplo, afastar as duas vozes de um
  cânone (onda com período = 2 × atraso) ou escrever uma melodia composta. A melodia composta paga
  isso com um crítico mais baixo (0,75) e menos consonância em cânone, porque os saltos entre
  registos são raros no corpus.
- **Cânone.** O modo cânone chega a 100 % de consonância nos tempos fortes, sem quintas nem oitavas
  paralelas, contra 83 % e 1 paralela em 33 compassos no Telemann. Isto não significa «melhor do que
  Telemann»: as melodias geradas são mais simples (muitas notas da tríade), e o crítico desce
  ligeiramente (0,89 contra 0,93 com a mesma onda sem cânone).
- **MAP-Elites** cobre 81 % do mapa; 19 das 52 células têm crítico ≥ 0,7. O mapa troca tipicidade por
  diversidade, e é precisamente para ouvir variações diferentes.

### Quanto do resultado vem da população inicial?

A população inicial «musical» é feita de células rítmicas e graus da escala (e, com várias vozes, já
em cânone). Para separar o mérito do AG do mérito desses padrões, `node tools/convergence.mjs 4 2000`
compara-a com uma população **aleatória, sem padrões** (cada semicolcheia é pausa, prolongamento ou
nota cromática ao acaso). Melhor indivíduo, média de 4 sementes, aptidão · crítico
([`results/convergence.md`](results/convergence.md)):

| Conjunto | População inicial | Geração 0 | 100 | 600 | 2000 |
|---|---|---|---|---|---|
| Só a melodia | com padrões musicais | 12,0 · 0,71 | 19,3 · 0,77 | 20,3 · 0,93 | 20,5 · 0,92 |
| Só a melodia | aleatória | −5,5 · 0,00 | 16,0 · 0,67 | 19,9 · 0,80 | 20,4 · 0,84 |
| 2 violinos (c. 2) | com padrões musicais | 16,2 · 0,88 | 22,9 · 0,75 | 24,4 · 0,86 | 24,7 · 0,87 |
| 2 violinos (c. 2) | aleatória | −4,2 · 0,00 | 17,6 · 0,43 | 22,9 · 0,60 | 24,4 · 0,78 |
| Trio | com padrões musicais | 16,5 · 0,81 | 21,5 · 0,75 | 23,8 · 0,76 | 24,3 · 0,83 |
| Trio | aleatória | −6,7 · 0,00 | 13,0 · 0,42 | 19,4 · 0,64 | 21,8 · 0,72 |

- **Os padrões iniciais já fazem muito**: antes de qualquer evolução, o melhor indivíduo da geração 0
  tem crítico 0,71–0,88. O AG acrescenta sobretudo o que as regras pedem (ondas, cadências, forma,
  contraponto); o «soar a melodia» vem em boa parte das células rítmicas e da escala.
- **A partir do ruído o AG também converge**: com uma ou duas vozes chega à mesma aptidão em
  1000–2000 gerações (2–3 vezes mais), mas o crítico fica ~0,1 abaixo. Com 3 vozes não chega lá em
  2000 gerações (21,8 contra 24,3). As regras não descrevem tudo o que torna típica uma melodia
  real — o que a análise inversa também mostra.
- Por isso a interface deixa escolher: ver a convergência honesta a partir do ruído, ou partir de
  padrões musicais para chegar mais depressa a algo tocável.

### As ondas existem nas melodias reais?

A pergunta que o relatório original deixou fora do âmbito (§2.3). Resultado do analisador sobre as
480 melodias reais, comparadas com as mesmas melodias com as alturas baralhadas e com ruído castanho:

| | R² de uma onda (mediana) | Oscilação significativa (p < 0,05) |
|---|---|---|
| Melodias reais | 0,42 | 73 % |
| As mesmas, baralhadas | 0,15 | 7 % |
| Ruído castanho | 0,54 | 84 % |

A melodia real explica-se melhor por uma onda lenta do que a sua versão baralhada em 97 % dos casos.
A onda mais lenta tem tipicamente **1 ciclo a cada 4–8 compassos** (0,125–0,25 ciclos por compasso,
318 das 480 melodias; em 95 a onda mais lenta é constante) e **±2,9 semitons** de amplitude mediana; o BIC escolhe 2 ou 3 ondas em 90 % das
melodias. A componente oscilatória é real, mas também aparece em qualquer passeio aleatório: é uma
consequência do movimento por grau conjunto e da regressão para a média (von Hippel & Huron 2000),
um fator entre vários e não uma marca exclusiva de boa música.

### Análise inversa: a música real passada pelas regras

O relatório original testou as regras com algumas aberturas clássicas (§5.1). Aqui foi feito o
mesmo em escala (`node tools/reverse.mjs`, resultados em [`results/reverse.md`](results/reverse.md)):
235 melodias reais **completas** em 4/4 (até 16 compassos, com os finais verdadeiros), comparadas
com as mesmas melodias **lidas do fim para o início** (retrógrado), com as notas baralhadas, com ruído
castanho e branco na mesma tonalidade e âmbito, e com saídas do próprio AG.

| Grupo | Aptidão clássica (por compasso) | Aptidão nova | Crítico |
|---|---|---|---|
| Melodias reais | 988 | 10,3 | 0,91 |
| As mesmas em retrógrado | 933 | 10,1 | 0,84 |
| As mesmas, baralhadas | 989 | 7,6 | 0,23 |
| Ruído branco | 988 | 5,3 | 0,09 |
| Saídas do AG clássico | 1565 | −0,05 | 0,00 |
| Saídas do AG com a aptidão nova | 530 | 20,2 | 0,76 |

- **As regras originais não distinguem música de ruído**: dão à música real mais pontos do que ao
  ruído branco em 50 % dos pares (moeda ao ar), e às suas próprias saídas mais do que a qualquer
  melodia real. Uma regressão logística que tente separar real de nulo com as 15 regras chega só a
  AUC 0,67.
- **As regras novas distinguem** (real > ruído branco em 96 % dos pares, > a mesma melodia baralhada
  em 82 %; AUC 0,96). As que mais separam são a **proximidade** (d = 4,0) e as **forças melódicas**
  (d = 4,0), seguidas da regressão após salto e da hierarquia métrica. A regra das **ondas
  atratoras** quase não separa (d = 0,12): com uma onda fixa (o arco pré-definido), a música real não
  lhe está mais próxima do que o ruído. As ondas descrevem uma peça depois de ajustadas a ela (ver o
  estudo acima), não são um critério universal de qualidade.
- **Do fim para o início**: a melodia real só vence o seu retrógrado em 52 % dos pares. Quase todas
  as regras são simétricas no tempo; a mais direcional é a **hierarquia métrica** (o original vence em
  69 %, o retrógrado em 28 %), e no C# o *leitmotiv* rítmico (81 %/16 %). As cadências, que deviam
  marcar a direção, empatam (48 %/50 %) porque o retrógrado também começa e acaba na tónica em muitas
  canções. O crítico, treinado com dados, dá 0,91 ao original e 0,84 ao retrógrado: há direção do
  tempo na música real que as regras não capturam.
- **O AG exagera as regras**: com a aptidão nova as saídas têm o dobro da pontuação da música real
  (20,2 contra 10,3), com regressão e forças no máximo (1,00) onde a música real fica em −0,19 e 0,19.
  As regras descrevem tendências; maximizá-las produz uma caricatura. Uma melhoria natural seria
  pontuar a distância ao valor típico da música real em vez do máximo.
- **Pesos aprendidos**: os pesos da regressão (normalizados para a mesma soma) estão disponíveis como
  predefinição «Aprendidos da música real» no painel de pesos: mais forças melódicas, hierarquia
  métrica e tensão; quase nada às bacias e à regressão. Ritmo, forma e tonalidade ficam com os
  pesos por omissão, porque os modelos nulos conservam o ritmo e a tonalidade da melodia real e por
  isso a regressão não os pode avaliar.
- A Sonata III de Telemann, passada pela aptidão nova como cânone a 2 violinos, tem 0,64 no
  contraponto, mas −0,99 na regressão após salto e −0,34 na variedade: os arpejos do barroco
  instrumental saltam sem regressar, algo que as regras aprendidas com canções penalizam.

### Limitações

- Não consigo ouvir. A minha avaliação qualitativa foi feita a ler as saídas como partitura (texto e
  piano roll): as peças do campo de atratores têm frases de 2 compassos, cadências em Sol e
  sequências motívicas plausíveis, mas tendem a repetir a nota central da onda (Si4/Dó5 em Sol maior);
  as do modo clássico saltam pelo registo inteiro (G♯2–C7) em semicolcheias.
- O crítico mede proximidade às melodias do corpus (canções folk alemãs, música irlandesa, corais),
  não interesse estético; peças deliberadamente diferentes (como a melodia composta) são
  penalizadas.
- A transcrição do Telemann omite ornamentos e aproxima as tercinas; o corpus fica pelos primeiros 8
  compassos de cada melodia.
- O teste de ouvintes proposto no relatório original continua a ser a avaliação decisiva; o
  separador Explorar e a exportação MIDI facilitam preparar esse teste.

## O trabalho original à luz da literatura

Pesquisa feita em setembro de 2026 sobre o relatório que acompanha o programa
(`SmallStateOfTheArt_and_ProposedWork.pdf`), um trabalho de uma unidade curricular com tempo
limitado. Julga-se aqui a **teoria** proposta, separada da implementação.

**O que o relatório propõe.** (1) As melodias têm uma componente quase oscilatória da altura no
tempo, possivelmente várias ao mesmo tempo (§2.3); (2) cada oscilação é modelada por um seno cujo
máximo e mínimo ficam dentro do registo do instrumento e que **atrai** as notas dentro de uma
**bacia** de largura dada; (3) as ondas **não se somam**: cada uma atrai parte das notas, o que
permite «simular vozes diferentes» numa só linha (Fig. 2, com a Suite BWV 1007 de Bach); (4) isto
é a contribuição reivindicada: «uma regra de convergência baseada em oscilações periódicas» (§4.2);
(5) compor peças curtas e montá-las em formas A B A / rondó com variações (§2.5); (6) polifonia por
auto-harmonização, uma melodia contra si própria desfasada (§4.1); (7) calibrar os pesos pontuando
aberturas reais (§5.1); (8) avaliar com ouvintes, com e sem ondas.

**Em 2020, era original?**

- *A oscilação do contorno não era nova como observação.* Schmuckler (1999, 2010) modela o contorno
  melódico pela sua análise de Fourier e mostra que a semelhança percebida entre melodias se prevê
  pela sobreposição das componentes cíclicas; Müllensiefen & Frieler (2004–2007) usam isso em medidas
  de semelhança. O relatório chega à mesma intuição (e cita Csaba 2019) sem conhecer esta linha.
- *Guiar a geração por uma curva também não era novo.* Os «arborescences» e o UPIC de Xenakis
  (anos 70) geram linhas melódicas a partir de contornos desenhados; o Hyperscore de Farbood (2004)
  gera música a partir de linhas de tensão desenhadas; o MorpheuS (Herremans & Chew 2016/2017) otimiza
  para um perfil de tensão alvo; várias funções de aptidão de AG já incluíam o contorno (Towsey et al.
  2001). «Atratores» em música existiam em dois outros sentidos: sistemas caóticos como geradores
  (Pressing 1988, Bidlack 1992, Dabby 1996) e alturas estáveis que atraem as instáveis (Lerdahl 2001,
  Larson 2012).
- *A própria revisão do relatório tinha a pista empírica.* Savage et al. (2015), a referência [3] do
  relatório, encontram como universais estatísticos da música contornos **descendentes ou em arco**
  feitos de **intervalos pequenos** (menos de 750 cents). É exatamente o que justifica trocar os senos
  por arcos de frase e o que a análise inversa desta versão confirma: a proximidade entre notas é a
  regra que mais separa música real de ruído. Na Fig. 2 as duas ondas desenhadas sobre o Prelúdio da
  BWV 1007 seguem a voz grave e a aguda do arpejo: uma melodia composta, a ideia mais própria do
  relatório (ponto seguinte).
- *O que parece próprio* é a combinação: **várias curvas-alvo móveis, não somadas, cada uma com uma
  bacia local, a competir pelas notas dentro da aptidão de um AG**, como forma de obter o contorno e
  vozes implícitas (melodia composta) de uma só linha. Não encontrei implementações anteriores desta
  formulação; a melodia composta é conhecida na teoria (Davis 2006; a segregação em fluxos de
  Bregman), mas não como gerador com atratores. É uma contribuição modesta e plausível — com a
  ressalva de que a ausência de resultados numa pesquisa não prova a ausência de trabalho anterior.
- *A avaliação com ouvintes* ficou aquém do que permite concluir: 9 de 21 respostas (42,9 %)
  identificaram a peça do AG entre três opções; ao acaso seriam 33 % (teste binomial p = 0,24;
  intervalo de 95 % 24–63 %). O resultado é compatível com o acaso nos dois sentidos, e testes do
  tipo «Turing» são criticados como avaliação de sistemas generativos (Ariza 2009).

**As ideias eram aplicáveis?** O que as medições desta versão mostram:

- A premissa confirma-se, com uma nuance: uma onda lenta é significativa em 73 % das melodias reais
  contra 7 % das mesmas baralhadas, mas também em 84 % dos passeios aleatórios. A oscilação é real e
  decorre do movimento por grau e da regressão para a média; **não é um critério de qualidade**
  (sem bacias o crítico fica igual; na análise inversa a regra das ondas mal separa música real de
  ruído, d = 0,12).
- Como **controlo interpretável** funciona: as ondas definem registo e forma do contorno, e num
  cânone uma onda com período = n.º de vozes × entrada afasta as vozes e reduz uníssonos. A melodia
  composta com duas bacias gera de facto dois registos, mas o crítico penaliza-a (0,75 contra
  0,90–0,93 com uma onda), porque os saltos entre registos são raros nas canções do corpus.
- A **implementação escondeu o valor da ideia**: a aptidão com corridas entre threads, os operadores
  ao nível do bit e o refúgio nas pausas davam saídas estatisticamente iguais a ruído; com as mesmas
  regras e operadores musicais o crítico passa de 0,00 para 0,93.
- A calibração com música real (§5.1) era a intuição certa; feita em escala (análise inversa) mostra
  que as 15 regras originais não distinguem música real de ruído, e dá pesos aprendidos.
- A montagem em formas com variações (§2.5) é sólida e corresponde à prática (Caplin 1998); aqui foi
  feita com variações caóticas de Dabby.

**Depois de 2020: foi reutilizado? Banalizou-se?**

- *Reutilização direta*: não encontrei nenhuma. O repositório tem 4 estrelas e 0 *forks*; a pesquisa
  na web só devolve o próprio repositório e este PR; o relatório não parece ter sido publicado nem
  citado.
- *A ideia geral banalizou-se, por outro caminho.* Desde 2020, **controlar a geração com curvas ao
  longo do tempo** tornou-se prática corrente na geração por redes neuronais: tensão tonal como
  controlo num VAE (Guo et al. 2020); altura média e densidade de notas por compasso como descrição
  no FIGARO (von Rütte et al., ICLR 2023) — na prática, a «onda de valor médio» por compasso; curvas
  desenhadas a controlar o preenchimento de melodias (*Draw and Listen!*, TISMIR 2022); contornos
  desenhados convertidos em coeficientes DCT — ou seja, nas componentes de baixa frequência do
  contorno — no MIDI-Draw (2023); controlos variáveis no tempo de melodia, dinâmica e ritmo no Music
  ControlNet (2023/2024); tokens de contorno num Transformer em *From Shape to Music* (TENOR 2025).
  Nenhum destes deriva deste trabalho; são desenvolvimentos independentes que chegaram à mesma
  conclusão: uma curva de forma é um controlo útil e compreensível para quem compõe.
- *Os AG com regras* ficaram um nicho face à aprendizagem profunda, mas continuam em uso onde contam
  a interpretabilidade e o controlo (sistemas interativos, ensino).

**Em resumo.** A teoria do PDF juntava ideias com bons antecedentes (periodicidade do contorno,
curvas-alvo, cânone) numa formulação própria — atratores móveis com bacias, não somados — que ainda
hoje é uma forma legível de dar forma a uma melodia e de separar vozes num cânone. Não é um critério
do que torna a música interessante, e o relatório não o conseguia demonstrar com as ferramentas que
tinha; o campo acabou por adotar a versão geral da ideia (curvas como controlo) sem passar por este
trabalho.

Fontes: Schmuckler 1999
([Music Perception 16(3)](https://www.researchgate.net/publication/244443968_Testing_Models_of_Melodic_Contour_Similarity)),
2010 ([Music Perception 28(2)](https://mp.ucpress.edu/content/28/2/169));
[Xenakis, arborescences](https://www.iannis-xenakis.org/en/arborescence/) e [UPIC](https://en.wikipedia.org/wiki/UPIC);
Farbood 2004, [Hyperscore](https://dl.acm.org/doi/10.1109/MCG.2004.1255809);
Herremans & Chew, [MorpheuS](https://arxiv.org/pdf/1812.04832);
Horner & Goldberg 1991, [Genetic algorithms and computer-assisted music composition](https://quod.lib.umich.edu/i/icmc/bbp2372.1991.117?rgn=main&view=fulltext);
Csaba 2019, [IEEE SYNASC](https://ieeexplore.ieee.org/document/9049871/);
Savage et al. 2015, [Statistical universals](https://www.pnas.org/doi/10.1073/pnas.1414495112);
Ariza 2009, [The Interrogator as Critic](https://direct.mit.edu/comj/article-abstract/33/2/48/94244/The-Interrogator-as-Critic-The-Turing-Test-and-the);
Guo et al. 2020, [tension VAE](https://arxiv.org/abs/2010.06230);
[FIGARO](https://arxiv.org/abs/2201.10936);
[Draw and Listen!](https://transactions.ismir.net/articles/10.5334/tismir.128);
[MIDI-Draw](https://arxiv.org/pdf/2305.11605);
[Music ControlNet](https://arxiv.org/abs/2311.07069);
[From Shape to Music](https://www.tenor-conference.org/proceedings/2025/31_TENOR2025_Qiaoxi_Zhang.pdf);
[repositório no GitHub](https://github.com/tinocolight/MusicGeneratiorWithIAGenetic).

## Estrutura e comandos

```
web/
  index.html, styles.css         página (módulos ES, sem compilação)
  dist/ondas-atratoras.html      a mesma página num único ficheiro
  src/core/                      representação, teoria (perfis K-K, espaço de Lerdahl), ondas, instrumentos, RNG
  src/fitness/classic.js         regras do C# original
  src/fitness/attractor.js       campo de atratores
  src/fitness/canon.js           contraponto entre as vozes (pares, tríades, registo, intervalos diatónicos)
  src/ga/                        AG, operadores, MAP-Elites
  src/variation/dabby.js         variações caóticas
  src/analysis/wavefit.js        analisador de ondas
  src/eval/                      características, modelo de expectativa, crítico, modelos nulos
  src/io/midi.js                 escrita/leitura de MIDI
  src/io/notation.js             notação: ortografia, compassos, figuras e ligaduras, claves, escrita LilyPond
  src/ui/score.js                partitura na página (VexFlow + Gonville)
  src/ga/blocks.js               blocos do corpus: modelo, escrita por blocos, mutação, regra «idioma»
  data/corpus-large.json         6758 melodias reais para os blocos (sem as 480 do crítico)
  vendor/                        VexFlow 4.2.5 com a fonte Gonville (MIT, LICENSE-vexflow.txt)
  src/data/                      corpus, crítico treinado, 3 cânones de Telemann e rondas, pesos aprendidos, exemplo
  src/ui/                        interface (config.js: configuração e auto-configuração; controls.js: painel Compor)
  tools/                         extração do corpus, treino do crítico, benchmark, análise inversa, build, harness C#
  test/                          testes (node --test)
  results/                       resultados do benchmark e da análise inversa
```

```bash
cd web
npm test                              # 50 testes
node tools/benchmark.mjs 6            # benchmark → results/benchmark.md
node tools/reverse.mjs                # análise inversa → results/reverse.md, src/data/learned-weights.js
node tools/convergence.mjs 4 2000     # convergência a partir de uma população musical ou aleatória
node tools/train_critic.mjs           # treina o crítico → data/critic.json, src/data/critic-data.js
python3 tools/extract_corpus.py       # corpus a partir do music21 (pip install music21)
python3 tools/extract_corpus.py --full  # melodias completas, para a análise inversa
python3 tools/extract_large_corpus.py # 6758 melodias para os blocos (music21, ~5 min)
node tools/build_blocks.mjs           # blocos e associações → src/data/blocks-data.js, results/blocks.md
node tools/openings.mjs 8             # inícios e qualidade por variante → results/openings.md
node tools/solo_defaults.mjs 24       # omissão da melodia só, 24 sementes → results/solo-defaults.md
node tools/make_examples.mjs          # exemplo mostrado ao abrir a página
node tools/build_single.mjs           # dist/ondas-atratoras.html (usa esbuild via npx)

# paridade com o C# original (precisa do .NET 8 SDK)
cd tools/parity-csharp
dotnet run -c Release -- ../../test/fixtures/parity-genomes.json ../../test/fixtures/parity-csharp-output.json 20
dotnet run -c Release -- run 40 4 ../../test/fixtures/original-ga-runs.json   # AG original, 4 × 40 s
```

## Referências

- Agrawal, R. & Srikant, R. (1994). Fast algorithms for mining association rules. *VLDB*.
- Ariza, C. (2009). [The interrogator as critic: the Turing test and the evaluation of generative music systems](https://direct.mit.edu/comj/article-abstract/33/2/48/94244/The-Interrogator-as-Critic-The-Turing-Test-and-the). *Computer Music Journal* 33(2), 48–70.
- Biles, J. A. (1994). GenJam: A genetic algorithm for generating jazz solos. *ICMC*.
- Bidlack, R. (1992). Chaotic systems as simple (but complex) compositional algorithms. *Computer Music Journal* 16(3), 33–47.
- Brin, S., Motwani, R., Ullman, J. & Tsur, S. (1997). Dynamic itemset counting and implication rules for market basket data. *SIGMOD*.
- Bregman, A. S. (1990). *Auditory Scene Analysis*. MIT Press.
- Cambouropoulos, E. (2001). The Local Boundary Detection Model (LBDM) and its application in the study of expressive timing. *ICMC*.
- Caplin, W. (1998). *Classical Form*. Oxford University Press.
- Conklin, D. & Witten, I. (1995). Multiple viewpoint systems for music prediction. *Journal of New Music Research* 24(1), 51–73.
- Dabby, D. S. (1996). [Musical variations from a chaotic mapping](https://pubs.aip.org/aip/cha/article/6/2/95/135460/Musical-variations-from-a-chaotic-mapping). *Chaos* 6(2), 95–107.
- Davis, S. (2006). Implied polyphony in the solo string works of J. S. Bach. *Music Perception* 23(5).
- Farbood, M. M. (2012). [A parametric, temporal model of musical tension](https://online.ucpress.edu/mp/article-abstract/29/4/387/46442/A-Parametric-Temporal-Model-of-Musical-Tension). *Music Perception* 29(4), 387–428.
- Fux, J. J. (1725). *Gradus ad Parnassum*.
- Herremans, D. & Chew, E. (2017). [MorpheuS: generating structured music with constrained patterns and tension](https://arxiv.org/pdf/1812.04832). *IEEE Trans. Affective Computing*.
- Huron, D. (1996). [The melodic arch in Western folksongs](https://www.semanticscholar.org/paper/The-Melodic-Arch-in-Western-Folksongs-Huron/67a9b120e9a9d85ea1423544246229b4b449606f). *Computing in Musicology* 10, 3–23.
- Huron, D. (2001). [Tone and voice: A derivation of the rules of voice-leading from perceptual principles](http://mp.ucpress.edu/content/19/1/1). *Music Perception* 19(1), 1–64.
- Krumhansl, C. & Kessler, E. (1982). Tracing the dynamic changes in perceived tonal organization. *Psychological Review* 89.
- Larson, S. (2012). [*Musical Forces: Motion, Metaphor, and Meaning in Music*](https://iupress.org/9780253356826/musical-forces/). Indiana University Press.
- Lerdahl, F. (2001). *Tonal Pitch Space*. Oxford University Press. Lerdahl, F. & Jackendoff, R. (1983). *A Generative Theory of Tonal Music*.
- Manaris, B. et al. (2005). [Zipf's law, music classification, and aesthetics](https://direct.mit.edu/comj/article-abstract/29/1/55/93945/Zipf-s-Law-Music-Classification-and-Aesthetics). *Computer Music Journal* 29(1), 55–69.
- Matić, D. (2010). A genetic algorithm for composing music. *Yugoslav Journal of Operations Research* 20, 157–177.
- Mouret, J.-B. & Clune, J. (2015). [Illuminating search spaces by mapping elites](https://arxiv.org/pdf/1504.04909). arXiv:1504.04909.
- Pearce, M. & Wiggins, G. (2012). [Auditory expectation: the information dynamics of music perception and cognition](https://onlinelibrary.wiley.com/doi/10.1111/j.1756-8765.2012.01214.x). *Topics in Cognitive Science* 4.
- Pressing, J. (1988). Nonlinear maps as generators of musical design. *Computer Music Journal* 12(2), 35–46.
- Prince, J. & Schmuckler, M. (2014). The tonal-metric hierarchy. *Music Perception* 31(3).
- Savage, P. E., Brown, S., Sakai, E. & Currie, T. E. (2015). [Statistical universals reveal the structures and functions of human music](https://www.pnas.org/doi/10.1073/pnas.1414495112). *PNAS* 112(29), 8987–8992.
- Schmidhuber, J. (2009). [Driven by compression progress](https://arxiv.org/abs/0812.4360). *Anticipatory Behavior in Adaptive Learning Systems*.
- Telemann, G. P. (1738). *XIIX Canons mélodieux ou VI Sonates en duo* (TWV 40:118–123). [IMSLP](https://imslp.org/wiki/6_Canonic_Sonatas,_TWV_40:118-123_(Telemann,_Georg_Philipp)).
- Schmuckler, M. A. (1999). [Testing models of melodic contour similarity](https://www.researchgate.net/publication/244443968_Testing_Models_of_Melodic_Contour_Similarity). *Music Perception* 16(3), 295–326. Schmuckler, M. A. (2010). [Melodic contour similarity using folk melodies](https://mp.ucpress.edu/content/28/2/169). *Music Perception* 28(2), 169–194.
- Temperley, D. (2008). [A probabilistic model of melody perception](https://onlinelibrary.wiley.com/doi/10.1080/03640210701864089). *Cognitive Science* 32(2).
- Towsey, M., Brown, A., Wright, S. & Diederich, J. (2001). [Towards melodic extension using genetic algorithms](https://eprints.qut.edu.au/169/). *Educational Technology & Society* 4(2), 54–65.
- von Hippel, P. & Huron, D. (2000). [Why do skips precede reversals? The effect of tessitura on melodic structure](https://www.researchgate.net/publication/224982434_Why_Do_Skips_Precede_Reversals_The_Effect_of_Tessitura_on_Melodic_Structure). *Music Perception* 18(1), 59–85.
- Voss, R. & Clarke, J. (1975). [“1/f noise” in music and speech](https://www.nature.com/articles/258317a0). *Nature* 258, 317–318.
- Yang, L.-C. & Lerch, A. (2020). [On the evaluation of generative models in music](https://link.springer.com/article/10.1007/s00521-018-3849-7). *Neural Computing and Applications* 32.
