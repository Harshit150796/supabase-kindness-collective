import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Fill the existing reservation with a deliberate state, never collapse it. */
export function ReservedSectionState({ title, description, onRetry, retrying = false, onReset }: {
  title: string;
  description: string;
  onRetry?: () => void;
  retrying?: boolean;
  onReset?: () => void;
}) {
  return <div className="flex min-h-80 flex-1 flex-col items-center justify-center gap-5 px-4 py-12 text-center" role="status">
    <h3 className="max-w-xl font-display text-3xl md:text-4xl">{title}</h3>
    <p className="max-w-lg text-base leading-relaxed text-muted-foreground">{description}</p>
    <div className="flex flex-wrap items-center justify-center gap-3">
      {onRetry && <Button variant="outline" disabled={retrying} onClick={onRetry}>{retrying ? 'Trying again…' : 'Try again'}</Button>}
      {onReset && <Button variant="outline" onClick={onReset}>Show all needs</Button>}
      <Button asChild variant="ghost"><Link to="/stories">Browse all stories <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
    </div>
  </div>;
}