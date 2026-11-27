# BRAINSTORM: open questions

Questions for the owner, `## Q<n>. <title>`, each with a *Lean:* (what the
agent would pick). Answer in [ORDERS.md](ORDERS.md) (or in the chat);
answered questions move word for word into `docs/changelog/phase-<n>.md`
with their **Decision:**.

Q1-Q6 were answered (changelog phase 0), Q7-Q11 (changelog phase 1). Q12-Q14 (changelog phase 4).

## Q15. Webapps at an address of the user's own: Open WebUI, a Gradio space

Sett's drafts name Open WebUI and a Gradio space on Hugging Face (RR7).
Both differ from every webapp so far: Open WebUI runs wherever its user
installed it (`http://localhost:3000`, a home server, a company's
domain), and a Gradio app runs in a frame of its own space,
`https://<owner>-<space>.hf.space`. So `chats.yaml` cannot declare their
hosts, and the manifest cannot list them.

- **a)** The user types the address in the Readers tab. The manifest
  declares `https://*/*` and `http://*/*` among its optional host
  permissions, and asks only for the typed one. The reader is a default
  file like the others. AMO reviewers may look harder at such a broad
  optional permission, though only the typed host is ever granted.
- **b)** No reader shipped. The user makes a prototype (phase 3) from
  a template for each, at their own address. The userScripts permission
  covers it, and the manifest gains nothing.
- **c)** Gradio only on `*.hf.space` (a fixed pattern, optional), and
  Open WebUI as b).

*Lean:* a). One way for both, the same Allow as ChatGPT's, and the
reader stays ours to fix. b) puts a reader's upkeep on every user.

