# Agent instructions

This repository is the standalone GitHub Pages version of Points Walk. Preserve
the static hosting requirement and device-local scores with explicit JSON
export/import. Never reconnect it to the NAS, publish player records, or copy
private credentials from the original PHP app. Keep sample questions generic.

Use plain HTML/CSS/JavaScript. Keep the 1/X/2 model, Swedish player copy, and
English question-editor/scoreboard copy. All project links must work under
`/pointswalk-pages/`. QR links carry validated question data and a walk ID;
changing a question does not rewrite printed codes.

Treat imported questions/results and URL data as untrusted. Render user content
with textContent. Validate before changing storage. Deduplicate results by
walk/player/question, protect CSV formulas, and never silently wipe unreadable
browser data. Keep JSON format versioned.

Run `npm test` and `npm run test:browser` for relevant behavior changes. Publishing
uses the GitHub Actions Pages workflow with an allowlisted artifact; don't add
runtime records, local exports, secrets, node_modules, or test reports to it.
The original private PointsWalk repository and NAS deployment are separate.
