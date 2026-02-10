import { Alert, Spin } from "antd";
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
      .then((r) => {
        if (!alive) return;
        setCarto(r.data);

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
  const leftPanel = carto.leftPanel ?? [];
  const rightPanel = carto.rightPanel ?? [];
  const leftBox = carto.leftBox ?? [];
  const rightBox = carto.rightBox ?? [];
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
            <div className="sidePanelText">
              {leftPanel.length > 0 ? displayName(leftPanel[0]) : "Support"}
            </div>
          </div>

          <div className="sidePanel sidePanelRight">
            <div className="sidePanelText">
              {rightPanel.length > 0 ? displayName(rightPanel[0]) : "Pilotage"}
            </div>
          </div>

          <div className="smallBox smallBoxLeft">
            {leftBox.length > 0 ? displayName(leftBox[0]) : ""}
          </div>
          <div className="smallBox smallBoxRight">
            {rightBox.length > 0 ? displayName(rightBox[0]) : ""}
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
                    className={`processTile ${shape} vcTile`}
                    to={`/process/${item.process.code}`}
                    aria-label={`Ouvrir ${displayName(item)}`}
                    style={
                      bgColor
                        ? {
                            background: `radial-gradient(180px 90px at 30% 20%, rgba(255,255,255,.45), transparent 55%), ${bgColor}`,
                            color: textColor,
                          }
                        : undefined
                    }
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
