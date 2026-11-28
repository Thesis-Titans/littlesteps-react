import { Button, Icon } from "../../../components/common";
import { EXTERNAL_LINKS } from "../../../config/externalLinks";
import { isRainyWeather, type WeatherData } from "../../../services/weather";

export interface TodayWeatherBannerProps {
  weather: WeatherData;
  onFindIdeas: (presetSetting: "indoor" | "outdoor") => void;
}

/**
 * Optional Open-Meteo weather play hint banner with symmetric indoor/outdoor Idea Helper CTA.
 */
export function TodayWeatherBanner({ weather, onFindIdeas }: TodayWeatherBannerProps) {
  const rainy = isRainyWeather(weather);
  const presetSetting = rainy ? "indoor" : "outdoor";

  return (
    <aside className="today-weather-banner" role="status" aria-label="Weather play hint">
      <div className="today-weather-info">
        <Icon name={rainy ? "cloud-rain" : "sun"} size={18} />
        <span>
          {rainy
            ? "Rain likely this afternoon · Indoor play recommended"
            : weather.hint ?? "Good weather for outdoor play · Outdoor ideas"}
        </span>
      </div>
      <div className="today-weather-actions">
        <a
          href={EXTERNAL_LINKS.openMeteo}
          target="_blank"
          rel="noopener noreferrer"
          className="today-weather-attr"
        >
          Weather data by Open-Meteo.com
        </a>
        <Button
          variant="secondary"
          className="today-weather-btn"
          onClick={() => onFindIdeas(presetSetting)}
        >
          {rainy ? "Find indoor ideas" : "Find outdoor ideas"}
        </Button>
      </div>
    </aside>
  );
}
