# Fado: pesquisa de apoio

Notas reunidas **antes** de derivar regras para o algoritmo, com as fontes de cada achado. O texto é
um resumo pelas minhas palavras; as citações curtas vão entre aspas, com a origem indicada. Os
números medidos nas partituras estão em [`../fado.md`](../fado.md) e nos CSV desta pasta.

## 0. Âmbito e limites desta pesquisa

- **Pesquisa na web:** feita com um motor de pesquisa, sem abrir as páginas. A rede deste ambiente
  bloqueia a leitura direta de páginas, o YouTube, o archive.org, o Wikimedia e os repositórios
  universitários (run.unl.pt, uminho.pt). Por isso as fontes abaixo foram lidas pelos excertos e
  resumos que a pesquisa devolve. Quando só um sítio genérico afirma alguma coisa, isso fica
  dito.
- **Análise de áudio:** não foi possível. O YouTube está bloqueado neste ambiente, e o mesmo
  acontece a qualquer outro arquivo de gravações que tentei (archive.org, Wikimedia). A dinâmica
  e a voz ficam apoiadas em estudos acústicos publicados (secção 7) e na descrição do utilizador
  (secção 8).
- **Partituras reais:** o único arquivo de partituras de fado acessível foi
  [fadado/fado-scores](https://github.com/fadado/fado-scores) (LilyPond, Joan Josep Ordinas Rosa,
  domínio público). Tem:
  - cinco melodias: Fado Adiça, Fado Alberto, Coimbra, Fado do Marujo, Fado Pagem;
  - para Coimbra, além da melodia escrita, uma **transcrição de como é cantada** (com o rubato
    escrito);
  - as harmonias de mais nove fados: Menor, Corrido, Mouraria, Bailado, Menor do Porto, Dois Tons,
    Perseguição, Rosinha dos Limões e Coimbra.

  O arquivo de 100 transcrições de Videira & Rosa (2017), em PDF e MIDI, existe mas está num
  servidor bloqueado. A amostra é pequena e as conclusões numéricas têm de ser lidas com essa
  reserva.

## 1. O que é o fado e de onde vem

- **A palavra:** «fado» vem do latim *fatum*, destino. Fontes:
  [Lisboa.net](https://www.lisboa.net/o-fado); [Taste of Lisboa](https://www.tasteoflisboa.com/blog/the-history-of-fado-and-how-to-experience-it-live-in-lisbon/).
- **Primeiras menções:** segundo Rui Vieira Nery, a palavra com sentido próximo do musical aparece
  pela primeira vez em 1822, num guia do geógrafo Adriano Balbi. As casas de fado e os fadistas,
  ligados à boémia e à prostituição de Lisboa, surgem em fontes dos anos 1830. O livro de
  referência é *Para uma História do Fado* (2004). Fontes:
  [Público, 2012](https://www.publico.pt/2012/11/04/jornal/o-fado-por-rui-vieira-nery-25487819);
  [IEA-USP, «As origens brasileiras do fado»](https://www.iea.usp.br/noticias/as-origens-brasileiras-do-fado).
- **Origem dançada:** no Brasil colonial, ritmos e danças africanas juntaram-se a harmonias e
  formas europeias numa «dança cantada de forte sensualidade», que atravessou o Atlântico e se
  fixou nos bairros do porto de Lisboa (Nery).
  - O lundum e a modinha estão na base; houve primeiro um fado brasileiro, «batido», «dançado» e
    «cantado».
  - «Bater o fado» designava o tocar, com marcação dos pés e uma dança com umbigada.
  - A componente rítmica e corporal foi-se diluindo ao longo do século XIX.
  - Fonte: [Falando de Música, «Bater o fado»](https://medium.com/@falandodemusica/bater-o-fado-curta-reflex%C3%A3o-d22a0888d3bf).
- **Na UNESCO (2011):** o fado foi inscrito como Património Cultural Imaterial da Humanidade a 27
  de novembro de 2011 (ref. 00563).
  - É descrito como uma síntese multicultural de danças cantadas afro-brasileiras, géneros locais
    de canção e dança, tradições rurais trazidas pelas migrações internas e padrões cosmopolitas
    da canção urbana do início do séc. XIX.
  - É cantado por uma voz solista (homem ou mulher), acompanhada pela guitarra portuguesa (12
    cordas metálicas) e pela viola, por vezes com viola-baixo ou uma segunda guitarra.
  - Os temas são a paixão, a perda, a dor, o desamor, a nostalgia e a saudade.
  - Fontes: [UNESCO](https://ich.unesco.org/en/RL/fado-urban-popular-song-of-portugal-00563/);
    [Nature HSSC 2023](https://www.nature.com/articles/s41599-023-01939-w).
- **Espaço:** os bairros antigos de Lisboa (Alfama, Mouraria, Castelo, Bairro Alto, Madragoa), as
  tabernas e os pátios; mais tarde, as casas de fado. Fonte:
  [Fado (Wikipedia)](https://en.wikipedia.org/wiki/Fado).

## 2. Simbolismo: o que a música tem de transmitir

- **Destino e resignação:** o fado é o «destino cantado». Na crença popular são canções tristes,
  muitas vezes sobre o mar ou a vida dos pobres, «com um sentido de resignação, destino e
  melancolia». Fonte: [Fado (Wikipedia)](https://en.wikipedia.org/wiki/Fado).
- **Saudade:** é a «presença de uma ausência», a tristeza pela falta de algo no tempo ou no
  espaço, com o prazer de sofrer por aquilo que se amou e se perdeu (ou que nunca se teve). É o
  «combustível» do fado. Fontes:
  [Portugal alma e coração](https://portugalalmaecoracao.pt/o-fado-e-a-alma-portuguesa/);
  [Lisboa.net](https://www.lisboa.net/o-fado).
- **O mar e a espera:** uma leitura corrente liga o fado à tristeza das famílias separadas pelas
  viagens marítimas. As famílias de marinheiros e pescadores viviam nos bairros do porto, à espera
  de quem podia não voltar, com a ansiedade da partida.
  - O poema de José Régio «Fado Português» (1941; música de Alain Oulman, gravado por Amália em
    1965) faz nascer o fado do mar e dos marinheiros. É o fado que o utilizador cita, «o fado
    nasceu um dia, quando o vento mal bulia e o céu o mar prolongava».
  - Em «Barco Negro», uma mulher recusa-se a acreditar que o seu amor, pescador, morreu no mar. A
    melodia veio de «Mãe Preta» (Caco Velho e Piratini, Brasil, 1954), um samba que abrandou para
    caber na casa de fados. A letra de David Mourão-Ferreira substituiu a original, censurada.
  - Fontes:
    [Fado Português (Wikipedia)](https://en.wikipedia.org/wiki/Fado_Portugu%C3%AAs);
    [A Viagem dos Argonautas](https://aviagemdosargonautas.net/2011/09/01/fado-portugues-de-jose-regio-e-alain-oulman-por-amalia-rodrigues/);
    [Canção do Mar (Wikipedia)](https://en.wikipedia.org/wiki/Can%C3%A7%C3%A3o_do_Mar);
    [Jornal GGN, «A história de Mãe Preta»](https://jornalggn.com.br/noticia/a-historia-de-mae-preta-barco-negro/);
    [KCRW](https://www.kcrw.com/music/articles/amalia-rodrigues-fado-classic-barco-negro).
- **O catálogo de temas:** amor, ódio, vergonha, separação, mágoa, tristeza, desespero, traição,
  destino, desgraça, solidão, sorte, viagem, memória, ansiedade, amargura, fatalismo, esquecimento.
  - Guerra descreve o fado como um «grito existencial» nascido da solidão do alto mar.
  - Fonte: [Um oceano musical](https://umoceanomusical.blogspot.com/2009/04/fado-o-destino-cantado.html)
    e os resultados da mesma pesquisa.
- **O lado alegre** (pedido do utilizador; confirmado pelas fontes):
  - O **Fado Corrido** («fadinho») é em modo maior e rápido. É o único fado tradicional por vezes
    associado à dança e transmite alegria, em contraste com o recolhimento do Fado Menor.
  - O **Fado Mouraria** é maior e moderado, de «saudade serena», ligado à desgarrada.
  - Fontes: [Porto Fado, «O que é o Fado Tradicional»](https://portofado.com/blog/2026/06/o-que-e-fado-tradicional/);
    [Cantar Mais, Fado Corrido](http://www.cantarmais.pt/pt/cancoes/fado/cancao/fado-corrido).
  - **«Uma Casa Portuguesa»** (Reinaldo Ferreira e Vasco Matos Sequeira, música de Artur Fonseca;
    Sara Chaves e depois Amália, 1953):
    - É a casa pobre e caiada onde há pão e vinho na mesa, e o pouco que há é dado a quem chega.
    - É exatamente a felicidade de saber receber que o utilizador descreve: o pobre que trata
      melhor quem vem de fora do que o rico, com um sorriso.
    - Foi também usada pelo SNI como cartaz de propaganda do regime, o que faz parte da sua
      história.
    - Fontes: [Uma Casa Portuguesa (Wikipedia PT)](https://pt.wikipedia.org/wiki/Uma_Casa_Portuguesa);
      [Letras, significado](https://www.letras.mus.br/amalia-rodrigues/230953/significado.html).
  - **«A Casa da Mariquinhas»** (versos de João Silva Tavares, cantada por Alfredo Marceneiro):
    - É o maior êxito de Marceneiro, uma casa de bairro inventada e descrita objeto a objeto.
    - Marceneiro construiu-a em madeira à escala 1/10, sem um único prego; a maqueta está no
      Museu do Fado.
    - Fontes: [Museu do Fado, Alfredo Marceneiro](https://www.museudofado.pt/pt/fado/personalidade/alfredo-marceneiro);
      [Portal do Fado](https://www.portaldofado.net/index.php?option=com_content&task=view&id=2853&Itemid=381&lang=en).
  - **Marchas populares:** o fado está ligado às marchas de Lisboa e ao bairrismo. Fontes:
    [Olhares de Lisboa](https://olharesdelisboa.pt/2019/06/bairrismo-e-fado-marcam-marchas-populares/);
    [Marchas Populares (Wikipedia)](https://en.wikipedia.org/wiki/Marchas_Populares).
- **Escutar o fado:**
  - Lila Ellen Gray (*Fado Resounding*, 2013) estudou como se aprende a ouvir o fado e a sentir
    saudade. Descreve uma fadista que canta até lhe doer a garganta, com a voz no limiar do
    soluço; nos momentos de beleza há ouvintes que choram. Fontes:
    [Duke University Press](https://www.dukeupress.edu/fado-resounding);
    [Ethnomusicology Review](https://ethnomusicologyreview.ucla.edu/content/fado-resounding-affective-politics-and-urban-life-lila-ellen-gray-durham-nc-duke-university).
  - Salwa Castelo-Branco estudou o diálogo entre vozes e guitarras e a «performance da emoção».
    O silêncio e a atenção do público moldam a experiência («Silêncio, que se vai cantar o
    fado»). Fontes:
    [INET-md](https://www.inetmd.pt/en/projects/fado-in-the-xxth-century-a-multidisciplinary-approach-to-the-study-of-portuguese-intangible-cultural-heritage/);
    [ResearchGate, «Silêncio que se vai cantar o fado»](https://www.researchgate.net/publication/326599060_Silencio_que_se_vai_cantar_o_fado).

**O que isto pede ao algoritmo:**

- no fado triste, tensão que se adia: notas suspensas no fim do verso, uma nota de «dor» antes do
  repouso, o repouso guardado para o fim da estrofe, respirações entre versos;
- no fado alegre, a mesma carga emotiva, mas num ritmo regular que convida a dançar, em modo maior;
- a divisão triste/menor e alegre/maior é uma simplificação (há fados alegres em menor e tristes
  em maior), mas é a mais segura, como o utilizador sugeriu.

## 3. Formas: fado tradicional e fado-canção

- **Fado tradicional:** cerca de 200 melodias fixas, sem letra própria, sobre as quais o fadista
  canta o poema que escolhe («melodia fixa, poema livre»).
  - Nasceu de três fados primitivos: o **Menor** (menor, lento, «matriz fundadora»), o
    **Corrido** (maior, muito rápido) e o **Mouraria** (maior, mais calmo e cantante).
  - Não tem refrão e admite a improvisação melódica, a **«estilação»** (estilar = ornamentar e
    variar), por vezes ao ponto de ser difícil reconhecer a mesma melodia.
  - Fontes: [Fado Tradicional (Wikipedia)](https://en.wikipedia.org/wiki/Fado_Tradicional);
    [Porto Fado](https://portofado.com/blog/o-que-e-fado-tradicional/);
    [Fado Tradicional, lista dos fados](https://fadotradicional.wixsite.com/fadotradicional/lista-dos-fados).
- **Fado-canção:** é de autor e tem refrão (estribilho). Exemplos: «Coimbra», «Uma Casa
  Portuguesa», os fados de Oulman.
- **Métrica dos versos:** regular em todo o tema, de 7, 10 ou 12 sílabas.
  - Predomina a redondilha maior (7 sílabas).
  - O alexandrino (12 sílabas, acentos na 6.ª e na 12.ª) deu origem ao Fado Alexandrino.
  - Fontes: [Rodrigo Costa Félix, A Mensagem](https://amensagem.pt/2022/02/11/o-que-vem-a-ser-isso-do-fado-tradicional-cronica-rodrigo-costa-felix/);
    [Sergl](http://www.musimid.mus.br/3encontro/files/pdf/Marcos%20Julio%20Sergl.pdf).
- **Estrofes:** quadra (a mais comum), quintilha, sextilha ou décima.
  - O Fado Pedro Rodrigues tem versões em quadras, quintilhas e sextilhas; o Fado Cravo e o Fado
    Bacalhau são em sextilhas.
  - Na décima, o fadista repete os dois últimos versos. Nos anos 1930 o mote em sextilha com
    quatro glosas de quinze versos deu lugar a sequências de sextilhas simples.
  - Fontes: [Fado Tradicional, Pedro Rodrigues](https://fadotradicional.wixsite.com/fadostradicionais/pedro-rodrigues-quadras);
    [Métricas estróficas do fado](https://musicastradiconaisdefado.blogspot.com/2020/10/quintilhas.html).
- **Um verso, dois compassos:** cada verso é cantado sobre dois compassos de melodia, alternando
  tónica e dominante (Sergl).
  - A estrofe é uma frase musical completa: períodos de 8 compassos e quadras.
  - Videira & Rosa esperavam frases de 4 ou 8 compassos. Quando uma fonte tinha 9 compassos
    entre outras de 8, tratavam-no como erro de cópia.
  - Fontes: [Sergl](http://www.musimid.mus.br/3encontro/files/pdf/Marcos%20Julio%20Sergl.pdf);
    [Videira & Rosa 2017](https://emusicology.org:443/article/view/5431).
- **Nas partituras do fadado**, verso a verso: Corrido, Menor, Mouraria, Adiça, Dois Tons e Menor
  do Porto têm 4 versos; Bailado e Alberto têm 5; Perseguição tem 6; Rosinha dos Limões tem 8.
  - Quase todos têm 7 sílabas; o Alberto tem 10 e a Rosinha talvez 10.
  - Ver [`harmonias.csv`](harmonias.csv).
- **Fado de Coimbra:**
  - É cantado só por homens, de capa e batina, com mais projeção vocal e volume.
  - Usa mais o compasso ternário, andamentos mais lentos e tonalidades menores; o fado de Lisboa
    é sobretudo binário.
  - A guitarra de Coimbra está afinada um tom abaixo.
  - Tem a serenata como ritual: um galanteio, uma carta de amor cantada.
  - Fontes: [Porto Fado, Coimbra vs Lisboa](https://portofado.com/blog/2022/11/fado-de-coimbra-vs-lisboa-as-diferencas/);
    [Salão Musical](https://www.salaomusical.com/pt/blog-instrumentos-musicais/431_fado-de-lisboa-vs-fado-de-coimbra-guitarras-diferencas-e-semelhancas.html);
    [Coimbra fado (Wikipedia)](https://en.wikipedia.org/wiki/Coimbra_fado).

## 4. Harmonia

- **Ernesto Vieira, *Diccionario Musical* (1890)**, a primeira descrição técnica:
  - um período de oito compassos em 2/4, dividido em dois membros iguais e simétricos, com duas
    melodias cada;
  - preferência pelo modo menor, «embora modulando muitas vezes para o maior, com a mesma ou
    outra melodia»;
  - acompanhamento arpejado em semicolcheias, só com tónica e dominante, alternadas de dois em
    dois compassos.
  - Fontes: [Projeto Fado, FCSH](https://fado.fcsh.unl.pt/projecto/objectivos/);
    [Etnográfica Press, História do fado](https://books.openedition.org/etnograficapress/4114?lang=en).
- **Fados primitivos:** os três têm esquemas rítmicos e harmónicos fixos (I–V). O acompanhamento
  repete um motivo melódico com pequenas variações. Fonte: [Fado (Wikipedia)](https://en.wikipedia.org/wiki/Fado).
- **Os esquemas do fadado** (11 fados; ver `harmonias.csv`):
  - **Primitivos:** Menor, Corrido e Mouraria fazem **I (2 compassos) – V7 (4) – I (2)**, ou seja,
    i–V7–i em 8 compassos.
  - **Fados de autor:** começam igual (i–V7 / V7–i nos dois primeiros versos). No terceiro verso
    saem para a **subdominante**, quase sempre pela tónica maior com sétima, a dominante de iv:
    - **I7 → iv** no Bailado, no Alberto e na Rosinha dos Limões;
    - **VII7 → III → VI** no Alberto e no Dois Tons (a relativa maior);
    - **VII7 VI V** no Menor do Porto, uma descida que lembra a cadência andaluza.
  - **Remate:** todos acabam com a fórmula **i V7 i**.
- **Coimbra:** passa do menor ao **maior homónimo** (mi menor → mi maior), como Vieira descrevia
  em 1890.
- **A «cadência andaluza» e o frígio:** alguns sítios genéricos atribuem-nos ao fado (por exemplo,
  [Cheese & Wine](https://cheese-wine.com/bulletin/portuguese-musical-style-fado)).
  - Nas harmonias reais do fadado só aparece a descida VII–VI–V do Menor do Porto. Não há indício
    de frígio.
  - Por isso **não** se usa como regra.
- **Menor harmónico:** o fado menor usa a sensível (7.º grau elevado). Fonte:
  [Sergl](http://www.musimid.mus.br/3encontro/files/pdf/Marcos%20Julio%20Sergl.pdf).

## 5. Ritmo e andamento

- **Compasso:** binário, 2/4 ou 4/4 (Vieira; Sergl).
  - O fado de Coimbra usa também o ternário.
  - O Fado Bailado tem o nome de uma valsa de Marceneiro («Eterno bailado»), mas está em 4/4 no
    fadado.
- **Andamento:**
  - predominantemente «Andante» (Sergl);
  - o Fado Menor é lento (um exemplo medido: 82 BPM,
    [Tunebat](https://tunebat.com/Info/Fado-Menor-Maria-Teresa-De-Noronha/2UPFMkLJhuxqANmx7HiMx7));
  - o Mouraria é moderado e o Corrido rápido;
  - nas partituras do fadado: Coimbra 𝅗𝅥 = 50 (♩ = 100), Marujo ♩ = 50, Pagem ♩ = 80.
- **Síncopa:** frequente, tanto no desenho rítmico da melodia como no do acompanhamento (Sergl).
  É herança da origem dançada (lundum).
- **Rubato:**
  - As guitarras mantêm o tempo regular. O cantor abranda e acelera, cria expectativas e
    surpreende; a música para no fim da frase e o cantor segura a nota.
  - Amália subordinava o ritmo regular da melodia à dicção do poema, com suspensões inesperadas.
  - Fontes: [Porto Fado](https://portofado.com/blog/2026/06/o-que-e-fado-tradicional/);
    [Fado Tradicional (Wikipedia)](https://en.wikipedia.org/wiki/Fado_Tradicional);
    [Enciclopédia Itaú Cultural, Amália](https://enciclopedia.itaucultural.org.br/pessoas/62557-amalia-rodrigues).
- **Acompanhamento:** a viola marca o ritmo e a harmonia, com o baixo e as passagens entre
  acordes; a guitarra portuguesa responde, comenta ou intensifica o que acabou de ser cantado.
  - O conjunto típico é de duas guitarras portuguesas, uma viola e uma viola-baixo.
  - Fontes: [Portuguese guitar (Wikipedia)](https://en.wikipedia.org/wiki/Portuguese_guitar);
    [Porto Fado, instrumentos](https://portofado.com/blog/2024/08/instrumentos-do-fado-casa-da-guitarra/);
    [Técnicas da viola de fado](https://violadefado.wordpress.com/tecnicas-da-viola-de-fado/).

## 6. Melodia e ornamentação

- **Âmbito:** a voz de Amália foi descendo ao longo da carreira, do registo agudo ao de
  mezzo-soprano (anos 1960–70) e ao de contralto (desde os anos 1980). Fonte:
  [Itaú Cultural](https://enciclopedia.itaucultural.org.br/pessoas/62557-amalia-rodrigues).
- **Melismas:** Amália criou uma ornamentação de pequenos melismas, que lembram o cante
  andaluz/cigano e o canto mourisco, e usava glissando e rubato.
  - Ultrapassava a isometria dos versos, adaptando o ritmo da melodia a métricas irregulares.
  - Juntou ornamentos das canções da Beira Baixa.
  - Uma das suas inovações foi o melisma sobre uma única palavra ou sílaba.
  - Fontes: [Itaú Cultural](https://enciclopedia.itaucultural.org.br/pessoas/62557-amalia-rodrigues);
    [NPR, «The Voice of Extreme Expression»](https://www.npr.org/2010/10/18/130357207/amalia-rodrigues-the-voice-of-extreme-expression);
    [García Pindado 2015, *La voz del Fado* (TFG, Univ. Valladolid)](https://uvadoc.uva.es/handle/10324/15507).
- **«Estilar»:** improvisar com ornamentos. Fonte:
  [Fado Route, Visit Lisboa](https://www.visitlisboa.com/en/lisbon-stories/1-ruta-de-fado).
  - **Fado vadio:** o improvisado, sobretudo por amadores e sem paga.
  - **Desgarrada:** o desafio cantado entre fadistas, que improvisam versos em resposta uns aos
    outros. Fonte: [Desgarrada (Wikipedia)](https://en.wikipedia.org/wiki/Desgarrada).
- **Notas rápidas:**
  - Não há fonte que as quantifique, mas o utilizador nota que são raras, embora apareçam em
    Amália.
  - As partituras confirmam as duas coisas: as notas rápidas aparecem em **grupos curtos**, como
    ornamento antes da nota longa ou como recitação silábica em tercinas sobre uma nota repetida,
    e não em escalas longas. Ver [`../fado.md`](../fado.md).

## 7. A voz do fado (estudos acústicos)

- **Mendes et al.** estudaram 104 fadistas (47 homens e 57 mulheres; 90 amadores e 14
  profissionais) [(J. Voice 2013)](https://www.sciencedirect.com/science/article/abs/pii/S0892199712001622);
  [Repositório Comum](https://comum.rcaap.pt/entities/publication/05ec5276-cc22-463a-8186-d27a94c45854).
  - A voz é percebida como grave, rouca e tensa, com F0, jitter e shimmer característicos.
  - Há **vibrato** na maioria dos cantores:
    - homens: 5,49–6,82 Hz, com amplitude de 0,28–0,59 meio-tom;
    - mulheres: 5,23–5,99 Hz, com amplitude de 0,29–0,54 meio-tom.

    É um vibrato **estreito**, menos de um quarto de tom para cada lado.
  - O formante do cantor (o «brilho» lírico) raramente aparece.
- **O fado-canção de Coimbra** foi estudado pelo espectro médio (LTAS). Fonte:
  [J. Voice 2021](https://www.sciencedirect.com/science/article/pii/S0892199721001041).
- **Emoção no canto em geral** (Scherer et al. 2017, JASA): a tristeza e a ternura têm intensidade
  e dinâmica baixas; a raiva, a alegria e o orgulho têm intensidade alta.
  - Para o fado, isto quer dizer que a alegria se canta mais forte e a tristeza mais contida, com
    picos expressivos. Fonte:
    [JASA 142(4)](https://pubs.aip.org/asa/jasa/article/142/4/1805/852940/The-expression-of-emotion-in-the-singing-voice).

## 8. Dinâmica

- **Sergl** (*O Fado: características melódicas, rítmicas e de performance*):
  - a intensidade da voz varia muito, com **quedas de dinâmica bruscas** ou ênfase na entoação de
    certas palavras, e isso cria «um universo muito rico de intenções emocionais»;
  - em todos os fados, a última estrofe é anunciada por uma **suspensão na nota mais alta (o
    ápice) da frase**. Depois a voz recomeça com ênfase e uma ligeira aceleração, com um
    **crescendo** reforçado pelas guitarras em *forte*.
  - Fontes: [MusiMid](http://www.musimid.mus.br/3encontro/files/pdf/Marcos%20Julio%20Sergl.pdf);
    [Portal do Fado](https://www.portaldofado.net/components/com_fireboard/uploaded/files/Origem_do_fado.pdf).
- **A descrição do utilizador** («Fado Português», versão de Amália), uma leitura da
  interpretação:
  - «O fado» com vibrato;
  - «nasceu um dia» mais forte, a terminar em piano (uma *messa di voce* invertida: começa
    intenso e apaga-se);
  - «quando o vento **mal** bulia» com um som de dor e agonia no «mal», um acento numa palavra;
  - «e o céu o **maaar** prolongava» com exasperação, som intenso e a vogal prolongada: o ápice
    suspenso.
- ***Messa di voce*:** crescendo e diminuendo numa só nota. É técnica de canto lírico; no fado
  aparece sobretudo como o apagar da nota longa no fim do verso. Fonte:
  [Messa di voce (Wikipedia)](https://en.wikipedia.org/wiki/Messa_di_voce).

**Pergunta do utilizador: dá para ter esta tensão sem crescendos e diminuendos?** A resposta está
em [`../fado.md`](../fado.md), secção «Dinâmica». Em resumo:

- parte da tensão está nas notas: o ápice, a nota suspensa, o ♭6 que resolve no 5.º, a
  antecipação;
- a outra parte, a nota que se apaga, o acento de dor numa palavra e o *forte* do último verso, só
  existe com dinâmica;
- por isso a dinâmica foi ativada **só para o fado**.

## 9. Estudos computacionais

- **Classificação de áudio:** Antunes, Martins de Matos, Ribeiro & Trancoso (2014) classificaram
  automaticamente fado em áudio (MFCC, energia, duas bandas de frequência), com 97,6 % de acerto
  em validação cruzada de 10 partes. Concluem que o fado é um estilo muito distinto. Fonte:
  [arXiv:1406.4447](https://arxiv.org/abs/1406.4447).
- **Arquivo de transcrições:** Videira & Rosa (2017), «A New Online Archive of Encoded Fado
  Transcriptions» (*Empirical Musicology Review*).
  - São 100 transcrições codificadas em PDF e MIDI, normalizadas ao modelo de Ernesto Vieira:
    compasso binário, unidade de tempo a semínima.
  - A consistência interna foi testada com um classificador supervisionado.
  - Fontes: [EMR](https://emusicology.org:443/article/view/5431);
    [ResearchGate](https://www.researchgate.net/publication/325981875_A_New_Online_Archive_of_Encoded_Fado_Transcriptions).
- **Geração:** Videira (2015), *Instrumental Fado: a generative interactive system* (NOVA FCSH),
  um modelo teórico e um sistema que gera música instrumental a partir do corpus. Fonte:
  [RUN](https://run.unl.pt/handle/10362/16277).
- **Letras:** Oliveira (IST), *Automatic Creation of Fado Songs*, gera letras de fado com LSTM,
  esquema de rimas e tema. Fonte:
  [resumo](https://fenix.tecnico.ulisboa.pt/downloadFile/1970719973969005/89504-Mariana-Oliveira-resumo.pdf).

Nenhum destes trabalhos foi copiado: deles só se tiram factos (o modelo de Vieira, as frases de 4
e 8 compassos, o vibrato medido). As regras e o código deste projeto são próprios.
