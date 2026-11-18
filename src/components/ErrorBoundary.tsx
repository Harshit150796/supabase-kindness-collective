import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isCrawler, isStaleBuildError, reloadForNewBuild } from '@/lib/staleBuild';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // An old page asking for code a newer publish removed: load the new version once.
    if (isStaleBuildError(error)) reloadForNewBuild();
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Crawlers never get an error screen: search results showed "Something went wrong" as the
      // homepage's description (Nov 17, 2026). They get what CouponDonation is and where to go.
      if (isCrawler()) {
        return (
          <main className="mx-auto max-w-2xl p-6">
            <h1 className="text-3xl font-bold text-foreground">CouponDonation: transforming giving</h1>
            <p className="mt-4 text-muted-foreground">The world&apos;s most trusted crowdfunding platform. CouponDonation is transforming giving: donated money becomes coupons, with trackable, transparent giving for every donor.</p>
            <nav className="mt-6 flex flex-wrap gap-4 text-primary">
              <a href="/donate">Donate</a><a href="/stories">Fundraisers</a><a href="/how-it-works">How it works</a><a href="/about">About</a><a href="/apply">Start a fundraiser</a>
            </nav>
          </main>
        );
      }

      return (
        <div className="min-h-dvh flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
              <p className="text-muted-foreground">
                We encountered an unexpected error. Please try again.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-muted/50 rounded-lg p-4 text-left overflow-auto max-h-40">
                <p className="text-sm font-mono text-destructive">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={this.handleRetry}>
                Try Again
              </Button>
              <Button onClick={this.handleReload}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
