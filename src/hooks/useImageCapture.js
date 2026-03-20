import { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';

export function useImageCapture(tournamentName, label, rowsPerPage = null) {
  const tableRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCaptureImage = useCallback(async () => {
    if (!tableRef.current || isCapturing) return;
    setIsCapturing(true);
    const el = tableRef.current;
    const origOverflow = el.style.overflow;
    const origWidth = el.style.width;
    try {
      el.style.overflow = 'visible';
      el.style.width = 'auto';
      // bg-green-50 요소를 캡처 시 흰색으로 임시 변경
      const greenBgEls = el.querySelectorAll('.bg-green-50');
      greenBgEls.forEach(e => { e.dataset.origBg = e.style.backgroundColor; e.style.backgroundColor = '#ffffff'; });

      const name = (tournamentName || '대회').replace(/[/\\?%*:|"<>]/g, '_');

      if (rowsPerPage) {
        // 페이지 분할 모드
        const tbody = el.querySelector('tbody');
        const rows = tbody ? Array.from(tbody.querySelectorAll('tr')) : [];

        if (rows.length === 0) {
          setIsCapturing(false);
          return;
        }

        const totalPages = Math.ceil(rows.length / rowsPerPage);

        for (let page = 0; page < totalPages; page++) {
          const start = page * rowsPerPage;
          const end = start + rowsPerPage;

          rows.forEach((row, i) => {
            row.style.display = (i >= start && i < end) ? '' : 'none';
          });

          await new Promise(r => setTimeout(r, 200));

          const canvas = await html2canvas(el, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            scrollX: 0,
            scrollY: 0,
            windowWidth: el.scrollWidth,
          });

          const link = document.createElement('a');
          link.download = `${name}_${label}_${page + 1}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        }

        // 모든 행 복원
        rows.forEach(row => { row.style.display = ''; });
      } else {
        // 단일 이미지 모드
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          windowWidth: el.scrollWidth,
        });
        const link = document.createElement('a');
        link.download = `${name}_${label}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (error) {
      console.error('이미지 캡쳐 실패:', error);
      alert('이미지 캡쳐에 실패했습니다. 다시 시도해주세요.');
    } finally {
      // bg-green-50 복원
      const greenBgEls = el.querySelectorAll('.bg-green-50');
      greenBgEls.forEach(e => { e.style.backgroundColor = e.dataset.origBg || ''; delete e.dataset.origBg; });
      el.style.overflow = origOverflow;
      el.style.width = origWidth;
      setIsCapturing(false);
    }
  }, [tournamentName, label, rowsPerPage, isCapturing]);

  return { tableRef, isCapturing, handleCaptureImage };
}
