# Tanda Builder — Web Interface Design Spec

## Overview

A new page in the tango-toolkit Astro site at `/dj/tanda-builder/` that provides a web version of TigerTanda's tanda-building workflow. Users search a tango discography database, select a song, and find companion tracks for their tandas (sets of 3–4 songs).

## Data Source

- `metadata.csv` from the tigertanda-vdj repo, copied into `public/data/metadata.csv`
- Loaded client-side via Papa Parse (CDN) — no server-side processing
- ~15,000+ records, 18 columns: Bandleader, Orchestra, Date, Title, AltTitle, Genre, Singer, Label, Master, Composer, Lyricist, Arranger, Grouping, Pianist, Bassist, Bandoneons, Strings, Lineup
- Year extracted from Date field (M/D/YYYY or YYYY-M-D formats)

## Page Layout

Three stacked sections, no page hero/title bar — goes straight to content after the site header.

### Section 1: Find a Song

**Controls row:**
- Artist dropdown (populated from unique Bandleader values, sorted alphabetically)
- Singer dropdown (populated dynamically — filtered by selected artist if one is set)
- Genre dropdown (populated dynamically — filtered by current subset)
- Search bar (free-text, searches across Title, Composer, Lyricist within the filtered subset)
- Reset All button (clears all dropdowns and search)

**Behavior:**
- Dropdowns progressively narrow the dataset — selecting an artist filters singer/genre options to only those in that artist's recordings
- Search bar searches within the already-filtered subset
- All filtering is client-side, immediate (no debounce needed for dropdowns, 300ms debounce for search)
- Stats line shows count and date range of filtered results

**Results table:**
- Columns: Title, Artist, Singer, Genre, Date
- Sortable by clicking column headers (arrow indicators)
- Default sort: Title ascending
- Fixed height showing 5 rows, scrollable if more results exist
- Clickable rows — selecting a song triggers tanda matching in Section 2
- Selected row highlighted with orange left border + warm background

### Section 2: Tanda Matches

Appears/populates when a song is selected in Section 1. Orange top border to visually distinguish.

**Header row (single line):**
- "Tanda Matches" title
- Vertical separator
- Checkbox filters inline: Artist (on), Singer (on), Genre (on), Year (on) + ± dropdown, Grouping (off), Orchestra (off), Label (off)
- Stats showing match count

**Filter logic (same as VDJ plugin):**
- Each checked filter requires the match to have the same value as the selected song
- Year filter: match must be within ± N years of the selected song (N = 2, 3, 5, 8, or 10)
- The selected song itself is excluded from results
- Changing filters immediately re-runs the search

**Results table:**
- Same columns as Section 1: Title, Artist, Singer, Genre, Date
- Default sort: Date ascending
- Fixed height showing 5 rows, scrollable if more results exist
- Clickable rows — selecting a match populates Section 3
- Selected row highlighted

### Section 3: Track Details

Appears when both a source song (Section 1) and a match (Section 2) are selected. Orange left border.

**Layout:**
- Single table with the header row doing double duty:
  - First column: "Track Details" label
  - Second column: source song title (blue, larger serif font)
  - Third column: match song title (orange, larger serif font)

**Differences first:**
- Fields that differ between the two songs shown as rows in the table
- Source values in blue, match values in orange
- Typically: Date, Composer, Lyricist, Arranger (but computed dynamically by comparing all detail fields)

**Shared values below:**
- "Shared" divider line
- Clean 4-column inline grid showing field:value pairs
- Bandoneons and Strings span 2 columns (can be long lists of musicians)
- Fields shown: Artist, Singer, Genre, Label, Grouping, Orchestra, Pianist, Bassist, Bandoneons, Strings

## Styling

Inherits tango-toolkit design system:
- Fonts: DM Serif Display (headings, song titles), Outfit (body, controls)
- Colors: orange-500 (#f97316) accent, slate neutrals, warm off-white background (#f8fafc)
- Cards: white background, 1px slate-200 border, 0.5rem border-radius
- Tables: gold header text (#9a6b1b), gold bottom border (#f1c232), warm header background (#fefcf8)
- Inputs: slate-50 background, orange focus outline
- Hover states: warm orange tint (#fff7ed)
- Diff colors: blue (#1d4ed8) for source, orange/red (#c2410c) for match

## Tech Stack

- Astro page component (`.astro` file) with inline `<script>` and `<style>` tags
- Papa Parse loaded from CDN for CSV parsing
- All logic client-side in vanilla JavaScript
- No framework dependencies beyond Astro's static page generation
- Shares BaseLayout from tango-toolkit (header, footer, meta)

## String Matching

No fuzzy matching needed in the web version. The search bar does case-insensitive, accent-insensitive substring matching (using a `stripAccents()` utility). Dropdown selections are exact equality matches (case-insensitive).

## Responsive Behavior

- On smaller screens, controls row wraps
- Genre column hides below ~600px
- Detail grid switches from 4 columns to 2 columns on small screens
- Tables scroll horizontally if needed

## File Structure

```
tango-toolkit/
├── public/
│   └── data/
│       └── metadata.csv          # Copied from tigertanda-vdj
└── src/
    └── pages/
        └── dj/
            └── tanda-builder/
                └── index.astro   # Full page component
```

## Navigation

Add "Tanda Builder" link to site navigation alongside existing items.

## Empty / Initial States

- **Page load:** All dropdowns show "All ...", results table shows all records (first 5), Section 2 and 3 are hidden
- **No search results:** "No recordings match your filters" message in table area
- **Song selected, no matches:** "No matches found with current filters" in Section 2
- **Only source selected (no match clicked):** Section 3 shows single-song detail view (no comparison columns)
