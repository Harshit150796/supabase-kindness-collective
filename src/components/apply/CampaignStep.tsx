import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Target, PenLine, DollarSign } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

const campaignSchema = z.object({
  campaignTitle: z.string().min(10, 'Title must be at least 10 characters').max(100),
  fundingGoal: z.number().min(500, 'Minimum goal is $500').max(25000, 'Maximum goal is $25,000'),
});

export type CampaignData = z.infer<typeof campaignSchema>;

interface CampaignStepProps {
  defaultValues?: Partial<CampaignData>;
  applicantName: string;
  onNext: (data: CampaignData) => void;
  onBack: () => void;
}

export function CampaignStep({ defaultValues, applicantName, onNext, onBack }: CampaignStepProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CampaignData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      campaignTitle: defaultValues?.campaignTitle || `Help ${applicantName.split(' ')[0]} with groceries`,
      fundingGoal: defaultValues?.fundingGoal || 1000,
    },
  });

  const fundingGoal = watch('fundingGoal');

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Set up your campaign
        </h2>
        <p className="text-muted-foreground">
          Create a compelling campaign that tells your story and sets your goal.
        </p>
      </div>

      {/* Campaign Title */}
      <div className="space-y-3">
        <Label htmlFor="campaignTitle" className="flex items-center gap-2 text-base">
          <PenLine className="w-4 h-4 text-muted-foreground" />
          Campaign Title *
        </Label>
        <Input
          id="campaignTitle"
          placeholder={`Help ${applicantName.split(' ')[0]} with groceries`}
          {...register('campaignTitle')}
          className={errors.campaignTitle ? 'border-destructive' : ''}
        />
        {errors.campaignTitle && (
          <p className="text-sm text-destructive">{errors.campaignTitle.message}</p>
        )}
        <p className="text-sm text-muted-foreground">
          A clear, compelling title helps donors understand your need
        </p>
      </div>

      {/* Funding Goal */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2 text-base">
          <Target className="w-4 h-4 text-muted-foreground" />
          Funding Goal *
        </Label>
        
        <div className="bg-muted/50 rounded-2xl p-6 text-center">
          <div className="flex items-center justify-center gap-1 mb-4">
            <DollarSign className="w-8 h-8 text-primary" />
            <span className="text-5xl font-bold text-foreground">
              {fundingGoal?.toLocaleString() || 1000}
            </span>
          </div>
          
          <Slider
            value={[fundingGoal || 1000]}
            onValueChange={(value) => setValue('fundingGoal', value[0])}
            min={500}
            max={25000}
            step={100}
            className="my-6"
          />
          
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>$500</span>
            <span>$25,000</span>
          </div>
        </div>

        {errors.fundingGoal && (
          <p className="text-sm text-destructive">{errors.fundingGoal.message}</p>
        )}

        <div className="grid grid-cols-3 gap-3 mt-4">
          {[1000, 2500, 5000].map((amount) => (
            <Button
              key={amount}
              type="button"
              variant={fundingGoal === amount ? 'default' : 'outline'}
              onClick={() => setValue('fundingGoal', amount)}
              className="w-full"
            >
              ${amount.toLocaleString()}
            </Button>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gold/10 border border-gold/20 rounded-xl p-4">
        <p className="text-sm text-foreground">
          <strong>💡 How it works:</strong> When donors contribute to your campaign, 
          their donations are converted into grocery coupons from our partner brands. 
          You'll receive these coupons directly once your campaign is approved.
        </p>
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
