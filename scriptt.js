// ===== PREENCHA SEUS CANAIS DE CONTATO PARA DOAÇÕES =====
const CONTATO={whatsapp:"",email:"",pix:"",instagram:""};
// ========================================================
const DOW=["DOMINGO","SEGUNDA","TERÇA","QUARTA","QUINTA","SEXTA","SÁBADO"];
const MON=["JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];
const S=(()=>{try{return JSON.parse(localStorage.getItem("cdia")||"{}")}catch(e){return{}}})();
S.notes=S.notes||[];
const save=()=>{try{localStorage.setItem("cdia",JSON.stringify(S))}catch(e){}};
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const now=new Date();
const key=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const utcDay=value=>{const [year,month,day]=value.split("-").map(Number);return Date.UTC(year,month-1,day)/864e5};
let today=key(now),viewKey=today,biblioteca={data_inicio:"2026-11-02",devocionais:[]},loading=true,loadError="";
function dateBox(d){return `<div class="date"><b>${MON[d.getMonth()]}</b><span>${d.getDate()}</span><i>${DOW[d.getDay()]}</i></div>`}
function devotionalFor(dateKey){
 if(!biblioteca.devocionais.length)return null;
 const offset=Math.floor(utcDay(dateKey)-utcDay(biblioteca.data_inicio));
 const index=((offset%biblioteca.devocionais.length)+biblioteca.devocionais.length)%biblioteca.devocionais.length;
 return biblioteca.devocionais[index];
}
function render(){
 const d=new Date(viewKey+"T12:00:00"),dev=devotionalFor(viewKey);
 let h=`<h1>Devocional diário</h1><p class="lead">Uma mensagem de fé para acompanhar sua caminhada, todos os dias.</p><div class="card">`;
 if(loading){
  h+=`<p class="muted">Carregando os devocionais…</p>`;
 }else if(loadError){
  h+=`<p class="warn">${esc(loadError)}</p>`;
 }else if(!biblioteca.devocionais.length){
  h+=`<div class="head">${dateBox(d)}<div><div class="kick">Sua biblioteca</div><h2>Pronta para receber seu primeiro texto</h2></div></div>
  <p class="muted">Adicione seus devocionais no arquivo <strong>devocionais.json</strong>. A publicação começa na data definida em <strong>data_inicio</strong>.</p>`;
 }else if(dev){
  const dayIndex=((Math.floor(utcDay(viewKey)-utcDay(biblioteca.data_inicio))%biblioteca.devocionais.length)+biblioteca.devocionais.length)%biblioteca.devocionais.length;
  h+=`<div class="head">${dateBox(d)}<div><div class="kick">${viewKey===today?"Devocional de hoje":"Devocional de "+d.toLocaleDateString("pt-BR")}</div><h2>${esc(dev.titulo)}</h2><span class="tag">Tema: ${esc(dev.tema)}</span></div></div>
  <div class="verse">“${esc(dev.versiculo)}”<cite>${esc(dev.referencia)}</cite></div>
  <div class="body">${dev.reflexao.map(p=>`<p>${esc(p)}</p>`).join("")}<p class="prayer">${esc(dev.oracao)}</p></div>
  <p class="muted">Devocional ${dayIndex+1} de ${biblioteca.devocionais.length} nesta sequência.</p>
  <button class="btn" onclick="openNotes()">📝 Escrever nota sobre este devocional</button>`;
 }
 $("app").innerHTML=h+`</div>`}
async function loadLibrary(){
 if(location.protocol==="file:")throw new Error("Abra o site por um servidor local para carregar devocionais.json.");
 const response=await fetch("devocionais.json",{cache:"no-store"});
 if(!response.ok)throw new Error("Não foi possível abrir devocionais.json.");
 const data=await response.json();
 if(!/^\d{4}-\d{2}-\d{2}$/.test(data.data_inicio)||!Array.isArray(data.devocionais))throw new Error("Confira data_inicio e devocionais no arquivo devocionais.json.");
 const valid=data.devocionais.every(dev=>dev&&[dev.titulo,dev.tema,dev.versiculo,dev.referencia,dev.oracao].every(value=>typeof value==="string"&&value.trim())&&Array.isArray(dev.reflexao)&&dev.reflexao.length>0&&dev.reflexao.every(paragraph=>typeof paragraph==="string"&&paragraph.trim()));
 if(!valid)throw new Error("Revise os campos dos devocionais em devocionais.json.");
 biblioteca=data;
}
function setTheme(t){
 if(t==="dark")document.documentElement.setAttribute("data-theme","dark");else document.documentElement.removeAttribute("data-theme");
 S.theme=t;save();const b=$("tbtn");if(b){b.textContent=t==="dark"?"☀️":"🌙";b.setAttribute("aria-label",t==="dark"?"Ativar tema claro":"Ativar tema escuro");b.title=t==="dark"?"Ativar tema claro":"Ativar tema escuro";}
}
function toggleTheme(){setTheme(S.theme==="dark"?"light":"dark")}
function toggleMenu(){const m=$("menu");if(!m.hidden){m.hidden=true;return}
 m.innerHTML=`<button onclick="openNotes()">📝 Notas deste devocional</button><button onclick="openArchive()">📚 Devocionais anteriores</button><button onclick="openDonate()">❤️ Apoiar o projeto</button>`;m.hidden=false}
document.addEventListener("click",e=>{if(!e.target.closest(".menuwrap"))$("menu").hidden=true});
function modal(html){$("menu").hidden=true;$("modal").innerHTML=`<div class="over" onclick="if(event.target===this)closeM()"><div class="sheet"><button class="x" onclick="closeM()" aria-label="Fechar">×</button>${html}</div></div>`}
function closeM(){$("modal").innerHTML=""}
function openNotes(){
 const mine=S.notes.filter(n=>n.k===viewKey),dev=devotionalFor(viewKey);
 modal(`<h3>Bloco de notas</h3><p class="muted">${dev?esc(dev.titulo)+" · "+esc(dev.referencia):"Devocional de "+viewKey}</p>
 <textarea id="nt" rows="4" placeholder="O que Deus falou ao seu coração com este devocional?"></textarea>
 <p><button class="btn" onclick="addNote()">Salvar nota</button></p>
 ${mine.map(n=>`<div class="note"><small>${new Date(n.id).toLocaleString("pt-BR")}</small>${esc(n.t).replace(/\n/g,"<br>")}<br><a onclick="delNote(${n.id})">Excluir</a></div>`).join("")||`<p class="muted">Nenhuma nota neste devocional ainda.</p>`}`)}
function addNote(){const t=$("nt").value.trim();if(!t)return;S.notes.unshift({id:Date.now(),k:viewKey,t});save();openNotes()}
function delNote(id){S.notes=S.notes.filter(n=>n.id!==id);save();openNotes()}
function openArchive(){
 const items=biblioteca.devocionais.map((dev,index)=>{const d=new Date(biblioteca.data_inicio+"T12:00:00");d.setDate(d.getDate()+index);const dateKey=key(d);return `<div class="note"><a style="font-size:1rem" onclick="viewKey='${dateKey}';closeM();render()">${dateKey.split("-").reverse().join("/")} · ${esc(dev.titulo)}</a></div>`}).join("");
 modal(`<h3>Devocionais da sequência</h3>${items||`<p class="muted">Seus textos aparecerão aqui depois que você preencher devocionais.json.</p>`}`)}
function copyPix(){try{navigator.clipboard.writeText(CONTATO.pix);$("cp").textContent="Copiado!"}catch(e){$("cp").textContent="Copie manualmente"}}
function openDonate(){
 const c=CONTATO,links=[];
 if(c.whatsapp)links.push(`<a class="btn" target="_blank" rel="noopener" href="https://wa.me/${c.whatsapp.replace(/\D/g,"")}">WhatsApp</a>`);
 if(c.email)links.push(`<a class="btn ghost" href="mailto:${esc(c.email)}">E-mail</a>`);
 if(c.instagram)links.push(`<a class="btn ghost" target="_blank" rel="noopener" href="https://instagram.com/${esc(c.instagram.replace("@",""))}">Instagram</a>`);
 modal(`<h3>❤️ Apoie o projeto</h3><p>O Caminhada é gratuito. Se este devocional abençoou a sua vida, você pode contribuir da forma que preferir, no valor que o seu coração indicar. Entre em contato e combinamos a melhor maneira.</p>
 ${c.pix?`<div class="muted">Chave Pix</div><div class="pix">${esc(c.pix)}</div><button class="btn ghost" id="cp" onclick="copyPix()">Copiar chave Pix</button>`:""}
 ${links.length?`<div class="contact">${links.join("")}</div>`:`<p class="muted">Os canais de contato serão divulgados em breve.</p>`}
 <p class="muted">Toda contribuição ajuda a manter o devocional diário no ar. Obrigado!</p>`)}
setTheme(S.theme==="dark"?"dark":"light");
render();
loadLibrary().then(()=>{loading=false;render()}).catch(error=>{loading=false;loadError=error.message;render()});