import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Gift, Heart } from 'lucide-react';

import { toast } from 'sonner';
import { UpdatesOptIn, recordUpdatesConsent } from '@/components/UpdatesOptIn';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { OTPVerification } from '@/components/auth/OTPVerification';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { Navbar } from '@/components/layout/Navbar';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

type AuthStep = 'form' | 'otp';
type AuthView = 'auth' | 'forgot-password';

/** Says what went wrong and what to do, instead of one message for every failure. */
function signInErrorMessage(error: Error & { status?: number; code?: string }) {
  const code = (error.code || '').toLowerCase();
  const message = (error.message || '').toLowerCase();
  if (code === 'email_not_confirmed' || message.includes('not confirmed')) return 'Confirm your email first. The link is in your inbox.';
  if (error.status === 429 || code.includes('rate_limit') || message.includes('rate limit')) return 'Too many attempts. Wait a minute, then try again.';
  if (!error.status || message.includes('fetch') || message.includes('network')) return 'We could not reach the server. Check your connection and try again.';
  return 'That email and password do not match.';
}

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signIn, signUp, hasRole, loading: authLoading, rolesLoaded } = useAuth();

  const modeParam = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<'signin' | 'signup'>(modeParam);
  // Signup intent only decides where we land first — it never limits the account.
  const intent = searchParams.get('intent') || searchParams.get('role');
  // Only same-site paths: "next" comes from the address bar and must never send people elsewhere.
  const rawNext = searchParams.get('next');
  const nextPath = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.startsWith('/\\') && !rawNext.startsWith('/auth') ? rawNext : null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google sends errors back in the address (e.g. the person pressed Cancel).
  useEffect(() => {
    const p = new URLSearchParams(window.location.hash.slice(1) || window.location.search);
    if (p.get('error')) toast.error('Google sign-in was cancelled or failed. Please try again.');
  }, []);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const [authStep, setAuthStep] = useState<AuthStep>('form');
  const [authView, setAuthView] = useState<AuthView>('auth');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [pendingSignupData, setPendingSignupData] = useState<{
    email: string;
    password: string;
    fullName: string;
  } | null>(null);

  // "Sign in" / "Create account" pressed while already on this page (the menu links
  // here with ?mode=…): switch to that form instead of staying on the other one.
  useEffect(() => {
    setMode(modeParam);
    setAuthStep('form');
    setAuthView('auth');
  }, [modeParam]);

  useEffect(() => {
    if (user && !authLoading && rolesLoaded) {
      // Back to the page that asked for sign-in first; otherwise the right home.
      if (nextPath) navigate(nextPath, { replace: true });
      else if (hasRole('admin')) navigate('/admin', { replace: true });
      else if (intent === 'recipient') navigate('/apply', { replace: true });
      else if (intent === 'donor') navigate('/dashboard/donate', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, rolesLoaded, hasRole, navigate, intent, nextPath]);


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
      body: { email: emailAddress, purpose: 'signup' },
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);

    return data;
  };

  const emailAlreadyRegistered = async (emailAddress: string) => {
    const { data, error } = await supabase.functions.invoke('check-email-exists', {
      body: { email: emailAddress },
    });
    // If the check itself fails, don't block the user — the server-side guard
    // on send-otp and the post-signup check still catch duplicates.
    if (error) {
      console.error('Email existence check failed:', error);
      return false;
    }
    return Boolean(data?.exists);
  };

  const promptSignInInstead = () => {
    toast.error('This email is already registered', {
      description: 'Please sign in with your existing account.',
    });
    setAuthStep('form');
    setMode('signin');
    setPassword('');
    setPendingSignupData(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (mode === 'signup') {
        // Pre-check: never spend an OTP email on an address that already has
        // an account — send the person straight to sign in.
        if (await emailAlreadyRegistered(email)) {
          promptSignInInstead();
          return;
        }

        // Send OTP for email verification before signup
        await sendOTP(email);
        setPendingSignupData({ email, password, fullName });
        setAuthStep('otp');
        toast.success('OTP sent to your email!', {
          description: `Check ${email} for your 6-digit verification code`,
          duration: 5000,
        });
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(signInErrorMessage(error));
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      const msg = error?.message || '';
      if (
        msg.toLowerCase().includes('already registered') ||
        msg.toLowerCase().includes('already exists')
      ) {
        promptSignInInstead();
      } else {
        toast.error(msg || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };


  const handleOTPVerified = async () => {
    if (!pendingSignupData) return;

    const { email: signupEmail, password: signupPassword, fullName: signupFullName } = pendingSignupData;
    setLoading(true);

    try {
      // Step 1: Create the account (one generic account — give and receive)
      const { error: signupError } = await signUp(
        signupEmail,
        signupPassword,
        signupFullName
      );


      if (signupError) {
        const msg = (signupError.message || '').toLowerCase();
        if (
          msg.includes('already registered') ||
          msg.includes('already exists') ||
          msg.includes('user_already_exists') ||
          (signupError as any).code === 'user_already_exists'
        ) {
          promptSignInInstead();
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

      if (optIn) void recordUpdatesConsent(signupEmail, 'signup');
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrors({ email: 'Please enter your email' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setForgotPasswordSent(true);
      toast.success('Reset link sent!', {
        description: 'Check your email for the password reset link',
      });
    } catch (error: any) {
      console.error('Forgot password error:', error);
      toast.error(error.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    // Come back to this page; it already sends signed-in people to the right place.
    const back = new URL('/auth', window.location.origin);
    if (nextPath) back.searchParams.set('next', nextPath);
    if (intent) back.searchParams.set('intent', intent);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: back.toString(), queryParams: { prompt: 'select_account' } },
    });
    if (error) {
      setGoogleLoading(false);
      toast.error(/provider is not enabled/i.test(error.message)
        ? 'Google sign-in is not switched on yet. Please use email for now.'
        : 'Could not open Google sign-in. Please try again.');
    }
  };

  const handleBackToAuth = () => {
    setAuthView('auth');
    setForgotPasswordSent(false);
    setErrors({});
  };

  if (authLoading) {
    return (
      <div className="min-h-dvh bg-background">
        <Navbar />
        <div className="flex min-h-[calc(100dvh-var(--site-header-h))] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
    <Navbar />
    <div className="flex min-h-[calc(100dvh-var(--site-header-h))] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="rounded-md border-border shadow-sm">
          {authView === 'forgot-password' ? (
            <CardContent className="pt-6">
              {forgotPasswordSent ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Gift className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="font-display text-3xl font-normal text-foreground">Check your email.</h2>
                  <p className="text-muted-foreground">
                    If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
                  </p>
                  <Button variant="outline" onClick={handleBackToAuth} className="mt-4">
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="font-display text-3xl font-normal text-foreground">Reset your password.</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      Enter your email and we'll send you a reset link
                    </p>
                  </div>
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email">Email</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Send Reset Link
                    </Button>
                    <Button type="button" variant="ghost" onClick={handleBackToAuth} className="w-full">
                      Back to Sign In
                    </Button>
                  </form>
                </div>
              )}
            </CardContent>
          ) : authStep === 'otp' && pendingSignupData ? (
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
                <CardTitle className="font-display text-4xl font-normal">
                  {mode === 'signin' ? 'Welcome back' : 'Create an account'}
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
                    <TabsTrigger value="signin">Sign in</TabsTrigger>
                    <TabsTrigger value="signup">Sign up</TabsTrigger>
                  </TabsList>

                  <Button type="button" variant="outline" className="w-full min-h-11" disabled={googleLoading} onClick={handleGoogle}>
                    {googleLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/>
                      </svg>
                    )}
                    Continue with Google
                  </Button>
                  <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />or use email<span className="h-px flex-1 bg-border" />
                  </div>


                  <form onSubmit={handleSubmit}>
                    <TabsContent value="signup" className="space-y-4">
                      <div className="flex items-start gap-3 border-y border-border bg-muted/40 p-4">
                        <Heart className="w-5 h-5 mt-0.5 text-primary shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          One account does both — give support, or ask for it. You can switch
                          between the two any time from your dashboard.
                        </p>
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
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password">Password</Label>
                          {mode === 'signin' && (
                            <button
                              type="button"
                              onClick={() => setAuthView('forgot-password')}
                              className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline py-1"
                            >
                              Forgot Password?
                            </button>
                          )}
                        </div>
                        <PasswordInput
                          id="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        {mode === 'signup' && <PasswordStrengthIndicator password={password} />}
                        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                      </div>

                      {mode === 'signup' && <UpdatesOptIn id="signup-updates" checked={optIn} onChange={setOptIn} />}

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
    </div>
  );
}
