import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Input, InputNumber, Popconfirm, Space, Tag, Tooltip, Typography } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
      if (r.activitePhase || r.designationProcessus) return r;
      return {
        ...r,
        designationProcessus: r.designation,
        activitePhase: r.designation,
        sortiesProcessus: r.sorties,
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

  // Track whether change is internal (user edit) vs external (props change)
  const isInternalChange = useRef(false);

  // Sync internal state when props change (external)
  useEffect(() => {
    if (!isInternalChange.current) {
      setGroups(initialGroups);
    }
    isInternalChange.current = false;
  }, [initialGroups]);

  // Notify parent of internal changes via useEffect (not during render)
  useEffect(() => {
    if (isInternalChange.current && props.onChange) {
      const phases: SipocPhase[] = groups.map((g) => ({
        key: g.key,
        name: g.name,
        rows: g.rows,
      }));
      props.onChange(phases);
      isInternalChange.current = false;
    }
  }, [groups, props.onChange]);

  // Helper to update a phase field (key or name)
  const updatePhase = useCallback(
    (phaseIndex: number, field: "key" | "name", value: string) => {
      if (readOnly) return;
      setGroups((prev) => {
        const newGroups = prev.map((g, pi) => {
          if (pi !== phaseIndex) return g;
          return { ...g, [field]: value };
        });
        isInternalChange.current = true;
        return newGroups;
      });
    },
    [readOnly]
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
      isInternalChange.current = true;
      return newGroups;
    });
  }, [readOnly]);

  // Helper to delete a phase
  const deletePhase = useCallback(
    (phaseIndex: number) => {
      if (readOnly) return;
      setGroups((prev) => {
        const newGroups = prev.filter((_, pi) => pi !== phaseIndex);
        isInternalChange.current = true;
        return newGroups;
      });
    },
    [readOnly]
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
                numero: String(newRowIndex),
                phase: g.name,
                processusFournisseur: "",
                entrees: "",
                ressources: "",
                raciR: "",
                raciA: "",
                raciC: "",
                raciI: "",
                designation: { name: "", url: "" },
                designationProcessus: { name: "", url: "" },
                sorties: "",
                sortiesProcessus: "",
                processusClient: "",
                designationProcessusClient: "",
              },
            ],
          };
        });
        isInternalChange.current = true;
        return newGroups;
      });
    },
    [readOnly]
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
        isInternalChange.current = true;
        return newGroups;
      });
    },
    [readOnly]
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
        isInternalChange.current = true;
        return newGroups;
      });
    },
    [readOnly]
  );

  // Helper to update designation subfield
  const updateDesignation = useCallback(
    (
      phaseIndex: number,
      rowIndex: number,
      field: "designation",
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
        isInternalChange.current = true;
        return newGroups;
      });
    },
    [readOnly]
  );

  const isFocused = (r: SipocRow) => {
    if (!focusKey) return false;
    const num = String(r?.numero ?? "");
    const activiteName = String(
      r?.activitePhase?.name || r?.designation?.name || ""
    );
    return (
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
            className="sipoc-link"
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
        className="sipoc-link"
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
              "designation",
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
              "designation",
              "url",
              e.target.value
            )
          }
        />
      </Space>
    );
  };

  return (
    <div className="sipoc-table-container">
      <table className="sipoc-table">
        {/* Header */}
        <thead>
          {/* Row 1: Main columns with title in center */}
          <tr className="sipoc-header-row-main">
            <th rowSpan={3} className="sipoc-th sipoc-col-fournisseur">Processus fournisseur</th>
            <th colSpan={5} className="sipoc-th sipoc-col-activite-header">{props.title}</th>
            <th rowSpan={3} className="sipoc-th sipoc-col-client">Processus client</th>
          </tr>
          {/* Row 2: Activite label */}
          <tr className="sipoc-header-row-sub">
            <th colSpan={5} className="sipoc-th sipoc-sub-activite">Activite</th>
          </tr>
          {/* Row 3: Sub-columns */}
          <tr className="sipoc-header-row-cols">
            <th className="sipoc-th sipoc-col-entrees">Entrees</th>
            <th className="sipoc-th sipoc-col-numero">N</th>
            <th className="sipoc-th sipoc-col-ressources">Ressources</th>
            <th className="sipoc-th sipoc-col-designation">Designation</th>
            <th className="sipoc-th sipoc-col-sorties">Sorties</th>
          </tr>
        </thead>

        {/* Body - grouped by phases */}
        <tbody>
          {groups.map((ph, phaseIndex) => (
            <>
              {/* Phase header row */}
              <tr key={`phase-header-${ph.key}`} className="sipoc-phase-row">
                <td colSpan={7} className="sipoc-phase-cell">
                  {readOnly ? (
                    <span className="sipoc-phase-title">{ph.name || "Phase"}</span>
                  ) : (
                    <div className="sipoc-phase-edit">
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
                    </div>
                  )}
                </td>
              </tr>

              {/* Data rows for this phase */}
              {(ph.rows || []).map((r, rowIndex) => (
                <tr
                  key={`${ph.key}-${rowIndex}`}
                  className={`sipoc-data-row ${isFocused(r) ? "sipoc-row-focused" : ""}`}
                >
                  {/* Processus fournisseur */}
                  {/* Processus fournisseur */}
                  <td className="sipoc-td sipoc-col-fournisseur">
                    {readOnly ? (
                      renderCell(
                        r?.processusFournisseur,
                        phaseIndex,
                        rowIndex,
                        "processusFournisseur",
                        "Processus fournisseur"
                      )
                    ) : (
                      <Space>
                        {renderCell(
                          r?.processusFournisseur,
                          phaseIndex,
                          rowIndex,
                          "processusFournisseur",
                          "Processus fournisseur"
                        )}
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
                  </td>

                  {/* Entrees */}
                  <td className="sipoc-td sipoc-col-entrees">
                    {readOnly ? (
                      <Typography.Text type="secondary">{r?.entrees}</Typography.Text>
                    ) : (
                      <Input.TextArea
                        size="small"
                        value={r?.entrees || ""}
                        placeholder="Entrees"
                        autoSize={{ minRows: 1, maxRows: 3 }}
                        onChange={(e) =>
                          updateRow(phaseIndex, rowIndex, "entrees", e.target.value)
                        }
                      />
                    )}
                  </td>

                  {/* Numero */}
                  <td className="sipoc-td sipoc-col-numero">
                    {readOnly ? (
                      <Tag color="default" style={{ margin: 0 }}>
                        {r?.numero}
                      </Tag>
                    ) : (
                      <InputNumber
                        size="small"
                        value={String(r?.numero || "")}
                        placeholder="N"
                        onChange={(e) =>
                          updateRow(phaseIndex, rowIndex, "numero", e?.toString() || "")
                        }
                      />
                    )}
                  </td>

                  {/* Ressources / RACI */}
                  <td className="sipoc-td sipoc-col-ressources">
                    {readOnly ? (
                      <Typography.Text>{r?.raciR || r?.ressources}</Typography.Text>
                    ) : (
                      <div className="sipoc-raci-edit">
                        <div className="sipoc-raci-row">
                          <Tag color="green">R</Tag>
                          <Input
                            size="small"
                            value={r?.raciR || ""}
                            placeholder="Responsable"
                            onChange={(e) =>
                              updateRow(phaseIndex, rowIndex, "raciR", e.target.value)
                            }
                          />
                        </div>
                        <div className="sipoc-raci-row">
                          <Tag color="red">A</Tag>
                          <Input
                            size="small"
                            value={r?.raciA || ""}
                            placeholder="Approbateur"
                            onChange={(e) =>
                              updateRow(phaseIndex, rowIndex, "raciA", e.target.value)
                            }
                          />
                        </div>
                        <div className="sipoc-raci-row">
                          <Tag color="blue">C</Tag>
                          <Input
                            size="small"
                            value={r?.raciC || ""}
                            placeholder="Consulte"
                            onChange={(e) =>
                              updateRow(phaseIndex, rowIndex, "raciC", e.target.value)
                            }
                          />
                        </div>
                        <div className="sipoc-raci-row">
                          <Tag color="gold">I</Tag>
                          <Input
                            size="small"
                            value={r?.raciI || ""}
                            placeholder="Informe"
                            onChange={(e) =>
                              updateRow(phaseIndex, rowIndex, "raciI", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Designation */}
                  <td className="sipoc-td sipoc-col-designation">
                    {renderDesignationCell(
                      r?.designationProcessus || r?.designation,
                      phaseIndex,
                      rowIndex
                    )}
                  </td>

                  {/* Sorties */}
                  <td className="sipoc-td sipoc-col-sorties">
                    {readOnly ? (
                      <Typography.Text>{r?.sortiesProcessus || r?.sorties}</Typography.Text>
                    ) : (
                      <Input.TextArea
                        size="small"
                        value={r?.sortiesProcessus || r?.sorties || ""}
                        placeholder="Sorties"
                        autoSize={{ minRows: 1, maxRows: 3 }}
                        onChange={(e) =>
                          updateRow(phaseIndex, rowIndex, "sortiesProcessus", e.target.value)
                        }
                      />
                    )}
                  </td>

                  {/* Processus client */}
                  <td className="sipoc-td sipoc-col-client">
                    {renderCell(
                      r?.designationProcessusClient || r?.processusClient,
                      phaseIndex,
                      rowIndex,
                      "designationProcessusClient",
                      "Processus client"
                    )}
                  </td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>

      {/* Bouton ajouter phase (mode edition uniquement) */}
      {!readOnly && (
        <div className="sipoc-add-phase">
          <Button type="dashed" icon={<PlusOutlined />} onClick={addPhase} block>
            Ajouter une phase
          </Button>
        </div>
      )}
    </div>
  );
}
