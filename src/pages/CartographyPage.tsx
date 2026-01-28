import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCartography, ProcessLite } from "../lib/api";
import "./cartography.css";

function byCode(items: ProcessLite[], code: string) {
  return items.find((x) => x.code === code) || null;
}

export default function CartographyPage() {
  const [items, setItems] = useState<ProcessLite[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    getCartography()
      .then((r) => setItems(r.data))
      .catch((e) => setError(String(e.message || e)));
  }, []);

  const P01 = useMemo(() => byCode(items, "P01"), [items]);
  const P02 = useMemo(() => byCode(items, "P02"), [items]);
  const P03 = useMemo(() => byCode(items, "P03"), [items]);
  const P04 = useMemo(() => byCode(items, "P04"), [items]);
  const P05 = useMemo(() => byCode(items, "P05"), [items]);
  const P06 = useMemo(() => byCode(items, "P06"), [items]);

  if (error) return <div style={{ color: "crimson" }}>Erreur : {error}</div>;
  if (!items.length) return <div style={{ opacity: 0.7 }}>Chargement…</div>;

  return (
    <div className="cartographyWrap">
      <div className="cartographyStage">
        {/* Panneau gauche */}
        <div className="sidePanelAbs left">
          <div className="sidePanelText">Gauche</div>
        </div>

        {/* Panneau droit */}
        <div className="sidePanelAbs right">
          <div className="sidePanelText">Droite</div>
        </div>

        {/* Petit bloc bas gauche */}
        <div className="smallBoxAbs left">
          <div>Élément 1</div>
          <div>Élément 1</div>
          <div>Élément 1</div>
          <div>Élément 1</div>
        </div>

        {/* Petit bloc bas droit */}
        <div className="smallBoxAbs right">
          <div>Élément 1</div>
          <div>Élément 1</div>
          <div>Élément 1</div>
          <div>Élément 1</div>
        </div>

        {/* Ovale central */}
        <div className="chainOuter">
          {/* Pastille MANAGER */}
          {P01 ? (
            <Link className="managerPill" to={`/process/${P01.code}`}>
              MANAGER
            </Link>
          ) : (
            <div className="managerPill" style={{ cursor: "default", opacity: 0.85 }}>
              MANAGER
            </div>
          )}

          <div className="titleBar">PROCESSUS DE LA CHAÎNE DE VALEUR</div>

          <div className="tilesRow">
            {P02 && (
              <Link className="processTile p02 tileFirst" to={`/process/${P02.code}`}>
                <span className="tileText">Vendre</span>
              </Link>
            )}
            {P03 && (
              <Link className="processTile p03 tileMid" to={`/process/${P03.code}`}>
                <span className="tileText">Planifier</span>
              </Link>
            )}
            {P04 && (
              <Link className="processTile p04 tileMid" to={`/process/${P04.code}`}>
                <span className="tileText">Manager le programme</span>
              </Link>
            )}
            {P05 && (
              <Link className="processTile p05 tileMid" to={`/process/${P05.code}`}>
                <span className="tileText">Réaliser</span>
              </Link>
            )}
            {P06 && (
              <Link className="processTile p06 tileLast" to={`/process/${P06.code}`}>
                <span className="tileText">Valider</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
