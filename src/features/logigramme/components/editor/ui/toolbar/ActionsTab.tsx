import {
  CopyOutlined,
  DeleteOutlined,
  RedoOutlined,
  ScissorOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { Button, Divider, Dropdown, Tooltip } from "antd";
import type { MenuProps } from "antd";
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignTopOutlined,
} from "@ant-design/icons";
import type { AlignDirection, DistributeDirection } from "../../commands";

type ActionsTabProps = {
  canUndo: () => boolean;
  canRedo: () => boolean;
  selectedCount: number;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAlign: (d: AlignDirection) => void;
  onDistribute: (d: DistributeDirection) => void;
  canAlign: () => boolean;
  canDistribute: () => boolean;
};

export default function ActionsTab({
  canUndo, canRedo, selectedCount,
  onUndo, onRedo, onCopy, onPaste, onDuplicate, onDelete,
  onAlign, onDistribute, canAlign, canDistribute,
}: ActionsTabProps) {
  const alignMenu: MenuProps["items"] = [
    { key: "left", icon: <AlignLeftOutlined />, label: "Gauche", disabled: !canAlign(), onClick: () => onAlign("left") },
    { key: "center", icon: <AlignCenterOutlined />, label: "Centre H", disabled: !canAlign(), onClick: () => onAlign("center") },
    { key: "right", icon: <AlignRightOutlined />, label: "Droite", disabled: !canAlign(), onClick: () => onAlign("right") },
    { type: "divider" },
    { key: "top", icon: <VerticalAlignTopOutlined />, label: "Haut", disabled: !canAlign(), onClick: () => onAlign("top") },
    { key: "middle", icon: <VerticalAlignMiddleOutlined />, label: "Centre V", disabled: !canAlign(), onClick: () => onAlign("middle") },
    { key: "bottom", icon: <VerticalAlignBottomOutlined />, label: "Bas", disabled: !canAlign(), onClick: () => onAlign("bottom") },
  ];

  const distMenu: MenuProps["items"] = [
    { key: "h", label: "Horizontal", disabled: !canDistribute(), onClick: () => onDistribute("horizontal") },
    { key: "v", label: "Vertical", disabled: !canDistribute(), onClick: () => onDistribute("vertical") },
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      <Tooltip title="Annuler (Ctrl+Z)">
        <Button icon={<UndoOutlined />} onClick={onUndo} disabled={!canUndo()} size="small" type="text" />
      </Tooltip>
      <Tooltip title="Rétablir (Ctrl+Y)">
        <Button icon={<RedoOutlined />} onClick={onRedo} disabled={!canRedo()} size="small" type="text" />
      </Tooltip>

      <Divider type="vertical" style={{ margin: "0 2px" }} />

      <Tooltip title="Copier (Ctrl+C)">
        <Button icon={<CopyOutlined />} onClick={onCopy} disabled={selectedCount === 0} size="small" type="text" />
      </Tooltip>
      <Tooltip title="Coller (Ctrl+V)">
        <Button onClick={onPaste} size="small" type="text">Coller</Button>
      </Tooltip>
      <Tooltip title="Dupliquer (Ctrl+D)">
        <Button icon={<ScissorOutlined />} onClick={onDuplicate} disabled={selectedCount === 0} size="small" type="text" />
      </Tooltip>
      <Tooltip title="Supprimer">
        <Button icon={<DeleteOutlined />} onClick={onDelete} disabled={selectedCount === 0} size="small" type="text" danger />
      </Tooltip>

      <Divider type="vertical" style={{ margin: "0 2px" }} />

      <Dropdown menu={{ items: alignMenu }} trigger={["click"]}>
        <Button size="small" type="text" disabled={!canAlign()}>Aligner</Button>
      </Dropdown>
      <Dropdown menu={{ items: distMenu }} trigger={["click"]}>
        <Button size="small" type="text" disabled={!canDistribute()}>Distribuer</Button>
      </Dropdown>
    </div>
  );
}
