import { Alert, Card, Spin } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCartography } from "../../../shared/api";
import type { CartographyDTO, CartographyItem } from "../../../shared/types/process";
import "./cartography.css";

function tileShapeClass(idx: number, total: number) {
  if (idx === 0) return "tileFirst";
  if (idx === total - 1) return "tileLast";
  return "tileMid";
}

/**
 * Returns "dark" or "light" text color depending on background luminance.
 */
function getContrastText(hex: string | null): string {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return "#0b1220";
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  // Relative luminance (sRGB)
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.5 ? "#0b1220" : "#ffffff";
}

function displayName(item: CartographyItem): string {
  return item.label || item.process.name;
}

export default function CartographyPage() {
  const [carto, setCarto] = useState<CartographyDTO | null>(null);
  const [error, setError] = useState<string>("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let alive = true;

    getCartography()
      .then((res) => {
        if (!alive) return;
        setCarto(res.data);

        requestAnimationFrame(() => {
          if (!alive) return;
          setIsReady(true);
        });
      })
      .catch((e) => {
        if (!alive) return;
        setError(String(e?.message || e));
      });

    return () => {
      alive = false;
    };
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
  const vcCount = valueChain.length;

  return (
    <div className="cartoPage">
      <div className="cartoWrap">
        <div
          className={`cartoStage cartoAnim ${isReady ? "isReady" : ""}`}
          role="region"
          aria-label="Cartographie des processus"
          style={{ ["--vc-count" as any]: vcCount }}
        >
          <div className="sidePanel sidePanelLeft">
            <Card
              size="small"
              title="Besoins Parties Intéressées"
              className="sidePanelCard"
            >
              {carto.leftStakeholders.length > 0 ? (
                <ul className="sidePanelList">
                  {carto.leftStakeholders.map((s) => (
                    <li key={s.id}>{s.name}</li>
                  ))}
                </ul>
              ) : (
                <span className="sidePanelEmpty">Aucune partie intéressée</span>
              )}
            </Card>
          </div>

          <div className="sidePanel sidePanelRight">
            <Card
              size="small"
              title="Satisfaction Parties Intéressées"
              className="sidePanelCard"
            >
              {carto.rightStakeholders.length > 0 ? (
                <ul className="sidePanelList">
                  {carto.rightStakeholders.map((s) => (
                    <li key={s.id}>{s.name}</li>
                  ))}
                </ul>
              ) : (
                <span className="sidePanelEmpty">Aucune partie intéressée</span>
              )}
            </Card>
          </div>

          <div className="chainOuter">
            {manager ? (
              <Link
                className="managerPill"
                to={`/process/${manager.process.code}`}
                aria-label={`Ouvrir ${displayName(manager)}`}
                style={
                  manager.process.color
                    ? {
                        ["--pill-bg" as any]: manager.process.color,
                        color: getContrastText(manager.process.color),
                      }
                    : undefined
                }
              >
                {displayName(manager).toUpperCase()}
              </Link>
            ) : (
              <div className="managerPill managerPillDisabled" aria-disabled="true">
                MANAGER
              </div>
            )}

            <div className="titleBar">PROCESSUS DE LA CHAÎNE DE VALEUR</div>

            <div className="tilesRow">
              {valueChain.map((item, idx) => {
                const shape = tileShapeClass(idx, valueChain.length);
                const bgColor = item.process.color;
                const textColor = getContrastText(bgColor);
                return (
                  <Link
                    key={item.id}
                    className={`processTile ${shape}`}
                    to={`/process/${item.process.code}`}
                    aria-label={`Ouvrir ${displayName(item)}`}
                    style={{
                      ["--tile-bg" as string]: bgColor || undefined,
                      color: bgColor ? textColor : undefined,
                      zIndex: valueChain.length - idx,
                    }}
                  >
                    <span className="tileText">{displayName(item)}</span>
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
