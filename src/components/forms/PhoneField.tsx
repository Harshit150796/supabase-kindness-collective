import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatUsPhone } from '@/lib/phone';

/**
 * Optional US phone number field (sign-up, launching a fundraiser, Settings). Formats as the person
 * types; the caller checks it with phoneOk and stores it with toStoredPhone.
 */
export function PhoneField({ id, value, onChange, error, hint, label = 'Phone number', className }: {
  id: string; value: string; onChange: (value: string) => void; error?: string | null; hint?: string; label?: string; className?: string;
}) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <div className={className ?? 'space-y-2'}>
      <Label htmlFor={id}>{label} <span className="font-normal text-muted-foreground">(optional)</span></Label>
      <Input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="(555) 123-4567"
        value={value}
        onChange={(e) => onChange(formatUsPhone(e.target.value))}
        aria-invalid={!!error}
        aria-describedby={[hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined}
      />
      {hint && <p id={hintId} className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={errorId} className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
