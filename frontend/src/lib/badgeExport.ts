import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export async function downloadBadgePng(el: HTMLElement, badgeId: string) {
  const dataUrl = await toPng(el, { pixelRatio: 2, cacheBust: true });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `coffee-code-badge-${badgeId}.png`;
  a.click();
}

export async function downloadBadgePdf(el: HTMLElement, badgeId: string) {
  const dataUrl = await toPng(el, { pixelRatio: 2, cacheBust: true });
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 36;
  const targetW = pageW - margin * 2;
  const scale = targetW / el.offsetWidth;
  const targetH = el.offsetHeight * scale;
  const y = Math.max(margin, (pageH - targetH) / 2);
  pdf.addImage(dataUrl, 'PNG', margin, y, targetW, targetH);
  pdf.save(`coffee-code-badge-${badgeId}.pdf`);
}
