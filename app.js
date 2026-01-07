const btnRun = document.getElementById("btnRun");
const btnClear = document.getElementById("btnClear");
const statusText = document.getElementById("statusText");
const output = document.getElementById("output");

const API = "https://subpreputial-hypersuggestible-leonie.ngrok-free.dev"; // API vía ngrok

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// ===============================
// LIMPIAR
// ===============================
btnClear.addEventListener("click", () => {
  output.textContent = "";
  statusText.textContent = "Listo — conectado a la API";
});

// ===============================
// EJECUTAR
// ===============================
btnRun.addEventListener("click", async () => {
  const company = document.getElementById("company").value;
  const mode = document.getElementById("mode").value;
  const direccion = document.getElementById("address").value.trim();
  const comuna = document.getElementById("comuna").value.trim();
  const rutInput = document.getElementById("rut");
  const rut = rutInput ? rutInput.value.trim() : "";

  output.textContent = "";
  statusText.textContent = "⏳ Enviando consulta...";

  try {
    let jobId, pollUrl;

    // ===============================
    // FACTIBILIDAD
    // ===============================
    if (mode === "factibilidad") {
      if (!direccion || !comuna) {
        statusText.textContent = "🔴 Faltan datos";
        return;
      }

      const r = await fetch(`${API}/factibilidad`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ direccion, comuna, company })
      });

      if (!r.ok) throw new Error("Error iniciando factibilidad");

      const d = await r.json();
      jobId = d.jobId;
      pollUrl = `${API}/factibilidad/${jobId}`;
    }

    statusText.textContent = "🟡 Ejecutando en Citrix...";

    // ===============================
    // POLLING
    // ===============================
    while (true) {
      await sleep(2000);

      const r = await fetch(pollUrl, {
        headers: {
          "ngrok-skip-browser-warning": "true"
        }
      });

      if (!r.ok) throw new Error("Error consultando estado");

      const d = await r.json();

      if (d.status === "running" || d.status === "queued") continue;

      if (d.status === "error") {
        statusText.textContent = "🔴 Error";
        output.textContent = d.error || "Error desconocido";
        return;
      }

      if (d.status === "done") {
        statusText.textContent = "🟢 Finalizado";
        output.textContent = d.resultado || "OK";

        // ===============================
        // CAPTURA
        // ===============================
        if (d.capturaUrl) {
          const img = document.createElement("img");
          img.src = API + d.capturaUrl + "?t=" + Date.now();
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

// ===============================
// MODAL IMAGEN
// ===============================
let currentImgSrc = null;

function openImgModal(src) {
  currentImgSrc = src;
  document.getElementById("modalImg").src = src;
  document.getElementById("imgModal").style.display = "flex";
}

function closeImgModal() {
  document.getElementById("imgModal").style.display = "none";
}

// ===============================
// PDF
// ===============================
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
