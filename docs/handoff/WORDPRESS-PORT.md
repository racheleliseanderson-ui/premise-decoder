# WordPress port map (internal)

Not reader-facing. Companion to `PORT-MAP.md`. Describes the shape each portable
surface takes in the publication runtime. Nothing here authorizes publication.

## Constraints that apply to every surface

- No server state, no database table, no options row per reader.
- No persistence beyond the reader's own browser.
- No accounts, no analytics, no telemetry, no network calls at runtime.
- No named facility, practitioner, price, or claim about a real business.
- Every surface must degrade to readable static content with scripting off:
  the educational text renders, the interactive scoring simply does not.
- The instrument is educational. No diagnosis, no candidacy judgement, no
  ranking of venues against each other.

## Surface-by-surface

### 1. Setting Decision Packet — `[spa_packet]`

Container: a single block-level element the script mounts into, plus a `<noscript>`
paragraph explaining the packet is assembled from the reader's own entries.

State it needs: the desk session (blocks, inputs, evidence) from browser storage.
If no session exists it renders the empty-desk posture, not a sample packet.

Must not require: server state, a logged-in user, or a stored copy of the packet.
The printable artifact is produced in the browser; nothing is uploaded.

Print: the theme's stylesheet must not override the packet's `@media print` and
`@page` rules. Verify page breaks between venue blocks in the theme, not in
isolation.

### 2. Comparison matrix — `[spa_compare]`

Container: one wrapper; the surface itself switches between table and stacked
cards at the desk's own breakpoint, independent of the theme's grid.

State it needs: all blocks in the session. With fewer than two blocks it explains
that comparison needs a second venue rather than rendering a one-column table.

Must not: order venues as better and worse. Columns are disclosure readings.

### 3. Promise vs place panel — `[spa_promise_vs_place]`

Container: full-bleed capable. The composition is load-bearing; a theme content
column that clamps its width changes the reading.

State it needs: the active block only.

Must not: present the gap as a verdict, or hide a negative gap.

### 4. Claim ledger — `[spa_claim_decoder]`

Container: inline, content-width. Pure function of the marketing text the reader
pastes; holds no state of its own beyond that text.

Must not: score the service. It decodes language and asks a better question.

### 5. Intake extractor — `[spa_venue_text]`

Container: inline, content-width, with a text area.

Behavior contract: proposals only. Every proposal carries the source sentence and
must be accepted explicitly. Auto-fill is forbidden — it would create a field the
reader never asserted.

Pasted text stays in the browser. It is never posted to the site.

### 6. Reference library — `[spa_library]`

Container: inline. This is the one surface that is genuinely static content and
can also live as ordinary post content if the shortcode is unwanted.

State it needs: none, beyond which class is open.

## Shared script and style

One enqueued bundle for all six shortcodes, and one stylesheet carrying the token
layer verbatim (`PORT-MAP.md`, styles.css row). Enqueue only on pages that use a
shortcode. The token layer must not be merged into the theme's global stylesheet:
the desk palette is scoped to the desk.

Fonts load through the same `<link>` the theme already uses for the publication's
type; do not add a second copy.

## Storage key

Rename on port (`spa-intel-desk-v4` / `spa-intel-sets-v4`, schema 4) so a session
created on the current host cannot silently restore into the publication runtime.
A version bump with no reader-visible loss is the safe move.

## Share metadata

Titles, descriptions, and the share image are already the publication's own
values (`src/lib/seo.ts` and the `__root.tsx` override, both REWRITE). In
WordPress the SEO plugin owns emission; take the values, not the mechanism, and
confirm exactly one `og:image` and one `twitter:image` are emitted.

## Not performed and not authorized

No plugin was written, installed, activated, or staged. No credential, domain,
payment, or deployment change is authorized from here. Only a reviewed canonical
artifact may reach staging.
