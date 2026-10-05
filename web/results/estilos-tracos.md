# Os traços de aptidão do fado no blues e no pop

Gerado por `node tools/traits_study.mjs 8 400`: 8 sementes por variante, 400 gerações, população 80, com as definições de cada estilo e o peso das heurísticas de um estilo escolhido. Tabela também em `results/estilos/tracos.csv`. O crítico aprendeu as suas melodias em canções folk, onde a síncopa é rara, e pesa-a contra elas; a coluna «sem a síncopa» é o mesmo crítico com a síncopa na média do corpus.

| Estilo | Traços | Pontuação do estilo | Regras no intervalo | Pausas | Síncopas por compasso | Crítico | Crítico sem a síncopa | Regras que falham |
|---|---|---|---|---|---|---|---|---|
| blues | nenhum | 0,898 | 84 % | 8 % | 0,14 | 0,67 | 0,76 | restShare 8/8; syncBar 8/8; leaps 4/8; stepDown 1/8 |
| blues | pausas | 0,947 | 91 % | 20 % | 0,26 | 0,57 | 0,76 | leaps 4/8; syncBar 4/8; motifs 2/8; pentatonic 1/8; finalLength 1/8 |
| blues | pausas + antecipação | 0,910 | 92 % | 18 % | 0,31 | 0,52 | 0,77 | motifs 6/8; leaps 4/8; syncBar 1/8 |
| blues | pausas + antecipação + recitação | 0,972 | 91 % | 17 % | 0,30 | 0,54 | 0,70 | leaps 5/8; syncBar 3/8; motifs 2/8; endLow 1/8 |
| pop | nenhum | 0,883 | 80 % | 7 % | 0,20 | 0,73 | 0,83 | syncBar 8/8; restShare 8/8; motifs 6/8; leaps 4/8 |
| pop | pausas | 0,922 | 84 % | 10 % | 0,23 | 0,63 | 0,78 | syncBar 8/8; leaps 5/8; motifs 4/8; restShare 2/8; finalLength 1/8; pentatonic 1/8 |
| pop | pausas + antecipação | 0,947 | 85 % | 9 % | 0,36 | 0,48 | 0,79 | syncBar 7/8; motifs 6/8; restShare 3/8; leaps 3/8 |
