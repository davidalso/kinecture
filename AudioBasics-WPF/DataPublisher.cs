using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Timers;
using Net.DDP.Client;
using Newtonsoft.Json;
using SignalR.Hosting.Common;

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
                if (queryPair.Value is string)
                    query[queryPair.Key] = (string) queryPair.Value;
                else
                    query[queryPair.Key] = JsonConvert.SerializeObject(queryPair.Value);
            }
            builder.Query = query.ToString();
            Console.WriteLine(builder.ToString());
            WebRequest request = WebRequest.Create(builder.ToString());

            var response = request.GetResponse();
            //StreamReader reader = new StreamReader(response.GetResponseStream());
            //string responseText = reader.ReadToEnd();
            //reader.Close();
            response.Close();
        }

        private void OnTimedEvent(Object source, ElapsedEventArgs e)
        {
            CurrentDataSnapshot["name"] = Environment.MachineName;
            DoWebRequest("http://gregfoo.meteor.com/kinect", CurrentDataSnapshot);
        }
    }
}
