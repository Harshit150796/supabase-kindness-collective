import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { SEO, breadcrumbJsonLd } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { EditorialStoryLayout } from '@/components/story/EditorialStoryLayout';
import { ShareModal } from '@/components/apply/ShareModal';
import { supabase } from '@/integrations/supabase/client';
import hurricaneReliefImg from '@/assets/featured/hurricane-relief.webp';

const imageMap: Record<string, string> = { 'hurricane-relief': hurricaneReliefImg };
interface FeaturedStory { id:string; story_key:string; name:string; location:string; headline:string; short_story:string; full_story:string|null; category:string; }

export default function FeaturedStoryDetail() {
  const { storyKey } = useParams<{ storyKey:string }>();
  const navigate = useNavigate();
  const [story,setStory] = useState<FeaturedStory|null>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState<string|null>(null);
  const [share,setShare] = useState(false);
  useEffect(() => { let cancelled=false; const load=async()=>{ const {data,error:dbError}=await supabase.from('featured_stories').select('id, story_key, name, location, headline, short_story, full_story, category').eq('story_key',storyKey).eq('is_active',true).single(); if(cancelled)return; if(dbError||!data)setError('Story not found'); else setStory(data); setLoading(false); }; if(storyKey) load(); return()=>{cancelled=true}; },[storyKey]);
  if(loading) return <Loading />;
  if(error||!story) return <NotFound message={error||'Story not found'} onBack={()=>navigate('/stories')} />;
  const image=imageMap[story.story_key]||null;
  const shareUrl=`${window.location.origin}/featured/${story.story_key}`;
  return <><SEO title={`${story.name} — Featured Story`} description={story.short_story.slice(0,155)} path={`/featured/${story.story_key}`} type="article" image={image||undefined} jsonLd={breadcrumbJsonLd([{name:'Home',path:'/'},{name:'Stories',path:'/stories'},{name:story.name,path:`/featured/${story.story_key}`}])}/><EditorialStoryLayout title={story.headline||story.name} location={story.location} summary={story.short_story} body={story.full_story} image={image} imageAlt={story.name} onShare={()=>setShare(true)}/><ShareModal open={share} onClose={()=>setShare(false)} shareUrl={shareUrl} title={story.name}/></>;
}
function Loading(){return <div className="min-h-dvh bg-background"><Navbar/><div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div></div>}
function NotFound({message,onBack}:{message:string;onBack:()=>void}){return <div className="min-h-dvh bg-background"><Navbar/><div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4"><AlertCircle className="h-9 w-9 text-destructive"/><h1 className="font-display text-4xl text-foreground">{message}</h1><p className="text-muted-foreground">This story may have been removed or the link might be incorrect.</p><Button onClick={onBack}>Browse stories</Button></div><Footer/></div>}