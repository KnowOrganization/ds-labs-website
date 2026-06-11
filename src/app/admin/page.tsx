import AdminManager from "@/components/admin/AdminManager";
import { getAllResources } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const rows = await getAllResources();

  return (
    <main className="admin-main">
      <div className="admin-head">
        <div>
          <h1>Resources</h1>
          <p>Manage the prompts &amp; videos shown in the studio.</p>
        </div>
      </div>

      {rows === null ? (
        <div className="notice info">
          Couldn’t reach the <code>resources</code> table. Run{" "}
          <code>supabase/schema.sql</code> in your Supabase project, then reload.
        </div>
      ) : (
        <AdminManager rows={rows} />
      )}
    </main>
  );
}
