import { Card, PageLayout } from "../components/ui";

export default function SettingsPage() {
  return (
    <PageLayout title="Settings">
      <Card>
        <p className="text-zinc-600 dark:text-zinc-400">
          App preferences and account settings will be managed here.
        </p>
      </Card>
    </PageLayout>
  );
}
