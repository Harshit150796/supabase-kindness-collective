-- Fix display_order conflict: move Martinez Family from 2 to 3, shift others down
UPDATE cms_stories SET display_order = display_order + 1 WHERE display_order >= 3 AND id != '38489620-dc6a-41b2-a982-978a9d39c895';
UPDATE cms_stories SET display_order = 3 WHERE id = '4181e5be-0948-46d5-a6ef-b1148c268d32';

-- Update Grace's image to use the childrens-hope asset (2nd of 4 images provided)
UPDATE cms_stories SET image_url = '/assets/featured/childrens-hope.webp' WHERE id = '38489620-dc6a-41b2-a982-978a9d39c895';
