using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Timers;
using Newtonsoft.Json;

namespace AudioBasics_WPF
{
    class DataPublisher
    {
        private Timer aTimer;

        public IDictionary<string, object> CurrentDataSnapshot = new Dictionary<string, object>();

        public DataPublisher()
        {
            //string data = System.Web.HttpUtility.UrlEncode(JsonConvert.SerializeObject(
            //    new Dictionary<string, object>()
            //    {
            //        {"apple", "good"},
            //        {"fruit", 6},
            //        {"angle", 99}
            //    }
            //));

             // Create a timer with a two second interval.
            aTimer = new Timer(500);
            // Hook up the Elapsed event for the timer.
            aTimer.Elapsed += OnTimedEvent;
        }

        public void Start()
        {
            aTimer.Start();
        }

        public void Stop()
        {
            aTimer.Stop();
        }

        private void DoWebRequest(string url, IDictionary<string, object> queryParams)
        {
            var builder = new UriBuilder(url);
            var query = System.Web.HttpUtility.ParseQueryString(builder.Query);
            foreach (var queryPair in queryParams)
            {
                query[queryPair.Key] = JsonConvert.SerializeObject(queryPair.Value);
            }
            builder.Query = query.ToString();
            //Console.WriteLine(builder.ToString());
            WebRequest request = WebRequest.Create(builder.ToString());

            try
            {

                var response = request.GetResponse();
                //StreamReader reader = new StreamReader(response.GetResponseStream());
                //string responseText = reader.ReadToEnd();
                //reader.Close();
                response.Close();
            }
            catch (WebException e)
            {
                Console.WriteLine("WebException ignored: " + e.ToString());
                //throw e;
            }
        }

        private void OnTimedEvent(Object source, ElapsedEventArgs e)
        {
            CurrentDataSnapshot["name"] = Environment.MachineName;
            DoWebRequest("http://kinecture.meteor.com/kinect", CurrentDataSnapshot);
        }
    }
}
