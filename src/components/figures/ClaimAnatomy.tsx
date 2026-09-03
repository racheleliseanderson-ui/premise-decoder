import { Figure } from "@/components/figures/Figure";
import { anatomyLines, claimAnatomyModel } from "@/lib/figures/spa";
import { fitText, polyline, r, roundedRect, tone, toneMix, toneText } from "@/lib/figures/core";
import type { DecodedClaim } from "@/lib/engine";

/**
 * Claim anatomy — the sentence, with the marketing marked in place.
 *
 * The Claim Decoder's finding is currently delivered as a list underneath the
 * box: here are four phrases, here is what each hides. The list is correct and
 * it separates the phrase from the sentence it was doing its work inside, which
 * is precisely where the effect lives. "Medical-grade results in a luxury
 * setting, performed by our expert team" reads as one confident assertion; seen
 * with three spans highlighted and one leader line each, it reads as a sentence
 * that named nobody, nothing and no standard.
 *
 * The type is monospaced so a highlight can be placed over a character range
 * without measuring text in a browser — this is the only reason the figure can
 * exist at all inside an SVG.
 *
 * The share bar at the top is the blunt version of the same finding: how much of
 * this line was language the decoder recognises as doing work other than
 * naming something.
 */

const SEVERITY_TONE: Record<DecodedClaim["severity"], "warn" | "risk" | "muted"> = {
  note: "muted",
  flag: "warn",
  hard: "risk",
};

const SEVERITY_WORD: Record<DecodedClaim["severity"], string> = {
  note: "worth noticing",
  flag: "doing work",
  hard: "says nothing checkable",
};

export function ClaimAnatomyFigure({
  text,
  claims,
  className,
}: {
  text: string;
  claims: DecodedClaim[];
  className?: string;
}) {
  const model = claimAnatomyModel(text, claims);
  const lines = anatomyLines(text);

  if (model.empty) return null;

  const marked = Math.round(model.markedShare * 100);

  return (
    <Figure
      eyebrow="Figure · the anatomy of the line"
      caption={
        model.markers.length
          ? `${model.markers.length} phrase${model.markers.length === 1 ? "" : "s"} in this sentence are doing work other than naming something — about ${marked}% of the line. Read what is left.`
          : "Nothing in this line matched a decoder rule. That is a fact about the desk's rules, not a clean bill of health for the sentence."
      }
      description="The pasted marketing sentence with the decoded phrases highlighted in place, each connected to what it leaves unnamed."
      width={model.width}
      height={model.height}
      className={className}
      reading={model.reading}
      source="Phrases matched against the desk's claim dictionary. Anything it has no rule for is left unmarked."
      legend={
        model.markers.length
          ? [...new Set(model.markers.map((m) => m.severity))].map((sev) => ({
              label: SEVERITY_WORD[sev],
              tone: SEVERITY_TONE[sev],
              hatch: sev === "hard" ? ("cross" as const) : ("diagonal" as const),
              shape: "square" as const,
            }))
          : undefined
      }
    >
      {({ id }) => (
        <g>
          <text x={16} y={22} fill={toneText("accent")} fontSize={10} letterSpacing={2} style={{ textTransform: "uppercase" }}>
            The line, as printed
          </text>

          {/* the marked share, as a thin rule under the eyebrow */}
          <g>
            <path
              d={roundedRect(model.width - 116, 14, 100, 6, 3)}
              fill={toneMix("muted", 20)}
            />
            <path
              d={roundedRect(model.width - 116, 14, 100 * model.markedShare, 6, 3)}
              fill={tone("risk")}
            />
            <text x={model.width - 122} y={20} textAnchor="end" fill={toneText("muted")} fontSize={9}>
              {marked}% marked
            </text>
          </g>

          {/* highlights sit under the text so the type stays legible */}
          {model.spans.map((span, i) => {
            const sev = span.claim?.severity ?? "note";
            const t = SEVERITY_TONE[sev];
            return (
              <g key={`${i}-${span.start}`} style={{ color: tone(t) }}>
                <rect
                  x={span.x - 1}
                  y={span.y - 12}
                  width={span.width + 2}
                  height={18}
                  fill={sev === "hard" ? `url(#${id}-hatch-cross)` : toneMix(t, 20)}
                  rx={2}
                />
                <path
                  d={`M${r(span.x - 1)} ${r(span.y + 6)}h${r(span.width + 2)}`}
                  stroke={tone(t)}
                  strokeWidth={sev === "hard" ? 2 : 1.4}
                />
              </g>
            );
          })}

          {lines.map((line, i) => (
            <text
              key={`${i}-${line.y}`}
              x={16}
              y={line.y}
              fill={tone("ink")}
              fontSize={13}
              style={{ fontFamily: "var(--font-mono)" }}
              xmlSpace="preserve"
            >
              {line.text}
            </text>
          ))}

          {model.markers.map((m, i) => {
            const t = SEVERITY_TONE[m.severity];
            const span = model.spans[m.spanIndex];
            return (
              <g key={`${i}-${m.category}`}>
                <path
                  d={polyline([
                    m.from,
                    { x: m.from.x, y: m.labelY - 16 },
                    { x: m.to.x + 8, y: m.labelY - 16 },
                    { x: m.to.x + 8, y: m.labelY - 9 },
                  ])}
                  fill="none"
                  stroke={toneMix(t, 55)}
                  strokeWidth={1}
                  strokeDasharray="2 3"
                />
                <circle cx={m.to.x + 8} cy={m.labelY - 6} r={2.6} fill={tone(t)} />
                <text x={m.to.x + 18} y={m.labelY - 2} fill={tone("ink")} fontSize={11}>
                  {fitText(`“${span?.text ?? ""}” — ${m.category}`, model.width - 60, 11)}
                </text>
                <text x={m.to.x + 18} y={m.labelY + 11} fill={toneText("muted")} fontSize={9.5}>
                  {fitText(m.hides, model.width - 60, 9.5)}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </Figure>
  );
}
