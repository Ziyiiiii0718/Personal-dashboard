import { Card, PageLayout } from "../components/ui";

export default function DiaryPage() {
  return (
    <PageLayout title="Diary">
      <Card>
        <p className="text-zinc-600 dark:text-zinc-400">
          Journal entries and daily notes will go here.
        </p>
      </Card>
    </PageLayout>
  );
}
