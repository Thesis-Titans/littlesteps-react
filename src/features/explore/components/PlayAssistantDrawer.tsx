import { useState, useRef, useEffect } from "react";
import { Badge, Button, Card } from "../../../components/common";
import { sendAiChat } from "../../ai/api";
import type { ChatActivitySuggestion } from "../../ai/types";
import type { CatalogActivity, Domain } from "../../catalog/types";
import type { AgeBand } from "../../children/types";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  suggestedActivity?: ChatActivitySuggestion | null;
  badge?: string | null;
}

let counter = 0;
function createMessageId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

interface PlayAssistantProps {
  ageBand: AgeBand;
  childNickname?: string;
  onPlan?: (activity: CatalogActivity) => void;
}

const PROMPT_STARTERS = [
  "What can we play with an empty cardboard box?",
  "10-minute quiet indoor play ideas",
  "How can my child and an older sibling play together?",
  "Fun exploratory play using cups and spoons",
];

export function PlayAssistantDrawer({
  ageBand,
  childNickname = "your child",
  onPlan,
}: PlayAssistantProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      text: `Hello! I'm your LittleSteps Play Companion. What household items do you have on hand today, or what kind of play are you and ${childNickname} looking for?`,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
    }
  }, [messages, open]);

  const handleSend = async (messageText: string) => {
    const text = messageText.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: createMessageId("user"),
      sender: "user",
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendAiChat({
        message: text,
        ageBand,
        childNickname,
      });

      const assistantMsg: Message = {
        id: createMessageId("assistant"),
        sender: "assistant",
        text: res.reply,
        suggestedActivity: res.suggestedActivity,
        badge: res.provenance.badge,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId("assistant-err"),
          sender: "assistant",
          text: "I couldn't reach the assistant right now. Try again in a moment, or try one of the activity ideas from our catalog above!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanActivity = (suggestion: ChatActivitySuggestion) => {
    if (!onPlan) return;
    const validDomains: Domain[] = ["cognitive", "motor", "language", "socioEmotional"];
    const matchedDomain = validDomains.find((d) => d === suggestion.domain) ?? "cognitive";

    const activity: CatalogActivity = {
      id: createMessageId("ai-chat"),
      title: suggestion.title,
      type: "activity",
      language: "en",
      setting: "indoor",
      ageBand,
      domain: matchedDomain,
      durationMinutes: suggestion.durationMinutes || 10,
      durationEstimate: `${suggestion.durationMinutes || 10} mins`,
      materials: suggestion.materials.length > 0 ? suggestion.materials : ["Everyday household items"],
      instructions: [suggestion.instructions],
      provenanceSource: "Suggested by LittleSteps Play Assistant",
      status: "reviewed_approved",
      limitations: suggestion.safetyNotice,
    };
    onPlan(activity);
  };

  return (
    <section className="play-assistant-section" aria-labelledby="assistant-title" style={{ marginTop: "var(--space-24)" }}>
      <Card as="div" style={{ padding: "var(--space-20)", border: "1px solid var(--color-border-subtle)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-8)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-8)" }}>
            <h2 id="assistant-title" className="catalog-title" style={{ margin: 0, fontSize: "1.25rem" }}>
              Play Assistant
            </h2>
            <Badge kind="ai" />
          </div>
          <Button
            variant="secondary"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-controls="assistant-chat-body"
          >
            {open ? "Hide conversation" : "Ask for a play adaptation"}
          </Button>
        </div>

        <p className="catalog-subtitle" style={{ margin: "var(--space-8) 0 0" }}>
          Have everyday items at home? Ask how to turn them into safe, age-appropriate play for {childNickname}.
        </p>

        {open && (
          <div id="assistant-chat-body" style={{ marginTop: "var(--space-16)", display: "flex", flexDirection: "column", gap: "var(--space-16)" }}>
            {/* Quick Starters */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-6)" }}>
              {PROMPT_STARTERS.map((starter, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => void handleSend(starter)}
                  disabled={loading}
                  style={{
                    background: "var(--color-surface-soft-green)",
                    border: "1px solid var(--color-border-subtle)",
                    borderRadius: "9999px",
                    padding: "4px var(--space-12)",
                    font: "var(--font-meta)",
                    color: "var(--color-text-brand)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {starter}
                </button>
              ))}
            </div>

            {/* Message Thread */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-12)",
                maxHeight: "360px",
                overflowY: "auto",
                padding: "var(--space-12)",
                background: "var(--color-surface-page)",
                borderRadius: "var(--radius-card)",
                border: "1px solid var(--color-border-subtle)",
              }}
              role="log"
              aria-live="polite"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    background: msg.sender === "user" ? "var(--color-brand-forest)" : "var(--color-surface-card)",
                    color: msg.sender === "user" ? "#ffffff" : "var(--color-text-primary)",
                    padding: "var(--space-12) var(--space-16)",
                    borderRadius: "var(--radius-card)",
                    border: msg.sender === "user" ? "none" : "1px solid var(--color-border-subtle)",
                    boxShadow: "var(--elevation-card)",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: "1.5" }}>{msg.text}</p>

                  {/* Structured Play Idea Card */}
                  {msg.suggestedActivity && (
                    <div
                      style={{
                        marginTop: "var(--space-12)",
                        padding: "var(--space-12)",
                        background: "var(--color-surface-soft-green)",
                        borderRadius: "var(--radius-control)",
                        border: "1px solid var(--color-border-subtle)",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
                        <span className="storybook-subject-tag">{msg.suggestedActivity.domain}</span>
                        <span style={{ font: "var(--font-meta)", color: "var(--color-text-secondary)" }}>
                          {msg.suggestedActivity.durationMinutes} mins
                        </span>
                      </div>
                      <h4 style={{ margin: "0 0 var(--space-6)", font: "var(--font-h3)" }}>
                        {msg.suggestedActivity.title}
                      </h4>
                      <p style={{ margin: "0 0 var(--space-8)", fontSize: "0.9rem", lineHeight: "1.4" }}>
                        {msg.suggestedActivity.instructions}
                      </p>
                      {msg.suggestedActivity.safetyNotice && (
                        <p style={{ margin: "0 0 var(--space-10)", font: "var(--font-meta)", color: "var(--color-text-secondary)" }}>
                          <strong>Safety:</strong> {msg.suggestedActivity.safetyNotice}
                        </p>
                      )}
                      {onPlan && (
                        <Button
                          variant="primary"
                          onClick={() => handlePlanActivity(msg.suggestedActivity!)}
                          style={{ width: "100%" }}
                        >
                          Add to today&apos;s plan
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div style={{ alignSelf: "flex-start", padding: "var(--space-8) var(--space-12)", font: "var(--font-meta)", color: "var(--color-text-secondary)" }}>
                  Thinking of a play idea for {childNickname}…
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSend(input);
              }}
              style={{ display: "flex", gap: "var(--space-8)" }}
            >
              <input
                type="text"
                className="ls-input"
                placeholder={`Ask for a play idea with ${childNickname || "your child"}...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                style={{ flex: 1, minHeight: "var(--size-touch-target-min)" }}
                aria-label="Ask the play assistant a question"
              />
              <Button type="submit" variant="primary" disabled={loading || !input.trim()}>
                Send
              </Button>
            </form>

            <footer style={{ font: "var(--font-meta)", color: "var(--color-text-secondary)", textAlign: "center" }}>
              Observational play suggestions only. For health or developmental concerns, consult your pediatrician or local barangay health worker.
            </footer>
          </div>
        )}
      </Card>
    </section>
  );
}
