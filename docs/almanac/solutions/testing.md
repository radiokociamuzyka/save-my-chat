# testing

The tests in a real Firefox (Selenium, Q14) and of the public site
(Playwright, Q13), and what their tools do on the way.

- [webdriver-moz-extension](../cataclistics/webdriver-moz-extension.md): geckodriver `--allow-system-access`, Firefox's own window opens `moz-extension://`; a snap's binary and `/tmp`
- [vite-glob-before-imports](../cataclistics/vite-glob-before-imports.md): an eager glob's imports go to the top of its module: give it a module of its own
- [snap-private-tmp-run](../cataclistics/snap-private-tmp-run.md): `task run` on a snap's Firefox: a profile in the project, not in `/tmp`; a lesson checked against every way Firefox is started
- [npx-orphan-watch](../cataclistics/npx-orphan-watch.md): killing `npx` left Vite's watcher and its lock: tools started as node in a group of their own, stopped by the group
- [verify-beside-task-run](../cataclistics/verify-beside-task-run.md): the checks build into `dist/verify/` with a Vite cache of their own, so they run while `task run` watches
