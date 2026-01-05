-- Fix historical donation: link to correct user account
UPDATE donations 
SET donor_id = 'f063f344-accc-49d3-a975-0ff96c010692',
    donor_email = 'connect.coupondonation@gmail.com'
WHERE stripe_session_id = 'cs_live_a1D5JmQgCCvlJpyh38KFLq9eWihZfP9C60i59Boy4gd0KbUWUp18nSYHHh';