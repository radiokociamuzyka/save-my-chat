// vitest's global setup: src/vendor/ gathered from node_modules (scripts/vendor.mjs).
import { gather } from "../scripts/vendor.mjs";

export default function setup() {
	gather();
}
