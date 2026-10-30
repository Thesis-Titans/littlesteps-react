/** Success messages after adding or editing a child (UI/UX spec §7 wording). Pure, so they can be tested. */
export const addedMessage = (nickname: string) => `${nickname} added.`;
export const savedMessage = (nickname: string) => `Changes to ${nickname} saved.`;

/** What the route passes to the children list after an edit. */
export const noticeState = (message: string) => ({ notice: message });

/** Reads a message from router location state; anything else (reload, old entry, odd value) gives none. */
export function readNotice(state: unknown): string | undefined {
  const notice = (state as { notice?: unknown } | null)?.notice;
  return typeof notice === "string" && notice !== "" ? notice : undefined;
}

export type PageNotice = { message: string; path: string };

/** A message belongs to the page it was raised on; moving to another page clears it. */
export const noticeFor = (notice: PageNotice | undefined, path: string) => (notice?.path === path ? notice.message : undefined);
