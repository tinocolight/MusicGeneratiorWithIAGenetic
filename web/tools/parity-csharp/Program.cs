// Parity harness: runs the ORIGINAL private rules of AlgorithmFitness.cs on genomes given
// by the JS test-suite and prints their scores, so the JavaScript port can be checked
// rule by rule. Each rule is executed several times because the C# rules accumulate inside
// Parallel.For without locks (the spread between repetitions exposes the data race).
//
//   dotnet run -- input.json output.json [repeats]
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using GeneticMusic;
using GeneticSharp.Domain.Chromosomes;

namespace GeneticMusicSequential
{
    using GeneticMusic;
    static class SequentialLoop
    {
        public static void For(int from, int to, Action<int> body) { for (int i = from; i < to; i++) body(i); }
    }
}

static class Program
{
    static readonly BindingFlags Priv = BindingFlags.NonPublic | BindingFlags.Instance;

    static int Main(string[] args)
    {
        if (args.Length > 0 && args[0] == "run") return RunOriginalGA(args);
        var genomes = JsonSerializer.Deserialize<List<double[]>>(File.ReadAllText(args[0]));
        int repeats = args.Length > 2 ? int.Parse(args[2]) : 10;

        var conf = new ConfigurationValues();
        conf.SetNumberOfMeasures(8);
        conf.SetChromosome_scale(1);   // G / Em (Form1 default)
        conf.SetScaleInMode(true);
        // wave 2 amplitude stays 4: Form1's constructor calls GetWaveParameters(), which copies the
        // ConfigurationValues default (4) over the field initialiser (5)

        // 1st instance, exactly like the first click on "Run" in Form1
        var first = new AlgorithmFitness(conf);
        var chromosome = new FloatingPointChromosome(conf.GetLowestValuesSequence(), conf.GetHighestValuesSequence(),
                                                     conf.GetNumberOfBitsSequence(), conf.GetDecimalsSequence());
        first.Evaluate(chromosome);
        int[] firstWave1 = (int[])typeof(AlgorithmFitness).GetField("onda1", Priv).GetValue(first);
        int[] firstWave2 = (int[])typeof(AlgorithmFitness).GetField("onda2", Priv).GetValue(first);

        // 2nd instance (second click): static length already set, waves are right
        var fit = new AlgorithmFitness(conf);
        fit.Evaluate(chromosome);   // initialises the waves, currentIteration = 1
        int[] wave1 = (int[])typeof(AlgorithmFitness).GetField("onda1", Priv).GetValue(fit);
        int[] wave2 = (int[])typeof(AlgorithmFitness).GetField("onda2", Priv).GetValue(fit);

        Func<string, object[], float> call = (name, a) =>
        {
            var m = typeof(AlgorithmFitness).GetMethod(name, Priv);
            return Convert.ToSingle(m.Invoke(fit, a));
        };

        var grid = ConfigurationValues.chromosome_possible_scales;
        var rules = new (string key, Func<double[], float> f)[]
        {
            ("rhythmicPatterns", s => call("EvaluateInterestingRitmicPatterns", new object[] { s, 16 })),
            ("selfHarm1", s => call("ScoreMSelfHarmonizationPreviousMeasures", new object[] { s, 16, 1, 128 })),
            ("selfHarm2", s => call("ScoreMSelfHarmonizationPreviousMeasures", new object[] { s, 16, 2, 128 })),
            ("aba", s => call("ScoreMetricRepetitionsABA", new object[] { s, 16, 4, false })),
            ("leitmotif", s => call("ScoreRitmicRepetitions", new object[] { s, 16, 0, 1, false })),
            ("wave1", s => call("AttractorWave", new object[] { s, 3, wave1, 600 })),
            ("wave2", s => call("AttractorWave", new object[] { s, 2, wave2, 600 })),
            ("range", s => call("EvaluateRange", new object[] { s, 15, 600 })),
            ("scale", s => call("EvaluateScale", new object[] { s, (byte)1, grid, (byte)37 })),
            ("pauseProlongation", s => call("EvaluatePauseAndProlongation", new object[] { s })),
            ("reduceRepetitions", s => call("EvaluateExcessiveRepetitions", new object[] { s })),
            ("intervals", s => call("EvaluateIntervals", new object[] { s })),
            ("niceRepetitions", s => call("EvaluateInterestingRepetitions", new object[] { s })),
            ("ending", s => call("ScoreTerminationQualifyers", new object[] { s, 128 })),
            ("balance", s => call("ScoreBalance", new object[] { s, 7f, 40f })),
        };

        // Same rules, sequential twin (no data race): must match the JS port exactly.
        var seq = new GeneticMusicSequential.AlgorithmFitness(conf);
        seq.Evaluate(chromosome);
        Func<string, object[], float> callSeq = (name, a) =>
        {
            var m = typeof(GeneticMusicSequential.AlgorithmFitness).GetMethod(name, Priv);
            return Convert.ToSingle(m.Invoke(seq, a));
        };
        int[] seqWave1 = (int[])typeof(GeneticMusicSequential.AlgorithmFitness).GetField("onda1", Priv).GetValue(seq);
        int[] seqWave2 = (int[])typeof(GeneticMusicSequential.AlgorithmFitness).GetField("onda2", Priv).GetValue(seq);
        var seqRules = new (string key, Func<double[], float> f)[]
        {
            ("rhythmicPatterns", s => callSeq("EvaluateInterestingRitmicPatterns", new object[] { s, 16 })),
            ("selfHarm1", s => callSeq("ScoreMSelfHarmonizationPreviousMeasures", new object[] { s, 16, 1, 128 })),
            ("selfHarm2", s => callSeq("ScoreMSelfHarmonizationPreviousMeasures", new object[] { s, 16, 2, 128 })),
            ("aba", s => callSeq("ScoreMetricRepetitionsABA", new object[] { s, 16, 4, false })),
            ("leitmotif", s => callSeq("ScoreRitmicRepetitions", new object[] { s, 16, 0, 1, false })),
            ("wave1", s => callSeq("AttractorWave", new object[] { s, 3, wave1, 600 })),
            ("wave2", s => callSeq("AttractorWave", new object[] { s, 2, wave2, 600 })),
            ("range", s => callSeq("EvaluateRange", new object[] { s, 15, 600 })),
            ("scale", s => callSeq("EvaluateScale", new object[] { s, (byte)1, grid, (byte)37 })),
            ("pauseProlongation", s => callSeq("EvaluatePauseAndProlongation", new object[] { s })),
            ("reduceRepetitions", s => callSeq("EvaluateExcessiveRepetitions", new object[] { s })),
            ("intervals", s => callSeq("EvaluateIntervals", new object[] { s })),
            ("niceRepetitions", s => callSeq("EvaluateInterestingRepetitions", new object[] { s })),
            ("ending", s => callSeq("ScoreTerminationQualifyers", new object[] { s, 128 })),
            ("balance", s => callSeq("ScoreBalance", new object[] { s, 7f, 40f })),
        };
        var sequential = genomes.Select(g => seqRules.ToDictionary(r => r.key, r => r.f(g))).ToList();

        var results = new List<Dictionary<string, float[]>>();
        foreach (var g in genomes)
        {
            var row = new Dictionary<string, float[]>();
            foreach (var (key, f) in rules)
                row[key] = Enumerable.Range(0, repeats).Select(_ => f(g)).ToArray();
            results.Add(row);
        }

        var output = new Dictionary<string, object>
        {
            ["processorCount"] = Environment.ProcessorCount,
            ["firstRunWave1"] = firstWave1,
            ["firstRunWave2"] = firstWave2,
            ["wave1"] = wave1,
            ["wave2"] = wave2,
            ["results"] = results,
            ["sequential"] = sequential,
            ["sequentialFirstRunWave1"] = seqWave1,
            ["sequentialWave2"] = seqWave2,
        };
        File.WriteAllText(args[1], JsonSerializer.Serialize(output));
        return 0;
    }

    // Runs the ORIGINAL genetic algorithm exactly as Form1.metroButton1_Click does
    // (GeneticSharp 2.6: EliteSelection, UniformCrossover, PartialShuffleMutation, population 60,
    // mutation 0.1, time termination, Form1 default weights), several times in one process so the
    // first run carries the "wave 1 = 0" bug and the following ones do not.
    //   dotnet run -- run <seconds> <runs> out.json
    static int RunOriginalGA(string[] args)
    {
        int seconds = int.Parse(args[1]);
        int runs = int.Parse(args[2]);
        var outputs = new List<Dictionary<string, object>>();
        for (int r = 0; r < runs; r++)
        {
            var conf = new ConfigurationValues();
            conf.InitializePopulationParameters();
            conf.SetLimitSeconds(seconds);
            conf.SetChromosome_scale(1);
            conf.SetScaleInMode(true);
            conf.SetNumberOfMeasures(8);
            conf.SetPercentGroupTime(25);
            // Form1 field defaults (UpdateConfigurationValues)
            conf.SetWG1InterestingPatterns1(10f); conf.SetWG1SelfHarm1(1f); conf.SetWG1SelfHarm2(4f); conf.SetWeG1ABA(0.5f);
            conf.SetWG1RitmicLeitmotif(12f); conf.SetWG1AttWave1(3); conf.SetWG1AttWave2(2); conf.SetWG1Range(42);
            conf.SetWG1Scale(12); conf.SetWG1PauseProlongation(4.5f); conf.SetWG1ReduceRepetitions(2); conf.SetWG1Intervals(12);
            conf.SetWG1NiceRepetitions(10); conf.SetWG1ScoreEnding(2);
            conf.SetWG2InterestingPatterns1(7.02f); conf.SetWG2SelfHarm1(2f); conf.SetWG2SelfHarm2(4f); conf.SetWeG2ABA(0.5f);
            conf.SetWG2RitmicLeitmotif(16f); conf.SetWG2AttWave1(3.1f); conf.SetWG2AttWave2(2.15f); conf.SetWG2Range(42);
            conf.SetWG2Scale(16); conf.SetWG2PauseProlongation(4f); conf.SetWG2ReduceRepetitions(2); conf.SetWG2Intervals(14);
            conf.SetWG2NiceRepetitions(10.05f); conf.SetWG2ScoreEnding(2);

            var fitness = new AlgorithmFitness(conf);
            var chromosome = new FloatingPointChromosome(conf.GetLowestValuesSequence(), conf.GetHighestValuesSequence(),
                                                         conf.GetNumberOfBitsSequence(), conf.GetDecimalsSequence());
            var population = new GeneticSharp.Domain.Populations.Population(60, 999, chromosome);
            var ga = new GeneticSharp.Domain.GeneticAlgorithm(population, fitness,
                new GeneticSharp.Domain.Selections.EliteSelection(),
                new GeneticSharp.Domain.Crossovers.UniformCrossover(),
                new GeneticSharp.Domain.Mutations.PartialShuffleMutation());
            ga.MutationProbability = 0.1f;
            ga.Termination = new GeneticSharp.Domain.Terminations.TimeEvolvingTermination(TimeSpan.FromSeconds(seconds));
            ga.Start();
            var best = (FloatingPointChromosome)ga.BestChromosome;
            outputs.Add(new Dictionary<string, object>
            {
                ["run"] = r + 1,
                ["generations"] = ga.GenerationsNumber,
                ["fitness"] = best.Fitness ?? double.NaN,
                ["genes"] = best.ToFloatingPoints(),
                ["wave1FirstValues"] = ((int[])typeof(AlgorithmFitness).GetField("onda1", Priv).GetValue(fitness)).Take(8).ToArray(),
            });
            Console.Error.WriteLine($"run {r + 1}: {ga.GenerationsNumber} generations, fitness {best.Fitness}");
        }
        File.WriteAllText(args[3], JsonSerializer.Serialize(outputs));
        return 0;
    }
}
