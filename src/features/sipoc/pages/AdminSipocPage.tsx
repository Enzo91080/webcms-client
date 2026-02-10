import { ReloadOutlined, SaveOutlined, UndoOutlined } from "@ant-design/icons";
import { Button, Col, message, Row, Select, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import {
  adminGetSipoc,
  adminListProcesses,
  adminUpsertSipoc,
} from "../../../shared/api";
import { SipocTable } from "../components";
import type { SipocPhase } from "../../../shared/types";
import { getErrorMessage } from "../../../shared/utils/error";
import Alert from "antd/es/alert/Alert";

type ProcessOption = {
  id: string;
  code: string;
  name: string;
  processType?: string | null;
  parentProcessId?: string | null;
};

export default function AdminSipocPage() {
  // Process selection
  const [processes, setProcesses] = useState<ProcessOption[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [selectedProcessName, setSelectedProcessName] = useState<string>("");
  const [loadingProcesses, setLoadingProcesses] = useState(false);

  // SIPOC data
  const [phases, setPhases] = useState<SipocPhase[]>([]);
  const [originalPhases, setOriginalPhases] = useState<SipocPhase[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Track if there are unsaved changes
  const hasChanges = JSON.stringify(phases) !== JSON.stringify(originalPhases);

  // Load processes list on mount
  useEffect(() => {
    loadProcesses();
  }, []);

  // trier les process et sous process par code croissant P01 -> SP01 -> P02 -> SP02
  async function loadProcesses() {
    try {
      setLoadingProcesses(true);
      const res = await adminListProcesses();
      const items = (res.data || []).map((p: any) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        processType: p.processType || null,
        parentProcessId: p.parentProcessId || null,
      }));
      items.sort((a, b) => a.code.localeCompare(b.code));
      setProcesses(items);
    } catch (e) {
      message.error(getErrorMessage(e));
    } finally {
      setLoadingProcesses(false);
    }
  }

  // Load SIPOC when process changes
  useEffect(() => {
    if (selectedProcessId) {
      loadSipoc(selectedProcessId);
    } else {
      setPhases([]);
      setOriginalPhases([]);
    }
  }, [selectedProcessId]);

  async function loadSipoc(processId: string) {
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

  async function handleRefresh() {
    if (selectedProcessId) {
      await loadSipoc(selectedProcessId);
      message.success("Donnees rechargées");
    }
  }

  function handleCancel() {
    setPhases(originalPhases);
    message.info("Modifications annulées");
  }

  async function handleSave() {
    if (!selectedProcessId) {
      message.error("Sélectionnez un processus");
      return;
    }

    try {
      setSaving(true);
      await adminUpsertSipoc(selectedProcessId, { phases });
      setOriginalPhases(phases);
      message.success("SIPOC enregistré avec succès");
    } catch (e) {
      message.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  function handleProcessChange(processId: string) {
    setSelectedProcessId(processId);
    const process = processes.find((p) => p.id === processId);
    setSelectedProcessName(process ? `${process.code} - ${process.name}` : "");
  }

  function handlePhasesChange(newPhases: SipocPhase[]) {
    setPhases(newPhases);
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Process selector + Actions */}
      <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginBottom: 24 }}>
        {/* Left: Process selector */}
        <Col flex="auto">
          <Space wrap>
            <span>Process :</span>
            <Select
              style={{ width: 400, maxWidth: "100%" }}
              placeholder="Sélectionnez un processus"
              loading={loadingProcesses}
              showSearch
              optionFilterProp="label"
              value={selectedProcessId}
              onChange={handleProcessChange}
              options={processes.map((p) => ({
                value: p.id,
                label: `${p.code} - ${p.name}`,
              }))}
              allowClear
            />
          </Space>
        </Col>

        {/* Right: Actions */}
        <Col flex="none">
          <Space wrap>
            {hasChanges && (
              <Alert
                message="Modifications non enregistrées"
                type="warning"
                showIcon
                closable
              />
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
              disabled={!selectedProcessId}
            >
              Rafraichir
            </Button>

            <Button
              icon={<UndoOutlined />}
              onClick={handleCancel}
              disabled={!selectedProcessId || !hasChanges}
            >
              Annuler
            </Button>

            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              disabled={!selectedProcessId || !hasChanges}
            >
              Enregistrer 
            </Button>


          </Space>
        </Col>
      </Row>

      {/* SIPOC Table */}
      {selectedProcessId ? (
        loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Typography.Text type="secondary">Chargement...</Typography.Text>
          </div>
        ) : (
          <SipocTable
            title={selectedProcessName || "SIPOC"}
            phases={phases}
            readOnly={false}
            onChange={handlePhasesChange}
            processList={processes}
          />
        )
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            background: "#fafafa",
            borderRadius: 8,
            border: "1px dashed #d9d9d9",
          }}
        >
          <Typography.Text type="secondary" style={{ fontSize: 14 }}>
            Selectionnez un processus pour editer son SIPOC
          </Typography.Text>
        </div>
      )}
    </div>
  );
}
