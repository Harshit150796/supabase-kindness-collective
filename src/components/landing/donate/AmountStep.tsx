import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MIN_SHARE } from '@/lib/donationSplit';
import { RetailerLogo } from './GiftLedger';
import { AnimatedAmount } from './motion';
import { MAX_AMOUNT, PRESET_AMOUNTS, SPRING, amountProblem, type SplitMode } from './tokens';
import { SHARE_TONES, usd, type Retailer } from './retailers';

interface AmountStepProps {
  retailers: Retailer[];
  amount: number;
  minimum: number;
  other: boolean;
  otherText: string;
  onPreset: (value: number) => void;
  onOther: () => void;
  onOtherText: (text: string) => void;
  raisedNote: string | null;
  shares: number[];
  mode: SplitMode;
  onMode: (mode: SplitMode) => void;
  onShare: (index: number, value: number) => void;
}

function Choice({ selected, disabled, onClick, children, id }: { selected: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode; id: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      data-amount-choice={id}
      className={cn(
        'relative h-12 rounded-xl text-[15px] font-medium tabular-nums outline-none transition-colors',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[.98]',
        selected ? 'text-primary-foreground' : 'bg-muted/70 text-foreground hover:bg-muted',
        disabled && 'cursor-not-allowed text-muted-foreground/60 hover:bg-muted/70',
      )}
    >
      {selected && <motion.span layoutId="donate-amount-choice" className="absolute inset-0 rounded-xl bg-primary" transition={SPRING} />}
      <span className="relative">{children}</span>
    </button>
  );
}

function ModeSwitch({ mode, onMode }: { mode: SplitMode; onMode: (mode: SplitMode) => void }) {
  return (
    <div role="radiogroup" aria-label="How to share it" className="inline-grid grid-cols-2 rounded-xl bg-muted/70 p-1 text-sm">
      {(['even', 'custom'] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          onClick={() => onMode(m)}
          className={cn('relative rounded-lg px-3.5 py-1.5 font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring', mode === m ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
        >
          {mode === m && <motion.span layoutId="donate-split-mode" className="absolute inset-0 rounded-lg bg-background shadow-[0_1px_2px_hsl(var(--foreground)/0.12)]" transition={SPRING} />}
          <span className="relative">{m === 'even' ? 'Evenly' : "I'll choose"}</span>
        </button>
      ))}
    </div>
  );
}

function ShareInput({ value, onCommit, label }: { value: number; onCommit: (value: number) => void; label: string }) {
  const [draft, setDraft] = useState(String(value));
  const editing = useRef(false);
  useEffect(() => { if (!editing.current) setDraft(String(value)); }, [value]);
  const commit = () => {
    editing.current = false;
    const n = parseInt(draft, 10);
    if (Number.isFinite(n)) onCommit(n);
    else setDraft(String(value));
  };
  return (
    <label className="flex h-10 w-[4.75rem] items-center rounded-lg bg-muted/70 px-2.5 focus-within:ring-2 focus-within:ring-ring">
      <span className="text-muted-foreground" aria-hidden="true">$</span>
      <input
        aria-label={label}
        inputMode="numeric"
        value={draft}
        onFocus={(e) => { editing.current = true; e.currentTarget.select(); }}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') { setDraft(String(value)); editing.current = false; e.currentTarget.blur(); }
        }}
        className="w-full min-w-0 bg-transparent pl-0.5 text-right text-[15px] font-medium tabular-nums text-foreground outline-none"
      />
    </label>
  );
}

function SplitEditor({ retailers, shares, amount, mode, onMode, onShare }: Pick<AmountStepProps, 'retailers' | 'shares' | 'amount' | 'mode' | 'onMode' | 'onShare'>) {
  const step = amount >= 100 ? 5 : 1;
  const most = amount - MIN_SHARE * (retailers.length - 1);
  return (
    <div className="mt-8" data-split-editor>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-[15px] font-medium text-foreground">How it's shared</h4>
        <ModeSwitch mode={mode} onMode={onMode} />
      </div>
      <ul className="mt-3 divide-y divide-border">
        {retailers.map((r, i) => (
          <li key={r.id} className="flex min-h-[3.5rem] items-center gap-3 py-2">
            <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-[3px] ring-1 ring-inset ring-foreground/10" style={{ background: SHARE_TONES[i % SHARE_TONES.length] }} />
            <RetailerLogo retailer={r} className="h-8 w-8 bg-muted/60 p-1 dark:bg-white" />
            <span className="min-w-0 flex-1 truncate text-[15px] text-foreground">{r.name}</span>
            <AnimatePresence mode="popLayout" initial={false}>
              {mode === 'custom' ? (
                <motion.div key="edit" className="flex items-center gap-1.5" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={SPRING}>
                  <button
                    type="button"
                    aria-label={`${usd.format(step)} less for ${r.name}`}
                    disabled={shares[i] <= MIN_SHARE}
                    onClick={() => onShare(i, shares[i] - step)}
                    className="grid h-10 w-10 place-items-center rounded-lg text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring active:scale-95 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <ShareInput value={shares[i]} label={`Dollars for ${r.name}`} onCommit={(v) => onShare(i, v)} />
                  <button
                    type="button"
                    aria-label={`${usd.format(step)} more for ${r.name}`}
                    disabled={shares[i] >= most}
                    onClick={() => onShare(i, shares[i] + step)}
                    className="grid h-10 w-10 place-items-center rounded-lg text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring active:scale-95 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </motion.div>
              ) : (
                <motion.span key="even" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={SPRING}>
                  <AnimatedAmount value={shares[i] ?? 0} className="font-display text-2xl tabular-nums text-foreground" />
                </motion.span>
              )}
            </AnimatePresence>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground" aria-live="polite">
        {mode === 'even'
          ? `Shared evenly, ${usd.format(MIN_SHARE)} or more each. Choose "I'll choose" to set your own amounts.`
          : `Changing one store adjusts the others, so it always adds up to ${usd.format(amount)}. Each keeps at least ${usd.format(MIN_SHARE)}.`}
      </p>
    </div>
  );
}

export function AmountStep(props: AmountStepProps) {
  const { retailers, amount, minimum, other, otherText, onPreset, onOther, onOtherText, raisedNote } = props;
  const otherRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (other) otherRef.current?.focus(); }, [other]);
  const problem = other ? amountProblem(amount, minimum, retailers.length) : null;
  const single = retailers.length === 1;
  return (
    <div>
      <h3 className="font-display text-[2rem] leading-[1.05] text-foreground sm:text-[2.5rem]">How much would you like to give?</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
        {single ? `All of it goes to families shopping at ${retailers[0].name}.` : `Shared between your ${retailers.length} retailers. You can set each one's dollars below.`}
      </p>

      <div role="radiogroup" aria-label="Donation amount" className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {PRESET_AMOUNTS.map((p) => (
          <Choice key={p} id={String(p)} selected={!other && amount === p} disabled={p < minimum} onClick={() => onPreset(p)}>
            {usd.format(p)}
          </Choice>
        ))}
        <Choice id="other" selected={other} onClick={onOther}>Other</Choice>
      </div>

      <AnimatePresence initial={false}>
        {other && (
          <motion.div key="other" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={SPRING} className="overflow-hidden">
            <label className="mt-4 flex items-baseline gap-2 border-b-2 border-border pb-1 focus-within:border-primary">
              <span className="font-display text-4xl text-muted-foreground" aria-hidden="true">$</span>
              <input
                ref={otherRef}
                inputMode="numeric"
                aria-label="Your amount in dollars"
                aria-invalid={problem ? true : undefined}
                aria-describedby="donate-amount-note"
                placeholder={String(Math.max(minimum, 75))}
                value={otherText}
                onChange={(e) => onOtherText(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                className="w-full min-w-0 bg-transparent font-display text-5xl tabular-nums text-foreground outline-none placeholder:text-muted-foreground/40"
              />
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      <p id="donate-amount-note" className={cn('mt-3 min-h-[1.25rem] text-sm', problem && otherText ? 'text-destructive' : 'text-muted-foreground')} aria-live="polite">
        {problem && otherText ? problem : raisedNote ?? (retailers.length > 1 ? `At least ${usd.format(MIN_SHARE)} for each retailer, so ${usd.format(minimum)} or more.` : `From ${usd.format(minimum)} up to ${usd.format(MAX_AMOUNT)}.`)}
      </p>

      {retailers.length > 1 && <SplitEditor {...props} />}
    </div>
  );
}
