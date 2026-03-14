CREATE POLICY "Admins can insert fundraiser images"
ON public.fundraiser_images FOR INSERT
TO public
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can update fundraiser images"
ON public.fundraiser_images FOR UPDATE
TO public
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can delete fundraiser images"
ON public.fundraiser_images FOR DELETE
TO public
USING (has_role(auth.uid(), 'admin'::user_role));