import { Card, PageLayout } from "../components/ui";

export default function RecipesPage() {
  return (
    <PageLayout title="Recipes">
      <Card>
        <p className="text-zinc-600 dark:text-zinc-400">
          Saved recipes and meal ideas will appear here.
        </p>
      </Card>
    </PageLayout>
  );
}
