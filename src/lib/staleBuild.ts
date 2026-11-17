/**
 * After a new version of the site is published, the old version's code files are gone (the host answers 404).
 * A visitor or a search-engine crawler still holding the old page then fails to load the next page's code, and
 * the site showed "Something went wrong" (founder report, Nov 17 2026: Google showed that text as the
 * homepage's description). A failed code load now reloads the page once, which fetches the new version.
 */
const KEY = "cd:stale-build-reload";

export const isStaleBuildError = (error: unknown) =>
  /dynamically imported module|Importing a module script failed|Loading chunk|error loading dynamically|module script/i.test(
    error instanceof Error ? error.message : String(error ?? ""),
  );

/** Reloads once per visit; false if it already tried (so a real outage can't loop). */
export function reloadForNewBuild(): boolean {
  try {
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last < 60_000) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch { /* storage off: still reload once per page */ }
  window.location.reload();
  return true;
}

/** Vite reports a failed preload before React sees it; reloading here avoids the error screen entirely. */
export function watchForNewBuild() {
  window.addEventListener("vite:preloadError", (event) => {
    if (reloadForNewBuild()) event.preventDefault();
  });
}

/** Search-engine and link-preview crawlers: they get the site's own summary instead of an error screen. */
export const isCrawler = () =>
  /bot|crawler|spider|crawling|Googlebot|bingbot|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|WhatsApp|Discordbot|Lighthouse|PageSpeed/i.test(
    typeof navigator === "undefined" ? "" : navigator.userAgent,
  );
