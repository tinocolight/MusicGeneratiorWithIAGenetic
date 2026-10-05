# Trabalho futuro

Ideias e pedidos deixados para depois, complementares ao projeto. Cada entrada diz de onde veio,
o que se quer e o que já existe no código para lhe pegar. Nada disto está implementado.

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

