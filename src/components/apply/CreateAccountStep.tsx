import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';

const accountSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type AccountData = z.infer<typeof accountSchema>;

interface CreateAccountStepProps {
  email: string;
  isSubmitting: boolean;
  onSubmit: (data: AccountData) => void;
  onBack: () => void;
}

export function CreateAccountStep({ email, isSubmitting, onSubmit, onBack }: CreateAccountStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AccountData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    },
  });

  const password = watch('password');
  const agreeTerms = watch('agreeTerms');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Create your account
        </h2>
        <p className="text-muted-foreground">
          Almost there! Set a password to secure your application.
        </p>
      </div>

      {/* Email Display */}
      <div className="bg-muted/50 rounded-xl p-4 flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
        <div>
          <p className="text-sm text-muted-foreground">Your email</p>
          <p className="font-medium text-foreground">{email}</p>
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password" className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-muted-foreground" />
          Create Password *
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            {...register('password')}
            className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {password && <PasswordStrengthIndicator password={password} />}
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-muted-foreground" />
          Confirm Password *
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            {...register('confirmPassword')}
            className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Terms Agreement */}
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <Checkbox
            id="agreeTerms"
            checked={agreeTerms}
            onCheckedChange={(checked) => setValue('agreeTerms', checked === true)}
            className="mt-1"
          />
          <label htmlFor="agreeTerms" className="text-sm text-muted-foreground cursor-pointer">
            I agree to the{' '}
            <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
            I understand my application will be reviewed before approval.
          </label>
        </div>
        {errors.agreeTerms && (
          <p className="text-sm text-destructive">{errors.agreeTerms.message}</p>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button 
          type="button" 
          variant="outline" 
          size="lg" 
          onClick={onBack} 
          className="gap-2"
          disabled={isSubmitting}
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Button>
        <Button 
          type="submit" 
          size="lg" 
          className="gap-2 min-w-[180px]"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Application'
          )}
        </Button>
      </div>
    </form>
  );
}
