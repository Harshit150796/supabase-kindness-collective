import { StoryUpdate } from '@/data/impactStories';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Calendar, Megaphone } from 'lucide-react';
import { format } from 'date-fns';

interface UpdatesTimelineProps {
  updates: StoryUpdate[];
}

export function UpdatesTimeline({ updates }: UpdatesTimelineProps) {
  if (!updates || updates.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No updates yet</p>
      </div>
    );
  }

  // Sort updates by date, most recent first
  const sortedUpdates = [...updates].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Accordion type="single" collapsible defaultValue="update-0" className="w-full">
      {sortedUpdates.map((update, index) => (
        <AccordionItem key={index} value={`update-${index}`} className="border-b border-border/50">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3 text-left">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{update.title}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(update.date), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 pl-11">
            <p className="text-muted-foreground text-sm leading-relaxed">
              {update.content}
            </p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
