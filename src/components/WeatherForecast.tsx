import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Geolocation } from "@capacitor/geolocation";

type Forecast = {
  high: number;
  low: number;
  rain: number;
  code?: number;
  city?: string;
};

export default function WeatherForecast() {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      console.log("🟢 WeatherForecast mounted — starting permission check...");
      try {
        // --- Step 1: get coordinates with fallback ---
        let lat = 49.28, lon = -123.12; // Vancouver fallback
        try {
          const perm = await Geolocation.requestPermissions();
          if (perm?.location === "granted" || perm?.coarseLocation === "granted") {
            const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
          }
        } catch {
          console.warn("⚠️ Using fallback coords");
        }

        // --- Step 2: fetch weather ---
        const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&forecast_days=2&timezone=auto`;
        const wRes = await fetch(wUrl);
        if (!wRes.ok) throw new Error("Weather HTTP " + wRes.status);
        const wData = await wRes.json();
        if (!wData?.daily) throw new Error("Invalid weather response");

        // --- Step 3: reverse geocode (optional) ---
        let city = "your area";
        try {
          const gUrl = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}`;
          const gRes = await fetch(gUrl);
          if (gRes.ok) {
            const gData = await gRes.json();
            city = gData?.results?.[0]?.name || city;
          }
        } catch {
          console.warn("⚠️ Reverse geocode failed");
        }

        setForecast({
          high: Math.round(wData.daily.temperature_2m_max[1]),
          low: Math.round(wData.daily.temperature_2m_min[1]),
          rain: wData.daily.precipitation_sum[1],
          code: wData.daily.weathercode[1],
          city,
        });
        console.log("✅ Forecast set successfully");
      } catch (e) {
        console.error("WeatherForecast failed:", e);
        setError("Could not load forecast");
      }
    })();
  }, []);

  if (error) return (
    <motion.div
      className="bedtime-history weather-card"
      style={{ borderBottom: "none" }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.0, delay: 0.2, ease: "easeOut" }}
    >
      <p className="history-label">Tomorrow's weather</p>
      <div className="weather-row">
        <span className="weather-emoji">🌤️</span>
        <span className="weather-text">Forecast unavailable</span>
      </div>
    </motion.div>
  );

  if (!forecast) return null;

  const emoji = (() => {
    const c = forecast.code ?? -1;
    if (c === 0) return "☀️";
    if ([1, 2, 3].includes(c)) return "🌤️";
    if ([45, 48].includes(c)) return "🌫️";
    if ([51, 53, 55, 61, 63, 65].includes(c)) return "🌧️";
    if ([71, 73, 75, 77].includes(c)) return "❄️";
    if ([95, 96, 99].includes(c)) return "⛈️";
    return "🌤️";
  })();

  return (
    <motion.div
  className="bedtime-history weather-card"
  style={{ borderBottom: "none" }}
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 1.0, delay: 0.2, ease: "easeOut" }}
>


      <p className="history-label">
  Tomorrow{forecast.city && forecast.city !== "your area" ? ` in ${forecast.city}` : ""}
</p>

      <div className="weather-row">
        <span className="weather-emoji">{emoji}</span>
        <span className="weather-text">
          High {forecast.high}°C • Low {forecast.low}°C • {forecast.rain} mm rain
        </span>
      </div>
    </motion.div>
  );
}
