
-- Archive Maria's story
UPDATE cms_stories SET is_published = false WHERE id = 'c1f2864e-8fba-428a-9649-b1b438ed5dfa';

-- Insert Amina K.'s new featured story
INSERT INTO cms_stories (name, location, category, short_story, full_story, goal, amount_raised, donors_count, impact, image_url, is_published, display_order)
VALUES (
  'Amina K.',
  'Nairobi, Kenya',
  'family',
  'After my husband passed away, I was left to raise four children alone with no income. The grocery coupons from CouponDonation kept food on our table for five months while I completed a vocational training program.',
  E'When my husband Samuel passed away suddenly from a heart condition, our world collapsed overnight. I was left with four children — ages 3, 6, 9, and 12 — and absolutely no source of income. Samuel had been a day laborer, and we had no savings.\n\nThe first two weeks were the hardest. My eldest daughter would come home from school asking why there was nothing to eat. I sold what little furniture we had just to buy maize flour and beans. I applied everywhere for work, but with four young children and no skills beyond subsistence farming, nobody would hire me.\n\nA neighbor told me about CouponDonation. I was skeptical at first — I had never heard of receiving grocery coupons from strangers on the internet. But desperation pushed me to apply. Within a week, I received my first set of coupons for a local market.\n\nThose coupons changed everything. For the first time in weeks, I could feed my children three meals a day. The relief was indescribable. But more than food, the coupons gave me something I had lost — time. Instead of spending every waking hour searching for food, I could focus on building a future.\n\nI enrolled in a six-month vocational training program in tailoring and garment-making at a community center in Nairobi. The CouponDonation grocery support continued throughout my training, ensuring my children never went hungry while I was learning.\n\nFive months later, I completed the program. Today, I run a small tailoring business from a rented space near Kibera. I earn enough to cover rent, school fees, and food for my family. I have even started mentoring other widows in my community, helping them apply for CouponDonation support and connecting them with vocational training opportunities.\n\nTo every donor who contributed: you did not just feed my children. You gave a mother the chance to rebuild her life with dignity. My children now have hope for a future, and I have the skills to provide for them. Thank you from the bottom of my heart.',
  2500,
  1920,
  278,
  '5 months of groceries + vocational training completed',
  'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800&h=600&fit=crop',
  true,
  1
);
