export const WORKOUT_CATEGORIES = [
  "upper_body",
  "lower_body",
  "core",
  "dance",
  "badminton",
  "swimming",
  "run",
  "walk",
  "cycling",
  "other_cardio",
  "pilates",
  "mobility",
  "stretch",
  "yoga",
  "rest",
] as const;

export type WorkoutCategory = (typeof WORKOUT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<WorkoutCategory, string> = {
  upper_body: "Upper Body",
  lower_body: "Lower Body",
  core: "Core",
  dance: "Dance",
  badminton: "Badminton",
  swimming: "Swimming",
  run: "Run",
  walk: "Walk",
  cycling: "Cycling",
  other_cardio: "Other Cardio",
  pilates: "Pilates",
  mobility: "Mobility",
  stretch: "Stretch",
  yoga: "Yoga",
  rest: "Rest",
};

export type Intensity = "low" | "medium" | "high";

export const INTENSITY_LABELS: Record<Intensity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export interface WorkoutEntry {
  id: string;
  dateISO: string; // YYYY-MM-DD
  category: WorkoutCategory;
  title: string;
  durationMin?: number;
  intensity?: Intensity;
  notes?: string;
  createdAt: string; // ISO
}
