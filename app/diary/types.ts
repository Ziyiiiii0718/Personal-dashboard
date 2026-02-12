export interface DiaryEntry {
  id: string;
  dateISO: string; // YYYY-MM-DD
  title?: string;
  content: string;
  updatedAt: string; // ISO
  createdAt: string; // ISO
}

export interface DiaryMeta {
  lastUpdated?: string; // ISO
}
