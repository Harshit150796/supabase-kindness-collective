import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, LogIn, Mail } from "lucide-react";
import { PasswordInput } from "@/components/auth/PasswordInput";

interface SignInPromptProps {
  email: string;
  onSignIn: (password: string) => Promise<void>;
  onUseNewEmail: () => void;
  isLoading?: boolean;
}

export const SignInPrompt = ({ 
  email, 
  onSignIn, 
  onUseNewEmail,
  isLoading = false 
}: SignInPromptProps) => {
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      await onSignIn(password);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Account Found
          </h1>
          <p className="text-muted-foreground">
            An account with <span className="font-medium text-foreground">{email}</span> already exists.
          </p>
          <p className="text-muted-foreground text-sm">
            Sign in to continue with your application.
          </p>
        </div>

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full gap-2" 
            size="lg"
            disabled={!password || isLoading}
          >
            {isLoading ? (
              "Signing in..."
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign in and continue
              </>
            )}
          </Button>
        </form>

        {/* Alternative Actions */}
        <div className="space-y-3 pt-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full gap-2"
            onClick={onUseNewEmail}
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4" />
            Use a different email
          </Button>
        </div>
      </div>
    </div>
  );
};
