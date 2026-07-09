/**
 * CineSync — Footer
 *
 * Simple, professional footer: brand, tagline, and a set of labelled link
 * columns (placeholder anchors only — no business logic). Pinned to the bottom
 * via the MainLayout's `mt-auto` on short pages.
 */

import { APP_NAME, APP_TAGLINE } from "@/utils/constants";
import { Container } from "@/components/common/Container";
import { Logo } from "@/components/common/Logo";

/** Placeholder link groups. These are UI-only anchors in this phase. */
const FOOTER_GROUPS: ReadonlyArray<{
  title: string;
  links: ReadonlyArray<string>;
}> = [
  { title: "Product", links: ["Features", "Watch Party", "Library", "Player"] },
  { title: "Company", links: ["About", "Privacy", "Terms", "Contact"] },
  { title: "Resources", links: ["Docs", "Status", "Changelog", "Help"] },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/10 bg-background">
      <Container className="py-12">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-5">
          {/* Brand block */}
          <div className="col-span-2 flex flex-col gap-3">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              {APP_TAGLINE} A premium home for the videos you own and love.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/80">
                {group.title}
              </h3>
              <ul className="flex flex-col gap-2">
                {group.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      onClick={(e) => e.preventDefault()}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {year} {APP_NAME}. All rights reserved.
          </p>
          <p>Built for the videos you own or are authorized to access.</p>
        </div>
      </Container>
    </footer>
  );
}
