import Link from "next/link";

export default function NotFound() {
  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="auth-brand" style={{ justifyContent: "center" }}>
          <span className="star" />
          DS LABS
        </div>
        <h1>Lost in space</h1>
        <p className="lede">That star isn’t on the map.</p>
        <Link className="btn-solid" href="/">
          Back to the studio
        </Link>
      </div>
    </div>
  );
}
