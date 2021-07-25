using System;
using GeneticSharp.Domain.Chromosomes;
using GeneticSharp.Domain.Randomizations;

namespace GeneticMusic
{





    public class ChromosomeDefinition : BinaryChromosomeBase
    {
        Random random = new Random();
        static int lenghtSequence = 0;
        static byte gene_pause = 0;
        static byte gene_prolongation = 0;



        // TODO: Change the argument value passed to base construtor to change the length 
        // of your chromosome.
        public ChromosomeDefinition() : base(lenghtSequence)
        {


            CreateGenes();
        }

        public override Gene GenerateGene(int geneIndex)
        {
            Console.WriteLine("Gene Override");
            var tempRand = random.Next(0, 9);
            if (tempRand  < 5)
            {
                //  throw new NotImplementedException("// TODO: Generate a gene base on MyProblemChromosome representation.");
                // return new Gene(RandomizationProvider.Current.GetInt(1, Program2.gene_prolongation-1));
                return new Gene(37);
            }

            else if (tempRand >= 5 && tempRand <8)
            {
                return new Gene(gene_prolongation);
            }

            else
            {
                return new Gene(gene_pause);
            }

        }

        public override IChromosome CreateNew()
        {

            return new ChromosomeDefinition();
        }
    }
}
