import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { LineReveal, Reveal } from '@/components/ui/editorial-motion';
import { SEO } from '@/components/SEO';

export default function NotFound(){
 const location=useLocation();
 useEffect(()=>{console.error('404 Error: User attempted to access non-existent route:',location.pathname)},[location.pathname]);
 return <div className="flex min-h-dvh flex-col bg-background">
  {/* Every unknown address is served by the app with HTTP 200, so tell search engines it isn't a page (Duck.Design audit, Nov 2026). */}
  <SEO title="Page not found" description="The address may have changed, or the page may no longer be available." path={location.pathname} noindex status={404}/>
  <Navbar/><main className="container mx-auto flex flex-1 items-center px-4 py-24"><div className="max-w-4xl"><Reveal><p className="mb-5 text-sm text-muted-foreground">Error 404</p></Reveal><LineReveal><h1 className="font-display text-6xl font-normal leading-none text-foreground md:text-8xl">This page isn’t here.</h1></LineReveal><Reveal delay={.08}><p className="mt-7 max-w-xl text-xl leading-relaxed text-muted-foreground">The address may have changed, or the page may no longer be available.</p><Button asChild className="mt-9"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4"/>Return home</Link></Button></Reveal></div></main><Footer/></div>
}