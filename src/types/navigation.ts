/**
 * CineSync — Navigation Types
 *
 * Defines the set of client-side views available within the single `/` route.
 * Navigation is handled in-app (see NavigationContext) rather than via
 * separate server routes, which keeps the app aligned with the single-route
 * constraint of the host environment.
 */

/**
 * Identifier for a navigable view within the application.
 * `player` is reachable via the Play button / quick access rather than the
 * primary Navbar, so it is a valid destination but not a Navbar entry.
 */
export type ViewId =
  | "home"
  | "library"
  | "player"
  | "watch-party"
  | "settings"
  | "not-found";

/** A single navigation entry used by the Navbar and routing helpers. */
export interface NavItem {
  id: ViewId;
  label: string;
}

/** Shape of the navigation context value consumed via useNavigation. */
export interface NavigationContextValue {
  /** The currently active view. */
  view: ViewId;
  /** Navigate to a different view. */
  navigate: (view: ViewId) => void;
}
