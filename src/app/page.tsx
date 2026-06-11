import Studio from "@/components/studio/Studio";
import { getUniverse } from "@/lib/data";
import { getUser } from "@/lib/auth";
import { flags } from "@/lib/flags";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [universe, user] = await Promise.all([getUniverse(), getUser()]);

  return (
    <Studio
      universe={universe}
      isAuthed={!!user}
      features={{
        search: flags.features.search,
        minimap: flags.features.minimap,
        follow: flags.features.follow,
        admin: flags.features.admin,
      }}
    />
  );
}
