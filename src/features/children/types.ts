export type Child = {
  id: string;
  nickname: string;
  /** Age band derived from birthdate, e.g. "12–24 months" */
  ageBand: string;
};

export type ChildState = {
  activeChild: Child | null;
  setActiveChild: (child: Child | null) => void;
};
