import { Figure } from "@/components/figures/Figure";
import { useFigureWidth } from "@/lib/figures/use-figure-width";
import { promisePlaceModel } from "@/lib/figures/spa";
import { r, roundedRect, tone, toneMix, toneText } from "@/lib/figures/core";
import type { Assessment } from "@/lib/engine";

/**
 * Promise against place, drawn as two bars and the distance between them.
 *
 * The panel that carries this comparison already prints both numbers and a
 * meter each. Two meters stacked are two facts; one pair of bars with the gap
 * hatched between them is an argument, and the argument is the whole point of
 * this desk: marketing pressure and disclosure are independent, and the
 * distance between them is the thing worth looking at before money moves.
 *
 * The gap is only drawn when the promise is actually ahead. Where the place has
 * answered as much as the copy claimed, there is nothing to hatch — and drawing
 * a nought-width band there would leave a mark on a chart that ought to be
 * clean. A quiet figure is the correct rendering of a settled question.
 */
export function PromisePlaceFigure({ a, className }: { a: Assessment; className?: string }) {
  const { ref, width } = useFigureWidth(640);
  const model = promisePlaceModel(a, width);

  return (
    <Figure
      eyebrow="Figure · promise against place"
      caption={
        model.gapBand
          ? "The top bar is how hard the copy is working. The bottom bar is how much of the setting has actually been named. The hatched distance between them is the part you are being asked to take on trust."
          : "The copy is not claiming more than the setting has named. That is the only honest kind of parity, and it is rarer than it should be."
      }
      description="Two horizontal bars comparing marketing pressure against how much of the setting has been disclosed, with the difference marked."
      width={model.width}
      height={model.height}
      className={className}
      containerRef={ref}
      reading={model.reading}
      source="Both figures come from the engine's own weighted signals and claim dictionary."
      legend={[
        { label: "Promise — how hard the copy works", tone: "risk", shape: "square" },
        { label: "Place — what has been named", tone: "ok", shape: "square" },
        ...(model.gapBand
          ? [{ label: "Taken on trust", tone: "warn" as const, hatch: "diagonal" as const, shape: "square" as const }]
          : []),
      ]}
    >
      {({ id }) => (
        <g>
          <text x={18} y={24} fill={toneText("accent")} fontSize={10} letterSpacing={2} style={{ textTransform: "uppercase" }}>
            0
          </text>
          <text
            x={model.width - 18}
            y={24}
            textAnchor="end"
            fill={toneText("accent")}
            fontSize={10}
            letterSpacing={2}
            style={{ textTransform: "uppercase" }}
          >
            100
          </text>

          {model.gapBand ? (
            <g style={{ color: tone("warn") }}>
              <rect
                x={model.gapBand.x}
                y={model.gapBand.y}
                width={model.gapBand.w}
                height={model.gapBand.h}
                fill={`url(#${id}-hatch-diagonal)`}
              />
              <path
                d={`M${r(model.gapBand.x)} ${r(model.gapBand.y - 4)}V${r(model.gapBand.y + model.gapBand.h + 4)}`}
                stroke={tone("warn")}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            </g>
          ) : null}

          <g style={{ color: tone("risk") }}>
            <path
              d={roundedRect(model.promise.x, model.promise.y, Math.max(2, model.promise.w), model.promise.h, 3)}
              fill={toneMix("risk", 30)}
              stroke={tone("risk")}
              strokeWidth={1.2}
            />
            <text x={model.promise.x + 10} y={model.promise.y + model.promise.h / 2 + 4} fill={tone("ink")} fontSize={11}>
              Promise {model.promise.value}
            </text>
          </g>

          <g style={{ color: tone("ok") }}>
            <path
              d={roundedRect(model.place.x, model.place.y, Math.max(2, model.place.w), model.place.h, 3)}
              fill={toneMix("ok", 30)}
              stroke={tone("ok")}
              strokeWidth={1.2}
            />
            <text x={model.place.x + 10} y={model.place.y + model.place.h / 2 + 4} fill={tone("ink")} fontSize={11}>
              Place {model.place.value}
            </text>
          </g>

          <path
            d={`M18 ${r(model.height - 10 - model.footnote.length * 12)}H${r(model.width - 18)}`}
            stroke={tone("line")}
          />
          {model.footnote.map((line, i) => (
            <text
              key={`foot-${i}`}
              x={18}
              y={model.height - 4 - (model.footnote.length - 1 - i) * 12}
              fill={toneText("muted")}
              fontSize={9.5}
            >
              {line}
            </text>
          ))}
        </g>
      )}
    </Figure>
  );
}
