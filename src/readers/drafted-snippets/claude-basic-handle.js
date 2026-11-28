Array.from(
    document.querySelectorAll("[data-perf-row]")
).map(
    (x)=>[
        (x.getAttribute("data-perf-row")),
        x.innerText
    ]
).map(
    (y)=>[
        y[0]=="human"&&y[0]!="assistant"?"\n\n\t-- USER --\n\n":"\n\n\t--AGENT\n\n",
        y[1]
    ].join("\n\n---\n\n")
)