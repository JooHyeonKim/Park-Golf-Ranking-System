import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

async function captureElement(el) {
  void el.offsetWidth;
  void el.offsetHeight;
  void el.getBoundingClientRect();
  await new Promise(resolve => setTimeout(resolve, 200));

  if (el.scrollWidth === 0 || el.scrollHeight === 0) return null;

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    scrollX: 0,
    scrollY: 0,
    windowWidth: el.scrollWidth,
  });

  if (canvas.width === 0 || canvas.height === 0) return null;
  return canvas;
}

function addCanvasToPage(pdf, canvas, isFirstPage) {
  if (!isFirstPage) pdf.addPage();

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

/**
 * 단일 탭 PDF 다운로드 훅
 * @param {Object} tableRef - 테이블 컨테이너 ref
 * @param {string} tournamentName - 대회명
 * @param {string} label - 라벨 (파일명에 사용)
 * @param {number|null} rowsPerPage - 페이지당 행 수 (null이면 한 페이지로 출력)
 */
export function useSinglePdfDownload(tableRef, tournamentName, label, rowsPerPage = null) {
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

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      if (rowsPerPage) {
        // 페이지 분할 모드: rowsPerPage 행씩 나눠서 캡처
        const tbody = el.querySelector('tbody');
        const rows = tbody ? Array.from(tbody.querySelectorAll('tr')) : [];

        if (rows.length === 0) {
          setIsGenerating(false);
          return;
        }

        const totalPages = Math.ceil(rows.length / rowsPerPage);
        let isFirstPage = true;

        for (let page = 0; page < totalPages; page++) {
          const start = page * rowsPerPage;
          const end = start + rowsPerPage;

          rows.forEach((row, i) => {
            row.style.display = (i >= start && i < end) ? '' : 'none';
          });

          const canvas = await captureElement(el);
          if (canvas) {
            addCanvasToPage(pdf, canvas, isFirstPage);
            isFirstPage = false;
          }
        }

        // 모든 행 복원
        rows.forEach(row => {
          row.style.display = '';
        });
      } else {
        // 단일 페이지 모드
        const canvas = await captureElement(el);
        if (canvas) {
          addCanvasToPage(pdf, canvas, true);
        }
      }

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
  }, [tableRef, tournamentName, label, rowsPerPage, isGenerating]);

  return { isGenerating, handlePdfDownload };
}
