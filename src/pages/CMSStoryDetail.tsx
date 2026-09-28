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

interface CMSStory { id:string; name:string; location:string|null; short_story:string; full_story:string|null; category:string; image_url:string|null; }
export default function CMSStoryDetail(){
 const {id}=useParams<{id:string}>(); const navigate=useNavigate(); const [story,setStory]=useState<CMSStory|null>(null); const [loading,setLoading]=useState(true); const [error,setError]=useState<string|null>(null); const [share,setShare]=useState(false);
 useEffect(()=>{let cancelled=false; const load=async()=>{const {data,error:dbError}=await supabase.from('cms_stories').select('id, name, location, short_story, full_story, category, image_url').eq('id',id).eq('is_published',true).single(); if(cancelled)return; if(dbError||!data)setError('Story not found'); else setStory(data); setLoading(false)}; if(id)load(); return()=>{cancelled=true}},[id]);
 if(loading)return <div className="min-h-dvh bg-background"><Navbar/><div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div></div>;
 if(error||!story)return <div className="min-h-dvh bg-background"><Navbar/><div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4"><AlertCircle className="h-9 w-9 text-destructive"/><h1 className="font-display text-4xl text-foreground">{error||'Story not found'}</h1><p className="text-muted-foreground">This story may have been removed or the link might be incorrect.</p><Button onClick={()=>navigate('/stories')}>Browse stories</Button></div><Footer/></div>;
 const shareUrl=`${window.location.origin}/story-detail/${story.id}`;
 return <><SEO title={`${story.name} — Story`} description={story.short_story.slice(0,155)} path={`/story-detail/${story.id}`} type="article" image={story.image_url||undefined} jsonLd={breadcrumbJsonLd([{name:'Home',path:'/'},{name:'Stories',path:'/stories'},{name:story.name,path:`/story-detail/${story.id}`}])}/><EditorialStoryLayout title={story.name} location={story.location} summary={story.short_story} body={story.full_story} image={story.image_url} onShare={()=>setShare(true)}/><ShareModal open={share} onClose={()=>setShare(false)} shareUrl={shareUrl} title={story.name}/></>;
}