# Biology, recalled.

A complete offline IGCSE biology study app, based on the 21 unit summaries in your Notion notes. No framework, package installation, API key, account or backend is needed.

## Run it

Open `index.html` in a modern browser. Keep the files together in this folder. The separate `biology-flashcards.html` edition embeds everything in one file and can also be opened directly.

For a local web server, run this command inside the source folder and open `http://localhost:8000`:

```bash
python3 -m http.server 8000
```

## Study and progress

- Open a unit, then click the card or **Reveal answer**.
- A full CSS `rotateY(360deg)` turn reveals the answer. With reduced motion enabled in your operating system, the content switches immediately.
- Choose **Review again** or **Got it** to record confidence and advance. Viewing an answer alone does not mark it known.
- The dashboard shows known-card totals and completed units. Check **Complete** on a unit when you decide it is complete. Unit completion and card confidence are independent.
- **Review unknown** creates a deck of cards not yet marked known. **Shuffle** changes deck order without changing progress.
- **Browse cards** jumps to any question. **Continue studying** resumes the saved card in the last unit.
- Space turns a focused card; left/right arrow keys move; 1 selects Review again, 2 selects Got it, and Escape returns to the dashboard. Native controls retain their normal keyboard behaviour.
- Light/dark buttons save your explicit choice. The initial theme follows the system preference.

Progress is stored in this browser's local storage, associated with the file or web address. Moving to a different file path, port, browser or device may create a separate progress record. Use **Download progress** and **Restore progress** to transfer it. Restoring a valid backup replaces the current progress. Invalid backups leave it intact. Browser restrictions can prevent storage; the app reports a saving failure and still allows a progress download.

## Edit the source

| File | Purpose |
| --- | --- |
| `index.html` | Semantic markup and app views |
| `styles.css` | Responsive layouts, themes and 360° animation |
| `app.js` | Navigation, study controls, progress and backup validation |
| `cards.js` | All editable question/answer pairs, grouped by unit number |
| `metadata.js` | Unit titles and original Notion source links |
| `source-manifest.json` | Source-page links and source edit timestamps |
| `assets/Manrope-Variable.ttf` | Bundled variable font for offline use |
| `assets/OFL-Manrope.txt` | Font's SIL Open Font License |
| `build.py` | Optional single-file HTML builder |

Run `python3 build.py` after source edits to rebuild the standalone HTML in the parent folder. Python is only required for this optional build, not for opening the app.

Card IDs use unit number and position, such as `u8-c2`. Edit wording freely, but keep existing card order when you want to preserve saved card identities. If you reorder or remove cards, export progress first and review its mapping before restoring it.

## Content and sources

Each unit links to the Notion summary used for its cards. All 21 summaries were read; duplicated copies in IGCSE and IGCSE (compartido) were represented once per unit. The source manifest records the precise selected pages. The original Notion notes were not modified. This is a revision snapshot and does not automatically synchronise future edits or write completion back to Notion.

Most units contain 5–10 cards. Coordination and response, reproduction, inheritance, and organisms and their environment contain 15 each because their summaries cover many distinct topics. The cards prioritise definitions, mechanisms, comparisons, practical principles and common exam errors. They are concise revision prompts, not a replacement for the full summaries or practice papers. The source summaries for Units 11 and 19 themselves include material supplemented beyond the original course notes; the flashcards follow those summaries.

The app makes no network requests. The **Source notes** link opens Notion only when clicked and may require your Notion account. No analytics or tracking is included.

## Typography

Manrope by Mikhail Sharanda is bundled under the SIL Open Font License in `assets/OFL-Manrope.txt`. Its source is the Google Fonts Manrope directory: https://github.com/google/fonts/tree/main/ofl/manrope
