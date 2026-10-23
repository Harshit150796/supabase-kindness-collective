import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ImagePlus, MapPin, Sparkles } from "lucide-react";
import { getSuggestedTitles } from "@/lib/suggestedTitles";
import { MediaItem, formatDuration } from "@/lib/mediaUpload";
import { needLabel } from "@/lib/helpNeeds";
import { RetailerLogo } from "@/components/landing/donate/GiftLedger";
import { findRetailer } from "@/components/landing/donate/retailers";
import { NeedIcon } from "../NeedsAndStores";
import { BENEFICIARY_OPTIONS } from "../applyOptions";

interface ReviewStepProps {
  media: MediaItem[];
  title: string;
  setTitle: (title: string) => void;
  story: string;
  needs: string[];
  stores: string[];
  similarOk: boolean;
  beneficiaryType: string;
  goalAmount: string;
  zipCode: string;
  /** "Syracuse, NY" once the ZIP code is found. */
  place: string | null;
  onEditStory: () => void;
  onEditDetails: () => void;
  onEditLocation: () => void;
  confirmed: boolean;
  setConfirmed: (value: boolean) => void;
}

const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function SectionHead({ title, onEdit, editLabel }: { title: string; onEdit: () => void; editLabel: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="font-display text-[1.5rem] font-normal leading-tight text-foreground sm:text-[1.75rem]">{title}</h2>
      <button
        type="button"
        onClick={onEdit}
        aria-label={editLabel}
        className="inline-flex min-h-11 shrink-0 items-center rounded-md px-1 text-sm font-medium text-primary outline-none hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-ring"
      >
        Edit
      </button>
    </div>
  );
}

/** Step 4: the request laid out the way donors will see it, with a title and an edit link per part. */
export const ReviewStep = ({
  media,
  title,
  setTitle,
  story,
  needs,
  stores,
  similarOk,
  beneficiaryType,
  goalAmount,
  zipCode,
  place,
  onEditStory,
  onEditDetails,
  onEditLocation,
  confirmed,
  setConfirmed,
}: ReviewStepProps) => {
  const cover = media[0];
  const extras = media.slice(1);
  const suggestions = getSuggestedTitles(needs[0] ?? "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const who = BENEFICIARY_OPTIONS.find((o) => o.id === beneficiaryType)?.title;
  const goal = Number(goalAmount || 0);

  // Start from the first suggestion the first time the review opens.
  useEffect(() => {
    if (!title.trim() && suggestions[0]) setTitle(suggestions[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-10">
      {cover?.previewUrl ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onEditStory}
            className="group relative block aspect-[16/10] w-full overflow-hidden rounded-[1.5rem] bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Change your photos"
          >
            <img src={cover.previewUrl} alt="Your cover photo" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]" />
            <span className="absolute bottom-3 right-3 rounded-lg bg-background/90 px-3 py-1.5 text-sm font-medium text-foreground opacity-0 backdrop-blur transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
              Change photos
            </span>
          </button>
          {extras.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {extras.map((item, index) => (
                <button key={item.id} type="button" onClick={onEditStory} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted" aria-label={`Photo ${index + 2}`}>
                  {item.previewUrl
                    ? <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                    : <span className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">Video</span>}
                  {item.kind === "video" && item.durationSec ? (
                    <span className="absolute bottom-1 right-1 rounded bg-background/85 px-1 text-[10px] font-medium text-foreground">{formatDuration(item.durationSec)}</span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={onEditStory}
          className="flex aspect-[16/10] max-h-56 w-full flex-col items-center justify-center gap-2 rounded-[1.5rem] bg-muted/60 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ImagePlus className="h-7 w-7 text-primary" strokeWidth={1.5} aria-hidden="true" />
          <span className="text-[15px] font-medium text-foreground">Add a cover photo</span>
          <span className="text-sm text-muted-foreground">Required, so donors can see who they're helping</span>
        </button>
      )}

      <section aria-label="Title" className="space-y-2">
        <label htmlFor="apply-title" className="text-sm font-medium text-muted-foreground">Title</label>
        <input
          id="apply-title"
          data-large-type
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          placeholder="Give your request a title"
          className="block w-full rounded-xl bg-muted/60 px-4 py-3 font-display text-[1.75rem] leading-tight text-foreground outline-none transition-shadow placeholder:text-muted-foreground/50 focus:shadow-[inset_0_0_0_2px_hsl(var(--primary))] sm:text-[2rem]"
        />
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowSuggestions((v) => !v)}
            aria-expanded={showSuggestions}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-medium text-primary outline-none hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {showSuggestions ? "Hide title ideas" : "Title ideas"}
          </button>
          <span className="text-sm tabular-nums text-muted-foreground">{title.length}/80</span>
        </div>
        {showSuggestions && (
          <div className="grid gap-2 sm:grid-cols-3">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTitle(s)}
                aria-pressed={title === s}
                className={`rounded-xl px-3.5 py-3 text-left text-sm leading-snug outline-none transition-[background-color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring ${
                  title === s ? "bg-[hsl(var(--primary-97))] text-foreground shadow-[inset_0_0_0_2px_hsl(var(--primary))]" : "bg-muted/70 text-foreground hover:bg-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHead title="Goal and place" onEdit={onEditLocation} editLabel="Edit goal and place" />
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-muted-foreground">Goal</dt>
            <dd className="mt-1 font-display text-[2rem] leading-none tabular-nums text-foreground">${whole.format(goal)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Shown as</dt>
            <dd className="mt-1.5 flex items-center gap-1.5 text-[15px] font-medium text-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              {place ?? (zipCode ? `ZIP ${zipCode}` : "Not set")}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">For</dt>
            <dd className="mt-1.5 text-[15px] font-medium text-foreground">{who ?? "Not chosen"}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-4">
        <SectionHead title="What's needed" onEdit={onEditDetails} editLabel="Edit needs and stores" />
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {needs.map((id) => (
            <li key={id} className="flex items-center gap-2 text-[15px] text-foreground">
              <NeedIcon id={id} className="h-4 w-4 text-primary" />
              {needLabel(id)}
            </li>
          ))}
        </ul>
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4" aria-label="Stores you chose">
          {stores.map((id) => {
            const r = findRetailer(id);
            return (
              <li key={id} className="flex items-center gap-2.5 rounded-xl bg-muted/60 p-2.5">
                <RetailerLogo retailer={r} className="h-9 w-9 p-1" />
                <span className="min-w-0 truncate text-sm font-medium text-foreground">{r.name}</span>
              </li>
            );
          })}
        </ul>
        <p className="text-sm text-muted-foreground">
          {similarOk ? "Your page says gifts to other stores are welcome too." : "Your page asks donors to give to these stores."}
        </p>
      </section>

      <section className="space-y-3">
        <SectionHead title="Your story" onEdit={onEditStory} editLabel="Edit your story" />
        {story
          ? <p className="line-clamp-5 whitespace-pre-line text-[16px] leading-[1.7] text-foreground/85">{story}</p>
          : <p className="text-muted-foreground">No story written yet.</p>}
      </section>

      <div className="space-y-3">
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-muted/60 p-4 sm:p-5" data-apply-confirm>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[hsl(var(--primary))]"
          />
          <span className="text-[15px] leading-relaxed text-foreground">
            I confirm this request is true, that I'm 18 or older, and that I have permission to share every photo and detail in it.
          </span>
        </label>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Submitting publishes your page right away, including any health details you shared, under our{" "}
          <Link to="/terms" target="_blank" className="font-medium text-primary underline underline-offset-2">Terms of Use</Link>,{" "}
          <Link to="/fundraiser-rules" target="_blank" className="font-medium text-primary underline underline-offset-2">Fundraiser Rules</Link> and{" "}
          <Link to="/health-data-privacy" target="_blank" className="font-medium text-primary underline underline-offset-2">Consumer Health Data Privacy Policy</Link>.
          You can change any part of it later from your fundraiser page.
        </p>
      </div>
    </div>
  );
};
