// =========================
// CONFIG
// =========================
const API = "https://unreproached-subangularly-cristopher.ngrok-free.dev";

let lastImageUrl = "";
let lastTextResult = "";

// =========================
// HISTORIAL (Nivel 1)
// =========================
function getHistory() {
  return JSON.parse(localStorage.getItem("legends_history") || "[]");
}

function saveHistory(item) {
  const history = getHistory();
  history.unshift(item);
  if (history.length > 20) history.pop();
  localStorage.setItem("legends_history", JSON.stringify(history));
}

function openHistory() {
  const list = document.getElementById("historyList");
  const history = getHistory();
  list.innerHTML = "";

  if (history.length === 0) {
    list.innerHTML = "<p style='color:#888'>Sin consultas aún</p>";
    document.getElementById("historyModal").style.display = "flex";
    return;
  }

  history.forEach((h, i) => {
    const div = document.createElement("div");
    div.style.marginBottom = "12px";
    div.innerHTML = `
      <strong>${h.fecha}</strong><br>
      ${h.modo}<br>
      ${h.datos.direccion || h.datos.rut || ""}<br>
      <button onclick="viewHistory(${i})">Ver</button>
      <button onclick="repeatHistory(${i})">Repetir</button>
      <hr>
    `;
    list.appendChild(div);
  });

  document.getElementById("historyModal").style.display = "flex";
}

function closeHistory() {
  document.getElementById("historyModal").style.display = "none";
}

function viewHistory(i) {
  const h = getHistory()[i];
  openResultModal(h.resultado, h.imagen);
}

function repeatHistory(i) {
  const h = getHistory()[i];
  company.value = h.datos.company;
  mode.value = h.modo;
  address.value = h.datos.direccion || "";
  comuna.value = h.datos.comuna || "";
  rut.value = h.datos.rut || "";
  closeHistory();
}

// =========================
// MODAL RESULTADO
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
  let msg = lastTextResult;
  if (lastImageUrl) {
    msg += "\n\n📸 Captura:\n" + lastImageUrl;
  }
  const url = "https://wa.me/?text=" + encodeURIComponent(msg);
  window.open(url, "_blank");
}

async function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  const lines = pdf.splitTextToSize(lastTextResult, 180);
  pdf.text(lines, 10, 10);

  let y = 10 + lines.length * 6 + 10;

  if (lastImageUrl) {
    const imgData = await fetch(lastImageUrl)
      .then(r => r.blob())
      .then(b => new Promise(res => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.readAsDataURL(b);
      }));

    pdf.addImage(imgData, "PNG", 10, y, 180, 100);
  }

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

    if (mode === "factibilidad") {
      if (!direccion || !comuna) {
        setStatus("🔴 Falta dirección o comuna");
        return;
      }

      const start = await fetch(`${API}/factibilidad`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify({ direccion, comuna, company })
      });

      const data = await start.json();
      pollUrl = `${API}/factibilidad/${data.jobId}`;
    }

    if (mode === "validacion") {
      if (!rut) return setStatus("🔴 Falta el RUT");

      const start = await fetch(`${API}/estado-rut`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify({ rut, company })
      });

      const data = await start.json();
      pollUrl = `${API}/estado-rut/${data.jobId}`;
    }

    if (mode === "agenda") {
      if (!rut) return setStatus("🔴 Falta el RUT");

      const start = await fetch(`${API}/agenda`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify({ rut, company })
      });

      const data = await start.json();
      pollUrl = `${API}/agenda/${data.jobId}`;
    }

    if (!pollUrl) return setStatus("🔴 Modo inválido");

    setStatus("🟡 Ejecutando en Legends…");

    while (true) {
      await sleep(2000);
      const poll = await fetch(pollUrl, { headers: { "ngrok-skip-browser-warning": "true" } });
      const result = await poll.json();

      if (result.status === "queued") continue;
      if (result.status === "running") continue;

      if (result.status === "error") {
        setStatus("🔴 Error");
        openResultModal(result.error || "Error desconocido", "");
        return;
      }

      if (result.status === "done") {
        setStatus("🟢 Finalizado");

        saveHistory({
          fecha: new Date().toLocaleString(),
          modo: mode,
          datos: { direccion, comuna, rut, company },
          resultado: result.resultado || "",
          imagen: result.capturaUrl || ""
        });

        openResultModal(result.resultado, result.capturaUrl);
        return;
      }
    }

  } catch (e) {
    setStatus("🔴 Error");
    openResultModal(e.message, "");
  }
});
