-- Remove personally identifying document scans and placeholder junk used as public campaign covers
DELETE FROM public.fundraiser_images
WHERE image_url IN (
  'https://vbnbacowuoeeojjdrzzp.supabase.co/storage/v1/object/public/fundraiser-covers/5d8d1c38-0a5a-4b32-b5c9-14faccfab6e5/1770202761522.jpg'
);

UPDATE public.fundraisers
SET cover_photo_url = NULL
WHERE cover_photo_url IN (
  'https://vbnbacowuoeeojjdrzzp.supabase.co/storage/v1/object/public/fundraiser-covers/f063f344-accc-49d3-a975-0ff96c010692/1770207470107.jpg',
  'https://vbnbacowuoeeojjdrzzp.supabase.co/storage/v1/object/public/fundraiser-covers/eeeccec7-867d-4467-a256-ab378f4b5973/1770206712668.png',
  'https://vbnbacowuoeeojjdrzzp.supabase.co/storage/v1/object/public/fundraiser-covers/fb9814fe-0eaa-4e64-ae4f-9b5797006897/1770208632761.png'
);