using System;
using System.IO;
//using System.Collections.Generic;
using System.ComponentModel;
//using System.Data;
//using System.Drawing;
//using System.Linq;
//using System.Text;
using System.Threading.Tasks;
using System.Threading;
using System.Windows.Forms;
using GeneticSharp.Domain;
using GeneticSharp.Domain.Crossovers;
using GeneticSharp.Domain.Mutations;
using GeneticSharp.Domain.Populations;
using GeneticSharp.Domain.Selections;
using GeneticSharp.Domain.Terminations;
using GeneticSharp.Domain.Chromosomes;

namespace GeneticMusic
{
    public partial class Form1 : MetroFramework.Forms.MetroForm

    {


        // Variaveis a usar para o algoritmo
        long limitSeconds = 60;
        bool limitSecondsChanged = false;
        bool scaleInMajorMode = true;
        byte scaleSelected = 1;
        int numberOfMeasures = 8;

        string selectionMethod = "Elite";
        int minimumPopulation = 60;
        float mutationFactor = 0.1f;

        float wG1InterestingPatterns1 = 10f;
        float wG1SelfHarm1 = 1f;
        float wG1SelfHarm2 = 4f;
        float weG1ABA = 0.5f;
        float wG1RitmicLeitmotif = 12f;
        float wG1AttWave1 = 3;
        float wG1AttWave2 = 2;
        float wG1Range = 42;
        float wG1Scale = 12;
        float wG1PauseProlongation = 4.5f;
        float wG1ReduceRepetitions = 2;
        float wG1Intervals = 12;
        float wG1NiceRepetitions = 10;
        float wG1ScoreEnding = 2;

        float wG2InterestingPatterns1 = 7.02f;
        float wG2SelfHarm1 = 2f;
        float wG2SelfHarm2 = 4f;
        float weG2ABA = 0.5f;
        float wG2RitmicLeitmotif = 16f;
        float wG2AttWave1 = 3.1f;
        float wG2AttWave2 = 2.15f;
        float wG2Range = 42;
        float wG2Scale = 16;
        float wG2PauseProlongation = 4f;
        float wG2ReduceRepetitions = 2;
        float wG2Intervals = 14;
        float wG2NiceRepetitions = 10.05f;
        float wG2ScoreEnding = 2;

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



        void InicializeDefalutValues()
        {
            metroTextBoxWG1InterestingPatterns1.Text = wG1InterestingPatterns1.ToString();
            metroTextBoxWG1SelfHarm1.Text = wG1SelfHarm1.ToString();
            metroTextBoxWG1SelfHarm2.Text = wG1SelfHarm2.ToString();
            metroTextBoxweG1ABA.Text = weG1ABA.ToString();
            metroTextBoxWG1RitmicLeitmotif.Text = wG1RitmicLeitmotif.ToString();
            metroTextBoxWG1AttWave1.Text = wG1AttWave1.ToString();
            metroTextBoxWG1AttWave2.Text = wG1AttWave2.ToString();
            metroTextBoxWG1Range.Text = wG1Range.ToString();
            metroTextBoxWG1Scale.Text = wG1Scale.ToString();
            metroTextBoxWG1PauseProlongation.Text = wG1PauseProlongation.ToString();
            metroTextBoxWG1ReduceRepetitions.Text = wG1ReduceRepetitions.ToString();
            metroTextBoxWG1Interval.Text = wG1Intervals.ToString();
            metroTextBoxWG1NiceRepetitions.Text = wG1NiceRepetitions.ToString();
            metroTextBoxWG1ScoreEnding.Text = wG1ScoreEnding.ToString();

            metroTextBoxWG2InterestingPatterns1.Text = wG2InterestingPatterns1.ToString();
            metroTextBoxWG2SelfHarm1.Text = wG2SelfHarm1.ToString();
            metroTextBoxWG2SelfHarm2.Text = wG2SelfHarm2.ToString();
            metroTextBoxweG2ABA.Text = weG2ABA.ToString();
            metroTextBoxWG2RitmicLeitmotif.Text = wG2RitmicLeitmotif.ToString();
            metroTextBoxWG2AttWave1.Text = wG2AttWave1.ToString();
            metroTextBoxWG2AttWave2.Text = wG2AttWave2.ToString();
            metroTextBoxWG2Range.Text = wG2Range.ToString();
            metroTextBoxWG2Scale.Text = wG2Scale.ToString();
            metroTextBoxWG2PauseProlongation.Text = wG2PauseProlongation.ToString();
            metroTextBoxWG2ReduceRepetitions.Text = wG2ReduceRepetitions.ToString();
            metroTextBoxWG2Intervals.Text = wG2Intervals.ToString();
            metroTextBoxWG2NiceRepetitions.Text = wG2NiceRepetitions.ToString();
            metroTextBoxWG2ScoreEnding.Text = wG2ScoreEnding.ToString();



            metroTextBoxWave1HalfToneAttractions.Text = w1ThresholdAttractor.ToString();
            metroTextBoxWave2HalfToneAttractions.Text = w2ThresholdAttractor.ToString();
            metroTextBoxWave1PeriodsPM.Text = w1OscillationsPerMeasure.ToString();
            metroTextBoxWave2PeriodsPM.Text = w2OscillationsPerMeasure.ToString();
            metroTextBoxWave1Amplitude.Text = w1Amplitude.ToString();
            metroTextBoxWave2Amplitude.Text = w2Amplitude.ToString();
            metroTextBoxWave1MeanValue.Text = (w1MeanValue - confValues.GetGene_A4()).ToString();
            metroTextBoxWave2MeanValue.Text = (w2MeanValue - confValues.GetGene_A4()).ToString();
            metroTextBoxWave1HorizontalShift.Text = w1HorizontalShift.ToString();
            metroTextBoxWave2HorizontalShift.Text = w2HorizontalShift.ToString();

            metroTrackBarMutationPercent.Value = (int)(100 * mutationFactor);
            metroTrackBarSplitTime1.Value = (int)(firstGroupPercent);

            if (scaleInMajorMode) { metroComboBoxScoreMode.Items[metroComboBoxScoreMode.SelectedIndex = 0].ToString(); } else { metroComboBoxScoreMode.Items[metroComboBoxScoreMode.SelectedIndex = 1].ToString(); }


        }

        void UpdateConfigurationValues()
        {
            confValues.SetWG1InterestingPatterns1(wG1InterestingPatterns1);
            confValues.SetWG1SelfHarm1(wG1SelfHarm1);
            confValues.SetWG1SelfHarm2(wG1SelfHarm2);
            confValues.SetWeG1ABA(weG1ABA);
            confValues.SetWG1RitmicLeitmotif(wG1RitmicLeitmotif);
            confValues.SetWG1AttWave1(wG1AttWave1);
            confValues.SetWG1AttWave2(wG1AttWave2);
            confValues.SetWG1Range(wG1Range);
            confValues.SetWG1Scale(wG1Scale);
            confValues.SetWG1PauseProlongation(wG1PauseProlongation);
            confValues.SetWG1ReduceRepetitions(wG1ReduceRepetitions);
            confValues.SetWG1Intervals(wG1Intervals);
            confValues.SetWG1NiceRepetitions(wG1NiceRepetitions);
            confValues.SetWG1ScoreEnding(wG1ScoreEnding);

            confValues.SetWG2InterestingPatterns1(wG2InterestingPatterns1);
            confValues.SetWG2SelfHarm1(wG2SelfHarm1);
            confValues.SetWG2SelfHarm2(wG2SelfHarm2);
            confValues.SetWeG2ABA(weG2ABA);
            confValues.SetWG2RitmicLeitmotif(wG2RitmicLeitmotif);
            confValues.SetWG2AttWave1(wG2AttWave1);
            confValues.SetWG2AttWave2(wG2AttWave2);
            confValues.SetWG2Range(wG2Range);
            confValues.SetWG2Scale(wG2Scale);
            confValues.SetWG2PauseProlongation(wG2PauseProlongation);
            confValues.SetWG2ReduceRepetitions(wG2ReduceRepetitions);
            confValues.SetWG2Intervals(wG2Intervals);
            confValues.SetWG2NiceRepetitions(wG2NiceRepetitions);
            confValues.SetWG2ScoreEnding(wG2ScoreEnding);

            confValues.SetW1ThresholdAttractor(w1ThresholdAttractor);
            confValues.SetW2ThresholdAttractor(w2ThresholdAttractor);
            confValues.SetW1OscillationsPerMeasure(w1OscillationsPerMeasure);
            confValues.SetW2OscillationsPerMeasure(w2OscillationsPerMeasure);
            confValues.SetW1Amplitude(w1Amplitude);
            confValues.SetW2Amplitude(w2Amplitude);
            confValues.SetW1MeanValue(w1MeanValue);
            confValues.SetW2MeanValue(w2MeanValue);

            confValues.SetW1HorizontalShift(w1HorizontalShift);
            confValues.SetW2HorizontalShift(w2HorizontalShift);

        }


        void GetWaveParameters()
        {
            w1ThresholdAttractor = confValues.GetW1ThresholdAttractor();
            w2ThresholdAttractor = confValues.GetW2ThresholdAttractor();
            w1OscillationsPerMeasure = confValues.GetW1OscillationsPerMeasure();
            w2OscillationsPerMeasure = confValues.GetW2OscillationsPerMeasure();
            w1Amplitude = confValues.GetW1Amplitude();
            w2Amplitude = confValues.GetW2Amplitude();
            w1MeanValue = confValues.GetW1MeanValue();
            w2MeanValue = confValues.GetW2MeanValue();
        }




        // Variáveis durante a simulacao
        long generation = 0;
        long ranking = 0;
        float firstGroupPercent = 25;
        string saveDirectory = "";



        //private static Mutex mutex = new Mutex();


        ConfigurationValues confValues;
        AlgorithmFitness fitness = new AlgorithmFitness();
        static public int completionPercent = 0;


        public Form1()
        {
            InitializeComponent();
            confValues = new ConfigurationValues();
            confValues.InitializePopulationParameters();
            GetWaveParameters();

        }


        public void metroProgressBar1_Click(object sender, EventArgs e)
        {

        }

        private async void metroButton1_Click(object sender, EventArgs e)
        {
            backgroundWorker1.RunWorkerAsync();


            if (limitSecondsChanged) { confValues.SetLimitSeconds(limitSeconds); }
            limitSeconds = confValues.GetLimitSeconds();
            confValues.SetChromosome_scale(scaleSelected);
            confValues.SetScaleInMode(scaleInMajorMode);
            confValues.SetNumberOfMeasures(numberOfMeasures);
            numberOfMeasures = confValues.GetNumberOfTabs();
            metroTextBoxTabCount.Text = numberOfMeasures.ToString() + " Measures";
            metroTextBoxTabCount.Enabled = false;
            confValues.SetPercentGroupTime(firstGroupPercent);
            firstGroupPercent = confValues.GetPercentGroupTime();



            UpdateConfigurationValues();
            InicializeDefalutValues();
            metroPanel1.Enabled = false;
            metroPanel2.Enabled = false;
            metroPanel3.Enabled = false;
            metroTrackBarMutationPercent.Enabled = false;
            metroTextBoxMinimumPop.Enabled = false;

            metroTrackBarSplitTime2.Value = 100 - (int)firstGroupPercent;       
            metroTrackBarSplitTime1.Value = (int)firstGroupPercent;
            metroTrackBarSplitTime1.Enabled = false;
            metroTrackBarSplitTime2.Enabled = false;
            metroTextBoxWave1HorizontalShift.Enabled = false;
            metroTextBoxWave2HorizontalShift.Enabled = false;



            metroTextBoxMinimumPop.Text = "MinPop: " + minimumPopulation.ToString();







            metroButton1.Enabled = false;
            metroTextBoxTestTime.Enabled = false;
            metroTextBoxTestTime.Text = limitSeconds.ToString() + " s";





            var selection = new EliteSelection();
            // var selection = new TournamentSelection();
            var crossover = new UniformCrossover();
            //var mutation = new UniformMutation(true);
            var mutation = new PartialShuffleMutation();



            fitness = new AlgorithmFitness(confValues);

            var chromosome = new FloatingPointChromosome(
                confValues.GetLowestValuesSequence(),
                confValues.GetHighestValuesSequence(),
                confValues.GetNumberOfBitsSequence(),
                confValues.GetDecimalsSequence());

            var population = new Population(minimumPopulation, 999, chromosome);

            var ga = new GeneticAlgorithm(population, fitness, selection, crossover, mutation);
            ga.MutationProbability = mutationFactor;
            // ga.Termination = new FitnessStagnationTermination(500);
            var endTime = new TimeSpan(10 * 1000 * 1000 * confValues.GetLimitSeconds());
            ga.Termination = new TimeEvolvingTermination(endTime);


            ga.GenerationRan += (s, v) =>
            {
                generation = ga.GenerationsNumber;
                ranking = (long)ga.BestChromosome.Fitness.Value;
            };
            //ga.GenerationRan += ( s,  v) => Console.WriteLine($"Generation {ga.GenerationsNumber}. Best fitness: {ga.BestChromosome.Fitness.Value}");
           // Console.WriteLine("GA running...");
            await Task.Run(() => ga.Start());

           // Console.WriteLine();
          //  Console.WriteLine($"Best solution found has fitness: {ga.BestChromosome.Fitness}");
            ranking = (long)ga.BestChromosome.Fitness;
            metroTextBoxRanking.Text = ranking.ToString();
         //   Console.WriteLine($"Elapsed time: {ga.TimeEvolving}");



            FloatingPointChromosome c = ga.BestChromosome as FloatingPointChromosome;
            double[] points = c.ToFloatingPoints();

         //   Console.WriteLine($"Winning Sequence: {points}");


            // Inicia a sequência com valores aleatórios entre os extremos;           
            // createRandomSequence(sequence, 0, gene_prolongation);
            byte[] sequence = new byte[2 * points.Length];

            //createRandomSequence(sequence, gene_A4 -4 , gene_A4 +4 );

            for (int i = 0, j = 0; i < sequence.Length; i += 2, j += 1)
            {
                sequence[i] = (byte)points[j];
                sequence[i + 1] = confValues.GetSmallestTimeUnitUsed();
            }


            // Falta uma função que verifique se na sequência existem caracteres duplicadores e duplique o tamanho da entrada anterior
            //mutex.WaitOne();            //mutex.ReleaseMutex();
            var t = new Thread((ThreadStart)(() =>  { folderBrowserDialog1_GetPath();  }));
             t.SetApartmentState(ApartmentState.STA);
            t.Start();
            t.Join();



            string nomeFicheiro = DateTime.Now.ToFileTime().ToString();
            // Exporta o resultado para midi
            ConfigurationValues.createMidiFile(sequence, "outMidi_" + nomeFicheiro, saveDirectory, confValues.GetGene_pause(), confValues.GetGene_prolongation(), confValues.GetOffsetForA4(), confValues.GetGene_A4());



            // Fim de ciclo - controlo devolvido
            metroProgressBar1.Value = 0;
            metroTextBoxTestTime.Text = "Simulation Time".ToString();
            metroTextBoxTabCount.Text = "Number of Measures".ToString(); 
            metroButton1.Enabled = true;
            metroTextBoxTestTime.Enabled = true;
            metroTextBoxTabCount.Enabled = true;
            limitSecondsChanged = false;
            metroTrackBarSplitTime1.Enabled = true;
            metroTrackBarSplitTime2.Enabled = true;
            metroPanel1.Enabled = true;
            metroPanel2.Enabled = true;
            metroPanel3.Enabled = true;
            metroTrackBarMutationPercent.Enabled = true;
            metroTextBoxMinimumPop.Enabled = true;
            metroTextBoxWave1HorizontalShift.Enabled = true;
            metroTextBoxWave2HorizontalShift.Enabled = true;


        }

        private void backgroundWorker1_DoWork(object sender, DoWorkEventArgs e)
        {
            bool var = true;
            while(var)
            {
                // Wait 100 milliseconds.
                Thread.Sleep(100);
                // Report progress.
                if (fitness.inicialized)
                { completionPercent = fitness.percentTask; }
                backgroundWorker1.ReportProgress(completionPercent);
                if (completionPercent >= 100) { var = false; }
            }


        }

        private void Form1_Load(object sender, System.EventArgs e)
        {
            // Start the BackgroundWorker.
            backgroundWorker1.WorkerReportsProgress = true;
            InicializeDefalutValues();

        }

        private void backgroundWorker1_ProgressChanged(object sender,
            ProgressChangedEventArgs e)
        {
            // Change the value of the ProgressBar to the BackgroundWorker progress.
            metroProgressBar1.Value = e.ProgressPercentage;
            metroTextBoxGeneration.Text = generation.ToString();
            metroTextBoxRanking.Text = ranking.ToString();



        }

        private void backgroundWorker1_ProgressChanged_1(object sender, ProgressChangedEventArgs e)
        {

        }

        private void backgroundWorker1_RunWorkerCompleted(object sender, RunWorkerCompletedEventArgs e)
        {

        }

        private void metroTextBoxTestTime_Click(object sender, EventArgs e)
        {
            metroTextBoxTestTime.Clear();
        }

        private void metroTextBoxTestTime_Enter(object sender, EventArgs e)
        {
            metroTextBoxTestTime.Clear();
        }


        private void metroTextBoxTestTime_Leave(object sender, EventArgs e)
        {
            int value;
            if (int.TryParse(metroTextBoxTestTime.Text, out value))
            {
                if (value < 1 || value > (60 * 60 * 24)) {
                  //  metroTextBoxTestTime.Text = "Using Default Value".ToString();
                    value = 60;}
                limitSeconds = value;
                limitSecondsChanged = true;
            }
            else
            {

            }

        }

        private void metroComboBoxScoreMode_SelectedIndexChanged(object sender, EventArgs e)
        {
            string selectedItem = metroComboBoxScoreMode.Items[metroComboBoxScoreMode.SelectedIndex].ToString();
            if (selectedItem == "Major Mode") { scaleInMajorMode = true; }
            if (selectedItem == "Minor Mode") { scaleInMajorMode = false; }
        }

        private void metroComboBoxScale_SelectedIndexChanged(object sender, EventArgs e)
        {

            scaleSelected = (byte)metroComboBoxScale.SelectedIndex;

        }

        private void metroComboBoxScale_DropDown(object sender, EventArgs e)
        {

            if (scaleInMajorMode)
            {
                metroComboBoxScale.Items.Clear();
                metroComboBoxScale.ResetText();
                metroComboBoxScale.Items.Add("CM");
                metroComboBoxScale.Items.Add("GM");
                metroComboBoxScale.Items.Add("DM");
                metroComboBoxScale.Items.Add("AM");
                metroComboBoxScale.Items.Add("EM");
                metroComboBoxScale.Items.Add("BM, CbM");
                metroComboBoxScale.Items.Add("F#M, GbM");
                metroComboBoxScale.Items.Add("DbM");
                metroComboBoxScale.Items.Add("AbM");
                metroComboBoxScale.Items.Add("EbM");
                metroComboBoxScale.Items.Add("BbM");
                metroComboBoxScale.Items.Add("FM");


            }
            else
            {
                metroComboBoxScale.Items.Clear();
                metroComboBoxScale.ResetText();
                metroComboBoxScale.Items.Add("Am");
                metroComboBoxScale.Items.Add("Em");
                metroComboBoxScale.Items.Add("Bm");
                metroComboBoxScale.Items.Add("F#m");
                metroComboBoxScale.Items.Add("C#m");
                metroComboBoxScale.Items.Add("G#m");
                metroComboBoxScale.Items.Add("Ebm, D#m");
                metroComboBoxScale.Items.Add("Bbm");
                metroComboBoxScale.Items.Add("Fm");
                metroComboBoxScale.Items.Add("Cm");
                metroComboBoxScale.Items.Add("Gm");
                metroComboBoxScale.Items.Add("Dm");

            }

        }


        private void folderBrowserDialog1_GetPath()
        {
                if (folderBrowserDialog1.ShowDialog() == DialogResult.OK && !string.IsNullOrWhiteSpace(folderBrowserDialog1.SelectedPath))
            {
                saveDirectory = folderBrowserDialog1.SelectedPath;
            }

        }

        private void folderBrowserDialog1_HelpRequest(object sender, EventArgs e)
        {
            
        }


        private void metroTextBoxTabCount_Click(object sender, EventArgs e)
        {
            metroTextBoxTabCount.Clear();
        }

        private void metroTextBoxTabCount_Enter(object sender, EventArgs e)
        {
            metroTextBoxTabCount.Clear();
        }


        private void metroTextBoxTabCount_Leave(object sender, EventArgs e)
        {
            int value;
            if (int.TryParse(metroTextBoxTabCount.Text, out value))
            {
                if (value < 2 || value > (100))
                {
                    //  metroTextBoxTestTime.Text = "Using Default Value".ToString();
                    value = 8;
                }
                numberOfMeasures = value;
                
            }
            else
            {

            }

        }



        private void metroTrackBarSplitTime1_Scroll(object sender, ScrollEventArgs e)
        {
            firstGroupPercent = metroTrackBarSplitTime1.Value;
            metroTrackBarSplitTime2.Value = 100 - (int)firstGroupPercent;
        }

        private void metroTrackBarSplitTime2_Scroll(object sender, ScrollEventArgs e)
        {
            firstGroupPercent = (100 - metroTrackBarSplitTime2.Value);
            metroTrackBarSplitTime1.Value = (int)firstGroupPercent;
        }


        private void metroTextBoxMinimumPop_Click(object sender, EventArgs e)
        {
            metroTextBoxMinimumPop.Clear();
        }

        private void metroTextBoxMinimumPop_Enter(object sender, EventArgs e)
        {
            metroTextBoxMinimumPop.Clear();
        }


        private void metroTextBoxMinimumPop_Leave(object sender, EventArgs e)
        {
            int value;
            if (int.TryParse(metroTextBoxMinimumPop.Text, out value))
            {
                if (value < 2 || value > (999))  { value = 20;  }

                minimumPopulation = value;
                metroTextBoxMinimumPop.Text = "MinPop: " + value.ToString();
            }
            else { }
        }

        private void metroTextBoxWG1InterestingPatterns1_Click(object sender, EventArgs e)
        {
            metroTextBoxWG1InterestingPatterns1.Clear();
        }

        private void metroTextBoxWG1SelfHarm1_Click(object sender, EventArgs e)
        {
            metroTextBoxWG1SelfHarm1.Clear();
        }

        private void metroTextBoxWG1SelfHarm2_Click(object sender, EventArgs e)
        {
            metroTextBoxWG1SelfHarm2.Clear();
        }

        private void metroTextBoxweG1ABA_Click(object sender, EventArgs e)
        {
            metroTextBoxweG1ABA.Clear();
        }

        private void metroTextBoxWG1RitmicLeitmotif_Click(object sender, EventArgs e)
        {
            metroTextBoxWG1RitmicLeitmotif.Clear();
        }

        private void metroTextBoxWG1AttWave1_Click(object sender, EventArgs e)
        {
            metroTextBoxWG1AttWave1.Clear();
        }

        private void metroTextBoxWG1AttWave2_Click(object sender, EventArgs e)
        {
            metroTextBoxWG1AttWave2.Clear();
        }

        private void metroTextBoxWG1Range_Click(object sender, EventArgs e)
        {
            metroTextBoxWG1Range.Clear();
        }

        private void metroTextBoxWG1Scale_Click(object sender, EventArgs e)
        {
            metroTextBoxWG1Scale.Clear();
        }

        private void metroTextBoxWG1PauseProlongation_Click(object sender, EventArgs e)
        {
            metroTextBoxWG1PauseProlongation.Clear();
        }

        private void metroTextBoxWG1ReduceRepetitions_Click(object sender, EventArgs e)
        {
            metroTextBoxWG1ReduceRepetitions.Clear();
        }

        private void metroTextBoxWG1Interval_Click(object sender, EventArgs e)
        {
            metroTextBoxWG1Interval.Clear();
        }

        private void metroTextBoxWG1NiceRepetitions_Click(object sender, EventArgs e)
        {
            metroTextBoxWG1NiceRepetitions.Clear();
        }

        private void metroTextBoxWG1ScoreEnding_Click(object sender, EventArgs e)
        {
            metroTextBoxWG1ScoreEnding.Clear();
        }

        private void metroTextBoxWG2InterestingPatterns1_Click(object sender, EventArgs e)
        {
            metroTextBoxWG2InterestingPatterns1.Clear();
        }

        private void metroTextBoxWG2SelfHarm1_Click(object sender, EventArgs e)
        {
            metroTextBoxWG2SelfHarm1.Clear();
        }

        private void metroTextBoxWG2SelfHarm2_Click(object sender, EventArgs e)
        {
            metroTextBoxWG2SelfHarm2.Clear();
        }

        private void metroTextBoxweG2ABA_Click(object sender, EventArgs e)
        {
            metroTextBoxweG2ABA.Clear();
        }

        private void metroTextBoxWG2RitmicLeitmotif_Click(object sender, EventArgs e)
        {
            metroTextBoxWG2RitmicLeitmotif.Clear();
        }

        private void metroTextBoxWG2AttWave1_Click(object sender, EventArgs e)
        {
            metroTextBoxWG2AttWave1.Clear();
        }

        private void metroTextBoxWG2AttWave2_Click(object sender, EventArgs e)
        {
            metroTextBoxWG2AttWave2.Clear();
        }

        private void metroTextBoxWG2Range_Click(object sender, EventArgs e)
        {
            metroTextBoxWG2Range.Clear();
        }

        private void metroTextBoxWG2Scale_Click(object sender, EventArgs e)
        {
            metroTextBoxWG2Scale.Clear();
        }

        private void metroTextBoxWG2PauseProlongation_Click(object sender, EventArgs e)
        {
            metroTextBoxWG2PauseProlongation.Clear();
        }

        private void metroTextBoxWG2ReduceRepetitions_Click(object sender, EventArgs e)
        {
            metroTextBoxWG2ReduceRepetitions.Clear();
        }

        private void metroTextBoxWG2Intervals_Click(object sender, EventArgs e)
        {
            metroTextBoxWG2Intervals.Clear();
        }

        private void metroTextBoxWG2NiceRepetitions_Click(object sender, EventArgs e)
        {
            metroTextBoxWG2NiceRepetitions.Clear();
        }

        private void metroTextBoxWG2ScoreEnding_Click(object sender, EventArgs e)
        {
            metroTextBoxWG2ScoreEnding.Clear();
        }

        private void metroTextBoxWG1InterestingPatterns1_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG1InterestingPatterns1.Clear();
        }

        private void metroTextBoxWG1SelfHarm1_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG1SelfHarm1.Clear();
        }

        private void metroTextBoxWG1SelfHarm2_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG1SelfHarm2.Clear();
        }

        private void metroTextBoxweG1ABA_Enter(object sender, EventArgs e)
        {
            metroTextBoxweG1ABA.Clear();
        }

        private void metroTextBoxWG1RitmicLeitmotif_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG1RitmicLeitmotif.Clear();
        }

        private void metroTextBoxWG1AttWave1_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG1AttWave1.Clear();
        }

        private void metroTextBoxWG1AttWave2_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG1AttWave2.Clear();
        }

        private void metroTextBoxWG1Range_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG1Range.Clear();
        }

        private void metroTextBoxWG1Scale_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG1Scale.Clear();
        }

        private void metroTextBoxWG1PauseProlongation_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG1PauseProlongation.Clear();
        }

        private void metroTextBoxWG1ReduceRepetitions_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG1ReduceRepetitions.Clear();
        }

        private void metroTextBoxWG1Interval_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG1Interval.Clear();
        }

        private void metroTextBoxWG1NiceRepetitions_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG1NiceRepetitions.Clear();
        }

        private void metroTextBoxWG1ScoreEnding_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG1ScoreEnding.Clear();
        }

        private void metroTextBoxWG2InterestingPatterns1_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG2InterestingPatterns1.Clear();
        }

        private void metroTextBoxWG2SelfHarm1_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG2SelfHarm1.Clear();
        }

        private void metroTextBoxWG2SelfHarm2_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG2SelfHarm2.Clear();
        }

        private void metroTextBoxweG2ABA_Enter(object sender, EventArgs e)
        {
            metroTextBoxweG2ABA.Clear();
        }

        private void metroTextBoxWG2RitmicLeitmotif_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG2RitmicLeitmotif.Clear();
        }

        private void metroTextBoxWG2AttWave1_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG2AttWave1.Clear();
        }

        private void metroTextBoxWG2AttWave2_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG2AttWave2.Clear();
        }

        private void metroTextBoxWG2Range_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG2Range.Clear();
        }

        private void metroTextBoxWG2Scale_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG2Scale.Clear();
        }

        private void metroTextBoxWG2PauseProlongation_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG2PauseProlongation.Clear();
        }

        private void metroTextBoxWG2ReduceRepetitions_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG2ReduceRepetitions.Clear();
        }

        private void metroTextBoxWG2Intervals_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG2Intervals.Clear();
        }

        private void metroTextBoxWG2NiceRepetitions_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG2NiceRepetitions.Clear();
        }

        private void metroTextBoxWG2ScoreEnding_Enter(object sender, EventArgs e)
        {
            metroTextBoxWG2ScoreEnding.Clear();
        }

        private void metroTextBoxWG1InterestingPatterns1_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG1InterestingPatterns1.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG1InterestingPatterns1 = value;
                metroTextBoxWG1InterestingPatterns1.Text = value.ToString();
            }
        }

        private void metroTextBoxWG1SelfHarm1_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG1SelfHarm1.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG1SelfHarm1 = value;
                metroTextBoxWG1SelfHarm1.Text = value.ToString();
            }
        }

        private void metroTextBoxWG1SelfHarm2_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG1SelfHarm2.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG1SelfHarm2 = value;
                metroTextBoxWG1SelfHarm2.Text = value.ToString();
            }
        }

        private void metroTextBoxweG1ABA_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxweG1ABA.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                weG1ABA = value;
                metroTextBoxweG1ABA.Text = value.ToString();
            }
        }

        private void metroTextBoxWG1RitmicLeitmotif_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG1RitmicLeitmotif.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG1RitmicLeitmotif = value;
                metroTextBoxWG1RitmicLeitmotif.Text = value.ToString();
            }
        }

        private void metroTextBoxWG1AttWave1_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG1AttWave1.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG1AttWave1 = value;
                metroTextBoxWG1AttWave1.Text = value.ToString();
            }
        }

        private void metroTextBoxWG1AttWave2_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG1AttWave2.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG1AttWave2 = value;
                metroTextBoxWG1AttWave2.Text = value.ToString();
            }
        }

        private void metroTextBoxWG1Range_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG1Range.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG1Range = value;
                metroTextBoxWG1Range.Text = value.ToString();
            }
        }

        private void metroTextBoxWG1Scale_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG1Scale.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG1Scale = value;
                metroTextBoxWG1Scale.Text = value.ToString();
            }
        }

        private void metroTextBoxWG1PauseProlongation_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG1PauseProlongation.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG1PauseProlongation = value;
                metroTextBoxWG1PauseProlongation.Text = value.ToString();
            }
        }

        private void metroTextBoxWG1ReduceRepetitions_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG1ReduceRepetitions.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG1ReduceRepetitions = value;
                metroTextBoxWG1ReduceRepetitions.Text = value.ToString();
            }
        }

        private void metroTextBoxWG1Interval_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG1Interval.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG1Intervals = value;
                metroTextBoxWG1Interval.Text = value.ToString();
            }
        }

        private void metroTextBoxWG1NiceRepetitions_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG1NiceRepetitions.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG1NiceRepetitions = value;
                metroTextBoxWG1NiceRepetitions.Text = value.ToString();
            }
        }

        private void metroTextBoxWG1ScoreEnding_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG1ScoreEnding.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG1ScoreEnding = value;
                metroTextBoxWG1ScoreEnding.Text = value.ToString();
            }
        }

        private void metroTextBoxWG2InterestingPatterns1_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG2InterestingPatterns1.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG2InterestingPatterns1 = value;
                metroTextBoxWG2InterestingPatterns1.Text = value.ToString();
            }
        }

        private void metroTextBoxWG2SelfHarm1_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG2SelfHarm1.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG2SelfHarm1 = value;
                metroTextBoxWG2SelfHarm1.Text = value.ToString();
            }
        }

        private void metroTextBoxWG2SelfHarm2_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG2SelfHarm2.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG2SelfHarm2 = value;
                metroTextBoxWG2SelfHarm2.Text = value.ToString();
            }
        }

        private void metroTextBoxweG2ABA_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxweG2ABA.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                weG2ABA = value;
                metroTextBoxweG2ABA.Text = value.ToString();
            }
        }

        private void metroTextBoxWG2RitmicLeitmotif_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG2RitmicLeitmotif.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG2RitmicLeitmotif = value;
                metroTextBoxWG2RitmicLeitmotif.Text = value.ToString();
            }
        }

        private void metroTextBoxWG2AttWave1_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG2AttWave1.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG2AttWave1 = value;
                metroTextBoxWG2AttWave1.Text = value.ToString();
            }
        }

        private void metroTextBoxWG2AttWave2_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG2AttWave2.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG2AttWave2 = value;
                metroTextBoxWG2AttWave2.Text = value.ToString();
            }
        }

        private void metroTextBoxWG2Range_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG2Range.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG2Range = value;
                metroTextBoxWG2Range.Text = value.ToString();
            }
        }

        private void metroTextBoxWG2Scale_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG2Scale.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG2Scale = value;
                metroTextBoxWG2Scale.Text = value.ToString();
            }
        }

        private void metroTextBoxWG2PauseProlongation_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG2PauseProlongation.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG2PauseProlongation = value;
                metroTextBoxWG2PauseProlongation.Text = value.ToString();
            }
        }

        private void metroTextBoxWG2ReduceRepetitions_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG2ReduceRepetitions.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG2ReduceRepetitions = value;
                metroTextBoxWG2ReduceRepetitions.Text = value.ToString();
            }
        }

        private void metroTextBoxWG2Intervals_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG2Intervals.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG2Intervals = value;
                metroTextBoxWG2Intervals.Text = value.ToString();
            }
        }

        private void metroTextBoxWG2NiceRepetitions_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG2NiceRepetitions.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG2NiceRepetitions = value;
                metroTextBoxWG2NiceRepetitions.Text = value.ToString();
            }
        }

        private void metroTextBoxWG2ScoreEnding_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWG2ScoreEnding.Text, out value))
            {
                if (value < 0 || value > (200)) { value = 1; }

                wG2ScoreEnding = value;
                metroTextBoxWG2ScoreEnding.Text = value.ToString();
            }
        }

        private void metroTextBoxWave1PeriodsPM_Click(object sender, EventArgs e)
        {
            metroTextBoxWave1PeriodsPM.Clear();
        }

        private void metroTextBoxWave1MeanValue_Click(object sender, EventArgs e)
        {
            metroTextBoxWave1MeanValue.Clear();
        }

        private void metroTextBoxWave1Amplitude_Click(object sender, EventArgs e)
        {
            metroTextBoxWave1Amplitude.Clear();
        }

        private void metroTextBoxWave1HalfToneAttractions_Click(object sender, EventArgs e)
        {
            metroTextBoxWave1HalfToneAttractions.Clear();
        }

        private void metroTextBoxWave2PeriodsPM_Click(object sender, EventArgs e)
        {
            metroTextBoxWave2PeriodsPM.Clear();
        }

        private void metroTextBoxWave2MeanValue_Click(object sender, EventArgs e)
        {
            metroTextBoxWave2MeanValue.Clear();
        }

        private void metroTextBoxWave2Amplitude_Click(object sender, EventArgs e)
        {
            metroTextBoxWave2Amplitude.Clear();
        }

        private void metroTextBoxWave2HalfToneAttractions_Click(object sender, EventArgs e)
        {
            metroTextBoxWave2HalfToneAttractions.Clear();
        }

        private void metroTextBoxWave1PeriodsPM_Enter(object sender, EventArgs e)
        {
            metroTextBoxWave1PeriodsPM.Clear();
        }

        private void metroTextBoxWave1MeanValue_Enter(object sender, EventArgs e)
        {
            metroTextBoxWave1MeanValue.Clear();
        }

        private void metroTextBoxWave1Amplitude_Enter(object sender, EventArgs e)
        {
            metroTextBoxWave1Amplitude.Clear();
        }

        private void metroTextBoxWave1HalfToneAttractions_Enter(object sender, EventArgs e)
        {
            metroTextBoxWave1HalfToneAttractions.Clear();
        }

        private void metroTextBoxWave2PeriodsPM_Enter(object sender, EventArgs e)
        {
            metroTextBoxWave2PeriodsPM.Clear();
        }

        private void metroTextBoxWave2MeanValue_Enter(object sender, EventArgs e)
        {
            metroTextBoxWave2MeanValue.Clear();
        }

        private void metroTextBoxWave2Amplitude_Enter(object sender, EventArgs e)
        {
            metroTextBoxWave2Amplitude.Clear();
        }

        private void metroTextBoxWave2HalfToneAttractions_Enter(object sender, EventArgs e)
        {
            metroTextBoxWave2HalfToneAttractions.Clear();
        }

        private void metroTextBoxWave1PeriodsPM_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWave1PeriodsPM.Text, out value))
            {
                if (value < 0.001 || value > (16)) { value = 1; }

                w1OscillationsPerMeasure = value;
                metroTextBoxWave1PeriodsPM.Text = value.ToString();
            }
        }

        private void metroTextBoxWave1MeanValue_Leave(object sender, EventArgs e)
        {
            int value;
            if (int.TryParse(metroTextBoxWave1MeanValue.Text, out value))
            {
                if (value < -24 || value > (24)) { value = 0; }

                w1MeanValue = value + confValues.GetGene_A4();
                metroTextBoxWave1MeanValue.Text = value.ToString();
            }
        }

        private void metroTextBoxWave1Amplitude_Leave(object sender, EventArgs e)
        {
            int value;
            if (int.TryParse(metroTextBoxWave1Amplitude.Text, out value))
            {
                if (value < 0 || value > (24)) { value = 1; }

                w1Amplitude = value;
                metroTextBoxWave1Amplitude.Text = value.ToString();
            }
        }

        private void metroTextBoxWave1HalfToneAttractions_Leave(object sender, EventArgs e)
        {
            int value;
            if (int.TryParse(metroTextBoxWave1HalfToneAttractions.Text, out value))
            {
                if (value < 0 || value > (24)) { value = 2; }

                w1ThresholdAttractor = value;
                metroTextBoxWave1HalfToneAttractions.Text = value.ToString();
            }
        }

        private void metroTextBoxWave2PeriodsPM_Leave(object sender, EventArgs e)
        {
            float value;
            if (float.TryParse(metroTextBoxWave2PeriodsPM.Text, out value))
            {
                if (value < 0.001 || value > (16)) { value = 1; }

                w2OscillationsPerMeasure = value;
                metroTextBoxWave2PeriodsPM.Text = value.ToString();
            }
        }

        private void metroTextBoxWave2MeanValue_Leave(object sender, EventArgs e)
        {
            int value;
            if (int.TryParse(metroTextBoxWave2MeanValue.Text, out value))
            {
                if (value < -24 || value > (24)) { value = 0; }

                w2MeanValue = value + confValues.GetGene_A4();
                metroTextBoxWave2MeanValue.Text = value.ToString();
            }
        }

        private void metroTextBoxWave2Amplitude_Leave(object sender, EventArgs e)
        {
            int value;
            if (int.TryParse(metroTextBoxWave2Amplitude.Text, out value))
            {
                if (value < -50 || value > (50)) { value = 0; }

                w2Amplitude = value;
                metroTextBoxWave2Amplitude.Text = value.ToString();
            }
        }

        private void metroTextBoxWave2HalfToneAttractions_Leave(object sender, EventArgs e)
        {
            int value;
            if (int.TryParse(metroTextBoxWave2HalfToneAttractions.Text, out value))
            {
                if (value < 0 || value > (24)) { value = 0; }

                w2ThresholdAttractor = value;
                metroTextBoxWave2HalfToneAttractions.Text = value.ToString();
            }
        }

        private void metroPanel3_Click(object sender, EventArgs e)
        {

        }

        private void metroTrackBarMutationPercent_Scroll(object sender, ScrollEventArgs e)
        {
            mutationFactor = (metroTrackBarMutationPercent.Value / 100.0f);
            var mutationToShow = mutationFactor * 100;
            metroLabel46.Text = "Mutation: " + mutationToShow.ToString() + "%";
        }

        private void metroLabel45_Click(object sender, EventArgs e)
        {

        }

        private void metroTextBoxWave1HorizontalShift_Click(object sender, EventArgs e)
        {
            metroTextBoxWave1HorizontalShift.Clear();
        }

        private void metroTextBoxWave1HorizontalShift_Enter(object sender, EventArgs e)
        {
            metroTextBoxWave1HorizontalShift.Clear();
        }

        private void metroTextBoxWave1HorizontalShift_Leave(object sender, EventArgs e)
        {
            int value;
            if (int.TryParse(metroTextBoxWave1HorizontalShift.Text, out value))
            {
                w1HorizontalShift = value;
                metroTextBoxWave1HorizontalShift.Text = value.ToString();
            }
        }

        private void metroTextBoxWave2HorizontalShift_Click(object sender, EventArgs e)
        {
            metroTextBoxWave2HorizontalShift.Clear();
        }

        private void metroTextBoxWave2HorizontalShift_Enter(object sender, EventArgs e)
        {
            metroTextBoxWave2HorizontalShift.Clear();
        }

        private void metroTextBoxWave2HorizontalShift_Leave(object sender, EventArgs e)
        {
            int value;
            if (int.TryParse(metroTextBoxWave2HorizontalShift.Text, out value))
            {

                w2HorizontalShift = value;
                metroTextBoxWave2HorizontalShift.Text = value.ToString();
            }
        }
    }
}
