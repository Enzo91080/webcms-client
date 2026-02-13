import { DownloadOutlined, ExportOutlined, FilePdfOutlined, ImportOutlined, PictureOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useCallback } from "react";
import { toPng } from "html-to-image";
import { exportSvg } from "../../lib/exportSvg";
import { exportPdf } from "../../lib/exportPdf";

type ExportTabProps = {
  saving: boolean;
  dirty: boolean;
  onSave: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
};

export default function ExportTab({
  saving, dirty, onSave, onExportJSON, onImportJSON,
}: ExportTabProps) {
  const handleExportPNG = useCallback(() => {
    const el = document.querySelector(".react-flow") as HTMLElement;
    if (!el) return;
    toPng(el, { backgroundColor: "#ffffff", pixelRatio: 2 }).then((url) => {
      const a = document.createElement("a");
      a.href = url;
      a.download = "logigramme.png";
      a.click();
    });
  }, []);

  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) onImportJSON(f);
    };
    input.click();
  }, [onImportJSON]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <Button icon={<DownloadOutlined />} size="small" onClick={handleExportPNG}>PNG</Button>
      <Button icon={<PictureOutlined />} size="small" onClick={() => exportSvg()}>SVG</Button>
      <Button icon={<FilePdfOutlined />} size="small" onClick={() => exportPdf()}>PDF</Button>
      <Button icon={<ExportOutlined />} size="small" onClick={onExportJSON}>JSON</Button>
      <Button icon={<ImportOutlined />} size="small" onClick={handleImport}>Importer</Button>

      <div style={{ flex: 1 }} />

      <Button type="primary" size="small" onClick={onSave} loading={saving}>
        {dirty ? "Enregistrer *" : "Enregistrer"}
      </Button>
    </div>
  );
}
