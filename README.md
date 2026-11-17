# Hide Google Upgrade Buttons

A local Chrome extension that hides the promotional **Upgrade** button in Google
Workspace web apps (Chat, Gmail, Docs, Drive, Calendar, Meet, and friends).

Purely cosmetic — it hides a UI element in your own browser. It does not change
your account, your plan, or anything server-side.

## Why not uBlock Origin or Tampermonkey?

Both work, but both are third-party extensions that need broad read/write access
to every Google page you're signed into — your mail, your documents, your chats —
and they auto-update from a remote source. That's a large, permanent trust
surface for the sake of hiding one button.

This extension instead:

- declares **zero** `permissions` (no `storage`, no `tabs`, no `scripting`)
- has **no** background service worker and makes **no** network requests
- runs only on the Google hosts listed in `manifest.json`
- is ~120 lines of code you can read in full before installing it
- never updates itself — it does exactly what's in this folder, forever

## Install

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select this folder:
   `~/dev-projects/hide-google-upgrade`
4. Reload any open Google tabs.

The extension is tied to the Chrome profile you install it in. To remove it,
click **Remove** on its card in `chrome://extensions`.

Note: with Developer mode on, Chrome may show a one-time "Disable developer mode
extensions" bar at startup. Dismiss it — the extension keeps working.

## How it works

`hide-upgrade.css` is injected at `document_start`, so nothing flashes in before
it's hidden. It statically hides controls Google labels explicitly
(`aria-label="Upgrade"`, `data-tooltip="Upgrade"`) and links pointing at Workspace
pricing / billing pages.

Google's class names are obfuscated and rotate, and the apps re-render
constantly, so `hide-upgrade.js` also runs a throttled sweep on DOM mutations. A
control is hidden only if:

- its link points at a Workspace pricing/billing URL, **or**
- its label starts with "Upgrade" **and** it sits inside app chrome
  (`header`, `[role="banner"]`, `[role="toolbar"]`, `[role="navigation"]`) or in
  the top strip of the window.

Anything inside a message body, document, list item, editable field, or iframe is
skipped entirely — so an "Upgrade" link inside an actual email is never touched.

## Tuning

If a button survives, or something gets hidden that shouldn't:

- add the label to `isPromoLabel()` in `hide-upgrade.js`, or
- add its URL pattern to `UPGRADE_URL`, or
- add an exclusion selector to `CONTENT`.

Then hit the reload icon on the extension card in `chrome://extensions` and
refresh the Google tab.

## Alternative: uBlock Origin filters

If you already run uBlock Origin and would rather use it, these go in
**Settings → My filters** instead of installing this extension:

```
mail.google.com,chat.google.com,docs.google.com,drive.google.com,calendar.google.com##a[aria-label^="Upgrade" i]
mail.google.com,chat.google.com,docs.google.com,drive.google.com,calendar.google.com##[role="button"][aria-label^="Upgrade" i]
google.com##a[href*="workspace.google.com/pricing"]
```

Same effect, but scoped to whatever access uBlock Origin already has.
