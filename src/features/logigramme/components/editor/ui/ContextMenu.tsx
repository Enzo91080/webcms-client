import { memo, useCallback, useEffect, useRef } from "react";
import type { MenuProps } from "antd";
import { Dropdown } from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  GroupOutlined,
  LockOutlined,
  ScissorOutlined,
  UngroupOutlined,
  UnlockOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignTopOutlined,
} from "@ant-design/icons";

export type ContextMenuState = {
  visible: boolean;
  x: number;
  y: number;
  nodeId?: string;
};

type ContextMenuProps = {
  state: ContextMenuState;
  onClose: () => void;
  selectedCount: number;
  hasLockedSelection: boolean;
  onCopy: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onLock: () => void;
  onUnlock: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
};

function ContextMenu({
  state, onClose, selectedCount, hasLockedSelection,
  onCopy, onDuplicate, onDelete,
  onGroup, onUngroup, onLock, onUnlock,
  onBringToFront, onSendToBack,
}: ContextMenuProps) {
  const menuItems: MenuProps["items"] = [
    { key: "copy", icon: <CopyOutlined />, label: "Copier", onClick: () => { onCopy(); onClose(); } },
    { key: "duplicate", icon: <ScissorOutlined />, label: "Dupliquer", onClick: () => { onDuplicate(); onClose(); } },
    { key: "delete", icon: <DeleteOutlined />, label: "Supprimer", danger: true, onClick: () => { onDelete(); onClose(); } },
    { type: "divider" },
    { key: "group", icon: <GroupOutlined />, label: "Grouper", disabled: selectedCount < 2, onClick: () => { onGroup(); onClose(); } },
    { key: "ungroup", icon: <UngroupOutlined />, label: "Dégrouper", onClick: () => { onUngroup(); onClose(); } },
    { type: "divider" },
    hasLockedSelection
      ? { key: "unlock", icon: <UnlockOutlined />, label: "Déverrouiller", onClick: () => { onUnlock(); onClose(); } }
      : { key: "lock", icon: <LockOutlined />, label: "Verrouiller", onClick: () => { onLock(); onClose(); } },
    { type: "divider" },
    { key: "front", icon: <VerticalAlignTopOutlined />, label: "Premier plan", onClick: () => { onBringToFront(); onClose(); } },
    { key: "back", icon: <VerticalAlignBottomOutlined />, label: "Arrière-plan", onClick: () => { onSendToBack(); onClose(); } },
  ];

  if (!state.visible) return null;

  return (
    <Dropdown
      menu={{ items: menuItems }}
      open
      onOpenChange={(open) => { if (!open) onClose(); }}
      trigger={["contextMenu"]}
    >
      <div
        style={{
          position: "fixed",
          left: state.x,
          top: state.y,
          width: 1,
          height: 1,
          zIndex: 9999,
        }}
      />
    </Dropdown>
  );
}

export default memo(ContextMenu);
