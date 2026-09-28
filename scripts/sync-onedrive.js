// Node 20+
// Reads the private Excel workbook from OneDrive through Microsoft Graph,
// selects only confirmed future Delegation rows, and writes public/data.json.
//
// Required environment variables:
// GRAPH_TENANT_ID
// GRAPH_CLIENT_ID
// GRAPH_CLIENT_SECRET
// ONEDRIVE_USER              e.g. delegation@agency.gov.sg
// ONEDRIVE_FILE_PATH         e.g. /Documents/ITV and Delegation Forecast.xlsx
// OUTPUT_FILE                optional, defaults to ./public/data.json

const fs = require("node:fs/promises");

const required = ["GRAPH_TENANT_ID","GRAPH_CLIENT_ID","GRAPH_CLIENT_SECRET","ONEDRIVE_USER","ONEDRIVE_FILE_PATH"];
for (const k of required) if (!process.env[k]) throw new Error(`Missing ${k}`);

async function token() {
  const body = new URLSearchParams({
    client_id:process.env.GRAPH_CLIENT_ID,
    client_secret:process.env.GRAPH_CLIENT_SECRET,
    scope:"https://graph.microsoft.com/.default",
    grant_type:"client_credentials"
  });
  const r=await fetch(`https://login.microsoftonline.com/${process.env.GRAPH_TENANT_ID}/oauth2/v2.0/token`,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body});
  if(!r.ok) throw new Error(`Token error ${r.status}: ${await r.text()}`);
  return (await r.json()).access_token;
}
async function graph(url, access) {
  const r=await fetch(url,{headers:{Authorization:`Bearer ${access}`}});
  if(!r.ok) throw new Error(`Graph ${r.status}: ${await r.text()}`);
  return r.json();
}
const clean=s=>String(s??"").trim();
const iso=v=>{
  if(!v) return null;
  const d=new Date(v);
  return Number.isNaN(d.getTime())?null:d.toISOString().slice(0,10);
};
const dateLabel=(from,till)=>{
  const a=new Date(from), b=new Date(till);
  const opts={day:"numeric",month:"short"};
  const left=a.toLocaleDateString("en-GB",opts);
  const right=b.toLocaleDateString("en-GB",opts);
  return from===till?left:`${left}–${right}`;
};
const people=(a,b)=>[clean(a),clean(b)].filter(x=>x && !/^na$/i.test(x)).join(" / ");

(async()=>{
  const access=await token();
  const base="https://graph.microsoft.com/v1.0";
  const encodedPath=process.env.ONEDRIVE_FILE_PATH.split("/").filter(Boolean).map(encodeURIComponent).join("/");
  const item=await graph(`${base}/users/${encodeURIComponent(process.env.ONEDRIVE_USER)}/drive/root:/${encodedPath}`,access);
  const used=await graph(`${base}/users/${encodeURIComponent(process.env.ONEDRIVE_USER)}/drive/items/${item.id}/workbook/worksheets('Tracker')/usedRange(valuesOnly=true)`,access);
  const rows=used.values||[];
  if(rows.length<2) throw new Error("Tracker sheet is empty.");
  const headers=rows[0].map(x=>clean(x));
  const idx=Object.fromEntries(headers.map((h,i)=>[h,i]));
  for(const h of ["From","Till","Confirm","Overseas Mission","Engineer 1","Engineer 2","ITV/Delegation"])
    if(!(h in idx)) throw new Error(`Missing Tracker column: ${h}`);

  const today=new Date(); today.setHours(0,0,0,0);
  const trips=[];
  for(const row of rows.slice(1)){
    const from=iso(row[idx["From"]]), till=iso(row[idx["Till"]]);
    const confirm=clean(row[idx["Confirm"]]).toLowerCase();
    const type=clean(row[idx["ITV/Delegation"]]).toLowerCase();
    const destination=clean(row[idx["Overseas Mission"]]);
    const person=people(row[idx["Engineer 1"]],row[idx["Engineer 2"]]);
    if(!from || !till || !destination || type!=="delegation") continue;
    if(confirm!=="confirm") continue;
    if(new Date(till)<today) continue;
    if(!person) continue;
    trips.push({from,till,dateLabel:dateLabel(from,till),destination,person,type:"Delegation"});
  }
  trips.sort((a,b)=>a.from.localeCompare(b.from));
  const payload={updatedAt:new Date().toISOString(),trips};
  const out=process.env.OUTPUT_FILE||"public/data.json";
  await fs.writeFile(out,JSON.stringify(payload,null,2)+"\n");
  console.log(`Wrote ${trips.length} public delegation trips to ${out}`);
})();
