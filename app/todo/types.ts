export type TodoSource = "manual" | "deadline";

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  dueDateISO?: string;
  source: TodoSource;
  sourceId?: string;
  createdAt: string; // ISO
}
