import { Button, Form, Input, Select, Space } from "antd";
import {
  DeleteOutlined,
  UpOutlined,
  DownOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { ObjectiveBlock } from "../../../types";

type Props = {
  value?: ObjectiveBlock[];
  onChange?: (value: ObjectiveBlock[]) => void;
};

const blockTypeOptions = [
  { value: "text", label: "Texte" },
  { value: "bullets", label: "Liste \u00e0 puces" },
  { value: "numbered", label: "Liste num\u00e9rot\u00e9e" },
];

export default function ObjectivesBlocksEditor({ value = [], onChange }: Props) {
  const blocks = Array.isArray(value) ? value : [];

  const update = (newBlocks: ObjectiveBlock[]) => {
    onChange?.(newBlocks);
  };

  const addBlock = () => {
    update([...blocks, { type: "text", text: "" }]);
  };

  const removeBlock = (index: number) => {
    update(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    update(newBlocks);
  };

  const updateBlock = (index: number, block: ObjectiveBlock) => {
    const newBlocks = [...blocks];
    newBlocks[index] = block;
    update(newBlocks);
  };

  const changeBlockType = (index: number, newType: "text" | "bullets" | "numbered") => {
    const oldBlock = blocks[index];
    let newBlock: ObjectiveBlock;

    if (newType === "text") {
      if (oldBlock.type === "text") {
        newBlock = oldBlock;
      } else {
        newBlock = { type: "text", text: oldBlock.items.join("\n") };
      }
    } else {
      if (oldBlock.type === "text") {
        const lines = oldBlock.text.split("\n").filter((l) => l.trim());
        newBlock = { type: newType, items: lines.length ? lines : [""] };
      } else {
        newBlock = { type: newType, items: [...oldBlock.items] };
      }
    }

    updateBlock(index, newBlock);
  };

  const updateTextBlock = (index: number, text: string) => {
    updateBlock(index, { type: "text", text });
  };

  const updateListItem = (blockIndex: number, itemIndex: number, value: string) => {
    const block = blocks[blockIndex];
    if (block.type === "text") return;
    const newItems = [...block.items];
    newItems[itemIndex] = value;
    updateBlock(blockIndex, { ...block, items: newItems });
  };

  const addListItem = (blockIndex: number) => {
    const block = blocks[blockIndex];
    if (block.type === "text") return;
    updateBlock(blockIndex, { ...block, items: [...block.items, ""] });
  };

  const removeListItem = (blockIndex: number, itemIndex: number) => {
    const block = blocks[blockIndex];
    if (block.type === "text") return;
    const newItems = block.items.filter((_, i) => i !== itemIndex);
    updateBlock(blockIndex, { ...block, items: newItems.length ? newItems : [""] });
  };

  return (
    <div>
      {blocks.map((block, blockIndex) => (
        <div
          key={blockIndex}
          style={{
            border: "1px solid #d9d9d9",
            borderRadius: 6,
            padding: 12,
            marginBottom: 12,
            background: "#fafafa",
          }}
        >
          <Space style={{ marginBottom: 8, width: "100%", justifyContent: "space-between" }}>
            <Select
              value={block.type}
              options={blockTypeOptions}
              onChange={(t) => changeBlockType(blockIndex, t)}
              style={{ width: 160 }}
            />
            <Space>
              <Button
                size="small"
                icon={<UpOutlined />}
                disabled={blockIndex === 0}
                onClick={() => moveBlock(blockIndex, -1)}
              />
              <Button
                size="small"
                icon={<DownOutlined />}
                disabled={blockIndex === blocks.length - 1}
                onClick={() => moveBlock(blockIndex, 1)}
              />
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeBlock(blockIndex)}
              />
            </Space>
          </Space>

          {block.type === "text" ? (
            <Input.TextArea
              rows={3}
              value={block.text}
              onChange={(e) => updateTextBlock(blockIndex, e.target.value)}
              placeholder="Texte libre..."
            />
          ) : (
            <div>
              {block.items.map((item, itemIndex) => (
                <Space key={itemIndex} style={{ display: "flex", marginBottom: 4 }}>
                  <span style={{ width: 24, textAlign: "right", color: "#888" }}>
                    {block.type === "numbered" ? `${itemIndex + 1}.` : "\u2022"}
                  </span>
                  <Input
                    value={item}
                    onChange={(e) => updateListItem(blockIndex, itemIndex, e.target.value)}
                    placeholder={`\u00c9l\u00e9ment ${itemIndex + 1}`}
                    style={{ flex: 1 }}
                  />
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeListItem(blockIndex, itemIndex)}
                    disabled={block.items.length <= 1}
                  />
                </Space>
              ))}
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => addListItem(blockIndex)}
                style={{ marginTop: 4 }}
              >
                Ajouter un \u00e9l\u00e9ment
              </Button>
            </div>
          )}
        </div>
      ))}

      <Button type="dashed" icon={<PlusOutlined />} onClick={addBlock} style={{ width: "100%" }}>
        + Ajouter un bloc
      </Button>
    </div>
  );
}
