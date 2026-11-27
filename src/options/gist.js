// A chat as a secret gist (Q9): the one way anything leaves the machine, and only by the
// user's click, with the user's own token, through GitHub's API - an optional host
// permission asked on that click, with the data it sends declared in the manifest
// (data_collection_permissions.optional). Rule 4 names it as its one exception.
import { Octokit } from "@octokit/core";

export const API = "https://api.github.com/*";
// what a gist of a chat holds: the page's content, and the user's own messages
export const DATA = ["websiteContent", "personalCommunications"];
export const TOKEN_PAGE = "https://github.com/settings/tokens/new?scopes=gist&description=save-my-chat";

// the chat's two files, named as the downloads are
export function filesOf(c, { markdown, fileName }) {
	const name = fileName(c, "md").split("/").pop();
	return {
		[name]: { content: markdown(c) },
		[name.replace(/\.md$/, ".json")]: { content: `${JSON.stringify(c, null, "\t")}\n` },
	};
}

// the gist made, secret; its address returned
export async function share(c, token, tools, octokit = new Octokit({ auth: token })) {
	const { data } = await octokit.request("POST /gists", {
		description: `${c.title} (saved by save-my-chat from ${c.source.service})`,
		public: false,
		files: filesOf(c, tools),
	});
	return data.html_url;
}
