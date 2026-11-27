// Sett's proof of work, as written in INQUIRIES.md on 2026-11-26: run in
// Firefox's devtools on an AI Mode conversation, it loads turndown from
// unpkg and logs every message as Markdown. Kept unchanged as the source of
// src/readers/google-ai-mode.js; not packaged (web-ext-config.mjs ignores
// this directory) and not formatted (biome.json).
// Sett noted: "currently not all of them are exported correctly - missing
// for example user messages."

var head = document.getElementsByTagName('head').item(0);
    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', 'https://unpkg.com/turndown/dist/turndown.js');
    head.appendChild(script);
    window.onload = function() {
        var turndownService = new TurndownService()

        Array.from(
            document.querySelectorAll(".ilZyRc, .L4dlbc, .CKgc1d")
        ).map(
            (x)=>[
                (x.className!="CKgc1d")?"\n\n\t--- USER ---\n\n":"\n\n\t--- AGENT ---\n\n", 
                turndownService.turndown(x.innerHTML)
            ].join("\n---\n")
        ).forEach(
            (x)=>console.log(x)
        )
    };
