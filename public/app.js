const state={trips:[],period:"all",person:"all"};
const $=s=>document.querySelector(s);
const parse=d=>new Date(`${d}T00:00:00`);
const monthKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;

function render(){
  const now=new Date();
  const thisMonth=monthKey(now);
  const next=new Date(now.getFullYear(),now.getMonth()+1,1);
  const nextMonth=monthKey(next);
  let trips=state.trips.filter(t=>{
    const d=parse(t.from);
    if(state.person!=="all" && t.person!==state.person) return false;
    if(state.period==="month" && monthKey(d)!==thisMonth) return false;
    if(state.period==="next" && monthKey(d)!==nextMonth) return false;
    return d>=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  });
  trips.sort((a,b)=>a.from.localeCompare(b.from));
  $("#cards").innerHTML=trips.map(t=>`
    <article class="card">
      <div class="card-top"><div class="date">${esc(t.dateLabel)}</div><span class="badge">Delegation</span></div>
      <div class="destination">${flag(t.destination)} ${esc(t.destination)}</div>
      <div class="person">${esc(t.person)}</div>
      <div class="meta">${fmt(parse(t.from))} → ${fmt(parse(t.till))}</div>
    </article>`).join("");
  $("#empty").hidden=trips.length!==0;
}
function fmt(d){return d.toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"})}
function flag(s){
  const map={Brunei:"🇧🇳",Norway:"🇳🇴",Sweden:"🇸🇪",Philippines:"🇵🇭",China:"🇨🇳",Australia:"🇦🇺"};
  if(s==="Qatar and UAE") return "🇶🇦🇦🇪";
  return map[s]||"🌏";
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

async function init(){
  const r=await fetch("data.json",{cache:"no-store"}); const d=await r.json();
  state.trips=d.trips||[];
  $("#updated").textContent=new Date(d.updatedAt).toLocaleString(undefined,{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
  [...new Set(state.trips.map(t=>t.person).filter(Boolean))].sort().forEach(p=>$("#person").insertAdjacentHTML("beforeend",`<option>${esc(p)}</option>`));
  render();
}
document.querySelectorAll("[data-period]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-period]").forEach(x=>x.classList.remove("active"));b.classList.add("active");state.period=b.dataset.period;render()});
$("#person").onchange=e=>{state.person=e.target.value;render()};
init().catch(()=>{$("#empty").hidden=false;$("#empty").textContent="Dashboard data could not be loaded.";});
