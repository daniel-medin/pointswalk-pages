# Points Walk — GitHub Pages

A static version of the Points Walk app previously hosted on Nasgul. Create
1/X/2 quiz questions, print QR codes, answer on phones, and combine exported
results. No NAS connection, PHP, account, or backend is required.

Live site: https://daniel-medin.github.io/pointswalk-pages/

## Run a walk

1. Open the home page. It starts with three sample questions. Add/edit questions
   or import an existing `questions.json` array from the original app.
2. Select each question and download its QR PNG. The QR contains that question
   and the walk ID, so it opens on another phone without server-side publishing.
3. Players scan the printed codes, enter a name once, and save their answers.
4. On each phone, open **Mina resultat / exportera**, then **Export results (JSON)**.
5. Transfer those files to the organizer and use **Import results (JSON)** on
   the scores page. Select the walk to see combined scores; repeated imports
   don't count the same player/question/walk twice. Export CSV for a spreadsheet.

Names must be unique within a walk. Question changes require reprinting its QR;
printed codes keep their original question. Saved data belongs to a browser
profile and origin, so clearing browser data/private browsing can erase it.
Export important questions and results before resetting data or switching devices.
QR links and the site contain the answers: this is for friendly events, not
tamper-proof exams. Imported results are trusted local files, not authenticated
server scores. The site needs connectivity to load; it is not an offline PWA.

## Migration and privacy

This is a new repository. The private `daniel-medin/PointsWalk` repository and NAS
deployment were not modified. Historical participant records, the old reset
credential, and the original personal quiz are excluded from this public copy.
The original files were retained in private migration staging on the owner's PC.
Import original questions locally when needed; they are embedded in shared QR
links rather than committed automatically. Scores never leave the device unless
the user explicitly exports/shares a results file.

PHP endpoints have been replaced by local browser storage. There is no shared
live scoreboard, server reset token, participant database, or API to configure.
Old printed NAS QR codes are not redirected; regenerate them using this site.

## Development and deployment

Plain HTML/CSS/JavaScript, with no production build step and no CDN dependencies.
`pointswalk.js` holds validated storage, merging, scoring, CSV and link codecs.
The question editor and scoreboard are English; player UI remains Swedish.

```sh
npm ci
npm test
npm run test:browser
```

Local browser tests use installed Chrome. CI uses Playwright Chromium and tests
the project subpath, generated QR decoding, a separate phone session, duplicate
prevention, result transfers, and safe rendering. `node tests/serve.cjs` serves
http://127.0.0.1:4173/pointswalk-pages/ for manual checks.

GitHub Actions deploys an allowlisted set of static files to Pages after tests
pass. Test tools, documentation, and exports are not in the Pages artifact.

Third-party QRCode.js is MIT licensed; see [THIRD_PARTY.md](THIRD_PARTY.md).
