# Old white share picture: why it still appears

## What I checked
The live site already gives the new green logo picture (og-image.jpg?v=6) to link previews on every address I tried: coupondonation.com, www.coupondonation.com, /about and /stories. Fundraiser links keep their own photo, as intended.

## Why some places still show the white "Give what people need" picture
The apps keep the preview they made the first time someone shared that exact address. WhatsApp, iMessage, Facebook, LinkedIn and Slack each hold their own copy and only refresh it on their own schedule, sometimes after days or weeks. `coupondonation.com` was shared before the change, so those apps still show their old copy. `www.coupondonation.com` looks right because that address got a fresh preview.

## What to do (no website change needed)
- Facebook / WhatsApp / Instagram: open developers.facebook.com/tools/debug, paste `https://coupondonation.com`, press "Scrape Again". Repeat for any other page address.
- LinkedIn: linkedin.com/post-inspector, paste the address.
- X: the new picture appears on new posts.
- iMessage: shows the cached copy on that phone. A new chat or a slightly different address such as `coupondonation.com/?s=1` gets the new picture.
- Slack / Telegram: usually refresh within a day. In Telegram, send the link to @WebpageBot to refresh it.

## Optional
I can make no code change, or bump the picture version again. That doesn't help here, because the apps cache the page address, not the picture.
