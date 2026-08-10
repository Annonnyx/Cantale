import { Hero } from "@/components/home/hero";
import { RegistreStrip } from "@/components/home/registre-strip";
import { Concept } from "@/components/home/concept";
import { Histoire } from "@/components/home/histoire";
import { Gallery } from "@/components/home/gallery";
import { JoinCta } from "@/components/home/join-cta";

export default function Home() {
  return (
    <main>
      <Hero />
      <RegistreStrip />
      <Concept />
      <Histoire />
      <Gallery />
      <JoinCta />
    </main>
  );
}
