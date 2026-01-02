import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import logo from '@/assets/logo.png';

const passwordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain a special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, roles, rolesLoaded } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    // Check if token exists in URL
    if (!token) {
      setTokenValid(false);
    } else {
      setTokenValid(true);
    }
  }, [token]);

  // Redirect to dashboard after successful login
  useEffect(() => {
    if (success && user && rolesLoaded && roles.length > 0) {
      if (roles.includes('admin')) {
        navigate('/admin');
      } else if (roles.includes('donor')) {
        navigate('/donor');
      } else if (roles.includes('recipient')) {
        navigate('/recipient');
      } else {
        navigate('/');
      }
    }
  }, [success, user, roles, rolesLoaded, navigate]);

  const validateForm = () => {
    try {
      passwordSchema.parse({ password, confirmPassword });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !token) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-password-reset', {
        body: { token, password },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast.success('Password updated successfully!');
      
      // Auto sign-in with the new password
      if (data.email) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: password,
        });
        
        if (signInError) {
          console.error('Auto sign-in failed:', signInError);
          toast.info('Please sign in with your new password');
          navigate('/auth');
          return;
        }
      }
      
      setSuccess(true);
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === null) {
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
          {success ? (
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h2 className="text-xl font-semibold text-foreground">Password Updated!</h2>
                <p className="text-muted-foreground">
                  Your password has been reset successfully. Signing you in...
                </p>
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
              </div>
            </CardContent>
          ) : !tokenValid ? (
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
                <h2 className="text-xl font-semibold text-foreground">Invalid or Expired Link</h2>
                <p className="text-muted-foreground">
                  This password reset link is invalid or has expired. Please request a new one.
                </p>
                <Button onClick={() => navigate('/auth')} className="mt-4">
                  Back to Sign In
                </Button>
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Set New Password</CardTitle>
                <CardDescription>
                  Enter your new password below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <PasswordInput
                      id="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <PasswordStrengthIndicator password={password} />
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <PasswordInput
                      id="confirmPassword"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
