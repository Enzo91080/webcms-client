import { Alert, Spin } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCartography } from "../../../shared/api";
import type { CartographyDTO } from "../../../shared/types/process";
import "./cartography.css";

function tileShapeClass(idx: number, total: number) {
  if (idx === 0) return "tileFirst";
  if (idx === total - 1) return "tileLast";
  return "tileMid";
}

function vcColorClass(idx: number) {
  return `vc-${idx + 1}`;
}

export default function CartographyPage() {
  const [carto, setCarto] = useState<CartographyDTO | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    getCartography()
      .then((r) => setCarto(r.data))
      .catch((e) => setError(String(e.message || e)));
  }, []);

  if (error) {
    return (
      <div className="pageCenter">
        <Alert type="error" showIcon message="Erreur" description={error} />
      </div>
    );
  }

  if (!carto) {
    return (
      <div className="pageCenter">
        <Spin tip="Chargement…" size="large" />
      </div>
    );
  }

  const valueChain = carto.valueChain ?? [];
  const manager = carto.manager;

  return (
    <div className="cartoPage">
      <div className="cartoWrap">
        <div className="cartoStage">
          <div className="sidePanel sidePanelLeft">
            <div className="sidePanelText">
              Support
            </div>
          </div>

          <div className="sidePanel sidePanelRight">
            <div className="sidePanelText">
              Pilotage
            </div>
          </div>

          <div className="smallBox smallBoxLeft">
            test  
          </div>

          <div className="smallBox smallBoxRight">
            test
          </div>

          <div className="chainOuter">
            {manager ? (
              <Link className="managerPill" to={`/process/${manager.code}`}>
                {manager.name.toUpperCase()}
              </Link>
            ) : (
              <div className="managerPill managerPillDisabled">MANAGER</div>
            )}

            <div className="titleBar">PROCESSUS DE LA CHAÎNE DE VALEUR</div>

            <div className="tilesRow">
              {valueChain.map((p, idx) => {
                const shape = tileShapeClass(idx, valueChain.length);
                const color = vcColorClass(idx);
                return (
                  <Link
                    key={p.id}
                    className={`processTile ${shape} vcTile ${color}`}
                    to={`/process/${p.code}`}
                  >
                    <span className="tileText">{p.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
