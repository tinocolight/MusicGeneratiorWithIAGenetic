// "Sobre" tab: what this page is, what changed from the C# program, and the literature.
export const ABOUT_HTML = `
<h3>O que é</h3>
<p>Uma versão web do <em>GeneticMusic</em> (Rui Luz e Rafael Silva, IPCA 2020): um algoritmo genético compõe uma melodia e a aptidão inclui <strong>ondas atratoras</strong>, curvas que puxam as notas para uma bacia à sua volta. Tudo corre no navegador; a mesma semente dá sempre a mesma peça.</p>

<h3>Três modos</h3>
<ul>
<li><strong>Clássico</strong>: as 15 regras de <code>AlgorithmFitness.cs</code>, portadas regra a regra (validado contra o C# original compilado: 0 diferenças em 795 comparações), com os pesos do formulário original e operadores ao nível do bit como no GeneticSharp.</li>
<li><strong>Campo de atratores</strong>: as ondas passam a ter bacias contínuas (a influência decai com a distância), podem ser arcos de frase, ruído 1/f ou atratores caóticos, e juntam-se regras da cognição musical (ver abaixo). Cada regra é uma média por nota, por isso as pausas deixaram de ser um refúgio.</li>
<li><strong>Cânone</strong>: a melodia é avaliada contra si própria atrasada x compassos, com regras de contraponto a duas vozes, para que dois violinistas leiam a mesma parte como nos <em>Canons mélodieux</em> de Telemann (TWV 40:118–123).</li>
</ul>

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
<tr><td>Campo: arco de frase</td><td class="num">0,87</td><td class="num">18,8</td><td class="num">1,51</td><td class="num">3,32</td><td class="num">99 %</td></tr>
<tr><td>Campo: Rössler</td><td class="num">0,79</td><td class="num">19,5</td><td class="num">1,30</td><td class="num">3,35</td><td class="num">94 %</td></tr>
<tr><td>Cânone</td><td class="num">0,78</td><td class="num">16,5</td><td class="num">1,31</td><td class="num">3,67</td><td class="num">100 %</td></tr>
</tbody></table></div>
<ul>
<li>As saídas das regras originais têm a surpresa melódica do ruído branco e 2–3 vezes mais notas do que melodias reais. Em cânone a 1 compasso soam tão consonantes como ruído ao acaso: as regras de auto-harmonização não chegavam para dois violinistas lerem a mesma parte.</li>
<li>Só trocar os operadores de bits por operadores musicais já leva o crítico de 0,00 a 0,93.</li>
<li>Sem as bacias (ablação) o crítico fica igual: as ondas atratoras controlam a forma do contorno, não a qualidade por si só.</li>
<li>Pausas: com os pesos por defeito o original quase não gera pausas; quando se reforçam as ondas, deixa de atacar notas (ataques de 0,7 para 0,2 por semicolcheia, pausas até 10 %), porque a regra da onda só penaliza ataques.</li>
<li>Nas 480 melodias reais uma onda lenta (1 ciclo a cada 4–8 compassos, ±2,9 semitons) é significativa em 73 % dos casos, contra 7 % nas mesmas melodias baralhadas; mas também aparece em 84 % dos passeios aleatórios. A oscilação é um fator real, partilhado por qualquer contorno que avance por graus.</li>
</ul>

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
<p>480 melodias do corpus do music21, em domínio público: 240 canções da coleção Essen, 120 temas de <em>O'Neill's Music of Ireland</em> (1850) e 120 sopranos de corais de Bach, cortadas nos primeiros 8 compassos. O Vivace do TWV 40:118 foi transcrito a partir da edição de Johan Tufvesson (ornamentos omitidos, tercinas aproximadas).</p>
`;
