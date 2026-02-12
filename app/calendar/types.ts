export type DeadlineType = "ddl" | "exam";

export interface DeadlineItem {
  id: string;
  title: string;
  type: DeadlineType;
  date: string; // YYYY-MM-DD
  notes?: string;
}
