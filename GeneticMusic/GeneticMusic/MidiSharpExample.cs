using System;

namespace GeneticMusic
{
    class Program
    {
        static void _Main(string[] args)
        {
            MidiFile mf = new MidiFile();

            // Test 1 — play a C major chord

            // Turn on all three notes at start-of-track (delta=0) 
            mf.noteOn(0, 60, 127);
            mf.noteOn(0, 64, 127);
            mf.noteOn(0, 67, 127);

            // Turn off all three notes after one minim. 
            // NOTE delta value is cumulative — only _one_ of
            //  these note-offs has a non-zero delta. The second and
            //  third events are relative to the first
            mf.noteOff(MidiFile.MINIM, 60);
            mf.noteOff(0, 64);
            mf.noteOff(0, 67);

            // Test 2 — play a scale using noteOnOffNow
            //  We don't need any delta values here, so long as one
            //  note comes straight after the previous one 

            mf.noteOnOffNow(MidiFile.QUAVER, 60, 127);
            mf.noteOnOffNow(MidiFile.QUAVER, 62, 127);
            mf.noteOnOffNow(MidiFile.QUAVER, 64, 127);
            mf.noteOnOffNow(MidiFile.QUAVER, 65, 127);
            mf.noteOnOffNow(MidiFile.QUAVER, 67, 127);
            mf.noteOnOffNow(MidiFile.QUAVER, 69, 127);
            mf.noteOnOffNow(MidiFile.QUAVER, 71, 127);
            mf.noteOnOffNow(MidiFile.QUAVER, 72, 127);

            // Test 3 — play a short tune using noteSequenceFixedVelocity
            //  Note the rest inserted with a note value of -1

            int[] sequence = new int[]
            {
            60, MidiFile.QUAVER + MidiFile.SEMIQUAVER,
            65, MidiFile.SEMIQUAVER,
            70, MidiFile.CROTCHET + MidiFile.QUAVER,
            69, MidiFile.QUAVER,
            65, MidiFile.QUAVER / 3,
            62, MidiFile.QUAVER / 3,
            67, MidiFile.QUAVER / 3,
            72, MidiFile.MINIM + MidiFile.QUAVER,
            -1, MidiFile.SEMIQUAVER,
            72, MidiFile.SEMIQUAVER,
            76, MidiFile.MINIM,
            };

            // What the heck — use a different instrument for a change
            mf.progChange(10);

            mf.noteSequenceFixedVelocity(sequence, 127);

            mf.writeToFile("test1.mid");
        }

    }
}
