"""The devlog's news in GitHub Discussions (phase 2, the owner's discussion #17): short notes
with links in Announcements, a dedicated discussion per proposal in Ideas, and every almanac
case as a Q&A whose answer is its solution. The markdown stays the source; each discussion
carries a marker <!-- feed:<key> -->, so a run finds its own and only changes what differs.

  Announcements  changelog posts (a section of docs/changelog/phase-<n>.md each, its
                 decisions in short), phases begun and done (TODO.md), proposals (with their
                 issue and their discussion), releases introduced (GitHub releases)
  Ideas          one per PP<n>: the proposal as it stood, its issue, the owner's decision
  Q&A            one per docs/almanac/cataclistics/<case>.md: what happened and how to
                 recognise it; the solution posted as a comment and marked as the answer

Usage: python3 discussions.py [--dry]   (task github:discussions; feed.yml after each release)
"""

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import devlog  # noqa: E402  the same reading of the devlog, and gh()

ROOT = devlog.ROOT
DRY = "--dry" in sys.argv
SITE = "https://github.com/radiokociamuzyka/save-my-chat"
BLOB = f"{SITE}/blob/master/"
gh = devlog.gh


def anchor(heading: str) -> str:
    """GitHub's anchor of a markdown heading"""
    return re.sub(r"[^\w\- ]", "", heading.lower()).replace(" ", "-")


def marker(key: str) -> str:
    return f"<!-- feed:{key} -->"


def first_sentence(text: str) -> str:
    text = " ".join(text.split())
    found = re.match(r"(.+?[.!?])(\s|$)", text)
    return found[1] if found else text


# --- what the feed should hold -----------------------------------------------------------------


def changelog_posts() -> list[dict]:
    posts = []
    for page in sorted(devlog.CHANGELOG.glob("phase-*.md"), key=lambda p: int(p.stem.split("-")[1])):
        rel = page.relative_to(ROOT).as_posix()
        for part in re.split(r"^(?=## )", page.read_text(), flags=re.M)[1:]:
            heading = part.splitlines()[0][3:].strip()
            decisions = [first_sentence(d) for d in re.findall(r"\*\*Decision:\*\*(.+?)(?:\n\n|\Z)", part, re.S)]
            lines = [f"A new entry in the changelog of {page.stem.replace('-', ' ')}: **{heading}**.", ""]
            if decisions:
                lines += ["Decided:", "", *[f"- {d}" for d in decisions], ""]
            lines += [f"Read it, the owner's words word for word: {BLOB}{rel}#{anchor(heading)}"]
            posts.append({"key": f"changelog:{page.stem}:{anchor(heading)[:80]}", "category": "Announcements",
                          "title": f"Changelog: {heading}", "body": "\n".join(lines)})
    return posts


def phase_posts(issue_of: dict[str, int]) -> list[dict]:
    posts = []
    for n, phase in sorted(devlog.phases().items()):
        items = phase["items"]
        ticked = sum("- [x]" in item for item in items)
        if not ticked:
            continue
        done = ticked == len(items)
        issue = issue_of.get(f"phase-{n}")
        link = f"{SITE}/issues/{issue}" if issue else f"{BLOB}docs/devlog/TODO.md"
        state = "done" if done else "begun"
        body = (f"Phase {n}, {phase['title']}, is {'done: all' if done else 'under way:'} {ticked} of "
                f"{len(items)} steps ticked.\n\nIts steps: {link}\nIts idea: {BLOB}docs/devlog/VISION.md")
        posts.append({"key": f"phase:{n}:{state}", "category": "Announcements",
                      "title": f"Phase {n} {state}: {phase['title']}", "body": body})
    return posts


def proposal_posts(issue_of: dict[str, int]) -> list[dict]:
    """an Ideas discussion per PP<n>, and its Announcement (which links the Ideas one, filled in later)"""
    posts = []
    answered = devlog.answers()
    for key, text in sorted(devlog.as_they_stood("docs/devlog/PROPOSALS.md").items(),
                            key=lambda kv: int(kv[0][2:])):
        title = text.splitlines()[0].lstrip("# ").strip()
        issue = issue_of.get(key)
        issue_line = f"Its issue: {SITE}/issues/{issue}" if issue else ""
        lines = [f"**{key}** as it stood in PROPOSALS.md:", "", *text.splitlines()[1:], "", issue_line]
        phase, answer = answered.get(key, (None, ""))
        if answer:
            lines += ["", "---", "", f"**The owner's decision** ({BLOB}docs/changelog/phase-{phase}.md):", "",
                      *answer.splitlines()[1:]]
        posts.append({"key": f"proposal:{key}", "category": "Ideas", "title": title,
                      "body": "\n".join(lines).strip()})
        posts.append({"key": f"proposal-note:{key}", "category": "Announcements", "title": f"Proposal {title}",
                      "body": f"A proposal: **{title}**. {issue_line}", "discussion_of": f"proposal:{key}"})
    return posts


def release_posts() -> list[dict]:
    posts = []
    releases = gh("release", "list", "--json", "tagName,name,publishedAt", "-L", "100") or []
    for r in sorted(releases, key=lambda r: r["publishedAt"]):
        tag = r["tagName"]
        notes = gh("release", "view", tag, "--json", "body", "--jq", ".body") or ""
        body = (f"**{r['name']}** is out: {SITE}/releases/tag/{tag}\n\n"
                f"Download: {SITE}/releases/download/{tag}/save-my-chat-{tag[1:]}.zip "
                "(load it in Firefox as a temporary add-on: about:debugging, This Firefox).\n\n"
                f"{notes.strip()}")
        posts.append({"key": f"release:{tag}", "category": "Announcements", "title": f"Release {tag}",
                      "body": body.strip()})
    return posts


def section(text: str, name: str) -> str:
    found = re.search(rf"^## {name}\n(.*?)(?=^## |\Z)", text, re.S | re.M)
    return found[1].strip() if found else ""


def almanac_posts() -> list[dict]:
    posts = []
    for page in sorted((ROOT / "docs" / "almanac" / "cataclistics").glob("*.md")):
        text = page.read_text()
        title = text.splitlines()[0].lstrip("# ").strip()
        head = re.findall(r"^- \*\*(?:Met|Topic):\*\*.*$", text, re.M)
        link = f"{BLOB}{page.relative_to(ROOT).as_posix()}"
        body = "\n".join([*head, "", "## What happened", "", section(text, "What happened"), "",
                          "## How to recognise it", "", section(text, "Recognise it again"), "",
                          f"The case in the almanac: {link}"])
        answer = f"{section(text, 'Solution')}\n\n(from the almanac: {link})"
        posts.append({"key": f"almanac:{page.stem}", "category": "Q&A", "title": title, "body": body,
                      "answer": answer})
    return posts


# --- what GitHub holds ---------------------------------------------------------------------------

QUERY_REPO = """query($owner:String!,$name:String!,$after:String){repository(owner:$owner,name:$name){id
discussionCategories(first:25){nodes{id name}}
discussions(first:100,after:$after){pageInfo{hasNextPage endCursor}
nodes{id number url title body category{name} comments(first:20){nodes{id body isAnswer}}}}}}"""


def graphql(query: str, **variables):
    found = gh("api", "graphql", data={"query": query, "variables": variables})
    if found.get("errors"):
        sys.exit(f"graphql: {found['errors']}")
    return found["data"]


def held(owner: str, name: str):
    after, discussions, repo = None, {}, None
    while True:
        repo = graphql(QUERY_REPO, owner=owner, name=name, after=after)["repository"]
        for d in repo["discussions"]["nodes"]:
            key = re.search(r"<!-- feed:(\S+) -->", d["body"] or "")
            if key:
                discussions[key[1]] = d
        page = repo["discussions"]["pageInfo"]
        if not page["hasNextPage"]:
            break
        after = page["endCursor"]
    categories = {c["name"]: c["id"] for c in repo["discussionCategories"]["nodes"]}
    return repo["id"], categories, discussions


def sync(post: dict, repo_id: str, categories: dict, have: dict) -> dict | None:
    body = f"{post['body']}\n\n{marker(post['key'])}"
    old = have.get(post["key"])
    if old and old["title"] == post["title"] and old["body"].strip() == body.strip():
        print(f"{post['key']}: same, #{old['number']}")
        found = old
    elif DRY:
        print(f"{post['key']}: {'changed' if old else 'new'} - {post['category']}: {post['title']}")
        return old
    elif old:
        found = graphql("mutation($id:ID!,$t:String!,$b:String!){updateDiscussion(input:{discussionId:$id,"
                        "title:$t,body:$b}){discussion{id number url title body comments(first:20)"
                        "{nodes{id body isAnswer}}}}}", id=old["id"], t=post["title"], b=body
                        )["updateDiscussion"]["discussion"]
        print(f"{post['key']}: updated, #{found['number']}")
    else:
        found = graphql("mutation($r:ID!,$c:ID!,$t:String!,$b:String!){createDiscussion(input:{repositoryId:$r,"
                        "categoryId:$c,title:$t,body:$b}){discussion{id number url title body comments(first:20)"
                        "{nodes{id body isAnswer}}}}}", r=repo_id, c=categories[post["category"]],
                        t=post["title"], b=body)["createDiscussion"]["discussion"]
        print(f"{post['key']}: new, #{found['number']} ({post['category']})")
    if post.get("answer"):
        answer_of(found, post["answer"])
    return found


def answer_of(discussion: dict, text: str):
    """the solution as a comment of the discussion, marked as its answer"""
    body = f"{text}\n\n{marker('answer')}"
    mine = next((c for c in discussion["comments"]["nodes"] if marker("answer") in c["body"]), None)
    if DRY:
        return
    if not mine:
        mine = graphql("mutation($d:ID!,$b:String!){addDiscussionComment(input:{discussionId:$d,body:$b})"
                       "{comment{id body isAnswer}}}", d=discussion["id"], b=body)["addDiscussionComment"]["comment"]
    elif mine["body"].strip() != body.strip():
        graphql("mutation($c:ID!,$b:String!){updateDiscussionComment(input:{commentId:$c,body:$b}){comment{id}}}",
                c=mine["id"], b=body)
    if not mine.get("isAnswer"):
        graphql("mutation($c:ID!){markDiscussionCommentAsAnswer(input:{id:$c}){discussion{id}}}", c=mine["id"])


def main():
    repo = gh("repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner").strip()
    owner, name = repo.split("/")
    issues = gh("issue", "list", "--state", "all", "--label", "devlog", "--json", "number,body", "-L", "300")
    issue_of = {}
    for issue in issues:
        key = re.search(r"<!-- devlog:(\S+) -->", issue["body"] or "")
        if key:
            issue_of[key[1]] = issue["number"]
    repo_id, categories, have = held(owner, name)
    missing = {"Announcements", "Ideas", "Q&A"} - set(categories)
    if missing:
        sys.exit(f"discussion categories missing: {', '.join(sorted(missing))}")
    posts = (changelog_posts() + phase_posts(issue_of) + proposal_posts(issue_of) + release_posts()
             + almanac_posts())
    made = {}
    for post in posts:
        if post.get("discussion_of"):
            ideas = made.get(post["discussion_of"]) or have.get(post["discussion_of"])
            if ideas:
                post["body"] += f" Its discussion: {ideas['url']}"
        made[post["key"]] = sync(post, repo_id, categories, have)
    print(f"{len(posts)} posts{' (dry: nothing written)' if DRY else ''}")


if __name__ == "__main__":
    main()
