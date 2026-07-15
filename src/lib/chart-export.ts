// Chart figure export (P2.8): download any recharts chart as SVG or
// high-resolution PNG for papers and reports. Recharts inlines its
// presentation attributes on the SVG nodes, so a serialized clone is
// self-contained; a white background is added because paper figures
// sit on white.

function findChartSvg(container: HTMLElement): SVGSVGElement | null {
  return container.querySelector<SVGSVGElement>("svg.recharts-surface");
}

function serializeChart(svg: SVGSVGElement): {
  markup: string;
  width: number;
  height: number;
} {
  const rect = svg.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));

  // Text inherits the app font via CSS; make it explicit for standalone use
  clone.setAttribute(
    "style",
    "font-family: ui-sans-serif, system-ui, sans-serif; background: #ffffff",
  );
  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("width", "100%");
  bg.setAttribute("height", "100%");
  bg.setAttribute("fill", "#ffffff");
  clone.insertBefore(bg, clone.firstChild);

  return { markup: new XMLSerializer().serializeToString(clone), width, height };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadChartSvg(container: HTMLElement, filename: string) {
  const svg = findChartSvg(container);
  if (!svg) throw new Error("No chart found");
  const { markup } = serializeChart(svg);
  downloadBlob(
    new Blob([markup], { type: "image/svg+xml;charset=utf-8" }),
    `${filename}.svg`,
  );
}

export async function downloadChartPng(
  container: HTMLElement,
  filename: string,
  scale = 3,
): Promise<void> {
  const svg = findChartSvg(container);
  if (!svg) throw new Error("No chart found");
  const { markup, width, height } = serializeChart(svg);

  const img = new Image();
  const svgUrl = URL.createObjectURL(
    new Blob([markup], { type: "image/svg+xml;charset=utf-8" }),
  );
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to rasterize chart"));
      img.src = svgUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) throw new Error("PNG encoding failed");
    downloadBlob(blob, `${filename}.png`);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
