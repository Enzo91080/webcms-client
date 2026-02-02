import { Alert, Spin } from "antd";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCartography } from "../../api";
import type { ProcessLite } from "../../types";
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
  const P07 = useMemo(() => byCode(items, "P07"), [items]);


  if (error) {
    return (
      <div className="pageCenter">
        <Alert type="error" showIcon message="Erreur" description={error} />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="pageCenter">
        <Spin tip="Chargement…" size="large" />
      </div>
    );
  }

  return (
    <div className="cartoPage">
      <div className="cartoWrap">
        <div className="cartoStage">
          <div className="sidePanel sidePanelLeft">
            <div className="sidePanelText">Gauche</div>
          </div>

          <div className="sidePanel sidePanelRight">
            <div className="sidePanelText">Droite</div>
          </div>

          <div className="smallBox smallBoxLeft">
            <div>Élément 1</div>
            <div>Élément 1</div>
            <div>Élément 1</div>
            <div>Élément 1</div>
          </div>

          <div className="smallBox smallBoxRight">
            <div>Élément 1</div>
            <div>Élément 1</div>
            <div>Élément 1</div>
            <div>Élément 1</div>
          </div>

          <div className="chainOuter">
            {P01 ? (
              <Link className="managerPill" to={`/process/${P01.code}`}>
                MANAGER
              </Link>
            ) : (
              <div className="managerPill managerPillDisabled">MANAGER</div>
            )}

            <div className="titleBar">PROCESSUS DE LA CHAÎNE DE VALEUR</div>

            <div className="tilesRow">
              {P02 && (
                <Link className="processTile tileFirst p02" to={`/process/${P02.code}`}>
                  <span className="tileText">Vendre</span>
                </Link>
              )}
              {P03 && (
                <Link className="processTile tileMid p03" to={`/process/${P03.code}`}>
                  <span className="tileText">Planifier</span>
                </Link>
              )}
              {P04 && (
                <Link className="processTile tileMid p04" to={`/process/${P04.code}`}>
                  <span className="tileText">Manager le programme</span>
                </Link>
              )}
              {P05 && (
                <Link className="processTile tileMid p05" to={`/process/${P05.code}`}>
                  <span className="tileText">Réaliser</span>
                </Link>
              )}
              {P06 && (
                <Link className="processTile tileLast p06" to={`/process/${P06.code}`}>
                  <span className="tileText">Valider</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
