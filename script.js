// ===== PREENCHA SEUS CANAIS DE CONTATO PARA DOAÇÕES =====
const CONTATO={whatsapp:"",email:"",pix:"",instagram:""};
// ========================================================
const THEMES=["O amor de Cristo na cruz","Amar o próximo","Perdão que liberta","A graça que nos sustenta","Esperança que não se apaga","A paz que excede o entendimento","Gratidão em todas as coisas","Fé como confiança","Oração simples e sincera","Humildade de coração","Perseverar no caminho","A alegria do Senhor","Misericórdia que se renova","Sabedoria para o dia a dia","Descansar em Deus","Propósito e chamado","Família e lar","Cura das feridas interiores","Confiar quando não entendemos","Uma vida santa","Servir como Jesus serviu","Comunhão com os irmãos","Entregar a ansiedade","Coragem para seguir","Bondade que transforma","Reconciliação","Adoração de todo o coração","Recomeçar com Deus","Paciência e espera","Jesus, o Bom Pastor","Ser luz no mundo"];
const DOW=["DOMINGO","SEGUNDA","TERÇA","QUARTA","QUINTA","SEXTA","SÁBADO"];
const MON=["JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];
const S=(()=>{try{return JSON.parse(localStorage.getItem("cdia")||"{}")}catch(e){return{}}})();
S.dev=S.dev||{};S.notes=S.notes||[];
const save=()=>{try{localStorage.setItem("cdia",JSON.stringify(S))}catch(e){}};
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const now=new Date();
const key=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const doy=Math.floor((now-new Date(now.getFullYear(),0,0))/864e5);
let today=key(now),viewKey=today,theme=THEMES[doy%THEMES.length],busy=false,err="";
function dateBox(d){return `<div class="date"><b>${MON[d.getMonth()]}</b><span>${d.getDate()}</span><i>${DOW[d.getDay()]}</i></div>`}
function render(){
 const d=new Date(viewKey+"T12:00:00"),dev=S.dev[viewKey];
 let h=`<h1>Devocional diário</h1><p class="lead">A cada dia um devocional novo, gerado com IA, para você conhecer mais o amor de Cristo.</p><div class="card">`;
 if(dev){
  h+=`<div class="head">${dateBox(d)}<div><div class="kick">${viewKey===today?"Devocional de hoje":"Devocional de "+d.toLocaleDateString("pt-BR")}</div><h2>${esc(dev.titulo)}</h2><span class="tag">Tema: ${esc(dev.tema)}</span></div></div>
  <div class="verse">“${esc(dev.versiculo)}”<cite>${esc(dev.referencia)}</cite></div>
  <div class="body">${dev.reflexao.map(p=>`<p>${esc(p)}</p>`).join("")}<p class="prayer">${esc(dev.oracao)}</p></div>
  <button class="btn" onclick="openNotes()">📝 Escrever nota sobre este devocional</button>
  <p class="warn">Conteúdo gerado por IA. Confira os versículos na sua Bíblia e converse com a sua liderança sobre dúvidas de doutrina.</p>`;
 } else {
  h+=`<div class="head">${dateBox(d)}<div><div class="kick">Devocional de hoje</div><h2>Tema de hoje: ${esc(theme)}</h2></div></div>
  <p class="muted">Ainda não há devocional para hoje neste navegador. Gere o de hoje com IA.</p>
  <p><button class="btn" onclick="generate()" ${busy?"disabled":""}>${busy?"Gerando…":"Gerar devocional de hoje"}</button></p>${err?`<p class="warn">${esc(err)}</p>`:""}`;
 }
 $("app").innerHTML=h+`</div>`}
function saveDev(r){
 if(!r||!r.titulo||!Array.isArray(r.reflexao))throw new Error("Resposta incompleta da IA.");
 S.dev[today]={titulo:r.titulo,versiculo:r.versiculo||"",referencia:r.referencia||"",reflexao:r.reflexao,oracao:r.oracao||"",tema:r.tema||theme};save();
}
function parseDev(t){
 const a=t.indexOf("{"),b=t.lastIndexOf("}");
 if(a<0||b<a)throw new Error("A IA não devolveu o formato esperado.");
 return JSON.parse(t.slice(a,b+1));
}
async function loadFromFile(){
 // Fora do Claude: lê o devocional do dia gerado pelo seu servidor (devocional-hoje.json)
 if(location.protocol==="file:")throw new Error("Abra o site por um servidor local (rode: python -m http.server) para ler o devocional-hoje.json.");
 const res=await fetch("devocional-hoje.json",{cache:"no-store"});
 if(!res.ok)throw new Error("O devocional de hoje ainda não foi publicado.");
 saveDev(await res.json());
}
async function generate(){
 busy=true;err="";render();
 try{
  let sample=null;
  try{sample=(typeof claude!=="undefined")?await claude.use("sample"):null}catch(e){}
  if(!sample){await loadFromFile();busy=false;render();return}
  const d=now.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const recent=Object.keys(S.dev).sort().slice(-15).map(k=>S.dev[k].titulo);
  const prompt=`Você escreve devocionais cristãos em português do Brasil, com linguagem acolhedora e simples, para o dia ${d}. Tema do dia: ${theme}. O fio condutor é o amor de Cristo.
Regras: título criativo e curto, diferente destes já usados: ${recent.length?recent.join("; "):"(nenhum ainda)"}. Use um versículo curto da Bíblia (Almeida) que você tenha certeza de que está correto. Reflexão de 3 parágrafos curtos e práticos, sem tom de julgamento e sem afirmar doutrinas de uma denominação específica. Termine com uma oração curta em primeira pessoa.
Responda SOMENTE com um objeto JSON, sem texto antes ou depois e sem markdown: {"titulo":"...","versiculo":"texto do versículo","referencia":"Livro cap:vers","reflexao":["p1","p2","p3"],"oracao":"..."}`;
  let lastErr;
  for(let i=0;i<2;i++){
   try{const out=await sample(prompt,{cache:false});saveDev(parseDev(out.text));lastErr=null;break}
   catch(e){lastErr=e;if(e&&e.code)break}
  }
  if(lastErr)throw lastErr;
 }catch(e){
  err=(e&&e.code==="not_granted")?"É preciso permitir a geração por IA para continuar.":"Não foi possível gerar agora"+(e&&e.code?" ("+e.code+")":"")+": "+((e&&e.message)||"tente novamente")+"";
 }
 busy=false;render()}
function setTheme(t){
 if(t==="dark")document.documentElement.setAttribute("data-theme","dark");else document.documentElement.removeAttribute("data-theme");
 S.theme=t;save();const b=$("tbtn");if(b)b.textContent=t==="dark"?"☀️":"🌙";
}
function toggleTheme(){setTheme(S.theme==="dark"?"light":"dark")}
function toggleMenu(){const m=$("menu");if(!m.hidden){m.hidden=true;return}
 m.innerHTML=`<button onclick="openNotes()">📝 Notas deste devocional</button><button onclick="openArchive()">📚 Devocionais anteriores</button><button onclick="openDonate()">❤️ Apoiar o projeto</button>`;m.hidden=false}
document.addEventListener("click",e=>{if(!e.target.closest(".menuwrap"))$("menu").hidden=true});
function modal(html){$("menu").hidden=true;$("modal").innerHTML=`<div class="over" onclick="if(event.target===this)closeM()"><div class="sheet"><button class="x" onclick="closeM()" aria-label="Fechar">×</button>${html}</div></div>`}
function closeM(){$("modal").innerHTML=""}
function openNotes(){
 const mine=S.notes.filter(n=>n.k===viewKey),dev=S.dev[viewKey];
 modal(`<h3>Bloco de notas</h3><p class="muted">${dev?esc(dev.titulo)+" · "+esc(dev.referencia):"Devocional de "+viewKey}</p>
 <textarea id="nt" rows="4" placeholder="O que Deus falou ao seu coração com este devocional?"></textarea>
 <p><button class="btn" onclick="addNote()">Salvar nota</button></p>
 ${mine.map(n=>`<div class="note"><small>${new Date(n.id).toLocaleString("pt-BR")}</small>${esc(n.t).replace(/\n/g,"<br>")}<br><a onclick="delNote(${n.id})">Excluir</a></div>`).join("")||`<p class="muted">Nenhuma nota neste devocional ainda.</p>`}`)}
function addNote(){const t=$("nt").value.trim();if(!t)return;S.notes.unshift({id:Date.now(),k:viewKey,t});save();openNotes()}
function delNote(id){S.notes=S.notes.filter(n=>n.id!==id);save();openNotes()}
function openArchive(){
 const ks=Object.keys(S.dev).sort().reverse();
 modal(`<h3>Devocionais anteriores</h3>`+(ks.map(k=>`<div class="note"><a style="font-size:1rem" onclick="viewKey='${k}';closeM();render()">${k.split("-").reverse().join("/")} · ${esc(S.dev[k].titulo)}</a></div>`).join("")||`<p class="muted">Os devocionais gerados aparecerão aqui.</p>`))}
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
if(!S.dev[today]&&typeof claude==="undefined"){loadFromFile().then(render).catch(()=>{})}