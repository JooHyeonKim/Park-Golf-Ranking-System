import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export function useSinglePdfDownload(tableRef, tournamentName, label) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePdfDownload = useCallback(async () => {
    if (!tableRef.current || isGenerating) return;
    setIsGenerating(true);
    const el = tableRef.current;
    const origOverflow = el.style.overflow;
    const origWidth = el.style.width;
    const origMaxHeight = el.style.maxHeight;
    try {
      el.style.overflow = 'visible';
      el.style.width = 'auto';
      el.style.maxHeight = 'none';

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: el.scrollWidth,
      });

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 5;
      const availWidth = pageWidth - margin * 2;
      const availHeight = pageHeight - margin * 2;

      const imgRatio = canvas.width / canvas.height;
      let imgWidth = availWidth;
      let imgHeight = imgWidth / imgRatio;
      if (imgHeight > availHeight) {
        imgHeight = availHeight;
        imgWidth = imgHeight * imgRatio;
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const x = (pageWidth - imgWidth) / 2;
      const y = margin;
      pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);

      const name = (tournamentName || '대회').replace(/[/\\?%*:|"<>]/g, '_');
      pdf.save(`${name}_${label}.pdf`);
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      alert('PDF 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      el.style.overflow = origOverflow;
      el.style.width = origWidth;
      el.style.maxHeight = origMaxHeight;
      setIsGenerating(false);
    }
  }, [tableRef, tournamentName, label, isGenerating]);

  return { isGenerating, handlePdfDownload };
}
