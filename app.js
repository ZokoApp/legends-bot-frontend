const btnRun = document.getElementById("btnRun");
const btnClear = document.getElementById("btnClear");
const statusText = document.getElementById("statusText");
const output = document.getElementById("output");

// ⚠️ Tu API NGROK
const API = "https://subpreputial-hypersuggestible-leonie.ngrok-free.dev";

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function setStatus(text) {
  statusText.textContent = text;
}

function clearOutput() {
  output.innerHTML = "";
}

btnClear.addEventListener("click", () => {
  clearOutput();
  setStatus("🟢 Listo — conectado a la API");
});

btnRun.addEventListener("click", async () => {
  const company = document.getElementById("company").value;
  const mode = document.getElementById("mode").value; // "factibilidad" / "validacion" / "factibilidad_rut" (nuevo)
  const direccion = document.getElementById("address").value.trim();
  const comuna = document.getElementById("comuna").value.trim();
  const rut = document.getElementById("rut")?.value.trim();

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

      if (!start.ok) throw new Error("No se pudo iniciar la factibilidad");

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
    // NUEVO: FACTIBILIDAD POR RUT
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

    if (!pollUrl) {
      setStatus("🔴 Modo inválido");
      return;
    }

    setStatus("🟡 Ejecutando en Legends…");

    // Poll
    while (true) {
      await sleep(2000);

      const poll = await fetch(pollUrl, {
        headers: {
          "ngrok-skip-browser-warning": "true"
        }
      });

      if (!poll.ok) {
        throw new Error("Error consultando estado");
      }

      const result = await poll.json();

      if (result.status === "queued") {
        setStatus("🟠 En cola… (hay otra consulta ejecutándose)");
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

      if (result.status === "done") {
        setStatus("🟢 Finalizado");

        if (result.resultado) {
          const pre = document.createElement("pre");
          pre.textContent = result.resultado;
          pre.style.whiteSpace = "pre-wrap";
          output.appendChild(pre);
        }

        if (result.capturaUrl) {
          const img = document.createElement("img");
          // OJO: capturaUrl ya es URL completa de Cloudinary
          img.src = result.capturaUrl + "?t=" + Date.now();
          img.style.width = "100%";
          img.style.marginTop = "12px";
          img.style.borderRadius = "12px";
          img.style.cursor = "zoom-in";
          img.onclick = () => window.open(img.src, "_blank");
          output.appendChild(img);
        }

        return;
      }
    }

  } catch (e) {
    setStatus("🔴 Error");
    output.textContent = e.message;
  }
});
