import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useInteraction } from './InteractionContext';
import { Heart, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const STORY_TEMPLATES = [
  'helped a family of four put fresh groceries on the table this week.',
  'covered a single parent\'s weekly produce run — fresh fruit for the kids.',
  "kept a senior's pantry stocked with essentials and a little something extra.",
  'gave a college student studying late-nights real meals instead of ramen.',
  'reached a recipient in a rural area where every dollar stretches further.',
];

function pickStory(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return STORY_TEMPLATES[h % STORY_TEMPLATES.length];
}

export function RecipientStoryPanel() {
  const { selectedDonation, closeStory } = useInteraction();
  const open = !!selectedDonation;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && closeStory()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {selectedDonation && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center text-lg font-bold">
                  {selectedDonation.donorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <SheetTitle className="text-left">{selectedDonation.donorName}</SheetTitle>
                  <SheetDescription className="text-left">
                    donated <span className="font-bold text-amber-600">${selectedDonation.amount}</span>
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-5">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-2">
                  <Sparkles className="w-4 h-4" />
                  Real Impact
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  This <span className="font-semibold">${selectedDonation.amount}</span> donation{' '}
                  {pickStory(selectedDonation.id)}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Coupons created</span>
                  <span className="font-semibold">
                    {Math.max(1, Math.floor(selectedDonation.amount / 5))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Recipients helped</span>
                  <span className="font-semibold">{Math.max(1, Math.floor(selectedDonation.amount / 10))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Goes to recipients</span>
                  <span className="font-semibold text-emerald-600">95%</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button asChild className="w-full">
                  <Link to="/stories" onClick={closeStory}>
                    Read more recipient stories <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/donate" onClick={closeStory}>
                    <Heart className="mr-2 w-4 h-4" />
                    Donate like {selectedDonation.donorName.split(' ')[0]}
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
