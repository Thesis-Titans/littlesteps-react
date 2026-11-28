import type { FormEvent } from "react";
import { Button, Chip, Icon, Select, TextField } from "../../../components/common";
import { DOMAIN_LABELS, DOMAINS, type Domain, type Setting } from "../../catalog/types";
import { isRainyWeather, type WeatherData } from "../../../services/weather";

const TIME_CHOICES = [10, 15, 30, 45] as const;

export interface IdeaHelperFormProps {
  timeMinutes: number;
  setting: Setting;
  selectedDomain: Domain | "all";
  materialsText: string;
  weather: WeatherData | null;
  cityName: string;
  onTimeChange: (minutes: number) => void;
  onSettingChange: (setting: Setting) => void;
  onDomainChange: (domain: Domain | "all") => void;
  onMaterialsChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}

/**
 * Structured play-idea preference form for the constrained AI Idea Helper.
 */
export function IdeaHelperForm({
  timeMinutes,
  setting,
  selectedDomain,
  materialsText,
  weather,
  cityName,
  onTimeChange,
  onSettingChange,
  onDomainChange,
  onMaterialsChange,
  onSubmit,
}: IdeaHelperFormProps) {
  return (
    <form className="idea-helper-form" onSubmit={onSubmit}>
      <fieldset className="idea-helper-fieldset">
        <legend className="idea-helper-legend">How much time do you have?</legend>
        <div className="idea-helper-chips" role="group" aria-label="How much time do you have?">
          {TIME_CHOICES.map((mins) => (
            <Chip
              key={mins}
              selected={timeMinutes === mins}
              onClick={() => onTimeChange(mins)}
              aria-label={`${mins} minutes`}
            >
              {mins} min
            </Chip>
          ))}
        </div>
      </fieldset>

      {weather && cityName && (
        <div className="idea-helper-weather-hint" role="status" aria-label="Weather recommendation">
          <Icon name={isRainyWeather(weather) ? "cloud-rain" : "sun"} size={16} />
          <span>
            {isRainyWeather(weather)
              ? `Rainy in ${cityName} · Indoor play suggested`
              : weather.hint ?? `Good weather in ${cityName} for outdoor play`}
          </span>
        </div>
      )}

      <div className="idea-helper-row">
        <div className="idea-helper-field">
          <Select
            label="Where will you play?"
            value={setting}
            onChange={(e) => onSettingChange(e.target.value as Setting)}
            options={[
              { value: "either", label: "Indoor or outdoor" },
              { value: "indoor", label: "Indoor" },
              { value: "outdoor", label: "Outdoor" },
            ]}
          />
        </div>

        <div className="idea-helper-field">
          <Select
            label="Kind of play"
            value={selectedDomain}
            onChange={(e) => onDomainChange(e.target.value as Domain | "all")}
            options={[
              { value: "all", label: "Any kind of play" },
              ...DOMAINS.map((domain) => ({
                value: domain,
                label: DOMAIN_LABELS[domain],
              })),
            ]}
          />
        </div>
      </div>

      <div className="idea-helper-field idea-helper-materials-field">
        <TextField
          label="What do you have at home?"
          placeholder="For example: cups, spoon, towel, paper"
          hint="Optional. Separate items with a comma."
          value={materialsText}
          onChange={(e) => onMaterialsChange(e.target.value)}
        />
      </div>

      <div className="idea-helper-actions">
        <Button variant="primary" type="submit" className="idea-helper-submit-btn">
          Find ideas
        </Button>
      </div>
    </form>
  );
}
