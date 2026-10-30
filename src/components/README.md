# Shared components

Build every screen from these components and the tokens in `src/styles/tokens.css`. Don't restyle buttons, fields or states inside a feature. If you need a component or a variant that isn't here, comment on [react #22](https://github.com/Thesis-Titans/littlesteps-react/issues/22) so it's added for everyone.

- **Import:** `import { Button, TextField } from "../components/common";`
- **See them live:** run `npm run dev` and open [`/dev/components`](http://127.0.0.1:5173/dev/components). It shows every component in every state and exists only in development builds.
- **Design source:** Figma page `02 · Components`; rules in the [UI/UX specification](https://github.com/Thesis-Titans/littlesteps-docs/blob/main/docs/ui-ux-design-specification.md) §2.5 (interaction), §2.6 (wording), §6 (tokens), §7 (the five states).
- **Flutter:** the same set lives in `lib/widgets/` of `littlesteps-flutter` (flutter #2), mapped by UI/UX spec §9.

`common/` holds these shared components and `Logo`. `layout/` holds the app shell and navigation (react #18).

## Components

| Component | Use it for | Key props | States and accessibility |
|---|---|---|---|
| `Button` | Every action | `variant`: `primary` (one per screen), `secondary`, `text` (links like "Forgot password?"), `danger` (permanent deletes); `busy`; `fullWidth` | 48px tall (text buttons 44px). `busy` disables it and sets `aria-busy`. Disabled is dimmed and not clickable. |
| `TextField` | Single-line input, or notes with `multiline` | `label` (always visible), `hint`, `error`, `maxLength` (shows "0 / 500") | The label is tied to the field. `error` sets `aria-invalid` and links the message with `aria-describedby`. Error style uses the error tokens. Paste is never blocked. |
| `Select` | Picking one option from a short list (child's age, week) | `label`, `options`, `hint`, `error` | Native `<select>`, so it works with the keyboard and screen readers on every phone. |
| `Chip` | Filters and choices (Thinking, Moving, Under 10 min) | `selected` | A toggle button with `aria-pressed`. 48px tall. |
| `Card` | Grouping content | `as` (`div`, `section`, `article`, `li`), `elevated` | Use `elevated` only for cards on the page background, not cards inside cards. |
| `Badge` | Short status labels | `kind`: `source`, `completed`, `ai`, `private`, `offline` | Default text follows the wording rules; pass children only to change it. Every AI-written result must show `<Badge kind="ai" />` (NFR-AI-04). |
| `InlineAlert` | Errors, offline messages and notices inside the page | `kind`: `error`, `offline`, `info`, `caution`; `title`; `action` (e.g. a Retry button) | Errors use `role="alert"`, the rest `role="status"`. It stays until the problem is solved, so never use a toast for errors. |
| `Skeleton` | Loading state | `kind`: `card`, `row`, `profile`; `label` ("Loading activities…") | The label is announced once; the shapes are hidden from screen readers. The pulse stops under reduced motion. |
| `EmptyState` | A list with nothing in it yet | `title`, children, `action` | Say what will appear and how to add the first item. No blame, no "you haven't…". |
| `ConfirmDialog` | Permanent actions only: deleting a note, a child's records or the account | `open`, `title`, `confirmLabel`, `destructive`, `onConfirm`, `onCancel` | Native `<dialog>`: keeps focus inside, Escape cancels, and Cancel gets focus first. The confirm button names the action ("Delete note"), never "OK". |
| `UndoToast` | Reversible actions (mark complete) | `message`, `onUndo`, `onClose`, `durationMs` | Stays at least 10 seconds and pauses while hovered or focused (`role="status"`). Prefer undo over a confirm dialog when the action can be reversed. |
| `SuccessNotice` | Confirming a finished action ("Maya added.") | `message` (optional), `onClose`, `durationMs` | Always renders an empty `role="status"` region; keep it mounted and change `message` so the text is announced (the alert, check icon and "Dismiss message" button render inside it). Dismissing moves focus to the page `h1`. The timer restarts for each new message. Stays at least 10 seconds and pauses while hovered or focused. No motion, so nothing to turn off for reduced motion. |
| `Icon` | The 15 Figma icons in `src/assets/icons` | `name`, `size` (16, 20, 24), `label` | Takes the text color. Decorative by default (`aria-hidden`). Give a `label` only when the icon is the only content of a control. |

## Five states on every screen

Each screen shows the right component for each state (UI/UX spec §7):

| State | Component |
|---|---|
| Populated | Cards and lists |
| Empty | `EmptyState` |
| Loading | `Skeleton` |
| Error or permission denied | `InlineAlert kind="error"` |
| Offline or AI fallback | `InlineAlert kind="offline"` or `kind="caution"` |

Offline messages never say something was saved when it wasn't.

## Wording (UI/UX spec §2.6)

Parents read LittleSteps in short bursts, often one-handed, sometimes in their second or third language, and often worried about being judged. Every label, message and empty state follows these rules:

- **Everyday words.** Name things the way a parent would. No catalog, domain, observation, assessment, analytics, generate or JSON on screen.
- **Short and calm.** One idea per sentence. Say a reassurance once per screen, not on every card.
- **No blame, no verdicts.** Never imply a child is behind or a parent has fallen short. No daily goals or streaks.
- **Errors say what happened and what is still safe**, then what to do next: "It may have been deleted. Your own notes are safe."
- **Label AI, don't sell it.** AI-written output shows `<Badge kind="ai" />`. Features are named for what they do ("Idea helper").
- **Point to real people.** For worries about development: "your pediatrician or barangay health worker".
- **Buttons name the action**: "Save note", "Delete note", "Add to today's plan".

| Instead of | Say |
|---|---|
| AI helper · Generate another · catalog | Idea helper · Another idea · our activity list |
| Cognitive · Motor · Language · Socio-Emotional | Thinking · Moving · Talking · Feelings |
| Domain · Age band · Setting | Kind of play · Child's age · Place |
| Record an observation · Observed · Not yet observed | Note what you saw · I saw it / Not seen yet · Seen on Oct 21 |
| This is not a developmental assessment | It's not a test |
| Never sent to AI, analytics or error logs | Only you can see these notes. We never share them. |

The API and data model keep their technical names (`observed`, `not_yet_observed`, `socioEmotional`); only the words on screen change.

## Adding or changing a component

1. Check Figma `02 · Components` first. If the design isn't there, agree it with the frontend lead before building.
2. Use tokens only: no hex colors, pixel spacing or radii outside `tokens.css`.
3. Cover default, focus, disabled and error states where they apply, and add the component to `/dev/components`.
4. Add or update a test in `common/components.test.tsx` for any behavior (ARIA, timing, keyboard).
