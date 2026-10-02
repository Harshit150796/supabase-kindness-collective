CREATE UNIQUE INDEX fundraiser_images_one_primary_idx
ON public.fundraiser_images (fundraiser_id)
WHERE is_primary IS TRUE;