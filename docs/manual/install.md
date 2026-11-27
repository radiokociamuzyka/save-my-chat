# Install

save-my-chat needs **Firefox 142** or later.

1. Download the newest release:
   [save-my-chat.zip](https://github.com/radiokociamuzyka/save-my-chat/releases/latest/download/save-my-chat.zip)
   (every version is on the [releases page](https://github.com/radiokociamuzyka/save-my-chat/releases)).
2. Open `about:debugging` in Firefox, choose **This Firefox**, then
   **Load Temporary Add-on…**, and pick the downloaded zip.
3. The save-my-chat button appears in the toolbar (pin it from the
   extensions menu if Firefox hides it).

## Temporary, for now

Until the extension is listed on addons.mozilla.org (the last phase of the
project), releases are not signed, so Firefox loads them as a *temporary*
add-on: it is removed when Firefox closes, and loaded again the same way.
Your settings (readers turned off, your own selectors) are kept only while
it stays loaded.

## Updating

Load the newer zip the same way. If an older save-my-chat is still
listed in `about:debugging`, remove it first. Since release v0.1.53 the
add-on's id is `save-my-chat@radiokociamuzyka.pl`; an older build has
another id and counts as a different add-on.
