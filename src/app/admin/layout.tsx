import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/supabase/config";
import SignOutButton from "@/components/auth/SignOutButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — DS Labs" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login?next=/admin");

  const authorized = isAdminEmail(user.email);

  return (
    <div className="admin">
      <header className="admin-bar">
        <div className="left">
          <Link href="/" className="brand">
            <span className="star" />
            DS LABS
          </Link>
          <span className="who">{user.email}</span>
        </div>
        <div className="right">
          <Link href="/" className="btn-line">
            View studio
          </Link>
          <SignOutButton />
        </div>
      </header>

      {authorized ? (
        children
      ) : (
        <main className="admin-main">
          <div className="notice error">
            This account isn’t on the admin allow-list. Ask an owner to add{" "}
            <strong>{user.email}</strong> to <code>ADMIN_EMAILS</code>.
          </div>
        </main>
      )}
    </div>
  );
}
