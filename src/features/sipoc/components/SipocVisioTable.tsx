import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Input,
  Popconfirm,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Designation, SipocPhase, SipocRow } from "../../../shared/types/sipoc";
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

  const updatePhase = useCallback(
    (phaseIndex: number, field: "key" | "name", value: string) => {
      if (readOnly) return;
      setGroups((prev) => {
        const next = prev.map((g, pi) =>
          pi === phaseIndex ? { ...g, [field]: value } : g
        );
        isInternalChange.current = true;
        return next;
      });
    },
    [readOnly]
  );

  const addPhase = useCallback(() => {
    if (readOnly) return;
    setGroups((prev) => {
      const newIndex = prev.length + 1;
      const next = [
        ...prev,
        { key: `phase-${newIndex}`, name: `Phase ${newIndex}`, rows: [] },
      ];
      isInternalChange.current = true;
      return next;
    });
  }, [readOnly]);

  const deletePhase = useCallback(
    (phaseIndex: number) => {
      if (readOnly) return;
      setGroups((prev) => {
        const next = prev.filter((_, pi) => pi !== phaseIndex);
        isInternalChange.current = true;
        return next;
      });
    },
    [readOnly]
  );

  const addRow = useCallback(
    (phaseIndex: number) => {
      if (readOnly) return;
      setGroups((prev) => {
        const next = prev.map((g, pi) => {
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
        return next;
      });
    },
    [readOnly]
  );

  const deleteRow = useCallback(
    (phaseIndex: number, rowIndex: number) => {
      if (readOnly) return;
      setGroups((prev) => {
        const next = prev.map((g, pi) => {
          if (pi !== phaseIndex) return g;
          return { ...g, rows: g.rows.filter((_, ri) => ri !== rowIndex) };
        });
        isInternalChange.current = true;
        return next;
      });
    },
    [readOnly]
  );

  const updateRow = useCallback(
    (phaseIndex: number, rowIndex: number, field: keyof SipocRow, value: any) => {
      if (readOnly) return;
      setGroups((prev) => {
        const next = prev.map((g, pi) => {
          if (pi !== phaseIndex) return g;
          return {
            ...g,
            rows: g.rows.map((r, ri) =>
              ri === rowIndex ? { ...r, [field]: value } : r
            ),
          };
        });
        isInternalChange.current = true;
        return next;
      });
    },
    [readOnly]
  );

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
        const next = prev.map((g, pi) => {
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
        return next;
      });
    },
    [readOnly]
  );

  const isFocused = (r: SipocRow) => {
    if (!focusKey) return false;
    const num = String(r?.numero ?? "");
    const activiteName = String(r?.activitePhase?.name || r?.designation?.name || "");
    return num === focusKey || activiteName.toLowerCase() === focusKey.toLowerCase();
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
      <a className="sipoc-link" href={url} target="_blank" rel="noreferrer">
        {label}
      </a>
    );
  };

  // NEW: TextArea renderer everywhere
  const renderTextAreaCell = (
    value: string | undefined,
    phaseIndex: number,
    rowIndex: number,
    field: keyof SipocRow,
    placeholder?: string,
    minRows = 1,
    maxRows = 4
  ) => {
    if (readOnly) return <Typography.Text>{value}</Typography.Text>;
    return (
      <Input.TextArea
        size="small"
        value={value || ""}
        placeholder={placeholder}
        autoSize={{ minRows, maxRows }}
        onChange={(e) => updateRow(phaseIndex, rowIndex, field, e.target.value)}
      />
    );
  };

  // NEW: designation editor as TextAreas
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
        <Input.TextArea
          size="small"
          value={designation?.name || ""}
          placeholder="Nom"
          autoSize={{ minRows: 1, maxRows: 2 }}
          onChange={(e) =>
            updateDesignation(phaseIndex, rowIndex, "designation", "name", e.target.value)
          }
        />
        <Input.TextArea
          size="small"
          value={designation?.url || ""}
          placeholder="URL"
          autoSize={{ minRows: 1, maxRows: 2 }}
          onChange={(e) =>
            updateDesignation(phaseIndex, rowIndex, "designation", "url", e.target.value)
          }
        />
      </Space>
    );
  };

  return (
    <div className="sipoc-table-container">
      <div className="sipoc-table-scroll">
        <table className="sipoc-table">
          <thead>
            <tr className="sipoc-header-row-main">
              <th rowSpan={3} className="sipoc-th sipoc-col-fournisseur">
                Processus fournisseur
              </th>
              <th colSpan={5} className="sipoc-th sipoc-col-activite-header">
                {props.title}
              </th>
              <th rowSpan={3} className="sipoc-th sipoc-col-client">
                Processus client
              </th>
            </tr>

            <tr className="sipoc-header-row-sub">
              <th colSpan={5} className="sipoc-th sipoc-sub-activite">
                Activite
              </th>
            </tr>

            <tr className="sipoc-header-row-cols">
              <th className="sipoc-th sipoc-col-entrees">Entrees</th>
              <th className="sipoc-th sipoc-col-numero">N</th>
              <th className="sipoc-th sipoc-col-ressources">Ressources</th>
              <th className="sipoc-th sipoc-col-designation">Designation</th>
              <th className="sipoc-th sipoc-col-sorties">Sorties</th>
            </tr>
          </thead>

          <tbody>
            {groups.map((ph, phaseIndex) => (
              <>
                <tr key={`phase-header-${ph.key}`} className="sipoc-phase-row">
                  <td colSpan={7} className="sipoc-phase-cell">
                    {readOnly ? (
                      <span className="sipoc-phase-title">{ph.name || "Phase"}</span>
                    ) : (
                      <div className="sipoc-phase-edit">
                        <Space>
                          <Input.TextArea
                            size="small"
                            value={ph.key || ""}
                            placeholder="Key"
                            autoSize={{ minRows: 1, maxRows: 2 }}
                            style={{ width: 140 }}
                            onChange={(e) => updatePhase(phaseIndex, "key", e.target.value)}
                          />
                          <Input.TextArea
                            size="small"
                            value={ph.name || ""}
                            placeholder="Nom de la phase"
                            autoSize={{ minRows: 1, maxRows: 2 }}
                            style={{ width: 320 }}
                            onChange={(e) => updatePhase(phaseIndex, "name", e.target.value)}
                          />
                        </Space>

                        <Space>
                          <Button size="small" icon={<PlusOutlined />} onClick={() => addRow(phaseIndex)}>
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

                {(ph.rows || []).map((r, rowIndex) => (
                  <tr
                    key={`${ph.key}-${rowIndex}`}
                    className={`sipoc-data-row ${isFocused(r) ? "sipoc-row-focused" : ""}`}
                  >
                    {/* Processus fournisseur */}
                    <td className="sipoc-td sipoc-col-fournisseur">
                      {readOnly ? (
                        <Typography.Text>{r?.processusFournisseur}</Typography.Text>
                      ) : (
                        <Space>
                          {renderTextAreaCell(
                            r?.processusFournisseur,
                            phaseIndex,
                            rowIndex,
                            "processusFournisseur",
                            "Processus fournisseur",
                            1,
                            3
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
                      {renderTextAreaCell(r?.entrees, phaseIndex, rowIndex, "entrees", "Entrees", 1, 4)}
                    </td>

                    {/* Numero -> TextArea */}
                    <td className="sipoc-td sipoc-col-numero">
                      {readOnly ? (
                        <Tag color="default" style={{ margin: 0 }}>
                          {r?.numero}
                        </Tag>
                      ) : (
                        renderTextAreaCell(
                          r?.numero ? String(r.numero) : "",
                          phaseIndex,
                          rowIndex,
                          "numero",
                          "N",
                          1,
                          2
                        )
                      )}
                    </td>

                    {/* Ressources / RACI -> TextAreas */}
                    <td className="sipoc-td sipoc-col-ressources">
                      {readOnly ? (
                        (() => {
                          const R = r?.raciR?.trim();
                          const A = r?.raciA?.trim();
                          const C = r?.raciC?.trim();
                          const I = r?.raciI?.trim();

                          const hasRaci = R || A || C || I;

                          // Render a RACI block as a table row with tag cell + content cell
                          const renderRaciBlock = (
                            letter: string,
                            content: string,
                            color: "green" | "red" | "blue" | "gold"
                          ) => {
                            const lines = content.split("\n").filter((l) => l.trim());
                            if (lines.length === 0) return null;

                            return (
                              <div className="sipoc-raci-block">
                                <div className="sipoc-raci-block-tag">
                                  <Tag color={color}>{letter}</Tag>
                                </div>
                                <div className="sipoc-raci-block-content">
                                  {lines.map((line, idx) => (
                                    <div key={idx}>{line}</div>
                                  ))}
                                </div>
                              </div>
                            );
                          };

                          if (hasRaci) {
                            return (
                              <div className="sipoc-raci-read">
                                {R && renderRaciBlock("R", R, "green")}
                                {A && renderRaciBlock("A", A, "red")}
                                {C && renderRaciBlock("C", C, "blue")}
                                {I && renderRaciBlock("I", I, "gold")}
                              </div>
                            );
                          }

                          // fallback ancien champ
                          return r?.ressources ? (
                            <Typography.Text style={{ whiteSpace: "pre-line" }}>{r.ressources}</Typography.Text>
                          ) : (
                            <Typography.Text type="secondary">—</Typography.Text>
                          );
                        })()
                      ) : (
                        <div className="sipoc-raci-edit">
                          <div className="sipoc-raci-row">
                            <Tag color="green">R</Tag>
                            <Input.TextArea
                              size="small"
                              value={r?.raciR || ""}
                              placeholder="Responsable"
                              autoSize={{ minRows: 1, maxRows: 2 }}
                              onChange={(e) => updateRow(phaseIndex, rowIndex, "raciR", e.target.value)}
                            />
                          </div>
                          <div className="sipoc-raci-row">
                            <Tag color="red">A</Tag>
                            <Input.TextArea
                              size="small"
                              value={r?.raciA || ""}
                              placeholder="Approbateur"
                              autoSize={{ minRows: 1, maxRows: 2 }}
                              onChange={(e) => updateRow(phaseIndex, rowIndex, "raciA", e.target.value)}
                            />
                          </div>
                          <div className="sipoc-raci-row">
                            <Tag color="blue">C</Tag>
                            <Input.TextArea
                              size="small"
                              value={r?.raciC || ""}
                              placeholder="Consulte"
                              autoSize={{ minRows: 1, maxRows: 2 }}
                              onChange={(e) => updateRow(phaseIndex, rowIndex, "raciC", e.target.value)}
                            />
                          </div>
                          <div className="sipoc-raci-row">
                            <Tag color="gold">I</Tag>
                            <Input.TextArea
                              size="small"
                              value={r?.raciI || ""}
                              placeholder="Informe"
                              autoSize={{ minRows: 1, maxRows: 2 }}
                              onChange={(e) => updateRow(phaseIndex, rowIndex, "raciI", e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </td>


                    {/* Designation */}
                    <td className="sipoc-td sipoc-col-designation">
                      {renderDesignationCell(r?.designationProcessus || r?.designation, phaseIndex, rowIndex)}
                    </td>

                    {/* Sorties */}
                    <td className="sipoc-td sipoc-col-sorties">
                      {renderTextAreaCell(
                        r?.sortiesProcessus || r?.sorties,
                        phaseIndex,
                        rowIndex,
                        "sortiesProcessus",
                        "Sorties",
                        1,
                        4
                      )}
                    </td>

                    {/* Processus client */}
                    <td className="sipoc-td sipoc-col-client">
                      {renderTextAreaCell(
                        r?.designationProcessusClient || r?.processusClient,
                        phaseIndex,
                        rowIndex,
                        "designationProcessusClient",
                        "Processus client",
                        1,
                        3
                      )}
                    </td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

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
