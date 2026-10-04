# Ouvir a partitura no telemóvel: QR code, ligação e PDF com o MIDI

Pedido:
- gravar opcionalmente no PDF um QR code denso com o ficheiro MIDI;
- procurar a melhor forma de um telemóvel tocar esse MIDI e a codificação mais densa;
- poder carregar o PDF para recuperar a música.

Os achados e as fontes estão em [`qr/pesquisa.csv`](qr/pesquisa.csv).

## O que diz a pesquisa

- **Um QR não toca som.** Cabem no máximo 2953 bytes (versão 40, correção L). Isso não chega para
  áudio que se ouça, mas chega para um MIDI comprimido de várias vozes (Q04, Q08).
- **A câmara do telemóvel só abre endereços https com fiabilidade.** `data:` e esquemas próprios
  falham ou dependem do telemóvel, e o Safari do iOS recusa http (Q01, Q02). Os «QR de áudio»
  comerciais apontam para uma página que toca o ficheiro (Q09).
- **A música vai no fragmento** (depois de `#`). O navegador nunca o envia ao servidor (Q03), por
  isso não é preciso servidor nenhum: a página é estática e a música vai no endereço.
- **O modo numérico é o mais denso do QR**: 3,33 bits por dígito, contra 5,5 do alfanumérico e 8
  do byte (Q05).
  - Bytes escritos como números decimais aproveitam 99 % dos bits, contra 75 % do Base64.
  - O Base45 (RFC 9285, Q06) rende o mesmo, mas o seu alfabeto tem espaço, `%` e `+`, que num
    endereço têm de ser escapados.
  - Um QR pode misturar modos (Q07): o endereço vai em byte, a música em numérico.
- **A compressão DEFLATE existe em todos os navegadores atuais** (CompressionStream, Q10).
- **Um QR denso tem de ser impresso maior:** cerca de 4 píxeis da câmara por módulo (Q11).
- **Um PDF pode levar ficheiros dentro** (ISO 32000, PDF/A-3, Q12). É a forma exata de voltar do
  PDF à música: o reconhecimento ótico da partitura (OMR) é sempre aproximado (Q13).

## O que se fez

- **No MIDI.** O ficheiro leva também o registo da peça, num evento de texto que os leitores de
  MIDI ignoram: genes, definições, andamento e título.
- **No PDF.** O MIDI vai sempre anexado ao PDF, e «Abrir PDF ou MIDI…» recupera a peça tal como
  era.
- **No QR** (opcional). O QR traz `https://…/web/#M<dígitos>`: o MIDI comprimido, 12 bytes em 29
  dígitos, em modo numérico.
  - Fica no canto inferior direito da última página, num espaço que a paginação reserva para ele.
  - A explicação vai ao lado, e nem o QR nem o texto tapam a partitura.
  - Ao abrir a ligação, a página mostra a peça e toca-a ao carregar em ▶ Tocar. O telemóvel só
    deixa tocar som depois de um toque no ecrã.
- **A ligação.** «Copiar ligação» dá o mesmo endereço do QR, para enviar por mensagem.

Não foi preciso nenhum dos recursos que o pedido previa para o caso de não ser possível recuperar
a peça, como um QR cinzento claro em todos os PDF: os metadados (o anexo) já o fazem. O QR fica
como opção.

## Medições (teste no navegador: PDF renderizado pelo pdf.js e QR lido pelo jsQR)

| Peça | Dados no QR | Versão | Módulos |
|---|---|---|---|
| melodia, 8 compassos | 395 bytes | 14 | 73×73 |
| cânone a 2 vozes (Telemann), 8 compassos | 544 bytes | 16 | 81×81 |
| ronda a 3 vozes, 32 compassos | 1404 bytes | 27 | 125×125 |
| trio, 64 compassos | 2047 bytes | 34 | 153×153 |

Nos quatro casos o QR foi lido da imagem da página, a ligação abriu a mesma peça, e o PDF reaberto
deu a mesma peça (as ligações geradas antes e depois são iguais, carácter a carácter). O
codificador de QR foi verificado com o jsQR em todas as versões, níveis e máscaras, e
`test/song.test.mjs` lê os símbolos de volta.

## Limitações

- **Endereço:** a ligação abre a página publicada. O GitHub Pages tem de estar ativo no
  repositório, ou dá-se outro endereço no campo junto à opção.
- **Tamanho:** um QR versão 30–40 precisa de boa impressão e de ser lido de perto (10–15 cm).
- **Peças muito longas:** quando nem a melodia com o registo cabe, o PDF diz que não leva QR. O
  MIDI continua anexado.
