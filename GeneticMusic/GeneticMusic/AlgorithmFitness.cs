using GeneticSharp.Domain.Chromosomes;
using GeneticSharp.Domain.Fitnesses;
using System;
using System.Threading.Tasks;
using System.Diagnostics;

namespace GeneticMusic
{

    class AlgorithmFitness : IFitness
    {
        // Variáveis gerais de controlo
        int currentIteration = 0;       // Iteração actual - tem de ser revisto pois entra em consideração com o comprimento do cromosoma
        double achievedRanking = 0;     // Ranking máximo atingido até ao momento por cada cromosoma;
        static int lenghtSequence;
        static byte smallestTimeUnitUsed;
        static byte gene_A4;
        static byte gene_pause;
        static byte gene_prolongation;
        static byte gene_higherNote;
        static bool scaleInMajorMode;
        static long limitSeconds;
        static byte chromosome_scale;

        public int percentTask = 0;
        public bool inicialized = false;


        // Pesos e distribuições no algorítmo

        float firstFitnesSectionTime = 0.4f;

        float wG1InterestingPatterns1 = 2.9f;
        float wG1SelfHarm1 = 3f;
        float wG1SelfHarm2 = 3f;
        float weG1ABA = 10f ;
        float wG1RitmicLeitmotif = 10;
        float wG1AttWave1 = 10;
        float wG1AttWave2 = 5;
        float wG1Range = 4;
        float wG1Scale = 10;
        float wG1PauseProlongation = 10.51f;
        float wG1ReduceRepetitions = 2;
        float wG1Intervals = 3;
        float wG1NiceRepetitions = 2;
        float wG1ScoreEnding = 2;

        float wG2InterestingPatterns1 = 4.02f;
        float wG2SelfHarm1 = 3f;
        float wG2SelfHarm2 = 3f;
        float weG2ABA = 20f;
        float wG2RitmicLeitmotif = 10;
        float wG2AttWave1 = 30.1f;
        float wG2AttWave2 = 2;
        float wG2Range = 20;
        float wG2Scale = 10;
        float wG2PauseProlongation = 10.02f;
        float wG2ReduceRepetitions = 3;
        float wG2Intervals = 3;
        float wG2NiceRepetitions = 1.05f;
        float wG2ScoreEnding = 2;

        // Variáveis controlo Ondas de Atracção
        private int w1ThresholdAttractor = 3;
        private int w2ThresholdAttractor = 2;
        private float w1OscillationsPerMeasure = 0.5f;
        private float w2OscillationsPerMeasure = 2;
        private int w1Amplitude = 12;
        private int w2Amplitude = 5;
        private int w1MeanValue = 37;
        private int w2MeanValue = 37 - 7;
        private int w1HorizontalShift = 0;
        private int w2HorizontalShift = 0;

        public AlgorithmFitness()
        {

        }

        public AlgorithmFitness(ConfigurationValues confValues)
        {
            lenghtSequence = confValues.GetLenghtSequence();
            smallestTimeUnitUsed = confValues.GetSmallestTimeUnitUsed();
            gene_A4 = confValues.GetGene_A4();
            gene_pause = confValues.GetGene_pause();
            gene_prolongation = confValues.GetGene_prolongation();
            gene_higherNote = confValues.GetGene_higherNot();
            scaleInMajorMode = confValues.GetscaleInMajorMode();
            limitSeconds = confValues.GetLimitSeconds();
            chromosome_scale = confValues.GetChromosome_scale();
            firstFitnesSectionTime = confValues.GetPercentGroupTime() / 100f;
            inicialized = true;

            wG1InterestingPatterns1 = confValues.GetWG1InterestingPatterns1();
            wG1SelfHarm1 = confValues.GetWG1SelfHarm1();
            wG1SelfHarm2 = confValues.GetWG1SelfHarm2();
            weG1ABA = confValues.GetWeG1ABA();
            wG1RitmicLeitmotif = confValues.GetWG1RitmicLeitmotif();
            wG1AttWave1 = confValues.GetWG1AttWave1();
            wG1AttWave2 = confValues.GetWG1AttWave2();
            wG1Range = confValues.GetWG1Range();
            wG1Scale = confValues.GetWG1Scale();
            wG1PauseProlongation = confValues.GetWG1PauseProlongation();
            wG1ReduceRepetitions = confValues.GetWG1ReduceRepetitions();
            wG1Intervals = confValues.GetWG1Intervals();
            wG1NiceRepetitions = confValues.GetWG1NiceRepetitions();
            wG1ScoreEnding = confValues.GetWG1ScoreEnding();

            wG2InterestingPatterns1 = confValues.GetWG2InterestingPatterns1();
            wG2SelfHarm1 = confValues.GetWG2SelfHarm1();
            wG2SelfHarm2 = confValues.GetWG2SelfHarm2();
            weG2ABA = confValues.GetWeG2ABA();
            wG2RitmicLeitmotif = confValues.GetWG2RitmicLeitmotif();
            wG2AttWave1 = confValues.GetWG2AttWave1();
            wG2AttWave2 = confValues.GetWG2AttWave2();
            wG2Range = confValues.GetWG2Range();
            wG2Scale = confValues.GetWG2Scale();
            wG2PauseProlongation = confValues.GetWG2PauseProlongation();
            wG2ReduceRepetitions = confValues.GetWG2ReduceRepetitions();
            wG2Intervals = confValues.GetWG2Intervals();
            wG2NiceRepetitions = confValues.GetWG2NiceRepetitions();
            wG2ScoreEnding = confValues.GetWG2ScoreEnding();

            w1ThresholdAttractor = confValues.GetW1ThresholdAttractor();
            w2ThresholdAttractor = confValues.GetW2ThresholdAttractor();
            w1OscillationsPerMeasure = confValues.GetW1OscillationsPerMeasure();
            w2OscillationsPerMeasure = confValues.GetW2OscillationsPerMeasure();
            w1Amplitude = confValues.GetW1Amplitude();
            w2Amplitude = confValues.GetW2Amplitude();
            w1MeanValue = confValues.GetW1MeanValue();
            w2MeanValue = confValues.GetW2MeanValue();
            w1HorizontalShift = confValues.GetW1HorizontalShift();
            w2HorizontalShift = confValues.GetW2HorizontalShift();
        }

               
        //Estimativas de tempo de convergência
        Stopwatch timr = Stopwatch.StartNew();
        long currentTime = 0;

        int[] onda1 = new int[lenghtSequence];
        int[] onda2 = new int[lenghtSequence];


        int[] NoteAtractionFunction(float oscilationsPerMeasure, int amplitud, int meanValue)
        {
            // Actualmente estamos com compasso 4 por 4, ou seja, 4 tempos completos
            // um compasso completo neste caso é uma semibreve

            var notasPorCompasso = MidiFile.SEMIBREVE / smallestTimeUnitUsed;
            var periodoOnda1 = notasPorCompasso / oscilationsPerMeasure;
            int amplitudeNotas = amplitud;
            int[] tempWave = new int[lenghtSequence];

            for (int i = 0; i < onda1.Length; i++)
            {
                tempWave[i] = (int)(meanValue + amplitudeNotas * Math.Sin(2 * Math.PI * i / periodoOnda1));
            }
            return tempWave;
        }

        int[] NoteAtractionFunction(float oscilationsPerMeasure, int amplitud, int meanValue, int notesHorizontalShift)
        {
            // Actualmente estamos com compasso 4 por 4, ou seja, 4 tempos completos
            // um compasso completo neste caso é uma semibreve

            var notasPorCompasso = MidiFile.SEMIBREVE / smallestTimeUnitUsed;
            var periodoOnda1 = notasPorCompasso / oscilationsPerMeasure;
            int amplitudeNotas = amplitud;

            // Se notesForwardShift = 16 <=> 2*PI

            var shift = 2 * Math.PI * notesHorizontalShift/ notasPorCompasso;

            int[] tempWave = new int[lenghtSequence];

            for (int i = 0; i < onda1.Length; i++)
            {
                tempWave[i] = (int)(meanValue + amplitudeNotas * Math.Sin(2 * Math.PI * i / periodoOnda1 + shift));
            }
            return tempWave;
        }




        // Avaliação Genérica de intervalos
        float EvaluateInterestingIntervalsCore(int intervalToBack1, int intervalToBack2, bool ScaleModeMajor, bool HarmonicModeNotSequential)//, byte scaleNr, bool[,] scaleGrid, byte defaultA4)
        {
            // ToDo: Intervalos diferentes em função de estar em modo menor ou Maior
            // Não esquecer que estamos a contrar os intervalos para trás
            float result = 0;
            //  int temporaryNote;

            //  int shiftInC = (defaultA4 - 9) % 12;
            //  temporaryNote = (int)(seq[i] - shiftInC) % 12;


            if (ScaleModeMajor)
            {
                if (intervalToBack1 > -100)
                {
                    if (intervalToBack1 == +3 || intervalToBack1 == -4) // Modo Maior
                    {
                        result += 3;
                    }
                }
                if (intervalToBack1 > -100 && intervalToBack2 > -100)
                {
                    if (intervalToBack1 == +3 && intervalToBack2 == +7 || intervalToBack1 == -4 && intervalToBack2 == -7) // Modo Maior
                    {
                        result += 5;
                    }
                }

            }
            if (!ScaleModeMajor)
            {
                if (intervalToBack1 > -100)
                {
                    if (intervalToBack1 == -3 || intervalToBack1 == +4) // Modo Maior
                    {
                        result += 3;
                    }
                }
                if (intervalToBack1 > -100 && intervalToBack2 > -100)
                {
                    if (intervalToBack1 == +4 && intervalToBack2 == +7 || intervalToBack1 == -3 && intervalToBack2 == -7) // Modo Maior
                    {
                        result += 5;
                    }
                }
            }

            int absInterval = Math.Abs(intervalToBack1);

            if (absInterval == 0)
            {
                result -= 4.5f;
            }

            if (absInterval == 1)
            {
                result -= 1;
            }

            if (absInterval == 2)
            {
                if (HarmonicModeNotSequential) { result -= 0.5f; }
                else { result = 2f; }
            }

            if (absInterval == 5)
            {
                if (HarmonicModeNotSequential) { result += 2f; }
                else { result += 1; }
            }

            if (absInterval == 6)
            {
                result -= 0.3f;
            }

            if (absInterval == 7)
            {
                if (HarmonicModeNotSequential) { result += 1.5f; }
                else { result += 0.5f; }
            }

            if (absInterval == 8)
            {
                result -= 0.5f;
            }

            if (absInterval == 9)
            {
                result -= 0.5f;
            }

            if (absInterval == 10)
            {
                if (HarmonicModeNotSequential) { result += 1f; }
                else { result -= 1; }
            }

            if (absInterval == 11)
            {
                result -= 0.5f;
            }

            if (absInterval == 12)
            {
                result += 1;
            }

            if (absInterval > 12)
            {
                result -= 1f;
            }


            return result;
        }

        // Classificação: Notas dentro do range desejado
        float EvaluateRange(double[] seq, int attractorRange, int itMax)
        {
            int atractorNote = attractorRange;

            if (currentIteration < itMax)
            {
                atractorNote = atractorNote + 10 - 10 * (currentIteration / (itMax));
            }

            float result = 0;
            Parallel.For(0, seq.Length, i =>

            {
                if (seq[i] < (gene_A4 + atractorNote) && seq[i] > (gene_A4 - atractorNote) && (int)seq[i] != gene_pause && (int)seq[i] != gene_prolongation)
                {
                    result += 2;
                }
                else if ((seq[i] < (gene_A4 - 2 * atractorNote) || seq[i] > (gene_A4 + 2 * atractorNote)) && (int)seq[i] != gene_pause && (int)seq[i] != gene_prolongation)
                {
                    result -= 2;
                    if (seq[i] < 2) { result -= 15; } // Garantir que as notas iniciais estão dentro da escala
                }
                else if ((seq[i] < (gene_A4 - 3 * atractorNote) || seq[i] > (gene_A4 + 3 * atractorNote)) && (int)seq[i] != gene_pause && (int)seq[i] != gene_prolongation)
                {
                    result -= 8;
                    if (seq[i] < 2) { result -= 15; } // Garantir que as notas iniciais estão dentro da escala
                }
                else if (seq[i] == gene_pause || seq[i] == gene_prolongation)
                {
                    result += 1;
                }

                else
                {
                    result -= 1;
                    if (seq[i] < 2) { result -= 5; }
                }

            }


            );




            /* Paralel.for(int i = 0; i< seq.Length; i++)
             {
                 if(seq[i] < gene_A4 + 2 && seq[i] > gene_A4 - 2)
                 {
                     result += 1;
                 }
                 else
                 {
                     result -= 1;
                 }

             }     */
            return result;
        }

        // Classificação: Notas dentro da escala seleccionada

        float EvaluateScale(double[] seq, byte scaleNr, bool[,] scaleGrid, byte defaultA4)
        {
            float result = 0;
            int temporaryNote;
            int shiftInC = (defaultA4 - 9) % 12;
            // Classify Notes

            Parallel.For(0, seq.Length, i =>

            {
                if (seq[i] > shiftInC && seq[i] <= gene_higherNote && (int)seq[i] != gene_pause && (int)seq[i] != gene_prolongation)
                {
                    temporaryNote = (int)(seq[i] - shiftInC) % 12;
                    if (scaleGrid[scaleNr, temporaryNote]) // Caso esta nota calhe dentro da escala
                    {
                        result += 1;
                    }
                    else
                    {
                        result -= 1.5f;
                    }
                }
                else
                {

                }

            });

            return result;
        }

        // Classificação: Pausas e prolongamentos de notas -> classificação meretória
        float EvaluatePauseAndProlongation(double[] seq)
        {
            float result = 0;
            float limit = 40;

            Parallel.For(0, seq.Length, i =>

            {

                if (i > 2 && (int)seq[i] == gene_pause && (int)seq[i - 1] != gene_pause)
                {
                    result += 4;
                }
                else if (i > 3 && (int)seq[i] == gene_prolongation && (int)seq[i - 1] == gene_pause)// && (int)seq[i - 2] != gene_pause)    // prolongamento de uma pausa
                {
                    result += 6.5f;
                }
                else if (i > 2 && (int)seq[i] == gene_prolongation && (int)seq[i - 1] != gene_pause)    // prolongamento de uma nota
                {
                    result += 2f;
                }
                else if (i > 2 && (int)seq[i] == gene_prolongation && (int)seq[i - 1] == gene_prolongation) // prolongamento de prolongamento
                {
                    result += 0.5f;
                }
                else
                {
                    result -= 1;
                }

            });
            if (seq[0] == gene_prolongation) { result -= 10; }
            if (result > limit) { result = limit; }

            return result;
        }

        // Classificação: Repetições exageradas das mesmas notas
        float EvaluateExcessiveRepetitions(double[] seq)
        {
            float result = 0;

            Parallel.For(0, seq.Length, i =>

            {

                //  if (i > 4 && ((int)seq[i] != gene_pause || (int)seq[i] == gene_prolongation))
                if (i > 4 && (int)seq[i] != gene_pause && (int)seq[i] != gene_prolongation)
                {

                    if ((seq[i] == seq[i - 1]) && (seq[i] != seq[i - 2]))
                    {
                        result -= 1.8f;
                    }

                    if ((seq[i] == seq[i - 1]) && (seq[i] == seq[i - 2]) && (seq[i] != seq[i - 3]))
                    {
                        result -= 3;
                    }
                    if ((seq[i] == seq[i - 1]) && (seq[i] == seq[i - 2]) && (seq[i] == seq[i - 3]))
                    {
                        result -= 6;
                    }
                    if (((int)seq[i - 1] == gene_prolongation) && (seq[i] == seq[i - 2]) && (seq[i] == seq[i - 3]))     // No caso te termos repetições depois de notas prolongadas
                    {
                        result -= 6;
                    }

                }

            });

            return result;
        }

        // Classificação: Cadencias de repetições interessantes
        float EvaluateInterestingRepetitions(double[] seq)
        {
            float result = 0;

            Parallel.For(0, seq.Length, i =>

            {
                if (i > 4 && ((int)seq[i] != gene_pause || (int)seq[i] == gene_prolongation))
                {
                    if ((seq[i] != seq[i - 3] && seq[i] == seq[i - 2]) && (seq[i] != seq[i - 1]))
                    {
                        result += 2;
                    }

                    if ((seq[i] != seq[i - 1]) && (seq[i] != seq[i - 2]) && (seq[i] == seq[i - 3]))
                    {
                        result += 1f;
                    }


                }

            });

            return result;
        }


        // Classificação: Intervalos entre notas válidos e aprazíveis
        float EvaluateIntervals(double[] seq)
        {
            float result = 0;

            Parallel.For(3, seq.Length, i =>
            {
                if (i > 4 && ((int)seq[i] != gene_pause && (int)seq[i] != gene_prolongation))   // Alterado para && e != em 2020-08-21, 21h30. erificar poquê prolongation a true (al
                {
                    int interval1 = (int)(seq[i] - seq[i - 1]);
                    int interval2 = (int)(seq[i] - seq[i - 2]);

                    // int interval1 = (int)Math.Abs(seq[i - 2] - seq[i - 1]);
                    // int interval2 = (int)Math.Abs(seq[i - 2] - seq[i]);

                    if ((int)seq[i - 1] == gene_pause || (int)seq[i - 1] == gene_prolongation) { interval1 = -100; }  //Evitar avaliar intervalos que não contêm notas
                    if ((int)seq[i - 2] == gene_pause || (int)seq[i - 2] == gene_prolongation) { interval2 = -100; }  //Evitar avaliar intervalos que não contêm notas

                    result += EvaluateInterestingIntervalsCore(interval1, interval2, scaleInMajorMode, false);
                }
            });

            return result;
        }

        // Classificação: notas convergem para limites de atracção de ondas de oscilação referência (classificação máxima na proximidade do intervalo)
        float AttractorWave(double[] seq, int attractorTreshHold, int[] wave, int itMax)
        {
            float result = 0;

            //  if (currentIteration < itMax) { attractorThreshold = 50 - (int)(45 * currentIteration / itMax); }

            Parallel.For(0, seq.Length, i =>
            {
                if ((int)seq[i] != gene_pause && (int)seq[i] != gene_prolongation)
                {
                    if (Math.Abs(seq[i] - wave[i]) <= 0.5 * attractorTreshHold)
                    {
                        result += 2f;
                    }
                    if (Math.Abs(seq[i] - wave[i]) <= attractorTreshHold)
                    {
                        result += 1f;
                    }
                    else if (Math.Abs(seq[i] - wave[i]) > attractorTreshHold && Math.Abs(seq[i] - wave[i]) <= 1.5 * attractorTreshHold)
                    {
                        result -= 4.1f;
                    }

                    else
                    {
                        result -= 6.2f;
                    }
                }
            });

            return result;
        }

      
      


        // Classificação: Repetições de padrões alternadamente entre compassos
        float ScoreBalance(double[] seq, float minPercentPauseOrProlongation, float maxPercentPauseOrProlongation)
        {
            // Se reverseSequence = true, as repetiçoes alternadas dos compassos serão espelhadas - TBD

            float result = 0;
        //    float varMax = 0;
        //    float varMin = 0;
            float countNonNotes = 0;

            Parallel.For(0, seq.Length, i =>
            {
                if (seq[i] == gene_pause || seq[i] == gene_prolongation)
                {
                    countNonNotes += 1;
                }
            });

            var nonNotesPercent = 100*(countNonNotes / seq.Length);
            //    varMax += (float)(1 - Math.Pow(32, (- nonNotesPercent / maxPercentPauseOrProlongation) ))*   -8 * seq.Length;
            //  varMin += (float)Math.Pow(32,  (-nonNotesPercent / minPercentPauseOrProlongation)) * -8 * seq.Length;
            //   result = varMax + varMin;
            result = -(nonNotesPercent - minPercentPauseOrProlongation) * (nonNotesPercent - maxPercentPauseOrProlongation) * (16 / nonNotesPercent);
            if (result > 1) { result = (float)Math.Sqrt(result) / (maxPercentPauseOrProlongation - minPercentPauseOrProlongation); }
            return result;
        }



        // Classificação: Repetições de padrões alternadamente entre compassos
        float ScoreMetricRepetitionsABA(double[] seq, int measureLenght, int precedenceMeasureNr, bool reverseSequence)
        {
            // Se reverseSequence = true, as repetiçoes alternadas dos compassos serão espelhadas - TBD

            float result = 0;

            Parallel.For(0, seq.Length, i =>
            {
                if (i > precedenceMeasureNr * measureLenght)
                {
                    if (seq[i] == seq[i - precedenceMeasureNr * measureLenght])
                    {
                        result += 1;
                    }

                    else
                    {
                        result -= 4;
                    }
                }
            });

            return result;
        }

        // Classificação: Repetições de ritmos entre compassos ; LeitMotif - repetição de uma figura rítmica ao longo da partitura
        float ScoreRitmicRepetitions(double[] seq, int measureLenght, int precedenceMeasureNr, int spacing, bool reverseSequence)
        {
            // Se reverseSequence = true, as repetiçoes alternadas dos compassos serão espelhadas - TBD

            float result = 0;

            Parallel.For(0, seq.Length, i =>
            {
                var noteNumber = i % measureLenght;
                var measureNumber = i / measureLenght;
                int spacingTest;
                if(spacing <= 0) { spacingTest = 0; } else { spacingTest = measureNumber % spacing;}
                

                if (i >= (precedenceMeasureNr + 1) * measureLenght && spacingTest == 0)
                {
                    if (seq[i] == seq[(i % measureLenght) + precedenceMeasureNr * measureLenght] && (int)seq[i] == gene_pause)
                    {
                        result += 4;
                        if (i == 0)    // no caso de a primeira nota da partitura ser uma pausa;
                        {
                            result += 1;
                        }
                    }

                    else if (seq[i] == seq[(i % measureLenght) + precedenceMeasureNr * measureLenght] && (int)seq[i] == gene_prolongation)
                    {
                        result += 4;
                        if ((i % measureLenght ) == 0)    // no caso de a primeira nota da partitura ser um prolongamento;
                        {
                            result -= 4;
                        }
                    }

                    else if (seq[i] != gene_prolongation && seq[i] != gene_pause && seq[(i % measureLenght) + precedenceMeasureNr * measureLenght] != gene_prolongation && seq[(i % measureLenght) + precedenceMeasureNr * measureLenght] != gene_pause)
                    { //Neste caso, ambos são notas com o mesmo tempo mínimo
                        result += 2;
                    }

                    else
                    {
                        result -= 2;
                    }
                }
            });

            return result;
        }

        // Classificação: Valorização de figuras Rítmicas - Percentagem de ocorrêmcia + selecção aleatória da figura rítmica dominante

        // Classificação: Cadencias de repetições interessantes
        float EvaluateInterestingRitmicPatterns(double[] seq, int measureLenght)
        {
            float result = 0;
            int pause = gene_pause;
            int extend = gene_prolongation;

            Parallel.For(0, seq.Length, i =>

            {
                if (i > 8 && (int)seq[i] != pause && (int)seq[i] != extend) //Premissa: seq[i] é uma nota
                {
                    //última figura é uma nota (figura mais afastada da actual)
                    if ((int)seq[i - 3] != pause && (int)seq[i - 3] != extend)
                    {
                        if ((int)seq[i - 2] == extend) // 2+1+1 ou 3+1
                        {
                            if ((int)seq[i - 1] == extend) // 3+1
                            {
                                result += 1f;
                                if (i % measureLenght == 4) { result += 5f; } //Maior Mérito se for no início do compasso
                            }
                            else if ((int)seq[i - 1] != pause) // 2+1+1
                            {
                                result += 1f;
                                if (i % measureLenght == 4)
                                { result += 5f; } //Maior Mérito se for no início do compasso
                            }
                            else   // Outros casos
                            {
                                ;
                            }

                        }

                        else if ((int)seq[i - 2] != pause && (int)seq[i - 2] != extend &&
                                 (int)seq[i - 1] != pause && (int)seq[i - 1] != extend) // 1+1+1+1
                        {
                            result += 0.5f;
                        }


                    }


                }
                else if (i % measureLenght == 0 && (int)seq[i] == extend) { result -= 5f; } //extended no início do compasso
                else if (i > 4 && (int)seq[i] == extend && (int)seq[i - 1] == extend && (int)seq[i - 2] == extend && (int)seq[i - 3] != extend) { result = +10f; } //nota de tempo completo ou paus completa


            });

            return result;
        }


        // Terminação da partitura com notas mais longas
        float ScoreTerminationQualifyers(double[] seq, int compositionLenght)
        {
            float result = 0;
            {
                if ((int)seq[(compositionLenght - 1)] == gene_prolongation)                // última nota
                {
                    result += 0.1f* compositionLenght;
                    if ((int)seq[(compositionLenght - 1) - 1] != gene_prolongation)        // penúltima nota
                    {
                        result += 0.2f * compositionLenght;
                        if ((int)seq[(compositionLenght - 1) - 2] != gene_prolongation)    // antepenúltima nota
                        {
                            result += 0.3f * compositionLenght;
                        }
                    }
                }
                else
                {
                    result = -0.3f * compositionLenght;
                }
            }
            return result;
        }



        // Classificação: Harmonização entre compassos subsequentes
        float ScoreMSelfHarmonizationPreviousMeasures(double[] seq, int measureLenght, int measureDistance, int compositionLenght)
        {
            // Se MeasureDistance - dita a distancia de autoHarmonicação
            var measDist = measureDistance;
            float result = 0;
            if ((measureDistance * measureLenght > compositionLenght) || measureDistance < 1) { measDist = 1; }

            Parallel.For(0, seq.Length, i =>
            {
                if (i > measDist * measureLenght && (int)seq[i] != gene_pause && (int)seq[i] != gene_prolongation)
                {
                    var u1 = seq[i];
                    var u2 = seq[i - measDist * measureLenght];
                    int temoraryInterval = (int)(u1 - u2);

                    result += EvaluateInterestingIntervalsCore(temoraryInterval, -101, scaleInMajorMode, true);
                }
            });

            return result;
        }

        


        double RankWithTresholds2(double[] notes)
        {
            var maxIteration = (int)(300 * 200 * 0.01);
            achievedRanking = 0;

            if (currentTime < (int)(limitSeconds * firstFitnesSectionTime))
            {

                    double[] tempVars1 = new double[] { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };

                    Task task0 = Task.Factory.StartNew(() => tempVars1[0] = wG1InterestingPatterns1 * EvaluateInterestingRitmicPatterns(notes, MidiFile.SEMIBREVE / smallestTimeUnitUsed));
                    Task task1 = Task.Factory.StartNew(() => tempVars1[1] = wG1SelfHarm1 *            ScoreMSelfHarmonizationPreviousMeasures(notes, MidiFile.SEMIBREVE / smallestTimeUnitUsed, 1, lenghtSequence));
                    Task task2 = Task.Factory.StartNew(() => tempVars1[2] = wG1SelfHarm2 *            ScoreMSelfHarmonizationPreviousMeasures(notes, MidiFile.SEMIBREVE / smallestTimeUnitUsed, 2, lenghtSequence));
                    Task task3 = Task.Factory.StartNew(() => tempVars1[3] = weG1ABA *                 ScoreMetricRepetitionsABA(notes, MidiFile.SEMIBREVE / smallestTimeUnitUsed, 4, false));
                    Task task4 = Task.Factory.StartNew(() => tempVars1[4] = wG1RitmicLeitmotif *      ScoreRitmicRepetitions(notes, MidiFile.SEMIBREVE / smallestTimeUnitUsed, 0, 1, false));
                    Task task5 = Task.Factory.StartNew(() => tempVars1[5] = wG1AttWave1 *             AttractorWave(notes, w1ThresholdAttractor, onda1, maxIteration));
                    Task task6 = Task.Factory.StartNew(() => tempVars1[6] = wG1AttWave2 *             AttractorWave(notes, w2ThresholdAttractor, onda2, maxIteration));
                    Task task7 = Task.Factory.StartNew(() => tempVars1[7] = wG1Range *                EvaluateRange(notes, 15, maxIteration));    // Dá classificação positiva a notas dentro do intervalo seleccionado
                    Task task8 = Task.Factory.StartNew(() => tempVars1[8] = wG1Scale *                EvaluateScale(notes, chromosome_scale, ConfigurationValues.chromosome_possible_scales, gene_A4));   // Dá classificação positiva às notas correspondentes à escala seleccionada
                    Task task9 = Task.Factory.StartNew(() => tempVars1[9] = wG1PauseProlongation *    EvaluatePauseAndProlongation(notes));
                    Task task10 = Task.Factory.StartNew(() => tempVars1[10] = wG1ReduceRepetitions *  EvaluateExcessiveRepetitions(notes));
                    Task task11= Task.Factory.StartNew(() => tempVars1[11] = wG1Intervals *           EvaluateIntervals(notes));
                    Task task12 = Task.Factory.StartNew(() => tempVars1[12] = wG1NiceRepetitions *    EvaluateInterestingRepetitions(notes));
                    Task task13 = Task.Factory.StartNew(() => tempVars1[13] = wG1ScoreEnding *        ScoreTerminationQualifyers(notes, lenghtSequence));
                    Task task14 = Task.Factory.StartNew(() => tempVars1[14] = 5 *                     ScoreBalance(notes, 7, 40));


                Task.WaitAll(task0, task1, task2, task3, task4, task5, task6, task7, task8, task9, task10, task11, task12, task13, task14);
                    for (int i= 0; i < tempVars1.Length; i++) { achievedRanking += tempVars1[i]; }

                }
            else if (currentTime >= (int)(limitSeconds * (firstFitnesSectionTime)))
            {
                /*
                double[] tryVector = new double[] { 0, 74, 74, 74, 74, 74, 74, 74, 40, 42, 40, 39,0, 40, 42, 44, 40, 42, 40, 39, 37, 35, 37, 39, 40, 42, 44, 45, 44, 47, 45, 44, 42, 44, 45, 44, 42, 40, 42, 42, 45, 47, 45, 44, 42, 41, 44, 49, 47, 45, 44, 42, 40, 39, 42, 47, 45, 44, 42, 40, 39, 37, 42, 44, 42, 40, 39, 37, 35, 34, 35, 37, 39, 40, 42, 40, 39, 40, 42, 44, 40, 42, 40, 39, 37, 35, 37, 39, 40, 42, 44, 45, 44, 47, 45, 44, 45, 44, 45, 44, 42, 40, 42, 44, 45, 47, 45, 44, 42, 41, 44, 49, 47, 45, 44, 42, 40, 39, 42, 47, 45, 44, 42, 40, 39, 37, 40, 45, 44 };


                Console.WriteLine("EvaluateInterestingRitmicPatterns:" + EvaluateInterestingRitmicPatterns(tryVector, MidiFile.SEMIBREVE / smallestTimeUnitUsed));
                Console.WriteLine("ScoreMSelfHarmonizationPreviousMeasures:" + ScoreMSelfHarmonizationPreviousMeasures(tryVector, MidiFile.SEMIBREVE / smallestTimeUnitUsed, 1, tryVector.Length));
                Console.WriteLine("ScoreMSelfHarmonizationPreviousMeasures:" + ScoreMSelfHarmonizationPreviousMeasures(tryVector, MidiFile.SEMIBREVE / smallestTimeUnitUsed, 2, tryVector.Length));
                Console.WriteLine("ScoreMetricRepetitionsABA:" + ScoreMetricRepetitionsABA(tryVector, MidiFile.SEMIBREVE / smallestTimeUnitUsed, 4, false));
                Console.WriteLine("ScoreRitmicRepetitions:" + ScoreRitmicRepetitions(tryVector, MidiFile.SEMIBREVE / smallestTimeUnitUsed,1, 2, false));
                Console.WriteLine("AttractorWave:" + AttractorWave(tryVector, w1ThresholdAttractor, onda1, maxIteration));
                Console.WriteLine("AttractorWave:" + AttractorWave(tryVector, w2ThresholdAttractor, onda2, maxIteration));
                Console.WriteLine("EvaluateRange:" + EvaluateRange(tryVector, 20, maxIteration));    // Dá classificação positiva a notas dentro do intervalo seleccionado
                Console.WriteLine("EvaluateScale:" + EvaluateScale(tryVector, chromosome_scale, ConfigurationValues.chromosome_possible_scales, gene_A4));   // Dá classificação positiva às notas correspondentes à escala seleccionada
                Console.WriteLine("EvaluatePauseAndProlongation:" + EvaluatePauseAndProlongation(tryVector));
                Console.WriteLine("EvaluateExcessiveRepetitions:" + EvaluateExcessiveRepetitions(tryVector));
                Console.WriteLine("EvaluateIntervals:" + EvaluateIntervals(tryVector));
                Console.WriteLine("EvaluateInterestingRepetitions:" + EvaluateInterestingRepetitions(tryVector));
                Console.WriteLine("ScoreTerminationQualifyers:" + ScoreTerminationQualifyers(tryVector, tryVector.Length));
                
            */
                



                 achievedRanking += wG2InterestingPatterns1 *EvaluateInterestingRitmicPatterns(notes, MidiFile.SEMIBREVE / smallestTimeUnitUsed);
                 achievedRanking += wG2SelfHarm1 *           ScoreMSelfHarmonizationPreviousMeasures(notes, MidiFile.SEMIBREVE / smallestTimeUnitUsed, 1, lenghtSequence);
                 achievedRanking += wG2SelfHarm2 *           ScoreMSelfHarmonizationPreviousMeasures(notes, MidiFile.SEMIBREVE / smallestTimeUnitUsed, 2, lenghtSequence);
                 achievedRanking += weG2ABA *                ScoreMetricRepetitionsABA(notes, MidiFile.SEMIBREVE / smallestTimeUnitUsed, 4, false);
                 achievedRanking += wG2RitmicLeitmotif *     ScoreRitmicRepetitions(notes, MidiFile.SEMIBREVE / smallestTimeUnitUsed, 0, 1, false);
                 achievedRanking += wG2AttWave1 *            AttractorWave(notes, w1ThresholdAttractor, onda1, maxIteration);
                 achievedRanking += wG2AttWave2 *            AttractorWave(notes, w2ThresholdAttractor, onda2, maxIteration);
                 achievedRanking += wG2Range *               EvaluateRange(notes, 15, maxIteration);    // Dá classificação positiva a notas dentro do intervalo seleccionado
                 achievedRanking += wG2Scale *               EvaluateScale(notes, chromosome_scale, ConfigurationValues.chromosome_possible_scales, gene_A4);   // Dá classificação positiva às notas correspondentes à escala seleccionada
                 achievedRanking += wG2PauseProlongation *   EvaluatePauseAndProlongation(notes);
                 achievedRanking += wG2ReduceRepetitions *   EvaluateExcessiveRepetitions(notes);
                 achievedRanking += wG2Intervals *           EvaluateIntervals(notes);
                 achievedRanking += wG2NiceRepetitions *     EvaluateInterestingRepetitions(notes);
                 achievedRanking += wG2ScoreEnding *         ScoreTerminationQualifyers(notes, lenghtSequence);
                 achievedRanking += 15 *                       ScoreBalance(notes,7, 40);
            }  
            else
            {              
                achievedRanking += 30.0 * EvaluateRange(notes, 12, maxIteration);    // Dá classificação positiva a notas dentro do intervalo seleccionado
            }
            return achievedRanking;

        }


        double RankWithTresholds(double[] notes)
        {
            achievedRanking = 0;

            if (currentIteration < 50 * 100)
            {
                var maxIteration = 50 * 100;
                achievedRanking += 2.0 * EvaluateRange(notes, 4, maxIteration);
                achievedRanking += 1.0 * AttractorWave(notes, 4, onda1, maxIteration); ;
            }


            else if (currentIteration >= 50 * 100 && currentIteration < 250 * 100)
            {
                var maxIteration = 250 * 100;
                achievedRanking += 3.0 * EvaluateRange(notes, 4, maxIteration);    // Dá classificação positiva a notas dentro do intervalo seleccionado
                achievedRanking += 5.0 * EvaluateScale(notes, chromosome_scale, ConfigurationValues.chromosome_possible_scales, gene_A4);   // Dá classificação positiva às notas correspondentes à escala seleccionada
                achievedRanking += 6.0 * EvaluatePauseAndProlongation(notes);

            }

            else if (currentIteration >= 250 * 100 && currentIteration < 350 * 100) // para garantir que não se inicia esta avaliação ainda muito cedo na evolução
            {
                var maxIteration = 350 * 100;
                achievedRanking += 4.0 * EvaluateRange(notes, 4, maxIteration);    // Dá classificação positiva a notas dentro do intervalo seleccionado
                achievedRanking += 5.0 * EvaluateIntervals(notes);
                achievedRanking += 1.0 * EvaluateInterestingRepetitions(notes);
            }

            else if (currentIteration >= 350 * 100 && currentIteration < 450 * 100) // para garantir que não se inicia esta avaliação ainda muito cedo na evolução
            {
                var maxIteration = 550 * 100;
                achievedRanking += 6.0 * EvaluateRange(notes, 4, maxIteration);
                achievedRanking += 6 * EvaluateIntervals(notes);
                achievedRanking += 5.0 * EvaluateScale(notes, chromosome_scale, ConfigurationValues.chromosome_possible_scales, gene_A4);   // Dá classificação positiva às notas correspondentes à escala seleccionada
            }
            else if (currentIteration >= 450 * 100 && currentIteration < 650 * 100) // para garantir que não se inicia esta avaliação ainda muito cedo na evolução
            {
                var maxIteration = 650 * 100;

                achievedRanking += 8.0 * EvaluateRange(notes, 5, maxIteration);
                achievedRanking += 7 * EvaluateIntervals(notes);
                achievedRanking += 2.0 * EvaluateInterestingRepetitions(notes);
                achievedRanking += 1.0 * EvaluateExcessiveRepetitions(notes);
                achievedRanking += 7.0 * EvaluateScale(notes, chromosome_scale, ConfigurationValues.chromosome_possible_scales, gene_A4);   // Dá classificação positiva às notas correspondentes à escala seleccionada
            }
            else if (currentIteration >= 650 * 100 && currentIteration < 750 * 100) // para garantir que não se inicia esta avaliação ainda muito cedo na evolução
            {
                var maxIteration = 700 * 100;
                achievedRanking += 1 * EvaluateIntervals(notes);
                achievedRanking += 1.0 * EvaluateExcessiveRepetitions(notes);
                achievedRanking += 20.0 * EvaluateRange(notes, 4, maxIteration);
                achievedRanking += 7.0 * EvaluateScale(notes, chromosome_scale, ConfigurationValues.chromosome_possible_scales, gene_A4);   // Dá classificação positiva às notas correspondentes à escala seleccionada
            }
            else
            {
                var maxIteration = 750 * 100;
                achievedRanking += 10.0 * EvaluateRange(notes, 6, maxIteration);
                achievedRanking += 7.0 * EvaluateScale(notes, chromosome_scale, ConfigurationValues.chromosome_possible_scales, gene_A4);   // Dá classificação positiva às notas correspondentes à escala seleccionada
            }

            return achievedRanking;

        }



        public double Evaluate(IChromosome chromosome)
        {
            FloatingPointChromosome myChromosome = chromosome as FloatingPointChromosome;
            double[] notes = myChromosome.ToFloatingPoints();

            if (currentIteration == 0)
            { //Inicializa ondas
                onda1 = NoteAtractionFunction(w1OscillationsPerMeasure, w1Amplitude, w1MeanValue, w1HorizontalShift);
                onda2 = NoteAtractionFunction(w2OscillationsPerMeasure, w2Amplitude, w2MeanValue, w2HorizontalShift);
            }

            currentTime = (int)timr.ElapsedMilliseconds / 1000;     // Verifica o tempo decorrido em segundos desde o início do programa
            currentIteration += 1;
            achievedRanking = 0;

            //  achievedRanking = RankWithTresholds(notes);         // Avalia considerando tresholds
            achievedRanking = RankWithTresholds2(notes);           // Avalia não considerando tresholds
            percentTask = (int)((currentTime*100) / limitSeconds);
            return achievedRanking;
        }
    }
}
