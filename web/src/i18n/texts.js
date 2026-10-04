// Every text of the page, in every language — the ONE place to translate it (src/i18n/i18n.js).
//
// One entry per text: 'key': { pt: '…', en: '…' }. "{name}" is filled by the page
// (t('key', {name: …})); entries ending in .one / .other are the singular and plural (tn()).
// Texts shown as HTML (data-i18n-html, the About tab…) may contain markup.
//
// To add a language: add it to LANGUAGES (id = the code used in the entries, name = how it is
// shown in the language menu, locale = for numbers) and give the entries a field with that code.
// Entries without it are shown in Portuguese.

export const LANGUAGES = [
  { id: 'pt', name: 'Português', locale: 'pt-PT' },
  { id: 'en', name: 'English', locale: 'en-GB' },
];

export const TEXTS = {
  // ------------------------------------------------------------------ page, header and tabs
  'app.title': { pt: 'Ondas Atratoras', en: 'Attractor Waves' },
  'app.subtitle': {
    pt: 'Algoritmo genético de composição melódica com ondas atratoras (Luz & Silva, IPCA 2020), versão web com extensões da literatura, cânones à Telemann e avaliação objetiva.',
    en: 'A genetic algorithm for melodic composition with attractor waves (Luz & Silva, IPCA 2020), web version with extensions from the literature, Telemann-style canons and objective evaluation.',
  },
  'lang.label': { pt: 'Língua', en: 'Language' },
  'nav.sections': { pt: 'Secções', en: 'Sections' },
  'tab.compose': { pt: 'Compor', en: 'Compose' },
  'tab.explore': { pt: 'Explorar', en: 'Explore' },
  'tab.vary': { pt: 'Variações', en: 'Variations' },
  'tab.analyze': { pt: 'Analisar', en: 'Analyse' },
  'tab.evaluate': { pt: 'Avaliar', en: 'Evaluate' },
  'tab.about': { pt: 'Sobre', en: 'About' },

  // ------------------------------------------------------------------ stage (score, piano roll, transport)
  'stage.aria': { pt: 'Partitura', en: 'Score' },
  'piece.example': { pt: 'Exemplo', en: 'Example' },
  'example.title': { pt: 'Exemplo · campo de atratores (arco de frase), Sol maior, semente 7', en: 'Example · attractor field (phrase arch), G major, seed 7' },
  'roll.aria': { pt: 'Piano roll com as notas e as ondas atratoras', en: 'Piano roll with the notes and the attractor waves' },
  'score.aria': { pt: 'Partitura', en: 'Score' },
  'lily.summary': { pt: 'Código LilyPond', en: 'LilyPond code' },
  'lily.aria': { pt: 'Código LilyPond da peça', en: 'LilyPond code of the piece' },
  'lily.note': {
    pt: 'Compile com <code>lilypond peca.ly</code> para obter o PDF gravado pelo próprio LilyPond.',
    en: 'Compile with <code>lilypond piece.ly</code> to get the PDF engraved by LilyPond itself.',
  },
  'common.copy': { pt: 'Copiar', en: 'Copy' },
  'common.stop': { pt: 'Parar', en: 'Stop' },
  'copy.done': { pt: 'Copiado.', en: 'Copied.' },
  'copy.selected': { pt: 'Selecionado: use Ctrl+C / ⌘C para copiar.', en: 'Selected: use Ctrl+C / ⌘C to copy.' },
  'view.aria': { pt: 'Vista', en: 'View' },
  'view.roll': { pt: 'Piano roll', en: 'Piano roll' },
  'view.score': { pt: 'Partitura', en: 'Score' },
  'play.play': { pt: '▶ Tocar', en: '▶ Play' },
  'play.stop': { pt: '■ Parar', en: '■ Stop' },
  'transport.tempo': { pt: 'Tempo', en: 'Tempo' },
  'transport.tempo.title': { pt: 'Semínimas por minuto', en: 'Quarter notes per minute' },
  'transport.allVoices': { pt: 'Tocar com todas as vozes', en: 'Play all the voices' },
  'transport.midi': { pt: 'Descarregar MIDI', en: 'Download MIDI' },
  'transport.staves': { pt: 'Pautas', en: 'Staves' },
  'transport.staves.title': {
    pt: 'Na partitura, no PDF e no LilyPond: uma pauta por voz, ou o cânone numa só linha com números onde cada voz entra',
    en: 'In the score, the PDF and LilyPond: one staff per voice, or the canon on a single line with numbers where each voice comes in',
  },
  'transport.staves.each': { pt: 'uma por voz', en: 'one per voice' },
  'transport.staves.line': { pt: 'uma linha, com as entradas', en: 'one line, with the entries' },
  'transport.pdf': { pt: 'PDF', en: 'PDF' },
  'transport.pdf.title': { pt: 'Partitura em PDF (A4, vetorial), com a escolha de pautas', en: 'Score as a PDF (A4, vector), with the choice of staves' },
  'transport.qr': { pt: 'QR no PDF', en: 'QR in the PDF' },
  'transport.qr.title': {
    pt: 'Desenha no fim da partitura um QR code denso com o ficheiro MIDI: a câmara de um telemóvel abre no navegador um leitor que toca a música, sem instalar nada',
    en: 'Draws at the end of the score a dense QR code with the MIDI file: a phone camera opens in the browser a player that plays the piece, with nothing to install',
  },
  'transport.qrBase.title': {
    pt: 'Endereço do leitor que o QR e a ligação abrem (em branco: o tocar.html ao lado desta página, se estiver na web, ou senão o do repositório servido pelo raw.githack.com)',
    en: 'Address of the player the QR code and the link open (blank: the tocar.html next to this page when it is on the web, or else the one in the repository served by raw.githack.com)',
  },
  'transport.link': { pt: 'Copiar ligação', en: 'Copy link' },
  'transport.link.title': {
    pt: 'Copia uma ligação que traz a música dentro do próprio endereço (a mesma do QR code): abre o leitor no navegador, que a toca',
    en: 'Copies a link that carries the piece inside the address itself (the same as the QR code): it opens the player in the browser, which plays it',
  },
  'transport.open': { pt: 'Abrir PDF ou MIDI…', en: 'Open PDF or MIDI…' },
  'transport.open.title': {
    pt: 'Recupera uma peça a partir de um PDF ou de um MIDI exportados por esta página (o PDF traz o MIDI anexado, e o MIDI traz a peça e as definições)',
    en: 'Brings back a piece from a PDF or a MIDI file exported by this page (the PDF carries the MIDI file attached, and the MIDI file carries the piece and its settings)',
  },
  // ------------------------------------------------------------------ the player a QR code opens (tocar.html)
  'player.loading': { pt: 'A abrir a música…', en: 'Opening the piece…' },
  'player.roll': { pt: 'As notas de cada voz', en: 'The notes of every voice' },
  'player.download': { pt: 'Descarregar MIDI', en: 'Download MIDI' },
  'player.openApp': { pt: 'Abrir em Ondas Atratoras', en: 'Open in Attractor Waves' },
  'player.privacy': {
    pt: 'A música vem dentro do próprio endereço (depois de #): nada foi enviado a um servidor. O MIDI descarregado toca no leitor de música do Android; no iPhone, numa app de MIDI.',
    en: 'The piece comes inside the address itself (after #): nothing was sent to a server. The downloaded MIDI file plays in Android’s music player; on an iPhone, in a MIDI app.',
  },
  'player.meta': { pt: '{meter} · {bars} compassos · {voices} · {time}', en: '{meter} · {bars} bars · {voices} · {time}' },
  'player.voices.one': { pt: '{n} voz', en: '{n} voice' },
  'player.voices.other': { pt: '{n} vozes', en: '{n} voices' },
  'player.untitled': { pt: 'Música', en: 'Piece' },
  'player.saved': { pt: 'MIDI descarregado.', en: 'MIDI file downloaded.' },
  'player.none': { pt: 'Nenhuma música neste endereço', en: 'No piece in this address' },
  'player.noneHint': {
    pt: 'Esta página toca a música que vem num QR code ou numa ligação das partituras de Ondas Atratoras.',
    en: 'This page plays the piece carried by a QR code or a link from an Attractor Waves score.',
  },
  'player.ready': { pt: 'Carregue em ▶ Tocar para ouvir.', en: 'Press ▶ Play to listen.' },
  'player.error': { pt: 'Não foi possível ler a música', en: 'Could not read the piece' },
  'player.oldBrowser': {
    pt: 'Este navegador não descomprime a música (é preciso Safari 16.4, Chrome 103 ou Firefox 113, ou mais recentes).',
    en: 'This browser cannot decompress the piece (Safari 16.4, Chrome 103 or Firefox 113, or newer, is needed).',
  },
  'transport.lily': { pt: 'LilyPond (.ly)', en: 'LilyPond (.ly)' },
  'transport.lily.title': { pt: 'Código LilyPond (.ly) da peça, com a escolha de pautas', en: 'LilyPond code (.ly) of the piece, with the choice of staves' },

  // ------------------------------------------------------------------ Compose: quick setup and piece
  'quick.title': { pt: 'Configuração rápida', en: 'Quick setup' },
  'quick.hint': {
    pt: 'Escolha a tonalidade e as vozes; o resto pode ser sugerido. Os botões são opcionais e só mudam os campos abaixo.',
    en: 'Choose the key and the voices; the rest can be suggested. The buttons are optional and only change the fields below.',
  },
  'quick.auto': { pt: 'Auto-configurar', en: 'Auto-configure' },
  'quick.auto.title': {
    pt: 'Ondas ajustadas ao registo dos instrumentos e ao cânone; forma, pesos e algoritmo por critérios gerais',
    en: 'Waves fitted to the instruments’ register and to the canon; form, weights and algorithm by general criteria',
  },
  'quick.surprise': { pt: 'Surpreende-me', en: 'Surprise me' },
  'quick.surprise.title': { pt: 'Tonalidade, vozes, ondas e forma ao acaso, dentro de valores sensatos', en: 'Key, voices, waves and form at random, within sensible values' },
  'quick.reset': { pt: 'Repor', en: 'Reset' },
  'piece.title': { pt: 'Peça', en: 'Piece' },
  'piece.model': { pt: 'Modelo', en: 'Model' },
  'model.field': { pt: 'Campo de atratores (novo)', en: 'Attractor field (new)' },
  'model.classic': { pt: 'Clássico (regras do C# original)', en: 'Classic (rules of the original C#)' },
  'mode.label.field': { pt: 'Campo de atratores', en: 'Attractor field' },
  'mode.label.classic': { pt: 'Clássico', en: 'Classic' },
  'piece.key': { pt: 'Tonalidade', en: 'Key' },
  'piece.mode': { pt: 'Modo tonal', en: 'Mode' },
  'mode.major': { pt: 'Maior', en: 'Major' },
  'mode.minor': { pt: 'Menor', en: 'Minor' },
  'mode.major.lower': { pt: 'maior', en: 'major' },
  'mode.minor.lower': { pt: 'menor', en: 'minor' },
  'piece.meter': { pt: 'Compasso', en: 'Time signature' },
  'piece.bars': { pt: 'Compassos', en: 'Bars' },
  'piece.form': { pt: 'Forma musical', en: 'Form' },
  'piece.phrase': { pt: 'Frase (compassos)', en: 'Phrase (bars)' },
  'form.free': { pt: 'Livre', en: 'Free' },
  'bars.hint': {
    pt: 'Com {bars} compassos cada geração demora cerca de {x}× mais do que com 8 ({time} com os valores por omissão). A partitura divide-se em linhas e em páginas; no piano roll os compassos ficam estreitos.',
    en: 'With {bars} bars each run takes about {x}× longer than with 8 ({time} with the default values). The score is split into lines and pages; in the piano roll the bars become narrow.',
  },
  'bars.hint.time64': { pt: '1 a 2 minutos', en: '1 to 2 minutes' },
  'bars.hint.time32': { pt: 'meio minuto a um minuto', en: 'half a minute to a minute' },
  'meter.hint.classic': { pt: 'O modelo clássico reproduz o programa original, que só escreve em 4/4.', en: 'The classic model reproduces the original program, which only writes in 4/4.' },
  'meter.hint.compound': {
    pt: 'Compasso composto: cada tempo é uma semínima com ponto, dividida em três colcheias. Figuras e ligações aprendidas em melodias reais em {meter} (results/meters).',
    en: 'Compound time: each beat is a dotted quarter, divided into three eighths. Figures and links learned from real melodies in {meter} (results/meters).',
  },
  'meter.hint.simple': {
    pt: 'Compasso simples: cada tempo é uma semínima, dividida em duas colcheias. Figuras e ligações aprendidas em melodias reais em {meter} (results/meters).',
    en: 'Simple time: each beat is a quarter note, divided into two eighths. Figures and links learned from real melodies in {meter} (results/meters).',
  },
  'meter.hint.from68': { pt: '6/8 (há poucas em 12/8)', en: '6/8 (there are few in 12/8)' },
  'meter.hint.and22': { pt: '{meter} e 2/2', en: '{meter} and 2/2' },
  'meter.hint.short': {
    pt: ' {bars} compassos de {meter} são só {beats} tempos (8 de 4/4 são 32): aumente os compassos para uma melodia mais longa.',
    en: ' {bars} bars of {meter} are only {beats} beats (8 of 4/4 are 32): increase the bars for a longer melody.',
  },
  'meter.2/4': { pt: '2/4 · dois tempos de semínima', en: '2/4 · two quarter-note beats' },
  'meter.3/4': { pt: '3/4 · três tempos de semínima (valsa, minueto)', en: '3/4 · three quarter-note beats (waltz, minuet)' },
  'meter.4/4': { pt: '4/4 · quatro tempos de semínima', en: '4/4 · four quarter-note beats' },
  'meter.3/8': { pt: '3/8 · composto, um tempo de semínima com ponto', en: '3/8 · compound, one dotted-quarter beat' },
  'meter.6/8': { pt: '6/8 · composto, dois tempos de três colcheias (jiga)', en: '6/8 · compound, two beats of three eighths (jig)' },
  'meter.9/8': { pt: '9/8 · composto, três tempos de três colcheias (slip jig)', en: '9/8 · compound, three beats of three eighths (slip jig)' },
  'meter.12/8': { pt: '12/8 · composto, quatro tempos de três colcheias', en: '12/8 · compound, four beats of three eighths' },

  // ------------------------------------------------------------------ voices, instruments, intervals
  'voices.title': { pt: 'Vozes e cânone', en: 'Voices and canon' },
  'voices.ensemble': { pt: 'Conjunto', en: 'Ensemble' },
  'voices.circular': { pt: 'Ronda circular (a melodia recomeça e as vozes nunca param)', en: 'Circular round (the melody starts again and the voices never stop)' },
  'ensemble.custom': { pt: 'Personalizado', en: 'Custom' },
  'voice.melody': { pt: 'Voz 1 (melodia)', en: 'Voice 1 (melody)' },
  'voice.n': { pt: 'Voz {n}', en: 'Voice {n}' },
  'voice.play': { pt: ' tocar', en: ' play' },
  'voice.entry': { pt: 'entra no c. {bar}', en: 'enters at bar {bar}' },
  'voice.entryAria': { pt: 'Entrada da voz {n}', en: 'Entry of voice {n}' },
  'voice.intervalAria': { pt: 'Intervalo da voz {n}', en: 'Interval of voice {n}' },
  'voice.instrumentAria': { pt: 'Instrumento', en: 'Instrument' },
  'voices.hint.range': { pt: 'Registo possível para a melodia com estes instrumentos: {lo}–{hi}.', en: 'Possible register for the melody with these instruments: {lo}–{hi}.' },
  'voices.hint.canon': {
    pt: ' O contraponto entre as vozes entra na aptidão e na população inicial desde a 1.ª geração.',
    en: ' The counterpoint between the voices is part of the fitness and of the initial population from the first generation.',
  },
  'voices.hint.double': { pt: ' Atenção: duas vozes entram no mesmo compasso (dobram-se).', en: ' Note: two voices enter in the same bar (they double each other).' },
  'voices.hint.late': {
    pt: ' Atenção: há uma voz que entra depois de a melodia acabar; aumente o número de compassos.',
    en: ' Note: one voice enters after the melody ends; increase the number of bars.',
  },
  'instrument.violin': { pt: 'Violino', en: 'Violin' },
  'instrument.viola': { pt: 'Viola', en: 'Viola' },
  'instrument.cello': { pt: 'Violoncelo', en: 'Cello' },
  'instrument.bass': { pt: 'Contrabaixo', en: 'Double bass' },
  'instrument.flute': { pt: 'Flauta transversal', en: 'Flute' },
  'instrument.recorder': { pt: 'Flauta de bisel (contralto)', en: 'Recorder (alto)' },
  'instrument.oboe': { pt: 'Oboé', en: 'Oboe' },
  'instrument.clarinet': { pt: 'Clarinete', en: 'Clarinet' },
  'instrument.bassoon': { pt: 'Fagote', en: 'Bassoon' },
  'instrument.horn': { pt: 'Trompa', en: 'Horn' },
  'instrument.trumpet': { pt: 'Trompete', en: 'Trumpet' },
  'instrument.harpsichord': { pt: 'Cravo', en: 'Harpsichord' },
  'instrument.piano': { pt: 'Piano', en: 'Piano' },
  'instrument.organ': { pt: 'Órgão', en: 'Organ' },
  'instrument.soprano': { pt: 'Soprano', en: 'Soprano' },
  'instrument.alto': { pt: 'Contralto', en: 'Alto' },
  'instrument.tenor': { pt: 'Tenor', en: 'Tenor' },
  'instrument.bassVoice': { pt: 'Baixo', en: 'Bass' },
  'family.strings': { pt: 'Cordas', en: 'Strings' },
  'family.winds': { pt: 'Sopros', en: 'Woodwinds' },
  'family.brass': { pt: 'Metais', en: 'Brass' },
  'family.keys': { pt: 'Teclas', en: 'Keyboards' },
  'family.voices': { pt: 'Vozes', en: 'Voices' },
  'ensemble.solo': { pt: 'Só a melodia', en: 'Melody only' },
  'ensemble.telemann': { pt: 'Telemann: 2 violinos, 2.º entra no c. 2', en: 'Telemann: 2 violins, the 2nd enters at bar 2' },
  'ensemble.flutes': { pt: 'Telemann: 2 flautas, 2.º entra no c. 2', en: 'Telemann: 2 flutes, the 2nd enters at bar 2' },
  'ensemble.trio': { pt: 'Trio: violino, viola (c. 3), violoncelo 8.ª abaixo (c. 5)', en: 'Trio: violin, viola (bar 3), cello an octave below (bar 5)' },
  'ensemble.round': { pt: 'Ronda a 3 vozes (soprano, contralto, tenor), entradas a cada 2 c.', en: '3-voice round (soprano, alto, tenor), entries every 2 bars' },
  'ensemble.fifth': { pt: 'Cânone à 5.ª: oboé e fagote (5.ª abaixo, c. 2)', en: 'Canon at the fifth: oboe and bassoon (5th below, bar 2)' },
  'interval.unison': { pt: 'Uníssono', en: 'Unison' },
  'interval.octaveUp': { pt: '8.ª acima', en: 'Octave above' },
  'interval.octaveDown': { pt: '8.ª abaixo', en: 'Octave below' },
  'interval.twoOctavesDown': { pt: '2 oitavas abaixo', en: '2 octaves below' },
  'interval.fifthDown': { pt: '5.ª abaixo (diatónica)', en: '5th below (diatonic)' },
  'interval.fifthUp': { pt: '5.ª acima (diatónica)', en: '5th above (diatonic)' },
  'interval.fourthDown': { pt: '4.ª abaixo (diatónica)', en: '4th below (diatonic)' },
  'interval.fifthDown.score': { pt: '5.ª abaixo (na escala)', en: '5th below (in the scale)' },
  'interval.fifthUp.score': { pt: '5.ª acima (na escala)', en: '5th above (in the scale)' },
  'interval.fourthDown.score': { pt: '4.ª abaixo (na escala)', en: '4th below (in the scale)' },

  // ------------------------------------------------------------------ attractor waves
  'waves.title': { pt: 'Ondas atratoras', en: 'Attractor waves' },
  'waves.preset': { pt: 'Predefinição', en: 'Preset' },
  'waves.def': { pt: 'Altura definida por', en: 'Height given by' },
  'waves.def.meanAmp': { pt: 'valor médio ± amplitude', en: 'mean ± amplitude' },
  'waves.def.minMax': { pt: 'mínimo e máximo', en: 'minimum and maximum' },
  'waves.add': { pt: '+ Onda', en: '+ Wave' },
  'waves.auto': { pt: 'Ondas ← instrumentos', en: 'Waves ← instruments' },
  'waves.auto.title': { pt: 'Uma onda que cabe no registo comum de todas as vozes', en: 'One wave that fits the common register of all the voices' },
  'waves.real': { pt: 'Ondas ← melodia real', en: 'Waves ← real melody' },
  'waves.real.title': { pt: 'Ajusta ondas a uma melodia real do corpus e transpõe-as', en: 'Fits waves to a real melody of the corpus and transposes them' },
  'waves.fromReal': {
    pt: 'Ondas ajustadas a «{title}» ({source}), transpostas para a tonalidade e o registo atuais. ',
    en: 'Waves fitted to “{title}” ({source}), transposed to the current key and register. ',
  },
  'waves.hint.out': {
    pt: 'Onda fora do registo possível ({lo}–{hi}): as notas vão ser puxadas para fora do alcance dos instrumentos.',
    en: 'A wave is outside the possible register ({lo}–{hi}): notes will be pulled out of the instruments’ reach.',
  },
  'waves.hint.ok': {
    pt: 'As ondas cabem no registo possível ({lo}–{hi}). A linha tracejada na partitura mostra-as antes de gerar.',
    en: 'The waves fit the possible register ({lo}–{hi}). The dashed line on the score shows them before generating.',
  },
  'preset.custom': { pt: 'Personalizado', en: 'Custom' },
  'wpre.original': { pt: 'Original (2 senos do C#)', en: 'Original (the 2 sines of the C#)' },
  'wpre.arch': { pt: 'Arco de frase (Huron)', en: 'Phrase arch (Huron)' },
  'wpre.pink': { pt: 'Flutuação 1/f (Voss & Clarke)', en: '1/f fluctuation (Voss & Clarke)' },
  'wpre.rossler': { pt: 'Atrator de Rössler', en: 'Rössler attractor' },
  'wpre.lorenz': { pt: 'Atrator de Lorenz (2 registos)', en: 'Lorenz attractor (2 registers)' },
  'wpre.compound': { pt: 'Melodia composta (2 vozes, cf. Bach)', en: 'Compound melody (2 voices, cf. Bach)' },
  'wpre.canon': { pt: 'Cânone: seno com período = nº de vozes × entrada', en: 'Canon: sine with period = no. of voices × entry' },
  'wtype.sine': { pt: 'Seno', en: 'Sine' },
  'wtype.arch': { pt: 'Arco de frase', en: 'Phrase arch' },
  'wtype.pink': { pt: 'Flutuação 1/f', en: '1/f fluctuation' },
  'wtype.rossler': { pt: 'Atrator de Rössler', en: 'Rössler attractor' },
  'wtype.lorenz': { pt: 'Atrator de Lorenz', en: 'Lorenz attractor' },
  'wtype.flat': { pt: 'Constante (tessitura)', en: 'Constant (tessitura)' },
  'basin.gaussian': { pt: 'Gaussiana', en: 'Gaussian' },
  'basin.gravity': { pt: 'Gravitacional 1/(1+d²)', en: 'Gravitational 1/(1+d²)' },
  'basin.step': { pt: 'Degraus (C#)', en: 'Steps (C#)' },
  'wave.n': { pt: 'Onda {n}', en: 'Wave {n}' },
  'wave.typeAria': { pt: 'Tipo da onda {n}', en: 'Type of wave {n}' },
  'wave.remove': { pt: 'Remover onda', en: 'Remove wave' },
  'wave.removeAria': { pt: 'Remover onda {n}', en: 'Remove wave {n}' },
  'wave.flat': { pt: 'sem oscilação', en: 'no oscillation' },
  'wave.cycle': { pt: '1 ciclo em {bars} c.', en: '1 cycle in {bars} bars' },
  'wave.freq': { pt: 'Frequência (ciclos/compasso)', en: 'Frequency (cycles/bar)' },
  'wave.phase': { pt: 'Desfasamento (tempos)', en: 'Phase shift (beats)' },
  'wave.phaseRandom': { pt: 'início aleatório (atrator)', en: 'random start (attractor)' },
  'wave.phaseHint': { pt: 'desloca a onda no tempo', en: 'shifts the wave in time' },
  'wave.min': { pt: 'Mínimo (MIDI)', en: 'Minimum (MIDI)' },
  'wave.max': { pt: 'Máximo (MIDI)', en: 'Maximum (MIDI)' },
  'wave.mean': { pt: 'Valor médio (MIDI)', en: 'Mean (MIDI)' },
  'wave.amp': { pt: 'Amplitude (± semitons)', en: 'Amplitude (± semitones)' },
  'wave.ampHint': { pt: 'metade da variação', en: 'half the swing' },
  'wave.basin': { pt: 'Bacia σ (semitons)', en: 'Basin σ (semitones)' },
  'wave.basinHint': { pt: 'alcance da atração', en: 'reach of the attraction' },
  'wave.shape': { pt: 'Forma da bacia', en: 'Basin shape' },
  'wave.shapeHint': { pt: 'como a atração decai', en: 'how the attraction decays' },

  // ------------------------------------------------------------------ classic mode: presets, waves, constants
  'classic.presets.title': { pt: 'Combinações de partida', en: 'Starting combinations' },
  'classic.presets.hint': {
    pt: 'Valores do algoritmo original escolhidos por um estudo com música real (desenho de experiências e calibração inversa; <code>web/results/classic-study.md</code>). Mudam os pesos, as ondas, as constantes e o AG; a tonalidade, os compassos e a semente ficam.',
    en: 'Values of the original algorithm chosen by a study with real music (design of experiments and inverse calibration; <code>web/results/classic-study.md</code>). They change the weights, the waves, the constants and the GA; the key, the bars and the seed stay.',
  },
  'classic.ops': { pt: 'Afinada para', en: 'Tuned for' },
  'ops.musical': { pt: 'operadores musicais (soa melhor)', en: 'musical operators (sounds better)' },
  'ops.binary': { pt: 'operadores de bits (os do original)', en: 'bit operators (those of the original)' },
  'ops.musicalShort': { pt: 'operadores musicais', en: 'musical operators' },
  'ops.binaryShort': { pt: 'operadores de bits', en: 'bit operators' },
  'classic.waves.title': { pt: 'Ondas atratoras (como no programa original)', en: 'Attractor waves (as in the original program)' },
  'classic.waves.hint': {
    pt: 'Os campos do formulário do C# para as duas ondas senoidais W1 e W2: <code>valor médio + amplitude · sen(2π · i / período + 2π · desfasamento / 16)</code>, em semicolcheias. Valores inteiros como no original, exceto os períodos. Os pesos das regras «Onda 1» e «Onda 2» estão em «Pesos das regras». As vozes definem as distâncias da auto-harmonização e a reprodução.',
    en: 'The fields of the C# form for the two sine waves W1 and W2: <code>mean + amplitude · sin(2π · i / period + 2π · shift / 16)</code>, in sixteenths. Whole numbers as in the original, except the periods. The weights of the rules “Wave 1” and “Wave 2” are under “Rule weights”. The voices set the distances of the self-harmonisation and the playback.',
  },
  'classic.consts.title': { pt: 'Constantes que o original fixava no código', en: 'Constants the original fixed in the code' },
  'classic.fixLapses': {
    pt: 'Corrigir os lapsos do original (7 regras que não faziam o que o próprio código ou relatório descreve; ver «Sobre»)',
    en: 'Fix the original’s lapses (7 rules that did not do what the code itself or the report describes; see “About”)',
  },
  'classic.firstRun': { pt: 'Simular a 1.ª execução do original (a onda 1 fica uma linha plana no gene 0)', en: 'Simulate the original’s first run (wave 1 is a flat line at gene 0)' },
  'classic.resetOriginal': { pt: 'Repor os valores do original', en: 'Restore the original values' },
  'classic.presetCustom': { pt: 'Valores alterados à mão.', en: 'Values changed by hand.' },
  'cwave.title': { pt: 'Onda {n} (W{n})', en: 'Wave {n} (W{n})' },
  'cwave.periods': { pt: 'Períodos por compasso', en: 'Periods per bar' },
  'cwave.mean': { pt: 'Valor médio (meios-tons, Lá4 = 0)', en: 'Mean (semitones, A4 = 0)' },
  'cwave.amp': { pt: 'Amplitude (meios-tons)', en: 'Amplitude (semitones)' },
  'cwave.ampHint': { pt: 'a onda vai de −A a +A', en: 'the wave goes from −A to +A' },
  'cwave.basin': { pt: 'Bacia de atração (meios-tons)', en: 'Attraction basin (semitones)' },
  'cwave.basinHint': { pt: 'nota a ≤ ½: +3, ≤ 1: +1, ≤ 1½: −4,1, além: −6,2', en: 'note at ≤ ½: +3, ≤ 1: +1, ≤ 1½: −4.1, beyond: −6.2' },
  'cwave.shift': { pt: 'Desfasamento horizontal', en: 'Horizontal shift' },
  'cwave.phase': { pt: 'fase de {deg}°', en: 'phase {deg}°' },
  'consts.range': { pt: 'Âmbito atrator (± meios-tons à volta do Lá4)', en: 'Attracting range (± semitones around A4)' },
  'consts.rangeHint': { pt: 'original: 15 (+10 nas primeiras avaliações)', en: 'original: 15 (+10 in the first evaluations)' },
  'consts.balMin': { pt: 'Pausas + prolongamentos: mínimo (%)', en: 'Rests + prolongations: minimum (%)' },
  'consts.balMinHint': { pt: 'original: 7', en: 'original: 7' },
  'consts.balMax': { pt: 'Pausas + prolongamentos: máximo (%)', en: 'Rests + prolongations: maximum (%)' },
  'consts.balMaxHint': { pt: 'original: 40 (real: 55–80 nas canções)', en: 'original: 40 (real songs: 55–80)' },
  'cpreset.original': { pt: 'Original (2020)', en: 'Original (2020)' },
  'cpreset.original.hint': {
    pt: 'Os valores do programa original. Com operadores de bits: ~2,7 notas por tempo, âmbito de ~36 meios-tons, crítico 0. Com operadores musicais: crítico 0,95, mas raramente acaba na tónica (17 %) e continua denso (3 notas por tempo).',
    en: 'The original program’s values. With bit operators: ~2.7 notes per beat, a range of ~36 semitones, critic 0. With musical operators: critic 0.95, but it rarely ends on the tonic (17 %) and stays dense (3 notes per beat).',
  },
  'cpreset.song': { pt: 'Canção popular', en: 'Folk song' },
  'cpreset.song.hint': {
    pt: 'Calibrada em canções populares reais (Essen). Com operadores musicais: crítico 0,90, 75 % das características no intervalo típico das canções (reais: 85 %), acaba na tónica em 71 % (reais: 73 %), âmbito ~10 meios-tons. Com operadores de bits: notas mais longas e âmbito de ~14 meios-tons em vez de 36, mas o crítico fica em 0 (os ataques fora do tempo e os saltos são invisíveis para as regras).',
    en: 'Calibrated on real folk songs (Essen). With musical operators: critic 0.90, 75 % of the features in the songs’ typical range (real: 85 %), ends on the tonic in 71 % (real: 73 %), range ~10 semitones. With bit operators: longer notes and a range of ~14 semitones instead of 36, but the critic stays at 0 (off-beat onsets and leaps are invisible to the rules).',
  },
  'cpreset.dance': { pt: 'Dança', en: 'Dance' },
  'cpreset.dance.hint': {
    pt: 'Calibrada em reels e hornpipes irlandeses e escoceses. Com operadores musicais: figuração rápida (2,5 notas por tempo; reais: 2,4), 72 % das características no intervalo típico das danças (reais: 79 %), acaba na tónica em 75 %.',
    en: 'Calibrated on Irish and Scottish reels and hornpipes. With musical operators: fast figuration (2.5 notes per beat; real: 2.4), 72 % of the features in the dances’ typical range (real: 79 %), ends on the tonic in 75 %.',
  },
  'cpreset.chorale': { pt: 'Coral', en: 'Chorale' },
  'cpreset.chorale.hint': {
    pt: 'Calibrada em sopranos de corais de Bach. Com operadores musicais: movimento por grau conjunto (66 %; reais: 68 %), âmbito ~8 meios-tons, final 3–2–1; ainda mais notas do que um coral (1,3 por tempo; reais: 0,9), o estilo mais difícil de aproximar.',
    en: 'Calibrated on Bach chorale sopranos. With musical operators: stepwise motion (66 %; real: 68 %), range ~8 semitones, 3–2–1 ending; still more notes than a chorale (1.3 per beat; real: 0.9), the hardest style to approach.',
  },

  // ------------------------------------------------------------------ weights (attractor field): names and what they do
  'weights.title': { pt: 'Pesos das regras', en: 'Rule weights' },
  'weights.intro': {
    pt: 'Cada peso multiplica uma regra da aptidão; a 0 a regra não conta. Carregue em «?» para ver o que a regra mede e como muda a melodia.',
    en: 'Each weight multiplies one rule of the fitness; at 0 the rule does not count. Press “?” to see what the rule measures and how it changes the melody.',
  },
  'weights.caps': {
    pt: 'Não maximizar: cada regra conta só até ao seu valor típico na música real (P75 de 6758 melodias)',
    en: 'Do not maximise: each rule counts only up to its typical value in real music (P75 of 6758 melodies)',
  },
  'weights.help': { pt: '?', en: '?' },
  'weights.helpTitle': { pt: 'O que faz esta regra', en: 'What this rule does' },
  'weights.canonSuffix': { pt: ' (com 2+ vozes)', en: ' (with 2+ voices)' },
  'wpreset.default': { pt: 'Por omissão', en: 'Default' },
  'wpreset.learned': { pt: 'Aprendidos da música real', en: 'Learned from real music' },
  'wpreset.counterpoint': { pt: 'Ênfase no contraponto', en: 'Emphasis on counterpoint' },
  'wpreset.waves': { pt: 'Ênfase nas ondas', en: 'Emphasis on the waves' },
  'weight.key': { pt: 'Tonalidade (perfil K-K)', en: 'Key (K-K profile)' },
  'weight.key.desc': {
    pt: 'Mede quanto cada nota pertence à tonalidade: as notas da escala valem conforme a sua estabilidade no perfil de Krumhansl & Kessler (tónica, dominante e mediante valem mais), as notas fora da escala são penalizadas, tudo pesado pela duração. Mais peso: menos cromatismo e mais tempo nas notas estáveis; a melodia soa mais tonal e segura. Menos peso: deixa entrar notas de fora (os operadores musicais já escrevem na escala, por isso o efeito é sobretudo na população aleatória).',
    en: 'How much each note belongs to the key: scale notes score by their stability in the Krumhansl & Kessler profile (tonic, dominant and mediant score most), notes outside the scale are penalised, all weighted by duration. More weight: less chromaticism and more time on stable notes; the melody sounds more tonal and safe. Less weight: lets notes outside the key in (the musical operators already write in the scale, so the effect is mostly on the random population).',
  },
  'weight.attractor': { pt: 'Bacias das ondas', en: 'Wave basins' },
  'weight.attractor.desc': {
    pt: 'A ideia central do trabalho original: cada nota é atraída pela onda mais próxima e pontua mais quanto mais perto estiver do seu centro (bacia gaussiana, gravitacional ou em degraus); com várias ondas, cada uma deve atrair parte das notas (melodia composta), e as notas fora do alcance do instrumento são penalizadas. Mais peso: o contorno segue as ondas de perto (o arco, o seno ou o atrator caótico escolhido); em excesso a melodia cola-se ao centro da onda e repete notas. Menos peso: as ondas só sugerem o registo.',
    en: 'The central idea of the original work: each note is attracted by the nearest wave and scores more the closer it is to the wave’s centre (Gaussian, gravitational or stepped basin); with several waves, each one should attract part of the notes (compound melody), and notes outside the instrument’s reach are penalised. More weight: the contour follows the waves closely (the arch, sine or chaotic attractor chosen); too much makes the melody stick to the wave’s centre and repeat notes. Less weight: the waves only suggest the register.',
  },
  'weight.proximity': { pt: 'Proximidade (Temperley)', en: 'Proximity (Temperley)' },
  'weight.proximity.desc': {
    pt: 'Proximidade de altura (Temperley 2008): cada intervalo entre notas seguidas pontua numa curva gaussiana — graus conjuntos e saltos pequenos valem quase 1, saltos grandes valem pouco. Mais peso: melodia mais cantável, por graus conjuntos; em excesso fica lisa demais, quase sem saltos (as heurísticas de composição corrigem isto). Menos peso: saltos mais frequentes e maiores.',
    en: 'Pitch proximity (Temperley 2008): each interval between consecutive notes scores on a Gaussian curve — steps and small leaps score almost 1, large leaps little. More weight: a more singable, stepwise melody; too much makes it too smooth, almost without leaps (the composition heuristics correct this). Less weight: more frequent and larger leaps.',
  },
  'weight.regression': { pt: 'Retorno após salto', en: 'Return after a leap' },
  'weight.regression.desc': {
    pt: 'Depois de um salto de 4.ª ou mais, a nota seguinte deve voltar para trás com um intervalo pequeno (regressão para a média, von Hippel & Huron 2000; o «preenchimento da lacuna» de Meyer); saltos que continuam no mesmo sentido contam contra. Mais peso: saltos sempre compensados, contorno em ziguezague equilibrado. Menos peso: permite arpejos que sobem ou descem seguidos.',
    en: 'After a leap of a fourth or more, the next note should turn back with a small interval (regression to the mean, von Hippel & Huron 2000; Meyer’s “gap fill”); leaps that carry on in the same direction count against. More weight: leaps always compensated, a balanced zig-zag contour. Less weight: allows arpeggios that keep rising or falling.',
  },
  'weight.forces': { pt: 'Forças melódicas', en: 'Melodic forces' },
  'weight.forces.desc': {
    pt: 'Magnetismo melódico (Lerdahl 2001; Larson 2012): uma nota instável (fora da tríade da tónica) tende para a vizinha mais atraente — a sensível para a tónica, o 4.º grau para o 3.º; a regra compara o passo dado com o mais atraente possível. Mais peso: resoluções de tendência claras, sensação de direção tonal. Menos peso: as notas instáveis podem saltar ou ficar suspensas.',
    en: 'Melodic magnetism (Lerdahl 2001; Larson 2012): an unstable note (outside the tonic triad) tends towards its most attracting neighbour — the leading tone to the tonic, the 4th degree to the 3rd; the rule compares the step taken with the most attracting one. More weight: clear tendency resolutions, a sense of tonal direction. Less weight: unstable notes may leap away or stay suspended.',
  },
  'weight.metric': { pt: 'Hierarquia métrica', en: 'Metric hierarchy' },
  'weight.metric.desc': {
    pt: 'Notas estáveis (tónica, 3.ª, 5.ª) nos tempos fortes e sobretudo no 1.º tempo do compasso (Lerdahl & Jackendoff 1983; Prince & Schmuckler 2014); notas longas a começar numa semicolcheia fraca contam como síncopa e são penalizadas. Mais peso: o compasso ouve-se melhor e a harmonia implícita assenta nos tempos. Menos peso: mais liberdade rítmica e melódica nos tempos fortes.',
    en: 'Stable notes (tonic, 3rd, 5th) on strong beats, above all on the downbeat (Lerdahl & Jackendoff 1983; Prince & Schmuckler 2014); long notes starting on a weak sixteenth count as syncopation and are penalised. More weight: the meter is heard more clearly and the implied harmony sits on the beats. Less weight: more rhythmic and melodic freedom on the strong beats.',
  },
  'weight.cadence': { pt: 'Cadências', en: 'Cadences' },
  'weight.cadence.desc': {
    pt: 'O fim de cada frase: a última nota deve ser longa, chegar ao fim da frase e ser estável; a frase final acaba na tónica (de preferência por grau descendente ou 5–1) e a frase do meio numa meia cadência (5.º grau). Mais peso: frases bem pontuadas, respiração clara, final conclusivo. Menos peso: frases que se encadeiam sem repouso.',
    en: 'The end of each phrase: the last note should be long, reach the end of the phrase and be stable; the final phrase ends on the tonic (preferably by a falling step or 5–1) and the middle phrase on a half cadence (5th degree). More weight: well-punctuated phrases, clear breathing, a conclusive ending. Less weight: phrases that run on without rest.',
  },
  'weight.rhythm': { pt: 'Ritmo e pausas', en: 'Rhythm and rests' },
  'weight.rhythm.desc': {
    pt: 'Valores alinhados com o tempo (uma semínima começa num tempo, uma colcheia numa colcheia; no compasso composto, as figuras do tempo de três colcheias), valores que se escrevem numa só figura, semicolcheias em grupos (uma sozinha soa a erro), pausas até ~8 % do tempo e entre 0,75 e 2 notas por tempo. Mais peso: ritmo mais limpo e de pauta, densidade moderada. Menos peso: ritmos mais irregulares, mais ou menos notas.',
    en: 'Note values aligned with the beat (a quarter starts on a beat, an eighth on an eighth; in compound time, the figures of a three-eighth beat), values written as a single note, sixteenths in groups (a lone one sounds like a mistake), rests up to ~8 % of the time and 0.75–2 notes per beat. More weight: a cleaner, more written-out rhythm and moderate density. Less weight: more irregular rhythms, more or fewer notes.',
  },
  'weight.form': { pt: 'Forma', en: 'Form' },
  'weight.form.desc': {
    pt: 'A forma escolhida (A A′ B A′, A B A′ C, A A B B…): as partes com a mesma letra devem parecer-se no ritmo e no contorno (mesmo transpostas, o que dá sequências) sem serem cópias literais; letras diferentes devem contrastar. Mais peso: estrutura clara, reconhecível à escuta, com repetição e variação. Menos peso: a melodia desenvolve-se livremente. Sem efeito com a forma «Livre».',
    en: 'The chosen form (A A′ B A′, A B A′ C, A A B B…): parts with the same letter should resemble each other in rhythm and contour (even transposed, which gives sequences) without being literal copies; different letters should contrast. More weight: a clear structure you can hear, with repetition and variation. Less weight: the melody develops freely. No effect with the form “Free”.',
  },
  'weight.tension': { pt: 'Onda de tensão', en: 'Tension wave' },
  'weight.tension.desc': {
    pt: 'Uma curva de tensão (instabilidade tonal + altura + densidade de ataques) deve seguir um arco por frase e um arco global com o pico a ~62 % da peça (Farbood 2012; Herremans & Chew 2017). Mais peso: a melodia cresce para um clímax e relaxa no fim, frase a frase. Menos peso: a tensão distribui-se sem plano.',
    en: 'A tension curve (tonal instability + pitch height + onset density) should follow an arch per phrase and a global arch peaking at ~62 % of the piece (Farbood 2012; Herremans & Chew 2017). More weight: the melody builds to a climax and relaxes at the end, phrase by phrase. Less weight: tension is spread without a plan.',
  },
  'weight.variety': { pt: 'Variedade', en: 'Variety' },
  'weight.variety.desc': {
    pt: 'Contra a monotonia (Towsey et al. 2001): penaliza a mesma nota três vezes seguidas e pede pelo menos 6 alturas diferentes, um clímax que não se repete muitas vezes, âmbito entre uma 5.ª e uma 12.ª e pelo menos três durações diferentes. Mais peso: melodias mais variadas em altura e ritmo. Menos peso: aceita melodias repetitivas (canções infantis, ostinatos).',
    en: 'Against monotony (Towsey et al. 2001): penalises the same note three times in a row and asks for at least 6 different pitches, a climax not repeated many times, a range between a 5th and a 12th and at least three different durations. More weight: melodies more varied in pitch and rhythm. Less weight: accepts repetitive melodies (children’s songs, ostinatos).',
  },
  'weight.canon': { pt: 'Contraponto entre as vozes', en: 'Counterpoint between the voices' },
  'weight.canon.desc': {
    pt: 'Só com 2 ou 3 vozes: a melodia tocada contra si própria, com cada voz a entrar mais tarde e talvez transposta — consonâncias nos tempos fortes, sem quintas e oitavas paralelas, movimento contrário, poucos uníssonos e todas as vozes no alcance do seu instrumento (para todos os pares de vozes). Mais peso: cânones que soam bem a várias vozes (à Telemann), à custa de alguma liberdade melódica. Menos peso: a melodia sozinha manda.',
    en: 'Only with 2 or 3 voices: the melody played against itself, each voice entering later and maybe transposed — consonances on strong beats, no parallel fifths and octaves, contrary motion, few unisons and every voice within its instrument’s reach (for every pair of voices). More weight: canons that sound good in several voices (Telemann-style), at some cost to melodic freedom. Less weight: the melody alone decides.',
  },
  'weight.idiom': { pt: 'Idioma do corpus (blocos)', en: 'Corpus idiom (blocks)' },
  'weight.idiom.desc': {
    pt: 'Quão típicos são os blocos de um tempo (figura rítmica, contorno, intervalo de entrada) nas melodias reais do mesmo compasso, até à mediana do corpus. Mais peso: figuras mais parecidas com as reais do compasso, mas os estudos mostraram que baixa o crítico (o AG escolhe os blocos mais comuns, que juntos soam menos naturais); por isso está a 0 por omissão.',
    en: 'How typical the one-beat blocks (rhythmic figure, contour, entry interval) are of real melodies in the same meter, up to the corpus median. More weight: figures closer to real ones in that meter, but the studies showed it lowers the critic (the GA picks the most common blocks, which together sound less natural); so it is 0 by default.',
  },
  'weight.heuristics': { pt: 'Heurísticas de composição', en: 'Composition heuristics' },
  'weight.heuristics.desc': {
    pt: 'Regras de composição da literatura (results/estilos/literatura.csv), cada uma medida na melodia e comparada com o intervalo P10–P90 da música real: mais graus a descer do que a subir, inércia do grau, saltos nem de menos nem de mais, saltos compensados, saltos seguidos só em arpejo, sem intervalos dissonantes, âmbito, clímax, arco de frase, fim de frase mais grave e mais longo, motivos rítmicos repetidos, notas longas nos tempos e sem síncopas. Com um estilo escolhido junta as regras desse estilo (figuras, anacrusa, densidade…) e o peso nunca fica a 0. Mais peso: a melodia aproxima-se do estilo ou das tendências gerais da música real. A 0 e sem estilo não conta.',
    en: 'Composition rules from the literature (results/estilos/literatura.csv), each measured on the melody and compared with the P10–P90 range of real music: more falling than rising steps, step inertia, neither too few nor too many leaps, compensated leaps, consecutive leaps only as arpeggios, no dissonant intervals, range, climax, phrase arch, phrase endings lower and longer, repeated rhythmic motifs, long notes on beats and no syncopation. With a style chosen it adds that style’s rules (figures, pickup, density…) and the weight never stays at 0. More weight: the melody moves towards the style or the general tendencies of real music. At 0 and without a style it does not count.',
  },

  // ------------------------------------------------------------------ weights (classic mode): names and the authors' intentions
  'classic.weights.intro': {
    pt: 'As regras do programa original (AlgorithmFitness.cs). As descrições dizem o que cada regra faz no código e interpretam o que os autores pretendiam, pelos nomes, pelos comentários e pelos valores que escolheram.',
    en: 'The rules of the original program (AlgorithmFitness.cs). The descriptions say what each rule does in the code and interpret what the authors intended, from the names, the comments and the values they chose.',
  },
  'classic.groups.desc': {
    pt: 'O original usava dois grupos de pesos: o 1.º nos primeiros 25 % do tempo de execução (aqui, das gerações) e o 2.º no resto. Intenção provável: primeiro pôr as notas no registo e na escala e só depois refinar a forma — o 2.º grupo dá mais peso à escala, aos intervalos, ao leitmotiv e ao equilíbrio de notas e pausas.',
    en: 'The original used two groups of weights: the 1st in the first 25 % of the run time (here, of the generations) and the 2nd for the rest. Likely intention: first get the notes into the register and the scale, and only then refine the form — the 2nd group gives more weight to the scale, the intervals, the leitmotif and the balance of notes and rests.',
  },
  'weights.group1': { pt: 'Grupo 1 (primeiros {pct} % das gerações)', en: 'Group 1 (first {pct} % of the generations)' },
  'weights.group2': { pt: 'Grupo 2 (resto)', en: 'Group 2 (the rest)' },
  'classic.rhythmicPatterns': { pt: 'Padrões rítmicos', en: 'Rhythmic patterns' },
  'classic.rhythmicPatterns.desc': {
    pt: 'Valoriza figuras de um tempo: 3+1 e 2+1+1 semicolcheias (+1, e +5 quando começam no início do compasso), quatro semicolcheias (+0,5) e um tempo inteiro numa só nota ou pausa (+10); penaliza um prolongamento no início do compasso (−5). Intenção dos autores (comentário no C#: «valorização de figuras rítmicas»): dar à melodia figuras reconhecíveis e alinhadas com o compasso, em vez de semicolcheias soltas. Mais peso: mais figuras de tempo e notas de um tempo inteiro. Com «Corrigir os lapsos» o bónus do início do compasso passa a contar na semicolcheia certa.',
    en: 'Rewards one-beat figures: 3+1 and 2+1+1 sixteenths (+1, and +5 when they start at the beginning of the bar), four sixteenths (+0.5) and a whole beat as one note or rest (+10); penalises a prolongation at the start of a bar (−5). The authors’ intention (C# comment: “valuing rhythmic figures”): give the melody recognisable figures aligned with the bar instead of scattered sixteenths. More weight: more beat-long figures and whole-beat notes. With “Fix the original’s lapses” the start-of-bar bonus counts on the right sixteenth.',
  },
  'classic.selfHarm1': { pt: 'Auto-harmonização (2.ª voz)', en: 'Self-harmonisation (2nd voice)' },
  'classic.selfHarm1.desc': {
    pt: 'Compara cada nota com a que soa um compasso antes (ou à distância a que entra a 2.ª voz) e pontua o intervalo harmónico: 3.as +3 (conforme o modo), 4.as +2, 5.as +1,5, 8.as e 7.as menores +1, uníssonos −4,5, 2.as, 6.as e 7.as maiores negativas. Intenção dos autores (comentário: «harmonização entre compassos subsequentes»): que a melodia soe bem contra si própria desfasada, como num cânone, sem ter de guardar uma 2.ª voz no cromossoma. Mais peso: compassos seguidos mais consonantes entre si. Nota: premeia 4.as e penaliza 6.as, ao contrário do contraponto clássico; no original compara genes e não as notas que soam (corrigido com «Corrigir os lapsos»).',
    en: 'Compares each note with the one sounding a bar earlier (or at the distance where the 2nd voice enters) and scores the harmonic interval: 3rds +3 (depending on the mode), 4ths +2, 5ths +1.5, octaves and minor 7ths +1, unisons −4.5, 2nds, 6ths and major 7ths negative. The authors’ intention (comment: “harmonisation between subsequent bars”): make the melody sound good against itself shifted, as in a canon, without storing a 2nd voice in the chromosome. More weight: consecutive bars more consonant with each other. Note: it rewards 4ths and penalises 6ths, unlike classical counterpoint; the original compares genes rather than the sounding notes (fixed with “Fix the original’s lapses”).',
  },
  'classic.selfHarm2': { pt: 'Auto-harmonização (3.ª voz)', en: 'Self-harmonisation (3rd voice)' },
  'classic.selfHarm2.desc': {
    pt: 'A mesma regra a dois compassos de distância (ou à distância a que entra a 3.ª voz). Intenção: um cânone ou ronda a três vozes em que a melodia também soa bem contra si própria dois compassos depois. Mais peso: consonância também entre compassos alternados. O peso original (1–4) é mais alto do que o da 2.ª voz.',
    en: 'The same rule two bars apart (or at the distance where the 3rd voice enters). Intention: a canon or round in three voices where the melody also sounds good against itself two bars later. More weight: consonance also between alternate bars. The original weight (1–4) is higher than the 2nd voice’s.',
  },
  'classic.aba': { pt: 'Repetição a 4 compassos', en: 'Repetition 4 bars apart' },
  'classic.aba.desc': {
    pt: 'Cada semicolcheia igual à de quatro compassos antes vale +1; diferente, −4. Intenção dos autores (comentário: «repetições de padrões alternadamente entre compassos», com uma versão espelhada prevista mas não feita): uma forma em que a 2.ª metade de 8 compassos repete a 1.ª, como A…A. Mais peso: repetição literal a 4 compassos (com peso alto a peça divide-se em duas metades iguais). Com o peso original (0,5) quase não conta.',
    en: 'Each sixteenth equal to the one four bars earlier scores +1; different, −4. The authors’ intention (comment: “repetitions of patterns alternately between bars”, with a mirrored version planned but never done): a form where the second half of 8 bars repeats the first, like A…A. More weight: literal repetition four bars apart (at high weight the piece splits into two equal halves). At the original weight (0.5) it barely counts.',
  },
  'classic.leitmotif': { pt: 'Leitmotiv rítmico', en: 'Rhythmic leitmotif' },
  'classic.leitmotif.desc': {
    pt: 'Compara o ritmo de cada compasso com o do 1.º compasso, semicolcheia a semicolcheia (pausa com pausa +4, prolongamento com prolongamento +4, ataque com ataque +2, diferente −2). Intenção dos autores (comentário: «LeitMotif — repetição de uma figura rítmica ao longo da partitura»): um motivo rítmico que unifica a peça. Mais peso: os compassos ficam com o ritmo do primeiro (com peso alto, monótono). É um dos pesos mais altos do original (12–16).',
    en: 'Compares the rhythm of each bar with that of bar 1, sixteenth by sixteenth (rest with rest +4, prolongation with prolongation +4, onset with onset +2, different −2). The authors’ intention (comment: “LeitMotif — repetition of a rhythmic figure throughout the score”): a rhythmic motif that unifies the piece. More weight: the bars take the rhythm of the first (monotonous at high weight). One of the original’s highest weights (12–16).',
  },
  'classic.wave1': { pt: 'Onda 1', en: 'Wave 1' },
  'classic.wave1.desc': {
    pt: 'A ideia central do trabalho: cada nota perto da onda 1 (um seno lento: por omissão 1 ciclo em 2 compassos, ±12 meios-tons à volta do Lá4) ganha pontos (a ≤ ½ bacia +3, ≤ 1 bacia +1) e longe perde (−4,1 e −6,2). Intenção dos autores (comentário: «as notas convergem para os limites de atração de ondas de oscilação de referência»): um contorno de fundo em onda, que as notas seguem de perto. Mais peso: o contorno segue a onda; como só as notas são avaliadas, com peso alto o AG foge para pausas e prolongamentos (ver «Sobre»).',
    en: 'The central idea of the work: each note near wave 1 (a slow sine: by default 1 cycle in 2 bars, ±12 semitones around A4) gains points (within ½ basin +3, within the basin +1) and far away loses them (−4.1 and −6.2). The authors’ intention (comment: “the notes converge to the attraction limits of reference oscillation waves”): a wave-shaped background contour that the notes follow closely. More weight: the contour follows the wave; since only notes are judged, at high weight the GA escapes into rests and prolongations (see “About”).',
  },
  'classic.wave2': { pt: 'Onda 2', en: 'Wave 2' },
  'classic.wave2.desc': {
    pt: 'O mesmo para a onda 2 (um seno rápido: 2 ciclos por compasso, ±4 meios-tons à volta do Ré4). As duas ondas somam as penalizações: uma nota tem de estar perto das duas ao mesmo tempo. Intenção: uma ondulação curta sobreposta à longa (o motivo sobre a frase). Mais peso: movimento ondulado rápido, dentro de um registo estreito.',
    en: 'The same for wave 2 (a fast sine: 2 cycles per bar, ±4 semitones around D4). The two waves add their penalties: a note must be near both at once. Intention: a short undulation over the long one (the motif over the phrase). More weight: fast wavy motion within a narrow register.',
  },
  'classic.range': { pt: 'Âmbito', en: 'Range' },
  'classic.range.desc': {
    pt: 'Notas a menos de ±15 meios-tons do Lá4 (a constante «Âmbito atrator») valem +2; mais longe, −1 a −2 (e −15 nos genes mais graves); pausas e prolongamentos +1. Nas primeiras avaliações o âmbito é 10 meios-tons mais largo. Intenção dos autores (comentário: «dá classificação positiva a notas dentro do intervalo selecionado»): manter a melodia num registo cantável e tocável. É o peso mais alto do original (42). Mais peso: registo mais contido.',
    en: 'Notes within ±15 semitones of A4 (the “attracting range” constant) score +2; further away, −1 to −2 (and −15 for the lowest genes); rests and prolongations +1. In the first evaluations the range is 10 semitones wider. The authors’ intention (comment: “positive score for notes inside the selected interval”): keep the melody in a singable, playable register. It is the original’s highest weight (42). More weight: a more contained register.',
  },
  'classic.scale': { pt: 'Escala', en: 'Scale' },
  'classic.scale.desc': {
    pt: 'Cada nota da escala escolhida vale +1, cada nota fora dela −1,5. Intenção dos autores (comentário: «dá classificação positiva às notas da escala selecionada»): melodias tonais, na tonalidade escolhida no formulário. Mais peso: menos notas cromáticas. Com os operadores de bits, que escrevem qualquer um dos 73 meios-tons, é a regra que mais trabalha.',
    en: 'Each note of the chosen scale scores +1, each note outside it −1.5. The authors’ intention (comment: “positive score for the notes of the selected scale”): tonal melodies in the key chosen in the form. More weight: fewer chromatic notes. With the bit operators, which write any of the 73 semitones, this is the rule that works hardest.',
  },
  'classic.pauseProlongation': { pt: 'Pausas e prolongamentos', en: 'Rests and prolongations' },
  'classic.pauseProlongation.desc': {
    pt: 'Pontos por uma pausa depois de uma nota (+4), pelo prolongamento de uma pausa (+6,5) e de uma nota (+2), −1 no resto, até ao máximo de 40; −10 se a peça começar num prolongamento. Intenção dos autores (comentário: «classificação meritória» de pausas e prolongamentos): contrariar a densidade do ruído inicial, que é quase só ataques, e dar respiração e notas longas. Mais peso: mais pausas e notas longas, até ao teto de 40. O ramo «prolongamento de prolongamento» (+0,5) nunca era alcançado (corrigido com «Corrigir os lapsos»).',
    en: 'Points for a rest after a note (+4), for the prolongation of a rest (+6.5) and of a note (+2), −1 otherwise, up to a maximum of 40; −10 if the piece starts with a prolongation. The authors’ intention (comment: “merit score” for rests and prolongations): counter the density of the initial noise, which is almost all onsets, and give breathing space and long notes. More weight: more rests and long notes, up to the cap of 40. The “prolongation of a prolongation” branch (+0.5) was never reached (fixed with “Fix the original’s lapses”).',
  },
  'classic.reduceRepetitions': { pt: 'Repetições excessivas', en: 'Excessive repetitions' },
  'classic.reduceRepetitions.desc': {
    pt: 'Penaliza a mesma nota repetida: duas vezes −1,8, três −3, quatro ou mais −6 (também depois de um prolongamento). Intenção dos autores (comentário: «repetições exageradas das mesmas notas»): evitar melodias presas numa nota, que as ondas tendem a produzir. Mais peso: menos notas repetidas.',
    en: 'Penalises the same note repeated: twice −1.8, three times −3, four or more −6 (also after a prolongation). The authors’ intention (comment: “exaggerated repetitions of the same notes”): avoid melodies stuck on one note, which the waves tend to produce. More weight: fewer repeated notes.',
  },
  'classic.intervals': { pt: 'Intervalos', en: 'Intervals' },
  'classic.intervals.desc': {
    pt: 'Pontua cada intervalo melódico: 3.as no sentido do modo (+3) e arpejos da tríade (+5), o tom inteiro (+2), 4.as (+1), 5.as (+0,5) e oitavas (+1); penaliza uníssonos (−4,5), meios-tons (−1), trítonos, 6.as e 7.as (−0,3 a −1) e saltos maiores do que a oitava (−1). Intenção dos autores (comentário: «intervalos entre notas válidos e aprazíveis»; a tabela distingue o modo maior e o menor): uma melodia de intervalos agradáveis, com arpejos da tríade. Mais peso: mais terceiras e arpejos, menos notas repetidas. No original só media semicolcheias vizinhas (com notas longas nunca julgava a melodia); com «Corrigir os lapsos» mede entre notas seguidas.',
    en: 'Scores each melodic interval: thirds in the direction of the mode (+3) and triad arpeggios (+5), the whole tone (+2), fourths (+1), fifths (+0.5) and octaves (+1); penalises unisons (−4.5), semitones (−1), tritones, sixths and sevenths (−0.3 to −1) and leaps beyond the octave (−1). The authors’ intention (comment: “valid and pleasing intervals between notes”; the table distinguishes major and minor mode): a melody of pleasant intervals, with triad arpeggios. More weight: more thirds and arpeggios, fewer repeated notes. The original only measured neighbouring sixteenths (with long notes it never judged the melody); with “Fix the original’s lapses” it measures between consecutive notes.',
  },
  'classic.niceRepetitions': { pt: 'Repetições interessantes', en: 'Interesting repetitions' },
  'classic.niceRepetitions.desc': {
    pt: 'Premeia padrões de notas alternadas: a mesma nota duas posições depois (x y x: +2) ou três posições depois (x y z x: +1). Intenção dos autores (comentário: «cadências de repetições interessantes»): bordaduras e figuras que voltam à nota de partida, que dão interesse sem repetir a mesma nota seguida. Mais peso: mais figuras à volta de uma nota. No original também contava prolongamentos como notas (a condição que os autores corrigiram nos intervalos); corrigido com «Corrigir os lapsos».',
    en: 'Rewards patterns of alternating notes: the same note two positions later (x y x: +2) or three positions later (x y z x: +1). The authors’ intention (comment: “cadences of interesting repetitions”): neighbour notes and figures that return to their starting note, which add interest without repeating the same note in a row. More weight: more figures around a note. The original also counted prolongations as notes (the condition the authors fixed in the intervals rule); fixed with “Fix the original’s lapses”.',
  },
  'classic.ending': { pt: 'Final (nota longa)', en: 'Ending (long note)' },
  'classic.ending.desc': {
    pt: 'Premeia uma última nota prolongada: +10 % do comprimento da peça se o último gene for um prolongamento, mais 20 % e 30 % conforme os dois genes anteriores. Intenção dos autores (comentário: «terminação da partitura com notas mais longas»): um final que repousa. Nota: os testes aninhados perguntam se os genes anteriores NÃO são prolongamentos, por isso a pontuação máxima vai para uma nota final de só duas semicolcheias — provavelmente uma troca de «==» por «!=», como noutras regras; fica como no original. O relatório previa também fórmulas de final, que ficaram por fazer: ver «Fórmulas de final».',
    en: 'Rewards a prolonged last note: +10 % of the piece’s length if the last gene is a prolongation, a further 20 % and 30 % depending on the two genes before it. The authors’ intention (comment: “ending the score with longer notes”): an ending that comes to rest. Note: the nested tests ask whether the previous genes are NOT prolongations, so the top score goes to a final note of only two sixteenths — probably “==” swapped for “!=”, as in other rules; it is kept as in the original. The report also planned ending formulas, which were never done: see “Ending formulas”.',
  },
  'classic.balance': { pt: 'Equilíbrio notas/pausas', en: 'Balance of notes and rests' },
  'classic.balance.desc': {
    pt: 'Mede a percentagem de semicolcheias sem ataque (pausas + prolongamentos) e premeia valores entre o mínimo e o máximo das constantes (7 % e 40 % no original), com uma parábola que penaliza cada vez mais fora do intervalo. Intenção dos autores: equilibrar ataques e sustentações, nem só semicolcheias nem só notas longas. Nota: nas melodias reais esse valor é 58–83 %, por isso os valores originais pedem melodias 2–3 vezes mais densas do que as reais; as combinações de partida calibradas corrigem o intervalo. Sem pausas nem prolongamentos o original dava −∞ (corrigido com «Corrigir os lapsos»).',
    en: 'Measures the percentage of sixteenths without an onset (rests + prolongations) and rewards values between the minimum and the maximum of the constants (7 % and 40 % in the original), with a parabola that penalises more and more outside the range. The authors’ intention: balance onsets and sustains, neither all sixteenths nor all long notes. Note: in real melodies this value is 58–83 %, so the original values ask for melodies 2–3 times denser than real ones; the calibrated starting combinations correct the range. With no rests or prolongations the original gave −∞ (fixed with “Fix the original’s lapses”).',
  },
  'classic.cadence': { pt: 'Fórmulas de final (corpus)', en: 'Ending formulas (corpus)' },
  'classic.cadence.desc': {
    pt: 'Não existia no original (peso 0): completa a regra do final com a probabilidade do fim da peça segundo 6758 melodias reais — graus das três últimas notas (3–2–1, 2–2–1, 7–1…), último movimento, tempo e duração da última nota e o seu registo. É o que o relatório original previa e ficou por fazer. Mais peso: finais que soam conclusivos, na tónica.',
    en: 'Not in the original (weight 0): completes the ending rule with the probability of the piece’s ending according to 6758 real melodies — degrees of the last three notes (3–2–1, 2–2–1, 7–1…), last motion, beat and length of the last note and its register. It is what the original report planned and never did. More weight: endings that sound conclusive, on the tonic.',
  },
  'classic.heuristics': { pt: 'Heurísticas de composição', en: 'Composition heuristics' },
  'classic.heuristics.desc': {
    pt: 'Não existia no original (peso 0): as heurísticas de composição do campo de atratores — regras gerais da literatura e, com um estilo em 4/4, as desse estilo — somadas por tempo, como as outras regras. Com um estilo escolhido o peso fica sempre acima de 0. Mais peso: a melodia aproxima-se das tendências da música real ou do estilo.',
    en: 'Not in the original (weight 0): the composition heuristics of the attractor field — general rules from the literature and, with a 4/4 style, that style’s rules — summed per beat, like the other rules. With a style chosen the weight always stays above 0. More weight: the melody moves towards the tendencies of real music or towards the style.',
  },

  // ------------------------------------------------------------------ styles and heuristic rules
  'style.label': { pt: 'Estilo', en: 'Style' },
  'style.none': { pt: 'Nenhum (só as regras gerais)', en: 'None (general rules only)' },
  'style.family.trad': { pt: 'Canções', en: 'Songs' },
  'style.family.dance': { pt: 'Danças', en: 'Dances' },
  'style.family.baroque': { pt: 'Renascença e barroco', en: 'Renaissance and Baroque' },
  'style.family.classical': { pt: 'Tópicos clássicos', en: 'Classical topics' },
  'style.family.popular': { pt: 'Música popular do séc. XX', en: '20th-century popular music' },
  'style.hint.none': {
    pt: 'Sem estilo: com o peso «Heurísticas de composição» acima de 0 contam só as regras gerais (graus a descer, saltos, arco, fim de frase, motivos…).',
    en: 'No style: with the “Composition heuristics” weight above 0 only the general rules count (falling steps, leaps, arch, phrase endings, motifs…).',
  },
  'style.hint.meters': { pt: 'Compassos do estilo: {meters}.', en: 'Meters of the style: {meters}.' },
  'style.hint.mode.minor': { pt: 'Costuma ser em modo menor.', en: 'Usually in minor.' },
  'style.hint.mode.major': { pt: 'Costuma ser em modo maior.', en: 'Usually in major.' },
  'style.hint.forced': {
    pt: 'Com um estilo, o peso «Heurísticas de composição» fica sempre acima de 0 (escolha «Nenhum» para o poder pôr a 0).',
    en: 'With a style, the “Composition heuristics” weight always stays above 0 (choose “None” to be able to set it to 0).',
  },
  'style.hint.changed': { pt: 'Ajustado para o estilo: {list}.', en: 'Adjusted for the style: {list}.' },
  'style.changed.meter': { pt: 'compasso {v}', en: 'time signature {v}' },
  'style.changed.phraseBars': { pt: 'frases de {v} c.', en: '{v}-bar phrases' },
  'style.changed.form': { pt: 'forma {v}', en: 'form {v}' },
  'style.changed.bars': { pt: '{v} compassos', en: '{v} bars' },
  'style.changed.bpm': { pt: 'andamento {v}', en: 'tempo {v}' },
  'style.hint.classic': {
    pt: 'O modelo clássico só escreve em 4/4: os estilos noutros compassos só existem no campo de atratores.',
    en: 'The classic model only writes in 4/4: styles in other meters exist only in the attractor field.',
  },
  'style.hint.rules': { pt: '{n} regras ({own} do estilo, {cal} medidas em melodias reais).', en: '{n} rules ({own} of the style, {cal} measured on real melodies).' },
  'style.onlyField': { pt: '{name} (só no campo de atratores)', en: '{name} (attractor field only)' },
  'style.folk': { pt: 'Canção popular europeia', en: 'European folk song' },
  'style.folk.desc': {
    pt: 'Canções do Essen (sobretudo alemãs): intervalos pequenos, arco de frase, fim de frase mais longo e mais grave; intervalos-alvo medidos em 6547 canções reais do compasso escolhido.',
    en: 'Essen songs (mostly German): small intervals, arched phrases, longer and lower phrase endings; target ranges measured on 6,547 real songs in the chosen meter.',
  },
  'style.children': { pt: 'Canção infantil (Kodály)', en: 'Children’s song (Kodály)' },
  'style.children.desc': { pt: 'Âmbito estreito (até uma 6.ª), escala pentatónica com o sol–mi, motivos muito repetidos e poucos saltos grandes.', en: 'Narrow range (up to a 6th), pentatonic scale with sol–mi, highly repeated motifs and few large leaps.' },
  'style.lullaby': { pt: 'Canção de embalar', en: 'Lullaby' },
  'style.lullaby.desc': {
    pt: 'Lenta, por graus conjuntos, com poucas mudanças de direção e frases que descem, balanço em 6/8 (semínima + colcheia) e muita repetição (Unyk, Trehub et al.; Mehr et al.).',
    en: 'Slow, stepwise, with few changes of direction and falling phrases, a 6/8 rocking (quarter + eighth) and much repetition (Unyk, Trehub et al.; Mehr et al.).',
  },
  'style.hymn': { pt: 'Hino (métrica comum)', en: 'Hymn (common metre)' },
  'style.hymn.desc': { pt: 'Anacrusa de um tempo, uma nota por tempo (semínimas), graus conjuntos, âmbito de uma oitava, quatro frases.', en: 'A one-beat pickup, one note per beat (quarters), steps, a range of an octave, four phrases.' },
  'style.pentatonic': { pt: 'Canção pentatónica (China, Han)', en: 'Pentatonic song (Han Chinese)' },
  'style.pentatonic.desc': { pt: 'Só os cinco graus da pentatónica (dó–ré–mi–sol–lá), sem meios-tons, âmbito moderado.', en: 'Only the five degrees of the pentatonic scale (do–re–mi–sol–la), no semitones, moderate range.' },
  'style.fado': { pt: 'Fado', en: 'Fado' },
  'style.fado.desc': {
    pt: 'Quatro frases por estrofe (a quadra), notas longas e suspensas no fim de cada frase, âmbito até uma 10.ª; no fado menor, modo menor com a sensível.',
    en: 'Four phrases per stanza (the quatrain), long held notes at the end of each phrase, a range up to a 10th; in the fado menor, minor mode with the leading tone.',
  },
  'style.reel': { pt: 'Reel (Irlanda, Escócia)', en: 'Reel (Ireland, Scotland)' },
  'style.reel.desc': {
    pt: '4/4 sentido a dois tempos, colcheias contínuas (≈ 77 % dos tempos), arpejos, sem pausas, duas partes de 8 compassos (AABB); medido em 264 reels reais.',
    en: '4/4 felt in two, running eighths (≈ 77 % of the beats), arpeggios, no rests, two 8-bar strains (AABB); measured on 264 real reels.',
  },
  'style.jig': { pt: 'Double jig (Irlanda)', en: 'Double jig (Ireland)' },
  'style.jig.desc': { pt: '6/8 com três colcheias em quase todos os tempos e semínima + colcheia de vez em quando; AABB; medido em 219 jigs reais.', en: '6/8 with three eighths on almost every beat and quarter + eighth now and then; AABB; measured on 219 real jigs.' },
  'style.singleJig': { pt: 'Single jig / slide', en: 'Single jig / slide' },
  'style.singleJig.desc': { pt: '6/8 ou 12/8 com o padrão longo-curto semínima + colcheia na maior parte dos tempos.', en: '6/8 or 12/8 with the long-short quarter + eighth pattern on most beats.' },
  'style.slipJig': { pt: 'Slip jig (Irlanda)', en: 'Slip jig (Ireland)' },
  'style.slipJig.desc': { pt: '9/8: três tempos de três colcheias, com semínima + colcheia; medido em 138 melodias reais em 9/8.', en: '9/8: three beats of three eighths, with quarter + eighth; measured on 138 real tunes in 9/8.' },
  'style.hornpipe': { pt: 'Hornpipe', en: 'Hornpipe' },
  'style.hornpipe.desc': {
    pt: '4/4 com pares pontuados (colcheia pontuada + semicolcheia) e o fim de cada parte em três semínimas («pom-pom-pom»); medido em 166 hornpipes reais.',
    en: '4/4 with dotted pairs (dotted eighth + sixteenth) and each strain ending on three quarter notes (“pom-pom-pom”); measured on 166 real hornpipes.',
  },
  'style.strathspey': { pt: 'Strathspey (Escócia)', en: 'Strathspey (Scotland)' },
  'style.strathspey.desc': {
    pt: '4/4 com pontuados dos dois tipos: longo-curto e o «Scotch snap» curto-longo (semicolcheia + colcheia pontuada); medido em 70 strathspeys reais.',
    en: '4/4 with both kinds of dotted rhythm: long-short and the short-long “Scotch snap” (sixteenth + dotted eighth); measured on 70 real strathspeys.',
  },
  'style.polka': { pt: 'Polca / corridinho / malhão', en: 'Polka / corridinho / malhão' },
  'style.polka.desc': { pt: '2/4 vivo com figuras colcheia + duas semicolcheias («rápido-rápido-lento»), frases de 4 compassos e muita repetição.', en: 'Lively 2/4 with eighth + two sixteenths figures (“quick-quick-slow”), 4-bar phrases and much repetition.' },
  'style.march': { pt: 'Marcha', en: 'March' },
  'style.march.desc': {
    pt: '2/4, 6/8 ou 4/4, ritmos pontuados, arpejos da tríade (como os toques de clarim), notas longas nos tempos fortes; medido em marchas e «quick steps» reais.',
    en: '2/4, 6/8 or 4/4, dotted rhythms, arpeggios of the triad (like bugle calls), long notes on strong beats; measured on real marches and quick steps.',
  },
  'style.waltz': { pt: 'Valsa', en: 'Waltz' },
  'style.waltz.desc': { pt: '3/4 com uma nota longa no 1.º tempo em muitos compassos, poucas notas por compasso, saltos expressivos, frases de 4 compassos.', en: '3/4 with a long note on the downbeat in many bars, few notes per bar, expressive leaps, 4-bar phrases.' },
  'style.mazurka': { pt: 'Mazurca', en: 'Mazurka' },
  'style.mazurka.desc': { pt: '3/4 com duas notas curtas no 1.º tempo (pontuado ou colcheias) e um acento longo no 2.º ou no 3.º tempo.', en: '3/4 with two short notes on beat 1 (dotted or eighths) and a long accent on beat 2 or 3.' },
  'style.polonaise': { pt: 'Polonesa', en: 'Polonaise' },
  'style.polonaise.desc': { pt: '3/4 moderado com colcheia + duas semicolcheias no 1.º tempo e final «feminino» no 2.º tempo.', en: 'Moderate 3/4 with eighth + two sixteenths on beat 1 and a “feminine” ending on beat 2.' },
  'style.tarantella': { pt: 'Tarantela', en: 'Tarantella' },
  'style.tarantella.desc': { pt: '6/8 muito rápido, colcheias contínuas sem pausas, em geral em menor.', en: 'Very fast 6/8, continuous eighths without rests, usually in minor.' },
  'style.vira': { pt: 'Vira (Minho)', en: 'Vira (Minho)' },
  'style.vira.desc': { pt: '6/8 vivo, como uma valsa rápida: semínima + colcheia e três colcheias, frases de 4 compassos repetidas.', en: 'Lively 6/8, like a fast waltz: quarter + eighth and three eighths, repeated 4-bar phrases.' },
  'style.habanera': { pt: 'Habanera / tango', en: 'Habanera / tango' },
  'style.habanera.desc': {
    pt: '2/4 com a figura colcheia pontuada + semicolcheia no 1.º tempo, a «síncopa» semicolcheia–colcheia–semicolcheia e notas que atravessam o tempo.',
    en: '2/4 with the dotted eighth + sixteenth figure on beat 1, the “síncopa” sixteenth–eighth–sixteenth and notes that cross the beat.',
  },
  'style.palestrina': { pt: 'Polifonia do séc. XVI (Palestrina)', en: '16th-century polyphony (Palestrina)' },
  'style.palestrina.desc': {
    pt: 'Mínimas e semínimas, graus conjuntos, sem 7.as nem trítonos, saltos grandes compensados por grau, um só clímax, âmbito de uma 9.ª ou 10.ª (Jeppesen; Fux).',
    en: 'Half and quarter notes, stepwise motion, no sevenths or tritones, large leaps compensated by step, a single climax, a range of a 9th or 10th (Jeppesen; Fux).',
  },
  'style.chorale': { pt: 'Coral (Bach)', en: 'Chorale (Bach)' },
  'style.chorale.desc': {
    pt: 'Uma nota por tempo (semínimas), graus conjuntos, poucos saltos grandes, frases curtas com nota longa no fim; medido em 300 sopranos de corais de Bach.',
    en: 'One note per beat (quarters), steps, few large leaps, short phrases with a long final note; measured on 300 Bach chorale sopranos.',
  },
  'style.minuet': { pt: 'Minueto', en: 'Minuet' },
  'style.minuet.desc': { pt: '3/4 moderado, semínimas e colcheias, começa no tempo forte, frases de 4 compassos agrupadas em 8 (AABB).', en: 'Moderate 3/4, quarters and eighths, starts on the downbeat, 4-bar phrases grouped in 8 (AABB).' },
  'style.gavotte': { pt: 'Gavota', en: 'Gavotte' },
  'style.gavotte.desc': { pt: '4/4 moderado com anacrusa de meio compasso (as frases começam no 3.º tempo) e carácter saltitante (Mattheson).', en: 'Moderate 4/4 with a half-bar pickup (phrases start on beat 3) and a leaping character (Mattheson).' },
  'style.bourree': { pt: 'Bourrée', en: 'Bourrée' },
  'style.bourree.desc': { pt: '2/2 rápido com anacrusa de uma semínima e figuras longa-curta-curta.', en: 'Fast 2/2 with a one-quarter pickup and long-short-short figures.' },
  'style.sarabande': { pt: 'Sarabanda', en: 'Sarabande' },
  'style.sarabande.desc': { pt: '3/4 lento com a nota longa no 2.º tempo e poucas notas por tempo.', en: 'Slow 3/4 with the long note on beat 2 and few notes per beat.' },
  'style.gigue': { pt: 'Giga', en: 'Gigue' },
  'style.gigue.desc': { pt: '6/8 ou 12/8 rápido, colcheias contínuas com saltos e arpejos.', en: 'Fast 6/8 or 12/8, running eighths with leaps and arpeggios.' },
  'style.siciliana': { pt: 'Siciliana', en: 'Siciliana' },
  'style.siciliana.desc': { pt: '6/8 ou 12/8 lento com a figura colcheia pontuada + semicolcheia + colcheia, graus conjuntos, em geral em menor.', en: 'Slow 6/8 or 12/8 with the dotted eighth + sixteenth + eighth figure, stepwise, usually in minor.' },
  'style.passepied': { pt: 'Passepied', en: 'Passepied' },
  'style.passepied.desc': { pt: '3/8 rápido com as frases a começar no último tempo (anacrusa de uma colcheia).', en: 'Fast 3/8 with phrases starting on the last beat (an eighth-note pickup).' },
  'style.allemande': { pt: 'Alemanda', en: 'Allemande' },
  'style.allemande.desc': { pt: '4/4 moderado com anacrusa de uma semicolcheia e semicolcheias contínuas.', en: 'Moderate 4/4 with a sixteenth-note pickup and running sixteenths.' },
  'style.fortspinnung': { pt: 'Fortspinnung (sequências barrocas)', en: 'Fortspinnung (Baroque sequences)' },
  'style.fortspinnung.desc': {
    pt: 'Uma figura repetida transposta por grau (sequência), semicolcheias contínuas, âmbito largo (Fischer: Vordersatz–Fortspinnung–Epilog).',
    en: 'A figure repeated transposed by step (sequence), running sixteenths, wide range (Fischer: Vordersatz–Fortspinnung–Epilog).',
  },
  'style.classical': { pt: 'Tema clássico (frase e período)', en: 'Classical theme (sentence and period)' },
  'style.classical.desc': {
    pt: 'Motivos de 2 compassos repetidos e variados, alguma sequência, fins de frase longos, um clímax, âmbito de uma 10.ª (Caplin; Koch; Schoenberg).',
    en: '2-bar motifs repeated and varied, some sequence, long phrase endings, one climax, a range of a 10th (Caplin; Koch; Schoenberg).',
  },
  'style.hunt': { pt: 'Caça (tópico clássico)', en: 'Hunt (Classical topic)' },
  'style.hunt.desc': { pt: '6/8 vivo com arpejos da tríade e notas repetidas, como as trompas de caça.', en: 'Lively 6/8 with arpeggios of the triad and repeated notes, like hunting horns.' },
  'style.blues': { pt: 'Blues (12 compassos)', en: 'Blues (12 bars)' },
  'style.blues.desc': {
    pt: 'Forma AAB em 12 compassos, frases de 2 compassos com pausas para a resposta, síncopas, escala pentatónica (em modo menor, a pentatónica menor), notas repetidas.',
    en: 'AAB form in 12 bars, 2-bar phrases with rests for the answer, syncopation, pentatonic scale (in minor mode, the minor pentatonic), repeated notes.',
  },
  'style.jazz': { pt: 'Jazz (swing / bebop)', en: 'Jazz (swing / bebop)' },
  'style.jazz.desc': {
    pt: 'Linhas de colcheias, síncopas, frases que acabam fora do tempo, arpejos e saltos, âmbito largo. Os operadores escrevem na escala: sem as notas cromáticas do bebop.',
    en: 'Eighth-note lines, syncopation, phrases ending off the beat, arpeggios and leaps, wide range. The operators write in the scale: without bebop’s chromatic notes.',
  },
  'style.pop': { pt: 'Pop', en: 'Pop' },
  'style.pop.desc': {
    pt: 'Síncopas de antecipação, ganchos repetidos, notas repetidas, sem inércia do grau (Chiu & Temperley), escala pentatónica, pausas entre frases.',
    en: 'Anticipation syncopes, repeated hooks, repeated notes, no step inertia (Chiu & Temperley), pentatonic scale, rests between phrases.',
  },
  'rule.stepDown': { pt: 'Declinação por grau (graus a descer)', en: 'Step declination (falling steps)' },
  'rule.inertia': { pt: 'Inércia do grau', en: 'Step inertia' },
  'rule.leaps': { pt: 'Saltos de 4.ª ou mais', en: 'Leaps of a fourth or more' },
  'rule.recovery': { pt: 'Saltos compensados por grau contrário', en: 'Leaps recovered by an opposite step' },
  'rule.leapChain': { pt: 'Saltos seguidos fora de um acorde', en: 'Consecutive leaps outside a chord' },
  'rule.dissonant': { pt: 'Intervalos dissonantes (trítono, 7.as, > 8.ª)', en: 'Dissonant intervals (tritone, 7ths, > octave)' },
  'rule.range': { pt: 'Âmbito (meios-tons)', en: 'Range (semitones)' },
  'rule.climaxCount': { pt: 'Repetições da nota mais aguda', en: 'Repetitions of the highest note' },
  'rule.arch': { pt: 'Frases em arco', en: 'Arched phrases' },
  'rule.endLow': { pt: 'Fim de frase abaixo da média', en: 'Phrase endings below the mean' },
  'rule.finalLength': { pt: 'Alongamento da nota final da frase', en: 'Lengthening of the phrase-final note' },
  'rule.motifs': { pt: 'Compassos com um ritmo já ouvido', en: 'Bars repeating an earlier rhythm' },
  'rule.longOnBeat': { pt: 'Notas longas a começar num tempo', en: 'Long notes starting on a beat' },
  'rule.syncBar': { pt: 'Síncopas por compasso', en: 'Syncopations per bar' },
  'rule.density': { pt: 'Notas por tempo', en: 'Notes per beat' },
  'rule.steps': { pt: 'Graus conjuntos', en: 'Steps' },
  'rule.repeats': { pt: 'Notas repetidas', en: 'Repeated notes' },
  'rule.restShare': { pt: 'Pausas (parte do tempo)', en: 'Rests (share of the time)' },
  'rule.pentatonic': { pt: 'Notas da pentatónica', en: 'Pentatonic notes' },
  'rule.bigLeaps': { pt: 'Saltos de 6.ª ou mais', en: 'Leaps of a sixth or more' },
  'rule.dirChanges': { pt: 'Mudanças de direção', en: 'Changes of direction' },
  'rule.phraseDescent': { pt: 'Frases que acabam abaixo do início', en: 'Phrases ending below their start' },
  'rule.firstOnset': { pt: 'Anacrusa (posição da 1.ª nota, em semicolcheias)', en: 'Pickup (position of the first note, in sixteenths)' },
  'rule.chromatic': { pt: 'Notas fora da escala', en: 'Notes outside the scale' },
  'rule.arpeggio': { pt: 'Saltos em arpejo', en: 'Arpeggiated leaps' },
  'rule.threeQuarterEnd': { pt: 'Fim de parte em três semínimas', en: 'Strain ending on three quarters' },
  'rule.downbeatLong': { pt: 'Nota longa no 1.º tempo', en: 'Long note on the downbeat' },
  'rule.beat2Long': { pt: 'Nota longa no 2.º tempo', en: 'Long note on beat 2' },
  'rule.finalBeat': { pt: 'Tempo da nota final (0 = 1.º)', en: 'Beat of the final note (0 = 1st)' },
  'rule.sequences': { pt: 'Sequências (compasso transposto)', en: 'Sequences (bar transposed)' },
  'rule.offbeatEnds': { pt: 'Frases que acabam fora do tempo', en: 'Phrases ending off the beat' },
  'rule.fig:rocking': { pt: 'Balanço (semínima + colcheia, semínima pontuada)', en: 'Rocking (quarter + eighth, dotted quarter)' },
  'rule.fig:quarters': { pt: 'Tempos numa semínima', en: 'Beats as one quarter note' },
  'rule.fig:eighths': { pt: 'Tempos em duas colcheias', en: 'Beats as two eighths' },
  'rule.fig:threeEighths': { pt: 'Tempos em três colcheias', en: 'Beats as three eighths' },
  'rule.fig:longShort': { pt: 'Semínima + colcheia', en: 'Quarter + eighth' },
  'rule.fig:dotted': { pt: 'Colcheia pontuada + semicolcheia', en: 'Dotted eighth + sixteenth' },
  'rule.fig:snap': { pt: '«Scotch snap» (semicolcheia + colcheia pontuada)', en: '“Scotch snap” (sixteenth + dotted eighth)' },
  'rule.fig:quickQuick': { pt: 'Colcheia + 2 semicolcheias (ou o inverso)', en: 'Eighth + 2 sixteenths (or the reverse)' },
  'rule.fig:shortShort': { pt: '1.º tempo com duas notas curtas', en: 'Beat 1 with two short notes' },
  'rule.fig:polonaise': { pt: 'Colcheia + 2 semicolcheias no 1.º tempo', en: 'Eighth + 2 sixteenths on beat 1' },
  'rule.fig:habanera': { pt: 'Pontuado no 1.º tempo (habanera)', en: 'Dotted figure on beat 1 (habanera)' },
  'rule.fig:sincopa': { pt: 'Síncopa semicolcheia–colcheia–semicolcheia', en: 'Síncopa sixteenth–eighth–sixteenth' },
  'rule.fig:long': { pt: 'Tempos em notas longas (semínima ou mais)', en: 'Beats in long notes (quarter or longer)' },
  'rule.fig:quartersEighths': { pt: 'Tempos em semínima ou duas colcheias', en: 'Beats as a quarter or two eighths' },
  'rule.fig:sixteenths': { pt: 'Tempos em quatro semicolcheias', en: 'Beats as four sixteenths' },
  'rule.fig:siciliana': { pt: 'Figura da siciliana (pontuada)', en: 'Siciliana figure (dotted)' },
  'rule.fig:jigging': { pt: 'Figuras de jiga (semínima + colcheia, três colcheias)', en: 'Jig figures (quarter + eighth, three eighths)' },
  'heur.title': { pt: 'Heurísticas de composição (melhor indivíduo)', en: 'Composition heuristics (best individual)' },
  'heur.summary': {
    pt: '{style}: {inside} de {n} regras dentro do intervalo-alvo (pontuação {score} em [−1, 1]). O alvo é o P10–P90 da música real (corpus) ou o valor da literatura; as fontes são as linhas de results/estilos/literatura.csv.',
    en: '{style}: {inside} of {n} rules inside their target range (score {score} in [−1, 1]). The target is the P10–P90 of real music (corpus) or the value from the literature; the sources are rows of results/estilos/literatura.csv.',
  },
  'heur.general': { pt: 'Regras gerais', en: 'General rules' },
  'heur.col.rule': { pt: 'regra', en: 'rule' },
  'heur.col.value': { pt: 'valor', en: 'value' },
  'heur.col.target': { pt: 'alvo', en: 'target' },
  'heur.col.sources': { pt: 'fontes', en: 'sources' },
  'heur.fromCorpus': { pt: 'corpus', en: 'corpus' },
  'heur.fromLiterature': { pt: 'literatura', en: 'literature' },
  'heur.off': {
    pt: 'O peso «Heurísticas de composição» está a 0: estas regras não entram na aptidão (mostram só como a melodia se compara com a música real).',
    en: 'The “Composition heuristics” weight is 0: these rules are not part of the fitness (they only show how the melody compares with real music).',
  },

  // ------------------------------------------------------------------ genetic algorithm, starting point, run
  'ga.title': { pt: 'Algoritmo genético', en: 'Genetic algorithm' },
  'ga.generations': { pt: 'Gerações', en: 'Generations' },
  'ga.pop': { pt: 'População', en: 'Population' },
  'ga.mutation': { pt: 'Mutação', en: 'Mutation' },
  'ga.operators': { pt: 'Operadores', en: 'Operators' },
  'ops.musicalFull': { pt: 'Musicais (Matić, GenJam)', en: 'Musical (Matić, GenJam)' },
  'ops.binaryFull': { pt: 'Bits (como o GeneticSharp)', en: 'Bits (as in GeneticSharp)' },
  'start.title': { pt: 'Ponto de partida', en: 'Starting point' },
  'start.each': { pt: 'Cada geração', en: 'Each run' },
  'start.seedOpt': { pt: 'Do zero (semente)', en: 'From scratch (seed)' },
  'start.newSeedOpt': { pt: 'Do zero (semente nova)', en: 'From scratch (new seed)' },
  'start.continueOpt': { pt: 'Continua a anterior', en: 'Continue the previous one' },
  'init.title': { pt: 'População inicial', en: 'Initial population' },
  'init.auto': { pt: 'Com padrões musicais', en: 'With musical patterns' },
  'init.musical': { pt: 'Com padrões musicais, sem cânone', en: 'With musical patterns, without canon' },
  'init.random': { pt: 'Aleatória, sem padrões', en: 'Random, no patterns' },
  'init.blocks': { pt: 'Blocos do corpus', en: 'Corpus blocks' },
  'ga.seed': { pt: 'Semente', en: 'Seed' },
  'ga.slow': { pt: 'Ver a evolução devagar (geração a geração no início)', en: 'Watch the evolution slowly (generation by generation at first)' },
  'run.generate': { pt: 'Gerar', en: 'Generate' },
  'run.reseed': { pt: 'Outra semente', en: 'Another seed' },
  'run.reseed.title': { pt: 'Nova semente e gerar', en: 'New seed and generate' },
  'run.batch': { pt: 'Testar 5 sementes', en: 'Try 5 seeds' },
  'run.batch.title': { pt: 'Gera com 5 sementes seguidas e resume os resultados', en: 'Generates with 5 consecutive seeds and summarises the results' },
  'status.ready': { pt: 'Pronto.', en: 'Ready.' },
  'status.readyDesc': { pt: 'Pronto. {desc}.', en: 'Ready. {desc}.' },
  'status.auto': {
    pt: 'Auto-configurado a partir das vozes: ondas no registo comum dos instrumentos, forma, pesos e algoritmo por omissão.',
    en: 'Auto-configured from the voices: waves in the instruments’ common register, default form, weights and algorithm.',
  },
  'status.surprise': { pt: 'Surpresa: {desc}. Carregue em Gerar.', en: 'Surprise: {desc}. Press Generate.' },
  'status.reset': { pt: 'Configuração por omissão.', en: 'Default configuration.' },
  'start.hint.seed': {
    pt: 'Cada «Gerar» parte do zero. A mesma semente dá a mesma população inicial e as mesmas escolhas ao acaso, por isso definições parecidas dão resultados parecidos.',
    en: 'Each “Generate” starts from scratch. The same seed gives the same initial population and the same random choices, so similar settings give similar results.',
  },
  'start.hint.newSeed': {
    pt: 'Cada «Gerar» parte do zero com uma semente nova (fica registada na experiência, para a poder repetir).',
    en: 'Each “Generate” starts from scratch with a new seed (it is recorded in the experiment, so it can be repeated).',
  },
  'start.hint.noPrev': {
    pt: 'Ainda não há população anterior: a próxima geração parte do zero e as seguintes continuam dela.',
    en: 'There is no previous population yet: the next run starts from scratch and the following ones continue from it.',
  },
  'start.hint.otherMeter': {
    pt: 'A população da experiência {n} tem outro compasso ou outro número de compassos: a próxima geração parte do zero.',
    en: 'The population of experiment {n} has another time signature or number of bars: the next run starts from scratch.',
  },
  'start.hint.continue': {
    pt: 'A próxima geração continua da população final da experiência {n}, reavaliada com as definições atuais.',
    en: 'The next run continues from the final population of experiment {n}, re-evaluated with the current settings.',
  },
  'start.hint.binary': {
    pt: 'Com operadores de bits a população inicial é sempre a do programa original (genes ao acaso entre 0 e 74).',
    en: 'With bit operators the initial population is always the original program’s (random genes between 0 and 74).',
  },
  'start.hint.random': {
    pt: 'População inicial sem padrões: cada semicolcheia é, ao acaso, pausa, prolongamento ou uma nota cromática do registo. Parte do ruído (crítico ≈ 0) e precisa de 2–3 vezes mais gerações para chegar ao mesmo nível.',
    en: 'Initial population without patterns: each sixteenth is, at random, a rest, a prolongation or a chromatic note of the register. It starts from noise (critic ≈ 0) and needs 2–3 times more generations to reach the same level.',
  },
  'start.hint.musical': {
    pt: 'População inicial com células rítmicas e graus da escala, sem ter em conta o cânone.',
    en: 'Initial population with rhythmic cells and scale degrees, without taking the canon into account.',
  },
  'start.hint.blocks': {
    pt: 'População inicial escrita com os blocos das melodias reais: cada tempo segue o anterior com as probabilidades do corpus, os blocos associados aos já usados ficam mais prováveis, e a 1.ª nota segue a distribuição real (5.ª 49 %, tónica 28 %, 3.ª 13 %). Uma mutação reescreve tempos da mesma forma.',
    en: 'Initial population written with the blocks of real melodies: each beat follows the previous one with the corpus probabilities, blocks associated with those already used become more likely, and the first note follows the real distribution (5th 49 %, tonic 28 %, 3rd 13 %). A mutation rewrites beats the same way.',
  },
  'start.hint.canon': {
    pt: 'População inicial com células rítmicas e graus da escala, já escrita em cânone com as outras vozes.',
    en: 'Initial population with rhythmic cells and scale degrees, already written in canon with the other voices.',
  },
  'start.hint.auto': {
    pt: 'População inicial com células rítmicas e graus da escala: já soa a melodia antes de evoluir.',
    en: 'Initial population with rhythmic cells and scale degrees: it already sounds like a melody before evolving.',
  },
  'run.voices': { pt: '{n} vozes · ', en: '{n} voices · ' },
  'run.seed': { pt: 'semente {seed}', en: 'seed {seed}' },
  'run.continues': { pt: ' · continua a exp. {n}', en: ' · continues exp. {n}' },
  'run.evolving': { pt: ' · geração {g} (a evoluir…)', en: ' · generation {g} (evolving…)' },
  'run.status': { pt: 'Geração {g} · avaliações {e} · aptidão {f} · {s} s', en: 'Generation {g} · evaluations {e} · fitness {f} · {s} s' },
  'run.stopped': { pt: ' · parado', en: ' · stopped' },
  'run.done': { pt: ' · concluído', en: ' · done' },
  'run.invalid': { pt: 'Configuração inválida: {msg}', en: 'Invalid configuration: {msg}' },

  // ------------------------------------------------------------------ configuration text, evolution, rules, experiments
  'config.summary': { pt: 'Copiar ou colar a configuração', en: 'Copy or paste the configuration' },
  'config.aria': { pt: 'Configuração em JSON', en: 'Configuration as JSON' },
  'config.apply': { pt: 'Aplicar o texto', en: 'Apply the text' },
  'config.note': {
    pt: 'Guarde este texto para repetir a experiência mais tarde, ou cole outro e carregue em «Aplicar o texto».',
    en: 'Keep this text to repeat the experiment later, or paste another one and press “Apply the text”.',
  },
  'config.missingVoices': { pt: 'faltam as vozes', en: 'the voices are missing' },
  'config.needWave': { pt: 'é precisa pelo menos uma onda', en: 'at least one wave is needed' },
  'config.applied': { pt: 'Configuração aplicada: {desc}.', en: 'Configuration applied: {desc}.' },
  'config.appliedShort': { pt: 'Aplicada.', en: 'Applied.' },
  'config.invalid': { pt: 'Texto inválido ({msg}).', en: 'Invalid text ({msg}).' },
  'evo.title': { pt: 'Evolução', en: 'Evolution' },
  'evo.aria': { pt: 'Aptidão ao longo das gerações', en: 'Fitness over the generations' },
  'evo.best': { pt: 'melhor', en: 'best' },
  'evo.mean': { pt: 'média da população', en: 'population mean' },
  'evo.diversity': { pt: 'diversidade (0–1, eixo próprio)', en: 'diversity (0–1, own axis)' },
  'chart.generation': { pt: 'geração', en: 'generation' },
  'chart.cycles': { pt: 'ciclos por compasso', en: 'cycles per bar' },
  'conv.title': { pt: 'Convergência', en: 'Convergence' },
  'conv.hint': {
    pt: 'O melhor indivíduo em algumas gerações da última experiência: clique para o ver e ouvir na partitura.',
    en: 'The best individual at some generations of the last experiment: click to see and hear it in the score.',
  },
  'snap.title': { pt: 'Melhor indivíduo na geração {g}: aptidão {f}, crítico {c}', en: 'Best individual at generation {g}: fitness {f}, critic {c}' },
  'snap.label': { pt: 'ger. {g}', en: 'gen. {g}' },
  'snap.critic': { pt: 'crítico {c}', en: 'critic {c}' },
  'snap.pieceTitle': { pt: 'Experiência {n} · geração {g}', en: 'Experiment {n} · generation {g}' },
  'parts.title': { pt: 'Contribuição das regras (melhor indivíduo)', en: 'Contribution of the rules (best individual)' },
  'parts.hint.field': {
    pt: 'Cada regra é uma média em [−1, 1] multiplicada pelo seu peso; barras relativas à maior contribuição.',
    en: 'Each rule is a mean in [−1, 1] multiplied by its weight; bars relative to the largest contribution.',
  },
  'parts.hint.classic': {
    pt: 'Regras originais: somas (não médias) multiplicadas pelo peso do grupo ativo; barras relativas à maior.',
    en: 'Original rules: sums (not means) multiplied by the weight of the active group; bars relative to the largest.',
  },
  'exp.title': { pt: 'Experiências', en: 'Experiments' },
  'exp.hint': {
    pt: 'Cada geração fica registada com a configuração usada. «Carregar» repõe essa configuração e a peça; «Gerar» repete-a.',
    en: 'Each run is recorded with the settings used. “Load” restores those settings and the piece; “Generate” repeats it.',
  },
  'exp.none': { pt: 'Ainda sem experiências.', en: 'No experiments yet.' },
  'exp.seed': { pt: ' · semente {s}', en: ' · seed {s}' },
  'exp.stoppedTag': { pt: ' · parada', en: ' · stopped' },
  'exp.col.config': { pt: 'Configuração', en: 'Configuration' },
  'exp.col.fitness': { pt: 'aptidão', en: 'fitness' },
  'exp.col.critic': { pt: 'crítico', en: 'critic' },
  'exp.col.consonance': { pt: 'consonância entre vozes', en: 'consonance between voices' },
  'exp.load': { pt: 'Carregar', en: 'Load' },
  'exp.loadedTitle': { pt: 'Experiência {n} · semente {s}', en: 'Experiment {n} · seed {s}' },
  'exp.loaded': { pt: 'Experiência {n} carregada: {desc}. «Gerar» repete-a com a mesma semente.', en: 'Experiment {n} loaded: {desc}. “Generate” repeats it with the same seed.' },
  'batch.testing': { pt: 'A testar a semente {s} ({k} de 5)…', en: 'Testing seed {s} ({k} of 5)…' },
  'batch.summary': { pt: 'Resumo de {n} sementes · {a}–{b}', en: 'Summary of {n} seeds · {a}–{b}' },
  'batch.best': { pt: 'melhor pelo crítico', en: 'best by the critic' },
  'batch.bestValue': { pt: 'experiência {n} (semente {s})', en: 'experiment {n} (seed {s})' },
  'batch.hint': {
    pt: 'Uma configuração é robusta quando o crítico fica alto em todas as sementes, não só na melhor. Compare dois resumos antes de concluir que uma mudança ajudou.',
    en: 'A configuration is robust when the critic stays high for every seed, not only the best one. Compare two summaries before concluding that a change helped.',
  },

  // ------------------------------------------------------------------ describe(), chips, legend
  'note.0': { pt: 'Dó', en: 'C' },
  'note.1': { pt: 'Dó#', en: 'C#' },
  'note.2': { pt: 'Ré', en: 'D' },
  'note.3': { pt: 'Mib', en: 'Eb' },
  'note.4': { pt: 'Mi', en: 'E' },
  'note.5': { pt: 'Fá', en: 'F' },
  'note.6': { pt: 'Fá#', en: 'F#' },
  'note.7': { pt: 'Sol', en: 'G' },
  'note.8': { pt: 'Láb', en: 'Ab' },
  'note.9': { pt: 'Lá', en: 'A' },
  'note.10': { pt: 'Sib', en: 'Bb' },
  'note.11': { pt: 'Si', en: 'B' },
  'describe.entry': { pt: 'c.{bar}', en: 'bar {bar}' },
  'describe.classic': { pt: 'regras originais ({preset}, {ops})', en: 'original rules ({preset}, {ops})' },
  'describe.handValues': { pt: 'valores à mão', en: 'hand-set values' },
  'describe.waves.one': { pt: '{n} onda ({types})', en: '{n} wave ({types})' },
  'describe.waves.other': { pt: '{n} ondas ({types})', en: '{n} waves ({types})' },
  'describe.style': { pt: 'estilo {name}', en: 'style {name}' },
  'chip.fitness': { pt: 'aptidão', en: 'fitness' },
  'chip.critic': { pt: 'crítico', en: 'critic' },
  'chip.critic.title': { pt: 'Probabilidade de ser uma melodia real segundo o crítico', en: 'Probability of being a real melody according to the critic' },
  'chip.typical': { pt: 'típico', en: 'typical' },
  'chip.typical.title': { pt: 'Características dentro do intervalo P10–P90 das melodias reais', en: 'Features inside the P10–P90 range of real melodies' },
  'chip.rests': { pt: 'pausas', en: 'rests' },
  'chip.voices': { pt: '{n} vozes · consonância', en: '{n} voices · consonance' },
  'chip.voices.title': { pt: 'Consonâncias nos tempos fortes entre todas as vozes (média dos pares)', en: 'Consonances on strong beats between all the voices (mean of the pairs)' },
  'chip.parallels': { pt: 'paralelas', en: 'parallels' },
  'chip.parallels.title': { pt: 'Quintas e oitavas paralelas entre quaisquer duas vozes', en: 'Parallel fifths and octaves between any two voices' },
  'chip.triads': { pt: 'tríades', en: 'triads' },
  'chip.triads.title': { pt: 'Tempos fortes em que as três vozes formam um acorde perfeito', en: 'Strong beats where the three voices form a perfect chord' },
  'chip.out': { pt: 'fora do registo', en: 'out of range' },
  'chip.out.title': { pt: 'Notas fora do alcance de algum instrumento', en: 'Notes outside the reach of some instrument' },
  'chip.asCanon': { pt: 'como cânone a 1 c.', en: 'as a canon at 1 bar' },
  'chip.asCanon.title': { pt: 'Se fosse tocada em cânone com uma 2.ª voz a 1 compasso', en: 'If it were played as a canon with a 2nd voice 1 bar later' },
  'chip.heuristics': { pt: 'heurísticas', en: 'heuristics' },
  'chip.heuristics.title': { pt: 'Regras das heurísticas de composição dentro do intervalo-alvo (estilo: {style})', en: 'Composition-heuristic rules inside their target range (style: {style})' },
  'legend.melody': { pt: '{inst} (melodia)', en: '{inst} (melody)' },
  'legend.entry': { pt: '{inst} · entra no c. {bar}', en: '{inst} · enters at bar {bar}' },
  'legend.wave': { pt: 'onda {n} · {basin}', en: 'wave {n} · {basin}' },
  'legend.basinStep': { pt: 'bacia ±{b} meios-tons', en: 'basin ±{b} semitones' },
  'legend.basinSigma': { pt: 'bacia σ {b}', en: 'basin σ {b}' },
  'legend.preview': { pt: ' (tracejado: configuração atual, ainda por gerar)', en: ' (dashed: current settings, not yet generated)' },
  'legend.low': { pt: 'onda de frequência mais baixa', en: 'lowest-frequency wave' },
  'legend.fast': { pt: 'ondas mais rápidas', en: 'faster waves' },
  'legend.bands': { pt: 'faixas: partes', en: 'bands: parts' },

  // ------------------------------------------------------------------ export and downloads
  'score.error': { pt: 'Não foi possível mostrar a partitura ({msg}). O código LilyPond continua disponível.', en: 'Could not show the score ({msg}). The LilyPond code is still available.' },
  'pdf.preparing': { pt: 'A preparar o PDF…', en: 'Preparing the PDF…' },
  'pdf.line': { pt: 'numa só linha, com as entradas das vozes', en: 'on a single line, with the voices’ entries' },
  'pdf.staves': { pt: 'com uma pauta por voz', en: 'with one staff per voice' },
  'pdf.smaller': { pt: ', pauta a {size} % para caber em menos uma página', en: ', staff at {size} % to fit on one page fewer' },
  'pdf.bigger': { pt: ', pauta a {size} % para encher as páginas', en: ', staff at {size} % to fill the pages' },
  'pdf.pages.one': { pt: '{n} página', en: '{n} page' },
  'pdf.pages.other': { pt: '{n} páginas', en: '{n} pages' },
  'pdf.saved': { pt: 'Guardado: ZIP com a partitura em PDF ({info}).', en: 'Saved: ZIP with the score as a PDF ({info}).' },
  'pdf.done': { pt: 'PDF: {info}.', en: 'PDF: {info}.' },
  'pdf.attachment': { pt: 'A peça em MIDI, com as definições para a reabrir em Ondas Atratoras', en: 'The piece as MIDI, with the settings to reopen it in Attractor Waves' },
  'pdf.footer.attached': { pt: 'MIDI anexado', en: 'MIDI attached' },
  'pdf.withMidi': { pt: 'com o MIDI anexado', en: 'with the MIDI file attached' },
  'pdf.qr': { pt: ' e um QR code versão {v} ({n}×{n} módulos, correção {ecl}, {bytes} bytes)', en: ' and a version {v} QR code ({n}×{n} modules, correction {ecl}, {bytes} bytes)' },
  'pdf.qrTooBig': {
    pt: '; sem QR code: a música comprimida ({bytes} bytes) não cabe no maior QR code (2953 bytes)',
    en: '; no QR code: the compressed piece ({bytes} bytes) does not fit the largest QR code (2953 bytes)',
  },
  'qr.pdf.title': { pt: 'Ouvir no telemóvel', en: 'Listen on a phone' },
  'qr.pdf.text': {
    pt: 'Aponte a câmara a este código: abre no navegador um leitor que toca esta música, sem instalar nada; daí pode descarregar o MIDI ou abrir a peça em Ondas Atratoras. O código traz o ficheiro MIDI inteiro, comprimido, no próprio endereço (depois de #), que não é enviado a nenhum servidor.',
    en: 'Point the camera at this code: it opens in the browser a player that plays this piece, with nothing to install; from there the MIDI file can be saved or the piece opened in Attractor Waves. The code carries the whole MIDI file, compressed, in the address itself (after #), which is not sent to any server.',
  },
  'qr.pdf.attached': {
    pt: 'O PDF traz também o MIDI anexado: em «Abrir PDF ou MIDI…» a página recupera a peça com as suas definições.',
    en: 'The PDF also carries the MIDI file attached: with “Open PDF or MIDI…” the page brings back the piece with its settings.',
  },
  'link.copied': { pt: 'Ligação copiada ({n} caracteres, com o MIDI dentro).', en: 'Link copied ({n} characters, with the MIDI file inside).' },
  'link.prompt': { pt: 'Ligação com a música:', en: 'Link with the piece:' },
  'link.error': { pt: 'Não foi possível abrir a música da ligação ({msg}).', en: 'Could not open the piece in the link ({msg}).' },
  'song.untitled': { pt: 'Peça recuperada', en: 'Recovered piece' },
  'song.busy': { pt: 'Pare o algoritmo antes de abrir outra peça.', en: 'Stop the algorithm before opening another piece.' },
  'song.opened': { pt: 'Aberta {how}: {title}.', en: 'Opened {how}: {title}.' },
  'song.from.link': { pt: 'a partir da ligação (QR code)', en: 'from the link (QR code)' },
  'song.from.pdf': { pt: 'a partir do PDF (MIDI anexado)', en: 'from the PDF (attached MIDI file)' },
  'song.from.midi': { pt: 'a partir do ficheiro MIDI', en: 'from the MIDI file' },
  'song.play': { pt: 'Carregue em ▶ Tocar para ouvir.', en: 'Press ▶ Play to listen.' },
  'open.noMidi': { pt: 'este PDF não traz nenhum MIDI anexado', en: 'this PDF has no MIDI file attached' },
  'open.noRecord': { pt: 'o MIDI não traz os dados da peça', en: 'the MIDI file does not carry the piece’s data' },
  'open.foreign': {
    pt: '{name} não foi feito por esta página: a melodia está pronta a analisar (Fonte: Ficheiro MIDI carregado).',
    en: '{name} was not made by this page: its melody is ready to analyse (Source: Uploaded MIDI file).',
  },
  'open.error': { pt: 'Não foi possível abrir o ficheiro ({msg}).', en: 'Could not open the file ({msg}).' },
  'pdf.error': { pt: 'Não foi possível criar o PDF ({msg}).', en: 'Could not create the PDF ({msg}).' },
  'lily.saved': { pt: 'Guardado: ZIP com o ficheiro LilyPond (.ly).', en: 'Saved: ZIP with the LilyPond file (.ly).' },
  'dl.tracks.one': { pt: '{n} pista', en: '{n} track' },
  'dl.tracks.other': { pt: '{n} pistas', en: '{n} tracks' },
  'dl.midiSaved': { pt: 'Guardado: ZIP com o ficheiro MIDI ({tracks}).', en: 'Saved: ZIP with the MIDI file ({tracks}).' },
  'dl.declined': { pt: 'Download cancelado.', en: 'Download cancelled.' },
  'dl.rate': { pt: 'Já há um pedido de download aberto; tente daqui a pouco.', en: 'A download request is already open; try again shortly.' },
  'dl.unavailable': { pt: 'Este visualizador não permite downloads; use web/dist/ondas-atratoras.html do repositório.', en: 'This viewer does not allow downloads; use web/dist/ondas-atratoras.html from the repository.' },
  'score.footer': { pt: 'Ondas Atratoras · algoritmo genético', en: 'Attractor Waves · genetic algorithm' },
  'score.vexInit': { pt: 'VexFlow não inicializou', en: 'VexFlow did not initialise' },
  'score.vexLoad': { pt: 'não foi possível carregar vendor/vexflow-gonville.js', en: 'could not load vendor/vexflow-gonville.js' },
  'score.where.bar': { pt: 'no c. {bar}', en: 'at bar {bar}' },
  'score.where.beat': { pt: 'no c. {bar} ({beat}.º tempo)', en: 'at bar {bar} (beat {beat})' },
  'score.legend.round': {
    pt: 'Ronda a {n} vozes numa só linha: cada voz começa do início quando a 1.ª voz chega ao seu número.',
    en: 'Round in {n} voices on a single line: each voice starts from the beginning when the 1st voice reaches its number.',
  },
  'score.legend.canon': {
    pt: 'Cânone a {n} vozes numa só linha: cada voz começa do início quando a 1.ª voz chega ao seu número.',
    en: 'Canon in {n} voices on a single line: each voice starts from the beginning when the 1st voice reaches its number.',
  },
  'score.legend.lead': { pt: '{name} — a melodia, desde o início', en: '{name} — the melody, from the beginning' },
  'score.legend.entry': { pt: '{name} — entra quando a 1.ª voz está {where}{interval}', en: '{name} — comes in when the 1st voice is {where}{interval}' },
  'score.legend.repeatEnd': {
    pt: 'Nos sinais de repetição cada voz volta ao início; para acabar, as vozes param uma a uma no fim da linha.',
    en: 'At the repeat signs each voice goes back to the beginning; to finish, the voices stop one by one at the end of the line.',
  },
  'score.legend.end': {
    pt: 'Cada voz toca a linha até ao fim; a peça acaba quando a última voz termina ({bars} compassos ao todo).',
    en: 'Each voice plays the line to the end; the piece ends when the last voice finishes ({bars} bars in all).',
  },

  // ------------------------------------------------------------------ Explore (MAP-Elites)
  'me.title': { pt: 'Mapa de variações (MAP-Elites)', en: 'Map of variations (MAP-Elites)' },
  'me.hint': {
    pt: 'Um AG elitista converge para uma só melodia. O MAP-Elites (Mouret &amp; Clune 2015) guarda a melhor melodia de cada célula de uma grelha de características e devolve um mapa de peças boas e diferentes. Usa os parâmetros do separador Compor.',
    en: 'An elitist GA converges on a single melody. MAP-Elites (Mouret &amp; Clune 2015) keeps the best melody of each cell of a grid of features and returns a map of good and different pieces. It uses the settings of the Compose tab.',
  },
  'me.x': { pt: 'Eixo horizontal', en: 'Horizontal axis' },
  'me.y': { pt: 'Eixo vertical', en: 'Vertical axis' },
  'me.evals': { pt: 'Avaliações', en: 'Evaluations' },
  'me.run': { pt: 'Iluminar mapa', en: 'Illuminate map' },
  'me.status': { pt: 'Clique numa célula para ouvir essa melodia.', en: 'Click a cell to hear that melody.' },
  'me.aria': { pt: 'Mapa MAP-Elites', en: 'MAP-Elites map' },
  'me.progress': { pt: '{e} avaliações · {c} % do mapa preenchido · melhor {b}', en: '{e} evaluations · {c} % of the map filled · best {b}' },
  'me.click': { pt: ' · clique numa célula para a ouvir', en: ' · click a cell to hear it' },
  'me.cellTitle': { pt: 'Mapa · {x} {vx} · {y} {vy}', en: 'Map · {x} {vx} · {y} {vy}' },
  'me.cellInfo': { pt: 'Célula selecionada: aptidão {f} · crítico {c}', en: 'Selected cell: fitness {f} · critic {c}' },
  'descriptor.density': { pt: 'Notas por tempo', en: 'Notes per beat' },
  'descriptor.leaps': { pt: 'Intervalo médio (semitons)', en: 'Mean interval (semitones)' },
  'descriptor.range': { pt: 'Âmbito (semitons)', en: 'Range (semitones)' },
  'descriptor.register': { pt: 'Altura média (MIDI)', en: 'Mean pitch (MIDI)' },

  // ------------------------------------------------------------------ Variations
  'var.title': { pt: 'Variações por mapeamento caótico', en: 'Variations by chaotic mapping' },
  'var.hint': {
    pt: 'Dabby (1996): as notas do tema são associadas à coordenada x de uma trajetória de Lorenz; uma segunda trajetória com condição inicial ligeiramente diferente volta a ler o tema. A variação começa igual e afasta-se progressivamente, reutilizando o material do tema.',
    en: 'Dabby (1996): the notes of the theme are paired with the x coordinate of a Lorenz trajectory; a second trajectory with a slightly different initial condition reads the theme again. The variation starts identical and drifts away progressively, reusing the theme’s material.',
  },
  'var.divergence': { pt: 'Divergência', en: 'Divergence' },
  'var.divergenceValue': { pt: 'perturbação inicial {v} (x₀ = {x0})', en: 'initial perturbation {v} (x₀ = {x0})' },
  'var.what': { pt: 'O que varia', en: 'What varies' },
  'var.pitch': { pt: 'Só alturas (mantém o ritmo)', en: 'Pitches only (keeps the rhythm)' },
  'var.full': { pt: 'Alturas e ritmo', en: 'Pitches and rhythm' },
  'var.rule': { pt: 'Regra', en: 'Rule' },
  'var.nearest': { pt: 'x mais próximo', en: 'nearest x' },
  'var.ceiling': { pt: 'Dabby: menor x ≥ x′', en: 'Dabby: smallest x ≥ x′' },
  'var.run': { pt: 'Gerar 3 variações', en: 'Make 3 variations' },
  'var.form': { pt: 'Montar forma A A′ B A″', en: 'Build the form A A′ B A″' },
  'var.listTitle': { pt: 'Tema e variações', en: 'Theme and variations' },
  'var.placeholder': { pt: 'Gere uma melodia em Compor (ou escolha uma no mapa) e depois as variações.', en: 'Generate a melody in Compose (or pick one on the map), then the variations.' },
  'var.loaded': { pt: 'Tema carregado. Carregue em «Gerar 3 variações».', en: 'Theme loaded. Press “Make 3 variations”.' },
  'var.theme': { pt: 'Tema', en: 'Theme' },
  'var.original': { pt: 'original', en: 'original' },
  'var.n': { pt: 'Variação {n}', en: 'Variation {n}' },
  'var.info': { pt: 'perturbação {d} · igual até à nota {k} · {s} % das notas iguais', en: 'perturbation {d} · identical up to note {k} · {s} % of the notes equal' },
  'var.play': { pt: 'Tocar {label}', en: 'Play {label}' },
  'var.view': { pt: 'Ver na partitura', en: 'Show in the score' },
  'var.of': { pt: '{label} de «{title}»', en: '{label} of “{title}”' },
  'var.formTitle': { pt: 'Forma A A′ B A″ (variações de Dabby)', en: 'Form A A′ B A″ (Dabby variations)' },

  // ------------------------------------------------------------------ Analyse
  'an.title': { pt: 'Analisador de ondas', en: 'Wave analyser' },
  'an.hint': {
    pt: 'Inverte o modelo: que ondas atratoras explicam uma melodia? Em cada parte ajusta ondas sinusoidais por EM (cada nota é atraída por cada onda com um peso que decai com a distância), escolhe o número de ondas pelo BIC e calcula o espectro do contorno com um teste de permutação.',
    en: 'Inverts the model: which attractor waves explain a melody? In each part it fits sine waves by EM (each note is attracted by each wave with a weight that decays with the distance), chooses the number of waves by BIC and computes the spectrum of the contour with a permutation test.',
  },
  'an.piece': { pt: 'Peça', en: 'Piece' },
  'an.corpus': { pt: 'Melodia do corpus', en: 'Corpus melody' },
  'an.file': { pt: 'Ficheiro MIDI', en: 'MIDI file' },
  'an.parts': { pt: 'Partes', en: 'Parts' },
  'an.partsCount.one': { pt: '{n} parte', en: '{n} part' },
  'an.partsCount.other': { pt: '{n} partes', en: '{n} parts' },
  'an.segmentation': { pt: 'Segmentação', en: 'Segmentation' },
  'an.seg.phrase': { pt: 'Fronteiras de frase (LBDM)', en: 'Phrase boundaries (LBDM)' },
  'an.seg.equal': { pt: 'Partes iguais', en: 'Equal parts' },
  'an.waves': { pt: 'Ondas por parte', en: 'Waves per part' },
  'an.waves.auto': { pt: 'Automático (BIC)', en: 'Automatic (BIC)' },
  'an.run': { pt: 'Analisar', en: 'Analyse' },
  'an.use': { pt: 'Usar ondas da 1.ª parte no gerador', en: 'Use the waves of part 1 in the generator' },
  'an.summaryTitle': { pt: 'Resumo', en: 'Summary' },
  'an.summaryPlaceholder': { pt: 'Escolha uma peça e carregue em Analisar.', en: 'Choose a piece and press Analyse.' },
  'an.src.current': { pt: 'Peça atual', en: 'Current piece' },
  'an.src.telemann': { pt: 'Telemann — Sonata I (TWV 40:118), Vivace', en: 'Telemann — Sonata I (TWV 40:118), Vivace' },
  'an.src.telemann2': { pt: 'Telemann — Sonata II (TWV 40:119), Vivace', en: 'Telemann — Sonata II (TWV 40:119), Vivace' },
  'an.src.telemann3': { pt: 'Telemann — Sonata III (TWV 40:120), Spirituoso', en: 'Telemann — Sonata III (TWV 40:120), Spirituoso' },
  'an.src.frereJacques': { pt: 'Frère Jacques (ronda)', en: 'Frère Jacques (round)' },
  'an.src.rowYourBoat': { pt: 'Row, Row, Row Your Boat (ronda)', en: 'Row, Row, Row Your Boat (round)' },
  'an.src.corpus': { pt: 'Melodia do corpus', en: 'Corpus melody' },
  'an.src.midi': { pt: 'Ficheiro MIDI carregado', en: 'Uploaded MIDI file' },
  'an.midiInfo': { pt: '{name}: {n} pista(s), compasso {num}/{den}. Polifonia reduzida à nota mais aguda.', en: '{name}: {n} track(s), time signature {num}/{den}. Polyphony reduced to the highest note.' },
  'an.midiNoNotes': { pt: 'sem notas', en: 'no notes' },
  'an.midiError': { pt: 'Não foi possível ler o MIDI ({msg}). Use um ficheiro .mid padrão.', en: 'Could not read the MIDI file ({msg}). Use a standard .mid file.' },
  'an.loadFirst': { pt: 'Carregue primeiro um ficheiro MIDI.', en: 'Load a MIDI file first.' },
  'an.pieceTitle': { pt: 'Análise · {title}', en: 'Analysis · {title}' },
  'an.time': { pt: 'Análise em {ms} ms.', en: 'Analysis in {ms} ms.' },
  'an.constant': { pt: 'constante', en: 'constant' },
  'an.cycleIn': { pt: '{f} (1 ciclo em {b} c.)', en: '{f} (1 cycle in {b} bars)' },
  'an.cyclesPerBar': { pt: '{f} ciclos/compasso', en: '{f} cycles/bar' },
  'an.between': { pt: 'entre {a} e {b}', en: 'between {a} and {b}' },
  'an.freq': { pt: 'frequência', en: 'frequency' },
  'an.mean': { pt: 'valor médio', en: 'mean' },
  'an.amp': { pt: 'amplitude', en: 'amplitude' },
  'an.ampValue': { pt: '±{a} semitons', en: '±{a} semitones' },
  'an.basin': { pt: 'bacia (σ)', en: 'basin (σ)' },
  'an.basinValue': { pt: '{b} semitons', en: '{b} semitones' },
  'an.share': { pt: 'notas atraídas', en: 'notes attracted' },
  'an.part': { pt: 'Parte {n} · {bars}', en: 'Part {n} · {bars}' },
  'an.bars': { pt: 'c. {a}–{b}', en: 'bars {a}–{b}' },
  'an.notes': { pt: 'notas', en: 'notes' },
  'an.wavesBic': { pt: 'ondas (BIC)', en: 'waves (BIC)' },
  'an.lowest': { pt: 'nota mais grave', en: 'lowest note' },
  'an.lowMean': { pt: 'média das graves (¼)', en: 'mean of the lowest (¼)' },
  'an.highest': { pt: 'nota mais aguda', en: 'highest note' },
  'an.highMean': { pt: 'média das agudas (¼)', en: 'mean of the highest (¼)' },
  'an.lowWave': { pt: 'Onda de frequência mais baixa', en: 'Lowest-frequency wave' },
  'an.highWave': { pt: 'Onda de frequência mais alta', en: 'Highest-frequency wave' },
  'an.nextWave': { pt: 'Onda seguinte', en: 'Next wave' },
  'an.specAria': { pt: 'Espectro do contorno da parte {n}', en: 'Contour spectrum of part {n}' },
  'an.sig': { pt: 'Oscilações significativas (p < 0,05, permutação): {list} ciclos/compasso.', en: 'Significant oscillations (p < 0.05, permutation): {list} cycles/bar.' },
  'an.noSig': { pt: 'Nenhuma oscilação do contorno acima do limiar de permutação (p < 0,05).', en: 'No contour oscillation above the permutation threshold (p < 0.05).' },
  'an.sum.piece': { pt: 'peça', en: 'piece' },
  'an.sum.parts': { pt: 'partes', en: 'parts' },
  'an.sum.lowFreq': { pt: 'freq. mais baixa (média)', en: 'lowest freq. (mean)' },
  'an.sum.lowMean': { pt: 'valor médio dessa onda', en: 'mean of that wave' },
  'an.sum.highFreq': { pt: 'freq. mais alta (média)', en: 'highest freq. (mean)' },
  'an.sum.r2': { pt: 'R² médio', en: 'mean R²' },
  'an.sum.hint': {
    pt: 'R² mede quanto da altura das notas as ondas explicam. Com poucas notas por parte o R² sobe sempre; compare com uma melodia baralhada (README) antes de concluir.',
    en: 'R² measures how much of the notes’ pitch the waves explain. With few notes per part R² always rises; compare with a shuffled melody (README) before concluding.',
  },
  'an.used': { pt: '{n} onda(s) copiadas para Compor → Ondas atratoras{shift}. Pode editá-las lá.', en: '{n} wave(s) copied to Compose → Attractor waves{shift}. You can edit them there.' },
  'an.shift': { pt: ', transpostas {s} semitons para a tonalidade escolhida', en: ', transposed {s} semitones to the chosen key' },
  'blocks.summary': { pt: 'Padrões do corpus: figuras e ligações por compasso', en: 'Corpus patterns: figures and links by time signature' },
  'blocks.hint': {
    pt: 'Aprendidos com 9644 melodias reais (Essen, Aird’s Airs, O’Neill, Ryan’s Mammoth, sopranos de Bach), separadas por compasso, sem as 480 do crítico. Um bloco é um tempo — uma semínima nos compassos simples, uma semínima com ponto (três colcheias) nos compostos: a figura rítmica, o contorno em graus da escala e o intervalo de entrada. O gerador usa-os na população inicial («Blocos do corpus»), numa mutação e na regra «Idioma do corpus» (nos pesos; a 0 por omissão). Mostra o compasso escolhido em Compor.',
    en: 'Learned from 9,644 real melodies (Essen, Aird’s Airs, O’Neill, Ryan’s Mammoth, Bach sopranos), separated by time signature, without the critic’s 480. A block is a beat — a quarter note in simple meters, a dotted quarter (three eighths) in compound ones: the rhythmic figure, the contour in scale degrees and the entry interval. The generator uses them in the initial population (“Corpus blocks”), in a mutation and in the rule “Corpus idiom” (in the weights; 0 by default). It shows the meter chosen in Compose.',
  },
  'blocks.noData': { pt: 'Sem dados para este compasso.', en: 'No data for this meter.' },
  'blocks.top': { pt: 'Figuras de um tempo mais comuns em {meter}', en: 'Most common one-beat figures in {meter}' },
  'blocks.col.figure': { pt: 'figura (sílabas Takadimi)', en: 'figure (Takadimi syllables)' },
  'blocks.col.share': { pt: 'dos tempos', en: 'of the beats' },
  'blocks.after': { pt: 'Depois desta figura, no 2.º tempo (1 passo)', en: 'After this figure, on beat 2 (1 step)' },
  'blocks.col.fig': { pt: 'figura', en: 'figure' },
  'blocks.col.next': { pt: 'seguintes mais prováveis', en: 'most likely next' },
  'blocks.dir': { pt: 'A direção da última nota e o intervalo seguinte', en: 'The direction of the last note and the next interval' },
  'blocks.col.if': { pt: 'se a última nota…', en: 'if the last note…' },
  'blocks.col.up': { pt: 'a seguinte sobe', en: 'the next rises' },
  'blocks.col.same': { pt: 'repete', en: 'repeats' },
  'blocks.col.down': { pt: 'desce', en: 'falls' },
  'blocks.few': { pt: '{meter} ({own} tem poucas melodias no corpus)', en: '{meter} ({own} has few melodies in the corpus)' },
  'blocks.model': {
    pt: 'Modelo deste compasso: ritmo {rhythm} (contexto de até {ctx} figuras anteriores, escolhido por validação cruzada), entrada {entry}, contorno {contour}; {n} melodias reais. Figuras: ♩ semínima, ♪ colcheia, ♪. colcheia pontuada, sc semicolcheia, ♩. semínima pontuada. As tabelas completas, com todas as contagens, estão em <code>web/results/meters/analise-compassos.xlsx</code> e nos CSV ao lado; o estudo em <code>web/results/meters.md</code>.',
    en: 'Model of this meter: rhythm {rhythm} (context of up to {ctx} previous figures, chosen by cross-validation), entry {entry}, contour {contour}; {n} real melodies. Figures: ♩ quarter, ♪ eighth, ♪. dotted eighth, sc sixteenth, ♩. dotted quarter. The full tables, with every count, are in <code>web/results/meters/analise-compassos.xlsx</code> and the CSV files next to it; the study is in <code>web/results/meters.md</code>.',
  },
  'dir.ss': { pt: 'subiu por salto', en: 'rose by a leap' },
  'dir.sg': { pt: 'subiu por grau', en: 'rose by step' },
  'dir.r': { pt: 'repetiu', en: 'repeated' },
  'dir.dg': { pt: 'desceu por grau', en: 'fell by step' },
  'dir.ds': { pt: 'desceu por salto', en: 'fell by a leap' },
  'fig.rest': { pt: 'pausa', en: 'rest' },
  'fig.tie': { pt: 'lig.', en: 'tie' },
  'fig.sixteenth': { pt: 'sc', en: 'sc' },

  // ------------------------------------------------------------------ Evaluate
  'ev.title': { pt: 'Avaliação independente', en: 'Independent evaluation' },
  'ev.hint': {
    pt: 'Estas medidas não são usadas para gerar. O crítico é uma regressão logística treinada para distinguir 480 melodias reais (canções do Essen, música irlandesa de O’Neill, sopranos dos corais de Bach) de melodias nulas (ruído branco, castanho e 1/f, melodias reais baralhadas).',
    en: 'These measures are not used to generate. The critic is a logistic regression trained to tell 480 real melodies (Essen songs, O’Neill’s Irish music, Bach chorale sopranos) from null melodies (white, brown and 1/f noise, shuffled real melodies).',
  },
  'ev.voicesTitle': { pt: 'Vozes e contraponto', en: 'Voices and counterpoint' },
  'ev.voicesHint': {
    pt: 'As vozes da peça (se houver mais do que uma), cada par entre si e, para comparação, a melodia contra si própria atrasada 1, 2 ou 3 compassos. Em rodapé, os três cânones de Telemann transcritos, com a entrada real da 2.ª voz. Consonância: nos tempos fortes; paralelas: 5.as e 8.as seguidas; contrário: movimento contrário.',
    en: 'The voices of the piece (if there is more than one), each pair of them and, for comparison, the melody against itself delayed by 1, 2 or 3 bars. At the foot, the three transcribed Telemann canons, with the real entry of the 2nd voice. Consonance: on strong beats; parallels: consecutive 5ths and 8ves; contrary: contrary motion.',
  },
  'ev.featuresTitle': { pt: 'Características vs. melodias reais', en: 'Features vs. real melodies' },
  'ev.featuresHint': { pt: 'Intervalo P10–P90 das 480 melodias reais. Verde: dentro do intervalo.', en: 'P10–P90 range of the 480 real melodies. Green: inside the range.' },
  'ev.critic': { pt: 'crítico (melodia real?)', en: 'critic (real melody?)' },
  'ev.typical': { pt: 'características típicas', en: 'typical features' },
  'ev.typicalValue': { pt: '{a} de {b}', en: '{a} of {b}' },
  'ev.surprise': { pt: 'surpresa melódica', en: 'melodic surprise' },
  'ev.surpriseValue': { pt: '{v} bits/nota (real: {r})', en: '{v} bits/note (real: {r})' },
  'ev.lz': { pt: 'complexidade LZ', en: 'LZ complexity' },
  'ev.validation': { pt: 'validação do crítico', en: 'critic validation' },
  'ev.note': {
    pt: 'Avaliado nos primeiros 8 compassos de 4/4 (128 semicolcheias), como as melodias de referência. Todas as vozes tocam a mesma melodia, por isso o crítico avalia-a uma vez.',
    en: 'Evaluated on the first 8 bars of 4/4 (128 sixteenths), like the reference melodies. All the voices play the same melody, so the critic judges it once.',
  },
  'ev.voices': { pt: 'Vozes', en: 'Voices' },
  'ev.col.instrument': { pt: 'instrumento', en: 'instrument' },
  'ev.col.entry': { pt: 'entrada', en: 'entry' },
  'ev.col.interval': { pt: 'intervalo', en: 'interval' },
  'ev.col.register': { pt: 'registo', en: 'register' },
  'ev.col.out': { pt: 'fora do alcance', en: 'out of reach' },
  'ev.entryBar': { pt: 'c. {n}', en: 'bar {n}' },
  'ev.melody': { pt: 'melodia', en: 'melody' },
  'ev.pairs': { pt: 'Pares de vozes', en: 'Pairs of voices' },
  'ev.col.voices': { pt: 'vozes', en: 'voices' },
  'ev.pair': { pt: '{a} e {b}', en: '{a} and {b}' },
  'ev.all': { pt: 'todas', en: 'all' },
  'ev.triads': { pt: 'Tempos fortes em que as três vozes formam um acorde perfeito: {p}.', en: 'Strong beats where the three voices form a perfect chord: {p}.' },
  'ev.self': { pt: 'A melodia contra si própria, em uníssono', en: 'The melody against itself, in unison' },
  'ev.secondVoice': { pt: '2.ª voz', en: '2nd voice' },
  'ev.atBars': { pt: 'a {d} c.', en: 'at {d} bar(s)' },
  'ev.col.consonance': { pt: 'consonância', en: 'consonance' },
  'ev.col.consonance.title': { pt: 'Consonâncias nos tempos fortes', en: 'Consonances on strong beats' },
  'ev.col.parallels': { pt: 'paralelas', en: 'parallels' },
  'ev.col.parallels.title': { pt: 'Quintas e oitavas paralelas', en: 'Parallel fifths and octaves' },
  'ev.col.unisons': { pt: 'uníssonos', en: 'unisons' },
  'ev.col.contrary': { pt: 'contrário', en: 'contrary' },
  'ev.col.contrary.title': { pt: 'Movimento contrário', en: 'Contrary motion' },
  'ev.col.score': { pt: 'pontuação', en: 'score' },
  'ev.col.feature': { pt: 'Característica', en: 'Feature' },
  'ev.col.piece': { pt: 'Peça', en: 'Piece' },
  'ev.col.real': { pt: 'Reais P10–P90', en: 'Real P10–P90' },
  'feature.pitchVariety': { pt: 'Variedade de alturas', en: 'Pitch variety' },
  'feature.pitchRange': { pt: 'Âmbito (semitons)', en: 'Range (semitones)' },
  'feature.keyCentred': { pt: 'Centralidade tonal', en: 'Tonal centrality' },
  'feature.nonScale': { pt: 'Notas fora da escala', en: 'Notes outside the scale' },
  'feature.dissonantIntervals': { pt: 'Intervalos dissonantes', en: 'Dissonant intervals' },
  'feature.contourDirection': { pt: 'Direção do contorno', en: 'Contour direction' },
  'feature.contourStability': { pt: 'Estabilidade do contorno', en: 'Contour stability' },
  'feature.stepMovement': { pt: 'Movimento por grau', en: 'Stepwise motion' },
  'feature.leapReturns': { pt: 'Retorno após salto', en: 'Return after a leap' },
  'feature.climaxStrength': { pt: 'Força do clímax', en: 'Climax strength' },
  'feature.repeatedPitch': { pt: 'Notas repetidas', en: 'Repeated notes' },
  'feature.meanAbsInterval': { pt: 'Intervalo médio', en: 'Mean interval' },
  'feature.noteDensity': { pt: 'Notas por tempo', en: 'Notes per beat' },
  'feature.restRatio': { pt: 'Proporção de pausas', en: 'Share of rests' },
  'feature.rhythmicVariety': { pt: 'Variedade rítmica', en: 'Rhythmic variety' },
  'feature.syncopation': { pt: 'Síncopa', en: 'Syncopation' },
  'feature.repeatedIntervalPatterns': { pt: 'Padrões melódicos repetidos', en: 'Repeated melodic patterns' },
  'feature.repeatedRhythmPatterns': { pt: 'Padrões rítmicos repetidos', en: 'Repeated rhythmic patterns' },
  'feature.pcEntropy': { pt: 'Entropia de classes de altura', en: 'Pitch-class entropy' },
  'feature.intervalEntropy': { pt: 'Entropia de intervalos', en: 'Interval entropy' },
  'feature.lzComplexity': { pt: 'Complexidade LZ', en: 'LZ complexity' },
  'feature.zipfPitch': { pt: 'Zipf (alturas)', en: 'Zipf (pitches)' },
  'feature.zipfInterval': { pt: 'Zipf (intervalos)', en: 'Zipf (intervals)' },
  'feature.spectralSlope': { pt: 'Declive espectral (1/f)', en: 'Spectral slope (1/f)' },
  'feature.icPitch': { pt: 'Surpresa melódica (bits)', en: 'Melodic surprise (bits)' },
  'feature.icRhythm': { pt: 'Surpresa rítmica (bits)', en: 'Rhythmic surprise (bits)' },

  // ------------------------------------------------------------------ About (HTML)
  'about.html': {
    pt: `
<h3>O que é</h3>
<p>Uma versão web do <em>GeneticMusic</em> (Rui Luz e Rafael Silva, IPCA 2020): um algoritmo genético compõe uma melodia e a aptidão inclui <strong>ondas atratoras</strong>, curvas que puxam as notas para uma bacia à sua volta. Tudo corre no navegador; a mesma semente dá sempre a mesma peça.</p>

<h3>Dois modelos, até três vozes</h3>
<ul>
<li><strong>Clássico</strong>: as 15 regras de <code>AlgorithmFitness.cs</code>, portadas regra a regra (validado contra o C# original compilado: 0 diferenças em 795 comparações), com os pesos do formulário original e operadores ao nível do bit como no GeneticSharp.</li>
<li><strong>Campo de atratores</strong>: as ondas passam a ter bacias contínuas (a influência decai com a distância), podem ser arcos de frase, ruído 1/f ou atratores caóticos, e juntam-se regras da cognição musical (ver abaixo). Cada regra é uma média por nota, por isso as pausas deixaram de ser um refúgio.</li>
<li><strong>Vozes</strong>: em qualquer dos modelos a melodia pode ser tocada por 2 ou 3 vozes, cada uma com o seu instrumento, compasso de entrada e intervalo (uníssono, oitavas, 5.ª ou 4.ª diatónicas), para que vários músicos leiam a mesma parte como nos <em>Canons mélodieux</em> de Telemann (TWV 40:118–123). O contraponto entre todos os pares de vozes entra na aptidão e na população inicial, desde a geração 0.</li>
</ul>
<p>Em «Pesos das regras», o botão «?» ao lado de cada peso explica o que a regra mede e como muda a melodia; no modo clássico, as descrições interpretam também o que os autores pretendiam, a partir do código e dos seus comentários.</p>

<h3>Heurísticas de composição e estilos</h3>
<p>Uma pesquisa na literatura (66 achados com fonte, em <code>web/results/estilos/literatura.csv</code>) deu regras gerais de escrita melódica — mais graus a descer do que a subir (Huron), inércia do grau (Chiu &amp; Temperley), saltos compensados e, quando seguidos, só em arpejo (Fux, Jeppesen), sem trítonos nem sétimas, um arco por frase (Huron), a nota final da frase mais longa e mais grave (Tierney, Russo &amp; Patel), motivos rítmicos repetidos (Schoenberg; Savage et al.) — e as características de 36 estilos: canções, danças irlandesas e escocesas, danças barrocas, tópicos clássicos, danças portuguesas, fado, blues, jazz e pop. Cada regra mede uma característica da melodia e compara-a com um intervalo-alvo: o P10–P90 das melodias reais quando o corpus as tem (canções do Essen, corais de Bach, reels, jigs, slip jigs, hornpipes, strathspeys, marchas), senão o valor da literatura. Nada se maximiza: dentro do intervalo a regra vale 1. O peso «Heurísticas de composição» junta-as na aptidão; escolher um estilo ajusta o compasso, a frase, a forma e o andamento e mantém esse peso acima de 0. Com validação cruzada, as regras gerais põem a melodia real acima da mesma melodia com as notas baralhadas em 90 % dos pares; no algoritmo genético, cada estilo leva as melodias para dentro dos seus intervalos (<code>web/results/estilos.md</code>).</p>

<h3>Línguas</h3>
<p>A página existe em português e em inglês (menu no cabeçalho). Todos os textos estão num só ficheiro, <code>web/src/i18n/texts.js</code>, e a página só tem marcadores; para acrescentar uma língua basta juntá-la à lista e traduzir as entradas.</p>

<h3>Blocos de construção do corpus, por compasso</h3>
<p>9644 melodias reais (Essen, Aird's Airs, O'Neill, Ryan's Mammoth, Bach) foram separadas pelo compasso e cortadas em tempos: uma semínima nos compassos simples (2/4, 3/4, 4/4), uma semínima com ponto — três colcheias — nos compostos (3/8, 6/8, 9/8, 12/8). Cada tempo tem uma figura rítmica (em 6/8, sobretudo três colcheias ou semínima e colcheia), um contorno em graus da escala e um intervalo de entrada. Compararam-se vários modelos em melodias deixadas de fora (validação cruzada): a figura seguinte prevê-se melhor com as figuras anteriores — uma «árvore» de dois passos é melhor do que um, e até um compasso inteiro de memória ainda ajuda —, enquanto a direção da última nota (sobe ou desce, por grau ou por salto) pouco diz sobre o ritmo mas muito sobre o intervalo seguinte (depois de um salto a melodia tende a voltar para trás). O gerador usa um modelo destes por compasso para escrever a população inicial, numa mutação e na regra «Idioma do corpus»; cada regra conta só até ao seu valor típico na música real desse compasso («não maximizar»). Todas as contagens e probabilidades estão em tabelas auditáveis (<code>web/results/meters/</code>, em CSV e num livro de Excel), e o painel «Padrões do corpus», no separador Analisar, mostra as do compasso escolhido.</p>

<h3>Partitura e LilyPond</h3>
<p>O botão «Partitura» mostra a peça em notação tradicional, uma pauta por voz, com a fonte Gonville (feita como substituta da fonte do LilyPond) e a disposição habitual do LilyPond. «PDF» descarrega a partitura em PDF A4 vetorial, desenhada pelo mesmo código. O tamanho da pauta ajusta-se para encher páginas inteiras: se a última página ficasse quase vazia, a pauta encolhe e a peça cabe numa página a menos; se ficasse a meio, a pauta cresce até a música ocupar as páginas todas. Em «Pautas» escolhe-se entre uma pauta por voz e o cânone numa só linha, como se imprimem as rondas: um número em caixa marca onde cada voz entra (quando a 1.ª voz chega ao número 2, a 2.ª começa do início), com uma legenda do instrumento, da entrada e do intervalo de cada voz, e sinais de repetição nas rondas. «LilyPond (.ly)» descarrega o código para gravar a partitura com o próprio LilyPond, com a mesma escolha. No modo clássico, as duas ondas W1 e W2 editam-se com os mesmos campos do formulário original.</p>

<h3>Ondas editáveis e experiências</h3>
<p>Cada onda tem tipo, frequência, desfasamento, valor médio e amplitude (ou mínimo e máximo) e uma bacia com largura e forma; pode haver até 4. As ondas da configuração aparecem a tracejado na partitura antes de gerar. Os botões de auto-configuração sugerem ondas, forma, pesos e algoritmo a partir das vozes; cada geração fica registada com a sua configuração, e «Testar 5 sementes» mostra se uma mudança ajuda de forma consistente.</p>

<h3>Análise inversa</h3>
<p>235 melodias reais completas, os seus retrógrados e modelos nulos foram passados pelas regras. As regras originais dão à música real a mesma pontuação que ao ruído branco (50 % dos pares); as novas separam-nas em 96 % dos pares, sobretudo pela proximidade e pelas forças melódicas. Quase nenhuma regra distingue uma melodia do seu retrógrado (52 %), e o AG leva as regras ao dobro do valor que a música real atinge. Os pesos aprendidos com estes dados estão disponíveis como predefinição («Aprendidos da música real»). Detalhes em <code>web/results/reverse.md</code>.</p>

<h3>Combinações de partida do modo clássico</h3>
<p>Um estudo do algoritmo original com 3074 melodias reais (canções de Essen, reels e hornpipes, corais de Bach) fez três coisas. Primeiro, um desenho de experiências (Plackett–Burman, 64 ensaios, 30 valores do original): nenhum valor sozinho tira o algoritmo do crítico 0. Depois, uma calibração inversa: as constantes medidas na música real e pesos que põem a música real acima das suas vizinhas. Por fim, uma otimização por entropia cruzada, confirmada com 24 sementes novas.</p>
<p>Com os operadores de bits do original, as combinações aproximam a forma: por exemplo, o âmbito passa de 36 para 14 meios-tons e as notas por tempo de 2,7 para 0,6. O crítico, porém, continua em 0, porque as regras não veem as síncopas nem o tamanho dos saltos. Com os operadores musicais, o crítico fica em 0,90–0,92: a «Canção» acaba na tónica em 71 % das peças (canções reais: 73 %), a «Dança» tem a densidade das danças reais e o «Coral» os graus conjuntos dos corais.</p>

<h3>O que se encontrou no código original</h3>
<ul>
<li>As regras somam <code>result +=</code> dentro de <code>Parallel.For</code> sem sincronização: o mesmo cromossoma recebe notas diferentes em cada avaliação (erro mediano de 20–45 % por regra, medido com o C# original).</li>
<li>Na primeira execução a onda 1 é uma linha em 0 (o vetor é criado antes de o comprimento estático ser definido), o que penaliza todas as notas por igual.</li>
<li>Pausas e prolongamentos recebem pontos fixos ou são neutros em várias regras, enquanto as notas só podem perder pontos; o <code>ScoreBalance</code> pede 7–40 % de figuras sem ataque, mas nas melodias reais esse valor é 58–83 %.</li>
<li>A auto-harmonização compara genes e não as notas que soam (um prolongamento conta como a nota 74), premeia quartas e penaliza sextas, ao contrário do contraponto a duas vozes.</li>
<li>Duas gralhas de atribuição (<code>result = 2f</code> e <code>result = +10f</code>) e um ramo inalcançável em <code>EvaluateRange</code>.</li>
<li>Mais lapsos que o próprio código ou relatório contradizem: o «prolongamento de prolongamento» nunca é avaliado; o equilíbrio dá −∞ sem pausas; as «repetições interessantes» comparam prolongamentos (a mesma condição que os autores corrigiram nos intervalos); o bónus de figura «no início do compasso» chega uma semicolcheia tarde; os intervalos só se medem entre semicolcheias vizinhas e a marca −100 (para os saltar) custa um ponto a cada nota depois de um prolongamento. No modo clássico estão corrigidos por omissão (caixa «Corrigir os lapsos do original»).</li>
<li>A regra de terminação só pede uma nota final prolongada, e os seus testes aninhados («não é prolongamento») dão a pontuação máxima a uma nota final de só duas semicolcheias, ao contrário do comentário («terminação com notas mais longas»); fica como no original. As fórmulas de final que o original previa ficaram por fazer: há agora uma regra «Fórmulas de final (corpus)», aprendida com 6758 melodias reais (3–2–1, 2–2–1, 7–1…, no 1.º ou 3.º tempo, abaixo do centro da melodia).</li>
</ul>

<h3>O que os testes mostraram</h3>
<p>Benchmark com 6 sementes por configuração, avaliado por medidas que não entram na geração (resultados completos em <code>web/results/benchmark.md</code>):</p>
<div class="scroll"><table class="data">
<thead><tr><th>Configuração</th><th>Crítico</th><th>Típicas /26</th><th>Notas/tempo</th><th>Surpresa (bits)</th><th>Cânone 1 c.</th></tr></thead>
<tbody>
<tr><td>Melodias reais (480)</td><td class="num">0,86</td><td class="num">22,1</td><td class="num">1,06</td><td class="num">2,85</td><td class="num">55 %</td></tr>
<tr><td>Ruído branco na escala</td><td class="num">0,00</td><td class="num">10,7</td><td class="num">1,03</td><td class="num">6,26</td><td class="num">57 %</td></tr>
<tr><td>Programa C# original</td><td class="num">0,00</td><td class="num">—</td><td class="num">2,4–3,4</td><td class="num">—</td><td class="num">46–61 %</td></tr>
<tr><td>Clássico (port)</td><td class="num">0,00</td><td class="num">11,5</td><td class="num">2,80</td><td class="num">6,15</td><td class="num">57 %</td></tr>
<tr><td>Clássico + operadores musicais</td><td class="num">0,93</td><td class="num">15,5</td><td class="num">2,84</td><td class="num">3,78</td><td class="num">49 %</td></tr>
<tr><td>Campo: arco de frase</td><td class="num">0,93</td><td class="num">17,5</td><td class="num">1,63</td><td class="num">3,22</td><td class="num">96 %</td></tr>
<tr><td>Campo: Rössler</td><td class="num">0,90</td><td class="num">19,7</td><td class="num">1,48</td><td class="num">3,20</td><td class="num">94 %</td></tr>
<tr><td>Cânone (2 violinos)</td><td class="num">0,89</td><td class="num">16,8</td><td class="num">1,47</td><td class="num">3,44</td><td class="num">100 %</td></tr>
<tr><td>Trio em cânone (desde a geração 0)</td><td class="num">0,79</td><td class="num">18,5</td><td class="num">—</td><td class="num">—</td><td class="num">87 % (tríades 87 %)</td></tr>
</tbody></table></div>
<ul>
<li>As saídas das regras originais têm a surpresa melódica do ruído branco e 2–3 vezes mais notas do que melodias reais. Em cânone a 1 compasso soam tão consonantes como ruído ao acaso: as regras de auto-harmonização não chegavam para dois violinistas lerem a mesma parte.</li>
<li>Só trocar os operadores de bits por operadores musicais já leva o crítico de 0,00 a 0,93.</li>
<li>Quanto vem da população inicial: com padrões musicais (células rítmicas e escala) o melhor indivíduo da geração 0 já tem crítico 0,71–0,88. A partir de uma população aleatória, sem padrões, o AG chega à mesma aptidão com 1–2 vozes em 1000–2000 gerações, mas o crítico fica ~0,1 abaixo; com 3 vozes não chega lá. A opção «População inicial» deixa ver essa convergência a partir do ruído.</li>
<li>Considerar o cânone desde a população inicial: com 2 vozes o contraponto chega a 0,8 na 1.ª geração (22 gerações sem isso); com 3 vozes o resultado final também melhora (tríades 87 % contra 72 %, crítico 0,79 contra 0,63).</li>
<li>Sem as bacias (ablação) o crítico fica igual: as ondas atratoras controlam a forma do contorno, não a qualidade por si só.</li>
<li>Pausas: com os pesos por defeito o original quase não gera pausas; quando se reforçam as ondas, deixa de atacar notas (ataques de 0,7 para 0,2 por semicolcheia, pausas até 10 %), porque a regra da onda só penaliza ataques.</li>
<li>Nas 480 melodias reais uma onda lenta (1 ciclo a cada 4–8 compassos, ±2,9 semitons) é significativa em 73 % dos casos, contra 7 % nas mesmas melodias baralhadas; mas também aparece em 84 % dos passeios aleatórios. A oscilação é um fator real, partilhado por qualquer contorno que avance por graus.</li>
</ul>

<h3>O trabalho original à luz da literatura</h3>
<p>A observação de que o contorno melódico tem componentes cíclicas já existia (Schmuckler 1999, 2010, com análise de Fourier do contorno), tal como guiar a geração por curvas desenhadas (Xenakis, Hyperscore, MorpheuS). O que o relatório tinha de próprio era a combinação: várias curvas-alvo móveis, não somadas, cada uma com uma bacia, a competir pelas notas na aptidão de um AG, para dar forma à melodia e vozes implícitas. Não encontrei reutilizações do repositório. A ideia geral — controlar a geração com curvas ao longo do tempo (tensão, altura média por compasso, contornos desenhados) — tornou-se corrente depois de 2020 nas redes neuronais (FIGARO, MIDI-Draw, Music ControlNet), por caminhos independentes. A análise completa, com fontes, está no README.</p>

<h3>Literatura usada</h3>
<ul>
<li>Huron (1996), <em>The melodic arch in Western folksongs</em> — arco de frase; Huron (2006), <em>Sweet Anticipation</em> — declinação por grau e outras regularidades.</li>
<li>Voss &amp; Clarke (1975), <a href="https://www.nature.com/articles/258317a0" target="_blank" rel="noopener">“1/f noise” in music and speech</a>, Nature 258 — flutuações 1/f.</li>
<li>Pressing (1988), <em>Nonlinear maps as generators of musical design</em>, CMJ 12(2); Bidlack (1992), <em>Chaotic systems as simple (but complex) compositional algorithms</em>, CMJ 16(3) — atratores caóticos.</li>
<li>Dabby (1996), <a href="https://pubs.aip.org/aip/cha/article/6/2/95/135460/Musical-variations-from-a-chaotic-mapping" target="_blank" rel="noopener">Musical variations from a chaotic mapping</a>, Chaos 6(2) — variações.</li>
<li>Temperley (2008), <a href="https://onlinelibrary.wiley.com/doi/10.1080/03640210701864089" target="_blank" rel="noopener">A probabilistic model of melody perception</a>, Cognitive Science 32 — proximidade e perfil de âmbito.</li>
<li>von Hippel &amp; Huron (2000), <em>Why do skips precede reversals?</em>, Music Perception 18(1) — regressão para a média.</li>
<li>Lerdahl (2001), <em>Tonal Pitch Space</em>; Larson (2012), <a href="https://iupress.org/9780253356826/musical-forces/" target="_blank" rel="noopener">Musical Forces</a> — atração melódica, magnetismo, gravidade, inércia.</li>
<li>Farbood (2012), <a href="https://online.ucpress.edu/mp/article-abstract/29/4/387/46442/A-Parametric-Temporal-Model-of-Musical-Tension" target="_blank" rel="noopener">A parametric, temporal model of musical tension</a>; Herremans &amp; Chew (2017), <a href="https://arxiv.org/pdf/1812.04832" target="_blank" rel="noopener">MorpheuS</a> — perfil de tensão alvo.</li>
<li>Huron (2001), <a href="http://mp.ucpress.edu/content/19/1/1" target="_blank" rel="noopener">Tone and Voice</a>, Music Perception 19(1) — regras de condução de vozes; Fux (1725), <em>Gradus ad Parnassum</em>; Jeppesen (1939), <em>Counterpoint</em>.</li>
<li>Chiu &amp; Temperley (2024), <a href="https://journals.sagepub.com/doi/full/10.1177/20592043231225731" target="_blank" rel="noopener">Melodic differences between styles: modeling music with step inertia</a>; Tierney, Russo &amp; Patel (2011), <a href="https://www.pnas.org/doi/10.1073/pnas.1103882108" target="_blank" rel="noopener">The motor origins of human and avian song structure</a>, PNAS; Savage et al. (2015), <a href="https://www.pnas.org/doi/full/10.1073/pnas.1510724112" target="_blank" rel="noopener">Statistical universals</a>, PNAS — heurísticas gerais.</li>
<li>Ratner (1980), <em>Classic Music</em>; Caplin (1998), <em>Classical Form</em>; Mattheson (1739), <em>Der vollkommene Capellmeister</em>; Unyk et al. (1992), <em>Lullabies and simplicity</em>; Mehr et al. (2019), <em>Universality and diversity in human song</em>, Science — estilos (lista completa no CSV).</li>
<li>Matić (2010), <em>A genetic algorithm for composing music</em>; Biles (1994), GenJam — operadores musicais.</li>
<li>Mouret &amp; Clune (2015), <a href="https://arxiv.org/pdf/1504.04909" target="_blank" rel="noopener">Illuminating search spaces by mapping elites</a> — MAP-Elites.</li>
<li>Towsey et al. (2001), <a href="https://eprints.qut.edu.au/169/" target="_blank" rel="noopener">Towards melodic extension using genetic algorithms</a>; Manaris et al. (2005), <a href="https://direct.mit.edu/comj/article-abstract/29/1/55/93945/Zipf-s-Law-Music-Classification-and-Aesthetics" target="_blank" rel="noopener">Zipf’s law, music classification, and aesthetics</a>; Pearce &amp; Wiggins (2012), IDyOM; Schmidhuber (2009), <a href="https://arxiv.org/abs/0812.4360" target="_blank" rel="noopener">compression progress</a>; Yang &amp; Lerch (2020) — avaliação.</li>
<li>Cambouropoulos (2001), <em>The Local Boundary Detection Model</em> — segmentação em frases.</li>
</ul>

<h3>Corpus de referência</h3>
<p>480 melodias do corpus do music21, em domínio público: 240 canções da coleção Essen, 120 temas de <em>O'Neill's Music of Ireland</em> (1850) e 120 sopranos de corais de Bach, cortadas nos primeiros 8 compassos. Três andamentos dos cânones de Telemann (Sonata I Vivace, Sonata II Vivace, Sonata III Spirituoso) foram transcritos das partituras (ornamentos omitidos, tercinas aproximadas); em todos, a análise de contraponto dá o máximo na entrada real da 2.ª voz.</p>
`,
    en: `
<h3>What it is</h3>
<p>A web version of <em>GeneticMusic</em> (Rui Luz and Rafael Silva, IPCA 2020): a genetic algorithm composes a melody and the fitness includes <strong>attractor waves</strong>, curves that pull the notes into a basin around them. Everything runs in the browser; the same seed always gives the same piece.</p>

<h3>Two models, up to three voices</h3>
<ul>
<li><strong>Classic</strong>: the 15 rules of <code>AlgorithmFitness.cs</code>, ported rule by rule (checked against the compiled original C#: 0 differences in 795 comparisons), with the weights of the original form and bit-level operators as in GeneticSharp.</li>
<li><strong>Attractor field</strong>: the waves get continuous basins (the pull decays with the distance), they can be phrase arches, 1/f noise or chaotic attractors, and rules from music cognition are added (see below). Each rule is a mean per note, so rests are no longer a safe harbour.</li>
<li><strong>Voices</strong>: in either model the melody can be played by 2 or 3 voices, each with its instrument, entry bar and interval (unison, octaves, diatonic 5th or 4th), so that several musicians read the same part as in Telemann’s <em>Canons mélodieux</em> (TWV 40:118–123). The counterpoint between every pair of voices is part of the fitness and of the initial population, from generation 0.</li>
</ul>
<p>Under “Rule weights”, the “?” button next to each weight explains what the rule measures and how it changes the melody; in the classic mode the descriptions also interpret what the authors intended, from the code and its comments.</p>

<h3>Composition heuristics and styles</h3>
<p>A search of the literature (66 findings with their sources, in <code>web/results/estilos/literatura.csv</code>) gave general rules of melody writing — more falling than rising steps (Huron), step inertia (Chiu &amp; Temperley), compensated leaps and, when consecutive, only as arpeggios (Fux, Jeppesen), no tritones or sevenths, an arch per phrase (Huron), the phrase-final note longer and lower (Tierney, Russo &amp; Patel), repeated rhythmic motifs (Schoenberg; Savage et al.) — and the features of 36 styles: songs, Irish and Scottish dances, Baroque dances, Classical topics, Portuguese dances, fado, blues, jazz and pop. Each rule measures one feature of the melody and compares it with a target range: the P10–P90 of real melodies when the corpus has them (Essen songs, Bach chorales, reels, jigs, slip jigs, hornpipes, strathspeys, marches), otherwise the value from the literature. Nothing is maximised: inside the range a rule scores 1. The weight “Composition heuristics” brings them into the fitness; choosing a style adjusts the meter, phrase, form and tempo and keeps that weight above 0. With cross-validation, the general rules put a real melody above the same melody with its notes shuffled in 90 % of the pairs; in the genetic algorithm, each style takes the melodies inside its ranges (<code>web/results/estilos.md</code>).</p>

<h3>Languages</h3>
<p>The page exists in Portuguese and in English (menu in the header). All its texts are in a single file, <code>web/src/i18n/texts.js</code>, and the page only holds placeholders; to add a language, add it to the list and translate the entries.</p>

<h3>Building blocks from the corpus, by meter</h3>
<p>9,644 real melodies (Essen, Aird’s Airs, O’Neill, Ryan’s Mammoth, Bach) were separated by time signature and cut into beats: a quarter note in the simple meters (2/4, 3/4, 4/4), a dotted quarter — three eighths — in the compound ones (3/8, 6/8, 9/8, 12/8). Each beat has a rhythmic figure (in 6/8, mostly three eighths or quarter and eighth), a contour in scale degrees and an entry interval. Several models were compared on melodies left out (cross-validation): the next figure is predicted better from the previous figures — a two-step “tree” beats one step, and even a whole bar of memory still helps — while the direction of the last note (up or down, by step or by leap) says little about the rhythm but a lot about the next interval (after a leap the melody tends to turn back). The generator uses one such model per meter to write the initial population, in a mutation and in the rule “Corpus idiom”; each rule counts only up to its typical value in the real music of that meter (“do not maximise”). All the counts and probabilities are in auditable tables (<code>web/results/meters/</code>, as CSV and in an Excel workbook), and the “Corpus patterns” panel, in the Analyse tab, shows those of the chosen meter.</p>

<h3>Score and LilyPond</h3>
<p>The “Score” button shows the piece in standard notation, one staff per voice, with the Gonville font (made as a stand-in for LilyPond’s font) and LilyPond’s usual layout. “PDF” downloads the score as a vector A4 PDF, drawn by the same code. The staff size adjusts to fill whole pages: if the last page would be almost empty, the staff shrinks and the piece fits on one page fewer; if it would be half full, the staff grows until the music fills every page. “Staves” chooses between one staff per voice and the canon on a single line, as rounds are printed: a boxed number marks where each voice comes in (when the 1st voice reaches number 2, the 2nd starts from the beginning), with a legend giving each voice’s instrument, entry and interval, and repeat signs in rounds. “LilyPond (.ly)” downloads the code to engrave the score with LilyPond itself, with the same choice. In the classic mode the two waves W1 and W2 are edited with the same fields as the original form.</p>

<h3>Editable waves and experiments</h3>
<p>Each wave has a type, frequency, phase, mean and amplitude (or minimum and maximum) and a basin with a width and a shape; there can be up to 4. The waves of the settings are drawn dashed on the score before generating. The auto-configuration buttons suggest waves, form, weights and algorithm from the voices; each run is recorded with its settings, and “Try 5 seeds” shows whether a change helps consistently.</p>

<h3>Reverse analysis</h3>
<p>235 complete real melodies, their retrogrades and null models were passed through the rules. The original rules give real music the same score as white noise (50 % of the pairs); the new ones tell them apart in 96 % of the pairs, mostly through proximity and the melodic forces. Almost no rule tells a melody from its retrograde (52 %), and the GA drives the rules to twice the value real music reaches. The weights learned from these data are available as a preset (“Learned from real music”). Details in <code>web/results/reverse.md</code>.</p>

<h3>Starting combinations for the classic mode</h3>
<p>A study of the original algorithm with 3,074 real melodies (Essen songs, reels and hornpipes, Bach chorales) did three things. First, a design of experiments (Plackett–Burman, 64 runs, 30 values of the original): no single value lifts the algorithm off critic 0. Then an inverse calibration: the constants measured on real music, and weights that put real music above its neighbours. Finally, a cross-entropy optimisation, confirmed with 24 new seeds.</p>
<p>With the original’s bit operators, the combinations approach the shape: for example, the range goes from 36 to 14 semitones and the notes per beat from 2.7 to 0.6. The critic, however, stays at 0, because the rules do not see syncopations or the size of the leaps. With the musical operators, the critic reaches 0.90–0.92: the “Song” ends on the tonic in 71 % of the pieces (real songs: 73 %), the “Dance” has the density of real dances and the “Chorale” the steps of chorales.</p>

<h3>What was found in the original code</h3>
<ul>
<li>The rules add <code>result +=</code> inside <code>Parallel.For</code> without synchronisation: the same chromosome gets different scores at each evaluation (median error of 20–45 % per rule, measured with the original C#).</li>
<li>On the first run wave 1 is a line at 0 (the array is created before the static length is set), which penalises every note alike.</li>
<li>Rests and prolongations get fixed points or are neutral in several rules, while notes can only lose points; <code>ScoreBalance</code> asks for 7–40 % of figures without an onset, but in real melodies this value is 58–83 %.</li>
<li>The self-harmonisation compares genes, not the sounding notes (a prolongation counts as note 74), rewards fourths and penalises sixths, unlike two-voice counterpoint.</li>
<li>Two assignment typos (<code>result = 2f</code> and <code>result = +10f</code>) and an unreachable branch in <code>EvaluateRange</code>.</li>
<li>More lapses that the code or the report itself contradict: the “prolongation of a prolongation” is never scored; the balance gives −∞ without rests; the “interesting repetitions” compare prolongations (the same condition the authors fixed in the intervals rule); the “start of the bar” figure bonus arrives one sixteenth late; the intervals are only measured between neighbouring sixteenths and the −100 marker (meant to skip them) costs a point for each note after a prolongation. In the classic mode they are fixed by default (box “Fix the original’s lapses”).</li>
<li>The ending rule only asks for a prolonged final note, and its nested tests (“is not a prolongation”) give the top score to a final note of only two sixteenths, contrary to the comment (“ending with longer notes”); it is kept as in the original. The ending formulas the original planned were never done: there is now a rule “Ending formulas (corpus)”, learned from 6,758 real melodies (3–2–1, 2–2–1, 7–1…, on the 1st or 3rd beat, below the centre of the melody).</li>
</ul>

<h3>What the tests showed</h3>
<p>Benchmark with 6 seeds per configuration, judged by measures that are not used to generate (full results in <code>web/results/benchmark.md</code>):</p>
<div class="scroll"><table class="data">
<thead><tr><th>Configuration</th><th>Critic</th><th>Typical /26</th><th>Notes/beat</th><th>Surprise (bits)</th><th>Canon 1 bar</th></tr></thead>
<tbody>
<tr><td>Real melodies (480)</td><td class="num">0.86</td><td class="num">22.1</td><td class="num">1.06</td><td class="num">2.85</td><td class="num">55 %</td></tr>
<tr><td>White noise in the scale</td><td class="num">0.00</td><td class="num">10.7</td><td class="num">1.03</td><td class="num">6.26</td><td class="num">57 %</td></tr>
<tr><td>Original C# program</td><td class="num">0.00</td><td class="num">—</td><td class="num">2.4–3.4</td><td class="num">—</td><td class="num">46–61 %</td></tr>
<tr><td>Classic (port)</td><td class="num">0.00</td><td class="num">11.5</td><td class="num">2.80</td><td class="num">6.15</td><td class="num">57 %</td></tr>
<tr><td>Classic + musical operators</td><td class="num">0.93</td><td class="num">15.5</td><td class="num">2.84</td><td class="num">3.78</td><td class="num">49 %</td></tr>
<tr><td>Field: phrase arch</td><td class="num">0.93</td><td class="num">17.5</td><td class="num">1.63</td><td class="num">3.22</td><td class="num">96 %</td></tr>
<tr><td>Field: Rössler</td><td class="num">0.90</td><td class="num">19.7</td><td class="num">1.48</td><td class="num">3.20</td><td class="num">94 %</td></tr>
<tr><td>Canon (2 violins)</td><td class="num">0.89</td><td class="num">16.8</td><td class="num">1.47</td><td class="num">3.44</td><td class="num">100 %</td></tr>
<tr><td>Trio in canon (from generation 0)</td><td class="num">0.79</td><td class="num">18.5</td><td class="num">—</td><td class="num">—</td><td class="num">87 % (triads 87 %)</td></tr>
</tbody></table></div>
<ul>
<li>The outputs of the original rules have the melodic surprise of white noise and 2–3 times more notes than real melodies. As a canon at 1 bar they sound as consonant as random noise: the self-harmonisation rules were not enough for two violinists to read the same part.</li>
<li>Just swapping the bit operators for musical operators takes the critic from 0.00 to 0.93.</li>
<li>How much comes from the initial population: with musical patterns (rhythmic cells and scale) the best individual of generation 0 already has a critic of 0.71–0.88. From a random population, without patterns, the GA reaches the same fitness with 1–2 voices in 1000–2000 generations, but the critic stays ~0.1 lower; with 3 voices it does not get there. The “Initial population” option lets you watch that convergence from noise.</li>
<li>Considering the canon from the initial population: with 2 voices the counterpoint reaches 0.8 in the 1st generation (22 generations without it); with 3 voices the final result also improves (triads 87 % against 72 %, critic 0.79 against 0.63).</li>
<li>Without the basins (ablation) the critic stays the same: the attractor waves control the shape of the contour, not the quality by themselves.</li>
<li>Rests: with the default weights the original hardly generates rests; when the waves are strengthened, it stops attacking notes (onsets from 0.7 to 0.2 per sixteenth, rests up to 10 %), because the wave rule only penalises onsets.</li>
<li>In the 480 real melodies a slow wave (1 cycle every 4–8 bars, ±2.9 semitones) is significant in 73 % of the cases, against 7 % in the same melodies shuffled; but it also appears in 84 % of random walks. The oscillation is a real factor, shared by any contour that moves by steps.</li>
</ul>

<h3>The original work in the light of the literature</h3>
<p>The observation that melodic contour has cyclic components already existed (Schmuckler 1999, 2010, with Fourier analysis of the contour), as did guiding generation with drawn curves (Xenakis, Hyperscore, MorpheuS). What the report had of its own was the combination: several moving target curves, not summed, each with a basin, competing for the notes in a GA’s fitness, to shape the melody and implied voices. I found no reuse of the repository. The general idea — controlling generation with curves over time (tension, mean pitch per bar, drawn contours) — became common after 2020 in neural networks (FIGARO, MIDI-Draw, Music ControlNet), along independent paths. The full analysis, with sources, is in the README.</p>

<h3>Literature used</h3>
<ul>
<li>Huron (1996), <em>The melodic arch in Western folksongs</em> — phrase arch; Huron (2006), <em>Sweet Anticipation</em> — step declination and other regularities.</li>
<li>Voss &amp; Clarke (1975), <a href="https://www.nature.com/articles/258317a0" target="_blank" rel="noopener">“1/f noise” in music and speech</a>, Nature 258 — 1/f fluctuations.</li>
<li>Pressing (1988), <em>Nonlinear maps as generators of musical design</em>, CMJ 12(2); Bidlack (1992), <em>Chaotic systems as simple (but complex) compositional algorithms</em>, CMJ 16(3) — chaotic attractors.</li>
<li>Dabby (1996), <a href="https://pubs.aip.org/aip/cha/article/6/2/95/135460/Musical-variations-from-a-chaotic-mapping" target="_blank" rel="noopener">Musical variations from a chaotic mapping</a>, Chaos 6(2) — variations.</li>
<li>Temperley (2008), <a href="https://onlinelibrary.wiley.com/doi/10.1080/03640210701864089" target="_blank" rel="noopener">A probabilistic model of melody perception</a>, Cognitive Science 32 — proximity and range profile.</li>
<li>von Hippel &amp; Huron (2000), <em>Why do skips precede reversals?</em>, Music Perception 18(1) — regression to the mean.</li>
<li>Lerdahl (2001), <em>Tonal Pitch Space</em>; Larson (2012), <a href="https://iupress.org/9780253356826/musical-forces/" target="_blank" rel="noopener">Musical Forces</a> — melodic attraction, magnetism, gravity, inertia.</li>
<li>Farbood (2012), <a href="https://online.ucpress.edu/mp/article-abstract/29/4/387/46442/A-Parametric-Temporal-Model-of-Musical-Tension" target="_blank" rel="noopener">A parametric, temporal model of musical tension</a>; Herremans &amp; Chew (2017), <a href="https://arxiv.org/pdf/1812.04832" target="_blank" rel="noopener">MorpheuS</a> — target tension profile.</li>
<li>Huron (2001), <a href="http://mp.ucpress.edu/content/19/1/1" target="_blank" rel="noopener">Tone and Voice</a>, Music Perception 19(1) — voice-leading rules; Fux (1725), <em>Gradus ad Parnassum</em>; Jeppesen (1939), <em>Counterpoint</em>.</li>
<li>Chiu &amp; Temperley (2024), <a href="https://journals.sagepub.com/doi/full/10.1177/20592043231225731" target="_blank" rel="noopener">Melodic differences between styles: modeling music with step inertia</a>; Tierney, Russo &amp; Patel (2011), <a href="https://www.pnas.org/doi/10.1073/pnas.1103882108" target="_blank" rel="noopener">The motor origins of human and avian song structure</a>, PNAS; Savage et al. (2015), <a href="https://www.pnas.org/doi/full/10.1073/pnas.1510724112" target="_blank" rel="noopener">Statistical universals</a>, PNAS — general heuristics.</li>
<li>Ratner (1980), <em>Classic Music</em>; Caplin (1998), <em>Classical Form</em>; Mattheson (1739), <em>Der vollkommene Capellmeister</em>; Unyk et al. (1992), <em>Lullabies and simplicity</em>; Mehr et al. (2019), <em>Universality and diversity in human song</em>, Science — styles (full list in the CSV).</li>
<li>Matić (2010), <em>A genetic algorithm for composing music</em>; Biles (1994), GenJam — musical operators.</li>
<li>Mouret &amp; Clune (2015), <a href="https://arxiv.org/pdf/1504.04909" target="_blank" rel="noopener">Illuminating search spaces by mapping elites</a> — MAP-Elites.</li>
<li>Towsey et al. (2001), <a href="https://eprints.qut.edu.au/169/" target="_blank" rel="noopener">Towards melodic extension using genetic algorithms</a>; Manaris et al. (2005), <a href="https://direct.mit.edu/comj/article-abstract/29/1/55/93945/Zipf-s-Law-Music-Classification-and-Aesthetics" target="_blank" rel="noopener">Zipf’s law, music classification, and aesthetics</a>; Pearce &amp; Wiggins (2012), IDyOM; Schmidhuber (2009), <a href="https://arxiv.org/abs/0812.4360" target="_blank" rel="noopener">compression progress</a>; Yang &amp; Lerch (2020) — evaluation.</li>
<li>Cambouropoulos (2001), <em>The Local Boundary Detection Model</em> — phrase segmentation.</li>
</ul>

<h3>Reference corpus</h3>
<p>480 melodies from the music21 corpus, in the public domain: 240 songs from the Essen collection, 120 tunes from <em>O’Neill’s Music of Ireland</em> (1850) and 120 Bach chorale sopranos, cut at the first 8 bars. Three movements of Telemann’s canons (Sonata I Vivace, Sonata II Vivace, Sonata III Spirituoso) were transcribed from the scores (ornaments left out, triplets approximated); in all of them, the counterpoint analysis peaks at the real entry of the 2nd voice.</p>
`,
  },
  // ------------------------------------------------------------------ Quick start (the window with the six questions)
  'qs.open': { pt: 'Início rápido', en: 'Quick start' },
  'qs.open.title': {
    pt: 'Seis perguntas (vozes e cânone, estilo, tipo de música, duração, ondas, tonalidade) que preparam uma configuração inicial completa',
    en: 'Six questions (voices and canon, style, kind of music, length, waves, key) that prepare a complete starting configuration',
  },
  'qs.heading': { pt: 'Início rápido', en: 'Quick start' },
  'qs.step': { pt: 'Pergunta {n} de {total}', en: 'Question {n} of {total}' },
  'qs.back': { pt: '← Anterior', en: '← Back' },
  'qs.next': { pt: 'Seguinte →', en: 'Next →' },
  'qs.apply': { pt: 'Só aplicar', en: 'Apply only' },
  'qs.applyRun': { pt: 'Aplicar e gerar', en: 'Apply and generate' },
  'qs.close': { pt: 'Fechar', en: 'Close' },
  'qs.goto': { pt: 'Ir para a pergunta {n}: {title}', en: 'Go to question {n}: {title}' },
  'qs.applied': { pt: 'Início rápido aplicado: {desc}.', en: 'Quick start applied: {desc}.' },

  'qs.voices.title': { pt: 'Cânone ou melodia simples?', en: 'Canon or a single melody?' },
  'qs.voices.note': {
    pt: 'O cânone é o centro deste projeto: a melodia é composta para soar bem contra si própria, tocada por duas ou três vozes que entram umas depois das outras, como nos cânones de Telemann. Desde a primeira geração o algoritmo pensa nas vozes juntas.',
    en: 'The canon is the heart of this project: the melody is composed to sound well against itself, played by two or three voices that come in one after the other, as in Telemann’s canons. From the first generation the algorithm thinks of the voices together.',
  },
  'qs.voices.canon': { pt: 'Cânone (recomendado)', en: 'Canon (recommended)' },
  'qs.voices.single': { pt: 'Melodia simples', en: 'Single melody' },
  'qs.voices.solo.desc': {
    pt: 'Uma voz só, sem cânone: o algoritmo cuida da frase, da forma e do estilo, mas não do contraponto.',
    en: 'One voice, no canon: the algorithm takes care of phrase, form and style, but not of counterpoint.',
  },

  'qs.style.title': { pt: 'Que estilo?', en: 'Which style?' },
  'qs.style.hint': {
    pt: 'O estilo junta as regras de composição desse repertório e sugere o compasso, o andamento e o modo habituais. Pode não escolher nenhum: ficam só as regras gerais.',
    en: 'A style brings the composition rules of that repertoire and suggests its usual meter, tempo and mode. You may choose none: then only the general rules apply.',
  },
  'qs.style.meta': { pt: 'Compassos: {meters} · andamento habitual: {tempo}', en: 'Meters: {meters} · usual tempo: {tempo}' },

  'qs.kind.title': { pt: 'Que tipo de música? (compasso e andamento)', en: 'What kind of music? (meter and tempo)' },
  'qs.kind.meter': { pt: 'Compasso', en: 'Meter' },
  'qs.kind.tempo': { pt: 'Carácter e andamento', en: 'Character and tempo' },
  'qs.kind.styleMeters': { pt: 'Compassos que o estilo usa: {meters}.', en: 'Meters the style uses: {meters}.' },
  'qs.kind.compound': { pt: 'Composto: cada tempo são três colcheias.', en: 'Compound: each beat is three eighths.' },
  'qs.kind.simple': { pt: 'Simples: cada tempo são duas colcheias.', en: 'Simple: each beat is two eighths.' },
  'qs.tempo.slow': { pt: 'Lento', en: 'Slow' },
  'qs.tempo.moderate': { pt: 'Moderado', en: 'Moderate' },
  'qs.tempo.lively': { pt: 'Vivo', en: 'Lively' },

  'qs.duration.title': { pt: 'Quanto deve durar, em média?', en: 'How long should it last, on average?' },
  'qs.duration.hint': {
    pt: 'O número de compassos é calculado a partir da duração, do compasso e do andamento; o andamento é acertado (até 20 %) para chegar perto da duração pedida.',
    en: 'The number of bars is worked out from the length, the meter and the tempo; the tempo is adjusted (up to 20 %) to get close to the length asked for.',
  },
  'qs.duration.calc': { pt: '{bars} compassos de {meter} a {tempo} → cerca de {time}.', en: '{bars} bars of {meter} at {tempo} → about {time}.' },
  'qs.duration.canon': {
    pt: 'Num cânone conta-se também o tempo em que as vozes que entram depois acabam a melodia; numa ronda a melodia ouve-se duas vezes. Os cânones precisam de pelo menos {need} compassos para a última voz entrar e dizer o tema.',
    en: 'In a canon the time the later voices take to finish the melody also counts; in a round the melody is heard twice. Canons need at least {need} bars for the last voice to come in and state the theme.',
  },

  'qs.waves.title': { pt: 'Quantas ondas atratoras?', en: 'How many attractor waves?' },
  'qs.waves.hint': {
    pt: 'As ondas atratoras são a ideia de partida do projeto: linhas que atraem as notas e dão o desenho da melodia. Uma onda dá um contorno; duas ou três dão uma melodia composta, que salta entre registos como se fossem várias vozes.',
    en: 'Attractor waves are the starting idea of the project: lines that pull the notes and give the melody its shape. One wave gives one contour; two or three give a compound melody that jumps between registers as if it were several voices.',
  },
  'qs.waves.auto': { pt: 'Uma onda escolhida pelo programa', en: 'One wave chosen by the program' },
  'qs.waves.auto.desc': { pt: 'Um arco de frase numa melodia, uma onda lenta e larga num cânone, no registo comum dos instrumentos.', en: 'A phrase arch for a melody, a slow, wide wave for a canon, in the common range of the instruments.' },
  'qs.waves.chaotic': { pt: 'Uma onda caótica', en: 'One chaotic wave' },
  'qs.waves.chaotic.desc': { pt: 'Atrator de Rössler: um contorno que nunca se repete exatamente, menos previsível.', en: 'Rössler attractor: a contour that never repeats exactly, less predictable.' },
  'qs.waves.two': { pt: 'Duas ondas', en: 'Two waves' },
  'qs.waves.two.desc': { pt: 'Melodia composta: um registo agudo e um grave, como nas suites de violoncelo de Bach.', en: 'Compound melody: a high and a low register, as in Bach’s cello suites.' },
  'qs.waves.three': { pt: 'Três ondas', en: 'Three waves' },
  'qs.waves.three.desc': { pt: 'Três registos: agudo, médio e grave.', en: 'Three registers: high, middle and low.' },
  'qs.waves.original': { pt: 'As duas ondas do programa original (2020)', en: 'The two waves of the original program (2020)' },
  'qs.waves.original.desc': { pt: 'Dois senos, como no formulário do programa em C#.', en: 'Two sines, as in the form of the C# program.' },

  'qs.key.title': { pt: 'Tonalidade e modo', en: 'Key and mode' },
  'qs.key.scale': { pt: 'Tonalidade', en: 'Key' },
  'qs.key.mode': { pt: 'Modo', en: 'Mode' },
  'qs.mode.major': { pt: 'Maior', en: 'Major' },
  'qs.mode.minor': { pt: 'Menor', en: 'Minor' },
  'qs.key.styleMode.major': { pt: 'O estilo costuma ser em modo maior.', en: 'The style is usually in major.' },
  'qs.key.styleMode.minor': { pt: 'O estilo costuma ser em modo menor.', en: 'The style is usually in minor.' },
  'qs.summary': { pt: 'Configuração que vai ser aplicada', en: 'Settings that will be applied' },
  'qs.sum.voices': { pt: 'Vozes', en: 'Voices' },
  'qs.sum.style': { pt: 'Estilo', en: 'Style' },
  'qs.sum.meter': { pt: 'Compasso e andamento', en: 'Meter and tempo' },
  'qs.sum.length': { pt: 'Duração', en: 'Length' },
  'qs.sum.waves': { pt: 'Ondas', en: 'Waves' },
  'qs.sum.key': { pt: 'Tonalidade', en: 'Key' },
  'qs.sum.ga': { pt: 'Algoritmo', en: 'Algorithm' },
  'qs.sum.lengthValue': { pt: '{bars} compassos, cerca de {time}', en: '{bars} bars, about {time}' },
  'qs.sum.gaValue': { pt: '{gens} gerações, população {pop}, semente {seed}', en: '{gens} generations, population {pop}, seed {seed}' },
  'qs.sum.none': { pt: 'nenhum (regras gerais)', en: 'none (general rules)' },
  'qs.time.s': { pt: '{s} s', en: '{s} s' },
  'qs.time.min': { pt: '{m} min', en: '{m} min' },
  'qs.time.minS': { pt: '{m} min {s} s', en: '{m} min {s} s' },
};

