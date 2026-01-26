// =========================
// CONFIG
// =========================
const API = "https://unreproached-subangularly-cristopher.ngrok-free.dev";

let lastImageUrl = "";
let lastTextResult = "";

// =========================
// MODAL FUNCTIONS
// =========================
function openResultModal(text, imageUrl) {
  lastTextResult = text || "";
  lastImageUrl = imageUrl || "";

  document.getElementById("modalText").innerText = lastTextResult;
  document.getElementById("modalImg").src = lastImageUrl || "";
  document.getElementById("resultModal").style.display = "flex";
}

function closeResultModal() {
  document.getElementById("resultModal").style.display = "none";
}

function shareWhatsApp() {
  const msg = encodeURIComponent(lastTextResult);
  window.open(`https://wa.me/?text=${msg}`, "_blank");
}

async function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  const lines = pdf.splitTextToSize(lastTextResult, 180);
  pdf.text(lines, 10, 10);
  pdf.save("resultado_legends_bot.pdf");
}

// =========================
// UTILS
// =========================
function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function setStatus(text) {
  statusText.textContent = text;
}

// =========================
// LIMPIAR
// =========================
btnClear.addEventListener("click", () => {
  setStatus("🟢 Listo — conectado a la API");
});

// =========================
// EJECUTAR
// =========================
btnRun.addEventListener("click", async () => {
  const company = document.getElementById("company").value;
  const mode = document.getElementById("mode").value;
  const direccion = document.getElementById("address").value.trim();
  const comuna = document.getElementById("comuna").value.trim();
  const rut = document.getElementById("rut").value.trim();

  setStatus("⏳ Enviando consulta…");

  try {
    let pollUrl = null;

    // =========================
    // FACTIBILIDAD POR DIRECCIÓN
    // =========================
    if (mode === "factibilidad") {
      if (!direccion || !comuna) {
        setStatus("🔴 Falta dirección o comuna");
        return;
      }

      const start = await fetch(`${API}/factibilidad`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ direccion, comuna, company })
      });

      const data = await start.json();
      pollUrl = `${API}/factibilidad/${data.jobId}`;
    }

    // =========================
    // VALIDACIÓN (ESTADO RUT)
    // =========================
    if (mode === "validacion") {
      if (!rut) {
        setStatus("🔴 Falta el RUT");
        return;
      }

      const start = await fetch(`${API}/estado-rut`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ rut, company })
      });

      const data = await start.json();
      pollUrl = `${API}/estado-rut/${data.jobId}`;
    }

    // =========================
    // FACTIBILIDAD POR RUT
    // =========================
    if (mode === "factibilidad_rut") {
      if (!rut) {
        setStatus("🔴 Falta el RUT");
        return;
      }

      const start = await fetch(`${API}/factibilidad-rut`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ rut, company })
      });

      const data = await start.json();
      pollUrl = `${API}/factibilidad-rut/${data.jobId}`;
    }

    // =========================
    // 📅 AGENDA
    // =========================
    if (mode === "agenda") {
      if (!rut) {
        setStatus("🔴 Falta el RUT");
        return;
      }

      const start = await fetch(`${API}/agenda`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ rut, company })
      });

      const data = await start.json();
      pollUrl = `${API}/agenda/${data.jobId}`;
    }

    // =========================
    // 🧾 BOLETA
    // =========================
    if (mode === "boleta") {
      if (!rut) {
        setStatus("🔴 Falta el RUT");
        return;
      }

      const start = await fetch(`${API}/boleta`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ rut, company })
      });

      const data = await start.json();
      pollUrl = `${API}/boleta/${data.jobId}`;
    }

    if (!pollUrl) {
      setStatus("🔴 Modo inválido");
      return;
    }

    setStatus("🟡 Ejecutando en Legends…");

    // =========================
    // POLLING
    // =========================
    while (true) {
      await sleep(2000);

      const poll = await fetch(pollUrl, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });

      const result = await poll.json();

      if (result.status === "queued") {
        setStatus("🟠 En cola…");
        continue;
      }

      if (result.status === "running") {
        setStatus("🟡 Ejecutando en Legends…");
        continue;
      }

      if (result.status === "error") {
        setStatus("🔴 Error");
        openResultModal(result.error || "Error desconocido", "");
        return;
      }

      // =========================
      // FINALIZADO
      // =========================
      if (result.status === "done") {
        setStatus("🟢 Finalizado");
        openResultModal(result.resultado, result.capturaUrl);
        return;
      }
    }

  } catch (e) {
    setStatus("🔴 Error");
    openResultModal(e.message, "");
  }
});
