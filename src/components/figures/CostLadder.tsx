import { Figure, AxisLabel } from "./Figure";
import { costLadderModel } from "@/lib/figures/spa";
import { tone, toneMix, toneText, fitText, hatchFill } from "@/lib/figures/core";
import { useFigureWidth } from "@/lib/figures/use-figure-width";
import type { CostProjection } from "@/lib/cost";

/**
 * The cost ladder.
 *
 * Bars for what has been named, and an open end for what has not. The open end
 * is the point of the figure: a horizon nobody has described does not get a
 * faded dashed extrapolation, because a faded dashed extrapolation still reads
 * as a forecast. It gets a rule that stops, and a question mark.
 */
export function CostLadderFigure({ cost }: { cost: CostProjection }) {
  const { ref, width } = useFigureWidth(620, 300);
  const m = costLadderModel(cost, width);

  if (m.empty) return null;

  const labelSize = width < 420 ? 10 : 11;
  const valueSize = width < 420 ? 12 : 13;

  return (
    <Figure
      containerRef={ref}
      eyebrow="What has actually been named"
      caption={cost.line}
      width={m.width}
      height={m.height}
      reading={m.reading}
      source="Read from the quote and the series terms you entered. Nothing is estimated; a horizon nobody described is drawn as an open end."
      legend={[
        { label: "Named", tone: "ink", shape: "square", note: "The copy says it" },
        { label: "Worked out", tone: "accent", shape: "square", note: "Arithmetic on named things" },
        { label: "Not knowable yet", tone: "risk", shape: "line", note: "A sentence is missing" },
      ]}
    >
      {({ id }) => (
        <>
          <AxisLabel x={16} y={20} anchor="start" size={10} toneName="muted" uppercase>
            The horizon, as far as the copy reaches
          </AxisLabel>

          {m.rungs.map((r) => {
            const t = r.state === "named" ? "ink" : r.state === "derived" ? "accent" : "risk";
            const cy = r.y + 13;
            return (
              <g key={r.label}>
                <text
                  x={16}
                  y={cy + 4}
                  fontSize={labelSize}
                  fill={toneText("muted")}
                  letterSpacing={0.8}
                >
                  {fitText(r.label, r.x - 24, labelSize)}
                </text>

                {r.amount === null ? (
                  <>
                    {/* An open end: a short rule that stops, then nothing. */}
                    <line
                      x1={r.x}
                      y1={cy}
                      x2={r.x + 26}
                      y2={cy}
                      stroke={tone("risk")}
                      strokeWidth={2}
                    />
                    <line
                      x1={r.x + 26}
                      y1={cy - 7}
                      x2={r.x + 26}
                      y2={cy + 7}
                      stroke={tone("risk")}
                      strokeWidth={2}
                    />
                    <text
                      x={r.x + 36}
                      y={cy + 4}
                      fontSize={valueSize}
                      fill={toneText("accent")}
                      fontStyle="italic"
                    >
                      not knowable yet
                    </text>
                  </>
                ) : (
                  <>
                    <rect
                      x={r.x}
                      y={r.y}
                      width={r.width}
                      height={26}
                      fill={
                        r.state === "derived"
                          ? hatchFill(id, "diagonal", "accent", 16)
                          : toneMix("ink", 82)
                      }
                      color={tone("accent")}
                      stroke={tone(t)}
                      strokeWidth={1}
                    />
                    <text
                      x={r.x + r.width + 8}
                      y={cy + 4}
                      fontSize={valueSize}
                      fill={toneText("muted")}
                      className="num"
                    >
                      {m.currency}
                      {Math.round(r.amount).toLocaleString("en-US")}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </>
      )}
    </Figure>
  );
}
