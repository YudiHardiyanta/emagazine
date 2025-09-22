// viewer.js with StPageFlip

const DEFAULT_PDF = new URLSearchParams(window.location.search).get('pdf') || 'pdfs/magazine.pdf';
const pdfSelect = document.getElementById('pdfSelect');
let pageFlip;

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js';
function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.toggle('hidden', !show);
}

function loadListOfPDFs() {
  fetch('/api/pdfs').then(r => r.json()).then(list => {
    pdfSelect.innerHTML = '';
    list.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p.split('/').pop();
      pdfSelect.appendChild(opt);
    });
    const found = Array.from(pdfSelect.options).find(o => o.value === DEFAULT_PDF);
    if (found) pdfSelect.value = DEFAULT_PDF;
    if (!pdfSelect.value && pdfSelect.options.length) pdfSelect.selectedIndex = 0;
    loadPDF(pdfSelect.value);
  }).catch(() => loadPDF(DEFAULT_PDF));
}

function loadPDF(url) {
  showLoading(true);
  pdfjsLib.getDocument(url).promise.then(pdf => {
    const container = document.getElementById('flipbook');
    const width = Math.min(500, window.innerWidth - 40); // max 500px atau lebar layar-40
    const height = Math.floor(width * 1.4); // tinggi proporsional (misalnya rasio A4 ~ 1.4)

    container.innerHTML = '';
    pageFlip = new St.PageFlip(container, {
      width: width,
      height: height,
      size: 'stretch',
      minWidth: 300,
      minHeight: 400,
      maxWidth: 1200,
      maxHeight: 1600,
      showCover: true,
      usePortrait: true,
      drawShadow: true,
    });

    const pages = [];
    const promises = [];

    for (let p = 1; p <= pdf.numPages; p++) {
      promises.push(
        pdf.getPage(p).then(page => {
          const viewport = page.getViewport({ scale: 1 });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          return page.render({ canvasContext: ctx, viewport }).promise.then(() => {
            const wrapper = document.createElement('div');
            wrapper.className = 'page bg-white';
            wrapper.appendChild(canvas);
            pages[p - 1] = wrapper;
          });
        })
      );
    }

    Promise.all(promises).then(() => {
      pageFlip.loadFromHTML(pages);
      setTimeout(() => {
        showLoading(false);
      }, 500);
    });
  }).catch(err => {
    console.error('Failed to load PDF:', err)
    showLoading(false);
  }
  );

}

pdfSelect.addEventListener('change', (e) => {
  const val = e.target.value;
  const u = new URL(window.location);
  u.searchParams.set('pdf', val);
  window.history.replaceState({}, '', u);
  loadPDF(val);
});

loadListOfPDFs();