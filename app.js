const output = document.getElementById("output");

// ⚠️ TU API (NGROK / LOCAL)
const API = "https://unreproached-subangularly-cristopher.ngrok-free.dev";

// =========================
// UTILS
// =========================
function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function setStatus(text) {
  statusText.textContent = text;
}

function clearOutput() {
  output.innerHTML = "";
}

// =========================
// LIMPIAR
// =========================
btnClear.addEventListener("click", () => {
  clearOutput();
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

  clearOutput();
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

      if (!start.ok) throw new Error("No se pudo iniciar factibilidad");

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

      if (!start.ok) throw new Error("No se pudo iniciar validación RUT");

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

      if (!start.ok) throw new Error("No se pudo iniciar factibilidad por RUT");

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

  if (!start.ok) throw new Error("No se pudo iniciar agenda");

  const data = await start.json();
  pollUrl = `${API}/agenda/${data.jobId}`;
}

    // =========================
    // 🧾 BOLETA / FACTURA
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

      if (!start.ok) throw new Error("No se pudo iniciar búsqueda de boleta");

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

      if (!poll.ok) throw new Error("Error consultando estado");

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
        output.textContent = result.error || "Error desconocido";
        return;
      }

      // =========================
      // FINALIZADO
      // =========================
      if (result.status === "done") {
        setStatus("🟢 Finalizado");

        // TEXTO
        if (result.resultado) {
          const pre = document.createElement("pre");
          pre.textContent = result.resultado;
          pre.style.whiteSpace = "pre-wrap";
          output.appendChild(pre);
        }

        // IMAGEN (Cloudinary)
        if (result.capturaUrl) {
          const img = document.createElement("img");
          img.src = result.capturaUrl + "?t=" + Date.now();
          img.style.width = "100%";
          img.style.marginTop = "12px";
          img.style.borderRadius = "12px";
          img.style.cursor = "zoom-in";
          img.onclick = () => window.open(img.src, "_blank");
          output.appendChild(img);
        }

        // PDF BOLETA
        if (result.pdfUrl) {
          const a = document.createElement("a");
          a.href = result.pdfUrl;
          a.target = "_blank";
          a.textContent = "📄 Descargar boleta en PDF";
          a.style.display = "inline-block";
          a.style.marginTop = "14px";
          a.style.padding = "10px 14px";
          a.style.borderRadius = "10px";
          a.style.background = "#2563eb";
          a.style.color = "#fff";
          a.style.fontWeight = "600";
          output.appendChild(a);
        }

        // SIN BOLETA
        if (result.noBoleta) {
          const msg = document.createElement("div");
          msg.textContent = "ℹ️ No hay boleta disponible para este cliente";
          msg.style.marginTop = "12px";
          msg.style.color = "#9ca3af";
          output.appendChild(msg);
        }

        return;
      }
    }

  } catch (e) {
    setStatus("🔴 Error");
    output.textContent = e.message;
  }
});
