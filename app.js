const btnRun = document.getElementById("btnRun");
const btnClear = document.getElementById("btnClear");
const statusText = document.getElementById("statusText");
const output = document.getElementById("output");

const API = "https://subpreputial-hypersuggestible-leonie.ngrok-free.dev";

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function setStatus(text) {
  statusText.textContent = text;
}

btnClear.addEventListener("click", () => {
  output.textContent = "";
  setStatus("🟢 Listo — conectado a la API");
});

btnRun.addEventListener("click", async () => {
  const company = document.getElementById("company").value;
  const mode = document.getElementById("mode").value;
  const direccion = document.getElementById("address").value.trim();
  const comuna = document.getElementById("comuna").value.trim();
  const rut = document.getElementById("rut")?.value.trim();

  output.textContent = "";
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
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ direccion, comuna, company })
      });

      if (!start.ok) {
        throw new Error("No se pudo iniciar la factibilidad");
      }

      const data = await start.json();
      pollUrl = `${API}/factibilidad/${data.jobId}`;
    }

    setStatus("🟡 Ejecutando en Citrix…");

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

      if (result.status === "running" || result.status === "queued") {
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
  img.src = result.capturaUrl + "?t=" + Date.now(); // ✅ URL CLOUDINARY
  img.style.width = "100%";
  img.style.marginTop = "12px";
  img.style.borderRadius = "12px";
  img.style.cursor = "zoom-in";

  img.onload = () => console.log("✅ Imagen cargada");
  img.onerror = () => console.error("❌ Error cargando imagen:", img.src);

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
