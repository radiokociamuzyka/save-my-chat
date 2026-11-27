<!-- A message's Markdown shown as elements made one by one from marked's tokens: no
     innerHTML, raw HTML shown as text, links only of http(s) and mailto, and images
     never loaded (rule 4: the extension makes no requests of its own), only named. -->
<script>
import { Lexer } from "marked";
import { h } from "vue";

const SAFE = /^(https?:|mailto:)/i;

function inline(tokens = []) {
	return tokens.map((t) => {
		switch (t.type) {
			case "strong":
				return h("strong", inline(t.tokens));
			case "em":
				return h("em", inline(t.tokens));
			case "del":
				return h("del", inline(t.tokens));
			case "codespan":
				return h("code", t.text);
			case "br":
				return h("br");
			case "link":
				return SAFE.test(t.href)
					? h("a", { href: t.href, target: "_blank", rel: "noreferrer", title: t.title || undefined }, inline(t.tokens))
					: h("span", inline(t.tokens));
			case "image":
				return h("span", { class: "image-named", title: t.href }, `[image: ${t.text || t.href}]`);
			case "checkbox":
				return h("input", { type: "checkbox", checked: t.checked, disabled: true, class: "mr-1" });
			case "text":
				return t.tokens ? inline(t.tokens) : t.text;
			default: // html, escape and the rest: their text as it is
				return t.text ?? t.raw ?? "";
		}
	});
}

function block(tokens = []) {
	return tokens.map((t) => {
		switch (t.type) {
			case "heading":
				return h(`h${Math.min(t.depth + 2, 6)}`, inline(t.tokens));
			case "paragraph":
				return h("p", inline(t.tokens));
			case "code":
				return h("pre", h("code", { "data-lang": t.lang || undefined }, t.text));
			case "blockquote":
				return h("blockquote", block(t.tokens));
			case "list":
				return h(
					t.ordered ? "ol" : "ul",
					t.ordered && t.start > 1 ? { start: t.start } : {},
					t.items.map((item) => h("li", item.loose ? block(item.tokens) : inline(item.tokens))),
				);
			case "table":
				return h("div", { class: "table-container" }, [
					h("table", { class: "table is-narrow is-bordered" }, [
						h("thead", h("tr", t.header.map((cell) => h("th", inline(cell.tokens))))),
						h("tbody", t.rows.map((row) => h("tr", row.map((cell) => h("td", inline(cell.tokens)))))),
					]),
				]);
			case "hr":
				return h("hr");
			case "space":
				return null;
			case "text":
				return h("p", t.tokens ? inline(t.tokens) : t.text);
			default:
				return h("p", t.text ?? t.raw ?? "");
		}
	});
}

export default {
	name: "MarkdownText",
	props: { text: { type: String, required: true } },
	setup(props) {
		return () => h("div", { class: "content markdown-text" }, block(Lexer.lex(props.text, { gfm: true })));
	},
};
</script>
