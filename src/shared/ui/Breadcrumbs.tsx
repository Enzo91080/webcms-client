import { Link } from "react-router-dom";
import type { PathItem } from "../types";

export default function Breadcrumbs({ path }: { path: PathItem[] }) {
  if (!path?.length) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
      <Link to="/">Cartographie</Link>
      <span style={{ opacity: 0.6 }}>›</span>
      {path.map((p, idx) => (
        <span key={p.id} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          {idx < path.length - 1 ? (
            <>
              <Link to={`/process/${p.code}`}>{p.code}</Link>
              <span style={{ opacity: 0.6 }}>›</span>
            </>
          ) : (
            <span style={{ fontWeight: 700 }}>{p.code}</span>
          )}
        </span>
      ))}
    </div>
  );
}
