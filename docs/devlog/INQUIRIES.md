# INQUIRIES: the owner's requests

The owner's requests in their own words, written below the line. Agents turn
them into the plan (VISION, ROADMAP, TODO), move them word for word into
`docs/changelog/phase-<n>.md` and leave this file with its header only.

---

## every Q and PP becomes issue

i want it to be fully integrated with github

## github integration of more

milestones and phases in milestones and project planning on github

discussion should bring announcements and almanac debates around known cases and solutions as Q&A topic

workflow of standard ways of developement and husky here should automate standard things we do

biome and playwright will be useful too

vue will keep frontend componenting

bulma will give us standarized stylization

astro will allow us to preview more advanced things build-in like settings page of extension and manuals to it. by the way viewer of our grabbed conversations will help too.

## be inspired by my code that gives me proof of work

this is how i saved these conversations until now:
```js

var head = document.getElementsByTagName('head').item(0);
    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', 'https://unpkg.com/turndown/dist/turndown.js');
    head.appendChild(script);
    window.onload = function() {
        var turndownService = new TurndownService()

Array.from(document.querySelectorAll(".ilZyRc, .L4dlbc, .CKgc1d")).map((x)=>[(x.className!="CKgc1d")?"\n\n\t--- USER ---\n\n":"\n\n\t--- AGENT ---\n\n", turndownService.turndown(x.innerHTML)].join("\n---\n")).forEach((x)=>console.log(x))
    };


```
currently not all of them are exported correctly - missing for example user messages.
this code of mine works fine to me and you can rebuild it to fit what is needed here. 