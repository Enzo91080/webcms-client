import { ReloadOutlined, SaveOutlined, UndoOutlined } from "@ant-design/icons";
import { Alert, Button, message, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { adminGetSipoc, adminUpsertSipoc } from "../../../shared/api";
import type { SipocPhase } from "../../../shared/types";
import { getErrorMessage } from "../../../shared/utils/error";
import { SipocVisioTable } from "./SipocVisioTable";

/**
 * SIPOC Editor using SipocVisioTable
 * - Editable table view (same as AdminSipocPage)
 * - Save persists to API
 */

export default function SipocEditor({
  processId,
  processName,
  onSaved,
}: {
  processId: string;
  processName?: string;
  onSaved?: (phases: SipocPhase[]) => void;
}) {
  const [phases, setPhases] = useState<SipocPhase[]>([]);
  const [originalPhases, setOriginalPhases] = useState<SipocPhase[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasChanges = JSON.stringify(phases) !== JSON.stringify(originalPhases);

  async function loadSipoc() {
    try {
      setLoading(true);
      const res = await adminGetSipoc(processId);
      const loadedPhases = res.phases || [];
      setPhases(loadedPhases);
      setOriginalPhases(loadedPhases);
    } catch (e) {
      message.error(getErrorMessage(e));
      setPhases([]);
      setOriginalPhases([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (processId) {
      loadSipoc();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processId]);

  function handleCancel() {
    setPhases(originalPhases);
    message.info("Modifications annulées");
  }

  async function handleSave() {
    try {
      setSaving(true);
      await adminUpsertSipoc(processId, { phases });
      setOriginalPhases(phases);
      message.success("SIPOC enregistré");
      onSaved?.(phases);
    } catch (e) {
      message.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  function handlePhasesChange(newPhases: SipocPhase[]) {
    setPhases(newPhases);
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <Typography.Text type="secondary">Chargement...</Typography.Text>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 4px" }}>
      {/* Header avec actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          {hasChanges && (
            <Alert
              message="Modifications non enregistrées"
              type="warning"
              showIcon
              style={{ marginBottom: 0 }}
            />
          )}
        </div>
        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadSipoc}
            loading={loading}
          >
            Rafraîchir
          </Button>
          <Button
            icon={<UndoOutlined />}
            onClick={handleCancel}
            disabled={!hasChanges}
          >
            Annuler
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges}
          >
            Enregistrer
          </Button>
        </Space>
      </div>

      {/* SIPOC Table */}
      <SipocVisioTable
        title={processName || "SIPOC"}
        phases={phases}
        readOnly={false}
        onChange={handlePhasesChange}
      />
    </div>
  );
}
