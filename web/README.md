# Ondas Atratoras — versão web

Versão web do *GeneticMusic* (Rui Luz e Rafael Silva, IPCA 2020): um algoritmo genético (AG) compõe
melodias e a aptidão inclui **ondas atratoras**, curvas que puxam as notas para uma bacia à sua volta.
Esta versão corre inteiramente no navegador, mantém o modelo original (para comparação) e acrescenta
extensões da literatura, um modo de **cânone** à maneira de Telemann, um **analisador de ondas** e uma
**avaliação objetiva** independente das regras de geração.

- [Como abrir](#como-abrir)
- [Guia de utilização](#guia-de-utilização)
- [O que se encontrou no código original](#o-que-se-encontrou-no-código-original)
- [Da literatura para o código](#da-literatura-para-o-código)
- [Avaliação e resultados](#avaliação-e-resultados)
- [Estrutura e comandos](#estrutura-e-comandos)
- [Referências](#referências)

## Como abrir

| Opção | Como |
|---|---|
| Ficheiro único | Abrir `web/dist/ondas-atratoras.html` no navegador (funciona a partir do disco). |
| Servidor local | `cd web && python3 -m http.server 8080` e abrir <http://localhost:8080>. Usa os módulos em `src/` diretamente. |
| GitHub Pages | Publicar a pasta `web/` (Settings → Pages). Não há passo de compilação. |

Não há dependências em tempo de execução. Node ≥ 18 só é preciso para os testes e ferramentas.

## Guia de utilização

A faixa de cima (a **partitura**) é partilhada por todos os separadores: mostra as notas, as ondas
atratoras com as bacias sombreadas (a opacidade segue a influência da onda a cada distância) e,
se ativado, o 2.º violino do cânone. Por baixo:

- **▶ Tocar**: sintetizador no navegador (violino, flauta ou cravo), tempo ajustável.
- **2.º violino em cânone** + **atraso**: toca a mesma melodia uma segunda vez, x compassos depois,
  como dois violinistas a ler a mesma parte.
- **Descarregar MIDI**: um ficheiro com uma pista por voz (duas no cânone). Dentro do visualizador
  do claude.ai o MIDI vem dentro de um `.zip` (é a única forma de o visualizador aceitar o ficheiro).
- As fichas no topo resumem a peça: aptidão, **crítico** (probabilidade de ser uma melodia real),
  características **típicas** (de 26), percentagem de **pausas** e consonância nos tempos fortes
  quando tocada em **cânone**.

### Compor

1. Escolher o **modo**:
   - **Campo de atratores**: o modelo novo (recomendado).
   - **Cânone à Telemann**: o mesmo, com a regra de contraponto da melodia contra si própria.
     Definir a entrada da 2.ª voz (1–4 compassos), o intervalo (uníssono ou oitava abaixo) e se é
     uma ronda circular.
   - **Clássico**: as 15 regras do C# original com os pesos do formulário original e os operadores
     de bits do GeneticSharp (1500 gerações, população 60, mutação 0,1).
2. **Tonalidade**, modo maior/menor e número de compassos.
3. **Ondas e bacias** (modos novos): tipo de onda (2 senos do original, arco de frase, 1/f, Rössler,
   Lorenz, melodia composta, cânone ou «Do analisador»), forma da bacia (gaussiana, gravitacional
   ou degraus como no C#), largura σ, amplitude, forma musical (A A′ B A′, A B A′ C, …) e duração
   da frase.
4. **Algoritmo**: gerações, população, mutação, operadores e **semente** (a mesma semente dá sempre
   a mesma peça). «Outra» escolhe uma semente nova e gera.
5. **Pesos das regras** (expandir): o peso de cada regra; no modo clássico há os dois grupos do
   original (primeiros 25 % das gerações e resto).
6. **Gerar**. O gráfico mostra a melhor aptidão, a média e a diversidade da população; as barras
   mostram a contribuição de cada regra no melhor indivíduo.

### Explorar (MAP-Elites)

Em vez de uma só melodia, ilumina um mapa de 8 × 8 células com a melhor melodia para cada
combinação de duas características (por omissão: notas por tempo × intervalo médio). Carregar em
**Iluminar mapa**, depois clicar numa célula para a ouvir e carregá-la na partitura. Usa os
parâmetros do separador Compor.

### Variações (Dabby)

Gera variações do tema atual por mapeamento caótico: a **divergência** controla quando a variação
se afasta do tema (valores baixos: só no fim; altos: logo no início). «Só alturas» mantém o ritmo.
**Montar forma A A′ B A″** junta o tema, duas variações e uma secção contrastante numa peça 4 vezes
mais longa (a estratégia de composição completa da secção 2.5 do relatório original).

### Analisar

1. Escolher a peça: a peça atual, o Vivace do TWV 40:118 de Telemann, duas rondas, qualquer uma
   das 480 melodias do corpus ou um **ficheiro MIDI** próprio (a polifonia é reduzida à nota mais
   aguda).
2. Escolher o número de **partes** (1–8) e a segmentação: partes iguais ou fronteiras de frase
   (LBDM).
3. **Ondas por parte**: automático (BIC) ou 1–3.
4. **Analisar**. Para cada parte aparece a **onda de frequência mais baixa** e as **de frequência mais
   alta**, cada uma com frequência (ciclos por compasso e período), **valor médio** (nota e Hz),
   amplitude, largura da bacia (σ) e percentagem de notas que atrai; a nota mais grave e mais aguda
   e a média das graves e das agudas (em Hz); e o espectro do contorno com as oscilações
   significativas (teste de permutação). As ondas ajustadas aparecem na partitura.
5. **Usar ondas da 1.ª parte no gerador** copia as ondas encontradas para o preset «Do analisador»
   do separador Compor (por exemplo, compor com as ondas extraídas do Telemann).

### Avaliar

Crítico, características típicas, surpresa melódica e complexidade; a tabela do cânone (a mesma
melodia contra si própria a 1, 2 e 3 compassos: consonância nos tempos fortes, quintas e oitavas
paralelas, uníssonos, movimento contrário) comparada com o Telemann; e as 26 características da
peça com o intervalo P10–P90 das melodias reais.

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

O Vivace do TWV 40:118 foi transcrito (`src/data/references.js`, a partir da edição de Johan
Tufvesson; ornamentos omitidos, tercinas aproximadas) e serve de validação: a pontuação de cânone
tem o máximo exatamente no atraso verdadeiro de 1 compasso (0,61 contra 0,30 para o segundo melhor
atraso), com 83 % de consonâncias nos tempos fortes e 1 paralela em 33 compassos. A regra original
de auto-harmonização também põe o atraso certo em primeiro, mas por uma margem mínima (−0,08 contra
−0,10) e dá nota negativa ao cânone real.

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
| Campo: 2 senos do original | 0,90 | 16,5 | 1,49 | 0,55 | 3,17 | 99 % | 0,17 |
| Campo: arco de frase | 0,87 | 18,8 | 1,51 | 0,51 | 3,32 | 99 % | 0,24 |
| Campo: arco, **sem bacias** (ablação) | 0,91 | 18,0 | 1,47 | 0,56 | 3,31 | 94 % | 0,19 |
| Campo: 1/f | 0,90 | 18,3 | 1,50 | 0,58 | 3,26 | 94 % | 0,17 |
| Campo: Rössler | 0,79 | 19,5 | 1,30 | 0,56 | 3,35 | 94 % | 0,17 |
| Campo: Lorenz | 0,89 | 19,2 | 1,35 | 0,59 | 3,15 | 86 % | 0,19 |
| Campo: melodia composta | 0,53 | 16,7 | 1,16 | 0,52 | 3,71 | 69 % | 0,07 |
| **Cânone** (2.ª voz a 1 compasso) | 0,78 | 16,5 | 1,31 | 0,43 | 3,67 | **100 %** | **0,00** |
| MAP-Elites (51 células, 80 % do mapa) | 0,49 (13 células ≥ 0,7) | — | 1,63 | — | — | — | — |

Leitura:

- **As regras originais produzem ruído, estatisticamente.** A surpresa melódica das saídas (6,15
  bits por nota) é a do ruído branco (6,26), o movimento por grau conjunto é o do ruído (0,14), há
  2–3 vezes mais notas do que numa melodia real e o crítico dá 0,00. O programa C# original, corrido
  de verdade, dá o mesmo. Tocadas em cânone a 1 compasso, as saídas têm 57 % de consonâncias nos
  tempos fortes, exatamente o valor do ruído aleatório: as regras de auto-harmonização não
  garantiam que dois violinistas pudessem ler a mesma parte.
- **Os operadores pesam muito.** Com as mesmas regras, só trocar os operadores de bits por operadores
  musicais leva o crítico de 0,00 a 0,93 e a surpresa de 6,15 para 3,78 bits.
- **Os modos de campo aproximam-se das melodias reais** em quase todas as medidas (16,5–19,5 de 26
  características típicas; grau conjunto 0,51–0,59; surpresa 3,15–3,35 bits, ~3,7 na melodia
  composta e no cânone), mas continuam com mais notas por tempo (1,3–1,5 contra 1,06).
- **As ondas atratoras não melhoram a «qualidade» por si só.** Na ablação (sem bacias) o crítico e as
  características típicas ficam iguais. As ondas são um controlo de forma — onde a melodia sobe,
  desce e em que registo está — e é isso que permite, por exemplo, afastar as duas vozes de um
  cânone (onda com período = 2 × atraso) ou escrever uma melodia composta. A melodia composta paga
  isso com um crítico mais baixo (0,53), porque os saltos entre registos são raros no corpus.
- **Cânone.** O modo cânone chega a 100 % de consonância nos tempos fortes, sem quintas nem oitavas
  paralelas, contra 83 % e 1 paralela em 33 compassos no Telemann. Isto não significa «melhor do que
  Telemann»: as melodias geradas são mais simples (muitas notas da tríade), e o crítico desce para
  0,78.
- **MAP-Elites** cobre 80 % do mapa; 13 das 51 células têm crítico ≥ 0,7. O mapa troca tipicidade por
  diversidade, e é precisamente para ouvir variações diferentes.

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

## Estrutura e comandos

```
web/
  index.html, styles.css         página (módulos ES, sem compilação)
  dist/ondas-atratoras.html      a mesma página num único ficheiro
  src/core/                      representação, teoria (perfis K-K, espaço de Lerdahl), ondas, RNG
  src/fitness/classic.js         regras do C# original
  src/fitness/attractor.js       campo de atratores
  src/fitness/canon.js           contraponto em cânone
  src/ga/                        AG, operadores, MAP-Elites
  src/variation/dabby.js         variações caóticas
  src/analysis/wavefit.js        analisador de ondas
  src/eval/                      características, modelo de expectativa, crítico, modelos nulos
  src/io/midi.js                 escrita/leitura de MIDI
  src/data/                      corpus, crítico treinado, Telemann e rondas, exemplo inicial
  src/ui/                        interface
  tools/                         extração do corpus, treino do crítico, benchmark, build, harness C#
  test/                          testes (node --test)
  results/                       resultados do benchmark
```

```bash
cd web
npm test                              # 26 testes
node tools/benchmark.mjs 6            # benchmark → results/benchmark.md
node tools/train_critic.mjs           # treina o crítico → data/critic.json, src/data/critic-data.js
python3 tools/extract_corpus.py       # corpus a partir do music21 (pip install music21)
node tools/make_examples.mjs          # exemplo mostrado ao abrir a página
node tools/build_single.mjs           # dist/ondas-atratoras.html (usa esbuild via npx)

# paridade com o C# original (precisa do .NET 8 SDK)
cd tools/parity-csharp
dotnet run -c Release -- ../../test/fixtures/parity-genomes.json ../../test/fixtures/parity-csharp-output.json 20
dotnet run -c Release -- run 40 4 ../../test/fixtures/original-ga-runs.json   # AG original, 4 × 40 s
```

## Referências

- Biles, J. A. (1994). GenJam: A genetic algorithm for generating jazz solos. *ICMC*.
- Bidlack, R. (1992). Chaotic systems as simple (but complex) compositional algorithms. *Computer Music Journal* 16(3), 33–47.
- Cambouropoulos, E. (2001). The Local Boundary Detection Model (LBDM) and its application in the study of expressive timing. *ICMC*.
- Caplin, W. (1998). *Classical Form*. Oxford University Press.
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
- Schmidhuber, J. (2009). [Driven by compression progress](https://arxiv.org/abs/0812.4360). *Anticipatory Behavior in Adaptive Learning Systems*.
- Telemann, G. P. (1738). *XIIX Canons mélodieux ou VI Sonates en duo* (TWV 40:118–123). [IMSLP](https://imslp.org/wiki/6_Canonic_Sonatas,_TWV_40:118-123_(Telemann,_Georg_Philipp)).
- Temperley, D. (2008). [A probabilistic model of melody perception](https://onlinelibrary.wiley.com/doi/10.1080/03640210701864089). *Cognitive Science* 32(2).
- Towsey, M., Brown, A., Wright, S. & Diederich, J. (2001). [Towards melodic extension using genetic algorithms](https://eprints.qut.edu.au/169/). *Educational Technology & Society* 4(2), 54–65.
- von Hippel, P. & Huron, D. (2000). [Why do skips precede reversals? The effect of tessitura on melodic structure](https://www.researchgate.net/publication/224982434_Why_Do_Skips_Precede_Reversals_The_Effect_of_Tessitura_on_Melodic_Structure). *Music Perception* 18(1), 59–85.
- Voss, R. & Clarke, J. (1975). [“1/f noise” in music and speech](https://www.nature.com/articles/258317a0). *Nature* 258, 317–318.
- Yang, L.-C. & Lerch, A. (2020). [On the evaluation of generative models in music](https://link.springer.com/article/10.1007/s00521-018-3849-7). *Neural Computing and Applications* 32.
