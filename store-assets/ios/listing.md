# App Store Connect listing copy

Same voice as the Google Play draft (`store-assets/android/listing.md`), adapted to
Apple's fields and character limits. Edit freely before submitting.

## App name (max 30 characters, currently 12)
NikahPathway

## Subtitle (max 30 characters, currently 25)
Wali-led marriage service

## Promotional text (max 170 characters, currently 98, can be updated anytime without a new build)
A guided, guardian-led route to nikah. Free to join and browse — see who's here before you decide.

## Description (max 4000 characters)

NikahPathway is a marriage introduction service built for practicing Muslims who want a
guided, guardian-led route to nikah, not an endless chat.

A FEW THINGS THAT MAKE IT DIFFERENT

- The Wali is part of it, start to finish. A guardian can be looped into conversations
  once they open, and contact details are shared once both sides are serious.
- Profiles are text, never photos. Every member is judged on what they write, not a
  picture.
- Nothing on the platform sits outside the sharia.
- Your name stays private until you choose to share it.

HOW IT WORKS

1. Write a real profile. A few paragraphs on your practice, your family, and what you
   are looking for.
2. Read and reach out. Look through the members, send interest, and open a
   conversation once both sides agree.
3. Meet, and decide. Share guardian contact details, arrange a call, and plan to meet.

Joining is free: write your profile and start reading today. A paid plan unlocks
sending requests, opening conversations, and reaching a guardian — see current pricing
in the app.

NikahPathway is operated by Al-Fur'qan International Missionary, a US-registered
501(c)(3) nonprofit.

## Keywords (max 100 characters, currently 78, comma-separated, no spaces needed after commas)
nikah,marriage,muslim,matrimony,wali,guardian,islamic,halal,matchmaking,spouse

## Category
Primary: Lifestyle. Apple's App Store has no dedicated "Dating" category the way
Google Play does, so Lifestyle is the closest accurate fit. Social Networking is the
next-best alternative if Lifestyle is rejected for this content type.

## Support URL
https://nikahpathway.com

## Marketing URL (optional)
https://nikahpathway.com

## Privacy Policy URL
https://nikahpathway.com/privacy

## Copyright
Al-Fur'qan International Missionary

## Age rating questionnaire notes
Same real answers as the Google Play content rating — no user photos anywhere, private
messaging between matched members only, no location sharing, 18+ only (already stated
in the site's Terms).

## A requirement to remember before submitting: Sign in with Apple

Apple's App Review Guideline 4.8 requires offering Sign in with Apple if the app offers
a third-party login like Google. The site currently shows a "Continue with Apple"
button that's an in-development placeholder (see `src/components/auth/forms.tsx`) —
Google sign-in works, Apple doesn't yet. Once the Apple Developer Program membership is
active, Apple sign-in needs to actually be wired up (Services ID + Sign in with Apple
key, plugged into Supabase) before this app can pass review, not just the store listing
filled in.

## Demo account for reviewers
Same account used for the Google Play reviewer sign-in works here too — see
`store-assets/android/README.md` for which one and why. Confirm it still has an
active, complete profile before submitting.
