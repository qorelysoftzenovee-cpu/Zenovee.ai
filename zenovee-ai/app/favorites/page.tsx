import { requireStandardUser } from "@/lib/auth";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { FavoritesClient } from "./favorites-client";

export default async function FavoritesPage() {
  await requireStandardUser();

  return (
    <WorkspaceShell title="Favorites">
      <FavoritesClient />
    </WorkspaceShell>
  );
}
