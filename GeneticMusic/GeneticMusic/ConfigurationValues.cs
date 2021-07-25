using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GeneticMusic
{
    class ConfigurationValues
    {
        /// <summary>
        /// Configuration Variables
        /// 
        /// 

        private long limitSeconds;      //Confição de terminação em segundos
        private byte smallestTimeUnitUsed;
        private byte OffsetForA4;       //Correcção devido ao facto de onde o PC julga ter mapeado o Lá 4
        private byte gene_A4;
        private byte gene_higherNote;
        private byte gene_pause;
        private byte gene_prolongation;
        // notas por compasso * número de compassos
        private int lenghtSequence;

        // Definições para a linha melódica. Selecção da escala: CM / Am = 0, FM/Dm = 11
        private byte chromosome_scale;
        private bool scaleInMajorMode = false;
        public readonly static bool[,] chromosome_possible_scales = new bool[,]{
     // { C  ,C#/Db,  D ,D#/Eb, E  ,  F ,F#/Gb, G  ,G#/Ab,  A ,A#/Bb, B  }
        {true,false,true,false,true,true,false,true,false,true,false,true},//CM/ An
        {true,false,true,false,true,false,true,true,false,true,false,true},//GM/ Em
        {false,true,true,false,true,false,true,true,false,true,false,true},//DM/Bm
        {false,true,true,false,true,false,true,false,true,true,false,true},//AM/F#m
        {false,true,false,true,true,false,true,false,true,true,false,true},//EM/C#m
        {false,true,false,true,true,false,true,false,true,false,true,true},//BM/CbM/G#m
        {false,true,false,true,false,true,true,false,true,false,true,true},//F#M/GbM/Ebm/D#m
        {true,true,false,true,false,true,true,false,true,false,true,false},//DbM/Bbm
        {true,true,false,true,false,true,false,true,true,false,true,false},//AbM/Fm
        {true,false,true,true,false,true,false,true,true,false,true,false},//EbM/Cm
        {true,false,true,true,false,true,false,true,false,true,true,false},//BbM/Gm
        {true,false,true,false,true,true,false,true,false,true,true,false}};//FM/Dm


        public double[] lowestValuesSequence;
        private double[] highestValuesSequence;
        private int[] numberOfBitsSequence;
        private int[] decimalsSequence;

        // Variáveis Adicionais Algorítmos
        private float groupPercentDivision = 10;
        private float wG1InterestingPatterns1 = 2.9f;
        public void SetWG1InterestingPatterns1(float var) { wG1InterestingPatterns1 = var; }
        public float GetWG1InterestingPatterns1() { return wG1InterestingPatterns1; }
        private float wG1SelfHarm1 = 3f;
        public void SetWG1SelfHarm1(float var) { wG1SelfHarm1 = var; }
        public float GetWG1SelfHarm1() { return wG1SelfHarm1; }
        private float wG1SelfHarm2 = 3f;
        public void SetWG1SelfHarm2(float var) { wG1SelfHarm2 = var; }
        public float GetWG1SelfHarm2() { return wG1SelfHarm2; }
        private float weG1ABA = 10f;
        public void SetWeG1ABA(float var) { weG1ABA = var; }
        public float GetWeG1ABA() { return weG1ABA; }
        private float wG1RitmicLeitmotif = 10;
        public void SetWG1RitmicLeitmotif(float var) { wG1RitmicLeitmotif = var; }
        public float GetWG1RitmicLeitmotif() { return wG1RitmicLeitmotif; }
        private float wG1AttWave1 = 10;
        public void SetWG1AttWave1(float var) { wG1AttWave1 = var; }
        public float GetWG1AttWave1() { return wG1AttWave1; }
        private float wG1AttWave2 = 5;
        public void SetWG1AttWave2(float var) { wG1AttWave2 = var; }
        public float GetWG1AttWave2() { return wG1AttWave2; }
        private float wG1Range = 4;
        public void SetWG1Range(float var) { wG1Range = var; }
        public float GetWG1Range() { return wG1Range; }
        private float wG1Scale = 10;
        public void SetWG1Scale(float var) { wG1Scale = var; }
        public float GetWG1Scale() { return wG1Scale; }
        private float wG1PauseProlongation = 10.51f;
        public void SetWG1PauseProlongation(float var) { wG1PauseProlongation = var; }
        public float GetWG1PauseProlongation() { return wG1PauseProlongation; }
        private float wG1ReduceRepetitions = 2;
        public void SetWG1ReduceRepetitions(float var) { wG1ReduceRepetitions = var; }
        public float GetWG1ReduceRepetitions() { return wG1ReduceRepetitions; }
        private float wG1Intervals = 3;
        public void SetWG1Intervals(float var) { wG1Intervals = var; }
        public float GetWG1Intervals() { return wG1Intervals; }
        private float wG1NiceRepetitions = 2;
        public void SetWG1NiceRepetitions(float var) { wG1NiceRepetitions = var; }
        public float GetWG1NiceRepetitions() { return wG1NiceRepetitions; }
        private float wG1ScoreEnding = 2;
        public void SetWG1ScoreEnding(float var) { wG1ScoreEnding = var; }
        public float GetWG1ScoreEnding() { return wG1ScoreEnding; }

        private float wG2InterestingPatterns1 = 4.02f;
        public void SetWG2InterestingPatterns1(float var) { wG2InterestingPatterns1 = var; }
        public float GetWG2InterestingPatterns1() { return wG2InterestingPatterns1; }
        private float wG2SelfHarm1 = 3f;
        public void SetWG2SelfHarm1(float var) { wG2SelfHarm1 = var; }
        public float GetWG2SelfHarm1() { return wG2SelfHarm1; }
        private float wG2SelfHarm2 = 3f;
        public void SetWG2SelfHarm2(float var) { wG2SelfHarm2 = var; }
        public float GetWG2SelfHarm2() { return wG2SelfHarm2; }
        private float weG2ABA = 20f;
        public void SetWeG2ABA(float var) { weG2ABA = var; }
        public float GetWeG2ABA() { return weG2ABA; }
        private float wG2RitmicLeitmotif = 10;
        public void SetWG2RitmicLeitmotif(float var) { wG2RitmicLeitmotif = var; }
        public float GetWG2RitmicLeitmotif() { return wG2RitmicLeitmotif; }
        private float wG2AttWave1 = 30.1f;
        public void SetWG2AttWave1(float var) { wG2AttWave1 = var; }
        public float GetWG2AttWave1() { return wG2AttWave1; }
        private float wG2AttWave2 = 2;
        public void SetWG2AttWave2(float var) { wG2AttWave2 = var; }
        public float GetWG2AttWave2() { return wG2AttWave2; }
        private float wG2Range = 20;
        public void SetWG2Range(float var) { wG2Range = var; }
        public float GetWG2Range() { return wG2Range; }
        private float wG2Scale = 10;
        public void SetWG2Scale(float var) { wG2Scale = var; }
        public float GetWG2Scale() { return wG2Scale; }
        private float wG2PauseProlongation = 10.02f;
        public void SetWG2PauseProlongation(float var) { wG2PauseProlongation = var; }
        public float GetWG2PauseProlongation() { return wG2PauseProlongation; }
        private float wG2ReduceRepetitions = 3;
        public void SetWG2ReduceRepetitions(float var) { wG2ReduceRepetitions = var; }
        public float GetWG2ReduceRepetitions() { return wG2ReduceRepetitions; }
        private float wG2Intervals = 3;
        public void SetWG2Intervals(float var) { wG2Intervals = var; }
        public float GetWG2Intervals() { return wG2Intervals; }
        private float wG2NiceRepetitions = 1.05f;
        public void SetWG2NiceRepetitions(float var) { wG2NiceRepetitions = var; }
        public float GetWG2NiceRepetitions() { return wG2NiceRepetitions; }
        private float wG2ScoreEnding = 2;
        public void SetWG2ScoreEnding(float var) { wG2ScoreEnding = var; }
        public float GetWG2ScoreEnding() { return wG2ScoreEnding; }

        // Wave Attractors
        private int w1ThresholdAttractor = 3;
        public int GetW1ThresholdAttractor() { return w1ThresholdAttractor; }
        public void SetW1ThresholdAttractor(int var) { w1ThresholdAttractor = var; }
        private int w2ThresholdAttractor = 2;
        public int GetW2ThresholdAttractor() { return w2ThresholdAttractor; }
        public void SetW2ThresholdAttractor(int var) { w2ThresholdAttractor = var; }
        private float w1OscillationsPerMeasure = 0.5f;
        public float GetW1OscillationsPerMeasure() { return w1OscillationsPerMeasure; }
        public void SetW1OscillationsPerMeasure(float var) { w1OscillationsPerMeasure = var; }
        private float w2OscillationsPerMeasure = 2;
        public float GetW2OscillationsPerMeasure() { return w2OscillationsPerMeasure; }
        public void SetW2OscillationsPerMeasure(float var) { w2OscillationsPerMeasure = var; }
        private int w1Amplitude = 12;
        public int GetW1Amplitude() { return w1Amplitude; }
        public void SetW1Amplitude(int var) { w1Amplitude = var; }
        private int w2Amplitude = 4;
        public int GetW2Amplitude() { return w2Amplitude; }
        public void SetW2Amplitude(int var) { w2Amplitude = var; }
        private int w1MeanValue = 37;
        public int GetW1MeanValue() { return w1MeanValue; }
        public void SetW1MeanValue(int var) { w1MeanValue = var; }
        private int w2MeanValue = 37 - 7;
        public int GetW2MeanValue() { return w2MeanValue; }
        public void SetW2MeanValue(int var) { w2MeanValue = var; }

        private int w1HorizontalShift = 0;
        public int GetW1HorizontalShift() { return w1HorizontalShift; }
        public void SetW1HorizontalShift(int var) { w1HorizontalShift = var; }
        private int w2HorizontalShift = 0;
        public int GetW2HorizontalShift() { return w2HorizontalShift; }
        public void SetW2HorizontalShift(int var) { w2HorizontalShift = var; }

        /// Construtores

        public ConfigurationValues()
        {
            smallestTimeUnitUsed = (byte)MidiFile.SEMIQUAVER;
            OffsetForA4 = 69;       //Correcção devido ao facto de onde o PC julga ter mapeado o Lá 4
            gene_A4 = 37;
            gene_higherNote = 73;
            gene_pause = 0;
            gene_prolongation = 74;
            // notas por compasso * número de compassos
            lenghtSequence = 16 * 8;
            limitSeconds = 5 * 60;

            // Definições para a linha melódica. Selecção da escala: CM / Am = 0, FM/Dm = 11
            chromosome_scale = 3;
            scaleInMajorMode = false;

            lowestValuesSequence = new double[lenghtSequence];
            highestValuesSequence = new double[lenghtSequence];
            numberOfBitsSequence = new int[lenghtSequence];
            decimalsSequence = new int[lenghtSequence];
        }

        //Métodos Set

        public void SetlowestValuesSequence(int valueToSet, int index) { lowestValuesSequence[index] = valueToSet; }
        public void SethighestValuesSequence(int valueToSet, int index) { lowestValuesSequence[index] = valueToSet; }
        public void SetnumberOfBitsSequence(int valueToSet, int index) { lowestValuesSequence[index] = valueToSet; }
        public void SetdecimalsSequence(int valueToSet, int index) { lowestValuesSequence[index] = valueToSet; }
        public void SetLimitSeconds(long seconds) { limitSeconds = seconds; }
        public void SetChromosome_scale(byte nr) { chromosome_scale = nr; }
        public void SetScaleInMode(bool mode) { scaleInMajorMode = mode; }

        public void SetNumberOfMeasures(int number)
        {
            lenghtSequence = 16 * number;
            lowestValuesSequence = new double[lenghtSequence];
            highestValuesSequence = new double[lenghtSequence];
            numberOfBitsSequence = new int[lenghtSequence];
            decimalsSequence = new int[lenghtSequence];
            InitializePopulationParameters();
        }

        public void SetPercentGroupTime(float value) { groupPercentDivision = value; }



        //Métodos Get
        public byte GetGene_pause() { return gene_pause; }
        public byte GetGene_prolongation() { return gene_prolongation; }
        public byte GetGene_higherNot() { return gene_higherNote; }
        public byte GetGene_A4() { return gene_A4; }
        public byte GetOffsetForA4() { return OffsetForA4; }
        public byte GetSmallestTimeUnitUsed() { return smallestTimeUnitUsed; }
        public long GetLimitSeconds() { return limitSeconds; }
        public byte GetChromosome_scale() { return chromosome_scale; }
        public bool GetscaleInMajorMode() { return scaleInMajorMode; }
        public int GetLenghtSequence() { return lenghtSequence; }
        public int GetNumberOfTabs() { return (lenghtSequence / 16); }
        public float GetPercentGroupTime() { return groupPercentDivision; }


        public double GetLowestValuesSequence(int index) { return lowestValuesSequence[index]; }
        public double GetHighestValuesSequence(int index) { return highestValuesSequence[index]; }
        public int GetNumberOfBitsSequence(int index) { return numberOfBitsSequence[index]; }
        public int GetDecimalsSequence(int index) { return decimalsSequence[index]; }


        public double[] GetLowestValuesSequence() { return lowestValuesSequence; }
        public double[] GetHighestValuesSequence() { return highestValuesSequence; }
        public int[] GetNumberOfBitsSequence() { return numberOfBitsSequence; }
        public int[] GetDecimalsSequence() { return decimalsSequence; }

        // Métodos não estáticos

        public void InitializePopulationParameters()
        {
            for (int i = 0; i < lenghtSequence; i++)
            {
                lowestValuesSequence[i] = gene_pause;
                highestValuesSequence[i] = gene_prolongation;
                numberOfBitsSequence[i] = 8;
                decimalsSequence[i] = 0;
            }
        }



        // Static Methods

        public static int TranslateChromosomeToMidiSequence(byte[] chromosomeSec, byte pause, byte prolongation)
        {// Colocamos o j sempre no spot onde está a nova nota. Caso prolongue, não avança
            int j, i;
            for (i = 0, j = 0; i < chromosomeSec.Length - 1; i += 2)
            {
                if (chromosomeSec[i] == pause)
                {
                    j += 2;
                }
                else if (i > 0 && chromosomeSec[i] >= prolongation)
                {
                    ;
                }
                else
                {
                    j += 2;
                }

            }
            return j;
        }

        public static int TranslateChromosomeToMidiSequence(byte[] chromosomeSec, int[] midiSeq, byte pause, byte prolongation, byte offset, byte A4)
        {// Colocamos o j sempre no spot onde está a nova nota. Caso prolongue, não avança
            int i, j;
            for (i = 0, j = 0; i < chromosomeSec.Length - 1; i += 2)
            {
                if (chromosomeSec[i] == pause)
                {//em caso de pausa, é colocado a -1 e o valor seguinte com o tempo de pausa
                    midiSeq[j] = -1;
                    midiSeq[j + 1] = chromosomeSec[i + 1];
                    j += 2;
                }
                else if (i > 0 && chromosomeSec[i] >= prolongation)
                {
                    midiSeq[j - 1] += chromosomeSec[i + 1];
                }
                else
                {
                    midiSeq[j] = chromosomeSec[i] + (offset - A4);
                    midiSeq[j + 1] = chromosomeSec[i + 1];
                    j += 2;
                }

            }
            return j;
        }

        public static void createRandomSequence(byte[] sequenceToInitiate, int minSec, int maxSec)
        {

            Random rand = new Random();
            for (int i = 0; i < sequenceToInitiate.Length - 1; i += 2)
            {
                //Nota , Tempo
                sequenceToInitiate[i] = (byte)rand.Next(minSec, maxSec + 1);
                sequenceToInitiate[i + 1] = (byte)MidiFile.SEMIQUAVER;
            }
        }

        public static void createMidiFile(byte[] ChromosomeSequence, string MidiFileName, string path, byte pause, byte prolongation, byte offset, byte A4)
        {
            MidiFile mif = new MidiFile();
            // Output dos resultados
            // Cria o vector de inteiros a ser convertido para MIDI
            int size = TranslateChromosomeToMidiSequence(ChromosomeSequence, pause, prolongation);
            int[] chromoMidi = new int[size];
            TranslateChromosomeToMidiSequence(ChromosomeSequence, chromoMidi, pause, prolongation, offset, A4);
            mif.noteSequenceFixedVelocity(chromoMidi, 127);
            mif.writeToFile(path + "\\" + MidiFileName + ".mid");
        }



    }
}
