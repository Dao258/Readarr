using System;
using System.Collections.Generic;
using System.Linq;
using NzbDrone.Common.Extensions;

namespace NzbDrone.Core.MediaFiles.BookImport.Identification
{
    public class Distance
    {
        // from beets default config
        private static readonly Dictionary<string, double> Weights = new Dictionary<string, double>
        {
            { "source", 2.0 },
            { "author", 3.0 },
            { "book", 3.0 },
            { "isbn", 10.0 },
            { "isbn_missing", 0.1 },
            { "asin", 10.0 },
            { "asin_missing", 0.1 },
            { "media_count", 1.0 },
            { "media_format", 1.0 },
            { "year", 1.0 },
            { "country", 0.5 },
            { "label", 0.5 },
            { "catalog_number", 0.5 },
            { "book_disambiguation", 0.5 },
            { "book_id", 5.0 },
            { "tracks", 2.0 },
            { "missing_tracks", 0.6 },
            { "unmatched_tracks", 0.9 },
            { "track_title", 3.0 },
            { "track_author", 2.0 },
            { "track_index", 1.0 },
            { "track_length", 2.0 },
            { "recording_id", 10.0 },
        };

        private Dictionary<string, List<double>> _penalties;

        public Distance()
        {
            _penalties = new Dictionary<string, List<double>>(15);
        }

        public Dictionary<string, List<double>> Penalties => _penalties;
        public string Reasons => _penalties.Count(x => x.Value.Max() > 0.0) > 0 ? "[" + string.Join(", ", Penalties.Where(x => x.Value.Max() > 0.0).Select(x => x.Key.Replace('_', ' '))) + "]" : string.Empty;

        private double MaxDistance(Dictionary<string, List<double>> penalties)
        {
            return penalties.Select(x => x.Value.Count * Weights[x.Key]).Sum();
        }

        public double MaxDistance()
        {
            return MaxDistance(_penalties);
        }

        private double RawDistance(Dictionary<string, List<double>> penalties)
        {
            return penalties.Select(x => x.Value.Sum() * Weights[x.Key]).Sum();
        }

        public double RawDistance()
        {
            return RawDistance(_penalties);
        }

        private double NormalizedDistance(Dictionary<string, List<double>> penalties)
        {
            var max = MaxDistance(penalties);
            return max > 0 ? RawDistance(penalties) / max : 0;
        }

        public double NormalizedDistance()
        {
            return NormalizedDistance(_penalties);
        }

        public double NormalizedDistanceExcluding(List<string> keys)
        {
            return NormalizedDistance(_penalties.Where(x => !keys.Contains(x.Key)).ToDictionary(y => y.Key, y => y.Value));
        }

        public void Add(string key, double dist)
        {
            if (_penalties.ContainsKey(key))
            {
                _penalties[key].Add(dist);
            }
            else
            {
                _penalties[key] = new List<double> { dist };
            }
        }

        public void AddRatio(string key, double value, double target)
        {
            // Adds a distance penalty for value as a ratio of target
            // value is between 0 and target
            var dist = target > 0 ? Math.Max(Math.Min(value, target), 0.0) / target : 0.0;
            Add(key, dist);
        }

        public void AddNumber(string key, int value, int target)
        {
            var diff = Math.Abs(value - target);
            if (diff > 0)
            {
                for (int i = 0; i < diff; i++)
                {
                    Add(key, 1.0);
                }
            }
            else
            {
                Add(key, 0.0);
            }
        }

        private static string Clean(string input)
        {
            char[] arr = input.ToLower().RemoveAccent().ToCharArray();

            arr = Array.FindAll<char>(arr, c => char.IsLetterOrDigit(c));

            return new string(arr);
        }

        private double StringScore(string value, string target)
        {
            // Adds a penaltly based on the distance between value and target
            var cleanValue = Clean(value);
            var cleanTarget = Clean(target);

            if (cleanValue.IsNullOrWhiteSpace() && cleanTarget.IsNotNullOrWhiteSpace())
            {
                return 1.0;
            }
            else if (cleanValue.IsNullOrWhiteSpace() && cleanTarget.IsNullOrWhiteSpace())
            {
                return 0.0;
            }
            else
            {
                return 1.0 - cleanValue.LevenshteinCoefficient(cleanTarget);
            }
        }

        public void AddString(string key, string value, string target)
        {
            Add(key, StringScore(value, target));
        }

        public void AddString(string key, string value, List<string> options)
        {
            if (!options.Any())
            {
                Add(key, StringScore(value, string.Empty));
            }
            else
            {
                Add(key, options.Min(x => StringScore(value, x)));
            }
        }

        public void AddString(string key, List<string> values, string target)
        {
            if (!values.Any())
            {
                Add(key, StringScore(string.Empty, target));
            }
            else
            {
                Add(key, values.Min(v => StringScore(v, target)));
            }
        }

        public void AddString(string key, List<string> values, List<string> options)
        {
            if (!values.Any() && !options.Any())
            {
                Add(key, 0.0);
            }
            else if (!values.Any() || !options.Any())
            {
                Add(key, 1.0);
            }
            else
            {
                Add(key, values.Min(v => options.Min(o => StringScore(v, o))));
            }
        }

        public void AddBool(string key, bool expr)
        {
            Add(key, expr ? 1.0 : 0.0);
        }

        public void AddEquality<T>(string key, T value, List<T> options)
            where T : IEquatable<T>
        {
            Add(key, options.Contains(value) ? 0.0 : 1.0);
        }

        public void AddPriority<T>(string key, T value, List<T> options)
            where T : IEquatable<T>
        {
            var unit = 1.0 / (options.Count > 0 ? options.Count : 1.0);
            var index = options.IndexOf(value);
            if (index == -1)
            {
                Add(key, 1.0);
            }
            else
            {
                Add(key, index * unit);
            }
        }

        public void AddPriority<T>(string key, List<T> values, List<T> options)
            where T : IEquatable<T>
        {
            for (int i = 0; i < options.Count; i++)
            {
                if (values.Contains(options[i]))
                {
                    Add(key, i / (double)options.Count);
                    return;
                }
            }

            Add(key, 1.0);
        }
    }
}
