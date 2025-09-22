// viewer.js
// Simple PDF.js viewer with two-page spread option


const DEFAULT_PDF = new URLSearchParams(window.location.search).get('pdf') || 'pdfs/magazine.pdf';


const pdfSelect = document.getElementById('pdfSelect');
const viewer = document.getElementById('viewer');
const pageNumEl = document.getElementById('pageNum');
const pageCountEl = document.getElementById('pageCount');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const toggleSpread = document.getElementById('toggleSpread');
const zoomRange = document.getElementById('zoom');


let pdfDoc = null;
let currentPage = 1;
let pageCount = 0;
let spread = true; // dua halaman
let scale = parseFloat(zoomRange.value) || 1;

// PDF.js config
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js';


function loadListOfPDFs() {
fetch('/api/pdfs').then(r => r.json()).then(list => {
pdfSelect.innerHTML = '';
list.forEach(p => {
const opt = document.createElement('option');
opt.value = p;
opt.textContent = p.split('/').pop();
pdfSelect.appendChild(opt);
});
// if default present select it, otherwise first
const found = Array.from(pdfSelect.options).find(o => o.value === DEFAULT_PDF);
if (found) pdfSelect.value = DEFAULT_PDF;
if (!pdfSelect.value && pdfSelect.options.length) pdfSelect.selectedIndex = 0;
loadPDF(pdfSelect.value);
}).catch(err => {
console.error(err);
// fallback: attempt default
loadPDF(DEFAULT_PDF);
});
}

function loadPDF(url) {
viewer.innerHTML = '<div class="col-span-2 text-center py-24">Loading PDF&hellip;</div>';
pdfjsLib.getDocument(url).promise.then(pdf => {
pdfDoc = pdf;
pageCount = pdf.numPages;
pageCountEl.textContent = pageCount;
currentPage = 1;
renderSpread();
}).catch(err => {
viewer.innerHTML = '<div class="col-span-2 text-red-600">Failed to load PDF</div>';
console.error(err);
});
}

function renderSpread() {
if (!pdfDoc) return;
viewer.innerHTML = '';
const pagesToShow = spread ? [currentPage, currentPage+1] : [currentPage];


pagesToShow.forEach(pnum => {
if (pnum < 1 || pnum > pageCount) return;
const canvas = document.createElement('canvas');
canvas.className = 'page-canvas w-full rounded';
const container = document.createElement('div');
container.className = 'flex justify-center';
container.appendChild(canvas);
viewer.appendChild(container);


pdfDoc.getPage(pnum).then(page => {
const viewport = page.getViewport({ scale: scale });
canvas.width = viewport.width;
canvas.height = viewport.height;
const ctx = canvas.getContext('2d');
const renderContext = { canvasContext: ctx, viewport: viewport };
page.render(renderContext);
});
});
pageNumEl.textContent = currentPage;
}

prevBtn.addEventListener('click', () => {
if (spread) currentPage = Math.max(1, currentPage - 2);
else currentPage = Math.max(1, currentPage - 1);
renderSpread();
});
nextBtn.addEventListener('click', () => {
if (spread) currentPage = Math.min(pageCount - 1, currentPage + 2);
else currentPage = Math.min(pageCount, currentPage + 1);
renderSpread();
});


toggleSpread.addEventListener('click', () => {
spread = !spread;
renderSpread();
});


zoomRange.addEventListener('input', (e) => {
scale = parseFloat(e.target.value);
renderSpread();
});


pdfSelect.addEventListener('change', (e) => {
const val = e.target.value;
// update URL without reload
const u = new URL(window.location);
u.searchParams.set('pdf', val);
window.history.replaceState({}, '', u);
loadPDF(val);
});


// init
loadListOfPDFs();