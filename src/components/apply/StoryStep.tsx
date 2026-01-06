import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Heart, FileText, HelpCircle } from 'lucide-react';

const storySchema = z.object({
  assistanceType: z.string().min(1, 'Please select assistance type'),
  story: z.string().min(100, 'Please share more about your situation (minimum 100 characters)').max(2000),
  referralSource: z.string().optional(),
});

export type StoryData = z.infer<typeof storySchema>;

interface StoryStepProps {
  defaultValues?: Partial<StoryData>;
  onNext: (data: StoryData) => void;
  onBack: () => void;
}

const assistanceTypes = [
  { value: 'groceries', label: 'Groceries & Food', icon: '🛒' },
  { value: 'medical', label: 'Medical Expenses', icon: '🏥' },
  { value: 'utilities', label: 'Utility Bills', icon: '💡' },
  { value: 'housing', label: 'Housing Support', icon: '🏠' },
  { value: 'education', label: 'Education Costs', icon: '📚' },
  { value: 'emergency', label: 'Emergency Relief', icon: '🆘' },
  { value: 'other', label: 'Other', icon: '📦' },
];

const referralSources = [
  { value: 'social_media', label: 'Social Media' },
  { value: 'friend_family', label: 'Friend or Family' },
  { value: 'community_org', label: 'Community Organization' },
  { value: 'search', label: 'Online Search' },
  { value: 'news', label: 'News Article' },
  { value: 'other', label: 'Other' },
];

export function StoryStep({ defaultValues, onNext, onBack }: StoryStepProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StoryData>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      assistanceType: defaultValues?.assistanceType || '',
      story: defaultValues?.story || '',
      referralSource: defaultValues?.referralSource || '',
    },
  });

  const assistanceType = watch('assistanceType');
  const referralSource = watch('referralSource');
  const story = watch('story');

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Share your story
        </h2>
        <p className="text-muted-foreground">
          Help us understand your situation so we can connect you with the right support.
        </p>
      </div>

      {/* Assistance Type */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-base">
          <Heart className="w-4 h-4 text-muted-foreground" />
          What type of assistance do you need? *
        </Label>
        <Select
          value={assistanceType}
          onValueChange={(value) => setValue('assistanceType', value)}
        >
          <SelectTrigger className={errors.assistanceType ? 'border-destructive' : ''}>
            <SelectValue placeholder="Select assistance type" />
          </SelectTrigger>
          <SelectContent>
            {assistanceTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <span className="flex items-center gap-2">
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.assistanceType && (
          <p className="text-sm text-destructive">{errors.assistanceType.message}</p>
        )}
      </div>

      {/* Story */}
      <div className="space-y-3">
        <Label htmlFor="story" className="flex items-center gap-2 text-base">
          <FileText className="w-4 h-4 text-muted-foreground" />
          Tell us about your situation *
        </Label>
        <Textarea
          id="story"
          placeholder="Share your story here. What challenges are you facing? How would this assistance help you and your family? The more details you provide, the better we can understand your needs..."
          {...register('story')}
          className={`min-h-[200px] ${errors.story ? 'border-destructive' : ''}`}
        />
        <div className="flex justify-between items-center">
          {errors.story ? (
            <p className="text-sm text-destructive">{errors.story.message}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Share your story in your own words
            </p>
          )}
          <span className={`text-sm ${(story?.length || 0) < 100 ? 'text-muted-foreground' : 'text-primary'}`}>
            {story?.length || 0}/2000
          </span>
        </div>
      </div>

      {/* Referral Source */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-base">
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
          How did you hear about us? (Optional)
        </Label>
        <Select
          value={referralSource}
          onValueChange={(value) => setValue('referralSource', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {referralSources.map((source) => (
              <SelectItem key={source.value} value={source.value}>
                {source.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" size="lg" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-5 h-5" />
          Back
        </Button>
        <Button type="submit" size="lg" className="gap-2">
          Continue
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </form>
  );
}
