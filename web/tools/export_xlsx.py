"""Gathers the tables of the analysis by meter (results/meters/*.csv, written by
tools/build_meters.mjs) into one Excel workbook, results/meters/analise-compassos.xlsx, and
writes the column dictionary results/meters/README.md from the same descriptions.

In the workbook the derived columns are formulas (a probability is its count over the count of
its context, a fraction is a count over the total of its meter...), so whoever audits a number
sees where it comes from, and a changed count updates everything that depends on it. The
columns that come from the cross-validation (bits per event) are values computed by
tools/build_meters.mjs, as the Leia-me sheet says.

Run:  python3 tools/export_xlsx.py        (pip install openpyxl)
Then, to fill in the cached values of the formulas and check them (optional):
      python3 <xlsx skill>/scripts/recalc.py results/meters/analise-compassos.xlsx 600
"""
import csv
import os
import re

from openpyxl import Workbook
from openpyxl.comments import Comment
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

HERE = os.path.dirname(os.path.abspath(__file__))
DIR = os.path.join(HERE, '..', 'results', 'meters')
OUT = os.path.join(DIR, 'analise-compassos.xlsx')

FONT = Font(name='Arial', size=10)
BOLD = Font(name='Arial', size=10, bold=True)
TITLE = Font(name='Arial', size=14, bold=True)
H2 = Font(name='Arial', size=11, bold=True)
HEAD_FILL = PatternFill('solid', start_color='D9D9D9')
FORMULA_FILL = PatternFill('solid', start_color='EAF1FB')
THIN = Side(style='thin', color='A6A6A6')
WRAP = Alignment(wrap_text=True, vertical='top')

# ------------------------------------------------------------------ what every column means

COMMON = {
    'compasso': 'Compasso (fórmula de compasso). 4/4 inclui as melodias escritas em 2/2, que na grelha de semicolcheias se escrevem como 4/4.',
    'familia': 'simples (o tempo divide-se em 2: semínima = 2 colcheias) ou composto (o tempo divide-se em 3: semínima com ponto = 3 colcheias).',
    'figura_codigo': 'Figura rítmica de um tempo, uma letra por semicolcheia: x = começa uma nota, _ = a nota continua, . = silêncio. Nos compassos simples o tempo tem 4 semicolcheias (x_x_ = duas colcheias), nos compostos 6 (x___x_ = semínima e colcheia).',
    'figura': 'A mesma figura em notas: sc semicolcheia, ♪ colcheia, ♪. colcheia pontuada, ♩ semínima, ♩. semínima pontuada; (lig.) = continuação de uma nota do tempo anterior.',
    'figura_por_extenso': 'A figura por extenso.',
    'silabas_takadimi': 'Sílabas de Takadimi (Hoffman, Pelto & White 1996) das notas que começam no tempo: uma sílaba por posição (simples: ta ka di mi; composto: ta va ki di da ma).',
    'direcao': 'Direção do último intervalo melódico antes do tempo seguinte (entre as duas últimas notas): s sobe, d desce, r repete, 0 ainda não há intervalo.',
    'direcao_por_extenso': 'A direção por extenso.',
    'ocorrencias': 'Quantas vezes aconteceu no corpus.',
    'ocorrencias_do_contexto': 'Quantas vezes o contexto (a condição da linha) aconteceu no corpus: a base da probabilidade.',
}

SHEETS = [
    # (csv name, sheet title, description, {column: description}, {column: formula template}, text columns, formats)
    ('corpus', 'Corpus', 'Uma linha por melodia usada na análise.', {
        'id': 'Número da melodia em data/corpus-meters.json.',
        'fonte': 'Coleção de onde vem (corpus do music21).',
        'titulo': 'Título na coleção.',
        'compasso_original': 'Compasso escrito na partitura.',
        'anacrusa_16': 'Semicolcheias antes do primeiro tempo forte (0 = sem anacrusa).',
        'compassos': 'Duração em compassos.',
        'tempos': 'Número de tempos analisados.',
        'notas': 'Número de notas.',
        'tonica_pc': 'Tónica estimada pelo music21 (0 = Dó, 7 = Sol...).',
        'modo': 'Modo maior ou menor estimado.',
        'dobra_cv': 'Dobra da validação cruzada (id mod 5): o modelo é avaliado em cada dobra depois de contar só as outras quatro.',
    }, {}, {'titulo', 'fonte', 'compasso', 'compasso_original', 'familia', 'modo'}, {}),
    ('corpus_excluidas', 'Excluídas', 'Melodias do music21 que ficaram de fora, por compasso e motivo (por exemplo tercinas, que a grelha de semicolcheias do programa não escreve).', {
        'motivo': 'Porque ficou de fora.',
        'melodias': 'Quantas melodias.',
    }, {}, {'compasso', 'motivo'}, {}),
    ('figuras', 'Figuras', 'As figuras rítmicas de um tempo, por compasso, da mais comum para a menos comum.', {
        'posicao_no_ranking': '1 = a figura mais comum desse compasso.',
        'tempos': 'Em quantos tempos aparece.',
        'fracao_dos_tempos': 'tempos / total de tempos do compasso (fórmula).',
        'melodias': 'Em quantas melodias aparece pelo menos uma vez.',
        'fracao_das_melodias': 'melodias / melodias do compasso (fórmula).',
        'nas_listas_de_manual': 'sim se a figura está na lista de figuras de manual (folhas Literatura).',
    }, {
        'fracao_dos_tempos': '=IFERROR({tempos}{r}/SUMIFS({tempos}:{tempos},{compasso}:{compasso},{compasso}{r}),"")',
        'fracao_das_melodias': "=IFERROR({melodias}{r}/INDEX('Resumo'!$C:$C,MATCH({compasso}{r},'Resumo'!$A:$A,0)),\"\")",
    }, {'compasso', 'familia', 'figura_codigo', 'figura', 'figura_por_extenso', 'silabas_takadimi', 'nas_listas_de_manual'}, {}),
    ('figuras_por_tempo', 'Figuras por tempo', 'As figuras em cada tempo do compasso (1 = tempo forte).', {
        'tempo_do_compasso': 'Tempo do compasso (1 = o primeiro, forte).',
        'P_figura_dado_tempo': 'P(figura | tempo do compasso) = ocorrências / ocorrências nesse tempo (fórmula).',
    }, {
        'P_figura_dado_tempo': '=IFERROR({ocorrencias}{r}/SUMIFS({ocorrencias}:{ocorrencias},{compasso}:{compasso},{compasso}{r},{tempo_do_compasso}:{tempo_do_compasso},{tempo_do_compasso}{r}),"")',
    }, {'compasso', 'figura_codigo', 'figura', 'silabas_takadimi'}, {}),
    ('literatura_simples', 'Literatura (simples)', 'Figuras de um tempo dos manuais de ritmo para compassos simples, e quanto aparecem no corpus (fórmulas que vão buscar os valores à folha Figuras).', {
        'descricao': 'O que é a figura.',
    }, 'literatura', {'familia', 'figura_codigo', 'figura', 'descricao', 'silabas_takadimi'}, {}),
    ('literatura_composto', 'Literatura (compostos)', 'Figuras de um tempo dos manuais de ritmo para compassos compostos, e quanto aparecem no corpus.', {
        'descricao': 'O que é a figura.',
    }, 'literatura', {'familia', 'figura_codigo', 'figura', 'descricao', 'silabas_takadimi'}, {}),
    ('transicoes_1_passo', 'Transições (1 passo)', 'A regra simples: dada a figura atual e a direção da última nota, a probabilidade de cada figura seguinte; e a mesma probabilidade sem olhar para a direção, para ver o efeito da direção. Só contextos vistos 10 ou mais vezes e continuações vistas 2 ou mais vezes.', {
        'tempo_seguinte': 'Tempo do compasso em que cai a figura seguinte (1 = forte).',
        'figura_atual_codigo': 'Figura do tempo atual (código).',
        'figura_atual': 'Figura do tempo atual.',
        'figura_seguinte_codigo': 'Figura do tempo seguinte (código).',
        'figura_seguinte': 'Figura do tempo seguinte.',
        'P_seguinte_dado_figura_e_direcao': 'P(seguinte | figura atual, direção, tempo) = ocorrências / ocorrências do contexto (fórmula).',
        'P_seguinte_dado_figura_sem_direcao': 'P(seguinte | figura atual, tempo), sem olhar para a direção (calculada pelo script sobre todas as direções).',
        'efeito_da_direcao': 'Diferença entre as duas probabilidades (fórmula): o que a direção muda.',
        'lift_face_ao_tempo': 'P(seguinte | figura, direção) / P(seguinte | só o tempo): >1 a figura atual torna a seguinte mais provável do que o normal.',
    }, {
        'P_seguinte_dado_figura_e_direcao': '=IFERROR({ocorrencias}{r}/{ocorrencias_do_contexto}{r},"")',
        'efeito_da_direcao': '=IFERROR({P_seguinte_dado_figura_e_direcao}{r}-{P_seguinte_dado_figura_sem_direcao}{r},"")',
    }, {'compasso', 'figura_atual_codigo', 'figura_atual', 'direcao', 'direcao_por_extenso', 'figura_seguinte_codigo', 'figura_seguinte'}, {}),
    ('arvore_2_passos', 'Árvore (2 passos)', 'A árvore de dois passos: dada a figura atual e a direção da última nota, os pares de figuras seguintes mais prováveis (até 10 por contexto visto 30 ou mais vezes), e a probabilidade que uma cadeia de 1.ª ordem daria ao mesmo par (sem memória da figura atual no segundo passo).', {
        'ordem': '1 = o par mais provável depois deste contexto.',
        'passo1_codigo': 'Primeira figura seguinte (código).',
        'passo1': 'Primeira figura seguinte.',
        'P_passo1': 'P(passo 1 | contexto), sobre todos os pares vistos.',
        'passo2_codigo': 'Segunda figura seguinte (código).',
        'passo2': 'Segunda figura seguinte.',
        'P_passo2_dado_passo1': 'P(passo 2 | contexto, passo 1).',
        'ocorrencias_do_par': 'Quantas vezes o contexto foi seguido por este par.',
        'P_par_arvore': 'P(par | contexto) = ocorrências do par / ocorrências do contexto (fórmula) = P_passo1 x P_passo2_dado_passo1.',
        'P_par_cadeia_1a_ordem': 'P(passo 1 | figura atual, tempo) x P(passo 2 | passo 1, tempo seguinte): o que uma cadeia de 1.ª ordem prevê.',
        'razao_arvore_sobre_cadeia': 'P_par_arvore / P_par_cadeia_1a_ordem (fórmula): longe de 1 = a memória de dois passos muda a previsão.',
    }, {
        'P_par_arvore': '=IFERROR({ocorrencias_do_par}{r}/{ocorrencias_do_contexto}{r},"")',
        'razao_arvore_sobre_cadeia': '=IFERROR({P_par_arvore}{r}/{P_par_cadeia_1a_ordem}{r},"")',
    }, {'compasso', 'figura_atual_codigo', 'figura_atual', 'direcao', 'direcao_por_extenso', 'passo1_codigo', 'passo1', 'passo2_codigo', 'passo2'}, {}),
    ('entradas', 'Entradas', 'O intervalo de entrada num tempo (da última nota antes do tempo à primeira nota do tempo, em graus da escala), dado o grau da última nota e a direção do intervalo anterior. Contextos vistos 20 ou mais vezes.', {
        'tempo': 'Tempo do compasso (1 = forte).',
        'grau_da_ultima_nota': 'Grau da escala da última nota antes do tempo (1 = tónica, 5 = dominante).',
        'direcao_anterior': 'Direção do intervalo anterior: sg sobe por grau (1-2 meios-tons), ss sobe por salto (3 ou mais), dg/ds desce, r repete.',
        'direcao_anterior_por_extenso': 'A direção por extenso.',
        'intervalo_de_entrada_graus': 'Intervalo de entrada em graus da escala (+1 = um grau acima, 0 = repete).',
        'intervalo_por_extenso': 'O intervalo por extenso.',
        'P_intervalo_dado_contexto': 'P(intervalo | grau, direção anterior, tempo) = ocorrências / ocorrências do contexto (fórmula).',
    }, {
        'P_intervalo_dado_contexto': '=IFERROR({ocorrencias}{r}/{ocorrencias_do_contexto}{r},"")',
    }, {'compasso', 'grau_da_ultima_nota', 'direcao_anterior', 'direcao_anterior_por_extenso', 'intervalo_por_extenso'}, {}),
    ('contornos', 'Contornos', 'O contorno dentro do tempo (graus entre as notas que começam no tempo), dada a figura e a direção com que se entrou no tempo.', {
        'direcao_de_entrada': 'Direção do intervalo de entrada no tempo (sg, ss, dg, ds, r).',
        'direcao_de_entrada_por_extenso': 'A direção por extenso.',
        'contorno_codigo': 'Contorno: s1 = sobe um grau, d2 = desce dois graus, r = repete; um passo por cada nota depois da primeira.',
        'contorno': 'O contorno por extenso.',
        'ocorrencias_da_figura': 'Quantas vezes a figura apareceu com essa direção de entrada.',
        'P_contorno_dado_figura_e_entrada': 'P(contorno | figura, direção de entrada) = ocorrências / ocorrências da figura (fórmula).',
    }, {
        'P_contorno_dado_figura_e_entrada': '=IFERROR({ocorrencias}{r}/{ocorrencias_da_figura}{r},"")',
    }, {'compasso', 'figura_codigo', 'figura', 'direcao_de_entrada', 'direcao_de_entrada_por_extenso', 'contorno_codigo', 'contorno'}, {}),
    ('associacoes', 'Associações', 'Regras de associação entre figuras da mesma melodia: «se a melodia tem A, tem B com probabilidade P». Lift = quantas vezes mais do que numa melodia qualquer (1 = independentes).', {
        'figura_A_codigo': 'Figura A (código).', 'figura_A': 'Figura A.',
        'figura_B_codigo': 'Figura B (código).', 'figura_B': 'Figura B.',
        'melodias_com_A': 'Melodias do compasso que têm A.', 'melodias_com_B': 'Melodias que têm B.',
        'melodias_com_ambas': 'Melodias que têm A e B.', 'melodias': 'Melodias do compasso.',
        'P_B_dado_A': 'P(B | A) = melodias com ambas / melodias com A (fórmula).',
        'lift': 'P(B | A) / P(B) (fórmula).',
    }, {
        'P_B_dado_A': '=IFERROR({melodias_com_ambas}{r}/{melodias_com_A}{r},"")',
        'lift': '=IFERROR({P_B_dado_A}{r}/({melodias_com_B}{r}/{melodias}{r}),"")',
    }, {'compasso', 'figura_A_codigo', 'figura_A', 'figura_B_codigo', 'figura_B'}, {}),
    ('modelos', 'Modelos', 'Comparação dos modelos por validação cruzada (5 dobras por melodia): bits por evento nas melodias deixadas de fora (menos é melhor). Os bits são valores calculados por tools/build_meters.mjs.', {
        'o_que_se_preve': 'O que o modelo prevê: a figura seguinte, o intervalo de entrada ou o contorno dentro do tempo.',
        'modelo': 'Nome curto: R = ritmo com n figuras anteriores, E = entrada, C = contorno; +dir3 = com a direção sobe/desce/repete, +dir5 = com grau/salto.',
        'contexto': 'O que o modelo usa para prever.',
        'cadeia_de_contextos': 'Os contextos, do mais específico para o mais geral: cada um é misturado com o seguinte (suavização interpolada).',
        'beta': 'Pseudo-contagem da suavização, a melhor das experimentadas (0 = Witten-Bell puro).',
        'bits_por_evento': 'Média de -log2 P do que aconteceu, nas melodias deixadas de fora.',
        'desvio_entre_dobras': 'Desvio-padrão da média entre as 5 dobras.',
        'perplexidade': '2 elevado aos bits (fórmula): de quantas escolhas igualmente prováveis o modelo hesita, em média.',
        'modelo_de_referencia': 'O modelo com que se compara (R1, E1 ou C0).',
        'diferenca_para_referencia': 'bits deste modelo - bits do de referência (fórmula); negativo = melhor.',
        'eventos_avaliados': 'Eventos previstos nas 5 dobras.',
        'melhor_na_validacao': 'sim = o modelo mais simples a menos de 0,01 bits do melhor, nesse compasso.',
        'usado_na_app': 'sim = o modelo que a app usa (no ritmo, no máximo 4 figuras anteriores, para as tabelas caberem na página).',
    }, {
        'perplexidade': '=2^{bits_por_evento}{r}',
        'diferenca_para_referencia': '=IFERROR({bits_por_evento}{r}-SUMIFS({bits_por_evento}:{bits_por_evento},{compasso}:{compasso},{compasso}{r},{o_que_se_preve}:{o_que_se_preve},{o_que_se_preve}{r},{modelo}:{modelo},{modelo_de_referencia}{r}),"")',
    }, {'compasso', 'o_que_se_preve', 'modelo', 'contexto', 'cadeia_de_contextos', 'modelo_de_referencia', 'melhor_na_validacao', 'usado_na_app'}, {}),
    ('segmentacao', 'Segmentação', 'Vale a pena separar os compassos? Bits por compasso do ritmo real, lido como antes (todos os tempos com 4 semicolcheias, compassos do mesmo comprimento juntos) e lido compasso a compasso.', {
        'bits_por_compasso_sem_segmentar_1a_ordem': 'Como o programa lia antes: tempos de 4 semicolcheias, 3/4 e 6/8 juntos, 1.ª ordem.',
        'bits_por_compasso_sem_segmentar_2a_ordem': 'O mesmo com duas figuras anteriores.',
        'bits_por_compasso_por_compasso_1a_ordem': 'Cada compasso com o seu tempo (4 ou 6 semicolcheias), 1.ª ordem.',
        'bits_por_compasso_por_compasso_2a_ordem': 'Cada compasso, duas figuras anteriores.',
        'bits_por_compasso_modelo_escolhido': 'Cada compasso com o melhor modelo do estudo.',
        'vezes_so_por_segmentar': '2 elevado a (sem segmentar, 2.ª ordem - por compasso, 2.ª ordem) (fórmula): quantas vezes mais provável fica o ritmo real de um compasso só por separar os compassos, com o mesmo modelo.',
        'vezes_segmentar_e_modelo_escolhido': '2 elevado a (como antes - modelo escolhido) (fórmula): o ganho de separar os compassos e usar o melhor modelo.',
    }, {
        'vezes_so_por_segmentar': '=2^({bits_por_compasso_sem_segmentar_2a_ordem}{r}-{bits_por_compasso_por_compasso_2a_ordem}{r})',
        'vezes_segmentar_e_modelo_escolhido': '=2^({bits_por_compasso_sem_segmentar_1a_ordem}{r}-{bits_por_compasso_modelo_escolhido}{r})',
    }, {'compasso'}, {}),
    ('modelo_da_app', 'Modelo da app', 'O que a app usa em cada compasso (src/data/blocks-data.js) e quanto prevê, em validação cruzada, com as tabelas tal como vão para o navegador.', {
        'ritmo': 'Modelo do ritmo (folha Modelos).', 'beta_ritmo': 'Suavização do ritmo.',
        'melodia_entrada': 'Modelo do intervalo de entrada.', 'beta_entrada': 'Suavização da entrada.',
        'melodia_contorno': 'Modelo do contorno.', 'beta_contorno': 'Suavização do contorno.',
        'bits_ritmo_por_tempo': 'Bits por tempo do ritmo.', 'bits_entrada': 'Bits por intervalo de entrada.',
        'bits_contorno': 'Bits por contorno.',
        'logp_P10': 'Log-probabilidade média por tempo de uma melodia real (P10): abaixo disto a regra «idioma» penaliza.',
        'logp_P50': 'Idem, mediana: a regra «idioma» não recompensa acima disto.',
        'tamanho_KB': 'Tamanho das tabelas desse compasso na app.',
    }, {}, {'compasso', 'ritmo', 'melodia_entrada', 'melodia_contorno'}, {}),
]

PCT_COLS = re.compile(r'^(fracao|P_|efeito)')
BITS_COLS = re.compile(r'^(bits|desvio|diferenca|logp)')
RATIO_COLS = re.compile(r'^(lift|razao|perplexidade|vezes)')


def read_csv(name):
    with open(os.path.join(DIR, f'{name}.csv'), encoding='utf-8-sig', newline='') as fh:
        rows = list(csv.reader(fh))
    return rows[0], rows[1:]


def as_value(v, text):
    if text or v == '':
        return v
    try:
        return int(v)
    except ValueError:
        try:
            return float(v)
        except ValueError:
            return v


def number_format(col):
    if PCT_COLS.match(col):
        return '0.0%'
    if BITS_COLS.match(col):
        return '0.000'
    if RATIO_COLS.match(col):
        return '0.00'
    return None


def style_header(ws, header, docs):
    for j, col in enumerate(header, start=1):
        c = ws.cell(row=1, column=j, value=col)
        c.font = BOLD
        c.fill = HEAD_FILL
        c.alignment = Alignment(wrap_text=True, vertical='center')
        c.border = Border(bottom=THIN)
        text = docs.get(col) or COMMON.get(col)
        if text:
            c.comment = Comment(text, 'build_meters')
            c.comment.width = 320
            c.comment.height = 110
    ws.freeze_panes = 'A2'
    ws.row_dimensions[1].height = 42


def literature_formulas(header):
    """Fractions and ranks of each meter looked up in the Figuras sheet."""
    out = {}
    for col in header:
        m = re.match(r'^(fracao|ranking)_(\d+/\d+)$', col)
        if not m:
            continue
        kind, meter = m.groups()
        target = 'I' if kind == 'fracao' else 'C'  # Figuras: I = fracao_dos_tempos, C = posicao_no_ranking
        out[col] = f'=SUMIFS(Figuras!${target}:${target},Figuras!$A:$A,"{meter}",Figuras!$D:$D,{{figura_codigo}}{{r}})'
    return out


def add_table(wb, name, title, description, docs, formulas, text_cols):
    header, rows = read_csv(name)
    if formulas == 'literatura':
        formulas = literature_formulas(header)
    ws = wb.create_sheet(title)
    style_header(ws, header, docs)
    letters = {col: get_column_letter(j + 1) for j, col in enumerate(header)}
    widths = [len(col) for col in header]
    for i, row in enumerate(rows, start=2):
        for j, col in enumerate(header):
            if col in formulas:
                v = formulas[col].format(r=i, **letters)
            else:
                v = as_value(row[j], col in text_cols)
            c = ws.cell(row=i, column=j + 1, value=v)
            c.font = FONT
            if col in formulas:
                c.fill = FORMULA_FILL
            fmt = number_format(col)
            if fmt:
                c.number_format = fmt
            widths[j] = max(widths[j], min(48, len(str(row[j])) if j < len(row) else 0))
    for j, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(j)].width = min(50, max(9, w * 0.9 + 2))
    ws.auto_filter.ref = f'A1:{get_column_letter(len(header))}{max(2, len(rows) + 1)}'
    return header, len(rows)


def add_summary(wb):
    """Melodies and beats per meter, as formulas over the Corpus sheet."""
    ws = wb.create_sheet('Resumo', 1)
    header = ['compasso', 'familia', 'melodias', 'tempos', 'fracao_das_melodias']
    docs = {'melodias': 'Melodias desse compasso (fórmula sobre a folha Corpus).', 'tempos': 'Tempos analisados (fórmula sobre a folha Corpus).', 'fracao_das_melodias': 'melodias / total (fórmula).'}
    style_header(ws, header, docs)
    meters = [('2/4', 'simples'), ('3/4', 'simples'), ('4/4', 'simples'), ('3/8', 'composto'), ('6/8', 'composto'), ('9/8', 'composto'), ('12/8', 'composto')]
    for i, (m, fam) in enumerate(meters, start=2):
        ws.cell(row=i, column=1, value=m)
        ws.cell(row=i, column=2, value=fam)
        ws.cell(row=i, column=3, value=f'=COUNTIFS(Corpus!$E:$E,A{i})')
        ws.cell(row=i, column=4, value=f'=SUMIFS(Corpus!$I:$I,Corpus!$E:$E,A{i})')
        ws.cell(row=i, column=5, value=f'=IFERROR(C{i}/SUM($C$2:$C${len(meters) + 1}),"")')
    last = len(meters) + 2
    ws.cell(row=last, column=1, value='total')
    ws.cell(row=last, column=3, value=f'=SUM(C2:C{last - 1})')
    ws.cell(row=last, column=4, value=f'=SUM(D2:D{last - 1})')
    for row in ws.iter_rows(min_row=2, max_row=last):
        for c in row:
            c.font = BOLD if c.row == last else FONT
            if c.column >= 3 and c.row < last and c.column < 5:
                c.fill = FORMULA_FILL
            if c.column == 5:
                c.number_format = '0.0%'
    for col, w in zip('ABCDE', (10, 11, 11, 11, 12)):
        ws.column_dimensions[col].width = w


def add_readme(wb, info):
    ws = wb.active
    ws.title = 'Leia-me'
    lines = [
        ('Figuras rítmicas e blocos melódicos por compasso', TITLE),
        ('O que o algoritmo genético aprende da música real, tabela a tabela, para poder ser auditado e melhorado.', FONT),
        ('', FONT),
        ('Como se gera', H2),
        ('1. python3 tools/extract_meter_corpus.py  — melodias reais do corpus do music21 com o seu compasso → data/corpus-meters.json', FONT),
        ('2. node tools/build_meters.mjs  — análise, validação cruzada e modelo da app → results/meters/*.csv, results/meters.md, src/data/blocks-data.js', FONT),
        ('3. python3 tools/export_xlsx.py  — este livro e results/meters/README.md', FONT),
        ('Tudo é determinístico: correr outra vez dá os mesmos números. Para mudar uma decisão (compassos, suavização, modelos candidatos), altere tools/build_meters.mjs e volte a correr 2 e 3.', FONT),
        ('', FONT),
        ('Como ler', H2),
        ('Figura rítmica de um tempo: uma letra por semicolcheia — x começa uma nota, _ a nota continua, . silêncio. Simples: 4 semicolcheias por tempo (x_x_ = ♪ ♪). Compostos: 6 (x_x_x_ = ♪ ♪ ♪, x___x_ = ♩ ♪).', FONT),
        ('Direção: s sobe, d desce, r repete; com g por grau (1-2 meios-tons) ou s por salto (3 ou mais): sg, ss, dg, ds. 0 = ainda não há intervalo.', FONT),
        ('Contorno dentro do tempo: s1 sobe um grau da escala, d2 desce dois, r repete.', FONT),
        ('Sílabas de Takadimi (Hoffman, Pelto & White 1996): simples ta ka di mi, composto ta va ki di da ma, uma por posição no tempo.', FONT),
        ('Células a azul-claro são fórmulas (probabilidades = ocorrências / ocorrências do contexto; frações = contagem / total do compasso). As restantes são contagens do corpus ou valores calculados pelo script (os bits da validação cruzada). Cada cabeçalho tem um comentário que explica a coluna.', FONT),
        ('Bits por evento: -log2 da probabilidade que o modelo deu ao que aconteceu numa melodia que não viu. 1 bit a menos = o que aconteceu era, em média, duas vezes mais provável para o modelo.', FONT),
        ('', FONT),
        ('Folhas', H2),
    ]
    for title, desc, n in info:
        lines.append((f'{title} ({n} linhas) — {desc}', FONT))
    lines += [
        ('', FONT),
        ('Fontes', H2),
        ('Corpus: music21 (Cuthbert & Ariza 2010) — Essen Folksong Collection (Schaffrath 1995), O\'Neill\'s Music of Ireland (1850), Ryan\'s Mammoth Collection (1883), Aird\'s Airs, corais de J. S. Bach.', FONT),
        ('Modelos de contexto de ordem variável e suavização: Cleary & Witten (1984), PPM; Pearce & Wiggins (2004), JNMR 33(4); Pearce (2005), IDyOM; Begleiter, El-Yaniv & Yona (2004), JAIR 22.', FONT),
        ('Pontos de vista múltiplos (ritmo e melodia em modelos ligados): Conklin & Witten (1995), JNMR 24(1). Modelos de ritmo avaliados por entropia cruzada: Temperley (2010), Music Perception 27(5).', FONT),
        ('Figuras de manual e sílabas: Hoffman, Pelto & White (1996), Takadimi, Journal of Music Theory Pedagogy 10; Open Music Theory (compassos simples e compostos).', FONT),
    ]
    for i, (text, font) in enumerate(lines, start=1):
        c = ws.cell(row=i, column=1, value=text)
        c.font = font
        c.alignment = Alignment(wrap_text=True, vertical='top')
    ws.column_dimensions['A'].width = 140


def write_readme_md(info):
    md = ['# Análise por compasso: tabelas', '',
          'Geradas por `node tools/build_meters.mjs` (CSV) e `python3 tools/export_xlsx.py` (este ficheiro e `analise-compassos.xlsx`, com as mesmas tabelas, fórmulas nas colunas derivadas e um comentário em cada cabeçalho). O relatório está em `../meters.md`.', '',
          'Os CSV estão em UTF-8 (com BOM, para o Excel), separados por vírgulas, com ponto decimal. Os códigos não começam por `+`, `-` nem `=`, para que o Excel não os leia como fórmulas: figura `x_x_` (x começa uma nota, _ continua, . silêncio), direção `sg`/`ss`/`dg`/`ds`/`r` (sobe/desce por grau/salto, repete), contorno `s1d1` (sobe um grau, desce um).', '']
    for (name, title, desc, docs, formulas, text_cols, _), (_, _, n) in zip(SHEETS, info):
        header, _ = read_csv(name)
        md += [f'## `{name}.csv` — {title} ({n} linhas)', '', desc, '', '| Coluna | Significado |', '|---|---|']
        for col in header:
            text = docs.get(col) or COMMON.get(col) or ''
            md.append(f'| `{col}` | {text} |')
        md.append('')
    with open(os.path.join(DIR, 'README.md'), 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(md))


def main():
    wb = Workbook()
    info = []
    for name, title, desc, docs, formulas, text_cols, _ in SHEETS:
        header, n = add_table(wb, name, title, desc, docs, formulas, text_cols)
        info.append((title, desc, n))
    add_summary(wb)
    add_readme(wb, info)
    wb.save(OUT)
    write_readme_md(info)
    print('wrote', OUT, 'and README.md;', ', '.join(f'{t}: {n}' for t, _, n in info))


if __name__ == '__main__':
    main()
