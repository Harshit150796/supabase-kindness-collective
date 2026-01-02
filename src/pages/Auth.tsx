import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Gift, Users } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { OTPVerification } from '@/components/auth/OTPVerification';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import logo from '@/assets/logo.png';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

type AppRole = 'donor' | 'recipient';
type AuthStep = 'form' | 'otp';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signIn, signUp, hasRole, loading: authLoading, rolesLoaded } = useAuth();
  
  const [mode, setMode] = useState<'signin' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  );
  const [role, setRole] = useState<AppRole>(
    (searchParams.get('role') as AppRole) || 'donor'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const [authStep, setAuthStep] = useState<AuthStep>('form');
  const [pendingSignupData, setPendingSignupData] = useState<{
    email: string;
    password: string;
    fullName: string;
    role: AppRole;
  } | null>(null);

  useEffect(() => {
    if (user && !authLoading && rolesLoaded) {
      // Redirect based on role
      if (hasRole('admin')) navigate('/admin');
      else if (hasRole('donor')) navigate('/donor');
      else if (hasRole('recipient')) navigate('/recipient');
      else navigate('/');
    }
  }, [user, authLoading, rolesLoaded, hasRole, navigate]);

  const validateForm = () => {
    try {
      if (mode === 'signup') {
        authSchema.parse({ email, password, fullName });
      } else {
        authSchema.pick({ email: true, password: true }).parse({ email, password });
      }
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: typeof errors = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0] as keyof typeof errors] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const sendOTP = async (emailAddress: string) => {
    const { data, error } = await supabase.functions.invoke('send-otp', {
      body: { email: emailAddress },
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);

    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (mode === 'signup') {
        // Send OTP for email verification before signup
        await sendOTP(email);
        setPendingSignupData({ email, password, fullName, role });
        setAuthStep('otp');
        toast.success('OTP sent to your email!', {
          description: `Check ${email} for your 6-digit verification code`,
          duration: 5000,
        });
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error('Invalid email or password');
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerified = async () => {
    if (!pendingSignupData) return;

    const { email: signupEmail, password: signupPassword, fullName: signupFullName, role: targetRole } = pendingSignupData;
    setLoading(true);
    
    try {
      // Step 1: Create the account
      const { error: signupError } = await signUp(
        signupEmail,
        signupPassword,
        signupFullName,
        targetRole
      );

      if (signupError) {
        if (signupError.message.includes('already registered')) {
          toast.error('This email is already registered. Please sign in instead.');
          setAuthStep('form');
          setMode('signin');
          return;
        }
        throw signupError;
      }

      // Step 2: Sign in immediately after signup to establish session
      const { error: signinError } = await signIn(signupEmail, signupPassword);
      
      if (signinError) {
        console.error('Auto sign-in after signup failed:', signinError);
        // Account was created, but auto-login failed - user can sign in manually
        toast.success('Account created! Please sign in with your credentials.');
        setAuthStep('form');
        setMode('signin');
        return;
      }

      toast.success('Account created successfully!', {
        description: 'Welcome to CouponDonation!',
        duration: 3000,
      });
      
      // Navigation will happen via useEffect when rolesLoaded becomes true
    } catch (error: any) {
      console.error('Signup flow error:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
      setPendingSignupData(null);
    }
  };

  const handleBackFromOTP = () => {
    setAuthStep('form');
    setPendingSignupData(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-gold/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="CouponDonation" className="w-12 h-12 object-contain" />
            <span className="font-bold text-2xl text-foreground">CouponDonation</span>
          </div>
        </div>

        <Card className="border-border">
          {authStep === 'otp' && pendingSignupData ? (
            <CardContent className="pt-6">
              <OTPVerification
                email={pendingSignupData.email}
                onVerified={handleOTPVerified}
                onBack={handleBackFromOTP}
              />
            </CardContent>
          ) : (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
                </CardTitle>
                <CardDescription>
                  {mode === 'signin' 
                    ? 'Sign in to access your dashboard'
                    : 'Join our community of givers and receivers'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={mode} onValueChange={(v) => setMode(v as 'signin' | 'signup')}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  <form onSubmit={handleSubmit}>
                    <TabsContent value="signup" className="space-y-4">
                      {/* Role Selection */}
                      <div className="space-y-3">
                        <Label>I want to</Label>
                        <RadioGroup value={role} onValueChange={(v) => setRole(v as AppRole)} className="grid grid-cols-2 gap-3">
                          <Label
                            htmlFor="donor"
                            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                              role === 'donor' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <RadioGroupItem value="donor" id="donor" className="sr-only" />
                            <Users className={`w-5 h-5 ${role === 'donor' ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className={role === 'donor' ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                              Donate
                            </span>
                          </Label>
                          <Label
                            htmlFor="recipient"
                            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                              role === 'recipient' ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/50'
                            }`}
                          >
                            <RadioGroupItem value="recipient" id="recipient" className="sr-only" />
                            <Gift className={`w-5 h-5 ${role === 'recipient' ? 'text-gold' : 'text-muted-foreground'}`} />
                            <span className={role === 'recipient' ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                              Receive
                            </span>
                          </Label>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          placeholder="John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                        />
                        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                      </div>
                    </TabsContent>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <PasswordInput
                          id="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        {mode === 'signup' && <PasswordStrengthIndicator password={password} />}
                        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                      </div>

                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {mode === 'signin' ? 'Sign In' : 'Continue'}
                      </Button>
                    </div>
                  </form>
                </Tabs>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
