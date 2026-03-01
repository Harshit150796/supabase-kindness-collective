-- Bump existing stories at display_order >= 3 to make room for Jean-Pierre at position 3
UPDATE cms_stories SET display_order = display_order + 1 WHERE display_order >= 3;

-- Insert Jean-Pierre's story as the 3rd featured CMS story
INSERT INTO cms_stories (
  name,
  location,
  category,
  short_story,
  full_story,
  goal,
  amount_raised,
  donors_count,
  impact,
  image_url,
  display_order,
  is_published
) VALUES (
  'Jean-Pierre L.',
  'Golbotine, Haiti',
  'family',
  'After the earthquake destroyed our home, my family and I had nothing. We cooked over an open fire in a makeshift shelter. CouponDonation''s grocery coupons gave us consistent access to food for four months while we rebuilt. For the first time, I could focus on rebuilding instead of worrying about the next meal.',
  'Jean-Pierre was a farmer in rural Haiti, tending crops that fed his family of five and provided a modest income at the local market. When the earthquake struck, everything changed in an instant. Their home collapsed, their crops were destroyed, and the family was left with nothing but the clothes on their backs.

For weeks, Jean-Pierre and his wife Marie cooked over an open fire in a makeshift shelter built from salvaged tin and tarps. Finding food became a daily struggle — prices at the remaining markets skyrocketed, and aid was slow to reach their remote village of Golbotine. Jean-Pierre walked hours each day searching for work or food, often returning empty-handed.

Everything changed when a local aid worker connected the family with CouponDonation. Within days, they received their first grocery coupons — enough to feed the entire family for a week. "I remember Marie crying when she saw the coupons," Jean-Pierre recalls. "It was the first time in weeks she didn''t have to choose which child would eat less."

For four months, the coupons provided consistent, reliable access to food. Rice, beans, cooking oil, vegetables — staples that kept the family nourished while Jean-Pierre focused his energy on rebuilding. He repaired their shelter, cleared debris from their farmland, and began replanting crops.

"Before the coupons, every morning I woke up thinking about food," Jean-Pierre says. "After, I woke up thinking about rebuilding. That is the difference — not just food, but hope."

Today, Jean-Pierre''s crops are growing again, and his rebuilt home, while modest, is sturdy. He now volunteers with the same aid organization that connected him with CouponDonation, helping identify and register other displaced families in his community who need support. "Someone helped me when I had nothing," he says. "Now it is my turn to help others."',
  2000,
  1680,
  245,
  '4 months of groceries for a family of 5 during disaster recovery',
  'https://vbnbacowuoeeojjdrzzp.supabase.co/storage/v1/object/public/cms-images/featured/haiti-rural-family.webp',
  3,
  true
);