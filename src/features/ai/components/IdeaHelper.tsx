import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Chip,
  Icon,
  InlineAlert,
  Select,
  TextField,
} from "../../../components/common";
import { ageBandLabel, type AgeBand } from "../../children/types";
import { DOMAIN_LABELS, DOMAINS, SETTING_LABELS, type Domain, type Setting } from "../../catalog/types";
import { ApiError, buildDeterministicFallback, getAiRecommendations } from "../api";
import type { RecommendationRequest, RecommendationResponse } from "../types";

type IdeaHelperProps = {
  ageBand: AgeBand;
  childNickname?: string;
  onSelectActivity?: (activityId: string) => void;
};

type ViewState = "form" | "loading" | "results";

const TIME_CHOICES = [10, 15, 30, 45] as const;

export function IdeaHelper({ ageBand, childNickname, onSelectActivity }: IdeaHelperProps) {
  const [viewState, setViewState] = useState<ViewState>("form");
  const [timeMinutes, setTimeMinutes] = useState<number>(15);
  const [setting, setSetting] = useState<Setting>("either");
  const [materialsText, setMaterialsText] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<Domain | "all">("all");
  const [response, setResponse] = useState<RecommendationResponse | null>(null);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);

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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setViewState("loading");
    setRateLimitMessage(null);
    setFallbackReason(null);

    const request = buildRequest();

    try {
      const res = await getAiRecommendations(request);
      setResponse(res);
      setViewState("results");
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        // Rate limited fallback
        setRateLimitMessage(
          "Let's take a short break. You've asked for many ideas in a row. Please wait a minute, then try again."
        );
        const fallback = buildDeterministicFallback(
          request,
          "A favorite activity for this age while the idea helper takes a short break."
        );
        setResponse(fallback);
        setViewState("results");
      } else {
        // Provider failure / offline / 5xx fallback
        const childNameText = childNickname ? `${childNickname}'s` : "this";
        setFallbackReason(
          `The idea helper isn't working right now. Here are a few favorites for ${childNameText} age from our activity list.`
        );
        const fallback = buildDeterministicFallback(request);
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
            Idea helper
          </h2>
          {isAiSuggestion && <Badge kind="ai" />}
        </div>
        <p className="idea-helper-subtitle">
          Find a personalized play idea for {childName} in seconds.
        </p>
      </div>

      {viewState === "form" && (
        <form className="idea-helper-form" onSubmit={handleSubmit}>
          {/* Time question */}
          <fieldset className="idea-helper-fieldset">
            <legend className="idea-helper-legend">How much time do you have?</legend>
            <div className="idea-helper-chips" role="radiogroup" aria-label="How much time do you have?">
              {TIME_CHOICES.map((mins) => (
                <Chip
                  key={mins}
                  selected={timeMinutes === mins}
                  onClick={() => setTimeMinutes(mins)}
                  aria-label={`${mins} minutes`}
                >
                  {mins} min
                </Chip>
              ))}
            </div>
          </fieldset>

          {/* Setting question */}
          <div className="idea-helper-field">
            <Select
              label="Where will you play?"
              value={setting}
              onChange={(e) => setSetting(e.target.value as Setting)}
              options={[
                { value: "either", label: "Indoor or outdoor" },
                { value: "indoor", label: "Indoor" },
                { value: "outdoor", label: "Outdoor" },
              ]}
            />
          </div>

          {/* Domain question */}
          <div className="idea-helper-field">
            <Select
              label="Kind of play"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value as Domain | "all")}
              options={[
                { value: "all", label: "Any kind of play" },
                ...DOMAINS.map((domain) => ({
                  value: domain,
                  label: DOMAIN_LABELS[domain],
                })),
              ]}
            />
          </div>

          {/* Materials question */}
          <div className="idea-helper-field">
            <TextField
              label="What do you have at home?"
              placeholder="For example: cups, spoon, towel, paper"
              hint="Optional. Separate items with a comma."
              value={materialsText}
              onChange={(e) => setMaterialsText(e.target.value)}
            />
          </div>

          <div className="idea-helper-actions">
            <Button variant="primary" type="submit" fullWidth>
              Find ideas
            </Button>
          </div>
        </form>
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
                The idea helper isn't working right now. Here are a few favorites for {childName}'s age from our activity list.
              </p>
            </div>
          )}

          {/* Non-diagnostic disclaimer on every idea response */}
          <p className="idea-helper-disclaimer">
            Observational play suggestion only. Not developmental assessment.
          </p>

          {/* Tier 1 guidance note */}
          {isAiSuggestion && response.provenance.guidance && (
            <p className="idea-helper-guidance">
              {response.provenance.guidance}
            </p>
          )}

          {/* Suggestions List */}
          <div className="idea-helper-suggestions">
            {response.suggestions.map((suggestion) => (
              <article key={suggestion.activityId} className="idea-suggestion-card">
                <div className="idea-suggestion-header">
                  <span className={`catalog-domain-tag catalog-domain-${suggestion.activity.domain}`}>
                    {DOMAIN_LABELS[suggestion.activity.domain]}
                  </span>
                  <span className="catalog-meta-item">
                    <Icon name="clock" size={16} />
                    {suggestion.activity.durationEstimate || `${suggestion.activity.durationMinutes} min`}
                  </span>
                </div>

                <h3 className="idea-suggestion-title">{suggestion.title}</h3>

                <p className="idea-suggestion-why">
                  <strong>Why we picked it:</strong> {suggestion.whyPicked}
                </p>

                <div className="idea-suggestion-meta">
                  <span>{ageBandLabel(suggestion.activity.ageBand)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{SETTING_LABELS[suggestion.activity.setting]}</span>
                </div>

                {suggestion.activity.materials.length > 0 && (
                  <div className="idea-suggestion-materials">
                    <span className="idea-materials-label">Materials:</span>{" "}
                    {suggestion.activity.materials.join(", ")}
                  </div>
                )}

                <div className="idea-suggestion-steps">
                  <h4 className="idea-steps-title">Steps to play:</h4>
                  <ol className="catalog-instructions-list">
                    {suggestion.activity.instructions.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>

                {onSelectActivity && (
                  <Button
                    variant="secondary"
                    onClick={() => onSelectActivity(suggestion.activityId)}
                  >
                    View in catalog
                  </Button>
                )}
              </article>
            ))}
          </div>

          <div className="idea-helper-results-actions">
            <Button variant="secondary" onClick={() => void handleSubmit()}>
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
