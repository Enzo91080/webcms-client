import { useCallback, useRef, useState } from "react";
import { Button, Modal, Skeleton, Tooltip } from "antd";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  ExpandOutlined,
  CompressOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import cartographyImage from "../../../../public/carto.png";

// ---- image statique fournie par l'utilisateur ----
// Dépose ton image dans client/public/cartography-preview.png
const cartoPreviewSrc = "./";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;

type Props = {
  /** Fallback si l'image n'est pas encore dans le dossier */
  loading?: boolean;
};

export default function CartographyMicroscopeButton({ loading }: Props) {
  const [open, setOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // zoom / pan state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const reset = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const openModal = useCallback(() => {
    reset();
    setOpen(true);
  }, [reset]);

  const zoomIn = useCallback(
    () => setScale((s) => Math.min(s + ZOOM_STEP, MAX_ZOOM)),
    [],
  );
  const zoomOut = useCallback(
    () => setScale((s) => Math.max(s - ZOOM_STEP, MIN_ZOOM)),
    [],
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setScale((s) => Math.min(Math.max(s + delta, MIN_ZOOM), MAX_ZOOM));
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      dragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      translateStart.current = { ...translate };
      e.preventDefault();
    },
    [translate],
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    setTranslate({
      x: translateStart.current.x + (e.clientX - dragStart.current.x),
      y: translateStart.current.y + (e.clientY - dragStart.current.y),
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const showSkeleton = loading || (!imgLoaded && !imgError);

  return (
    <>
      {/* ---- Bouton miniature dans le header ---- */}
      <Tooltip title="Aperçu de la cartographie" placement="bottom">
        <button
          type="button"
          className="cartoMicroscopeBtn"
          onClick={openModal}
          aria-label="Ouvrir l'aperçu complet de la cartographie"
        >
          {imgError ? (
            <div className="cartoMicroscopePlaceholder">
              <EyeOutlined style={{ fontSize: 20, color: "rgba(255,255,255,.7)" }} />
            </div>
          ) : (
            <>
              {showSkeleton && (
                <div className="cartoMicroscopeSkeleton">
                  <Skeleton.Image active style={{ width: "100%", height: "100%" }} />
                </div>
              )}
              <img
                src={cartographyImage}
                alt="Aperçu cartographie"
                className="cartoMicroscopeImg"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                style={{ opacity: imgLoaded ? 1 : 0 }}
              />
            </>
          )}
        </button>
      </Tooltip>

      {/* ---- Modal zoom/pan ---- */}
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width="90vw"
        style={{ top: 20 }}
        styles={{ body: { padding: 0, overflow: "hidden" } }}
        title="Cartographie des processus"
        destroyOnClose
      >
        {/* Toolbar zoom */}
        <div className="cartoZoomToolbar">
          <Button icon={<ZoomOutOutlined />} onClick={zoomOut} size="small" />
          <span className="cartoZoomLevel">{Math.round(scale * 100)}%</span>
          <Button icon={<ZoomInOutlined />} onClick={zoomIn} size="small" />
          <Button icon={<ExpandOutlined />} onClick={reset} size="small" title="Réinitialiser" />
          <Button
            icon={<CompressOutlined />}
            onClick={() => {
              setScale(1);
              setTranslate({ x: 0, y: 0 });
            }}
            size="small"
            title="Ajuster à la vue"
          />
        </div>

        {/* Zone image zoomable/pannable */}
        <div
          ref={containerRef}
          className="cartoZoomContainer"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={cartographyImage}
            alt="Cartographie des processus - vue complète"
            className="cartoZoomImage"
            style={{
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            }}
            draggable={false}
          />
        </div>
      </Modal>
    </>
  );
}
