import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Col, Input, Popconfirm, Row, Space, Tag, Tooltip, Typography } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SipocRow, SipocPhase, Designation } from "../../types/sipoc";
import "./SipocVisioTable.css";

type SipocVisioTableProps = {
  title: string;
  /** @deprecated Use phases instead */
  rows?: SipocRow[];
  phases?: SipocPhase[];
  focusRef?: string | null;
  /** If false, cells are editable. Default: true */
  readOnly?: boolean;
  /** Called when phases change (only when readOnly=false) */
  onChange?: (phases: SipocPhase[]) => void;
};

type InternalGroup = {
  key: string;
  name: string;
  rows: SipocRow[];
};

export function SipocVisioTable(props: SipocVisioTableProps) {
  const navigate = useNavigate();
  const readOnly = props.readOnly ?? true;

  const focusKey = (props.focusRef ?? "").trim();
  const rows = useMemo(() => props.rows ?? [], [props.rows]);

  // Adapter les donnees de l'ancien format vers le nouveau format
  const adaptedRows = useMemo(() => {
    return rows.map((r) => {
      if (r.activitePhase || r.designationProcessusVendre) return r;
      return {
        ...r,
        designationProcessusVendre: r.designation,
        activitePhase: r.designation,
        sortiesProcessusVendre: r.sorties,
        designationProcessusClient: r.processusClient,
        sortiesProcessusClient: r.sortiesProcessusClient || "",
      };
    });
  }, [rows]);

  // Build groups from phases or rows
  const initialGroups = useMemo((): InternalGroup[] => {
    if (Array.isArray(props.phases) && props.phases.length) {
      return props.phases.map((p, idx) => ({
        key: String(p.key || `phase-${idx}`),
        name: String(p.name || `Phase ${idx + 1}`),
        rows: (Array.isArray(p.rows) ? p.rows : []).map((r) => ({
          ...r,
          phase: r.phase || p.name,
        })),
      }));
    }

    const order: string[] = [];
    const map = new Map<string, SipocRow[]>();
    for (const r of adaptedRows) {
      const name = String(r.phase || "Phase unique");
      if (!map.has(name)) {
        map.set(name, []);
        order.push(name);
      }
      map.get(name)!.push({ ...r, phase: name });
    }
    return order.map((name, idx) => ({
      key: String(idx),
      name,
      rows: map.get(name) || [],
    }));
  }, [adaptedRows, props.phases]);

  // Internal state for editable mode
  const [groups, setGroups] = useState<InternalGroup[]>(initialGroups);

  // Sync internal state when props change
  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  // Helper to notify parent of changes
  const notifyChange = useCallback(
    (newGroups: InternalGroup[]) => {
      const phases: SipocPhase[] = newGroups.map((g) => ({
        key: g.key,
        name: g.name,
        rows: g.rows,
      }));
      props.onChange?.(phases);
    },
    [props.onChange]
  );

  // Helper to update a phase field (key or name)
  const updatePhase = useCallback(
    (phaseIndex: number, field: "key" | "name", value: string) => {
      if (readOnly) return;

      setGroups((prev) => {
        const newGroups = prev.map((g, pi) => {
          if (pi !== phaseIndex) return g;
          return { ...g, [field]: value };
        });
        notifyChange(newGroups);
        return newGroups;
      });
    },
    [readOnly, notifyChange]
  );

  // Helper to add a new phase
  const addPhase = useCallback(() => {
    if (readOnly) return;

    setGroups((prev) => {
      const newIndex = prev.length + 1;
      const newGroups = [
        ...prev,
        {
          key: `phase-${newIndex}`,
          name: `Phase ${newIndex}`,
          rows: [],
        },
      ];
      notifyChange(newGroups);
      return newGroups;
    });
  }, [readOnly, notifyChange]);

  // Helper to delete a phase
  const deletePhase = useCallback(
    (phaseIndex: number) => {
      if (readOnly) return;

      setGroups((prev) => {
        const newGroups = prev.filter((_, pi) => pi !== phaseIndex);
        notifyChange(newGroups);
        return newGroups;
      });
    },
    [readOnly, notifyChange]
  );

  // Helper to add a row to a phase
  const addRow = useCallback(
    (phaseIndex: number) => {
      if (readOnly) return;

      setGroups((prev) => {
        const newGroups = prev.map((g, pi) => {
          if (pi !== phaseIndex) return g;
          const newRowIndex = g.rows.length + 1;
          return {
            ...g,
            rows: [
              ...g.rows,
              {
                ref: `REF-${newRowIndex}`,
                numero: String(newRowIndex),
                phase: g.name,
                processusFournisseur: "",
                entrees: "",
                ressources: "",
                designation: { name: "", url: "" },
                designationProcessusVendre: { name: "", url: "" },
                sorties: "",
                sortiesProcessusVendre: "",
                processusClient: "",
                designationProcessusClient: "",
              },
            ],
          };
        });
        notifyChange(newGroups);
        return newGroups;
      });
    },
    [readOnly, notifyChange]
  );

  // Helper to delete a row
  const deleteRow = useCallback(
    (phaseIndex: number, rowIndex: number) => {
      if (readOnly) return;

      setGroups((prev) => {
        const newGroups = prev.map((g, pi) => {
          if (pi !== phaseIndex) return g;
          return {
            ...g,
            rows: g.rows.filter((_, ri) => ri !== rowIndex),
          };
        });
        notifyChange(newGroups);
        return newGroups;
      });
    },
    [readOnly, notifyChange]
  );

  // Helper to update a row field
  const updateRow = useCallback(
    (phaseIndex: number, rowIndex: number, field: keyof SipocRow, value: any) => {
      if (readOnly) return;

      setGroups((prev) => {
        const newGroups = prev.map((g, pi) => {
          if (pi !== phaseIndex) return g;
          return {
            ...g,
            rows: g.rows.map((r, ri) => {
              if (ri !== rowIndex) return r;
              return { ...r, [field]: value };
            }),
          };
        });
        notifyChange(newGroups);
        return newGroups;
      });
    },
    [readOnly, notifyChange]
  );

  // Helper to update designation subfield
  const updateDesignation = useCallback(
    (
      phaseIndex: number,
      rowIndex: number,
      field: "designationProcessusVendre" | "designation",
      subField: keyof Designation,
      value: string
    ) => {
      if (readOnly) return;

      setGroups((prev) => {
        const newGroups = prev.map((g, pi) => {
          if (pi !== phaseIndex) return g;
          return {
            ...g,
            rows: g.rows.map((r, ri) => {
              if (ri !== rowIndex) return r;
              const currentDesignation = (r[field] as Designation) || {};
              return {
                ...r,
                [field]: {
                  ...currentDesignation,
                  [subField]: value,
                },
              };
            }),
          };
        });
        notifyChange(newGroups);
        return newGroups;
      });
    },
    [readOnly, notifyChange]
  );

  const isFocused = (r: SipocRow) => {
    if (!focusKey) return false;
    const ref = String(r?.ref || "");
    const num = String(r?.numero ?? "");
    const activiteName = String(
      r?.activitePhase?.name || r?.designation?.name || ""
    );
    return (
      ref === focusKey ||
      num === focusKey ||
      activiteName.toLowerCase() === focusKey.toLowerCase()
    );
  };

  const resolveDesignationUrl = (designation?: Designation): string | null => {
    if (!designation) return null;
    const t = designation?.target;
    if (t?.type === "url") return t.url;
    if (t?.type === "process") return `/process/${t.processId}`;
    if (designation?.url) return designation.url;
    return null;
  };

  const renderDesignation = (designation?: Designation) => {
    if (!designation) return null;
    const url = resolveDesignationUrl(designation);
    const label = (designation?.name || url || "") as string;

    if (!url) return label || null;

    if (url.startsWith("/process/")) {
      return (
        <Tooltip title="Ouvrir le processus">
          <a
            className="text-[#2563eb] font-bold underline hover:text-[#1d4ed8] cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              navigate(url);
            }}
          >
            {label}
          </a>
        </Tooltip>
      );
    }

    return (
      <a
        className="text-[#2563eb] font-bold underline hover:text-[#1d4ed8]"
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        {label}
      </a>
    );
  };

  // Editable cell renderer
  const renderCell = (
    value: string | undefined,
    phaseIndex: number,
    rowIndex: number,
    field: keyof SipocRow,
    placeholder?: string
  ) => {
    if (readOnly) {
      return <Typography.Text>{value}</Typography.Text>;
    }
    return (
      <Input
        size="small"
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => updateRow(phaseIndex, rowIndex, field, e.target.value)}
        style={{ width: "100%" }}
      />
    );
  };

  // Editable designation cell (name + url)
  const renderDesignationCell = (
    designation: Designation | undefined,
    phaseIndex: number,
    rowIndex: number
  ) => {
    if (readOnly) {
      return (
        renderDesignation(designation) || (
          <Typography.Text>
            {designation?.name && !designation.url && !designation.target
              ? designation.name
              : null}
          </Typography.Text>
        )
      );
    }

    return (
      <Space direction="vertical" size={4} style={{ width: "100%" }}>
        <Input
          size="small"
          value={designation?.name || ""}
          placeholder="Nom"
          onChange={(e) =>
            updateDesignation(
              phaseIndex,
              rowIndex,
              "designationProcessusVendre",
              "name",
              e.target.value
            )
          }
        />
        <Input
          size="small"
          value={designation?.url || ""}
          placeholder="URL"
          onChange={(e) =>
            updateDesignation(
              phaseIndex,
              rowIndex,
              "designationProcessusVendre",
              "url",
              e.target.value
            )
          }
        />
      </Space>
    );
  };

  return (
    <div className="sipoc-card-container">
      {/* Header Section */}
      <Card className="sipoc-header-card" bodyStyle={{ padding: 0 }}>
        <Row gutter={0} className="sipoc-header-row">
          <Col span={3} className="sipoc-header-col">
            <Typography.Text strong className="sipoc-header-text">
              Ref.
            </Typography.Text>
          </Col>
          <Col span={4} className="sipoc-header-col">
            <Typography.Text strong className="sipoc-header-text">
              Processus fournisseur
            </Typography.Text>
          </Col>
          <Col span={13} className="sipoc-header-col sipoc-header-processus">
            <div>
              <Typography.Text strong className="sipoc-header-text">
                {props.title}
              </Typography.Text>

              <div className="sipoc-sub-header">
                <Typography.Text strong className="sipoc-sub-header-text">
                  Activite
                </Typography.Text>
              </div>

              <Row gutter={0} className="sipoc-sub-sub-header">
                <Col span={5} className="sipoc-sub-header-col">
                  <Typography.Text strong className="sipoc-sub-header-text">
                    Entrees
                  </Typography.Text>
                </Col>
                <Col span={4} className="sipoc-sub-header-col">
                  <Typography.Text strong className="sipoc-sub-header-text">
                    N
                  </Typography.Text>
                </Col>
                <Col span={5} className="sipoc-sub-header-col">
                  <Typography.Text strong className="sipoc-sub-header-text">
                    Ressources
                  </Typography.Text>
                </Col>
                <Col span={5} className="sipoc-sub-header-col">
                  <Typography.Text strong className="sipoc-sub-header-text">
                    Designation
                  </Typography.Text>
                </Col>
                <Col span={5} className="sipoc-sub-header-col">
                  <Typography.Text strong className="sipoc-sub-header-text">
                    Sorties
                  </Typography.Text>
                </Col>
              </Row>

              <div className="sipoc-phase-header">
                <Typography.Text strong className="sipoc-phase-text">
                  Phase
                </Typography.Text>
              </div>
            </div>
          </Col>
          <Col span={4} className="sipoc-header-col">
            <Typography.Text strong className="sipoc-header-text">
              Processus client
            </Typography.Text>
          </Col>
        </Row>
      </Card>

      {/* Data Rows (groupees par phase) */}
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        {groups.map((ph, phaseIndex) => (
          <div key={ph.key || ph.name}>
            {/* Header de phase */}
            <Card
              className="sipoc-phase-card"
              bodyStyle={{ padding: "10px 16px" }}
              style={{ borderRadius: 12 }}
            >
              {readOnly ? (
                <Typography.Text strong className="sipoc-phase-title">
                  {ph.name || "Phase"}
                </Typography.Text>
              ) : (
                <Space style={{ width: "100%", justifyContent: "space-between" }}>
                  <Space>
                    <Input
                      size="small"
                      value={ph.key || ""}
                      placeholder="Key"
                      style={{ width: 100 }}
                      onChange={(e) => updatePhase(phaseIndex, "key", e.target.value)}
                    />
                    <Input
                      size="small"
                      value={ph.name || ""}
                      placeholder="Nom de la phase"
                      style={{ width: 250 }}
                      onChange={(e) => updatePhase(phaseIndex, "name", e.target.value)}
                    />
                  </Space>
                  <Space>
                    <Button
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => addRow(phaseIndex)}
                    >
                      Ligne
                    </Button>
                    <Popconfirm
                      title="Supprimer cette phase ?"
                      description="Toutes les lignes de cette phase seront supprimees."
                      onConfirm={() => deletePhase(phaseIndex)}
                      okText="Supprimer"
                      cancelText="Annuler"
                      okButtonProps={{ danger: true }}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />}>
                        Phase
                      </Button>
                    </Popconfirm>
                  </Space>
                </Space>
              )}
            </Card>

            {/* Lignes de la phase */}
            <Space direction="vertical" size={0} style={{ width: "100%" }}>
              {(ph.rows || []).map((r, rowIndex) => (
                <Card
                  key={String(r?.ref || `${ph.key}-${rowIndex}`)}
                  className={`sipoc-row-card ${isFocused(r) ? "sipoc-row-focused" : ""}`}
                  bodyStyle={{ padding: "12px 16px" }}
                >
                  <Row gutter={16} align="middle">
                    <Col span={3}>
                      {readOnly ? (
                        <Tag color="blue" style={{ margin: 0, fontWeight: 600 }}>
                          {r?.ref}
                        </Tag>
                      ) : (
                        <Space>
                          <Input
                            size="small"
                            value={r?.ref || ""}
                            placeholder="Ref"
                            style={{ width: 80 }}
                            onChange={(e) =>
                              updateRow(phaseIndex, rowIndex, "ref", e.target.value)
                            }
                          />
                          <Popconfirm
                            title="Supprimer cette ligne ?"
                            onConfirm={() => deleteRow(phaseIndex, rowIndex)}
                            okText="Supprimer"
                            cancelText="Annuler"
                            okButtonProps={{ danger: true }}
                          >
                            <Button
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              style={{ minWidth: 24, padding: "0 4px" }}
                            />
                          </Popconfirm>
                        </Space>
                      )}
                    </Col>

                    <Col span={4}>
                      {renderCell(
                        r?.processusFournisseur,
                        phaseIndex,
                        rowIndex,
                        "processusFournisseur",
                        "Processus fournisseur"
                      )}
                    </Col>

                    <Col span={13}>
                      <Row gutter={8}>
                        <Col span={5}>
                          {readOnly ? (
                            <Typography.Text type="secondary">
                              {r?.entrees}
                            </Typography.Text>
                          ) : (
                            <Input.TextArea
                              size="small"
                              value={r?.entrees || ""}
                              placeholder="Entrees"
                              autoSize={{ minRows: 1, maxRows: 3 }}
                              onChange={(e) =>
                                updateRow(
                                  phaseIndex,
                                  rowIndex,
                                  "entrees",
                                  e.target.value
                                )
                              }
                            />
                          )}
                        </Col>

                        <Col span={4} style={{ textAlign: "center" }}>
                          {readOnly ? (
                            <Tag color="default" style={{ margin: 0 }}>
                              {r?.numero}
                            </Tag>
                          ) : (
                            <Input
                              size="small"
                              value={String(r?.numero || "")}
                              placeholder="N"
                              onChange={(e) =>
                                updateRow(
                                  phaseIndex,
                                  rowIndex,
                                  "numero",
                                  e.target.value
                                )
                              }
                            />
                          )}
                        </Col>

                        <Col span={5}>
                          {readOnly ? (
                            <Typography.Text>{r?.ressources}</Typography.Text>
                          ) : (
                            <Input.TextArea
                              size="small"
                              value={r?.ressources || ""}
                              placeholder="Ressources"
                              autoSize={{ minRows: 1, maxRows: 3 }}
                              onChange={(e) =>
                                updateRow(
                                  phaseIndex,
                                  rowIndex,
                                  "ressources",
                                  e.target.value
                                )
                              }
                            />
                          )}
                        </Col>

                        <Col span={5}>
                          {renderDesignationCell(
                            r?.designationProcessusVendre || r?.designation,
                            phaseIndex,
                            rowIndex
                          )}
                        </Col>

                        <Col span={5}>
                          {readOnly ? (
                            <Typography.Text>
                              {r?.sortiesProcessusVendre || r?.sorties}
                            </Typography.Text>
                          ) : (
                            <Input.TextArea
                              size="small"
                              value={r?.sortiesProcessusVendre || r?.sorties || ""}
                              placeholder="Sorties"
                              autoSize={{ minRows: 1, maxRows: 3 }}
                              onChange={(e) =>
                                updateRow(
                                  phaseIndex,
                                  rowIndex,
                                  "sortiesProcessusVendre",
                                  e.target.value
                                )
                              }
                            />
                          )}
                        </Col>
                      </Row>
                    </Col>

                    <Col span={4}>
                      {renderCell(
                        r?.designationProcessusClient || r?.processusClient,
                        phaseIndex,
                        rowIndex,
                        "designationProcessusClient",
                        "Processus client"
                      )}
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>
          </div>
        ))}
      </Space>

      {/* Bouton ajouter phase (mode edition uniquement) */}
      {!readOnly && (
        <div style={{ marginTop: 16 }}>
          <Button type="dashed" icon={<PlusOutlined />} onClick={addPhase} block>
            Ajouter une phase
          </Button>
        </div>
      )}
    </div>
  );
}
