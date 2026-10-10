# MusicGeneratiorWithIAGenetic

> **Web version (2026) — [open Attractor Waves in the browser](https://tinocolight.github.io/MusicGeneratiorWithIAGenetic/web/)**
> (no installation; it also works on a phone).
>
> A version of the program that runs in the browser, with:
> - the original model (checked against this C# code);
> - extensions to the attractor waves taken from the literature;
> - a Telemann-style canon mode;
> - a wave analyser and an objective evaluation.
>
> - Single-file version, which also works offline once downloaded: [`ondas-atratoras.html`](https://tinocolight.github.io/MusicGeneratiorWithIAGenetic/web/dist/ondas-atratoras.html).
> - Source code: the [`web/`](web/) folder. Documentation (in Portuguese): [`web/README.md`](web/README.md).

[2021-07-27]

This project was performed as part of the AI curricular unit in IPCA School (Barcelos, Portugal 2020). Although very basic, it can produce interesting music patterns.

First of all, I’m uploading this code almost 1 year after the last touch, so I’m sorry for some gaps in the explanation or some entries that are not as clear as they should be. 

It we designed to use windows forms, but decoupling it from windows centric libraries should not be very time consuming.

A set of 3rd party packages are used.
1) To handle the effortless creation of MIDI files, this library was used: https://gitlab.com/ambs/midi-sharp
2) To perform the heavy lifting of IA computations, a 3r party package was installed trough Visual Studio NuGet: "Genetic Sharp" (https://github.com/giacomelli/GeneticSharp);
3) Also installed from Visual Studio NuGet: MetroModernUi

### Building the C# program (Windows, Visual Studio)

The NuGet packages (GeneticSharp, GeneticSharp.Extensions, MetroModernUI, NCalc.NetCore,
Antlr3.Runtime, System.Drawing.Common) are not kept in the repository: their exact versions are
listed in [`GeneticMusic/GeneticMusic/packages.config`](GeneticMusic/GeneticMusic/packages.config)
and are installed again before building.

1. Open `GeneticMusic/GeneticMusic.sln` in Visual Studio (2017 or later) and build (F5). NuGet
   restores the packages by itself into `GeneticMusic/packages/`. If it does not, right-click the
   solution and choose *Restore NuGet Packages*. That option needs *Tools > Options > NuGet
   Package Manager > Allow NuGet to download missing packages*.
2. From the command line instead:
   - `nuget restore GeneticMusic\GeneticMusic.sln` (with [nuget.exe](https://www.nuget.org/downloads)), or
   - in a Developer Command Prompt,
     `msbuild GeneticMusic\GeneticMusic.sln -t:restore -p:RestorePackagesConfig=true`,
     then `msbuild GeneticMusic\GeneticMusic.sln -p:Configuration=Release`.

Signing:

- **ClickOnce manifests.** They are signed only when a signing key is present. The old temporary
  key (`GeneticMusic_TemporaryKey.pfx`, a private key) was removed from the repository, and keys
  are ignored by `.gitignore`. Without one, the program builds and runs and the manifests are
  unsigned.
- **Signed ClickOnce publication.** To publish one, create a test certificate in *Project >
  Properties > Signing*; it stays on your machine.
- **Build output.** `bin/`, `obj/` and the restored `packages/` are not versioned either.


Rationale of the solutions:

As the backbone of the music generation algorithm in this current program, is a genetic algorithm library that is able to mutate, crossover and select results based on how well they perform.
In the case of the current program, there are a set of rules pre-defined of what “empirically” could contribute to a pleasant music piece. As these rules were created by a non-professional in the area, there should be plenty of room to come up with other better rules of what could contribute to a pleasant piece.
Each of these rules has a weight (that can be changed by the user) attributed to it. So, for example if the user sets a weight or merit of 50 to the scale and a merit of 10 to interesting music patterns, each time the genetic algorithm produces a new piece of music, it will get how well it scored.
If there are no penalties (no negative weights for failing the goal) we can see that it will give 50 points for each note that is within the scale and 10 points each time an interesting music pattern ins found. So we can see this algorithm as executing an optimization function with multiple concurrent goals. Each time we insert a new rule, it will start to be difficult to perfectly satisfy the other goals, so in the end, we end up with a COMPROMISE of the goals. The outcome piece will be influenced by 2 main factors: Randomness and the weight we give to each of the factors that we believe contribute to a “nice” piece. In practice, increasing one of these values a lot, corresponds to decreasing the other ones.
