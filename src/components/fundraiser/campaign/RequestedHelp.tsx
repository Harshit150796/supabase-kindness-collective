import { Link } from "react-router-dom";
import { NeedIcon } from "@/components/apply/NeedsAndStores";
import { RetailerLogo } from "@/components/landing/donate/GiftLedger";
import { findRetailer } from "@/components/landing/donate/retailers";
import { needLabel } from "@/lib/helpNeeds";

interface RequestedHelpProps {
  fundraiserId: string;
  needs: string[];
  /** Store names as the recipient chose them. */
  stores: string[];
  similarOk: boolean;
  /** Giving is closed (example campaigns): stores are listed, not linked. */
  closed: boolean;
}

/**
 * What the recipient asked for: their needs and the stores whose coupons would help, each store one
 * tap from a gift there (the donate flow opens with it chosen).
 */
export function RequestedHelp({ fundraiserId, needs, stores, similarOk, closed }: RequestedHelpProps) {
  const retailers = stores.map(findRetailer).filter((r) => !!r.logo);
  if (!needs.length && !retailers.length) return null;
  return (
    <section aria-labelledby="requested-help" className="rounded-[1.5rem] p-6 sm:p-7" style={{ backgroundColor: "hsl(var(--primary-97))" }}>
      <h2 id="requested-help" className="font-display text-3xl font-normal text-foreground">What's needed</h2>
      {needs.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2.5">
          {needs.map((id) => (
            <li key={id} className="flex items-center gap-2 text-[15px] font-medium text-foreground">
              <NeedIcon id={id} className="h-5 w-5 text-primary" />
              {needLabel(id)}
            </li>
          ))}
        </ul>
      )}
      {retailers.length > 0 && (
        <>
          <h3 className="mt-7 font-sans text-sm font-medium text-foreground">
            {closed ? "Stores requested" : "Stores requested. Choose one to give there."}
          </h3>
          <ul className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
            {retailers.map((r) => {
              const body = (
                <>
                  <RetailerLogo retailer={r} className="h-10 w-10 p-1.5" />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-medium text-foreground">{r.name}</span>
                    {!closed && <span className="block text-xs text-primary">Give here</span>}
                  </span>
                </>
              );
              return (
                <li key={r.id}>
                  {closed ? (
                    <div className="flex items-center gap-3 rounded-2xl bg-background p-3">{body}</div>
                  ) : (
                    <Link
                      to={`/donate?fundraiser=${fundraiserId}&store=${encodeURIComponent(r.id)}`}
                      className="flex items-center gap-3 rounded-2xl bg-background p-3 outline-none transition-[box-shadow,transform] hover:shadow-[inset_0_0_0_2px_hsl(var(--primary))] focus-visible:ring-2 focus-visible:ring-ring active:scale-[.98]"
                    >
                      {body}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            {similarOk ? "Gifts to other stores are welcome too." : "Please give to one of these stores if you can."}
          </p>
          {!closed && (
            <p className="mt-2 text-sm text-muted-foreground">
              Have an unused gift card for one of these stores?{" "}
              <Link to={`/donate-a-card?fundraiser=${fundraiserId}`} className="font-medium text-primary underline-offset-2 hover:underline">Donate it here</Link>
            </p>
          )}
        </>
      )}
    </section>
  );
}
