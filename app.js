const btnRun = document.getElementById("btnRun");
const btnClear = document.getElementById("btnClear");
const statusText = document.getElementById("statusText");
const output = document.getElementById("output");

const API = "https://subpreputial-hypersuggestible-leonie.ngrok-free.dev"; // IP DE TU PC

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

btnClear.addEventListener("click", () => {
  output.textContent = "";
  statusText.textContent = "Listo — conectado a la API";
});

btnRun.addEventListener("click", async () => {
  const company = document.getElementById("company").value;
  const mode = document.getElementById("mode").value;
  const direccion = document.getElementById("address").value.trim();
  const comuna = document.getElementById("comuna").value.trim();
  const rut = document.getElementById("rut").value.trim();

  output.textContent = "";
  statusText.textContent = "⏳ Enviando consulta...";

  try {
    let jobId, pollUrl;

    if (mode === "factibilidad") {
      const r = await fetch(`${API}/factibilidad`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direccion, comuna, company })
      });
      const d = await r.json();
      jobId = d.jobId;
      pollUrl = `${API}/factibilidad/${jobId}`;
    }

    statusText.textContent = "🟡 Ejecutando en Citrix...";

    while (true) {
      await sleep(2000);
      const r = await fetch(pollUrl);
      const d = await r.json();

      if (d.status === "running" || d.status === "queued") continue;

      if (d.status === "error") {
        statusText.textContent = "🔴 Error";
        output.textContent = d.error;
        return;
      }

      if (d.status === "done") {
        statusText.textContent = "🟢 Finalizado";
        output.textContent = d.resultado;

        if (d.capturaUrl) {
          const img = document.createElement("img");
          img.src = d.capturaUrl + "?t=" + Date.now();
          img.style.width = "100%";
          img.style.marginTop = "12px";
          img.style.borderRadius = "12px";
          img.style.cursor = "zoom-in";
          img.onclick = () => openImgModal(img.src);

          output.appendChild(document.createElement("hr"));
          output.appendChild(img);
        }
        return;
      }
    }
  } catch (e) {
    statusText.textContent = "🔴 Error";
    output.textContent = e.message;
  }
});

// MODAL
let currentImgSrc = null;

function openImgModal(src) {
  currentImgSrc = src;
  document.getElementById("modalImg").src = src;
  document.getElementById("imgModal").style.display = "flex";
}

function closeImgModal() {
  document.getElementById("imgModal").style.display = "none";
}

// PDF
document.getElementById("btnPdf").addEventListener("click", async () => {
  const img = document.getElementById("modalImg");
  const canvas = await html2canvas(img, { scale: 2 });
  const imgData = canvas.toDataURL("image/png");

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");
  const w = pdf.internal.pageSize.getWidth();
  const h = (canvas.height * w) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 10, w, h);
  pdf.save("factibilidad.pdf");
});