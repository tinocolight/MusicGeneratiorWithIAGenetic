// "Sobre" tab: what this page is, what changed from the C# program, and the literature.
export const ABOUT_HTML = `
<h3>O que é</h3>
<p>Uma versão web do <em>GeneticMusic</em> (Rui Luz e Rafael Silva, IPCA 2020): um algoritmo genético compõe uma melodia e a aptidão inclui <strong>ondas atratoras</strong>, curvas que puxam as notas para uma bacia à sua volta. Tudo corre no navegador; a mesma semente dá sempre a mesma peça.</p>

<h3>Dois modelos, até três vozes</h3>
<ul>
<li><strong>Clássico</strong>: as 15 regras de <code>AlgorithmFitness.cs</code>, portadas regra a regra (validado contra o C# original compilado: 0 diferenças em 795 comparações), com os pesos do formulário original e operadores ao nível do bit como no GeneticSharp.</li>
<li><strong>Campo de atratores</strong>: as ondas passam a ter bacias contínuas (a influência decai com a distância), podem ser arcos de frase, ruído 1/f ou atratores caóticos, e juntam-se regras da cognição musical (ver abaixo). Cada regra é uma média por nota, por isso as pausas deixaram de ser um refúgio.</li>
<li><strong>Vozes</strong>: em qualquer dos modelos a melodia pode ser tocada por 2 ou 3 vozes, cada uma com o seu instrumento, compasso de entrada e intervalo (uníssono, oitavas, 5.ª ou 4.ª diatónicas), para que vários músicos leiam a mesma parte como nos <em>Canons mélodieux</em> de Telemann (TWV 40:118–123). O contraponto entre todos os pares de vozes entra na aptidão e na população inicial, desde a geração 0.</li>
</ul>

<h3>Partitura e LilyPond</h3>
<p>O botão «Partitura» mostra a peça em notação tradicional, uma pauta por voz, com a fonte Gonville (feita como substituta da fonte do LilyPond) e a disposição habitual do LilyPond. «LilyPond (.ly)» descarrega o código para gravar a partitura com o próprio LilyPond. No modo clássico, as duas ondas W1 e W2 editam-se com os mesmos campos do formulário original.</p>

<h3>Ondas editáveis e experiências</h3>
<p>Cada onda tem tipo, frequência, desfasamento, valor médio e amplitude (ou mínimo e máximo) e uma bacia com largura e forma; pode haver até 4. As ondas da configuração aparecem a tracejado na partitura antes de gerar. Os botões de auto-configuração sugerem ondas, forma, pesos e algoritmo a partir das vozes; cada geração fica registada com a sua configuração, e «Testar 5 sementes» mostra se uma mudança ajuda de forma consistente.</p>

<h3>Análise inversa</h3>
<p>235 melodias reais completas, os seus retrógrados e modelos nulos foram passados pelas regras. As regras originais dão à música real a mesma pontuação que ao ruído branco (50 % dos pares); as novas separam-nas em 96 % dos pares, sobretudo pela proximidade e pelas forças melódicas. Quase nenhuma regra distingue uma melodia do seu retrógrado (52 %), e o AG leva as regras ao dobro do valor que a música real atinge. Os pesos aprendidos com estes dados estão disponíveis como predefinição («Aprendidos da música real»). Detalhes em <code>web/results/reverse.md</code>.</p>

<h3>O que se encontrou no código original</h3>
<ul>
<li>As regras somam <code>result +=</code> dentro de <code>Parallel.For</code> sem sincronização: o mesmo cromossoma recebe notas diferentes em cada avaliação (erro mediano de 20–45 % por regra, medido com o C# original).</li>
<li>Na primeira execução a onda 1 é uma linha em 0 (o vetor é criado antes de o comprimento estático ser definido), o que penaliza todas as notas por igual.</li>
<li>Pausas e prolongamentos recebem pontos fixos ou são neutros em várias regras, enquanto as notas só podem perder pontos; o <code>ScoreBalance</code> pede 7–40 % de figuras sem ataque, mas nas melodias reais esse valor é 58–83 %.</li>
<li>A auto-harmonização compara genes e não as notas que soam (um prolongamento conta como a nota 74), premeia quartas e penaliza sextas, ao contrário do contraponto a duas vozes.</li>
<li>Duas gralhas de atribuição (<code>result = 2f</code> e <code>result = +10f</code>) e um ramo inalcançável em <code>EvaluateRange</code>.</li>
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
<li>Huron (1996), <em>The melodic arch in Western folksongs</em> — arco de frase.</li>
<li>Voss &amp; Clarke (1975), <a href="https://www.nature.com/articles/258317a0" target="_blank" rel="noopener">“1/f noise” in music and speech</a>, Nature 258 — flutuações 1/f.</li>
<li>Pressing (1988), <em>Nonlinear maps as generators of musical design</em>, CMJ 12(2); Bidlack (1992), <em>Chaotic systems as simple (but complex) compositional algorithms</em>, CMJ 16(3) — atratores caóticos.</li>
<li>Dabby (1996), <a href="https://pubs.aip.org/aip/cha/article/6/2/95/135460/Musical-variations-from-a-chaotic-mapping" target="_blank" rel="noopener">Musical variations from a chaotic mapping</a>, Chaos 6(2) — variações.</li>
<li>Temperley (2008), <a href="https://onlinelibrary.wiley.com/doi/10.1080/03640210701864089" target="_blank" rel="noopener">A probabilistic model of melody perception</a>, Cognitive Science 32 — proximidade e perfil de âmbito.</li>
<li>von Hippel &amp; Huron (2000), <em>Why do skips precede reversals?</em>, Music Perception 18(1) — regressão para a média.</li>
<li>Lerdahl (2001), <em>Tonal Pitch Space</em>; Larson (2012), <a href="https://iupress.org/9780253356826/musical-forces/" target="_blank" rel="noopener">Musical Forces</a> — atração melódica, magnetismo, gravidade, inércia.</li>
<li>Farbood (2012), <a href="https://online.ucpress.edu/mp/article-abstract/29/4/387/46442/A-Parametric-Temporal-Model-of-Musical-Tension" target="_blank" rel="noopener">A parametric, temporal model of musical tension</a>; Herremans &amp; Chew (2017), <a href="https://arxiv.org/pdf/1812.04832" target="_blank" rel="noopener">MorpheuS</a> — perfil de tensão alvo.</li>
<li>Huron (2001), <a href="http://mp.ucpress.edu/content/19/1/1" target="_blank" rel="noopener">Tone and Voice</a>, Music Perception 19(1) — regras de condução de vozes; Fux (1725), <em>Gradus ad Parnassum</em>.</li>
<li>Matić (2010), <em>A genetic algorithm for composing music</em>; Biles (1994), GenJam — operadores musicais.</li>
<li>Mouret &amp; Clune (2015), <a href="https://arxiv.org/pdf/1504.04909" target="_blank" rel="noopener">Illuminating search spaces by mapping elites</a> — MAP-Elites.</li>
<li>Towsey et al. (2001), <a href="https://eprints.qut.edu.au/169/" target="_blank" rel="noopener">Towards melodic extension using genetic algorithms</a>; Manaris et al. (2005), <a href="https://direct.mit.edu/comj/article-abstract/29/1/55/93945/Zipf-s-Law-Music-Classification-and-Aesthetics" target="_blank" rel="noopener">Zipf’s law, music classification, and aesthetics</a>; Pearce &amp; Wiggins (2012), IDyOM; Schmidhuber (2009), <a href="https://arxiv.org/abs/0812.4360" target="_blank" rel="noopener">compression progress</a>; Yang &amp; Lerch (2020) — avaliação.</li>
<li>Cambouropoulos (2001), <em>The Local Boundary Detection Model</em> — segmentação em frases.</li>
</ul>

<h3>Corpus de referência</h3>
<p>480 melodias do corpus do music21, em domínio público: 240 canções da coleção Essen, 120 temas de <em>O'Neill's Music of Ireland</em> (1850) e 120 sopranos de corais de Bach, cortadas nos primeiros 8 compassos. Três andamentos dos cânones de Telemann (Sonata I Vivace, Sonata II Vivace, Sonata III Spirituoso) foram transcritos das partituras (ornamentos omitidos, tercinas aproximadas); em todos, a análise de contraponto dá o máximo na entrada real da 2.ª voz.</p>
`;
