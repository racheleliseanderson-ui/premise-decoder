import { Figure } from "@/components/figures/Figure";
import { ledgerModel, LEDGER_BLURB, LEDGER_LABELS, type LedgerBand } from "@/lib/figures/spa";
import { r, roundedRect, tone, toneMix, toneText } from "@/lib/figures/core";
import type { Signal } from "@/lib/engine";

/**
 * The establishment ledger.
 *
 * This desk's whole claim is that the useful question before booking is not
 * "is this good" but "how much of this has actually been established". It has
 * always answered that with a percentage, and a percentage is the least
 * decision-shaped number there is.
 *
 * Drawn as one weighted bar, the answer becomes a shape: how much of the
 * picture is named, how much is gestured at, how much you asked about and were
 * not told, and how much has simply never been addressed. Weight comes from the
 * engine, so a heavy signal takes more of the bar than a light one — which is
 * the point. A setting can answer six small questions and still be mostly
 * unnamed, and on a list that reads as six ticks.
 *
 * Colour is never load-bearing: each segment is also hatched, labelled and
 * ordered from settled to unsettled, left to right.
 */

const BAND_TONE: Record<LedgerBand, "ok" | "warn" | "risk" | "muted"> = {
  established: "ok",
  partial: "warn",
  refused: "risk",
  unnamed: "muted",
};

const BAND_HATCH: Record<LedgerBand, "solid" | "diagonal" | "cross" | "dots"> = {
  established: "solid",
  partial: "diagonal",
  refused: "cross",
  unnamed: "dots",
};

export function EstablishmentLedgerFigure({
  signals,
  className,
}: {
  signals: Signal[];
  className?: string;
}) {
  const model = ledgerModel(signals);

  if (model.empty) {
    return (
      <p className={`rounded-lg border border-rule bg-parchment px-4 py-5 text-sm leading-relaxed text-ink-soft ${className ?? ""}`}>
        <span className="text-ink">Nothing weighed yet.</span> Name a service and a setting and this
        becomes a picture of what has actually been established — which is a different question from
        whether the place is any good, and the only one that can be answered before you go.
      </p>
    );
  }

  const pct = Math.round(model.establishedShare * 100);

  return (
    <Figure
      eyebrow="Figure · what has actually been established"
      caption={`${pct}% of the weighted picture is named on the record. The rest is gestured at, refused, or has never been addressed — and the widest band is where your money is exposed.`}
      description="A single weighted bar dividing the setting's signals into established, partly named, asked-and-refused, and never named. Segment width is proportional to how consequential each signal is."
      width={model.width}
      height={model.height}
      className={className}
      reading={model.reading}
      source="Weighted by the engine's own signal weights, from what you have entered and what the copy said."
      legend={(["established", "partial", "refused", "unnamed"] as LedgerBand[])
        .filter((b) => model.segments.some((s) => s.band === b))
        .map((b) => ({
          label: LEDGER_LABELS[b],
          tone: BAND_TONE[b],
          hatch: BAND_HATCH[b],
          shape: "square" as const,
          note: LEDGER_BLURB[b],
        }))}
    >
      {({ id }) => (
        <g>
          <text x={16} y={24} fill={toneText("accent")} fontSize={10} letterSpacing={2} style={{ textTransform: "uppercase" }}>
            Settled
          </text>
          <text
            x={model.width - 16}
            y={24}
            textAnchor="end"
            fill={toneText("accent")}
            fontSize={10}
            letterSpacing={2}
            style={{ textTransform: "uppercase" }}
          >
            Unsettled
          </text>

          {model.segments.map((seg, i) => {
            const t = BAND_TONE[seg.band];
            const hatch = BAND_HATCH[seg.band];
            const first = i === 0;
            const last = i === model.segments.length - 1;
            return (
              <g key={seg.band} style={{ color: tone(t) }}>
                <path
                  d={roundedRect(seg.x, 46, seg.width, 42, {
                    tl: first ? 4 : 0,
                    bl: first ? 4 : 0,
                    tr: last ? 4 : 0,
                    br: last ? 4 : 0,
                  })}
                  fill={hatch === "solid" ? toneMix(t, 34) : `url(#${id}-hatch-${hatch})`}
                  stroke={tone(t)}
                  strokeWidth={1.2}
                />
                {seg.width > 46 ? (
                  <text
                    x={seg.x + seg.width / 2}
                    y={72}
                    textAnchor="middle"
                    fill={tone("ink")}
                    fontSize={13}
                    fontWeight={500}
                  >
                    {Math.round(seg.share * 100)}%
                  </text>
                ) : null}
                {seg.width > 84 ? (
                  <text
                    x={seg.x + seg.width / 2}
                    y={104}
                    textAnchor="middle"
                    fill={toneText("muted")}
                    fontSize={9.5}
                  >
                    {LEDGER_LABELS[seg.band]}
                  </text>
                ) : null}
              </g>
            );
          })}

          <path
            d={`M16 ${r(94)}H${r(model.width - 16)}`}
            stroke={tone("line")}
            strokeWidth={1}
            strokeDasharray="2 5"
          />

          {model.heaviestGap ? (
            <text x={16} y={model.height - 6} fill={tone("risk")} fontSize={10.5}>
              Heaviest thing still unnamed: {model.heaviestGap.label}
            </text>
          ) : null}
        </g>
      )}
    </Figure>
  );
}
