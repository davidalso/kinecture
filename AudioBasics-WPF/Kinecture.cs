using System;
using System.Collections.Generic;
using System.IO;
using System.Timers;
using Microsoft.Kinect;

namespace AudioBasics_WPF
{
    class Kinecture
    {
        private readonly StreamWriter sw;

        /// <summary>
        /// Active Kinect sensor
        /// </summary>
        private readonly KinectSensor kinectSensor = null;

        /// <summary>
        /// Number of bytes in each Kinect audio stream sample (32-bit IEEE float).
        /// </summary>
        private const int BytesPerSample = sizeof(float);

        /// <summary>
        /// Will be allocated a buffer to hold a single sub frame of audio data read from audio stream.
        /// </summary>
        private readonly byte[] audioBuffer = null;

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

        public Kinecture(KinectSensor kinectSensor)
        {
            this.kinectSensor = kinectSensor;

            IReadOnlyList<AudioBeam> audioBeamList = this.kinectSensor.AudioSource.AudioBeams;
            System.IO.Stream audioStream = audioBeamList[0].OpenInputStream();

            var filename = DateTime.Now.ToString("yyyy-MM-dd-HH-mm-ss.fff");
            sw = new StreamWriter(filename + ".txt");

            // Allocate 1024 bytes to hold a single audio sub frame. Duration sub frame 
            // is 16 msec, the sample rate is 16khz, which means 256 samples per sub frame. 
            // With 4 bytes per sample, that gives us 1024 bytes.
            this.audioBuffer = new byte[kinectSensor.AudioSource.SubFrameLengthInBytes];

            // TODO: can both of these use the same stream?
            this.speech = new Speech(audioStream);
            this.recorder = new Recorder(filename, kinectSensor);
        }

        public void Initialize()
        {
            sw.WriteLine("{0}\t{1}\t{2}\t{3}\t{4}", "timestamp", "angle", "confidence", "loudness", "speech");
            speech.Start();
            recorder.Start();
            // Create a timer with a two second interval.
            aTimer = new System.Timers.Timer(TIMER_INTERVAL);
            // Hook up the Elapsed event for the timer. 
            aTimer.Elapsed += OnTimedEvent;
            aTimer.Enabled = true;
        }

        private void OnTimedEvent(Object source, ElapsedEventArgs e)
        {
            var beam = this.kinectSensor.AudioSource.AudioBeams[0];
            var timestamp = GetTimestamp(e.SignalTime);
            sw.WriteLine(
                "{0}\t{1}\t{2}\t{3}\t{4}", 
                timestamp, 
                beam.BeamAngle, 
                beam.BeamAngleConfidence, 
                loudness, 
                Convert.ToInt32(speech.CurrentlySpeaking)
            );
        }

        // TODO: are there any threading issues?
        float loudness = 0.0F;

        public void OnFrame(AudioBeamFrameList frameList)
        {
            // Only one audio beam is supported. Get the sub frame list for this beam
            IReadOnlyList<AudioBeamSubFrame> subFrameList = frameList[0].SubFrames;
            // Loop over all sub frames, extract audio buffer and beam information
            foreach (AudioBeamSubFrame subFrame in subFrameList)
            {
                // Process audio buffer
                subFrame.CopyFrameDataToArray(this.audioBuffer);

                for (int i = 0; i < this.audioBuffer.Length; i += BytesPerSample)
                {
                    // Extract the 32-bit IEEE float sample from the byte array
                    float audioSample = BitConverter.ToSingle(this.audioBuffer, i);
                    float audioAbs = Math.Abs(audioSample);
                    if (audioAbs > loudness)
                        loudness = audioAbs;
                }
            }
        }
    }
}
