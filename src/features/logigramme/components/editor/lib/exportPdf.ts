import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

export async function exportPdf(filename = "logigramme.pdf") {
  const el = document.querySelector(".react-flow") as HTMLElement;
  if (!el) return;

  const dataUrl = await toPng(el, { backgroundColor: "#ffffff", pixelRatio: 2 });

  // Get dimensions
  const img = new Image();
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.src = dataUrl;
  });

  const imgWidth = img.width;
  const imgHeight = img.height;

  // Determine orientation
  const orientation = imgWidth > imgHeight ? "landscape" : "portrait";
  const pdf = new jsPDF({ orientation, unit: "px", format: [imgWidth / 2, imgHeight / 2] });

  pdf.addImage(dataUrl, "PNG", 0, 0, imgWidth / 2, imgHeight / 2);
  pdf.save(filename);
}
