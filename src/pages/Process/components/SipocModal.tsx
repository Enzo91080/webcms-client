import React from "react";
import { Alert, Modal, Button } from "antd";
import { SipocVisioTable } from "../../../components/sipoc/SipocVisioTable";
import { SipocRow } from "../../../types";

type Props = {
  open: boolean;
  onClose: () => void;
  rows?: SipocRow[];
  focusRef?: string | null;
  title?: string;
};

export default function SipocModal({ open, onClose, rows, focusRef, title }: Props) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={
        <Button type="primary" onClick={onClose} size="large">
          Fermer
        </Button>
      }
      title={title}
      width={1200}
    >
      {rows && rows.length ? (
        <div style={{ maxHeight: "70vh", overflow: "auto" }}>
          <SipocVisioTable  title={title || "SIPOC"} rows={rows} phases={undefined} focusRef={focusRef} />
        </div>
      ) : (
        <Alert
          message="Aucune ligne SIPOC"
          description="Ce processus ne contient pas encore de données SIPOC."
          type="info"
          showIcon
        />
      )}
    </Modal>
  );
}
