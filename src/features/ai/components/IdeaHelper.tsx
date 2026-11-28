import { useState, type FormEvent } from "react";
import {
  Badge,
  Button,
  Card,
  InlineAlert,
  SessionExpiredAlert,
} from "../../../components/common";
import { NON_DIAGNOSTIC_PLAY_DISCLAIMER } from "../../../config/externalLinks";
import { failureKind } from "../../../services/offline";
import { useWeather } from "../../../services/weather";
import type { CatalogActivity, Domain, Setting } from "../../catalog/types";
import type { AgeBand } from "../../children/types";
import { ApiError, buildDeterministicFallback, getAiRecommendations } from "../api";
import type { RecommendationRequest, RecommendationResponse } from "../types";
import { IdeaHelperForm } from "./IdeaHelperForm";
import { IdeaSuggestionCard } from "./IdeaSuggestionCard";

export interface IdeaHelperProps {
  ageBand: AgeBand;
  childNickname?: string;
  /** Optional preset setting passed from Today's weather play hint. */
  initialSetting?: Setting;
  onSelectActivity?: (activityId: string) => void;
  onPlanActivity?: (activity: CatalogActivity) => void;
}

type ViewState = "form" | "loading" | "results" | "unauthorized";

/**
 * Constrained AI Idea Helper that gathers play preferences and falls back gracefully to reviewed picks.
 */
export function IdeaHelper({
  ageBand,
  childNickname,
  initialSetting,
  onSelectActivity,
  onPlanActivity,
}: IdeaHelperProps) {
  const [viewState, setViewState] = useState<ViewState>("form");
  const [timeMinutes, setTimeMinutes] = useState<number>(15);
  const [userSetting, setUserSetting] = useState<Setting | null>(initialSetting ?? null);
  const [prevInitialSetting, setPrevInitialSetting] = useState<Setting | undefined>(initialSetting);
  const [materialsText, setMaterialsText] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<Domain | "all">("all");
  const [response, setResponse] = useState<RecommendationResponse | null>(null);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [fallbackCycle, setFallbackCycle] = useState(0);

  if (initialSetting !== prevInitialSetting) {
    setPrevInitialSetting(initialSetting);
    if (initialSetting) {
      setUserSetting(initialSetting);
    }
  }

  const { weather, cityName } = useWeather();
  const defaultSetting: Setting = weather?.suggestedSetting === "indoor" ? "indoor" : "either";
  const setting: Setting = userSetting ?? defaultSetting;

  const parsedMaterials = materialsText
    .split(",")
    .map((m) => m.trim().toLowerCase())
    .filter((m) => m.length > 0 && m.length <= 40)
    .slice(0, 10);

  const buildRequest = (): RecommendationRequest => ({
    ageBand,
    timeMinutes,
    setting,
    domain: selectedDomain !== "all" ? selectedDomain : undefined,
    materials: parsedMaterials,
    language: "en",
    count: 3,
  });

  const handleSubmit = async (e?: FormEvent, isAnother = false) => {
    if (e) e.preventDefault();
    setViewState("loading");
    setRateLimitMessage(null);
    setFallbackReason(null);

    const nextCycle = isAnother ? fallbackCycle + 1 : 0;
    setFallbackCycle(nextCycle);

    const request = buildRequest();

    try {
      let res = await getAiRecommendations(request);
      if (!res.suggestions || res.suggestions.length === 0) {
        res = buildDeterministicFallback(request, undefined, nextCycle * 3);
      }
      setResponse(res);
      setViewState("results");
    } catch (err) {
      if (failureKind(err, true) === "unauthorized") {
        setViewState("unauthorized");
      } else if (err instanceof ApiError && err.status === 429) {
        setRateLimitMessage(
          "Let's take a short break. You've asked for many ideas in a row. Please wait a minute, then try again."
        );
        const fallback = buildDeterministicFallback(
          request,
          "A favorite activity for this age while the idea helper takes a short break.",
          nextCycle * 3
        );
        setResponse(fallback);
        setViewState("results");
      } else {
        const childNameText = childNickname ? `${childNickname}'s` : "this";
        setFallbackReason(
          `The idea helper isn't working right now. Here are a few favorites for ${childNameText} age from our activity list.`
        );
        const fallback = buildDeterministicFallback(request, undefined, nextCycle * 3);
        setResponse(fallback);
        setViewState("results");
      }
    }
  };

  const handleReset = () => {
    setViewState("form");
    setRateLimitMessage(null);
    setFallbackReason(null);
  };

  const childName = childNickname ?? "your child";
  const isAiSuggestion = response?.source === "ai" && response?.tier === 1;

  return (
    <Card as="section" elevated className="idea-helper-card" aria-labelledby="idea-helper-heading">
      <div className="idea-helper-header">
        <div className="idea-helper-title-row">
          <h2 id="idea-helper-heading" className="idea-helper-title">
            Idea Helper
          </h2>
          {isAiSuggestion && <Badge kind="ai" />}
        </div>
        <p className="idea-helper-subtitle">
          Find a play idea for {childName} with the time and materials you have.
        </p>
      </div>

      {viewState === "form" && (
        <IdeaHelperForm
          timeMinutes={timeMinutes}
          setting={setting}
          selectedDomain={selectedDomain}
          materialsText={materialsText}
          weather={weather}
          cityName={cityName}
          onTimeChange={setTimeMinutes}
          onSettingChange={setUserSetting}
          onDomainChange={setSelectedDomain}
          onMaterialsChange={setMaterialsText}
          onSubmit={(e) => void handleSubmit(e)}
        />
      )}

      {viewState === "loading" && (
        <div className="idea-helper-loading" aria-live="polite">
          <div className="idea-helper-shimmer">
            <p className="idea-helper-loading-text">
              Finding ideas for {childName}… This usually takes a few seconds.
            </p>
            <div className="idea-helper-loading-bar" aria-hidden="true" />
          </div>
        </div>
      )}

      {viewState === "unauthorized" && <SessionExpiredAlert />}

      {viewState === "results" && response && (
        <div className="idea-helper-results" aria-live="polite">
          {rateLimitMessage && (
            <InlineAlert kind="caution" title="Taking a short break">
              <p>{rateLimitMessage}</p>
            </InlineAlert>
          )}

          {fallbackReason && !rateLimitMessage && (
            <InlineAlert kind="info" title="Our picks">
              <p>{fallbackReason}</p>
            </InlineAlert>
          )}

          {!isAiSuggestion && !rateLimitMessage && !fallbackReason && (
            <div className="idea-helper-fallback-heading">
              <h3 className="idea-helper-fallback-title">Our picks</h3>
              <p className="idea-helper-fallback-subtitle">
                The idea helper isn&apos;t working right now. Here are a few favorites for {childName}&apos;s age from our activity list.
              </p>
            </div>
          )}

          <p className="idea-helper-disclaimer">{NON_DIAGNOSTIC_PLAY_DISCLAIMER}</p>

          {isAiSuggestion && response.provenance.guidance && (
            <p className="idea-helper-guidance">{response.provenance.guidance}</p>
          )}

          <div className="idea-helper-suggestions">
            {response.suggestions.map((suggestion) => (
              <IdeaSuggestionCard
                key={suggestion.activityId}
                suggestion={suggestion}
                onPlanActivity={onPlanActivity}
                onSelectActivity={onSelectActivity}
              />
            ))}
          </div>

          <div className="idea-helper-results-actions">
            <Button variant="secondary" onClick={() => void handleSubmit(undefined, true)}>
              Another idea
            </Button>
            <Button variant="text" onClick={handleReset}>
              Change answers
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
