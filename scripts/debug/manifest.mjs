// The debug build's manifest (SMC_DEBUG=1, vite.config.mjs): the release's, and the
// debug gate - its background script, native messaging and any site as optional
// permissions the user grants in the Debug tab - and a name that says it.
export function debugManifest(m) {
	return {
		...m,
		name: `${m.name} (debug)`,
		background: { ...m.background, scripts: [...m.background.scripts, "debug/background.js"] },
		optional_permissions: [...new Set([...(m.optional_permissions ?? []), "nativeMessaging"])],
		optional_host_permissions: [...new Set([...(m.optional_host_permissions ?? []), "https://*/*", "http://*/*"])],
	};
}
