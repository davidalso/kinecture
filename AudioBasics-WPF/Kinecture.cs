using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Kinect;
using Microsoft.Samples.Kinect.SpeechBasics;
using Microsoft.Speech.AudioFormat;
using Microsoft.Speech.Recognition;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Globalization;
using System.Windows;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using Microsoft.Kinect;
using Microsoft.Speech.AudioFormat;
using Microsoft.Speech.Recognition;

namespace AudioBasics_WPF
{
    class Kinecture
    {
        /// <summary>
        /// Gets the metadata for the speech recognizer (acoustic model) most suitable to
        /// process audio from Kinect device.
        /// </summary>
        /// <returns>
        /// RecognizerInfo if found, <code>null</code> otherwise.
        /// </returns>
        private static RecognizerInfo TryGetKinectRecognizer()
        {
            IEnumerable<RecognizerInfo> recognizers;

            // This is required to catch the case when an expected recognizer is not installed.
            // By default - the x86 Speech Runtime is always expected. 
            try
            {
                recognizers = SpeechRecognitionEngine.InstalledRecognizers();
            }
            catch (COMException)
            {
                return null;
            }

            foreach (RecognizerInfo recognizer in recognizers)
            {
                string value;
                recognizer.AdditionalInfo.TryGetValue("Kinect", out value);
                if ("True".Equals(value, StringComparison.OrdinalIgnoreCase) 
                    && "en-US".Equals(recognizer.Culture.Name, StringComparison.OrdinalIgnoreCase))
                {
                    return recognizer;
                }
            }

            Console.WriteLine("Could not find Kinect recognizer");
            return null;
        }

        // TODO: copied from MS Speech example -- do we need this?
        /// <summary>
        /// Stream for 32b-16b conversion.
        /// </summary>
        private KinectAudioStream convertStream = null;

        /// <summary>
        /// Speech recognition engine using audio data from Kinect.
        /// </summary>
        private SpeechRecognitionEngine speechEngine = null;

        private readonly StreamWriter sw = new StreamWriter(DateTime.Now.ToString("yyyy-MM-dd-HH-mm-ss.fff") + ".txt");

        /// <summary>
        /// Active Kinect sensor
        /// </summary>
        private KinectSensor kinectSensor = null;

        /// <summary>
        /// Number of bytes in each Kinect audio stream sample (32-bit IEEE float).
        /// </summary>
        private const int BytesPerSample = sizeof(float);

        /// <summary>
        /// Will be allocated a buffer to hold a single sub frame of audio data read from audio stream.
        /// </summary>
        private readonly byte[] audioBuffer = null;

        private string GetTimestamp()
        {
            return DateTime.Now.ToString("HH:mm:ss.fff");
        }

        public Kinecture(KinectSensor kinectSensor, Stream audioStream)
        {
            this.kinectSensor = kinectSensor;
            // create the convert stream
            this.convertStream = new KinectAudioStream(audioStream);

            // Allocate 1024 bytes to hold a single audio sub frame. Duration sub frame 
            // is 16 msec, the sample rate is 16khz, which means 256 samples per sub frame. 
            // With 4 bytes per sample, that gives us 1024 bytes.
            this.audioBuffer = new byte[kinectSensor.AudioSource.SubFrameLengthInBytes];
        }

        public void Initialize()
        {
            sw.WriteLine("{0}\t{1}\t{2}\t{3}\t{4}", "timestamp", "angle", "confidence", "loudness", "speech");

            RecognizerInfo ri = TryGetKinectRecognizer();

            if (null != ri)
            {
                this.speechEngine = new SpeechRecognitionEngine(ri.Id);

                // TODO: we don't actually care about the grammar!
                var directions = new Choices();
                directions.Add(new SemanticResultValue("chris", "CHRIS"));
                directions.Add(new SemanticResultValue("forwards", "FORWARD"));
                directions.Add(new SemanticResultValue("straight", "FORWARD"));
                directions.Add(new SemanticResultValue("backward", "BACKWARD"));
                directions.Add(new SemanticResultValue("backwards", "BACKWARD"));
                directions.Add(new SemanticResultValue("back", "BACKWARD"));
                directions.Add(new SemanticResultValue("turn left", "LEFT"));
                directions.Add(new SemanticResultValue("turn right", "RIGHT"));
                var gb = new GrammarBuilder { Culture = ri.Culture };
                gb.Append(directions);
                var g = new Grammar(gb);

                this.speechEngine.LoadGrammar(g);

                this.speechEngine.SpeechDetected += this.SpeechDetected;
                this.speechEngine.SpeechRecognized += this.SpeechRecognized;
                this.speechEngine.SpeechRecognitionRejected += this.SpeechRejected;

                // let the convertStream know speech is going active
                this.convertStream.SpeechActive = true;

                // For long recognition sessions (a few hours or more), it may be beneficial to turn off adaptation of the acoustic model. 
                // This will prevent recognition accuracy from degrading over time.
                ////speechEngine.UpdateRecognizerSetting("AdaptationOn", 0);

                this.speechEngine.SetInputToAudioStream(
                    this.convertStream, new SpeechAudioFormatInfo(EncodingFormat.Pcm, 16000, 16, 1, 32000, 2, null));
                this.speechEngine.RecognizeAsync(RecognizeMode.Multiple);
            }
        }

        private bool CurrentlySpeaking = false;

        // Handle the SpeechDetected event.
        private void SpeechDetected(object sender, SpeechDetectedEventArgs e)
        {
            Console.WriteLine("Speech detected at AudioPosition = {0}", e.AudioPosition);
            CurrentlySpeaking = true;
        }

        /// <summary>
        /// Handler for recognized speech events.
        /// </summary>
        /// <param name="sender">object sending the event.</param>
        /// <param name="e">event arguments.</param>
        private void SpeechRecognized(object sender, SpeechRecognizedEventArgs e)
        {
            Console.WriteLine("recognized '{0}' with {1}", e.Result.Text, e.Result.Confidence);
            CurrentlySpeaking = false;
        }

        /// <summary>
        /// Handler for rejected speech events.
        /// </summary>
        /// <param name="sender">object sending the event.</param>
        /// <param name="e">event arguments.</param>
        private void SpeechRejected(object sender, SpeechRecognitionRejectedEventArgs e)
        {
            Console.WriteLine("rejected");
            CurrentlySpeaking = false;
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
            sw.WriteLine("{0}\t{1}\t{2}\t{3}\t{4}", timestamp, beam.BeamAngle, beam.BeamAngleConfidence, loudness, Convert.ToInt32(CurrentlySpeaking));
        }
    }
}
