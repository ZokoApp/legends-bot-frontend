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
if (!rawUser) {
  window.location.href = "login.html";
}
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
const setStatus = text => statusText.textContent = text;
const clearOutput = () => output.textContent = "";

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
    let pollUrl = null;

    // =========================
    // VALIDACIÓN RUT
    // =========================
    if (mode === "validacion") {
      if (!rut) {
        setStatus("🔴 Falta el RUT");
        return;
      }

      const start = await fetch(`${API}/estado-rut`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ rut, company })
      });

      if (!start.ok) {
        throw new Error("No se pudo iniciar validación");
      }

      const data = await start.json();
      pollUrl = `${API}/estado-rut/${data.jobId}`;
    }

    // =========================
    // BOLETA
    // =========================
    if (mode === "boleta") {
      if (!rut) {
        setStatus("🔴 Falta el RUT");
        return;
      }

      const start = await fetch(`${API}/boleta`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ rut, company })
      });

      if (!start.ok) {
        throw new Error("No se pudo iniciar boleta");
      }

      const data = await start.json();
      pollUrl = `${API}/boleta/${data.jobId}`;
    }

    if (!pollUrl) {
      setStatus("🔴 Modo inválido");
      return;
    }

    setStatus("🟡 Ejecutando…");

    // =========================
    // POLLING
    // =========================
    while (true) {
      await sleep(2000);

      const poll = await fetch(pollUrl);
      if (!poll.ok) {
        throw new Error("Error consultando estado");
      }

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

      if (result.status === "error") {
        setStatus("🔴 Error");
        output.textContent = result.error || "Error desconocido";
        return;
      }
    }

  } catch (e) {
    setStatus("🔴 Error");
    output.textContent = e.message;
  }
};
