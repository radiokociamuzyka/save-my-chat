// `task run`: Firefox with the built extension (Q12), rebuilt on every change of src/ -
// Vite watches the pages and the files it copies, web-ext reloads the extension when
// dist/extension/ changes. Ctrl+C stops both. Expects one build done (npm start does it).
// The debug build (SMC_DEBUG=1, the debug gate) unless SMC_DEBUG=0 is asked for.
import { spawn } from "node:child_process";

const extra = process.argv.slice(2);
const env = { ...process.env, SMC_DEBUG: process.env.SMC_DEBUG ?? "1" };
const vite = spawn("npx", ["vite", "build", "--watch"], { stdio: "inherit", env });
const firefox = spawn("npx", ["web-ext", "run", ...extra], { stdio: "inherit" });
const stop = () => {
	vite.kill();
	firefox.kill();
};
firefox.on("exit", (code) => {
	vite.kill();
	process.exit(code ?? 0);
});
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
