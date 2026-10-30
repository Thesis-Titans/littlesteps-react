/** No privacy contact is decided yet (NFR-PRIV-04); never replace this with an invented address. */
export const PRIVACY_CONTACT = "Privacy contact: to be confirmed by the team.";

/** Every Account page route, so pages and the route test share one list. */
export const ACCOUNT_PATHS = {
  menu: "/account",
  settings: "/account/settings",
  privacy: "/account/privacy",
  about: "/account/about",
  help: "/account/help",
} as const;
