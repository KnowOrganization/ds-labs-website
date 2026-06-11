import Studio from "@/components/studio/Studio";
import { getUniverse } from "@/lib/data";
import { flags } from "@/lib/flags";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const universe = await getUniverse();

  return (
    <Studio
      universe={universe}
      features={{
        search: flags.features.search,
        minimap: flags.features.minimap,
        follow: flags.features.follow,
      }}
    />
  );
}
