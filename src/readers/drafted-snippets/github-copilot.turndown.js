// var head = document.getElementsByTagName('head').item(0);
//     var script = document.createElement('script');
//     script.setAttribute('type', 'text/javascript');
//     script.setAttribute('src', 'https://unpkg.com/turndown/dist/turndown.js');
//     head.appendChild(script);
//     window.onload = function() {
//         var turndownService = new TurndownService()
/* NOTE: injection of this for me was not working in devtools this time */
        Array.from(
            document.querySelectorAll(".message-container")
        ).map((x)=>[
            [
                "\n\n\t---",
                (
                    (x.className.includes("user__"))?"USER":"AGENT" //there is class like "user__*****" and for agents "ai__*****"
                ),
                "---\n\n"
            ].join(" "), 
                x.innerText //temporarly replaced to just text stripping from html to bare texts
            ].join("\n---\n")
        ).forEach(
            (x)=>console.log(x)
        )

/* NOTE: above is proof of work how it should be done - github copilot script in readers was verified and it turns out that it does not detect messages at `https://github.com/copilot/c/*` webapp ui*/
//    };