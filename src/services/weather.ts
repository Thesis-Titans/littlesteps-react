import { useEffect, useState } from "react";
import { apiFetch } from "./api";

export interface WeatherLocation {
  name: string;
  latitude: number;
  longitude: number;
}

export const PHILIPPINES_CITIES: WeatherLocation[] = [
  { name: "Manila", latitude: 14.5995, longitude: 120.9842 },
  { name: "Iloilo City", latitude: 10.7202, longitude: 122.5621 },
  { name: "Cebu City", latitude: 10.3157, longitude: 123.8854 },
  { name: "Davao City", latitude: 7.1907, longitude: 125.4553 },
  { name: "Baguio", latitude: 16.4023, longitude: 120.5960 },
];

export interface WeatherData {
  condition: "cloudy" | "rainy" | "clear" | "unavailable";
  rainChance: number;
  heatFlag: boolean;
  suggestedSetting: "indoor" | "outdoor" | "either";
  hint: string | null;
  provenance: {
    source: string;
    attribution: string;
    license: string;
  };
}

const WEATHER_CITY_KEY = "ls.weatherCity";

export function getSavedCity(): string {
  try {
    return localStorage.getItem(WEATHER_CITY_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveCity(cityName: string): void {
  try {
    if (cityName) {
      localStorage.setItem(WEATHER_CITY_KEY, cityName);
    } else {
      localStorage.removeItem(WEATHER_CITY_KEY);
    }
  } catch {
    /* storage disabled */
  }
}

export async function fetchWeather(cityLocation?: WeatherLocation): Promise<WeatherData | null> {
  try {
    const params = new URLSearchParams();
    if (cityLocation) {
      params.set("latitude", cityLocation.latitude.toString());
      params.set("longitude", cityLocation.longitude.toString());
    }
    const qs = params.toString();
    const res = await apiFetch(`/api/v1/catalog/weather${qs ? `?${qs}` : ""}`);
    if (!res.ok) return null;
    const data = (await res.json()) as WeatherData;
    if (data.condition === "unavailable") return null;
    return data;
  } catch {
    return null;
  }
}

export function useWeather() {
  const [cityName, setCityName] = useState<string>(getSavedCity);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cityName) return;

    const cityLoc = PHILIPPINES_CITIES.find((c) => c.name.toLowerCase() === cityName.toLowerCase());
    if (!cityLoc) return;

    let current = true;

    fetchWeather(cityLoc)
      .then((data) => {
        if (!current) return;
        setWeather(data);
      })
      .catch(() => {
        if (current) setWeather(null);
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, [cityName]);

  function updateCity(newCity: string) {
    saveCity(newCity);
    setCityName(newCity);
    if (!newCity) setWeather(null);
  }

  return { cityName, updateCity, weather, loading };
}
