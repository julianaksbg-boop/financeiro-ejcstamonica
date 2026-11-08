# Project conventions

- Keep the Central overview and filters above a full-width transaction table rather than a duplicate summary sidebar, so the working area remains usable on narrower screens.
- Initialize financial records empty and migrate legacy local storage by known demo IDs only, preserving imported and manual records.
- Derive Dashboard financial totals from the transaction store through financialSummary, so imported records are the source of displayed balances.