import { toSvg } from "html-to-image";

export async function exportSvg(filename = "logigramme.svg") {
  const el = document.querySelector(".react-flow") as HTMLElement;
  if (!el) return;

  const svgDataUrl = await toSvg(el, { backgroundColor: "#ffffff" });
  const a = document.createElement("a");
  a.href = svgDataUrl;
  a.download = filename;
  a.click();
}
