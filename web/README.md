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
- [Heurísticas de composição e estilos](#heurísticas-de-composição-e-estilos)
- [Fado](#fado)
- [Dinâmica e rubato em todos os estilos](#dinâmica-e-rubato-em-todos-os-estilos)
- [Línguas (português e inglês)](#línguas-português-e-inglês)
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
- **Pautas**: *uma por voz* (a partitura completa, como acima) ou *uma linha, com as entradas*: o
  cânone escrito uma só vez, como se imprimem as rondas. Um número em caixa marca o sítio onde
  cada voz entra: quando a 1.ª voz chega ao número 2, a 2.ª voz começa do início. Cada número tem
  o nome do instrumento, e uma legenda por baixo do título diz, para cada voz, o instrumento, onde
  entra e o intervalo (por exemplo, «Violoncelo — entra quando a 1.ª voz está no c. 5, 8.ª
  abaixo»). Nas rondas a linha leva sinais de repetição. A escolha vale para a partitura na página,
  para o PDF e para o LilyPond.
- **PDF**: a partitura em PDF A4, vetorial, com a escolha de pautas acima. É desenhada pelo mesmo
  código que a partitura da página (`src/io/pdf.js`: um pequeno escritor de PDF e um contexto de
  desenho para o VexFlow). As figuras e os símbolos saem como curvas; o texto usa as fontes-padrão
  do PDF (Times, Helvetica), por isso nada é embebido. Tem as páginas que forem precisas, com
  ligaduras divididas entre páginas e números de página. O tamanho da pauta ajusta-se para que a
  música encha páginas inteiras. Se, no tamanho habitual (pauta de 24 pt), a última página
  levasse só um quarto de página, a pauta encolhe (até 18 pt) e tudo cabe numa página a menos.
  Se levasse meia página, a pauta cresce (até 30 pt) até a música ocupar as páginas todas. Das
  duas, escolhe-se a que fica mais perto do tamanho habitual, e uma peça de uma só página com
  espaço de sobra fica como está. Depois, as linhas repartem-se por igual entre as páginas e
  espaçam-se até ao fundo de cada uma, como faz o LilyPond. A mensagem junto ao botão diz quando
  a pauta foi reduzida ou ampliada. O PDF leva sempre o **MIDI anexado** (ver abaixo).
- **QR no PDF**: desenha no fim da partitura um QR code denso com a música (ver abaixo).
- **Copiar ligação**: copia uma ligação com a música dentro do próprio endereço, a mesma do QR code.
- **Abrir PDF ou MIDI…**: recupera uma peça de um PDF ou de um MIDI feitos por esta página.
- **LilyPond (.ly)**: descarrega esse ficheiro, para gravar a partitura com o próprio LilyPond
  (`lilypond peca.ly` produz o PDF e um MIDI). A ortografia segue a tonalidade (sensível elevada
  no modo menor, bequadros antes de sustenidos ou bemóis), as figuras são divididas nos tempos e nas
  barras com ligaduras, e as vozes que entram mais tarde começam com pausas de compasso.
- **▶ Tocar**: sintetizador no navegador com um timbre por família de instrumento (cordas
  friccionadas, flautas, palheta simples e dupla, metais, cravo, piano, órgão, vozes), tempo
  ajustável; cada voz tem a sua posição no panorama.
- **Tocar com todas as vozes**: desligado, ouve-se só a melodia.
- **Descarregar MIDI**: uma pista por voz, cada uma com o programa General MIDI do seu instrumento
  e já transposta. Leva também os dados da peça num evento de texto, que os leitores de MIDI
  ignoram, por isso a página volta a abri-la tal como era. Dentro do visualizador do claude.ai o MIDI vem dentro de um `.zip` (é a única
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

1. **Configuração rápida** (opcional): **Início rápido** abre uma janela com seis perguntas, uma de
   cada vez, com o número da pergunta no cabeçalho e botões Anterior/Seguinte: (1) **cânone ou
   melodia simples** — o cânone vem primeiro, porque é o centro do projeto; (2) **estilo** (os 36
   estilos, ou nenhum); (3) **tipo de música**, isto é, o compasso (os do estilo) e o carácter
   (lento, moderado, vivo), que dá o andamento; (4) **duração média total**, de 15 s a 3 min: o
   número de compassos é calculado a partir dela, do compasso e do andamento (num cânone conta o
   tempo que as vozes que entram depois levam a acabar, numa ronda a melodia ouve-se duas vezes,
   e um cânone nunca fica curto demais para a última entrada), e o andamento é acertado até 20 %
   para chegar perto da duração pedida; (5) **ondas atratoras** — uma escolhida pelo programa, uma
   caótica, duas (melodia composta), três, ou as duas do programa original; (6) **tonalidade e
   modo** (o modo habitual do estilo por omissão), com o resumo do que vai ser aplicado e os botões
   **Só aplicar** e **Aplicar e gerar**. As respostas ficam lembradas no navegador
   (`src/ui/quickstart.js`). **Auto-configurar** escolhe, a partir das vozes, ondas que
   cabem no registo comum dos instrumentos (um arco de frase para uma melodia; um seno com
   período = n.º de vozes × entrada para um cânone), a forma (livre em cânone), o número de
   compassos (espaço para a última entrada), pesos e algoritmo. **Surpreende-me** sorteia
   tonalidade, conjunto, ondas e forma dentro de valores sensatos. **Repor** volta ao início.
2. **Peça**: modelo (campo de atratores ou clássico), tonalidade, maior/menor, **compasso** (2/4,
   3/4 e 4/4 simples; 3/8, 6/8, 9/8 e 12/8 compostos, em que cada tempo são três colcheias; o
   modelo clássico fica em 4/4, como o original), número de compassos (4 a 64), forma
   musical (A A′ B A′, A B A′ C, …) e duração da frase (mudar o compasso ajusta-a para cerca de oito
   tempos: 2 compassos de 4/4, 4 de 3/4 ou 6/8, 8 de 3/8). Cada geração custa
   proporcionalmente ao comprimento: com 64 compassos, uma corrida completa demora 1 a 2 minutos
   (a página avisa). A partitura e o PDF dividem-se em linhas e páginas; o piano roll numera os
   compassos de 2 em 2 ou de 4 em 4 quando ficam estreitos.
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

   No **modo clássico** há primeiro as **combinações de partida**: *Original (2020)* e três
   combinações calibradas em música real (*Canção popular*, *Dança*, *Coral*; ver «Estudo do
   algoritmo original»), cada uma afinada para os operadores musicais (soa melhor) ou para os
   operadores de bits do original (seletor «Afinada para»). Depois, os campos do formulário
   original para as duas ondas W1 e W2: períodos por compasso, valor médio em meios-tons (Lá4 = 0),
   amplitude e bacia de atração em meios-tons e desfasamento horizontal (16 = um ciclo, como em
   `NoteAtractionFunction`), com inteiros onde o C# usava `int.Parse`; as constantes que o original
   fixava no código (âmbito atrator ±15 à volta do Lá4 e 7–40 % de pausas e prolongamentos); a
   caixa **Corrigir os lapsos do original**; a opção de simular a 1.ª execução do original (onda 1
   plana no gene 0) e um botão para repor os valores do original.
5. **Pesos das regras** (expandir): o peso de cada regra, com predefinições (por omissão,
   **aprendidos da música real**, ênfase no contraponto, ênfase nas ondas), incluindo **Idioma do
   corpus (blocos)** (a 0 por omissão, ver abaixo); e **Não maximizar** (ligado por omissão): cada regra conta só até ao seu valor
   típico na música real. No modo clássico, os dois grupos do original, mais a regra nova
   **Fórmulas de final (corpus)** (0 nos valores originais).
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

8. **Mais lapsos, que o próprio código ou o relatório contradizem.** Encontrados ao estudar o
   algoritmo com música real (secção «Estudo do algoritmo original» abaixo):
   - `EvaluatePauseAndProlongation`: o ramo «prolongamento de prolongamento» (+0,5) é
     inalcançável, porque o teste anterior («prolongamento de uma nota», +2) também o apanha;
   - `ScoreBalance`: sem nenhuma pausa ou prolongamento divide por 0 e dá −∞ (o relatório descreve
     a regra só como penalização fora de [7, 40] %; a assimetria é intencional, o −∞ não);
   - `EvaluateInterestingRepetitions`: a condição `!= pausa || == prolongamento` deixa entrar os
     prolongamentos, que passam a contar como «repetições interessantes» de colcheias; os autores
     corrigiram exatamente esta condição em `EvaluateIntervals` («Alterado para && e != em
     2020-08-21»), mas não aqui;
   - `EvaluateInterestingRitmicPatterns`: o bónus «maior mérito se for no início do compasso»
     testa `i % 16 == 4`, mas a figura começa em `i − 3`: nunca calha no início do compasso;
   - `EvaluateIntervals`: compara semicolcheias vizinhas e marca com −100 os intervalos sem nota
     («evitar avaliar intervalos que não contêm notas»), mas −100 cai no ramo «mais de 12
     semitons: −1». Resultado: com notas mais longas do que uma semicolcheia a regra nunca julga a
     melodia, e cada nota depois de um prolongamento perde um ponto;
   - `ScoreMSelfHarmonizationPreviousMeasures`: compara com o código do prolongamento (74) ou da
     pausa (0) como se fosse uma altura (ver 5).
9. **Fórmulas de final que ficaram por fazer.** `ScoreTerminationQualifyers` só pede que a última
   nota seja longa; não olha para os graus, para o movimento nem para o tempo em que a melodia
   acaba.

O modo **Clássico** reproduz as regras exatamente (0 diferenças em 795 comparações com a versão
sequencial do C#), sem a corrida entre threads, com a onda 1 correta e com as duas gralhas
corrigidas (a opção `strict: true` mantém-nas, para o teste de paridade). Por omissão corrige
também os lapsos do ponto 8 (caixa «Corrigir os lapsos do original»; `fixLapses` em
`src/fitness/classic.js`) e junta uma regra nova, **Fórmulas de final (corpus)**, com peso 0 nos
valores originais: a probabilidade do final da peça segundo 6758 melodias reais
(`tools/build_cadences.mjs`, [`results/cadences.md`](results/cadences.md)) — graus das três últimas
notas, último movimento, tempo e duração da última nota e o seu registo em relação ao centro da
melodia. Nas melodias em maior, 73 % acabam na tónica; as fórmulas mais comuns são 3–2–1 (19 %),
2–2–1 (8 %) e a sensível 7–1; a última nota começa no 1.º tempo em 48 % e no 3.º em 35 %, dura uma
mínima ou uma semínima, e fica 2–5 meios-tons abaixo da nota mediana da melodia. As danças acabam
mais vezes a repetir a tónica (1–1–1, 22 %); os corais de Bach quase sempre em 3–2–1 (35 %).

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
crítico 0,90 ± 0,05 contra 0,86 ± 0,05 com os pesos aprendidos da música real; com 6 sementes a
diferença não é conclusiva. (Números com «não maximizar» ligado, como agora por omissão.)

### Ondas editáveis

Cada onda é descrita como um músico a definiria: tipo, **frequência** (ciclos por compasso),
**desfasamento** (em tempos), **valor médio e amplitude** (ou **mínimo e máximo**), e a **bacia**
(largura σ e forma). O arco de frase foi ajustado para que o clímax fique exatamente em média +
amplitude e o fim da frase em média − amplitude (o arco desce no fim, por isso o seu centro não é o
ponto médio da curva); o seno respeita o desfasamento como deslocamento no tempo. Há até 4 ondas
por peça; com mais do que uma, cada nota é atraída pela onda mais próxima (as bacias competem) e
a regra premeia usar todas.

### Compassos simples e compostos: figuras e ligações por compasso

Pedido: compor noutros compassos além de 4/4 — 3/4 e os compostos como 6/8 ou 3/8, em que cada
tempo são três colcheias —, refazer a análise das figuras e das ligações com as melodias separadas
por compasso, expô-la em tabelas que qualquer pessoa possa auditar e melhorar, e decidir se chega uma
relação simples («esta figura, com a última nota a subir, faz a seguinte provável») ou se vale a
pena estendê-la em árvore, dois passos ou mais.

- **Corpus**: `tools/extract_meter_corpus.py` junta 9644 melodias reais com o seu compasso (2/4
  2689, 3/4 1514, 4/4 2555 + 483 em 2/2, 3/8 342, 6/8 1911, 9/8 143, 12/8 7), com a contagem das
  que ficaram de fora e porquê (tercinas, mudanças de compasso).
- **Leitura por tempos** (`src/ga/figures.js`): um tempo tem 4 semicolcheias nos compassos simples e
  6 (três colcheias) nos compostos. Antes, 3/4 e 6/8 — o mesmo comprimento de compasso — eram lidos
  da mesma maneira.
- **Análise auditável** (`node tools/build_meters.mjs`, `python3 tools/export_xlsx.py`): um CSV por
  tabela em [`results/meters/`](results/meters/) e o livro de Excel
  [`analise-compassos.xlsx`](results/meters/analise-compassos.xlsx) — figuras por compasso e por
  tempo, com sílabas Takadimi, comparadas com as figuras dos manuais; transições de 1 passo com e sem
  a direção da última nota; a árvore de 2 passos com a probabilidade que uma cadeia de 1.ª ordem daria
  ao mesmo par; entradas, contornos, associações; a comparação dos modelos. As probabilidades são
  fórmulas (contagem / contagem do contexto) e cada coluna está explicada
  ([`results/meters/README.md`](results/meters/README.md)).
- **Conclusões** (validação cruzada por melodia; relatório completo em
  [`results/meters.md`](results/meters.md)):
  - separar os compassos torna o ritmo real de um compasso cerca de 1,8 vezes mais provável em 3/4
    e 1,6 em 6/8 (os que se confundiam), com o mesmo modelo;
  - a direção da última nota quase não ajuda a prever a figura seguinte, mas ajuda muito a prever o
    intervalo seguinte (depois de um salto a melodia tende a voltar para trás; depois de um grau,
    a continuar): entra no modelo da melodia, não no do ritmo;
  - a árvore de dois passos prevê o ritmo melhor do que um passo em todos os compassos com muitas
    melodias, e a memória continua a ajudar até cerca de um compasso (ou dois), desde que cada
    contexto seja misturado com os mais curtos (modelo de ordem variável com suavização);
  - no algoritmo genético ([`results/meters-ga.md`](results/meters-ga.md)), os blocos de cada
    compasso dão melodias mais típicas (21 de 26 características contra 18–19) e com figuras mais
    perto das reais, com o mesmo crítico, e sem copiar: o maior trecho igual a uma melodia real
    (2–6 tempos) é menor do que o que as melodias reais partilham entre si (5–9).
- **O que a app usa** (`src/ga/blocks.js`, `src/data/blocks-data.js`): por compasso, a figura dadas
  até 4 figuras anteriores e o tempo do compasso; o intervalo de entrada dado o grau, a direção do
  último intervalo (grau ou salto) e a figura; o contorno dada a figura e a entrada. 12/8 usa o
  modelo de 6/8. O fitness conhece o tempo de cada compasso (cadências, alinhamento das figuras,
  frases de cerca de oito tempos, limites «não maximizar» próprios), tal como o contraponto dos
  cânones, os operadores, a partitura, o PDF, o LilyPond e o MIDI. O modo clássico fica em 4/4.

### Blocos de construção do corpus (primeira versão, em 4/4)

O que se segue é a primeira versão dos blocos, que lia tudo em tempos de semínima; os números
(inícios, crítico, 24 sementes) foram medidos com ela. A secção anterior descreve o modelo atual.

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
| Padrões musicais | 0,93 ± 0,04 | 18,8 ± 1,4 |
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

## Heurísticas de composição e estilos

Pedido: procurar na literatura regras de composição por estilo e compasso, registá-las num CSV com as fontes, confrontá-las com as regras que já existiam, acrescentar as novas à aptidão num campo «Heurísticas de composição» e criar uma entrada «Estilo» que obriga esse peso a ser diferente de zero. O relatório completo está em [`results/estilos.md`](results/estilos.md) e as tabelas em [`results/estilos/`](results/estilos/).

- **Pesquisa**: 66 achados com fonte em [`literatura.csv`](results/estilos/literatura.csv) (mais 15 sobre o fado, `F01`–`F15`; ver a secção «Fado»). São 19 regras gerais (Huron, Chiu & Temperley, von Hippel & Huron, Narmour, Tierney et al., Savage et al., Fux, Jeppesen, Caplin, Koch, Schoenberg, Lerdahl & Jackendoff, Huron & Ommen, Temperley) e 47 achados sobre estilos: danças irlandesas e escocesas, danças barrocas, tópicos de Ratner, embalar, infantil, coral, hino, blues, jazz, pop, tango, fado, vira e corridinho, canção chinesa.
- **Confronto** ([`confronto.csv`](results/estilos/confronto.csv)): as regras antigas cobriam a proximidade, a regressão, a cadência e a forma, mas eram maximizadas. As melodias do AG tinham quase nenhum salto (0–3 %; reais 3–20 %), desciam por grau menos do que as reais (0,40; reais 0,43–0,82), repetiam pouco os ritmos dos compassos (0,14–0,20; reais 0,29–0,82), alongavam pouco a nota final da frase e faziam um arco em todas as frases. Não havia nenhuma regra de estilo.
- **Codificação** (`src/fitness/heuristics.js`, `src/fitness/styles.js`):
  - cada regra mede uma característica e compara-a com um intervalo-alvo: vale 1 dentro e desce até −1 fora, sem nada a maximizar;
  - os alvos são o P10–P90 das melodias reais onde o corpus as tem (`tools/build_styles.mjs`); nas regras gerais, todas as melodias do compasso; nos estilos com corpus (canção popular, coral, reel, jig, slip jig, hornpipe, strathspey, marcha), as melodias desse estilo;
  - nos outros estilos, os alvos vêm da literatura;
  - os estilos são dados: regras com os ids das fontes, mais o compasso, a frase, a forma, o comprimento, a anacrusa, o andamento e o modo sugeridos;
  - todas as regras, com o alvo e a origem, estão em [`regras.csv`](results/estilos/regras.csv).
- **Na página**:
  - «Estilo», na secção «Peça», escolhe um de 37 estilos. Ajusta o compasso, a frase, a forma, o comprimento e o andamento, e põe o peso «Heurísticas de composição» acima de 0; enquanto houver estilo, esse peso não pode voltar a 0.
  - Sem estilo, o peso (a 0 por omissão) aplica só as regras gerais.
  - No modo clássico há o mesmo peso nos dois grupos, somado por tempo; só aí funcionam os estilos em 4/4.
  - Depois de gerar, um indicador («heurísticas 15/17») e uma tabela mostram cada regra: o valor, o alvo, a origem e as fontes.
- **Validação** (validação cruzada em 5 dobras):
  - as regras gerais põem a melodia real acima das mesmas notas baralhadas em 90 % dos pares;
  - reels e strathspeys são reconhecidos entre 20 estilos em 71–75 % dos casos (ao acaso: 5 %);
  - estilos descritos de forma parecida confundem-se (jig com tarantela, coral com hino).
- **No AG** ([`results/estilos-ga.md`](results/estilos-ga.md), 37 casos × 4 sementes):
  - com o peso a 4, a pontuação do estilo passa de 0,60 para 0,95 e as regras dentro do intervalo de 65 % para 93 %;
  - o AG aprende a anacrusa da gavota, o final feminino da polonesa, as três colcheias da jig e os pontuados do hornpipe;
  - o crítico sobe ou mantém-se nos estilos próximos do seu corpus (bourrée 0,68 → 0,94, marcha 0,78 → 0,87) e desce nos que estão longe dele (jazz 0,88 → 0,61, valsa 0,80 → 0,63);
  - por isso o peso fica a 0 sem estilo.
- **Descrições dos pesos**: em «Pesos das regras», cada peso tem um botão «?» que explica o que a regra mede e como muda a melodia. No modo clássico, a descrição interpreta também o que os autores pretendiam, a partir do código e dos seus comentários.
- **Lapso novo no original**: ao escrever essas descrições encontrou-se outro lapso. `ScoreTerminationQualifyers` dá a pontuação máxima a uma nota final de só duas semicolcheias: os testes aninhados usam `!=`, embora o comentário diga «terminação com notas mais longas». Fica como no original, porque as combinações calibradas contam com ele.

## Fado

Pedido: estudar a fundo o fado, o que o distingue, os seus ritmos e formas, o simbolismo e o que a
música tem de transmitir; escrever tudo num ficheiro de apoio antes de derivar regras; derivar
regras novas, confrontá-las com as do projeto e criar uma secção do algoritmo para o fado. O
pedido trazia também uma pergunta: a tensão do fado consegue-se sem crescendos e diminuendos? Se
não, a dinâmica liga-se só para o fado. O relatório está em [`results/fado.md`](results/fado.md)
e a pesquisa em [`results/fado/pesquisa.md`](results/fado/pesquisa.md).

- **Pesquisa**: história (Nery, UNESCO), simbolismo (destino, saudade, o mar e a espera, e o lado
  alegre do saber receber), formas (fado tradicional e fado-canção, quadras e redondilha),
  harmonia (Ernesto Vieira, 1890; 11 esquemas reais), ritmo e rubato, a voz (vibrato medido em
  104 fadistas), a dinâmica (Sergl) e os estudos computacionais. São 15 achados novos (`F01`–`F15`)
  em [`literatura.csv`](results/estilos/literatura.csv).
- **Fados reais**: cinco melodias e uma transcrição «como é cantada», medidas contra as 5727
  melodias do corpus em 2/4 e 4/4.
  - O verso de fado tem 7 a 12 notas, recita em notas repetidas, desce por graus e acaba numa
    nota suspensa 2 a 5 vezes mais longa do que as outras. A nota é alcançada por um grau a descer
    e muitas vezes cantada antes do tempo, e o verso respira antes do seguinte.
  - A tónica fica para o fim da estrofe. As notas rápidas são raras e, quando aparecem, são
    ornamento que leva à nota suspensa.
  - As regras gerais do projeto punham os fados entre as piores melodias do corpus (percentis
    2–46). As regras de fado põem-nos nos percentis 55–100.
- **Dois grupos** (sugestão do utilizador): **Fado triste (menor)** e **Fado alegre (maior)**,
  numa família «Fado» do menu de estilos. O triste é lento, com respirações e notas suspensas
  antecipadas; o alegre é vivo, com as notas longas no tempo, e convida a dançar.
- **Aptidão**: além das regras, um estilo de fado muda as pausas (respirações), o ritmo (notas
  suspensas antecipadas), as cadências (os versos alternam entre suspensão e repouso), a
  variedade (recitação) e a tensão (o ápice no início do verso).
- **Dinâmica**: o fado tem o seu próprio modelo, calculado a partir da melodia
  (`src/core/expression.js`). Os outros estilos passaram depois a ter perfis próprios: ver a
  secção seguinte.
  - Cada verso começa forte e apaga-se, a nota suspensa esmorece, o ápice cresce, as notas de dor
    são acentuadas e a última estrofe é mais forte, com o vibrato estreito das fadistas.
  - Ouve-se na página (caixa «Dinâmica»), fica no MIDI (velocidade e CC 11) e aparece na
    partitura da página, no PDF (*pp*–*ff*, reguladores e acentos) e no LilyPond.
- **Melodia + acompanhamento** (só no fado, por agora): a voz é composta primeiro e depois as
  guitarras harmonizam-na (`src/accomp/fado.js`; pesquisa em
  [`results/fado/harmonizacao.md`](results/fado/harmonizacao.md)).
  - Os acordes são escolhidos pelo algoritmo de Viterbi sobre o vocabulário dos fados.
  - A **viola** faz baixo e acorde, com passagens de baixo.
  - A **guitarra portuguesa** faz a introdução com o último verso, responde nas respirações da voz
    e faz o dedilho por baixo das notas suspensas.
  - Na partitura e no PDF aparecem as três pautas e as cifras; no LilyPond, os acordes vão em
    `ChordNames`.
  - No Início rápido, «Melodia + acompanhamento (só fado)» deixa escolher só os estilos de fado.
- **Partituras do utilizador**: «Fado dos Fados», «Fadista Louco», «Fado do Bairro Alto», um método
  de guitarra portuguesa e canções de Coutinho de Oliveira, analisados em
  [`results/fado/partituras.md`](results/fado/partituras.md). Daí vieram:
  - o **rubato** (*rit.* e fermata, na reprodução, no MIDI e na partitura);
  - o dedilho da guitarra e o vii°7;
  - a introdução em *forte*;
  - a distinção entre corridas rápidas e recitação rápida em notas repetidas.
- **Áudio**: `tools/fado_audio.py` mede a dinâmica da voz em gravações, separando-a das guitarras
  pela forma como cada som decai.
  - Num teste sintético recupera o esmorecer, a descida do verso e o vibrato.
  - A rede deste ambiente bloqueia o YouTube e o archive.org, por isso ainda não correu sobre
    gravações reais (ver [`TRABALHO-FUTURO.md`](TRABALHO-FUTURO.md)).

## Dinâmica e rubato em todos os estilos

Pedido: ver o que da secção do fado faz sentido nos outros modos e avançar por ordem de
importância. A primeira prioridade foi a dinâmica e o rubato, que até aqui só o fado tinha. O
relatório está em [`results/expressao.md`](results/expressao.md).

- **Perfis**: cada estilo do modo campo toca com o perfil da sua família, ou com um perfil próprio.
  O modo clássico fica sem dinâmica, como o original. Os perfis são:
  - **canção**: frases em arco, respiração no fim das frases, fermata final;
  - **infantil** e **embalar**: a canção de embalar suave e cada vez mais suave;
  - **coral e hino**: fermata em cada fim de frase;
  - **dança**, **valsa** e **mazurca**: tempo firme e o acento no 1.º ou no 2.º tempo;
  - **barroco** e **sarabanda**: dinâmica em terraços, com a repetição de uma frase em eco
    *piano*;
  - **clássico**: arco de frase e fim de frase alargado;
  - **pop** e **jazz**: tempo de metrónomo e síncopas ou contratempos acentuados;
  - **blues**: a frase que começa forte e se apaga e as notas blue apoiadas;
  - **geral**, sem estilo.
- **Literatura**: o sistema de regras do KTH (arco de frase, agudo-forte, rallentando final;
  Friberg, Bresin & Sundberg 2006), o modelo do rallentando final de Friberg & Sundberg (1999) e
  os arcos de dinâmica de Todd (1992). São 8 achados novos em `literatura.csv` (`X01`–`X08`).
- **Medição**: `tools/expression_study.py` mediu 1036 interpretações de piano alinhadas com a
  partitura (conjunto ASAP).
  - **Rallentando final**: o último tempo vai a 0,47 do andamento em Bach e a 0,69 no clássico.
    O modelo reproduz estes valores com a curva de Friberg & Sundberg (q = 2, w = 0,35 no
    barroco; linear, w = 0,62 no clássico), e um teste confirma-o.
  - **Agudo-forte**: a altura e a velocidade correlacionam a r ≈ 0,4.
  - **Fim de frase**: alonga quase nada em Bach (+0,6 %) e +2,5 % no clássico.
  - **Acento métrico**: o 1.º tempo só é mais forte nas danças.
- **Onde aparece**:
  - na reprodução (caixa «Dinâmica e rubato», com o perfil descrito na dica) e no MIDI;
  - na partitura, no PDF e no LilyPond: *pp*–*ff*, reguladores dos arcos, *rit.* e uma fermata
    na última nota de cada pauta.
- **Cânones**: as vozes são iguais e só o fim abranda.

## Ouvir no telemóvel: QR code, ligação e PDF com o MIDI

Pesquisa e decisões, com as fontes: [`results/qr/pesquisa.csv`](results/qr/pesquisa.csv) e
[`results/qr.md`](results/qr.md).

- **O ficheiro MIDI é o transporte.** Além das notas, leva num evento de texto o registo da peça:
  os genes, as definições que diferem das de omissão, o andamento e o título (`src/io/song.js`).
  Qualquer leitor de MIDI toca o ficheiro, e esta página reconstrói a peça a partir dele, com as
  vozes do cânone, as ondas e a avaliação.
- **PDF.** O MIDI vai sempre anexado ao PDF: é um ficheiro incorporado (ISO 32000, com
  `/AFRelationship /Source` como no PDF/A-3) e aparece no painel de anexos do leitor de PDF. Em
  **Abrir PDF ou MIDI…** a página lê o anexo e recupera a peça. Um MIDI feito por outro programa
  vai para o separador Analisar.
- **QR code** (opção **QR no PDF**). O QR traz um endereço `https://…/web/#M<dígitos>`:
  - os dígitos são o MIDI comprimido com DEFLATE, 12 bytes em 29 dígitos;
  - o endereço vai em modo byte e os dígitos em modo numérico, o mais denso do QR (3,33 bits por
    dígito; aproveita 99 % dos bits, contra 75 % do Base64);
  - a câmara do telemóvel abre no navegador o **leitor** `tocar.html`, uma página leve (200 kB, sem o
    motor de composição) que toca a música com o mesmo sintetizador, mostra as notas de cada voz,
    deixa descarregar o `.mid` e abre a peça na aplicação completa;
  - o fragmento (depois de `#`) não sai do telemóvel, e nada é enviado a um servidor.

  O QR fica no canto inferior direito da última página, num espaço que a paginação reserva para
  ele, com uma explicação ao lado: não tapa a partitura nem o texto. Os módulos têm 0,55 mm no
  máximo e o símbolo 60 mm no máximo (versão 40: 0,32 mm, legível de perto numa impressão
  laser). Se o cânone inteiro não couber no maior QR (2953 bytes), vai só a melodia com o registo
  e a página refaz as vozes. O codificador de QR é desta página (`src/io/qr.js`, sem bibliotecas).
- **Endereço do leitor.** O QR abre sempre o leitor publicado no GitHub Pages do repositório,
  venha o PDF de onde vier (da página publicada, de um servidor local ou do ficheiro único no
  disco): `https://tinocolight.github.io/MusicGeneratiorWithIAGenetic/web/dist/tocar.html`. O
  GitHub Pages publica a raiz do `main` (Settings → Pages → Deploy from a branch → `main`,
  `/ (root)`), e a aplicação fica em `https://tinocolight.github.io/MusicGeneratiorWithIAGenetic/web/`.

  Pode dar-se outro endereço no campo que aparece ao marcar a opção. Uma alternativa sem GitHub
  Pages é o [raw.githack.com](https://raw.githack.com), que serve como páginas os ficheiros de um
  repositório público:
  `https://raw.githack.com/tinocolight/MusicGeneratiorWithIAGenetic/main/web/dist/tocar.html`.
- **Sem rede nenhuma**, o PDF basta: «Abrir PDF ou MIDI…» lê o MIDI anexado e recupera a peça,
  qualquer que seja o endereço do QR.

## Línguas (português e inglês)

A página existe em português e em inglês. O menu fica no cabeçalho; a escolha fica guardada no navegador e, da primeira vez, segue a língua do navegador.

Todos os textos estão num só ficheiro, [`src/i18n/texts.js`](src/i18n/texts.js), com uma entrada por texto e um campo por língua (`'piece.title': { pt: 'Peça', en: 'Piece' }`). O `index.html` só tem marcadores (`data-i18n`, `data-i18n-html`, `data-i18n-title`, `data-i18n-aria-label`), e os scripts pedem os textos com `t('chave', {valor})`.

Para acrescentar uma língua basta juntá-la a `LANGUAGES` e dar às entradas um campo com o seu código; o que faltar aparece em português. Os testes (`test/i18n.test.mjs`) verificam três coisas: que cada marcador tem texto, que cada entrada existe em todas as línguas com os mesmos `{marcadores}`, e que os textos pedidos pelos scripts existem.

## Estudo do algoritmo original: combinações de partida

Pedido: estudar o algoritmo original com música real e oferecer pelo menos três combinações de
partida que tirem dele o melhor som possível, percebendo como cada valor aproxima (ou afasta) as
melodias das reais. `node tools/classic_study.mjs` (≈ 1 h com 4 processos; relatório completo em
[`results/classic-study.md`](results/classic-study.md)). O alvo são três estilos reais, com as 8
últimas barras de cada melodia em maior do corpus grande, transpostas para Sol maior: **canções**
populares (Essen, 2161), **danças** irlandesas e escocesas (reels e hornpipes de O'Neill, Ryan e
Aird, 792) e **corais** (sopranos de Bach, 121). Um quinto de cada estilo fica de fora para a
confirmação. As medidas são o crítico, a tipicidade do estilo (parte das 26 características dentro
do P10–P90 desse estilo) e a distância ao estilo (média de |x − mediana| / dispersão, com teto 3).

**1. Triagem (desenho de experiências).** Plackett–Burman de 32 ensaios com reflexão (64 ensaios,
resolução IV) × 3 sementes, com 30 valores do original ao mesmo tempo: os 16 pesos (ligado/desligado),
as duas ondas (amplitude, período, bacia, média), o âmbito atrator, o intervalo de pausas, a correção
dos lapsos, a mutação, a população e os grupos de pesos, mais um fator fictício. Resultado: em toda
esta região o crítico fica em 0,01 e o âmbito em 46 meios-tons, em média. **Nenhum valor sozinho
tira o algoritmo daí.** Os efeitos acima do ruído são o peso do âmbito (−34 meios-tons de âmbito), a
escala e o leitmotiv (+1 característica típica), as repetições interessantes e o equilíbrio. O
intervalo de pausas admitido é o que mais baixa a densidade de notas (−0,7 notas por tempo), mas não
é significativo sozinho. Os valores têm de mudar juntos.

**2. Do fim para o início (calibração inversa).** As constantes saem diretamente das melodias reais
de cada estilo. O âmbito atrator é o P90 da distância das notas ao centro da melodia + 2. As
pausas e prolongamentos admitidos são o P10–P90 real: 55–80 % nas canções, 9–63 % nas danças,
71–81 % nos corais, contra os 7–40 % fixos do original, que obrigam a semicolcheias. A onda 1 é o
contorno mediano, com um ciclo em 8 compassos e cerca de ±3 meios-tons, em vez de ±12.

Os pesos são aprendidos por comparação. As melodias reais devem pontuar acima das suas vizinhas
(com 2–48 genes trocados, como faz a mutação de bits) e acima do que o AG escreve com os pesos
atuais. São 6 voltas, como em aprendizagem por reforço inversa.

As regras passam a separar as melodias reais em 89 % dos pares. Mesmo assim, o AG continua a
escrever melodias com crítico 0, porque explora o que as 16 regras não veem.

**3. Do início para o fim (otimização).** A partir da calibração, usa-se o método da entropia
cruzada: um desenho sequencial com 16 combinações por iteração e 3 sementes comuns, em que as 5
melhores definem a nova média e a nova dispersão. A pesquisa cobre os 16 pesos e 11 constantes.

O objetivo é J = 0,4 × crítico + 0,3 × tipicidade do estilo + 0,3 × (1 − distância/3), com uma
penalização quando o âmbito ou a densidade saem do que o estilo admite. Esta penalização foi
precisa: sem ela, a contagem de características deixava passar âmbitos de 5 oitavas.

Há duas pesquisas:

- com os operadores de bits do original: 14 iterações;
- com os operadores musicais da página: 12 iterações, a partir do resultado anterior.

No fim, as melhores são confirmadas com 12 sementes novas. Uma **triagem local** (Plackett–Burman de
32 ensaios à volta de cada combinação, pesos a metade ou ao dobro, constantes um passo acima ou
abaixo) mostra que, uma vez lá, quase nenhum valor isolado muda o resultado acima do ruído: as
combinações estão num planalto.

**Confirmação** (24 sementes novas):

| Combinação | Crítico | Estilo próprio (reais) | Notas/tempo (reais) | Graus conjuntos | Âmbito | Acaba na tónica |
|---|---|---|---|---|---|---|
| Original, operadores de bits | 0,00 | — (canção 36 %) | 2,72 | 0,15 | 35,8 | 8 % |
| Canção, operadores de bits | 0,00 | 50 % (85 %) | 0,63 (1,24) | 0,48 | 13,8 | 33 % |
| Coral, operadores de bits | 0,00 | 46 % (86 %) | 0,93 (0,94) | 0,49 | 21,0 | 29 % |
| Original, operadores musicais | 0,95 | — (dança 73 %) | 2,98 | 0,35 | 22,0 | 17 % |
| **Canção**, operadores musicais | 0,90 | **75 %** (85 %) | 1,99 (1,24) | 0,52 | 9,8 | **71 %** (73 %) |
| **Dança**, operadores musicais | 0,91 | **72 %** (79 %) | **2,52** (2,36) | 0,50 | 11,6 | **75 %** (85 %) |
| **Coral**, operadores musicais | 0,92 | 58 % (86 %) | 1,33 (0,94) | **0,66** (0,68) | 8,1 | 54 % (76 %) |

Leitura:

- **Com os operadores do original, os valores aproximam a forma, mas não o som.** A combinação
  «Canção» passa de 36 para 14 meios-tons de âmbito e de 2,7 para 0,6 notas por tempo. Os graus
  conjuntos triplicam e as melodias ficam mais típicas das canções (36 % → 50 %).

  O crítico continua em 0. Com os operadores de bits, 36–67 % das notas são síncopas, ou seja,
  começam fora do tempo e atravessam o tempo seguinte (na música real, no máximo 3 %). Nenhuma regra
  do original olha para a posição métrica. A
  regra dos intervalos, por seu lado, premeia quartas, quintas e oitavas tanto como graus conjuntos
  e penaliza meios-tons. Os pesos mudam a importância das regras, não o que elas medem.
- **Com os operadores musicais, os mesmos tipos de valores fazem a diferença que falta.** Os valores
  originais já soam «reais» ao crítico (0,95), mas densos como uma dança, com 22 meios-tons de âmbito
  e quase nunca a acabar na tónica.

  As combinações calibradas trazem cada peça para o seu estilo. A canção fica com 75 % das
  características típicas e acaba na tónica tantas vezes como as canções reais. A dança tem a
  densidade das danças reais. O coral tem os graus conjuntos dos corais, mas continua com mais notas
  do que um coral: é o estilo mais difícil com estas regras.
- **As fórmulas de final só ajudam quando os operadores conseguem escrever um final.** Com os
  operadores de bits, na triagem, a regra baixa ligeiramente a tipicidade: o AG satisfá-la à custa
  do resto. Com os operadores musicais, as combinações calibradas (que lhe dão peso) acabam na
  tónica em 54–75 % das peças, contra 17 % com os valores originais.
- **Na página**: modo Clássico → «Combinações de partida» (*Original (2020)*, *Canção popular*,
  *Dança*, *Coral*) e «Afinada para» (operadores musicais, que soam melhor, ou os de bits do
  original). Cada estilo tem valores próprios para cada tipo de operadores. A tonalidade, os
  compassos e a semente não mudam.

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
em cânone); a de «blocos» é escrita com os blocos do corpus. Para separar o mérito do AG do mérito
desses padrões, `node tools/convergence.mjs 4 2000` compara-as com uma população **aleatória, sem padrões** (cada semicolcheia é pausa, prolongamento ou
nota cromática ao acaso). Melhor indivíduo, média de 4 sementes, aptidão · crítico
([`results/convergence.md`](results/convergence.md)):

| Conjunto | População inicial | Geração 0 | 100 | 600 | 2000 |
|---|---|---|---|---|---|
| Só a melodia | blocos do corpus (omissão) | 13,4 · 0,85 | 16,2 · 0,85 | 16,5 · 0,88 | 16,6 · 0,90 |
| Só a melodia | com padrões musicais | 11,5 · 0,69 | 16,1 · 0,87 | 16,5 · 0,91 | 16,5 · 0,95 |
| Só a melodia | aleatória | −5,5 · 0,00 | 16,1 · 0,86 | 16,5 · 0,93 | 16,5 · 0,95 |
| 2 violinos (c. 2) | com padrões musicais | 15,7 · 0,89 | 19,2 · 0,91 | 20,1 · 0,90 | 20,2 · 0,90 |
| 2 violinos (c. 2) | aleatória | −4,2 · 0,00 | 15,4 · 0,40 | 19,6 · 0,83 | 20,2 · 0,88 |
| Trio | com padrões musicais | 16,0 · 0,81 | 19,7 · 0,80 | 20,7 · 0,83 | 21,0 · 0,74 |
| Trio | aleatória | −6,7 · 0,00 | 12,5 · 0,42 | 17,9 · 0,80 | 20,1 · 0,74 |

(Com «não maximizar», ligado por omissão: as aptidões são mais baixas do que com as regras ao
máximo, porque cada regra satura no seu valor típico, e não são comparáveis com as de versões
anteriores.)

- **Os padrões iniciais já fazem muito**: antes de qualquer evolução, o melhor indivíduo da geração 0
  tem crítico 0,69–0,89; com os blocos do corpus, 0,85. O AG acrescenta sobretudo o que as regras
  pedem (ondas, cadências, forma, contraponto).
- **A partir do ruído o AG também converge**, e com «não maximizar» mais depressa: uma melodia só
  chega ao mesmo sítio (aptidão e crítico) em ~300 gerações; com 2 vozes em 1500–2000; com 3 vozes
  fica um pouco abaixo em 2000 gerações (20,1 contra 21,0). Os padrões iniciais servem sobretudo para
  chegar mais depressa a algo tocável, e com várias vozes para não gastar a diversidade a reparar o
  contraponto.
- Por isso a interface deixa escolher: ver a convergência honesta a partir do ruído, ou partir de
  padrões musicais ou dos blocos do corpus.

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
  tocar.html, dist/tocar.html    leitor leve que os QR codes abrem (toca o MIDI do endereço)
  src/core/                      representação, teoria (perfis K-K, espaço de Lerdahl), ondas, instrumentos, RNG
  src/fitness/classic.js         regras do C# original (com a correção opcional dos lapsos)
  src/fitness/cadence.js         fórmulas de final aprendidas do corpus
  src/fitness/attractor.js       campo de atratores
  src/fitness/heuristics.js      heurísticas de composição: medidas da melodia e pontuação por intervalo-alvo
  src/fitness/styles.js          regras gerais e 37 estilos (dados, com as fontes do CSV)
  src/i18n/                      texts.js: todos os textos da página (pt, en); i18n.js: t(), troca de língua
  src/fitness/canon.js           contraponto entre as vozes (pares, tríades, registo, intervalos diatónicos)
  src/ga/                        AG, operadores, MAP-Elites
  src/variation/dabby.js         variações caóticas
  src/analysis/wavefit.js        analisador de ondas
  src/eval/                      características, modelo de expectativa, crítico, modelos nulos
  src/io/midi.js                 escrita/leitura de MIDI (com o registo da peça num evento de texto)
  src/io/song.js                 registo da peça, ligação #M<dígitos> (DEFLATE, modo numérico do QR)
  src/player/player.js           leitor: lê o MIDI de todas as vozes, toca, desenha, descarrega
  src/io/qr.js                   codificador de QR code (segmentos byte/numérico/alfanumérico, versões 1–40)
  src/io/notation.js             notação: ortografia, compassos, figuras e ligaduras, claves, escrita LilyPond,
                                 cânone numa só linha com as entradas
  src/io/pdf.js                  PDF vetorial (A4), contexto de desenho para o VexFlow, ficheiros anexados
  src/ui/score.js                partitura na página (VexFlow + Gonville), com a dinâmica e o rubato
  src/core/expression.js         dinâmica e rubato por estilo (fado e perfis por família): nível, arcos de frase,
                                 agudo-forte, terraços, acentos, vibrato, rit., rallentando final e fermatas
  src/accomp/fado.js             acompanhamento do fado: acordes (Viterbi), viola, guitarra portuguesa
  src/core/meter.js              compassos simples e compostos (tempo, pesos métricos, frases)
  src/ga/figures.js              leitura por tempos: figura, contorno, entrada, direção
  src/ga/context.js              modelo de contexto de ordem variável (suavização interpolada)
  src/ga/blocks.js               blocos do corpus por compasso: modelo, escrita por blocos, mutação, regra «idioma»
  data/corpus-meters.json        9644 melodias reais com o seu compasso (sem as 480 do crítico)
  data/corpus-large.json         6758 melodias em x/4 do estudo do algoritmo original
  results/qr/                    pesquisa sobre QR code, MIDI e PDF (pesquisa.csv)
  results/estilos/               pesquisa (literatura.csv), confronto, regras, calibração, validação, estudo no AG
  results/fado/                  o fado: pesquisa de apoio, harmonias, medidas, confronto, validação, AG, áudio
  TRABALHO-FUTURO.md             ideias para depois (voz livre com acompanhamento de guitarra, Início rápido e fado)
  results/meters/                a análise por compasso em CSV e Excel (auditável)
  src/data/classic-presets.js    combinações de partida do modo clássico (gerado pelo estudo)
  vendor/                        VexFlow 4.2.5 com a fonte Gonville (MIT, LICENSE-vexflow.txt)
  src/data/                      corpus, crítico treinado, 3 cânones de Telemann e rondas, pesos aprendidos, exemplo
  src/ui/                        interface (config.js: configuração e auto-configuração; controls.js: painel Compor)
  tools/                         extração do corpus, treino do crítico, benchmark, análise inversa, build, harness C#
  test/                          testes (node --test)
  results/                       resultados do benchmark e da análise inversa
```

```bash
cd web
npm test                              # 117 testes
node tools/benchmark.mjs 6            # benchmark → results/benchmark.md
node tools/reverse.mjs                # análise inversa → results/reverse.md, src/data/learned-weights.js
node tools/convergence.mjs 4 2000     # convergência a partir de uma população musical ou aleatória
node tools/train_critic.mjs           # treina o crítico → data/critic.json, src/data/critic-data.js
python3 tools/extract_corpus.py       # corpus a partir do music21 (pip install music21)
python3 tools/extract_corpus.py --full  # melodias completas, para a análise inversa
python3 tools/extract_large_corpus.py # 6758 melodias para os blocos (music21, ~5 min)
python3 tools/extract_meter_corpus.py # 9644 melodias com o compasso → data/corpus-meters.json (music21, ~10 min)
node tools/build_meters.mjs           # análise por compasso, validação cruzada, modelo da app →
                                      #   results/meters/*.csv, results/meters.md, src/data/blocks-data.js
python3 tools/export_xlsx.py          # results/meters/analise-compassos.xlsx e README.md (pip install openpyxl)
node tools/meters_ga_study.mjs 8 400  # os blocos por compasso no AG → results/meters-ga.md
node tools/openings.mjs 8             # inícios e qualidade por variante → results/openings.md
node tools/solo_defaults.mjs 24       # omissão da melodia só, 24 sementes → results/solo-defaults.md
node tools/build_cadences.mjs         # fórmulas de final → src/data/cadence-data.js, results/cadences.md
python3 tools/fado_corpus.py /tmp/fado-scores   # fados reais (git clone https://github.com/fadado/fado-scores)
node tools/fado_study.mjs none fado fadoAlegre   # o que distingue o fado, confronto e validação → results/fado/
node tools/fado_ga_study.mjs 6 400    # o AG com e sem os estilos de fado → results/fado/ga.csv
python3 tools/fado_audio.py --selftest          # dinâmica da voz em gravações (pip install librosa imageio-ffmpeg)
python3 tools/expression_study.py /tmp/asap --csv results/expressao/asap.csv
                                      # tempo e dinâmica de ~1000 interpretações de piano (ASAP;
                                      #   git clone https://github.com/fosfrancesco/asap-dataset /tmp/asap)
python3 tools/build_pdf_fonts.py      # larguras das fontes-padrão do PDF → src/data/pdf-fonts.js
node tools/classic_study.mjs          # estudo do algoritmo original (~1 h, 4 processos) →
                                      #   results/classic-study.md, src/data/classic-presets.js
node tools/make_examples.mjs          # exemplo mostrado ao abrir a página
node tools/build_styles.mjs           # heurísticas: calibração no corpus, validação, regras →
                                      #   src/data/style-calibration.js, results/estilos/*.csv
node tools/styles_ga_study.mjs 4 400  # os estilos no AG (~20 min) → results/estilos-ga.md, results/estilos/ga.csv
node tools/build_single.mjs           # dist/ondas-atratoras.html e dist/tocar.html (usa esbuild via npx)

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
