"use client";

/**
 * CineSync — Not Found (404) page (placeholder)
 *
 * Shown when the in-app view router cannot resolve a requested view
 * (e.g. an unknown URL hash). Displays the page title only.
 */

import { PageShell } from "@/components/layout/PageShell";
import { useNavigation } from "@/hooks/useNavigation";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  const { navigate } = useNavigation();

  return (
    <PageShell title="404 — Page Not Found">
      <p className="text-sm text-muted-foreground">
        The view you requested does not exist.
      </p>
      <div>
        <Button type="button" variant="default" onClick={() => navigate("home")}>
          Back to Home
        </Button>
      </div>
    </PageShell>
  );
}
