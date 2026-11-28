import type { FormEvent } from "react";
import { Button, FilterChips, Icon, Select, TextField } from "../../../components/common";
import { isRainyWeather, type WeatherData } from "../../../services/weather";
import { DOMAIN_LABELS, DOMAINS, type Domain, type Setting } from "../../catalog/types";

const TIME_OPTIONS = [
  { id: "10", label: "10 min", chipAriaLabel: "10 minutes" },
  { id: "15", label: "15 min", chipAriaLabel: "15 minutes" },
  { id: "30", label: "30 min", chipAriaLabel: "30 minutes" },
  { id: "45", label: "45 min", chipAriaLabel: "45 minutes" },
] as const;

export type PlayLanguage = "en" | "fil" | "hil";

export interface IdeaHelperFormProps {
  timeMinutes: number;
  setting: Setting;
  selectedDomain: Domain | "all";
  language: PlayLanguage;
  materialsText: string;
  weather: WeatherData | null;
  cityName: string;
  onTimeChange: (minutes: number) => void;
  onSettingChange: (setting: Setting) => void;
  onDomainChange: (domain: Domain | "all") => void;
  onLanguageChange: (language: PlayLanguage) => void;
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
  language,
  materialsText,
  weather,
  cityName,
  onTimeChange,
  onSettingChange,
  onDomainChange,
  onLanguageChange,
  onMaterialsChange,
  onSubmit,
}: IdeaHelperFormProps) {
  return (
    <form className="idea-helper-form" onSubmit={onSubmit}>
      <FilterChips
        label="How much time do you have?"
        ariaLabel="How much time do you have?"
        options={TIME_OPTIONS}
        selected={String(timeMinutes)}
        onToggle={(id) => onTimeChange(Number(id))}
      />

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

      <div className="idea-helper-row idea-helper-row-3">
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

        <div className="idea-helper-field">
          <Select
            label="Language"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as PlayLanguage)}
            options={[
              { value: "en", label: "English" },
              { value: "fil", label: "Filipino" },
              { value: "hil", label: "Hiligaynon" },
            ]}
          />
        </div>
      </div>

      <div className="idea-helper-field idea-helper-materials-field">
        <TextField
          label="What do you have at home?"
          placeholder="For example: cups, spoon, towel, cardboard box"
          hint="Optional. Separate items with a comma. Safe household items can be adapted even if not in the catalog."
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
