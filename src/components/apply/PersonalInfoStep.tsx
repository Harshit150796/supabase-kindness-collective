import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, MapPin, Mail, Phone, Users, ArrowRight } from 'lucide-react';

const personalInfoSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  country: z.string().min(2, 'Country is required'),
  householdSize: z.string().min(1, 'Please select household size'),
});

export type PersonalInfoData = z.infer<typeof personalInfoSchema>;

interface PersonalInfoStepProps {
  defaultValues?: Partial<PersonalInfoData>;
  onNext: (data: PersonalInfoData) => void;
}

export function PersonalInfoStep({ defaultValues, onNext }: PersonalInfoStepProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PersonalInfoData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: defaultValues?.fullName || '',
      email: defaultValues?.email || '',
      phone: defaultValues?.phone || '',
      city: defaultValues?.city || '',
      country: defaultValues?.country || '',
      householdSize: defaultValues?.householdSize || '',
    },
  });

  const householdSize = watch('householdSize');

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Tell us about yourself
        </h2>
        <p className="text-muted-foreground">
          We'll use this information to help connect you with the right assistance.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            Full Name *
          </Label>
          <Input
            id="fullName"
            placeholder="Maria Rodriguez"
            {...register('fullName')}
            className={errors.fullName ? 'border-destructive' : ''}
          />
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="maria@example.com"
            {...register('email')}
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            Phone Number (Optional)
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            {...register('phone')}
          />
        </div>

        {/* Household Size */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            Household Size *
          </Label>
          <Select
            value={householdSize}
            onValueChange={(value) => setValue('householdSize', value)}
          >
            <SelectTrigger className={errors.householdSize ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select household size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Just me (1 person)</SelectItem>
              <SelectItem value="2">2 people</SelectItem>
              <SelectItem value="3">3 people</SelectItem>
              <SelectItem value="4">4 people</SelectItem>
              <SelectItem value="5">5 people</SelectItem>
              <SelectItem value="6+">6 or more people</SelectItem>
            </SelectContent>
          </Select>
          {errors.householdSize && (
            <p className="text-sm text-destructive">{errors.householdSize.message}</p>
          )}
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city" className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            City *
          </Label>
          <Input
            id="city"
            placeholder="Los Angeles"
            {...register('city')}
            className={errors.city ? 'border-destructive' : ''}
          />
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city.message}</p>
          )}
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country" className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            Country *
          </Label>
          <Input
            id="country"
            placeholder="United States"
            {...register('country')}
            className={errors.country ? 'border-destructive' : ''}
          />
          {errors.country && (
            <p className="text-sm text-destructive">{errors.country.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" size="lg" className="gap-2">
          Continue
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </form>
  );
}
