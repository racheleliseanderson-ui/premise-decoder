import { createFileRoute } from "@tanstack/react-router";
import { ReferenceLibrary } from "@/components/desk/Library";
import { useDesk } from "@/lib/desk-context";
import { routeHead } from "@/lib/modes";

export const Route = createFileRoute("/library")({
  head: () => routeHead("library"),
  component: LibraryPage,
});

function LibraryPage() {
  const desk = useDesk();
  return (
    <ReferenceLibrary
      a={desk.a}
      openClass={desk.libraryClass}
      onOpenClass={desk.setLibraryClass}
    />
  );
}
