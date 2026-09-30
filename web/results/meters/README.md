# Análise por compasso: tabelas

Geradas por `node tools/build_meters.mjs` (CSV) e `python3 tools/export_xlsx.py` (este ficheiro e `analise-compassos.xlsx`, com as mesmas tabelas, fórmulas nas colunas derivadas e um comentário em cada cabeçalho). O relatório está em `../meters.md`.

Os CSV estão em UTF-8 (com BOM, para o Excel), separados por vírgulas, com ponto decimal. Os códigos não começam por `+`, `-` nem `=`, para que o Excel não os leia como fórmulas: figura `x_x_` (x começa uma nota, _ continua, . silêncio), direção `sg`/`ss`/`dg`/`ds`/`r` (sobe/desce por grau/salto, repete), contorno `s1d1` (sobe um grau, desce um).

## `corpus.csv` — Corpus (9635 linhas)

Uma linha por melodia usada na análise.

| Coluna | Significado |
|---|---|
| `id` | Número da melodia em data/corpus-meters.json. |
| `fonte` | Coleção de onde vem (corpus do music21). |
| `titulo` | Título na coleção. |
| `compasso_original` | Compasso escrito na partitura. |
| `compasso` | Compasso (fórmula de compasso). 4/4 inclui as melodias escritas em 2/2, que na grelha de semicolcheias se escrevem como 4/4. |
| `familia` | simples (o tempo divide-se em 2: semínima = 2 colcheias) ou composto (o tempo divide-se em 3: semínima com ponto = 3 colcheias). |
| `anacrusa_16` | Semicolcheias antes do primeiro tempo forte (0 = sem anacrusa). |
| `compassos` | Duração em compassos. |
| `tempos` | Número de tempos analisados. |
| `notas` | Número de notas. |
| `tonica_pc` | Tónica estimada pelo music21 (0 = Dó, 7 = Sol...). |
| `modo` | Modo maior ou menor estimado. |
| `dobra_cv` | Dobra da validação cruzada (id mod 5): o modelo é avaliado em cada dobra depois de contar só as outras quatro. |

## `corpus_excluidas.csv` — Excluídas (83 linhas)

Melodias do music21 que ficaram de fora, por compasso e motivo (por exemplo tercinas, que a grelha de semicolcheias do programa não escreve).

| Coluna | Significado |
|---|---|
| `compasso` | Compasso (fórmula de compasso). 4/4 inclui as melodias escritas em 2/2, que na grelha de semicolcheias se escrevem como 4/4. |
| `motivo` | Porque ficou de fora. |
| `melodias` | Quantas melodias. |

## `figuras.csv` — Figuras (262 linhas)

As figuras rítmicas de um tempo, por compasso, da mais comum para a menos comum.

| Coluna | Significado |
|---|---|
| `compasso` | Compasso (fórmula de compasso). 4/4 inclui as melodias escritas em 2/2, que na grelha de semicolcheias se escrevem como 4/4. |
| `familia` | simples (o tempo divide-se em 2: semínima = 2 colcheias) ou composto (o tempo divide-se em 3: semínima com ponto = 3 colcheias). |
| `posicao_no_ranking` | 1 = a figura mais comum desse compasso. |
| `figura_codigo` | Figura rítmica de um tempo, uma letra por semicolcheia: x = começa uma nota, _ = a nota continua, . = silêncio. Nos compassos simples o tempo tem 4 semicolcheias (x_x_ = duas colcheias), nos compostos 6 (x___x_ = semínima e colcheia). |
| `figura` | A mesma figura em notas: sc semicolcheia, ♪ colcheia, ♪. colcheia pontuada, ♩ semínima, ♩. semínima pontuada; (lig.) = continuação de uma nota do tempo anterior. |
| `figura_por_extenso` | A figura por extenso. |
| `silabas_takadimi` | Sílabas de Takadimi (Hoffman, Pelto & White 1996) das notas que começam no tempo: uma sílaba por posição (simples: ta ka di mi; composto: ta va ki di da ma). |
| `tempos` | Em quantos tempos aparece. |
| `fracao_dos_tempos` | tempos / total de tempos do compasso (fórmula). |
| `melodias` | Em quantas melodias aparece pelo menos uma vez. |
| `fracao_das_melodias` | melodias / melodias do compasso (fórmula). |
| `nas_listas_de_manual` | sim se a figura está na lista de figuras de manual (folhas Literatura). |

## `figuras_por_tempo.csv` — Figuras por tempo (508 linhas)

As figuras em cada tempo do compasso (1 = tempo forte).

| Coluna | Significado |
|---|---|
| `compasso` | Compasso (fórmula de compasso). 4/4 inclui as melodias escritas em 2/2, que na grelha de semicolcheias se escrevem como 4/4. |
| `tempo_do_compasso` | Tempo do compasso (1 = o primeiro, forte). |
| `figura_codigo` | Figura rítmica de um tempo, uma letra por semicolcheia: x = começa uma nota, _ = a nota continua, . = silêncio. Nos compassos simples o tempo tem 4 semicolcheias (x_x_ = duas colcheias), nos compostos 6 (x___x_ = semínima e colcheia). |
| `figura` | A mesma figura em notas: sc semicolcheia, ♪ colcheia, ♪. colcheia pontuada, ♩ semínima, ♩. semínima pontuada; (lig.) = continuação de uma nota do tempo anterior. |
| `silabas_takadimi` | Sílabas de Takadimi (Hoffman, Pelto & White 1996) das notas que começam no tempo: uma sílaba por posição (simples: ta ka di mi; composto: ta va ki di da ma). |
| `ocorrencias` | Quantas vezes aconteceu no corpus. |
| `P_figura_dado_tempo` | P(figura | tempo do compasso) = ocorrências / ocorrências nesse tempo (fórmula). |

## `literatura_simples.csv` — Literatura (simples) (10 linhas)

Figuras de um tempo dos manuais de ritmo para compassos simples, e quanto aparecem no corpus (fórmulas que vão buscar os valores à folha Figuras).

| Coluna | Significado |
|---|---|
| `familia` | simples (o tempo divide-se em 2: semínima = 2 colcheias) ou composto (o tempo divide-se em 3: semínima com ponto = 3 colcheias). |
| `figura_codigo` | Figura rítmica de um tempo, uma letra por semicolcheia: x = começa uma nota, _ = a nota continua, . = silêncio. Nos compassos simples o tempo tem 4 semicolcheias (x_x_ = duas colcheias), nos compostos 6 (x___x_ = semínima e colcheia). |
| `figura` | A mesma figura em notas: sc semicolcheia, ♪ colcheia, ♪. colcheia pontuada, ♩ semínima, ♩. semínima pontuada; (lig.) = continuação de uma nota do tempo anterior. |
| `descricao` | O que é a figura. |
| `silabas_takadimi` | Sílabas de Takadimi (Hoffman, Pelto & White 1996) das notas que começam no tempo: uma sílaba por posição (simples: ta ka di mi; composto: ta va ki di da ma). |
| `fracao_2/4` |  |
| `ranking_2/4` |  |
| `fracao_3/4` |  |
| `ranking_3/4` |  |
| `fracao_4/4` |  |
| `ranking_4/4` |  |

## `literatura_composto.csv` — Literatura (compostos) (12 linhas)

Figuras de um tempo dos manuais de ritmo para compassos compostos, e quanto aparecem no corpus.

| Coluna | Significado |
|---|---|
| `familia` | simples (o tempo divide-se em 2: semínima = 2 colcheias) ou composto (o tempo divide-se em 3: semínima com ponto = 3 colcheias). |
| `figura_codigo` | Figura rítmica de um tempo, uma letra por semicolcheia: x = começa uma nota, _ = a nota continua, . = silêncio. Nos compassos simples o tempo tem 4 semicolcheias (x_x_ = duas colcheias), nos compostos 6 (x___x_ = semínima e colcheia). |
| `figura` | A mesma figura em notas: sc semicolcheia, ♪ colcheia, ♪. colcheia pontuada, ♩ semínima, ♩. semínima pontuada; (lig.) = continuação de uma nota do tempo anterior. |
| `descricao` | O que é a figura. |
| `silabas_takadimi` | Sílabas de Takadimi (Hoffman, Pelto & White 1996) das notas que começam no tempo: uma sílaba por posição (simples: ta ka di mi; composto: ta va ki di da ma). |
| `fracao_3/8` |  |
| `ranking_3/8` |  |
| `fracao_6/8` |  |
| `ranking_6/8` |  |
| `fracao_9/8` |  |
| `ranking_9/8` |  |
| `fracao_12/8` |  |
| `ranking_12/8` |  |

## `transicoes_1_passo.csv` — Transições (1 passo) (3634 linhas)

A regra simples: dada a figura atual e a direção da última nota, a probabilidade de cada figura seguinte; e a mesma probabilidade sem olhar para a direção, para ver o efeito da direção. Só contextos vistos 10 ou mais vezes e continuações vistas 2 ou mais vezes.

| Coluna | Significado |
|---|---|
| `compasso` | Compasso (fórmula de compasso). 4/4 inclui as melodias escritas em 2/2, que na grelha de semicolcheias se escrevem como 4/4. |
| `tempo_seguinte` | Tempo do compasso em que cai a figura seguinte (1 = forte). |
| `figura_atual_codigo` | Figura do tempo atual (código). |
| `figura_atual` | Figura do tempo atual. |
| `direcao` | Direção do último intervalo melódico antes do tempo seguinte (entre as duas últimas notas): s sobe, d desce, r repete, 0 ainda não há intervalo. |
| `direcao_por_extenso` | A direção por extenso. |
| `figura_seguinte_codigo` | Figura do tempo seguinte (código). |
| `figura_seguinte` | Figura do tempo seguinte. |
| `ocorrencias` | Quantas vezes aconteceu no corpus. |
| `ocorrencias_do_contexto` | Quantas vezes o contexto (a condição da linha) aconteceu no corpus: a base da probabilidade. |
| `P_seguinte_dado_figura_e_direcao` | P(seguinte | figura atual, direção, tempo) = ocorrências / ocorrências do contexto (fórmula). |
| `P_seguinte_dado_figura_sem_direcao` | P(seguinte | figura atual, tempo), sem olhar para a direção (calculada pelo script sobre todas as direções). |
| `efeito_da_direcao` | Diferença entre as duas probabilidades (fórmula): o que a direção muda. |
| `lift_face_ao_tempo` | P(seguinte | figura, direção) / P(seguinte | só o tempo): >1 a figura atual torna a seguinte mais provável do que o normal. |

## `arvore_2_passos.csv` — Árvore (2 passos) (3958 linhas)

A árvore de dois passos: dada a figura atual e a direção da última nota, os pares de figuras seguintes mais prováveis (até 10 por contexto visto 30 ou mais vezes), e a probabilidade que uma cadeia de 1.ª ordem daria ao mesmo par (sem memória da figura atual no segundo passo).

| Coluna | Significado |
|---|---|
| `compasso` | Compasso (fórmula de compasso). 4/4 inclui as melodias escritas em 2/2, que na grelha de semicolcheias se escrevem como 4/4. |
| `tempo_seguinte` |  |
| `figura_atual_codigo` |  |
| `figura_atual` |  |
| `direcao` | Direção do último intervalo melódico antes do tempo seguinte (entre as duas últimas notas): s sobe, d desce, r repete, 0 ainda não há intervalo. |
| `direcao_por_extenso` | A direção por extenso. |
| `ocorrencias_do_contexto` | Quantas vezes o contexto (a condição da linha) aconteceu no corpus: a base da probabilidade. |
| `ordem` | 1 = o par mais provável depois deste contexto. |
| `passo1_codigo` | Primeira figura seguinte (código). |
| `passo1` | Primeira figura seguinte. |
| `P_passo1` | P(passo 1 | contexto), sobre todos os pares vistos. |
| `passo2_codigo` | Segunda figura seguinte (código). |
| `passo2` | Segunda figura seguinte. |
| `P_passo2_dado_passo1` | P(passo 2 | contexto, passo 1). |
| `ocorrencias_do_par` | Quantas vezes o contexto foi seguido por este par. |
| `P_par_arvore` | P(par | contexto) = ocorrências do par / ocorrências do contexto (fórmula) = P_passo1 x P_passo2_dado_passo1. |
| `P_par_cadeia_1a_ordem` | P(passo 1 | figura atual, tempo) x P(passo 2 | passo 1, tempo seguinte): o que uma cadeia de 1.ª ordem prevê. |
| `razao_arvore_sobre_cadeia` | P_par_arvore / P_par_cadeia_1a_ordem (fórmula): longe de 1 = a memória de dois passos muda a previsão. |

## `entradas.csv` — Entradas (5232 linhas)

O intervalo de entrada num tempo (da última nota antes do tempo à primeira nota do tempo, em graus da escala), dado o grau da última nota e a direção do intervalo anterior. Contextos vistos 20 ou mais vezes.

| Coluna | Significado |
|---|---|
| `compasso` | Compasso (fórmula de compasso). 4/4 inclui as melodias escritas em 2/2, que na grelha de semicolcheias se escrevem como 4/4. |
| `tempo` | Tempo do compasso (1 = forte). |
| `grau_da_ultima_nota` | Grau da escala da última nota antes do tempo (1 = tónica, 5 = dominante). |
| `direcao_anterior` | Direção do intervalo anterior: sg sobe por grau (1-2 meios-tons), ss sobe por salto (3 ou mais), dg/ds desce, r repete. |
| `direcao_anterior_por_extenso` | A direção por extenso. |
| `intervalo_de_entrada_graus` | Intervalo de entrada em graus da escala (+1 = um grau acima, 0 = repete). |
| `intervalo_por_extenso` | O intervalo por extenso. |
| `ocorrencias` | Quantas vezes aconteceu no corpus. |
| `ocorrencias_do_contexto` | Quantas vezes o contexto (a condição da linha) aconteceu no corpus: a base da probabilidade. |
| `P_intervalo_dado_contexto` | P(intervalo | grau, direção anterior, tempo) = ocorrências / ocorrências do contexto (fórmula). |

## `contornos.csv` — Contornos (4172 linhas)

O contorno dentro do tempo (graus entre as notas que começam no tempo), dada a figura e a direção com que se entrou no tempo.

| Coluna | Significado |
|---|---|
| `compasso` | Compasso (fórmula de compasso). 4/4 inclui as melodias escritas em 2/2, que na grelha de semicolcheias se escrevem como 4/4. |
| `figura_codigo` | Figura rítmica de um tempo, uma letra por semicolcheia: x = começa uma nota, _ = a nota continua, . = silêncio. Nos compassos simples o tempo tem 4 semicolcheias (x_x_ = duas colcheias), nos compostos 6 (x___x_ = semínima e colcheia). |
| `figura` | A mesma figura em notas: sc semicolcheia, ♪ colcheia, ♪. colcheia pontuada, ♩ semínima, ♩. semínima pontuada; (lig.) = continuação de uma nota do tempo anterior. |
| `direcao_de_entrada` | Direção do intervalo de entrada no tempo (sg, ss, dg, ds, r). |
| `direcao_de_entrada_por_extenso` | A direção por extenso. |
| `contorno_codigo` | Contorno: s1 = sobe um grau, d2 = desce dois graus, r = repete; um passo por cada nota depois da primeira. |
| `contorno` | O contorno por extenso. |
| `ocorrencias` | Quantas vezes aconteceu no corpus. |
| `ocorrencias_da_figura` | Quantas vezes a figura apareceu com essa direção de entrada. |
| `P_contorno_dado_figura_e_entrada` | P(contorno | figura, direção de entrada) = ocorrências / ocorrências da figura (fórmula). |

## `associacoes.csv` — Associações (222 linhas)

Regras de associação entre figuras da mesma melodia: «se a melodia tem A, tem B com probabilidade P». Lift = quantas vezes mais do que numa melodia qualquer (1 = independentes).

| Coluna | Significado |
|---|---|
| `compasso` | Compasso (fórmula de compasso). 4/4 inclui as melodias escritas em 2/2, que na grelha de semicolcheias se escrevem como 4/4. |
| `figura_A_codigo` | Figura A (código). |
| `figura_A` | Figura A. |
| `figura_B_codigo` | Figura B (código). |
| `figura_B` | Figura B. |
| `melodias_com_A` | Melodias do compasso que têm A. |
| `melodias_com_B` | Melodias que têm B. |
| `melodias_com_ambas` | Melodias que têm A e B. |
| `melodias` | Melodias do compasso. |
| `P_B_dado_A` | P(B | A) = melodias com ambas / melodias com A (fórmula). |
| `lift` | P(B | A) / P(B) (fórmula). |

## `modelos.csv` — Modelos (138 linhas)

Comparação dos modelos por validação cruzada (5 dobras por melodia): bits por evento nas melodias deixadas de fora (menos é melhor). Os bits são valores calculados por tools/build_meters.mjs.

| Coluna | Significado |
|---|---|
| `compasso` | Compasso (fórmula de compasso). 4/4 inclui as melodias escritas em 2/2, que na grelha de semicolcheias se escrevem como 4/4. |
| `o_que_se_preve` | O que o modelo prevê: a figura seguinte, o intervalo de entrada ou o contorno dentro do tempo. |
| `modelo` | Nome curto: R = ritmo com n figuras anteriores, E = entrada, C = contorno; +dir3 = com a direção sobe/desce/repete, +dir5 = com grau/salto. |
| `contexto` | O que o modelo usa para prever. |
| `cadeia_de_contextos` | Os contextos, do mais específico para o mais geral: cada um é misturado com o seguinte (suavização interpolada). |
| `beta` | Pseudo-contagem da suavização, a melhor das experimentadas (0 = Witten-Bell puro). |
| `bits_por_evento` | Média de -log2 P do que aconteceu, nas melodias deixadas de fora. |
| `desvio_entre_dobras` | Desvio-padrão da média entre as 5 dobras. |
| `perplexidade` | 2 elevado aos bits (fórmula): de quantas escolhas igualmente prováveis o modelo hesita, em média. |
| `modelo_de_referencia` | O modelo com que se compara (R1, E1 ou C0). |
| `diferenca_para_referencia` | bits deste modelo - bits do de referência (fórmula); negativo = melhor. |
| `eventos_avaliados` | Eventos previstos nas 5 dobras. |
| `melhor_na_validacao` | sim = o modelo mais simples a menos de 0,01 bits do melhor, nesse compasso. |
| `usado_na_app` | sim = o modelo que a app usa (no ritmo, no máximo 4 figuras anteriores, para as tabelas caberem na página). |

## `segmentacao.csv` — Segmentação (6 linhas)

Vale a pena separar os compassos? Bits por compasso do ritmo real, lido como antes (todos os tempos com 4 semicolcheias, compassos do mesmo comprimento juntos) e lido compasso a compasso.

| Coluna | Significado |
|---|---|
| `compasso` | Compasso (fórmula de compasso). 4/4 inclui as melodias escritas em 2/2, que na grelha de semicolcheias se escrevem como 4/4. |
| `bits_por_compasso_sem_segmentar_1a_ordem` | Como o programa lia antes: tempos de 4 semicolcheias, 3/4 e 6/8 juntos, 1.ª ordem. |
| `bits_por_compasso_sem_segmentar_2a_ordem` | O mesmo com duas figuras anteriores. |
| `bits_por_compasso_por_compasso_1a_ordem` | Cada compasso com o seu tempo (4 ou 6 semicolcheias), 1.ª ordem. |
| `bits_por_compasso_por_compasso_2a_ordem` | Cada compasso, duas figuras anteriores. |
| `bits_por_compasso_modelo_escolhido` | Cada compasso com o melhor modelo do estudo. |
| `vezes_so_por_segmentar` | 2 elevado a (sem segmentar, 2.ª ordem - por compasso, 2.ª ordem) (fórmula): quantas vezes mais provável fica o ritmo real de um compasso só por separar os compassos, com o mesmo modelo. |
| `vezes_segmentar_e_modelo_escolhido` | 2 elevado a (como antes - modelo escolhido) (fórmula): o ganho de separar os compassos e usar o melhor modelo. |

## `modelo_da_app.csv` — Modelo da app (6 linhas)

O que a app usa em cada compasso (src/data/blocks-data.js) e quanto prevê, em validação cruzada, com as tabelas tal como vão para o navegador.

| Coluna | Significado |
|---|---|
| `compasso` | Compasso (fórmula de compasso). 4/4 inclui as melodias escritas em 2/2, que na grelha de semicolcheias se escrevem como 4/4. |
| `ritmo` | Modelo do ritmo (folha Modelos). |
| `beta_ritmo` | Suavização do ritmo. |
| `melodia_entrada` | Modelo do intervalo de entrada. |
| `beta_entrada` | Suavização da entrada. |
| `melodia_contorno` | Modelo do contorno. |
| `beta_contorno` | Suavização do contorno. |
| `bits_ritmo_por_tempo` | Bits por tempo do ritmo. |
| `bits_ritmo_melhor_modelo` |  |
| `bits_ritmo_1a_ordem` |  |
| `bits_entrada` | Bits por intervalo de entrada. |
| `bits_entrada_melhor_modelo` |  |
| `bits_entrada_algoritmo_anterior` |  |
| `bits_contorno` | Bits por contorno. |
| `bits_contorno_melhor_modelo` |  |
| `logp_P10` | Log-probabilidade média por tempo de uma melodia real (P10): abaixo disto a regra «idioma» penaliza. |
| `logp_P50` | Idem, mediana: a regra «idioma» não recompensa acima disto. |
| `tamanho_KB` | Tamanho das tabelas desse compasso na app. |
