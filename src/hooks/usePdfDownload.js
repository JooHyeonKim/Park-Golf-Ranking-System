import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const CAPTURE_IDS = ['전체현황', '개인전', '장려상', '단체전'];

export function usePdfDownload(tournamentName) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePdfDownload = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      let isFirstPage = true;

      for (const id of CAPTURE_IDS) {
        const el = document.querySelector(`[data-capture-id="${id}"]`);
        if (!el) continue;

        const origOverflow = el.style.overflow;
        const origWidth = el.style.width;
        const origMaxHeight = el.style.maxHeight;
        const parent = el.parentElement;
        const grandparent = parent.parentElement;
        const origParentDisplay = parent.style.display;
        const origGrandparentDisplay = grandparent ? grandparent.style.display : '';

        // 요소와 상위 요소들을 보이게 설정
        if (grandparent) grandparent.style.display = 'block';
        parent.style.display = 'block';
        el.style.overflow = 'visible';
        el.style.width = 'auto';
        el.style.maxHeight = 'none';

        // 리플로우 강제 및 대기
        void el.offsetWidth;
        void el.offsetHeight;
        void el.getBoundingClientRect();
        await new Promise(resolve => setTimeout(resolve, 200));

        // 요소 크기가 0이면 스킵
        if (el.scrollWidth === 0 || el.scrollHeight === 0) {
          el.style.overflow = origOverflow;
          el.style.width = origWidth;
          el.style.maxHeight = origMaxHeight;
          parent.style.display = origParentDisplay;
          if (grandparent) grandparent.style.display = origGrandparentDisplay;
          continue;
        }

        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          windowWidth: el.scrollWidth,
        });

        el.style.overflow = origOverflow;
        el.style.width = origWidth;
        el.style.maxHeight = origMaxHeight;
        parent.style.display = origParentDisplay;
        if (grandparent) grandparent.style.display = origGrandparentDisplay;

        // 캔버스 크기가 0이면 스킵
        if (canvas.width === 0 || canvas.height === 0) continue;

        if (!isFirstPage) pdf.addPage();
        isFirstPage = false;

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
      }

      const name = (tournamentName || '대회').replace(/[/\\?%*:|"<>]/g, '_');
      pdf.save(`${name}_집계.pdf`);
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      alert('PDF 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  }, [tournamentName, isGenerating]);

  return { isGenerating, handlePdfDownload };
}
