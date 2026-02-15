import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Generic CMS content hook
export function useCMSContent(section?: string) {
  return useQuery({
    queryKey: ['cms-content', section],
    queryFn: async () => {
      let query = supabase.from('cms_content').select('*');
      if (section) query = query.eq('section', section);
      const { data, error } = await query.order('content_key');
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });
}

export function useCMSContentValue(key: string, fallback: string = '') {
  const { data } = useQuery({
    queryKey: ['cms-content-key', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cms_content')
        .select('content_value')
        .eq('content_key', key)
        .maybeSingle();
      if (error) throw error;
      return data?.content_value || null;
    },
    staleTime: 60000,
  });
  return data || fallback;
}

// CMS Stories
export function useCMSStories(publishedOnly = true) {
  return useQuery({
    queryKey: ['cms-stories', publishedOnly],
    queryFn: async () => {
      let query = supabase.from('cms_stories').select('*');
      if (publishedOnly) query = query.eq('is_published', true);
      const { data, error } = await query.order('display_order');
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });
}

// CMS Testimonials
export function useCMSTestimonials(publishedOnly = true) {
  return useQuery({
    queryKey: ['cms-testimonials', publishedOnly],
    queryFn: async () => {
      let query = supabase.from('cms_testimonials').select('*');
      if (publishedOnly) query = query.eq('is_published', true);
      const { data, error } = await query.order('display_order');
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });
}

// CMS Posts (Blog)
export function useCMSPosts(publishedOnly = true) {
  return useQuery({
    queryKey: ['cms-posts', publishedOnly],
    queryFn: async () => {
      let query = supabase.from('cms_posts').select('*');
      if (publishedOnly) query = query.eq('is_published', true);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });
}

export function useCMSPost(slug: string) {
  return useQuery({
    queryKey: ['cms-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cms_posts')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
}

// CMS FAQ
export function useCMSFAQ(publishedOnly = true) {
  return useQuery({
    queryKey: ['cms-faq', publishedOnly],
    queryFn: async () => {
      let query = supabase.from('cms_faq').select('*');
      if (publishedOnly) query = query.eq('is_published', true);
      const { data, error } = await query.order('display_order');
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });
}

// Upload image to CMS bucket
export async function uploadCMSImage(file: File, path: string) {
  const { data, error } = await supabase.storage
    .from('cms-images')
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('cms-images').getPublicUrl(data.path);
  return urlData.publicUrl;
}
