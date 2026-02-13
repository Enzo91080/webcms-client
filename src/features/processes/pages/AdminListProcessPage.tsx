import { Form } from "antd";
import { useMemo, useState } from "react";

import { getPilotName } from "../components";
import { buildProcessColumns } from "../components/processColumns";
import { ProcessesToolbar } from "../components/ProcessesToolbar";
import { ProcessesTable } from "../components/ProcessesTable";
import { ProcessDrawer } from "../components/ProcessDrawer/ProcessDrawer";
import { buildProcessTree } from "../utils/tree";

import {
  useAdminProcesses,
  usePilotOptions,
  useStakeholderOptions,
} from "../../../shared/hooks";
import { useStakeholderLinks } from "../hooks/useStakeholderLinks";
import { useProcessEditor } from "../hooks/useProcessEditor";

// ============================================================================
// Component
// ============================================================================

export default function AdminProcessesPage() {
  // ----------------------------
  // Data hooks
  // ----------------------------
  const { items, loading, reload } = useAdminProcesses();
  const { options: pilotOptions } = usePilotOptions();
  const { options: stakeholderOptions, byId: stakeholdersById } = useStakeholderOptions();

  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [form] = Form.useForm();

  // ----------------------------
  // Stakeholder links
  // ----------------------------
  const {
    stakeholderLinks,
    setStakeholderLinks,
    showAdvancedStakeholders,
    setShowAdvancedStakeholders,
    handleStakeholderSelection,
    updateLinkField,
  } = useStakeholderLinks(form, stakeholdersById);

  // ----------------------------
  // Process editor (CRUD + Drawer state)
  // ----------------------------
  const {
    open,
    setOpen,
    editing,
    setEditing,
    activeTab,
    setActiveTab,
    openCreate,
    openEdit,
    saveBase,
    doDelete,
  } = useProcessEditor({
    form,
    reload,
    stakeholderLinks,
    setStakeholderLinks,
    showAdvancedStakeholders,
    setShowAdvancedStakeholders,
  });

  // ----------------------------
  // Derived data
  // ----------------------------
  const parentOptions = useMemo(() => {
    const sorted = [...items].sort((a, b) => String(a.code).localeCompare(String(b.code)));
    return [
      { value: "", label: "(Racine)" },
      ...sorted.map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` })),
    ];
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;

    if (typeFilter) {
      result = result.filter((p) => p.processType === typeFilter);
    }

    const query = q.trim().toLowerCase();
    if (query) {
      result = result.filter((p) => {
        const hay = [
          p.code,
          p.name,
          ...(Array.isArray(p.pilots) ? p.pilots.map((x) => getPilotName(x)) : []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return hay.includes(query);
      });
    }

    return result;
  }, [items, q, typeFilter]);

  const treeData = useMemo(() => buildProcessTree(filteredItems), [filteredItems]);

  const columns = useMemo(
    () => buildProcessColumns({ items, onEdit: openEdit, onDelete: doDelete }),
    [items]
  );

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <div style={{ padding: 16 }}>
      <ProcessesToolbar
        q={q}
        onQChange={setQ}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        countDisplayed={filteredItems.length}
        loading={loading}
        onCreate={openCreate}
        onReload={reload}
      />

      <ProcessesTable columns={columns} data={treeData} loading={loading} />

      <ProcessDrawer
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        setEditing={setEditing}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        form={form}
        parentOptions={parentOptions}
        pilotOptions={pilotOptions}
        stakeholderOptions={stakeholderOptions}
        stakeholderLinks={stakeholderLinks}
        onStakeholderSelection={handleStakeholderSelection}
        onUpdateLinkField={updateLinkField}
        showAdvancedStakeholders={showAdvancedStakeholders}
        onShowAdvancedStakeholdersChange={setShowAdvancedStakeholders}
        onSave={saveBase}
        items={items}
      />
    </div>
  );
}
