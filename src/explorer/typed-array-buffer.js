// typed-array-buffer, as Firefox has it natively: the ArrayBuffer under a typed array
// or a DataView, a TypeError otherwise. vite.config.mjs puts it in place of the npm
// package, whose shims (call-bind, get-intrinsic, function-bind) build functions with
// Function() and hold eval - code AMO refuses and rule 5 forbids. isomorphic-git
// reaches it through sha.js and to-buffer, which call it only where ArrayBuffer.isView
// is missing: never in Firefox. Almanac: shims-with-eval.
export default function typedArrayBuffer(x) {
	if (!ArrayBuffer.isView(x)) throw new TypeError("Not a Typed Array");
	return x.buffer;
}
