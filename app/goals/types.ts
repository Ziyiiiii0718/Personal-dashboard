export type GoalCategory =
  | "fitness"
  | "weight"
  | "study"
  | "health"
  | "life"
  | "other";

export interface Goal {
  id: string;
  title: string;
  category: GoalCategory;
  target?: number;
  unit?: string;
  deadlineISO?: string;
  note?: string;
  createdAt: number;
}

export const GOAL_CATEGORIES: GoalCategory[] = [
  "fitness",
  "weight",
  "study",
  "health",
  "life",
  "other",
];
