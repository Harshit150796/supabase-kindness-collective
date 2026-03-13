CREATE POLICY "Admins can delete all fundraisers"
ON public.fundraisers FOR DELETE
TO public
USING (has_role(auth.uid(), 'admin'::user_role));