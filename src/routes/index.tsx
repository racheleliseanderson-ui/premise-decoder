import { createFileRoute } from "@tanstack/react-router";

import { ChapterBreak, Method } from "@/components/desk/DeskLayout";
import { PromiseVsPlace } from "@/components/desk/PromiseVsPlace";
import { Demos, Workbench } from "@/components/desk/Workbench";
import { Hero } from "@/components/shell/Hero";
import { useDesk } from "@/lib/desk-context";
import { scrollToId } from "@/lib/modes";
import { shareHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => shareHead("/"),
  component: Home,
});

/**
 * The front door.
 *
 * This is the only page that carries the argument — hero, demo shelf, chapter
 * break, method. Every other route is the desk on its own, which is why it can
 * be linked to, printed, and arrived at from another desk without wading past
 * an advertisement first.
 */
function Home() {
  const desk = useDesk();

  return (
    <>
      <Hero
        onStart={() => {
          scrollToId("work-panel", "smooth");
          window.setTimeout(() => {
            document
              .querySelector<HTMLElement>("#work-panel select, #work-panel input")
              ?.focus({ preventScroll: true });
          }, 220);
        }}
        onExamples={() => scrollToId("demos", "smooth")}
      />

      <Workbench mode="fast" tone="home" />

      {desk.hasInput ? (
        <section className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
          <PromiseVsPlace a={desk.a} />
        </section>
      ) : null}

      <Demos />
      <ChapterBreak />
      <Method />
    </>
  );
}
