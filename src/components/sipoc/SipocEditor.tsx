import { ArrowDownOutlined, ArrowUpOutlined, CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Card, Input, message, Popconfirm, Space, Tag, Tooltip, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { saveSipoc } from "../../api";
import type { SipocRow } from "../../types";

const { Title, Text } = Typography;

/**
 * SIPOC Editor (Admin-friendly)
 * - Table editable (inline)
 * - designation is always an object {name,url}
 * - Add / Remove / Move up/down
 * - Save persists to API
 */

type RowUI = SipocRow & { __key: string };

function makeKey(r: SipocRow, i: number) {
  return String(r.ref || r.numero || r.designation?.name || i);
}

function cloneRows(rows: SipocRow[]): SipocRow[] {
  return (rows || []).map((r) => ({
    ...r,
    designation: {
      name: String(r?.designation?.name || ""),
      url: String(r?.designation?.url || ""),
    },
  }));
}

function emptyRow(nextIndex: number): SipocRow {
  const n = nextIndex + 1;
  return {
    ref: `STEP-${n.toString().padStart(2, "0")}`,
    numero: String(n),
    processusFournisseur: "",
    entrees: "",
    ressources: "",
    designation: { name: "", url: "" },
    sorties: "",
    processusClient: "",
  };
}

export default function SipocEditor({
  processId,
  initialRows,
  onSaved,
}: {
  processId: string;
  initialRows: SipocRow[];
  onSaved?: (rows: SipocRow[]) => void;
}) {
  const [rows, setRows] = useState<SipocRow[]>(() => cloneRows(initialRows || []));
  const [saving, setSaving] = useState(false);

  // When switching process or reopening drawer, keep editor in sync with the latest DB value
  useEffect(() => {
    setRows(cloneRows(initialRows || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processId, JSON.stringify(initialRows || [])]);

  const data: RowUI[] = useMemo(() => {
    const base = cloneRows(rows);
    return base.map((r, i) => ({ ...r, __key: makeKey(r, i) }));
  }, [rows]);

  function updateRow(i: number, patch: Partial<SipocRow>) {
    setRows((prev) => {
      const next = cloneRows(prev);
      next[i] = {
        ...next[i],
        ...patch,
        designation: patch.designation ? { ...next[i].designation, ...patch.designation } : next[i].designation,
      };
      return next;
    });
  }

  function move(i: number, delta: number) {
    setRows((prev) => {
      const next = cloneRows(prev);
      const j = i + delta;
      if (j < 0 || j >= next.length) return prev;
      const tmp = next[i];
      next[i] = next[j];
      next[j] = tmp;
      return next;
    });
  }

  function add() {
    setRows((prev) => [...cloneRows(prev), emptyRow(prev.length)]);
  }

  function remove(i: number) {
    setRows((prev) => cloneRows(prev).filter((_, idx) => idx !== i));
  }

  function validateAll(current: SipocRow[]) {
    for (let i = 0; i < current.length; i++) {
      const r = current[i];
      if (!r.designation?.name?.trim()) throw new Error(`Ligne ${i + 1}: designation.name est obligatoire`);
      if (!r.designation?.url?.trim()) throw new Error(`Ligne ${i + 1}: designation.url est obligatoire`);
    }
  }

  async function save() {
    try {
      const payload = cloneRows(rows);
      validateAll(payload);
      setSaving(true);
      await saveSipoc(processId, payload);
      message.success("SIPOC enregistré");
      onSaved?.(payload);
    } catch (e: any) {
      message.error(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  const isValidRow = (r: SipocRow) => {
    return !!(r.designation?.name?.trim() && r.designation?.url?.trim());
  };

  return (
    <div style={{ padding: "0 4px" }}>
      {/* Header avec actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <Title level={5} style={{ margin: 0 }}>
            Lignes SIPOC ({data.length})
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Chaque ligne représente une étape du processus. Les champs marqués * sont obligatoires.
          </Text>
        </div>
        <Space>
          <Button icon={<PlusOutlined />} onClick={add}>
            Ajouter une ligne
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={save} loading={saving} size="large">
            Enregistrer
          </Button>
        </Space>
      </div>

      {/* Liste des lignes en cartes */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {data.map((row, idx) => {
          const isValid = isValidRow(row);
          return (
            <Card
              key={row.__key}
              style={{
                border: isValid ? "1px solid #d9d9d9" : "1px solid #ff4d4f",
                borderRadius: 8,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
              bodyStyle={{ padding: 20 }}
            >
              {/* En-tête de la carte */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Tag color={isValid ? "success" : "error"} style={{ margin: 0, padding: "4px 12px", fontSize: 12 }}>
                    {isValid ? (
                      <>
                        <CheckCircleOutlined /> Valide
                      </>
                    ) : (
                      <>
                        <CloseCircleOutlined /> Incomplet
                      </>
                    )}
                  </Tag>
                  <Text strong style={{ fontSize: 14 }}>
                    Étape {idx + 1}
                  </Text>
                  {row.ref && (
                    <Tag color="blue" style={{ margin: 0 }}>
                      {row.ref}
                    </Tag>
                  )}
                </div>
                <Space>
                  <Tooltip title="Déplacer vers le haut">
                    <Button
                      icon={<ArrowUpOutlined />}
                      size="small"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                    />
                  </Tooltip>
                  <Tooltip title="Déplacer vers le bas">
                    <Button
                      icon={<ArrowDownOutlined />}
                      size="small"
                      onClick={() => move(idx, +1)}
                      disabled={idx === rows.length - 1}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="Supprimer cette ligne ?"
                    description="Cette action est irréversible."
                    onConfirm={() => remove(idx)}
                    okText="Supprimer"
                    cancelText="Annuler"
                    okButtonProps={{ danger: true }}
                  >
                    <Tooltip title="Supprimer">
                      <Button icon={<DeleteOutlined />} size="small" danger />
                    </Tooltip>
                  </Popconfirm>
                </Space>
              </div>

              {/* Contenu organisé en sections */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Colonne gauche */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <Text strong style={{ fontSize: 12, color: "#595959", display: "block", marginBottom: 6 }}>
                      Référence
                    </Text>
                    <Input
                      value={row.ref || ""}
                      onChange={(e) => updateRow(idx, { ref: e.target.value })}
                      placeholder="ex: VEN-01"
                      size="large"
                    />
                  </div>

                  <div>
                    <Text strong style={{ fontSize: 12, color: "#595959", display: "block", marginBottom: 6 }}>
                      Processus Fournisseur
                    </Text>
                    <Input
                      value={row.processusFournisseur || ""}
                      onChange={(e) => updateRow(idx, { processusFournisseur: e.target.value })}
                      placeholder="Processus en amont"
                      size="large"
                    />
                  </div>

                  <div>
                    <Text strong style={{ fontSize: 12, color: "#595959", display: "block", marginBottom: 6 }}>
                      Entrées
                    </Text>
                    <Input.TextArea
                      value={row.entrees || ""}
                      onChange={(e) => updateRow(idx, { entrees: e.target.value })}
                      placeholder="Entrées du processus"
                      rows={2}
                      autoSize={{ minRows: 2, maxRows: 4 }}
                    />
                  </div>

                  <div>
                    <Text strong style={{ fontSize: 12, color: "#595959", display: "block", marginBottom: 6 }}>
                      Numéro
                    </Text>
                    <Input
                      value={row.numero || ""}
                      onChange={(e) => updateRow(idx, { numero: e.target.value })}
                      placeholder="N°"
                      size="large"
                    />
                  </div>
                </div>

                {/* Colonne droite */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <Text strong style={{ fontSize: 12, color: "#595959", display: "block", marginBottom: 6 }}>
                      Ressources
                    </Text>
                    <Input.TextArea
                      value={row.ressources || ""}
                      onChange={(e) => updateRow(idx, { ressources: e.target.value })}
                      placeholder="Ressources nécessaires"
                      rows={2}
                      autoSize={{ minRows: 2, maxRows: 4 }}
                    />
                  </div>

                  <div>
                    <Text strong style={{ fontSize: 12, color: "#595959", display: "block", marginBottom: 6 }}>
                      Désignation - Nom <Text type="danger">*</Text>
                    </Text>
                    <Input
                      value={row.designation?.name || ""}
                      onChange={(e) =>
                        updateRow(idx, {
                          designation: {
                            name: e.target.value,
                            url: row.designation?.url || "",
                          },
                        })
                      }
                      placeholder="Nom de l'étape"
                      status={!row.designation?.name?.trim() ? "error" : ""}
                      size="large"
                    />
                  </div>

                  <div>
                    <Text strong style={{ fontSize: 12, color: "#595959", display: "block", marginBottom: 6 }}>
                      Désignation - URL <Text type="danger">*</Text>
                    </Text>
                    <Input
                      value={row.designation?.url || ""}
                      onChange={(e) =>
                        updateRow(idx, {
                          designation: {
                            name: row.designation?.name || "",
                            url: e.target.value,
                          },
                        })
                      }
                      placeholder="https://... ou /process/SP0202"
                      status={!row.designation?.url?.trim() ? "error" : ""}
                      size="large"
                    />
                  </div>

                  <div>
                    <Text strong style={{ fontSize: 12, color: "#595959", display: "block", marginBottom: 6 }}>
                      Sorties
                    </Text>
                    <Input.TextArea
                      value={row.sorties || ""}
                      onChange={(e) => updateRow(idx, { sorties: e.target.value })}
                      placeholder="Sorties du processus"
                      rows={2}
                      autoSize={{ minRows: 2, maxRows: 4 }}
                    />
                  </div>

                  <div>
                    <Text strong style={{ fontSize: 12, color: "#595959", display: "block", marginBottom: 6 }}>
                      Processus Client
                    </Text>
                    <Input
                      value={row.processusClient || ""}
                      onChange={(e) => updateRow(idx, { processusClient: e.target.value })}
                      placeholder="Processus en aval"
                      size="large"
                    />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Message si aucune ligne */}
      {data.length === 0 && (
        <Card style={{ textAlign: "center", padding: 40, border: "2px dashed #d9d9d9" }}>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Aucune ligne SIPOC. Cliquez sur "Ajouter une ligne" pour commencer.
          </Text>
        </Card>
      )}

      {/* Footer avec actions */}
      {data.length > 0 && (
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {data.filter((r) => isValidRow(r)).length} / {data.length} lignes valides
          </Text>
          <Space>
            <Button icon={<PlusOutlined />} onClick={add}>
              Ajouter une ligne
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={save} loading={saving} size="large">
              Enregistrer SIPOC
            </Button>
          </Space>
        </div>
      )}
    </div>
  );
}
