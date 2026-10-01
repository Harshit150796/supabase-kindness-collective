import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { callFn, signInPath } from '@/lib/serverActions';

export default function TeamAccept() {
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<{ ok?: boolean; error?: string; fid?: string }>({});
  useEffect(() => {
    if (!user || !token) return;
    callFn<{ fundraiser_id: string }>('fundraiser-actions', { action: 'accept', token }).then((r) => setState(r.error ? { error: r.error } : { ok: true, fid: r.data?.fundraiser_id }));
  }, [user, token]);
  if (loading) return null;
  if (!user) return <Navigate to={signInPath(`/team/accept?token=${encodeURIComponent(token)}`)} replace />;
  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <main className="container mx-auto max-w-xl px-4 pt-32 text-center">
        <h1 className="font-display text-5xl font-normal">{state.ok ? 'You’re on the team' : state.error ? 'Invitation problem' : 'Joining…'}</h1>
        <p className="mt-4 text-muted-foreground">{state.ok ? 'You can now reply to messages, post updates and moderate comments.' : state.error ?? ''}</p>
        {state.ok && state.fid && <Button asChild className="mt-8"><Link to={`/fundraiser/${state.fid}`}>Open fundraiser tools</Link></Button>}
      </main>
    </div>
  );
}
