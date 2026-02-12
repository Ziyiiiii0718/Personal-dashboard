import { Card, PageLayout } from "../components/ui";

export default function GoalsPage() {
  return (
    <PageLayout title="Goals">
      <Card>
        <p className="text-zinc-600 dark:text-zinc-400">
          Your goals and progress will be displayed here.
        </p>
      </Card>
    </PageLayout>
  );
}
