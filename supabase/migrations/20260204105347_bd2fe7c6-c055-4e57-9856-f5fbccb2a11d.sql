-- Allow users to delete their own fundraisers
CREATE POLICY "Users can delete own fundraisers"
ON fundraisers FOR DELETE
USING (auth.uid() = user_id);