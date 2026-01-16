// ===== app.js =====

// ===============================
// API
// ===============================
const API = "https://unreproached-subangularly-christopher.ngrok-free.dev";

// ===============================
// ELEMENTOS
// ===============================
const btnRun = document.getElementById("btnRun");
const btnClear = document.getElementById("btnClear");
const statusText = document.getElementById("statusText");
const output = document.getElementById("output");

// ===============================
// SESIÓN
// ===============================
const rawUser = localStorage.getItem("legends_user");
if (!rawUser) window.location.href = "login.html";
const user = JSON.parse(rawUser);

// ===============================
// CONTROL ADMIN
// ===============================
if (user.rol !== "admin") {
  document.querySelectorAll(".only-admin").forEach(el => el.remove());
}

// ===============================
// UTILS
// ===============================
const sleep = ms => new Promise(r => setTimeout(r, ms));
const setStatus = t => statusText.textContent = t;
const clearOutput = () => output.innerHTML = "";

// ===============================
// LIMPIAR
// ===============================
btnClear.onclick = () => {
  clearOutput();
  setStatus("🟢 Listo — conectado a la API");
};

// ===============================
// EJECUTAR
// ===============================
btnRun.onclick = async () => {
  const rut = document.getElementById("rut").value.trim();
  const company = document.getElementById("company").value;
  const mode = document.getElementById("mode").value;

  clearOutput();
  setStatus("⏳ Enviando consulta…");

  try {
    let pollUrl;

    if (mode === "validacion") {
      if (!rut) return setStatus("🔴 Falta el RUT");

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

    if (mode === "boleta") {
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
        setStatus("🟡 Ejecutando…");
        continue;
      }
      if (result.status === "done") {
        setStatus("🟢 Finalizado");
        output.textContent =
          result.resultado || "ℹ️ No hay información disponible";
        return;
      }
    }

  } catch (e) {
    setStatus("🔴 Error");
    output.textContent = e.message;
  }
};
