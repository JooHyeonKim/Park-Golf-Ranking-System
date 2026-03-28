import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const CAPTURE_IDS = ['전체현황', '전체현황_남', '전체현황_여', '개인전', '장려상', '단체전'];
const ROWS_PER_PAGE = 24;

function prepareElement(el) {
  const parent = el.parentElement;
  const grandparent = parent.parentElement;
  const orig = {
    overflow: el.style.overflow,
    width: el.style.width,
    maxHeight: el.style.maxHeight,
    parentDisplay: parent.style.display,
    grandparentDisplay: grandparent ? grandparent.style.display : '',
    parent,
    grandparent,
  };
  if (grandparent) grandparent.style.display = 'block';
  parent.style.display = 'block';
  el.style.overflow = 'visible';
  el.style.width = 'auto';
  el.style.maxHeight = 'none';
  return orig;
}

function restoreElement(el, orig) {
  el.style.overflow = orig.overflow;
  el.style.width = orig.width;
  el.style.maxHeight = orig.maxHeight;
  orig.parent.style.display = orig.parentDisplay;
  if (orig.grandparent) orig.grandparent.style.display = orig.grandparentDisplay;
}

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

export function usePdfDownload(tournamentName) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePdfDownload = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      let isFirstPage = true;

      for (const id of CAPTURE_IDS) {
        const el = document.querySelector(`[data-capture-id="${id}"]`);
        if (!el) continue;

        const orig = prepareElement(el);

        if (id === '전체현황' || id === '전체현황_남' || id === '전체현황_여') {
          // 전체현황은 24명씩 페이지 분할
          const tbody = el.querySelector('tbody');
          const rows = tbody ? Array.from(tbody.querySelectorAll('tr')) : [];

          if (rows.length === 0) {
            restoreElement(el, orig);
            continue;
          }

          const totalPages = Math.ceil(rows.length / ROWS_PER_PAGE);
          let referenceImgWidth = null;

          for (let page = 0; page < totalPages; page++) {
            const start = page * ROWS_PER_PAGE;
            const end = start + ROWS_PER_PAGE;

            // 현재 페이지에 해당하지 않는 행 숨기기
            rows.forEach((row, i) => {
              row.style.display = (i >= start && i < end) ? '' : 'none';
            });

            const canvas = await captureElement(el);
            if (canvas) {
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

              // 첫 페이지의 imgWidth를 기준으로 저장
              if (referenceImgWidth === null) {
                referenceImgWidth = imgWidth;
              } else {
                // 이후 페이지는 기준 폭을 사용하여 동일한 스케일 유지
                imgWidth = referenceImgWidth;
                imgHeight = imgWidth / imgRatio;
              }

              const imgData = canvas.toDataURL('image/jpeg', 0.95);
              const x = (pageWidth - imgWidth) / 2;
              const y = margin;
              pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
              isFirstPage = false;
            }
          }

          // 모든 행 복원
          rows.forEach(row => {
            row.style.display = '';
          });
        } else {
          // 다른 섹션은 기존 방식 (한 페이지)
          const canvas = await captureElement(el);
          if (canvas) {
            addCanvasToPage(pdf, canvas, isFirstPage);
            isFirstPage = false;
          }
        }

        restoreElement(el, orig);
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
