# Contributing to GlobalTCView

Thank you for helping. Bug reports, data corrections, translations and code are all welcome.

- **Report a problem**: open a GitHub issue with what you saw, the page or storm, and your browser.
- **Translations**: copy the `hi` block in `site/i18n.js`, translate every value, and add the language to `LANGS`.
  Warning and safety text must be checked by a native speaker before it is published.
- **Code**: fork, make a branch, and open a pull request. Run the tests first:
  ```bash
  pip install numpy scipy pandas requests pytest
  pytest -q
  ```
  To try the website locally: `python -m http.server -d site 8000` (the live data appear after a run of
  `scripts/run_daily.py`, which needs internet access to NOAA and other public servers).
- **Science**: changes to the impact, surge, rainfall or rapid-intensification methods should explain the
  reasoning and cite the source, and update the method text in `site/index.html`.

Please be respectful and constructive in all project spaces.
