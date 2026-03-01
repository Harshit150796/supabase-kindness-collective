
-- Seed featured_stories with 4 realistic mock entries
INSERT INTO public.featured_stories (story_key, name, location, headline, short_story, full_story, impact, category, amount_raised, goal, donors_count, brand_partners, display_order)
VALUES
(
  'childrens-hope',
  'Children''s Hope Program',
  'Poland',
  'Children in conflict zones received hope through play and support',
  'Thanks to generous donors, children in conflict-affected areas are finding joy and normalcy through play, therapy, and community support activities.',
  'In the heart of Poland, near the Ukrainian border, the Children''s Hope Program has been providing a safe haven for displaced children since early 2024. What started as a small community effort in a local school gymnasium has grown into a comprehensive support network serving over 300 children weekly.

The program offers structured play therapy sessions, art workshops, and educational activities designed to help children process trauma and rebuild a sense of normalcy. Trained counselors work alongside volunteers to create an environment where kids can just be kids — laughing, playing, and learning without fear.

Local families have opened their homes as host families, and community donations have funded everything from art supplies to warm winter clothing. The grocery coupons provided through our platform ensure that both the children and their host families have access to nutritious meals.

One mother shared: "My daughter hadn''t smiled in months after we fled. The first day at the program, she came home singing. That sound was everything."

The program has expanded to three locations across southeastern Poland, and plans are underway to open a fourth center. With continued donor support, we aim to serve 500 children by end of 2026.',
  'Play therapy and nutrition for 300+ children',
  'child',
  12400,
  18000,
  187,
  ARRAY['Biedronka', 'Lidl', 'Carrefour'],
  0
),
(
  'rural-family',
  'Rural Family Support',
  'Haiti',
  'Families in rural Haiti received essential food support',
  'Families in rural Haiti are receiving essential food supplies and grocery coupons, helping them through some of the most difficult times they have ever faced.',
  'In the remote villages of Haiti''s Grand''Anse department, access to food has always been a challenge. But after multiple hurricanes and ongoing economic instability, many families found themselves on the brink of starvation.

Our Rural Family Support initiative partners with local community leaders to identify the families most in need. Rather than shipping food — which is expensive and often doesn''t match local diets — we work with regional markets and vendors to distribute coupons that families can redeem for rice, beans, cooking oil, fresh produce, and other staples they actually want and need.

Jean-Pierre, a father of five, told us: "Before the coupons, I would walk three hours to find work, only to earn enough for one meal. Now my children eat every day. I can focus on rebuilding our farm."

The program currently supports 134 families across 8 villages. Each family receives monthly coupons equivalent to $65 in groceries — enough to feed a family of four for the month. Local vendors benefit too, keeping the economic impact within the community.

We''ve also introduced agricultural training workshops, teaching families sustainable farming techniques so they can eventually grow their own food. 23 families have already started small vegetable gardens with seeds provided through the program.',
  'Monthly groceries for 134 families',
  'family',
  8750,
  15000,
  134,
  ARRAY['Caribbean Market Network', 'Local Vendors Coalition'],
  1
),
(
  'hurricane-relief',
  'Hurricane Helene Relief',
  'North Carolina, USA',
  'Families rebuilt after Hurricane Helene with grocery support',
  'After Hurricane Helene devastated communities in North Carolina, donors helped families rebuild with grocery support and essential supplies when they needed it most.',
  'When Hurricane Helene made landfall in western North Carolina in September 2025, it left a trail of destruction that no one in the region had ever seen. Entire neighborhoods were underwater. Roads were impassable. Power was out for weeks.

Our relief team was on the ground within 48 hours. Working with FEMA, local churches, and community organizations, we set up coupon distribution points at emergency shelters across Buncombe, Henderson, and Transylvania counties.

The response from donors was overwhelming. Within the first week, we raised enough to provide grocery coupons to over 300 families. These weren''t just any coupons — they were redeemable at stores that were actually open and stocked, including Ingles Markets, Food Lion, and Walmart locations that had restored power.

Mark, a volunteer firefighter who lost his own home while helping others, said: "I spent three days rescuing people from rooftops. When I finally got to a shelter, someone handed me a grocery coupon. I broke down crying. It was the first time someone had taken care of me."

Three months later, the recovery continues. We''ve transitioned from emergency relief to long-term support, helping families rebuild their pantries as they move from shelters into temporary and permanent housing. The community''s resilience has been nothing short of inspiring.',
  'Emergency groceries for 300+ families',
  'emergency',
  21300,
  25000,
  312,
  ARRAY['Ingles Markets', 'Food Lion', 'Walmart'],
  2
),
(
  'children-of-heroes',
  'Children of Heroes',
  'Ukraine',
  'Children of fallen heroes received nutrition and care',
  'Children of fallen heroes in Ukraine are receiving nutrition, education supplies, and community care — ensuring they are never forgotten.',
  'Since the full-scale invasion began, thousands of Ukrainian children have lost a parent — mothers and fathers who gave their lives defending their country. These children are heroes in their own right, carrying burdens no child should bear.

The Children of Heroes program was founded by a group of military widows who understood that while the nation mourned, practical support was desperately needed. Many of these families lost their primary breadwinner, plunging them into financial hardship on top of unimaginable grief.

Our partnership provides monthly grocery coupons redeemable at Silpo, ATB, and other major Ukrainian retailers. But the program goes beyond food. We fund school supplies, winter clothing, and after-school activities that give these children a sense of community and belonging.

Olena, mother of 8-year-old Dmytro, shared: "My husband was everything to us. When he didn''t come home, I didn''t know how we would survive. The grocery coupons mean Dmytro eats well. The after-school program means he has friends who understand. We are not forgotten."

Currently supporting 245 families across Kyiv, Lviv, and Dnipro, the program aims to expand to Odesa and Kharkiv by mid-2026. Every donation directly impacts a child who has already sacrificed more than most of us ever will.',
  'Monthly support for 245 hero families',
  'child',
  16800,
  20000,
  245,
  ARRAY['Silpo', 'ATB Market', 'Novus'],
  3
);
