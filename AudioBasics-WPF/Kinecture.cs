using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Timers;
using Microsoft.Kinect;
using SoundAnalysis;

namespace AudioBasics_WPF
{
    internal class Kinecture
    {
        private StreamWriter sw;

        /// <summary>
        /// Active Kinect sensor
        /// </summary>
        private readonly KinectSensor kinectSensor = null;

        /// <summary>
        /// Number of bytes in each Kinect audio stream sample (32-bit IEEE float).
        /// </summary>
        private const int BytesPerSample = sizeof (float);

        /// <summary>
        /// Will be allocated a buffer to hold a single sub frame of audio data read from audio stream.
        /// </summary>
        private readonly byte[] audioBuffer = null;

        private readonly double[] audioDoubleBuffer = null;

        private const int TIMER_INTERVAL = 50; // milliseconds

        private static string GetTimestamp(DateTime d)
        {
            return d.ToString("HH:mm:ss.fff");
        }

        private static string GetTimestamp()
        {
            return GetTimestamp(DateTime.Now);
        }

        private readonly Speech speech;
        private readonly Recorder recorder;
        private Timer aTimer;
        public bool Started { private set; get; }

        private readonly int sampleRate;

        public Kinecture(KinectSensor kinectSensor)
        {
            Started = false;
            this.kinectSensor = kinectSensor;
            sampleRate = (int) (kinectSensor.AudioSource.SubFrameLengthInBytes/
                                (BytesPerSample*kinectSensor.AudioSource.SubFrameDuration.TotalSeconds));
            // should be 16k

            IReadOnlyList<AudioBeam> audioBeamList = this.kinectSensor.AudioSource.AudioBeams;
            System.IO.Stream audioStream = audioBeamList[0].OpenInputStream();
            Console.WriteLine();

            // Allocate 1024 bytes to hold a single audio sub frame. Duration sub frame 
            // is 16 msec, the sample rate is 16khz, which means 256 samples per sub frame. 
            // With 4 bytes per sample, that gives us 1024 bytes.
            this.audioBuffer = new byte[kinectSensor.AudioSource.SubFrameLengthInBytes];

            this.audioDoubleBuffer = new double[kinectSensor.AudioSource.SubFrameLengthInBytes/4];

            // TODO: can both of these use the same stream?
            this.speech = new Speech(audioStream);
            this.recorder = new Recorder(kinectSensor);
        }

        public void Start(string filename)
        {
            if (Started)
                return; // TODO: log an error

            sw = new StreamWriter(filename + ".csv");
            Started = true;

            string[] bins = new string[FREQUENCY_BINS.Length - 1];
            for (int i = 0; i <= FREQUENCY_BINS.Length - 2; i++)
            {
                bins[i] = FREQUENCY_BINS[i] + " - " + FREQUENCY_BINS[i + 1];
            }
            sw.WriteLine("{0},{1},{2},{3},{4},{5}", "timestamp", "angle", "confidence", "loudness", "speech", string.Join(",", bins));
            speech.Start();
            recorder.Filename = filename;
            recorder.Start();
            // Create a timer with a two second interval.
            aTimer = new System.Timers.Timer(TIMER_INTERVAL);
            // Hook up the Elapsed event for the timer. 
            aTimer.Elapsed += OnTimedEvent;
            aTimer.Enabled = true;
        }

        private void OnTimedEvent(Object source, ElapsedEventArgs e)
        {
            if (!Started)
                return; // in case of race conditions

            var beam = this.kinectSensor.AudioSource.AudioBeams[0];
            var timestamp = GetTimestamp(e.SignalTime);

            double[] spectr = FftAlgorithm.Calculate(audioDoubleBuffer);
            double[] bins = new double[FREQUENCY_BINS.Length - 1];
            for (int i = 0; i <= FREQUENCY_BINS.Length - 2; i++)
            {
                bins[i] = AverageAmplitudeForFrequencyRange(spectr, FREQUENCY_BINS[i], FREQUENCY_BINS[i + 1]);
            }

            // TODO: clean this up
            sw.WriteLine(
                "{0},{1},{2},{3},{4},{5}",
                timestamp,
                beam.BeamAngle,
                beam.BeamAngleConfidence,
                loudness,
                Convert.ToInt32(speech.CurrentlySpeaking),
                string.Join(",", bins)
                );
        }

        // TODO: are there any threading issues?
        private float loudness = 0.0F;
        private int test = 0;

        private readonly int[] FREQUENCY_BINS = new int[]
        {
            0,
            300,
            1000,
            2000
        };

        public void OnFrame(AudioBeamFrameList frameList)
        {
            if (!Started)
                return;

            // Only one audio beam is supported. Get the sub frame list for this beam
            IReadOnlyList<AudioBeamSubFrame> subFrameList = frameList[0].SubFrames;
            // Loop over all sub frames, extract audio buffer and beam information
            // TODO: just do last?
            foreach (AudioBeamSubFrame subFrame in subFrameList)
            {
                // Process audio buffer
                subFrame.CopyFrameDataToArray(this.audioBuffer);

                Debug.Assert(audioBuffer.Length/BytesPerSample == audioDoubleBuffer.Length);
                for (int i = 0; i < this.audioBuffer.Length; i += BytesPerSample)
                {
                    // Extract the 32-bit IEEE float sample from the byte array
                    float audioSample = BitConverter.ToSingle(this.audioBuffer, i);
                    audioDoubleBuffer[i/BytesPerSample] = audioSample;

                    float audioAbs = Math.Abs(audioSample);
                    if (audioAbs > loudness)
                        loudness = audioAbs;
                }
            }
        }

        private double AverageAmplitudeForFrequencyRange(double[] spectrogram, float minFreq, float maxFreq)
        {
            Debug.Assert(minFreq <= maxFreq);
            int minIndex = Math.Max(0, (int)(minFreq * spectrogram.Length / sampleRate));
            int maxIndex = Math.Min(spectrogram.Length - 1, (int)(maxFreq * spectrogram.Length / sampleRate));
            Debug.Assert(minIndex <= maxIndex);
            // TODO: make sure maxIndex isn't past half of the aray
            int rangeSize = maxIndex - minIndex + 1;
            double sum = 0.0;

            for (int i = minIndex; i <= maxIndex; i++)
            {
                double value = spectrogram[i];
                sum += value;
            }

            double result = sum/rangeSize;

            return result;
        }

        public void Stop()
        {
            if (!Started)
                return; // TODO: log an error

            Started = false;
            recorder.Stop();
            speech.Stop();
            aTimer.Dispose();
            sw.Flush();
            sw.Close();
        }
    }
}
