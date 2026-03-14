import { Card, PageLayout } from "../components/ui";

export default function RecipesPage() {
  return (
    <PageLayout title="Recipes">
      <Card>
        <p className="text-muted">
          Saved recipes and meal ideas will appear here.
        </p>
      </Card>
    </PageLayout>
  );
}
