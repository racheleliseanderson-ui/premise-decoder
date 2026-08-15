import { createFileRoute } from "@tanstack/react-router";
import { DecoderPanel } from "@/components/desk/Paths";
import { useDesk } from "@/lib/desk-context";
import { routeHead } from "@/lib/modes";

export const Route = createFileRoute("/claim-decoder")({
  head: () => routeHead("decode"),
  component: ClaimDecoderPage,
});

function ClaimDecoderPage() {
  const desk = useDesk();
  return <DecoderPanel input={desk.input} patch={desk.patch} a={desk.a} />;
}
