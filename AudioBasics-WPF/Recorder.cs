using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Kinect;
using Microsoft.Samples.Kinect.SpeechBasics;

namespace AudioBasics_WPF
{
    class Recorder
    {
        double _amountOfTimeToRecord = 100.0;
        public string Filename;
        private readonly KinectSensor kinect;

        // TODO: do we need a lock?
        //private static object locker = new object();
        private static bool isStopped = false;

        // TODO: what to do about filename
        public Recorder(KinectSensor kinect)
        {
            this.kinect = kinect;
        }

        public void Start()
        {
            ////Start recording audio on new thread
            var t = new Thread(new ParameterizedThreadStart(RecordAudio));
            t.Name = "Recorder";
            t.Start(kinect);
            isStopped = false;

            //You can also Record audio synchronously but it will "freeze" the UI 
            //RecordAudio(kinectSensorChooser1.Kinect); 
        }

        public void Stop()
        {
            isStopped = true;
        }

        private void RecordAudio(object kinectSensor)
        {
            KinectSensor _sensor = (KinectSensor)kinectSensor;
            RecordAudio(_sensor);
        }

        private void RecordAudio(KinectSensor kinectSensor)
        {
            if (kinectSensor == null)
            {
                return;
            }

            int recordingLength = (int)_amountOfTimeToRecord * 2 * 16000;
            byte[] buffer = new byte[1024];

            using (FileStream _fileStream = new FileStream(Filename + ".wav", FileMode.Create))
            {
                WriteWavHeader(_fileStream, recordingLength);

                // HACK: for some reason the normal stream doesn't work with the writer code :(
                // (it sounds like static, and the stream is unreliable and returns 0, breaking the read loop)
                var convertStream = new KinectAudioStream(kinectSensor.AudioSource.AudioBeams[0].OpenInputStream());
                convertStream.SpeechActive = true;
                //Start capturing audio                               
                using (Stream audioStream = convertStream)
                {
                    Console.WriteLine("RECORDING START");
                    //Simply copy the data from the stream down to the file
                    int count, totalCount = 0;
                    while ((count = audioStream.Read(buffer, 0, buffer.Length)) > 0 && /* totalCount < recordingLength &&*/ !isStopped)
                    {
                        _fileStream.Write(buffer, 0, count);
                        totalCount += count;
                    }
                    _fileStream.Flush();
                    Console.WriteLine("RECORDING STOP");
                }
                
            }

           
        }

        /// <summary>
        /// A bare bones WAV file header writer
        /// </summary>        
        static void WriteWavHeader(Stream stream, int dataLength)
        {
            //We need to use a memory stream because the BinaryWriter will close the underlying stream when it is closed
            using (var memStream = new MemoryStream(64))
            {
                int cbFormat = 18; //sizeof(WAVEFORMATEX)
                WAVEFORMATEX format = new WAVEFORMATEX()
                {
                    wFormatTag = 1,
                    nChannels = 1,
                    nSamplesPerSec = 16000,
                    nAvgBytesPerSec = 32000,
                    nBlockAlign = 2,
                    wBitsPerSample = 16,
                    cbSize = 0
                };

                using (var bw = new BinaryWriter(memStream))
                {
                    //RIFF header
                    WriteString(memStream, "RIFF");
                    bw.Write(dataLength + cbFormat + 4); //File size - 8
                    WriteString(memStream, "WAVE");
                    WriteString(memStream, "fmt ");
                    bw.Write(cbFormat);

                    //WAVEFORMATEX
                    bw.Write(format.wFormatTag);
                    bw.Write(format.nChannels);
                    bw.Write(format.nSamplesPerSec);
                    bw.Write(format.nAvgBytesPerSec);
                    bw.Write(format.nBlockAlign);
                    bw.Write(format.wBitsPerSample);
                    bw.Write(format.cbSize);

                    //data header
                    WriteString(memStream, "data");
                    bw.Write(dataLength);
                    memStream.WriteTo(stream);
                }
            }
        }

        static void WriteString(Stream stream, string s)
        {
            byte[] bytes = Encoding.ASCII.GetBytes(s);
            stream.Write(bytes, 0, bytes.Length);
        }

        struct WAVEFORMATEX
        {
            public ushort wFormatTag;
            public ushort nChannels;
            public uint nSamplesPerSec;
            public uint nAvgBytesPerSec;
            public ushort nBlockAlign;
            public ushort wBitsPerSample;
            public ushort cbSize;
        }
    }
}
