import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const link = 'font-medium text-primary underline underline-offset-2 hover:text-primary/80';

/**
 * The line shown directly beside every button that creates an account, signs in or donates. Courts
 * enforce online terms only when the notice is easy to see and says the click means agreement
 * (Berman v. Freedom Financial, 9th Cir. 2022), so: same size as nearby text, links underlined in the
 * brand colour, and the button's own words quoted.
 */
export function AgreementNotice({ action, google = false, adult = true, donate = false, className }: {
  /** The button's label, quoted in the notice ("Create account"). */
  action?: string;
  /** Google's button: "By continuing with Google". */
  google?: boolean;
  /** Adds "you confirm you're 18 or older" (accounts, not donations). */
  adult?: boolean;
  /** Donation wording, which also points to the refund policy. */
  donate?: boolean;
  className?: string;
}) {
  const lead = google ? 'By continuing with Google' : `By selecting ${action ?? 'Continue'}`;
  return (
    <p className={cn('text-sm leading-relaxed text-muted-foreground', className)} data-agreement-notice>
      {lead}, {adult && !donate ? <>you confirm you're 18 or older, </> : null}you agree to the{' '}
      <Link to="/terms" target="_blank" className={link}>Terms of Use</Link>
      {donate
        ? <>, including the <Link to="/refunds" target="_blank" className={link}>Refund Policy</Link>, and acknowledge the </>
        : <> and acknowledge the </>}
      <Link to="/privacy" target="_blank" className={link}>Privacy Policy</Link>.
    </p>
  );
}
