const https = require("https");

const fetchWeatherData = (latitude, longitude, dateStr) => {
  return new Promise((resolve, reject) => {
    // Open-Meteo historical weather API — no API key required
    const date = new Date(dateStr).toISOString().split("T")[0];
    const url = "https://archive-api.open-meteo.com/v1/archive?latitude=" + latitude +
      "&longitude=" + longitude +
      "&start_date=" + date +
      "&end_date=" + date +
      "&daily=precipitation_sum,temperature_2m_max,temperature_2m_min,windspeed_10m_max" +
      "&timezone=Asia%2FKolkata";

    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.daily && json.daily.time && json.daily.time.length > 0) {
            resolve({
              date: json.daily.time[0],
              rainfall_mm: json.daily.precipitation_sum[0],
              temp_max_c: json.daily.temperature_2m_max[0],
              temp_min_c: json.daily.temperature_2m_min[0],
              wind_max_kmh: json.daily.windspeed_10m_max[0],
              source: "Open-Meteo Historical Weather API",
            });
          } else {
            resolve(null);
          }
        } catch (err) {
          resolve(null);
        }
      });
    }).on("error", () => resolve(null));
  });
};

module.exports = { fetchWeatherData };
