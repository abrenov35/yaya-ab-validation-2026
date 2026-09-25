(function(){
"use strict";

var API="https://script.google.com/macros/s/AKfycbxXBpXjWXEF-7p6vvOE3blSBc8_5e62AtQb2stHjnrGE025cOxQGy-zAguYmN2u9O4K/exec";
var state={data:null,page:"chantiers",selected:null,tab:"documents",query:"",loadedAt:null,source:"prod",statsYear:new Date().getFullYear(),commandOverrides:{},overrides:{}};
var STATUTS=["Signé","À programmer","En cours","SAV","Attente PV","Facturé","Clos facturé","Archivé"];

function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]);});}
function n(v){if(typeof v==="number")return isFinite(v)?v:0;var s=String(v==null?"":v).trim().replace(/\s/g,"").replace(",",".");var x=Number(s);return isFinite(x)?x:0;}
function eur(v){return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n(v));}
function pct(v){return new Intl.NumberFormat("fr-FR",{maximumFractionDigits:1}).format(n(v))+" %";}
function dateFr(v){
  if(v==null||v==="")return "—";
  if(typeof v==="number"){
    if(v>=1900&&v<=2200&&Math.floor(v)===v)return String(v);
    var d=new Date(Math.round((v-25569)*86400*1000));
    return isNaN(d)?String(v):d.toLocaleDateString("fr-FR");
  }
  var s=String(v);
  if(/^\d{4}-\d{2}-\d{2}/.test(s)){var d2=new Date(s.slice(0,10)+"T12:00:00");return isNaN(d2)?s:d2.toLocaleDateString("fr-FR");}
  if(/^\d{4}$/.test(s))return s;
  var d3=new Date(s);return isNaN(d3)?s:d3.toLocaleDateString("fr-FR");
}

var pdfJsPromise=null;
function driveIdFromUrl(value){
  var s=String(value||"").trim(),m=s.match(/drive\.google\.com\/file\/d\/([^/?#]+)/i);
  if(m)return m[1];
  m=s.match(/[?&]id=([^&#]+)/i);
  return m?decodeURIComponent(m[1]):"";
}
function ensurePdfJs(){
  if(window.pdfjsLib)return Promise.resolve(window.pdfjsLib);
  if(pdfJsPromise)return pdfJsPromise;
  pdfJsPromise=new Promise(function(resolve,reject){
    var script=document.createElement("script");
    script.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async=true;
    script.onload=function(){
      if(!window.pdfjsLib){reject(new Error("PDF.js indisponible"));return;}
      try{window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";}catch(e){}
      resolve(window.pdfjsLib);
    };
    script.onerror=function(){reject(new Error("Chargement du lecteur PDF impossible"));};
    document.head.appendChild(script);
  }).catch(function(e){pdfJsPromise=null;throw e;});
  return pdfJsPromise;
}
function viewerRoot(){
  var root=document.getElementById("yaya2Viewer");
  if(root)return root;
  root=document.createElement("div");
  root.id="yaya2Viewer";
  document.body.appendChild(root);
  return root;
}
function closeViewer(){
  var root=document.getElementById("yaya2Viewer");
  if(root)root.remove();
}
function viewerFrame(title){
  var root=viewerRoot();
  root.innerHTML='<div class="y2v-overlay"><div class="y2v-modal"><div class="y2v-head"><div class="y2v-title">'+esc(title||"Document")+'</div><div class="y2v-actions"><button class="btn" data-y2v-close>Fermer</button></div></div><div class="y2v-stage"><div class="y2v-loading">Chargement du document…</div></div></div></div>';
  var overlay=root.querySelector(".y2v-overlay");
  overlay.onclick=function(e){if(e.target===overlay)closeViewer();};
  root.querySelector("[data-y2v-close]").onclick=closeViewer;
  return {root:root,stage:root.querySelector(".y2v-stage"),head:root.querySelector(".y2v-head")};
}
function drivePageSrc(id,page,width){
  return "https://drive.google.com/file/d/"+encodeURIComponent(id)+"/image?pagenumber="+Math.max(1,page)+"&w="+Math.max(1000,width||1800);
}
function loadPreviewImage(src,timeoutMs){
  return new Promise(function(resolve,reject){
    var img=new Image(),done=false;
    function finish(ok){
      if(done)return;done=true;clearTimeout(timer);img.onload=img.onerror=null;
      ok?resolve(img):reject(new Error("Image indisponible"));
    }
    var timer=setTimeout(function(){finish(false);},timeoutMs||6000);
    img.onload=function(){finish(img.naturalWidth>50&&img.naturalHeight>50);};
    img.onerror=function(){finish(false);};
    img.src=src;
  });
}
async function showDrivePdf(stage,id){
  stage.innerHTML="";
  stage.className="y2v-stage y2v-pdf-stage";
  var wrap=document.createElement("div");wrap.className="y2v-pdf-pages";stage.appendChild(wrap);
  var width=Math.max(1000,Math.min(2200,Math.round((stage.clientWidth||1000)*1.6))),count=0;
  for(var page=1;page<=60;page++){
    var img;
    try{img=await loadPreviewImage(drivePageSrc(id,page,width),5000);}
    catch(e){if(page===1)throw e;break;}
    var pw=document.createElement("div");pw.className="y2v-page";
    img.style.cssText="display:block;width:100%;height:auto;max-width:100%;margin:0;";
    pw.appendChild(img);wrap.appendChild(pw);count++;
  }
  if(!count)throw new Error("Aucune page PDF lisible");
  stage.scrollTop=0;
}
async function showDriveImage(stage,id){
  stage.innerHTML='<div class="y2v-loading">Chargement de l’image…</div>';
  var img=await loadPreviewImage("https://drive.google.com/thumbnail?id="+encodeURIComponent(id)+"&sz=w2200",7000);
  stage.innerHTML="";img.className="y2v-image";stage.appendChild(img);
}
function isDropbox(value){return /dropbox\.com|dropboxusercontent\.com/i.test(String(value||""));}
function dropboxDirect(value){
  try{
    var u=new URL(String(value||""));
    if(/(^|\.)dropbox\.com$/i.test(u.hostname))u.hostname="dl.dropboxusercontent.com";
    u.searchParams.delete("dl");u.searchParams.delete("raw");u.searchParams.delete("st");
    return u.toString();
  }catch(e){return String(value||"");}
}
async function showDropbox(stage,url,title){
  var response=await fetch(dropboxDirect(url),{cache:"no-store",credentials:"omit"});
  if(!response.ok)throw new Error("Dropbox HTTP "+response.status);
  var blob=await response.blob();
  if(!blob.size)throw new Error("Fichier Dropbox vide");
  var blobUrl=URL.createObjectURL(blob);
  if(String(blob.type||"").indexOf("image/")===0){
    stage.innerHTML="";var img=document.createElement("img");img.className="y2v-image";img.src=blobUrl;stage.appendChild(img);return;
  }
  if(String(blob.type||"")==="application/pdf"||/\.pdf$/i.test(String(title||""))){
    stage.innerHTML="";var frame=document.createElement("iframe");frame.className="y2v-local-frame";frame.src=blobUrl;frame.title=title||"PDF";stage.appendChild(frame);return;
  }
  throw new Error("Format Dropbox non prévisualisable");
}
async function showInternalInStage(stage,url,title){
  try{
    var value=String(url||"").trim(),id=driveIdFromUrl(value);
    if(id){
      if(/\.(jpg|jpeg|png|webp|gif)$/i.test(String(title||"")))await showDriveImage(stage,id);
      else await showDrivePdf(stage,id);
      return;
    }
    if(isDropbox(value)){await showDropbox(stage,value,title);return;}
    throw new Error("Ce format de lien n’est pas encore pris en charge");
  }catch(err){
    stage.innerHTML='<div class="y2v-error">Aperçu indisponible.<br>'+esc(err&&err.message?err.message:err)+'</div>';
  }
}
async function openInternalDocument(url,title){
  var ui=viewerFrame(title);
  await showInternalInStage(ui.stage,url,title);
}
function openMailViewer(mail){
  var id=String(mail&&mail.id||mail&&mail.messageId||"");
  var atts=mailAttachments(id),root=viewerRoot();
  root.innerHTML='<div class="y2v-overlay"><div class="y2v-modal"><div class="y2v-head"><div class="y2v-mail-tabs"></div><div class="y2v-actions"><button class="btn" data-y2v-close>Fermer</button></div></div><div class="y2v-stage"></div></div></div>';
  var stage=root.querySelector(".y2v-stage"),tabs=root.querySelector(".y2v-mail-tabs");
  root.querySelector("[data-y2v-close]").onclick=closeViewer;
  function active(btn){tabs.querySelectorAll("button").forEach(function(b){b.classList.toggle("active",b===btn);});}
  var mb=document.createElement("button");mb.type="button";mb.textContent="Mail";mb.className="active";
  mb.onclick=function(){
    active(mb);
    stage.className="y2v-stage y2v-mail-stage";
    var subject=String(mail.objet||mail.objetMail||"Mail");
    var sender=String(mail.expediteur||mail.sujet||"");
    var body=String(mail.corps||mail.contenuMail||mail.titre||"");
    stage.innerHTML='<div class="y2v-mail"><h2>'+esc(subject)+'</h2><div class="y2v-mail-meta">'+esc(sender)+'</div><div class="y2v-mail-body">'+esc(body).replace(/\n/g,"<br>")+'</div></div>';
  };
  tabs.appendChild(mb);
  atts.forEach(function(d,index){
    var b=document.createElement("button");b.type="button";b.textContent="PJ "+(index+1);b.title=String(d.titre||"Pièce jointe");
    b.onclick=function(){active(b);stage.className="y2v-stage";stage.innerHTML='<div class="y2v-loading">Chargement de la pièce…</div>';showInternalInStage(stage,d.lien,d.titre);};
    tabs.appendChild(b);
  });
  mb.onclick();
}
function typeNorm(v){return String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
function activeRows(rows){return (rows||[]).filter(function(r){var s=String(r.statutValidation||"").toUpperCase();return s!=="A_VALIDER"&&s!=="REJETEE"&&s!=="DOUBLON";});}
function isSub(r){return typeNorm(r.typeDoc).indexOf("facture sous-traitant")>=0||String(r.sousTraitant||"").trim()!=="";}
function purchaseImpact(r){
  var t=typeNorm(r.typeDoc);
  if(isSub(r)||t==="devis"||t==="bon de commande")return 0;
  var a=n(r.montantHT);
  return t==="avoir"?-Math.abs(a):a;
}
function chargeImpact(r){
  if(!isSub(r))return 0;
  var a=n(r.montantHT),t=typeNorm(r.typeDoc);
  return t==="avoir"?-Math.abs(a):a;
}
function rowsFor(name,cid,key){key=key||"chantierId";return ((state.data&&state.data[name])||[]).filter(function(r){return String(r[key]||"")===String(cid);});}
function chantierById(id){return ((state.data&&state.data.chantiers)||[]).find(function(c){return String(c.id)===String(id);});}
function activityTime(v){
  if(v==null||v==="")return 0;
  if(typeof v==="number"){
    var d=new Date(Math.round((v-25569)*86400*1000));
    return isNaN(d)?0:d.getTime();
  }
  var s=String(v).trim();
  if(/^\d{4}-\d{2}-\d{2}/.test(s)){
    var d2=new Date(s.length===10?s+"T12:00:00":s);
    return isNaN(d2)?0:d2.getTime();
  }
  var d3=new Date(s);
  return isNaN(d3)?0:d3.getTime();
}
function recentActivityFor(cid){
  var acts=[];
  rowsFor("documents",cid).forEach(function(r){
    var t=typeNorm(r.type),label=t==="photo"?"Photo":(t==="mail"||t==="mail_pj"?"Mail / document":"Document");
    acts.push({ts:activityTime(r.date),label:label});
  });
  rowsFor("achats",cid).forEach(function(r){
    acts.push({ts:activityTime(r.date),label:isSub(r)?"Charge":"Achat"});
  });
  rowsFor("commandes",cid).forEach(function(r){
    acts.push({ts:activityTime(r.date),label:"Commande"});
  });
  ((state.data&&state.data.DEVIS)||[]).forEach(function(r){
    if(String(r["ID chantier"]||"")===String(cid))acts.push({ts:activityTime(r.Date),label:"Devis"});
  });
  ((state.data&&state.data.heures)||[]).forEach(function(r){
    if(String(r.type)==="chantier"&&String(r.ref)===String(cid))acts.push({ts:activityTime(r[""]||r.semaine),label:"Heures"});
  });
  acts=acts.filter(function(a){return a.ts>0;}).sort(function(a,b){return b.ts-a.ts;});
  return acts[0]||null;
}
function chantierView(c){var o=state.overrides[c.id]||{};return Object.assign({},c,o);}
function finances(cid){
  var achats=activeRows(rowsFor("achats",cid));
  var purchases=achats.reduce(function(s,r){return s+purchaseImpact(r);},0);
  var charges=achats.reduce(function(s,r){return s+chargeImpact(r);},0);
  var heures=((state.data&&state.data.heures)||[]).filter(function(h){return String(h.type)==="chantier"&&String(h.ref)===String(cid);});
  var qty=heures.reduce(function(s,h){return s+n(h.heures);},0);
  var labor=qty*50;
  var c=chantierById(cid)||{};
  var ca=n(c.montantMarcheHT);
  var margin=ca-purchases-charges-labor;
  return{ca:ca,purchases:purchases,charges:charges,hours:qty,labor:labor,margin:margin,marginPct:ca?margin/ca*100:0};
}
function badgeStatus(s){
  var x=typeNorm(s),cl="";
  if(x.indexOf("clos")>=0||x.indexOf("facture")>=0)cl=" good";
  else if(x.indexOf("sav")>=0||x.indexOf("attente")>=0)cl=" warn";
  return '<span class="badge'+cl+'">'+esc(s||"—")+"</span>";
}
function navBtn(page,label){
  return '<button data-page="'+page+'" class="'+(state.page===page?"active":"")+'">'+label+"</button>";
}
function shell(content,title){
  var loaded=state.loadedAt?state.loadedAt.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}):"—";
  var sourceLabel=state.source==="cache"?"Dernières données connues · "+loaded:"Données PROD lues à "+loaded;
  return '<div class="shell">'+
    '<aside class="sidebar"><div class="brand"><div class="brand-mark">AB</div><div><div class="brand-title">Yaya 2</div><div class="brand-sub">AB RENOV 35</div></div></div>'+
    '<nav class="nav">'+
      navBtn("chantiers","Chantiers")+navBtn("documents","Documents & mails")+navBtn("achats","Achats")+navBtn("charges","Charges")+navBtn("commandes","Commandes")+navBtn("devis","Devis")+navBtn("heures","Heures")+navBtn("stats","CA signé")+
    '</nav><div class="sidebar-foot"><span class="test-pill">MODE TEST</span><br>Lecture PROD uniquement.<br>Les modifications de cette session ne sont jamais envoyées à Yaya.</div></aside>'+
    '<main class="main"><header class="topbar"><div class="top-title">'+esc(title||"Yaya 2")+'</div><div class="top-meta"><span class="read-label"><span class="status-dot"></span>'+sourceLabel+'</span><button class="btn" data-action="reload">Actualiser</button></div></header><div class="content">'+content+'</div></main>'+
    '<nav class="mobile-nav">'+navBtn("chantiers","Chantiers")+navBtn("heures","Heures")+navBtn("stats","CA signé")+'</nav>'+
  '</div>';
}
function pageHead(title,sub,action){return '<div class="page-head"><div><h1>'+esc(title)+'</h1><p>'+esc(sub||"")+'</p></div>'+(action||"")+'</div>';}
function kpi(label,value,sub,cls){return '<div class="kpi"><div class="label">'+esc(label)+'</div><div class="value '+(cls||"")+'">'+value+'</div><div class="sub">'+esc(sub||"")+'</div></div>';}
function dashboard(){
  var cs=(state.data.chantiers||[]).filter(function(c){return /^C\d+$/.test(String(c.id||""));});
  var recent=cs.map(function(c){
    return {chantier:c,activity:recentActivityFor(c.id)};
  }).filter(function(x){return !!x.activity;})
    .sort(function(a,b){return b.activity.ts-a.activity.ts;})
    .slice(0,12);

  var html=pageHead("Activité récente","Les derniers chantiers ayant réellement bougé dans Yaya.");
  html+='<div class="panel"><div class="panel-head"><h2>Dernières activités</h2><span>'+recent.length+' chantier(s)</span></div><div class="table-wrap"><table><thead><tr><th>Chantier</th><th>Dernière activité</th><th>Date</th><th class="money">CA HT</th><th class="money">Marge</th></tr></thead><tbody>';
  recent.forEach(function(x){
    var c=x.chantier,v=chantierView(c),f=finances(c.id);
    html+='<tr class="clickable" data-chantier="'+esc(c.id)+'"><td class="strong">'+esc(c.nom)+'</td><td><span class="badge">'+esc(x.activity.label)+'</span></td><td>'+dateFr(new Date(x.activity.ts).toISOString())+'</td><td class="money">'+eur(f.ca)+'</td><td class="money '+(f.margin>=0?"margin-good":"margin-bad")+'">'+eur(f.margin)+'</td></tr>';
  });
  html+="</tbody></table></div></div>";
  return shell(html,"Activité récente");
}
function chantierList(){
  var q=typeNorm(state.query);
  var cs=(state.data.chantiers||[]).filter(function(c){
    return !q||typeNorm((c.nom||"")+" "+(c.id||"")+" "+(c.numero||"")).indexOf(q)>=0;
  });
  cs.sort(function(a,b){return String(a.nom||"").localeCompare(String(b.nom||""),"fr");});

  var html='<div class="chantier-search-row"><input class="search" id="searchChantiers" placeholder="Rechercher un chantier…" value="'+esc(state.query)+'"></div>';
  html+='<div class="panel"><div class="panel-head compact"><h2>Chantiers</h2><span>'+cs.length+'</span></div><div class="table-wrap"><table><thead><tr><th>Chantier</th><th>Signé le</th><th class="money">CA HT</th><th class="money">Marge</th></tr></thead><tbody>';
  cs.forEach(function(c){
    var f=finances(c.id);
    html+='<tr class="clickable" data-chantier="'+esc(c.id)+'"><td class="strong">'+esc(c.nom)+'</td><td>'+dateFr(c.dateSignature)+'</td><td class="money">'+eur(f.ca)+'</td><td class="money '+(f.margin>=0?"margin-good":"margin-bad")+'">'+eur(f.margin)+'</td></tr>';
  });
  html+="</tbody></table></div></div>";
  return shell(html,"Chantiers");
}
function tabButton(key,label){return '<button data-tab="'+key+'" class="'+(state.tab===key?"active":"")+'">'+label+"</button>";}
function docsFor(cid){
  var docs=rowsFor("documents",cid).filter(function(d){return typeNorm(d.type)!=="photo";});
  var mails=rowsFor("MAILS",cid);
  var combined=[];
  mails.forEach(function(m){
    combined.push({kind:"MAIL",id:m.id||m.messageId,title:m.objet||"Mail",sub:m.expediteur||"",date:m.date,link:m.lienGmail||"",body:m.corps||""});
  });
  docs.forEach(function(d){
    combined.push({kind:d.type||"Document",id:d.id,title:d.objetMail||d.titre||"Document",sub:d.sujet||"",date:d.date,link:d.lien||"",body:d.contenuMail||d.titre||""});
  });
  combined.sort(function(a,b){return String(b.date||"").localeCompare(String(a.date||""));});
  return combined;
}
function mailById(id){
  id=String(id||"");
  return (state.data.documents||[]).find(function(d){return String(d.id||"")===id&&typeNorm(d.type)==="mail";})||
         (state.data.MAILS||[]).find(function(m){return String(m.id||m.messageId||"")===id})||null;
}
function mailAttachments(id){
  id=String(id||"");
  return (state.data.documents||[]).filter(function(d){
    return typeNorm(d.type)==="mail_pj"&&String(d.sujet||d.mailId||d.parentMailId||"")===id;
  });
}
function rowsTable(headers,rows){
  if(!rows.length)return '<div class="empty">Aucun élément pour ce chantier.</div>';
  var h="<div class=\"table-wrap\"><table><thead><tr>"+headers.map(function(x){return "<th>"+x+"</th>";}).join("")+"</tr></thead><tbody>";
  rows.forEach(function(r){h+="<tr>"+r.join("")+"</tr>";});
  return h+"</tbody></table></div>";
}
function normalizeCommandeStatus(v){
  var s=typeNorm(v);
  if(s==="choice"||s.indexOf("attente choix")>=0||s.indexOf("choix client")>=0)return "choice";
  if(s==="todo"||s.indexOf("a commander")>=0)return "todo";
  if(s==="ordered"||s.indexOf("commande")>=0)return "ordered";
  if(s==="received"||s.indexOf("recu")>=0)return "received";
  return "choice";
}
function commandeStatusLabel(v){
  var s=normalizeCommandeStatus(v);
  return s==="todo"?"À commander":s==="ordered"?"Commandé":s==="received"?"Reçu":"Attente choix";
}
function commandeStatusSelect(o){
  var id=String(o.id||"");
  var current=state.commandOverrides[id]||normalizeCommandeStatus(o.statut||o.status);
  var opts=[["choice","Attente choix"],["todo","À commander"],["ordered","Commandé"],["received","Reçu"]];
  return '<select class="cmd-status-select" data-command-status="'+esc(id)+'">'+opts.map(function(x){return '<option value="'+x[0]+'" '+(x[0]===current?"selected":"")+'>'+x[1]+'</option>';}).join("")+'</select>';
}
function chantierTab(cid){
  if(state.tab==="documents"){
    var docs=docsFor(cid);if(!docs.length)return '<div class="empty">Aucun document ou mail pour ce chantier.</div>';
    return docs.map(function(d){
      var action="—";
      if(typeNorm(d.kind)==="mail")action='<button class="doc-link y2-open-mail" type="button" data-mail-id="'+esc(d.id||"")+'">Ouvrir</button>';
      else if(d.link)action='<button class="doc-link y2-open-doc" type="button" data-doc-url="'+esc(d.link)+'" data-doc-title="'+esc(d.title||d.kind||"Document")+'">Ouvrir</button>';
      return '<div class="doc-row"><div class="doc-type">'+esc(d.kind)+'</div><div class="doc-title">'+esc(d.title)+'</div><div class="muted">'+esc(d.sub)+'</div><div class="muted">'+dateFr(d.date)+'</div><div>'+action+'</div></div>';
    }).join("");
  }
  if(state.tab==="achats"){
    var a=activeRows(rowsFor("achats",cid)).filter(function(r){return purchaseImpact(r)!==0;});
    return rowsTable(["Date","Fournisseur","Type","Désignation","Montant HT"],a.map(function(r){return["<td>"+dateFr(r.date)+"</td>","<td class=\"strong\">"+esc(r.fournisseur)+"</td>","<td>"+esc(r.typeDoc)+"</td>","<td>"+esc(r.designation)+"</td>","<td class=\"money\">"+eur(purchaseImpact(r))+"</td>"];}));
  }
  if(state.tab==="charges"){
    var c=activeRows(rowsFor("achats",cid)).filter(isSub);
    return rowsTable(["Date","Sous-traitant","Désignation","Montant HT"],c.map(function(r){return["<td>"+dateFr(r.date)+"</td>","<td class=\"strong\">"+esc(r.sousTraitant||r.fournisseur)+"</td>","<td>"+esc(r.designation)+"</td>","<td class=\"money\">"+eur(chargeImpact(r))+"</td>"];}));
  }
  if(state.tab==="commandes"){
    var co=rowsFor("commandes",cid);
    return rowsTable(["Date","Fournisseur","Désignation","Statut","Montant"],co.map(function(r){
      return[
        "<td>"+dateFr(r.date)+"</td>",
        "<td class=\"strong\">"+esc(r.fournisseur)+"</td>",
        "<td>"+esc(r.designation)+"</td>",
        "<td>"+commandeStatusSelect(r)+"</td>",
        "<td class=\"money\">"+eur(r.montantHT)+"</td>"
      ];
    }));
  }
  if(state.tab==="photos"){
    var ph=rowsFor("documents",cid).filter(function(d){return typeNorm(d.type)==="photo";});
    if(!ph.length)return '<div class="empty">Aucune photo pour ce chantier.</div>';
    ph.sort(function(a,b){return String(b.date||"").localeCompare(String(a.date||""));});
    var html='<div class="photo-grid">';
    ph.forEach(function(d){
      var id=driveIdFromUrl(d.lien||"");
      var thumb=id?'https://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz=w900':String(d.lien||"");
      html+='<button class="photo-card y2-open-doc" type="button" data-doc-url="'+esc(d.lien||"")+'" data-doc-title="'+esc(d.sujet||d.titre||"Photo")+'">'
        +'<div class="photo-thumb-wrap">'+(thumb?'<img class="photo-thumb" src="'+esc(thumb)+'" alt="'+esc(d.sujet||d.titre||"Photo")+'" loading="lazy">':'<div class="photo-thumb-missing">Photo</div>')+'</div>'
        +'<div class="photo-meta"><strong>'+esc(d.titre||"Titre à définir")+'</strong><span>'+dateFr(d.date)+'</span></div>'
        +'</button>';
    });
    html+='</div>';
    return html;
  }
  if(state.tab==="devis"){
    var dv=((state.data.DEVIS)||[]).filter(function(d){return String(d["ID chantier"]||"")===String(cid);});
    return rowsTable(["N°","Date","Fichier","Lien"],dv.map(function(d){return["<td>"+esc(d["N° devis"]||"—")+"</td>","<td>"+dateFr(d.Date)+"</td>","<td class=\"strong\">"+esc(d["Nom fichier"]||"Devis")+"</td>","<td>"+(d["Lien Drive"]?'<button class="doc-link y2-open-doc" type="button" data-doc-url="'+esc(d["Lien Drive"])+'" data-doc-title="'+esc(d["Nom fichier"]||"Devis")+'">Ouvrir</button>':"—")+"</td>"];}));
  }
  if(state.tab==="heures"){
    var hs=((state.data.heures)||[]).filter(function(h){return String(h.type)==="chantier"&&String(h.ref)===String(cid);});
    return rowsTable(["Semaine","Jour","Salarié","Heures","Valorisation"],hs.map(function(h){var sal=((state.data.salaries)||[]).find(function(s){return String(s.id)===String(h.salarieId);});return["<td>"+dateFr(h[""]||h.semaine)+"</td>","<td>"+esc(h.jour)+"</td>","<td class=\"strong\">"+esc(sal?sal.nom:h.salarieId)+"</td>","<td>"+esc(h.heures)+" h</td>","<td class=\"money\">"+eur(n(h.heures)*50)+"</td>"];}));
  }
  return "";
}
function chantierPage(){
  var base=chantierById(state.selected);if(!base){state.page="chantiers";return chantierList();}
  var c=chantierView(base),f=finances(base.id);
  var html='<div class="chantier-head"><div class="chantier-top"><div><div class="chantier-name">'+esc(c.nom)+'</div><div class="chantier-id">'+(c.numero?esc(c.numero):"")+'</div></div></div><div class="chantier-dates"><div><div class="meta-label">Démarrage</div><div class="meta-value">'+dateFr(c.dateDemarrage)+'</div></div><div><div class="meta-label">Signé le</div><div class="meta-value">'+dateFr(c.dateSignature)+'</div></div></div></div>';
  html+='<div class="grid-kpi">'+kpi("CA HT",eur(f.ca),"Valeur maître Extranet")+kpi("Achats",eur(f.purchases),"Dépenses réelles")+kpi("Sous-traitance",eur(f.charges),"Factures sous-traitants")+kpi("Main-d’œuvre",eur(f.labor),String(f.hours).replace(".",",")+" h × 50 €")+kpi("Marge",eur(f.margin),"Après coûts",f.margin>=0?"margin-good":"margin-bad")+kpi("Marge %",pct(f.marginPct),"Sur CA HT",f.marginPct>=0?"margin-good":"margin-bad")+"</div>";
  html+='<div class="two-col"><section class="panel"><div class="tabs">'+tabButton("documents","Documents & mails")+tabButton("achats","Achats")+tabButton("charges","Charges")+tabButton("commandes","Commandes")+tabButton("photos","Photos")+tabButton("devis","Devis")+tabButton("heures","Heures")+'</div><div class="tab-body">'+chantierTab(c.id)+'</div></section>';
  html+='<aside class="panel side-panel"><div class="side-info"><h3>Lecture du chantier</h3><div class="side-row"><span class="muted">Documents & mails</span><strong>'+docsFor(c.id).length+'</strong></div><div class="side-row"><span class="muted">Commandes</span><strong>'+rowsFor("commandes",c.id).length+'</strong></div><div class="side-row"><span class="muted">Photos</span><strong>'+rowsFor("documents",c.id).filter(function(d){return typeNorm(d.type)==="photo";}).length+'</strong></div><div class="side-row"><span class="muted">Heures</span><strong>'+String(f.hours).replace(".",",")+' h</strong></div><div class="side-row"><span class="muted">Taux Yaya 2</span><strong>50 €/h</strong></div></div></aside></div>';
  return shell(html,c.nom);
}
function genericDocuments(){
  var rows=[];
  (state.data.MAILS||[]).forEach(function(m){rows.push({date:m.date,chantier:m.chantierId,type:"MAIL",title:m.objet||"Mail",link:m.lienGmail||""});});
  (state.data.documents||[]).filter(function(d){return typeNorm(d.type)!=="photo";}).forEach(function(d){rows.push({date:d.date,chantier:d.chantierId,type:d.type||"Document",title:d.objetMail||d.titre||"Document",link:d.lien||""});});
  rows.sort(function(a,b){return String(b.date||"").localeCompare(String(a.date||""));});rows=rows.slice(0,100);
  var html=pageHead("Documents & mails","Une seule page à l’écran ; stockage MAILS et DOCUMENTS séparé dans Yaya 2.");
  html+='<div class="panel"><div class="table-wrap"><table><thead><tr><th>Date</th><th>Chantier</th><th>Type</th><th>Objet / document</th><th></th></tr></thead><tbody>';
  rows.forEach(function(r){var c=chantierById(r.chantier);html+='<tr><td>'+dateFr(r.date)+'</td><td class="strong">'+esc(c?c.nom:r.chantier)+'</td><td><span class="badge">'+esc(r.type)+'</span></td><td>'+esc(r.title)+'</td><td>'+(r.link?'<button class="doc-link y2-open-doc" type="button" data-doc-url="'+esc(r.link)+'" data-doc-title="'+esc(r.title||"Document")+'">Ouvrir</button>':"—")+'</td></tr>';});
  html+="</tbody></table></div></div>";return shell(html,"Documents & mails");
}
function manualCa2026(){
  var doc=(state.data.documents||[]).find(function(d){return String(d.id||"")==="__CA_SIGNE_2026__";});
  if(!doc)return Array(12).fill(null);
  try{
    var v=JSON.parse(String(doc.sujet||"[]"));
    if(!Array.isArray(v))v=[];
    while(v.length<12)v.push(null);
    return v.slice(0,12).map(function(x){return x===null||x===""||x===undefined?null:n(x);});
  }catch(e){return Array(12).fill(null);}
}
function statsValues(year){
  var amounts=Array(12).fill(0),counts=Array(12).fill(0);
  (state.data.chantiers||[]).forEach(function(ch){
    var sig=String(ch.dateSignatureFixe||"").trim();
    var m=sig.match(/^(\d{4})-(\d{2})/);
    if(!m||Number(m[1])!==Number(year))return;
    var month=Number(m[2])-1;
    if(month<0||month>11)return;
    amounts[month]+=n(ch.montantMarcheHT);
    counts[month]++;
  });
  var manual=Array(12).fill(null);
  if(Number(year)===2026){
    manual=manualCa2026();
    for(var i=0;i<8;i++){
      if(manual[i]!==null)amounts[i]=n(manual[i]);
    }
  }
  return {amounts:amounts,counts:counts,manual:manual};
}
function statsAvailableYears(){
  var years=[2026,new Date().getFullYear()];
  (state.data.chantiers||[]).forEach(function(ch){
    var m=String(ch.dateSignatureFixe||"").match(/^(\d{4})-/);
    if(m)years.push(Number(m[1]));
  });
  return Array.from(new Set(years.filter(function(y){return y>=2026&&y<=2100;}))).sort(function(a,b){return a-b;});
}
function statsPage(){
  var months=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  var short=["Janv.","Févr.","Mars","Avr.","Mai","Juin","Juil.","Août","Sept.","Oct.","Nov.","Déc."];
  var years=statsAvailableYears();
  if(years.indexOf(Number(state.statsYear))<0)state.statsYear=years[years.length-1]||2026;
  var year=Number(state.statsYear)||2026;
  var cur=statsValues(year),prev=statsValues(year-1);
  var total=cur.amounts.reduce(function(a,b){return a+n(b);},0);
  var totalPrev=prev.amounts.reduce(function(a,b){return a+n(b);},0);
  var cum=0,cumPrev=0,max=Math.max.apply(null,cur.amounts.concat(year>2026?prev.amounts:[],[1]));
  var axis=Math.max(50000,Math.ceil(max/50000)*50000);
  var options=years.map(function(y){return '<option value="'+y+'" '+(y===year?"selected":"")+'>'+y+'</option>';}).join("");
  var html=pageHead("CA signé","Évolution mensuelle du chiffre d’affaires signé HT.",'<select class="sim-select" id="statsYear">'+options+'</select>');
  html+='<div class="stats-summary"><strong>'+eur(total)+'</strong><span>CA signé HT '+year+'</span>';
  if(year>2026&&totalPrev)html+='<span>Année précédente : '+eur(totalPrev)+'</span>';
  html+='</div>';
  html+='<div class="panel stats-chart-panel"><div class="panel-head"><h2>CA signé par mois — '+year+'</h2><span>Montant marché HT</span></div><div class="stats-chart">';
  cur.amounts.forEach(function(v,i){
    var h=Math.max(2,Math.round((n(v)/axis)*100));
    html+='<div class="stats-col"><div class="stats-bar-area"><div class="stats-value">'+(v?eur(v):"")+'</div><div class="stats-bar" style="height:'+h+'%"></div></div><div class="stats-month">'+short[i]+'</div></div>';
  });
  html+='</div></div>';
  html+='<div class="panel"><div class="panel-head"><h2>Détail mensuel</h2><span>'+(year===2026?"Janvier à août : historique Yaya":"Comparaison annuelle")+'</span></div><div class="table-wrap"><table><thead><tr><th>Mois</th><th class="money">CA HT mois</th><th class="money">Cumul '+year+'</th>'+(year>2026?'<th class="money">Cumul '+(year-1)+'</th><th class="money">Évolution</th>':'')+'</tr></thead><tbody>';
  months.forEach(function(m,i){
    cum+=n(cur.amounts[i]);cumPrev+=n(prev.amounts[i]);
    var evo=cumPrev?((cum-cumPrev)/cumPrev*100):null;
    html+='<tr><td class="strong">'+m+(year===2026&&i<8&&cur.manual[i]!==null?' <span class="badge">historique</span>':'')+'</td><td class="money">'+eur(cur.amounts[i])+'</td><td class="money strong">'+eur(cum)+'</td>';
    if(year>2026)html+='<td class="money">'+eur(cumPrev)+'</td><td class="money">'+(evo===null?"—":pct(evo))+'</td>';
    html+='</tr>';
  });
  html+='</tbody></table></div></div>';
  return shell(html,"CA signé");
}
function genericTablePage(kind){
  var title=kind.charAt(0).toUpperCase()+kind.slice(1),html=pageHead(title,"Vue globale de contrôle — lecture PROD.");
  var rows=[];
  if(kind==="achats")rows=activeRows(state.data.achats||[]).filter(function(r){return purchaseImpact(r)!==0;});
  if(kind==="charges")rows=activeRows(state.data.achats||[]).filter(isSub);
  if(kind==="commandes"){
    rows=state.data.commandes||[];
    html='<div class="page-head"><div><h1>Commandes</h1><p>Suivi des commandes — modifications de statut simulées en TEST.</p></div></div>';
    html+='<div class="panel"><div class="table-wrap"><table><thead><tr><th>Date</th><th>Chantier</th><th>Fournisseur</th><th>Désignation</th><th>Statut</th><th class="money">Montant</th></tr></thead><tbody>';
    rows.forEach(function(r){
      var ch=chantierById(r.chantierId);
      html+='<tr><td>'+dateFr(r.date)+'</td><td class="strong">'+esc(ch?ch.nom:r.chantierId||"—")+'</td><td>'+esc(r.fournisseur||"—")+'</td><td>'+esc(r.designation||"")+'</td><td>'+commandeStatusSelect(r)+'</td><td class="money">'+eur(r.montantHT)+'</td></tr>';
    });
    html+='</tbody></table></div></div>';
    return shell(html,"Commandes");
  }
  if(kind==="devis")rows=state.data.DEVIS||[];
  if(kind==="heures")rows=(state.data.heures||[]).filter(function(h){return String(h.type)==="chantier";});
  html+='<div class="panel"><div class="panel-head"><h2>'+esc(title)+'</h2><span>'+rows.length+' ligne(s)</span></div><div class="empty">La vue globale est branchée. Le détail métier sera affiné après validation de la fiche chantier.</div></div>';
  return shell(html,title);
}
function render(){
  var el=document.getElementById("app");if(!state.data)return;
  if(state.page==="dashboard"||state.page==="chantiers")el.innerHTML=chantierList();
  else if(state.page==="chantier")el.innerHTML=chantierPage();
  else if(state.page==="documents")el.innerHTML=genericDocuments();
  else if(state.page==="stats")el.innerHTML=statsPage();
  else el.innerHTML=genericTablePage(state.page);
  bind();
}
function bind(){
  document.querySelectorAll("[data-page]").forEach(function(b){b.onclick=function(){state.page=b.getAttribute("data-page");state.selected=null;render();};});
  document.querySelectorAll("[data-chantier]").forEach(function(r){r.onclick=function(){state.selected=r.getAttribute("data-chantier");state.page="chantier";state.tab="documents";render();};});
  document.querySelectorAll("[data-tab]").forEach(function(b){b.onclick=function(){state.tab=b.getAttribute("data-tab");render();};});
  document.querySelectorAll("[data-action=reload]").forEach(function(b){b.onclick=function(){load(true);};});
  var search=document.getElementById("searchChantiers");if(search){search.oninput=function(){state.query=search.value;var pos=search.selectionStart;render();var s=document.getElementById("searchChantiers");if(s){s.focus();try{s.setSelectionRange(pos,pos);}catch(e){}}};}
  document.querySelectorAll(".y2-open-doc").forEach(function(b){b.onclick=function(e){e.preventDefault();e.stopPropagation();openInternalDocument(b.getAttribute("data-doc-url"),b.getAttribute("data-doc-title"));};});
  document.querySelectorAll(".y2-open-mail").forEach(function(b){b.onclick=function(e){e.preventDefault();e.stopPropagation();var m=mailById(b.getAttribute("data-mail-id"));if(m)openMailViewer(m);};});
  var sy=document.getElementById("statsYear");if(sy){sy.onchange=function(){state.statsYear=Number(sy.value)||2026;render();};}
  document.querySelectorAll("[data-command-status]").forEach(function(sel){
    sel.onchange=function(e){
      e.stopPropagation();
      state.commandOverrides[sel.getAttribute("data-command-status")]=sel.value;
    };
  });
}
function normalizeData(data){
  data=data&&typeof data==="object"?data:{};
  ["chantiers","achats","commandes","documents","MAILS","DEVIS","heures","salaries"].forEach(function(k){
    if(!Array.isArray(data[k]))data[k]=[];
  });
  return data;
}
function readProdCache(){
  var keys=["YAYA2_PROD_CACHE_V1","YAYA_CACHE_DATA_V2"];
  for(var i=0;i<keys.length;i++){
    try{
      var raw=localStorage.getItem(keys[i]);
      if(!raw)continue;
      var parsed=JSON.parse(raw);
      var data=parsed&&parsed.data?parsed.data:parsed;
      if(data&&Array.isArray(data.chantiers)&&data.chantiers.length){
        return {data:normalizeData(data),savedAt:Number(parsed.savedAt)||Date.now()};
      }
    }catch(e){}
  }
  return null;
}
function saveProdCache(data){
  try{
    localStorage.setItem("YAYA2_PROD_CACHE_V1",JSON.stringify({savedAt:Date.now(),data:data}));
  }catch(e){}
}
async function fetchJsonWithTimeout(url,timeout){
  var ctrl=new AbortController();
  var timer=setTimeout(function(){try{ctrl.abort();}catch(e){}},timeout);
  try{
    var r=await fetch(url,{cache:"no-store",credentials:"omit",signal:ctrl.signal});
    if(!r.ok)throw new Error("HTTP "+r.status);
    var j=await r.json();
    if(!j||j.ok===false)throw new Error(j&&j.error?j.error:"Réponse API invalide");
    return normalizeData(j.data||j);
  }finally{
    clearTimeout(timer);
  }
}
async function fetchProdData(){
  var tabs="chantiers,achats,commandes,documents,MAILS,DEVIS,heures,salaries";
  var attempts=[
    API+"?tabs="+encodeURIComponent(tabs)+"&_yaya2="+Date.now(),
    API+"?_yaya2="+Date.now()+"_full"
  ];
  var lastErr=null;
  for(var i=0;i<attempts.length;i++){
    try{return await fetchJsonWithTimeout(attempts[i],i===0?9000:14000);}
    catch(e){lastErr=e;}
  }
  throw lastErr||new Error("API Yaya indisponible");
}
async function load(force){
  var el=document.getElementById("app");
  var cached=!force?readProdCache():null;

  if(cached){
    state.data=cached.data;
    state.loadedAt=new Date(cached.savedAt);
    state.source="cache";
    render();
  }else{
    el.innerHTML='<div class="boot"><div class="boot-mark">AB</div><div><strong>Yaya 2 TEST</strong><span>Lecture des données Yaya en cours…</span></div></div>';
  }

  try{
    var fresh=await fetchProdData();
    state.data=fresh;
    state.loadedAt=new Date();
    state.source="prod";
    saveProdCache(fresh);
    render();
  }catch(err){
    if(state.data){
      state.source="cache";
      render();
      return;
    }
    el.innerHTML='<div class="error"><h1>Connexion aux données Yaya impossible</h1><p>'+esc(err.name==="AbortError"?"La connexion à Yaya a expiré.":(err.message||err))+'</p><p>Le site TEST n\'écrit rien dans Yaya PROD.</p><button class="btn primary" onclick="location.reload()">Réessayer</button></div>';
  }
}
load(false);
})();