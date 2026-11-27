// A Firefox with the built extension (dist/extension/) loaded as a temporary add-on,
// driven by Selenium through geckodriver (Q14). The extension's internal address is
// fixed by a preference, so its pages open at moz-extension://<UUID>/..., opened by
// Firefox's own window (geckodriver --allow-system-access), WebDriver's get() refusing them.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Builder, By, until } from "selenium-webdriver";
import firefox from "selenium-webdriver/firefox.js";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
export const EXTENSION = join(ROOT, "dist/extension");
const ID = JSON.parse(readFileSync(join(EXTENSION, "manifest.json"), "utf8")).browser_specific_settings.gecko.id;
export const UUID = "5a7e0000-0000-4000-8000-5a7ec4a70000";
export const page = (path) => `moz-extension://${UUID}/${path}`;

export async function start() {
	const options = new firefox.Options()
		.addArguments("-headless")
		.setPreference("extensions.webextensions.uuids", JSON.stringify({ [ID]: UUID }));
	// Firefox of a snap (Ubuntu) starts through a wrapper geckodriver does not take: its binary
	const SNAP = "/snap/firefox/current/usr/lib/firefox/firefox";
	const binary = process.env.FIREFOX_BIN || (existsSync(SNAP) ? SNAP : null);
	if (binary) options.setBinary(binary);
	// geckodriver lets the session into Firefox's own window (open() below)
	const service = new firefox.ServiceBuilder(process.env.GECKODRIVER).addArguments("--allow-system-access");
	const driver = await new Builder()
		.forBrowser("firefox")
		.setFirefoxOptions(options)
		.setFirefoxService(service)
		.build();
	await driver.installWebExtension(EXTENSION, { permanent: false });
	return driver;
}

// WebDriver may not navigate a tab to moz-extension:// itself; Firefox's own window opens it
export async function open(driver, path) {
	await driver.setContext(firefox.Context.CHROME);
	await driver.executeScript("openTrustedLinkIn(arguments[0], 'current')", page(path));
	await driver.setContext(firefox.Context.CONTENT);
	await driver.wait(async () => (await driver.getCurrentUrl()).startsWith(page(path).split("#")[0]), 10_000);
}

export const find = (driver, css, timeout = 10_000) => driver.wait(until.elementLocated(By.css(css)), timeout);
export const all = (driver, css) => driver.findElements(By.css(css));
export const texts = async (driver, css) => Promise.all((await all(driver, css)).map((e) => e.getText()));

// the extension's own API, run in its page (a moz-extension:// page has `browser`)
export const run = (driver, body, ...args) =>
	driver.executeAsyncScript(
		`const done = arguments[arguments.length - 1];
		 (async (...args) => { ${body} })(...[...arguments].slice(0, -1)).then(done, (e) => done({ error: String(e) }));`,
		...args,
	);

// a screenshot into dist/shots/, to look at after a run
export async function shot(driver, name) {
	mkdirSync(join(ROOT, "dist/shots"), { recursive: true });
	const png = await driver.takeScreenshot();
	writeFileSync(join(ROOT, `dist/shots/firefox-${name}.png`), png, "base64");
}

export { By, until };
