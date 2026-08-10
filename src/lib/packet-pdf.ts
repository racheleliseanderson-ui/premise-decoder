/**
 * Setting Decision Packet — real PDF export (client only).
 * Prints only what the assessment can support: knowns, fail-closed items,
 * residual unknowns, burden drivers, and next verification steps.
 */

import type { Assessment } from "./engine";
import { SERVICE_LABELS, VENUE_LABELS } from "./engine";

const INK = "#3b2f28";
const SOFT = "#6b5c53";
const OXBLOOD = "#7a2230";

export async function downloadPacketPdf(a: Assessment) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });

  const M = 54;
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const RIGHT = W - M;
  let y = M;

  const page = () => {
    doc.addPage();
    y = M;
  };
  const room = (n: number) => {
    if (y + n > H - M - 26) page();
  };

  const rule = (color = "#d9cfc4") => {
    doc.setDrawColor(color);
    doc.setLineWidth(0.7);
    doc.line(M, y, RIGHT, y);
    y += 14;
  };

  const text = (
    s: string,
    opts: { size?: number; color?: string; style?: "normal" | "bold" | "italic"; font?: string; gap?: number; indent?: number } = {},
  ) => {
    const size = opts.size ?? 10;
    doc.setFont(opts.font ?? "helvetica", opts.style ?? "normal");
    doc.setFontSize(size);
    doc.setTextColor(opts.color ?? INK);
    const indent = opts.indent ?? 0;
    const lines = doc.splitTextToSize(s, RIGHT - M - indent) as string[];
    for (const line of lines) {
      room(size + 4);
      doc.text(line, M + indent, y);
      y += size + 3.2;
    }
    y += opts.gap ?? 0;
  };

  const eyebrow = (s: string) => {
    room(20);
    doc.setFont("courier", "bold");
    doc.setFontSize(8);
    doc.setTextColor(OXBLOOD);
    doc.text(s.toUpperCase(), M, y);
    y += 13;
  };

  const heading = (s: string) => {
    room(34);
    y += 8;
    doc.setFont("times", "bold");
    doc.setFontSize(15);
    doc.setTextColor(INK);
    doc.text(s, M, y);
    y += 10;
    rule();
  };

  const bullet = (s: string, marker = "·") => {
    room(16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(SOFT);
    doc.text(marker, M, y);
    const lines = doc.splitTextToSize(s, RIGHT - M - 14) as string[];
    lines.forEach((line, i) => {
      if (i > 0) room(13);
      doc.text(line, M + 14, y);
      y += 12.6;
    });
    y += 2;
  };

  /* ---------------------------------------------------------- masthead */
  doc.setFillColor("#2a1416");
  doc.rect(0, 0, W, 96, "F");
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor("#d8b98a");
  doc.text("VANITY OR VICE  ·  SPA INTELLIGENCE  ·  EDUCATION ONLY", M, 38);
  doc.setFont("times", "bold");
  doc.setFontSize(24);
  doc.setTextColor("#f6efe6");
  doc.text("Setting Decision Packet", M, 70);
  y = 132;

  eyebrow("On the desk");
  text(a.identityLine, { size: 12, font: "times", style: "bold", gap: 4 });
  text(
    `${SERVICE_LABELS[a.input.serviceClass]} · ${VENUE_LABELS[a.input.venue]} · prepared ${new Date().toLocaleDateString()}`,
    { size: 9, color: SOFT, gap: 10 },
  );

  eyebrow("Posture");
  text(a.posture.label, { size: 12, font: "times", style: "bold", gap: 2 });
  text(a.posture.line, { size: 10, color: SOFT, gap: 6 });

  /* ------------------------------------------------------------ scores */
  heading("Readings");
  const scores: [string, string][] = [
    ["Setting resolved", `${a.place}%`],
    ["Promise density", `${a.promise}%`],
    ["Promise minus place", `${a.gap > 0 ? "+" : ""}${a.gap}`],
    ["Burden index", `${a.burden.score} / 100 · ${a.burden.band}`],
    ["Fail-closed signals", `${a.failClosed.length} of ${a.signals.length}`],
  ];
  for (const [k, v] of scores) {
    room(16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(SOFT);
    doc.text(k, M, y);
    doc.setFont("courier", "bold");
    doc.setTextColor(INK);
    doc.text(v, RIGHT, y, { align: "right" });
    y += 15;
  }
  y += 4;

  heading("Burden drivers");
  a.burden.drivers.forEach((d) => bullet(d));

  /* ------------------------------------------------------------ signals */
  heading("Signal ledger");
  for (const s of a.signals) {
    room(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(INK);
    doc.text(s.label, M, y);
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(s.state === "known" ? "#2f6b4f" : s.state === "partial" ? "#8a6420" : OXBLOOD);
    doc.text(
      s.state === "known" ? "KNOWN" : s.state === "partial" ? "PARTIAL" : "FAIL CLOSED",
      RIGHT,
      y,
      { align: "right" },
    );
    y += 13;
    text(s.reading, { size: 9.5, color: SOFT });
    if (s.state !== "known") {
      text(`Ask: ${s.ask}`, { size: 9.5, color: OXBLOOD, style: "italic" });
    }
    y += 6;
  }

  /* ------------------------------------------------------------- claims */
  if (a.claims.length) {
    heading("Decoded marketing language");
    for (const c of a.claims) {
      room(50);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(INK);
      doc.text(c.category, M, y);
      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.setTextColor(c.severity === "hard" ? OXBLOOD : c.severity === "flag" ? "#8a6420" : SOFT);
      doc.text(c.severity.toUpperCase(), RIGHT, y, { align: "right" });
      y += 13;
      text(`"${c.phrase}"`, { size: 9.5, style: "italic", color: SOFT });
      text(`Hides: ${c.hides}`, { size: 9.5, color: SOFT });
      text(`Ask: ${c.ask}`, { size: 9.5, color: OXBLOOD, style: "italic" });
      y += 6;
    }
  }

  /* ----------------------------------------------------------- unknowns */
  heading("Residual unknowns");
  if (a.unknowns.length) {
    a.unknowns.forEach((u) => bullet(u));
  } else {
    bullet("No unresolved signals recorded on this desk.");
  }

  heading("Next verification steps");
  if (a.nextSteps.length) {
    a.nextSteps.forEach((s, i) => bullet(s, `${i + 1}.`));
  } else {
    bullet("Enter a menu line, performer, and product to generate verification steps.");
  }

  /* -------------------------------------------------------- boundaries */
  heading("Boundaries");
  text(
    "Education only. This packet does not diagnose, does not assess candidacy, does not rank providers, and does not predict outcomes. It records how much of the setting was named and what stayed unanswered. Bring it to a consultation and ask for the missing items out loud.",
    { size: 9.5, color: SOFT },
  );

  /* ------------------------------------------------------------ footer */
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(SOFT);
    doc.text("SPA INTELLIGENCE · SETTING EVALUATION DESK · EDUCATION ONLY", M, H - 28);
    doc.text(`${p} / ${pages}`, RIGHT, H - 28, { align: "right" });
  }

  const slug =
    (a.input.menuLine.trim() || "setting")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "setting";

  doc.save(`decision-packet-${slug}.pdf`);
}
