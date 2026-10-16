# Biology, recalled.

A complete offline IGCSE biology study app, based on the 21 unit summaries in your Notion notes. No framework, package installation, API key, account or backend is needed.

The **Graphs** page adds 24 important graph examples across 13 units, with no more than three in any unit. Each graph has a reading guide, an exam reminder and links to the web references checked for its presentation.

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
- Choose **Graphs** in the navigation, use the unit selector, or open a unit's graph link from the dashboard or study view. Select **All graph units** to see the full collection. Turn **Show reading guides** off to practise interpreting the figures yourself.

Progress is stored in this browser's local storage, associated with the file or web address. Moving to a different file path, port, browser or device may create a separate progress record. Use **Download progress** and **Restore progress** to transfer it. Restoring a valid backup replaces the current progress. Invalid backups leave it intact. Browser restrictions can prevent storage; the app reports a saving failure and still allows a progress download.

## Edit the source

| File | Purpose |
| --- | --- |
| `index.html` | Semantic markup and app views |
| `styles.css` | Responsive layouts, themes and 360° animation |
| `app.js` | Navigation, study controls, progress and backup validation |
| `cards.js` | All editable question/answer pairs, grouped by unit number |
| `graphs-data.js` | All 24 schematic graphs, model curves, reading guides and references |
| `graphs.js` | Accessible, responsive native-SVG graph renderer and graph navigation |
| `GRAPH-SOURCES.md` | Graph-by-graph reference list and modelling conventions |
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

## Graph conventions

The graphs are original educational schematics, redrawn from the conventions in the cited sources. Their numbers and model parameters are illustrative, not published experimental results. Refer to the source links under each figure for the reference presentation. No publisher's graph image is bundled or traced.

The collection covers Units 3, 5, 6, 8, 9, 10, 11, 12, 14, 16, 18, 19 and 20. Units were selected for their quantitative relationships and graph-reading value; extra figures were not added just to fill the three-graph allowance. This is a focused revision selection, not an exhaustive catalogue of every possible exam graph.

Axes include units or explicitly identify arbitrary units. The microbial culture graph uses a logarithmic viable-cell axis; its exponential phase is therefore drawn straight. Histogram intervals have equal widths and bars touch, while ABO category bars have gaps. Hormone panels share the same 28-day teaching timeline but use relative levels, not comparable absolute concentrations. Menstrual timing and optima are examples, not universal biological constants. The energy pyramid is qualitative; its widths are not a numerical scale. Transpiration sketches assume suitable water supply and the controlled conditions stated under each figure.

The breathing figure adopts the lung-volume convention, so upward movement represents increasing lung volume. A physical spirometer's chamber trace can use the opposite direction. Its source is used only to illustrate rate and depth, without adding the source course's advanced lung-volume requirements to the flashcards.

References open on the web when clicked, but the graphs and reading guides themselves remain available offline. Existing progress files remain compatible because the flashcard IDs and storage format are unchanged.

## Typography

Manrope by Mikhail Sharanda is bundled under the SIL Open Font License in `assets/OFL-Manrope.txt`. Its source is the Google Fonts Manrope directory: https://github.com/google/fonts/tree/main/ofl/manrope
