import { Figure } from "@/components/figures/Figure";
import { useFigureWidth } from "@/lib/figures/use-figure-width";
import { OVERSIGHT_LABELS, settingMapModel, type SettingMapModel } from "@/lib/figures/spa";
import { r, roundedRect, tone, toneMix, toneText } from "@/lib/figures/core";
import type { EvalInput } from "@/lib/engine";

/**
 * The setting map.
 *
 * The sentence this whole desk turns on is that a service and a setting are two
 * separate facts, and that what matters is the DISTANCE between what the
 * service needs and what the setting's own label implies. That has always been
 * argued in prose, and prose is the wrong instrument for a distance.
 *
 * One axis, four stops, least accountable to most. The setting is a point on
 * it. The service is a range, because peels and energy devices honestly span
 * more than one stop and what decides is a depth that never appears on a menu.
 * Where the service starts above the setting, the space between them is drawn
 * as a gap — not shaded red, not scored, just left visibly open, because it is
 * a question rather than a fault.
 *
 * Colour is never load-bearing here: the setting is a filled marker with a
 * label, the service is a bracketed span with its own, and the reading says all
 * of it in words.
 */
export function SettingMapFigure({ input, className }: { input: EvalInput; className?: string }) {
  const { ref, width } = useFigureWidth(640);
  const model = settingMapModel(input, width);

  return (
    <Figure
      eyebrow="Setting map"
      caption={model.headline}
      description="An axis of what a setting's own label implies about medical accountability, with the named setting placed on it as a point and the named service as a range."
      width={model.width}
      height={model.height}
      containerRef={ref}
      reading={model.reading}
      source="From the service class and setting you named. It maps what the LABELS imply — never what any specific facility actually has."
      legend={[
        { label: "What this setting's label implies", tone: "ink", shape: "round" },
        { label: "What this service requires", tone: "accent", shape: "line" },
        ...(model.gap
          ? [
              {
                label: "The distance a name has to close",
                tone: "muted" as const,
                shape: "line" as const,
              },
            ]
          : []),
      ]}
      className={className}
    >
      {() => <Marks model={model} />}
    </Figure>
  );
}

const AXIS_Y = 96;

function Marks({ model }: { model: SettingMapModel }) {
  const { stops, venue, need, gap } = model;
  const first = stops[0];
  const last = stops[stops.length - 1];
  if (!first || !last) return null;

  return (
    <g>
      {/* The axis, and its stops. */}
      <line
        x1={first.x}
        y1={AXIS_Y}
        x2={last.x}
        y2={AXIS_Y}
        stroke={tone("line")}
        strokeWidth={1}
      />
      {stops.map((s) => (
        <g key={s.id}>
          <line
            x1={s.x}
            y1={AXIS_Y - 5}
            x2={s.x}
            y2={AXIS_Y + 5}
            stroke={tone("line")}
            strokeWidth={1}
          />
          <text x={s.x} y={AXIS_Y + 24} textAnchor="middle" fill={toneText("muted")} fontSize={9.5}>
            {OVERSIGHT_LABELS[s.id]}
          </text>
        </g>
      ))}

      {/* The gap, drawn as an open span rather than a red one. */}
      {gap ? (
        <g>
          <line
            x1={gap.x1}
            y1={AXIS_Y}
            x2={gap.x2}
            y2={AXIS_Y}
            stroke={tone("muted")}
            strokeWidth={6}
            strokeDasharray="2 5"
            strokeLinecap="round"
          />
          <text
            x={r((gap.x1 + gap.x2) / 2)}
            y={AXIS_Y + 44}
            textAnchor="middle"
            fill={toneText("muted")}
            fontSize={9.5}
          >
            {gap.stops === 1 ? "one stop unnamed" : `${gap.stops} stops unnamed`}
          </text>
        </g>
      ) : null}

      {/* What the service requires: a bracketed range above the axis. */}
      {need ? (
        <g>
          <line
            x1={need.x1}
            y1={AXIS_Y - 30}
            x2={need.x2}
            y2={AXIS_Y - 30}
            stroke={tone("accent")}
            strokeWidth={3}
            strokeLinecap="round"
          />
          {[need.x1, need.x2].map((x, i) => (
            <line
              key={i}
              x1={x}
              y1={AXIS_Y - 37}
              x2={x}
              y2={AXIS_Y - 23}
              stroke={tone("accent")}
              strokeWidth={3}
              strokeLinecap="round"
            />
          ))}
          <text
            x={r((need.x1 + need.x2) / 2)}
            y={AXIS_Y - 46}
            textAnchor="middle"
            fill={toneText("accent")}
            fontSize={10.5}
          >
            {need.label}
          </text>
        </g>
      ) : null}

      {/* The setting: one filled point on the axis. */}
      {venue ? (
        <g>
          <circle cx={venue.x} cy={AXIS_Y} r={7} fill={tone("ink")} />
          <circle cx={venue.x} cy={AXIS_Y} r={11} fill="none" stroke={toneMix("ink", 30)} />
          <g>
            <path d={roundedRect(venue.x - 46, AXIS_Y + 52, 92, 20, 2)} fill={toneMix("ink", 8)} />
            <text
              x={venue.x}
              y={AXIS_Y + 66}
              textAnchor="middle"
              fill={toneText("ink")}
              fontSize={10.5}
            >
              {venue.label}
            </text>
          </g>
        </g>
      ) : null}
    </g>
  );
}
