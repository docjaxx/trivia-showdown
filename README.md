# Trivia Showdown

A Jeopardy-inspired board game for one human and two simulated AI contestants, Atlas and Nova. No AI API key is needed. Opponents use difficulty-weighted accuracy and reaction timing; they are not live language models.

## Play and customize

Open the game, choose a clue, and press Space or tap Buzz in after the reading period. Type your answer within 15 seconds. Correct answers add the clue value; incorrect answers subtract it and let the remaining contestants buzz. The last correct contestant controls the board. After 30 clues, the highest score wins, including ties.

Game menu → Edit categories & questions opens the trivia studio. Edit all six category names, five clues per category, answers, and accepted alternatives. Values are determined by row: $200, $400, $600, $800, and $1,000. Saving restarts the game. JSON import stages a draft; saving applies it. Export JSON makes a portable backup.

## Future Codex updates

### GitHub Pages

`npm run dev:pages` starts the standalone browser version. `npm run build:pages` creates `dist-pages/`, which works at either a GitHub project URL or a custom domain. The `.github/workflows/pages.yml` workflow tests, builds, and publishes on pushes to `main` once the repository's Pages source is set to **GitHub Actions**.

The Pages edition stores menu edits only in the current browser. Export JSON to back up edits or move them between devices. To change the published default for every player, ask Codex to update `data/trivia.json` and push to `main`; GitHub Actions republishes the game automatically. Existing browser overrides remain intact. To return to the latest repository board, use **Download default board**, import that JSON, and save. This removes the local override so subsequent repository updates appear automatically.

GitHub Pages needs no server, database, or AI API key. Do not put GitHub access tokens in the game. Codex updates the repository using your authenticated development session.

### Original database-backed build

- `data/trivia.json` is the editable starter board, loaded when there is no saved custom board.
- The live saved board is stored in D1. Editing the starter JSON does **not** overwrite an existing saved custom board.
- To update a custom board, export it in the studio, have Codex edit the JSON, then import and save it. Keep all category/clue IDs unique and maintain six categories with five clues each.
- In a browser supporting WebMCP, `read_trivia_board` reads the live board and revision; `save_trivia_board` validates and saves a replacement using that revision and restarts the game. Both use the same actions as the editor. Browser support is feature-detected.
- The owner-only hosted app also offers `GET /api/trivia` and `PUT /api/trivia`. PUT accepts `{ "trivia": <board>, "revision": <current revision> }` as JSON. Stale revisions return 409. Access is gated by private Sites hosting; do not make the site public without adding app-level editor authorization.

## Development

Requires Node 22.13 or newer. Run `npm install`, then `npm run db:local` once to initialize the local database. Run `npm run db:generate` after schema changes and apply new migrations separately. Run `npm run dev` for the preview and `npm run build` for production. Sites applies packaged migrations to the hosted database.

Game rules and answer matching are isolated in `lib/game-engine.ts` and `lib/trivia.ts`. Run `npm test` for scoring, lockout, endgame, matching, and validation checks.

Validation: automated game-rule checks, TypeScript checking, the production build, and local API save/read-back, invalid-input, and stale-revision checks passed. Browser interaction testing was not performed. The WebMCP registration surface is implemented but has not been verified in a supported WebMCP browser; JSON import/export and the database API remain the portable editing paths.
