using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Samples.Kinect.SpeechBasics;
using Microsoft.Speech.AudioFormat;
using Microsoft.Speech.Recognition;

namespace AudioBasics_WPF
{
    class Speech
    {
        // TODO: copied from MS Speech example -- do we need this?
        /// <summary>
        /// Stream for 32b-16b conversion.
        /// </summary>
        private readonly KinectAudioStream convertStream = null;

        /// <summary>
        /// Speech recognition engine using audio data from Kinect.
        /// </summary>
        private SpeechRecognitionEngine speechEngine = null;

        public bool CurrentlySpeaking { get; private set; }

        public Speech(Stream kinectStream)
        {
            this.convertStream = new KinectAudioStream(kinectStream);
            CurrentlySpeaking = false;
        }

        public void Initialize()
        {
            RecognizerInfo ri = TryGetKinectRecognizer();

            if (null == ri) return;
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
                convertStream,
                new SpeechAudioFormatInfo(EncodingFormat.Pcm, 16000, 16, 1, 32000, 2, null)
            );
            this.speechEngine.RecognizeAsync(RecognizeMode.Multiple);
        }

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
    }
}
