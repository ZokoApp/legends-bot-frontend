const API = "https://unreproached-subangularly-cristopher.ngrok-free.dev";

let lastImageUrl = "";
let lastTextResult = "";

// HISTORIAL
function getHistory(){
  return JSON.parse(localStorage.getItem("legends_history") || "[]");
}

function saveHistory(item){
  const h = getHistory();
  h.unshift(item);
  if(h.length>20) h.pop();
  localStorage.setItem("legends_history",JSON.stringify(h));
}

function openHistory(){
  const list = document.getElementById("historyList");
  const history = getHistory();
  list.innerHTML="";
  if(history.length===0){
    list.innerHTML="<p style='color:#888'>Sin consultas aún</p>";
  } else {
    history.forEach((h,i)=>{
      const div=document.createElement("div");
      div.innerHTML=`
        <strong>${h.fecha}</strong><br>
        ${h.modo}<br>
        ${h.datos.direccion||h.datos.rut||""}<br>
        <button onclick="viewHistory(${i})">Ver</button>
        <button onclick="repeatHistory(${i})">Repetir</button>
        <hr>
      `;
      list.appendChild(div);
    });
  }
  document.getElementById("historyModal").style.display="flex";
}

function closeHistory(){
  document.getElementById("historyModal").style.display="none";
}

function viewHistory(i){
  const h=getHistory()[i];
  openResultModal(h.resultado,h.imagen);
}

function repeatHistory(i){
  const h=getHistory()[i];
  company.value=h.datos.company;
  mode.value=h.modo;
  address.value=h.datos.direccion||"";
  comuna.value=h.datos.comuna||"";
  rut.value=h.datos.rut||"";
  closeHistory();
}

// RESULTADOS
function openResultModal(text,img){
  lastTextResult=text||"";
  lastImageUrl=img||"";
  modalText.innerText=lastTextResult;
  modalImg.src=lastImageUrl;
  resultModal.style.display="flex";
}

function closeResultModal(){
  resultModal.style.display="none";
}

function shareWhatsApp(){
  let msg=lastTextResult;
  if(lastImageUrl) msg+="\n\n📸 "+lastImageUrl;
  window.open("https://wa.me/?text="+encodeURIComponent(msg));
}

async function downloadPDF(){
  const {jsPDF}=window.jspdf;
  const pdf=new jsPDF();
  const lines=pdf.splitTextToSize(lastTextResult,180);
  pdf.text(lines,10,10);
  let y=10+lines.length*6+10;
  if(lastImageUrl){
    const imgData=await fetch(lastImageUrl).then(r=>r.blob()).then(b=>new Promise(res=>{
      const fr=new FileReader();fr.onload=()=>res(fr.result);fr.readAsDataURL(b);
    }));
    pdf.addImage(imgData,"PNG",10,y,180,100);
  }
  pdf.save("resultado_legends_bot.pdf");
}

// EJECUCIÓN
btnRun.onclick=async()=>{
  const company=company.value;
  const mode=mode.value;
  const direccion=address.value.trim();
  const comuna=comuna.value.trim();
  const rut=rut.value.trim();
  setStatus("⏳ Enviando consulta…");

  try{
    let pollUrl=null;
    if(mode==="factibilidad"){
      if(!direccion||!comuna) return setStatus("🔴 Falta dirección");
      const r=await fetch(`${API}/factibilidad`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({direccion,comuna,company})});
      const d=await r.json();pollUrl=`${API}/factibilidad/${d.jobId}`;
    }
    if(mode==="validacion"){
      if(!rut) return setStatus("🔴 Falta RUT");
      const r=await fetch(`${API}/estado-rut`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rut,company})});
      const d=await r.json();pollUrl=`${API}/estado-rut/${d.jobId}`;
    }
    if(mode==="agenda"){
      const r=await fetch(`${API}/agenda`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rut,company})});
      const d=await r.json();pollUrl=`${API}/agenda/${d.jobId}`;
    }

    setStatus("🟡 Ejecutando…");

    while(true){
      await new Promise(r=>setTimeout(r,2000));
      const poll=await fetch(pollUrl);
      const res=await poll.json();
      if(res.status==="done"){
        saveHistory({
          fecha:new Date().toLocaleString(),
          modo:mode,
          datos:{direccion,comuna,rut,company},
          resultado:res.resultado,
          imagen:res.capturaUrl
        });
        setStatus("🟢 Finalizado");
        openResultModal(res.resultado,res.capturaUrl);
        return;
      }
    }
  }catch(e){
    setStatus("🔴 Error");
    openResultModal(e.message,"");
  }
};

btnClear.onclick=()=>setStatus("🟢 Listo — conectado a la API");

function setStatus(t){statusText.innerText=t;}
