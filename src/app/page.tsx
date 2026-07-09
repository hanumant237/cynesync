"use client";

/**
 * CineSync — Root page (single route)
 *
 * The only user-facing route (`/`). Acts as the view router: it reads the
 * active view from the NavigationContext and renders the matching page
 * component. All "pages" (Home, Player, Watch Party, Settings, 404) are
 * client-side views rendered here — no additional server routes are created.
 */

import { useNavigation } from "@/hooks/useNavigation";
import { HomePage } from "@/views/HomePage";
import { PlayerPage } from "@/views/PlayerPage";
import { WatchPartyPage } from "@/views/WatchPartyPage";
import { SettingsPage } from "@/views/SettingsPage";
import { NotFoundPage } from "@/views/NotFoundPage";
import type { ViewId } from "@/types/navigation";

/** Maps a view id to its rendered component. */
const VIEWS: Record<ViewId, () => React.JSX.Element> = {
  home: HomePage,
  player: PlayerPage,
  "watch-party": WatchPartyPage,
  settings: SettingsPage,
  "not-found": NotFoundPage,
};

export default function Home() {
  const { view } = useNavigation();
  const CurrentView = VIEWS[view] ?? NotFoundPage;

  return <CurrentView />;
}
