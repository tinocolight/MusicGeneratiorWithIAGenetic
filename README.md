# MusicGeneratiorWithIAGenetic
[2021-07-27]

This project was performed as part of the AI curricular unit in IPCA School (Barcelos, Portugal 2020). Although very basic, it can produce interesting music patterns.

First of all, I’m uploading this code almost 1 year after the last touch, so I’m sorry for some gaps in the explanation or some entries that are not as clear as they should be. 

It we designed to use windows forms, but decoupling it from windows centric libraries should not be very time consuming.

A set of 3rd party packages are used.
1) To handle the effortless creation of MIDI files, this library was used: https://gitlab.com/ambs/midi-sharp
2) To perform the heavy lifting of IA computations, a 3r party package was installed trough Visual Studio NuGet: "Genetic Sharp" (https://github.com/giacomelli/GeneticSharp);
3) Also installed from Visual Studio NuGet: MetroModernUi


Rationale of the solutions:

As the backbone of the music generation algorithm in this current program, is a genetic algorithm library that is able to mutate, crossover and select results based on how well they perform.
In the case of the current program, there are a set of rules pre-defined of what “empirically” could contribute to a pleasant music piece. As these rules were created by a non-professional in the area, there should be plenty of room to come up with other better rules of what could contribute to a pleasant piece.
Each of these rules has a weight (that can be changed by the user) attributed to it. So, for example if the user sets a weight or merit of 50 to the scale and a merit of 10 to interesting music patterns, each time the genetic algorithm produces a new piece of music, it will get how well it scored.
If there are no penalties (no negative weights for failing the goal) we can see that it will give 50 points for each note that is within the scale and 10 points each time an interesting music pattern ins found. So we can see this algorithm as executing an optimization function with multiple concurrent goals. Each time we insert a new rule, it will start to be difficult to perfectly satisfy the other goals, so in the end, we end up with a COMPROMISE of the goals. The outcome piece will be influenced by 2 main factors: Randomness and the weight we give to each of the factors that we believe contribute to a “nice” piece. In practice, increasing one of these values a lot, corresponds to decreasing the other ones.
