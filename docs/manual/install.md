# Install

save-my-chat needs **Firefox 142** or later.

**From addons.mozilla.org:** open
[save-my-chat on AMO](https://addons.mozilla.org/firefox/addon/save-my-chat/)
and choose **Add to Firefox**. Firefox keeps it updated: every release is
sent to AMO by itself, and comes to you once Mozilla has reviewed it.

## A release before its review

A release reaches GitHub at once, AMO after Mozilla's review. To try one
before that:

1. Download it:
   [save-my-chat.zip](https://github.com/radiokociamuzyka/save-my-chat/releases/latest/download/save-my-chat.zip)
   (every version is on the [releases page](https://github.com/radiokociamuzyka/save-my-chat/releases)).
2. Open `about:debugging` in Firefox, choose **This Firefox**, then
   **Load Temporary Add-on…**, and pick the downloaded zip.
3. The save-my-chat button appears in the toolbar (pin it from the
   extensions menu if Firefox hides it).

The zip from GitHub is not signed, so Firefox loads it as a *temporary*
add-on: it is removed when Firefox closes, and loaded again the same way.
Your settings and library are kept only while it stays loaded.

## Updating

From AMO, Firefox updates it by itself. A temporary add-on: load the newer zip the same way. If an older save-my-chat is still
listed in `about:debugging`, remove it first. Since release v0.1.53 the
add-on's id is `save-my-chat@radiokociamuzyka.pl`; an older build has
another id and counts as a different add-on.
