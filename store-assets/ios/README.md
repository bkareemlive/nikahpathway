# iOS / App Store — status and next steps

## What's done (Mac-independent)

- `app-icon-1024.png` — the real logo mark, generated from `src/components/Logo.tsx`'s
  actual SVG, same treatment as the Android launcher icon. 1024×1024, **no alpha
  channel** (verified: `channels: 3, hasAlpha: false`) — Apple rejects icons that have
  one at all, even if fully opaque.
- `listing.md` — draft App Store Connect listing copy: name, subtitle, promotional
  text, description, keywords, category, URLs, age rating notes. All character limits
  verified against the actual text, not estimated.
- Apple Developer Program decision made: paying the $99/year rather than pursuing the
  nonprofit fee waiver, since the waiver would have required the iOS app to stay free
  with no in-app purchases (membership payment stays on the website via Stripe either
  way, so this mostly matters for keeping the option open later).

## What needs the Mac (can't happen from this Windows session)

1. **Enroll in the Apple Developer Program** (developer.apple.com/programs/enroll) —
   this itself doesn't need a Mac, but everything after it does.
2. **Install Xcode** from the Mac App Store.
3. **Add the iOS platform**: `npx cap add ios`, mirroring what `cap add android` did
   for Android — generates the `ios/` Xcode project. Needs CocoaPods
   (`sudo gem install cocoapods` or via Homebrew), which doesn't run on Windows.
4. **Open `ios/App/App.xcworkspace` in Xcode** (not the `.xcodeproj` — Capacitor/
   CocoaPods projects must be opened via the workspace file) and run it on a simulator
   or a real device to confirm it loads the live site, same verification we did for
   Android on the OPPO phone.
5. **Generate the real icon set** from `app-icon-1024.png` — Xcode/Capacitor needs
   multiple sizes in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`, generated from
   this one 1024px source (Xcode can often do this automatically from a single 1024px
   icon via its asset catalog).
6. **Wire up Sign in with Apple** once the Developer Program membership is active — see
   the note in `listing.md`. This is a real App Review requirement (Guideline 4.8), not
   optional, since the app also offers Google sign-in.
7. **Create a signing certificate and provisioning profile** in Xcode (Xcode can
   usually automate this once signed into the Apple Developer account there).
8. **Take real screenshots** once the app is running, for the App Store listing.
9. **Submit through App Store Connect** (appstoreconnect.apple.com) — create the app
   record, fill in `listing.md`'s content, upload the icon and screenshots, archive and
   upload a build from Xcode, and submit for review.

## To continue this work

Open Claude Code on the Mac, signed into the same account as this session, so this
conversation's context carries over. From there, steps 2 onward above can actually be
run and verified the same way the Android build was.
