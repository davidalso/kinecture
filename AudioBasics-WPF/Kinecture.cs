using System;
using System.Collections.Generic;
using System.IO;
using Microsoft.Kinect;

namespace AudioBasics_WPF
{
    class Kinecture
    {
        private readonly StreamWriter sw = new StreamWriter(DateTime.Now.ToString("yyyy-MM-dd-HH-mm-ss.fff") + ".txt");

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

        private static string GetTimestamp()
        {
            return DateTime.Now.ToString("HH:mm:ss.fff");
        }

        private readonly Speech speech;

        public Kinecture(KinectSensor kinectSensor, Stream audioStream)
        {
            this.kinectSensor = kinectSensor;

            // Allocate 1024 bytes to hold a single audio sub frame. Duration sub frame 
            // is 16 msec, the sample rate is 16khz, which means 256 samples per sub frame. 
            // With 4 bytes per sample, that gives us 1024 bytes.
            this.audioBuffer = new byte[kinectSensor.AudioSource.SubFrameLengthInBytes];

            this.speech = new Speech(audioStream);
        }

        public void Initialize()
        {
            sw.WriteLine("{0}\t{1}\t{2}\t{3}\t{4}", "timestamp", "angle", "confidence", "loudness", "speech");
            speech.Initialize();
        }

        public void OnFrame(AudioBeamFrameList frameList)
        {
            var timestamp = GetTimestamp();

            float loudness = 0.0F;

            var beam = this.kinectSensor.AudioSource.AudioBeams[0];

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

            //if (loudness > 0.001f)
            sw.WriteLine("{0}\t{1}\t{2}\t{3}\t{4}", timestamp, beam.BeamAngle, beam.BeamAngleConfidence, loudness, Convert.ToInt32(speech.CurrentlySpeaking));
        }
    }
}
