(function(){
"use strict";

var API="https://script.google.com/macros/s/AKfycbxXBpXjWXEF-7p6vvOE3blSBc8_5e62AtQb2stHjnrGE025cOxQGy-zAguYmN2u9O4K/exec";
var state={data:null,page:"chantiers",selected:null,tab:"documents",query:"",loadedAt:null,source:"prod",overrides:{}};
var STATUTS=["Signé","À programmer","En cours","SAV","Attente PV","Facturé","Clos facturé","Archivé"];

function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]);});}
function n(v){if(typeof v==="number")return isFinite(v)?v:0;var s=String(v==null?"":v).trim().replace(/\s/g,"").replace(",",".");var x=Number(s);return isFinite(x)?x:0;}
function eur(v){return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n(v));}
function pct(v){return new Intl.NumberFormat("fr-FR",{maximumFractionDigits:1}).format(n(v))+" %";}
function dateFr(v){
  if(v==null||v==="")return "—";
  if(typeof v==="number"){
    var d=new Date(Math.round((v-25569)*86400*1000));
    return isNaN(d)?String(v):d.toLocaleDateString("fr-FR");
  }
  var s=String(v);
  if(/^\d{4}-\d{2}-\d{2}/.test(s)){var d2=new Date(s.slice(0,10)+"T12:00:00");return isNaN(d2)?s:d2.toLocaleDateString("fr-FR");}
  if(/^\d{4}$/.test(s))return s;
  var d3=new Date(s);return isNaN(d3)?s:d3.toLocaleDateString("fr-FR");
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
      navBtn("chantiers","Chantiers")+navBtn("documents","Documents & mails")+navBtn("achats","Achats")+navBtn("charges","Charges")+navBtn("commandes","Commandes")+navBtn("devis","Devis")+navBtn("heures","Heures")+
    '</nav><div class="sidebar-foot"><span class="test-pill">MODE TEST</span><br>Lecture PROD uniquement.<br>Les modifications de cette session ne sont jamais envoyées à Yaya.</div></aside>'+
    '<main class="main"><header class="topbar"><div class="top-title">'+esc(title||"Yaya 2")+'</div><div class="top-meta"><span class="read-label"><span class="status-dot"></span>'+sourceLabel+'</span><button class="btn" data-action="reload">Actualiser</button></div></header><div class="content">'+content+'</div></main>'+
    '<nav class="mobile-nav">'+navBtn("chantiers","Chantiers")+navBtn("documents","Docs & mails")+navBtn("achats","Achats")+navBtn("commandes","Commandes")+navBtn("heures","Heures")+'</nav>'+
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
  html+='<div class="panel"><div class="panel-head"><h2>Dernières activités</h2><span>'+recent.length+' chantier(s)</span></div><div class="table-wrap"><table><thead><tr><th>Chantier</th><th>Dernière activité</th><th>Date</th><th>Statut</th><th class="money">CA HT</th><th class="money">Marge</th></tr></thead><tbody>';
  recent.forEach(function(x){
    var c=x.chantier,v=chantierView(c),f=finances(c.id);
    html+='<tr class="clickable" data-chantier="'+esc(c.id)+'"><td class="strong">'+esc(c.nom)+'</td><td><span class="badge">'+esc(x.activity.label)+'</span></td><td>'+dateFr(new Date(x.activity.ts).toISOString())+'</td><td>'+badgeStatus(v.statut)+'</td><td class="money">'+eur(f.ca)+'</td><td class="money '+(f.margin>=0?"margin-good":"margin-bad")+'">'+eur(f.margin)+'</td></tr>';
  });
  html+="</tbody></table></div></div>";
  return shell(html,"Activité récente");
}
function chantierList(){
  var q=typeNorm(state.query);
  var all=(state.data.chantiers||[]).slice();

  var recent=all.filter(function(c){return /^C\d+$/.test(String(c.id||""));})
    .map(function(c){return {chantier:c,activity:recentActivityFor(c.id)};})
    .filter(function(x){return !!x.activity;})
    .sort(function(a,b){return b.activity.ts-a.activity.ts;})
    .slice(0,8);

  var cs=all.filter(function(c){
    return !q||typeNorm((c.nom||"")+" "+(c.id||"")+" "+(c.numero||"")).indexOf(q)>=0;
  });
  cs.sort(function(a,b){return String(a.nom||"").localeCompare(String(b.nom||""),"fr");});

  var html=pageHead("Chantiers","Accès direct aux dossiers Yaya.",'<input class="search" id="searchChantiers" placeholder="Rechercher un chantier…" value="'+esc(state.query)+'">');

  html+='<div class="panel" style="margin-bottom:16px"><div class="panel-head"><h2>Activité récente</h2><span>Derniers chantiers modifiés</span></div><div class="table-wrap"><table><thead><tr><th>Chantier</th><th>Dernière activité</th><th>Date</th><th class="money">CA HT</th><th class="money">Marge</th></tr></thead><tbody>';
  recent.forEach(function(x){
    var c=x.chantier,f=finances(c.id);
    html+='<tr class="clickable" data-chantier="'+esc(c.id)+'"><td class="strong">'+esc(c.nom)+'</td><td><span class="badge">'+esc(x.activity.label)+'</span></td><td>'+dateFr(new Date(x.activity.ts).toISOString())+'</td><td class="money">'+eur(f.ca)+'</td><td class="money '+(f.margin>=0?"margin-good":"margin-bad")+'">'+eur(f.margin)+'</td></tr>';
  });
  html+='</tbody></table></div></div>';

  html+='<div class="panel"><div class="panel-head"><h2>Tous les chantiers</h2><span>'+cs.length+' chantier(s)</span></div><div class="table-wrap"><table><thead><tr><th>Chantier</th><th>N°</th><th>Démarrage</th><th>Signé le</th><th class="money">CA HT</th><th class="money">Marge</th></tr></thead><tbody>';
  cs.forEach(function(c){
    var f=finances(c.id);
    html+='<tr class="clickable" data-chantier="'+esc(c.id)+'"><td class="strong">'+esc(c.nom)+'</td><td>'+esc(c.numero||"—")+'</td><td>'+dateFr(c.dateDemarrage)+'</td><td>'+dateFr(c.dateSignature)+'</td><td class="money">'+eur(f.ca)+'</td><td class="money '+(f.margin>=0?"margin-good":"margin-bad")+'">'+eur(f.margin)+'</td></tr>';
  });
  html+="</tbody></table></div></div>";
  return shell(html,"Chantiers");
}
function tabButton(key,label){return '<button data-tab="'+key+'" class="'+(state.tab===key?"active":"")+'">'+label+"</button>";}
function docsFor(cid){
  var docs=rowsFor("documents",cid).filter(function(d){return typeNorm(d.type)!=="photo";});
  var mails=rowsFor("MAILS",cid);
  var combined=[];
  mails.forEach(function(m){combined.push({kind:"MAIL",title:m.objet||"Mail",sub:m.expediteur||"",date:m.date,link:m.lienGmail||"",body:m.corps||""});});
  docs.forEach(function(d){combined.push({kind:d.type||"Document",title:d.objetMail||d.titre||"Document",sub:d.sujet||"",date:d.date,link:d.lien||"",body:d.contenuMail||""});});
  combined.sort(function(a,b){return String(b.date||"").localeCompare(String(a.date||""));});
  return combined;
}
function rowsTable(headers,rows){
  if(!rows.length)return '<div class="empty">Aucun élément pour ce chantier.</div>';
  var h="<div class=\"table-wrap\"><table><thead><tr>"+headers.map(function(x){return "<th>"+x+"</th>";}).join("")+"</tr></thead><tbody>";
  rows.forEach(function(r){h+="<tr>"+r.join("")+"</tr>";});
  return h+"</tbody></table></div>";
}
function chantierTab(cid){
  if(state.tab==="documents"){
    var docs=docsFor(cid);if(!docs.length)return '<div class="empty">Aucun document ou mail pour ce chantier.</div>';
    return docs.map(function(d){return '<div class="doc-row"><div class="doc-type">'+esc(d.kind)+'</div><div class="doc-title">'+esc(d.title)+'</div><div class="muted">'+esc(d.sub)+'</div><div class="muted">'+dateFr(d.date)+'</div><div>'+(d.link?'<a class="doc-link" href="'+esc(d.link)+'" target="_blank" rel="noopener">Ouvrir</a>':"—")+'</div></div>';}).join("");
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
    return rowsTable(["Date","Fournisseur","Désignation","Statut","Montant"],co.map(function(r){return["<td>"+dateFr(r.date)+"</td>","<td class=\"strong\">"+esc(r.fournisseur)+"</td>","<td>"+esc(r.designation)+"</td>","<td>"+badgeStatus(r.statut||r.statutValidation)+"</td>","<td class=\"money\">"+eur(r.montantHT)+"</td>"];}));
  }
  if(state.tab==="photos"){
    var ph=rowsFor("documents",cid).filter(function(d){return typeNorm(d.type)==="photo";});
    if(!ph.length)return '<div class="empty">Aucune photo pour ce chantier.</div>';
    return ph.map(function(d){return '<div class="doc-row"><div class="doc-type">PHOTO</div><div class="doc-title">'+esc(d.titre||d.sujet||"Photo")+'</div><div class="muted">'+esc(d.sujet||"")+'</div><div class="muted">'+dateFr(d.date)+'</div><div>'+(d.lien?'<a class="doc-link" href="'+esc(d.lien)+'" target="_blank" rel="noopener">Ouvrir</a>':"—")+'</div></div>';}).join("");
  }
  if(state.tab==="devis"){
    var dv=((state.data.DEVIS)||[]).filter(function(d){return String(d["ID chantier"]||"")===String(cid);});
    return rowsTable(["N°","Date","Fichier","Lien"],dv.map(function(d){return["<td>"+esc(d["N° devis"]||"—")+"</td>","<td>"+dateFr(d.Date)+"</td>","<td class=\"strong\">"+esc(d["Nom fichier"]||"Devis")+"</td>","<td>"+(d["Lien Drive"]?'<a class="doc-link" target="_blank" rel="noopener" href="'+esc(d["Lien Drive"])+'">Ouvrir</a>':"—")+"</td>"];}));
  }
  if(state.tab==="heures"){
    var hs=((state.data.heures)||[]).filter(function(h){return String(h.type)==="chantier"&&String(h.ref)===String(cid);});
    return rowsTable(["Semaine","Jour","Salarié","Heures","Valorisation"],hs.map(function(h){var sal=((state.data.salaries)||[]).find(function(s){return String(s.id)===String(h.salarieId);});return["<td>"+dateFr(h[""]||h.semaine)+"</td>","<td>"+esc(h.jour)+"</td>","<td class=\"strong\">"+esc(sal?sal.nom:h.salarieId)+"</td>","<td>"+esc(h.heures)+" h</td>","<td class=\"money\">"+eur(n(h.heures)*50)+"</td>"];}));
  }
  return "";
}
function chantierPage(){
  var base=chantierById(state.selected);if(!base){state.page="chantiers";return chantierList();}
  var c=chantierView(base),f=finances(base.id),options=STATUTS.slice();
  if(c.statut&&options.indexOf(c.statut)<0)options.unshift(c.statut);
  var select='<select class="sim-select" data-action="status" data-id="'+esc(c.id)+'">'+options.map(function(s){return '<option '+(s===c.statut?"selected":"")+'>'+esc(s)+'</option>';}).join("")+'</select>';
  var html='<div class="chantier-head"><div class="chantier-top"><div><div class="chantier-name">'+esc(c.nom)+'</div><div class="chantier-id">'+esc(c.id)+(c.numero?" · "+esc(c.numero):"")+'</div></div><div class="sim-box">'+select+'<div class="sim-note">Simulation locale uniquement</div></div></div><div class="chantier-dates"><div><div class="meta-label">Démarrage</div><div class="meta-value">'+dateFr(c.dateDemarrage)+'</div></div><div><div class="meta-label">Signé le</div><div class="meta-value">'+dateFr(c.dateSignature)+'</div></div><div><div class="meta-label">Date statistique fixe</div><div class="meta-value">'+dateFr(c.dateSignatureFixe)+'</div></div><div><div class="meta-label">Source CA</div><div class="meta-value">Extranet</div></div></div></div>';
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
  rows.forEach(function(r){var c=chantierById(r.chantier);html+='<tr><td>'+dateFr(r.date)+'</td><td class="strong">'+esc(c?c.nom:r.chantier)+'</td><td><span class="badge">'+esc(r.type)+'</span></td><td>'+esc(r.title)+'</td><td>'+(r.link?'<a class="doc-link" href="'+esc(r.link)+'" target="_blank" rel="noopener">Ouvrir</a>':"—")+'</td></tr>';});
  html+="</tbody></table></div></div>";return shell(html,"Documents & mails");
}
function genericTablePage(kind){
  var title=kind.charAt(0).toUpperCase()+kind.slice(1),html=pageHead(title,"Vue globale de contrôle — lecture PROD.");
  var rows=[];
  if(kind==="achats")rows=activeRows(state.data.achats||[]).filter(function(r){return purchaseImpact(r)!==0;});
  if(kind==="charges")rows=activeRows(state.data.achats||[]).filter(isSub);
  if(kind==="commandes")rows=state.data.commandes||[];
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
  else el.innerHTML=genericTablePage(state.page);
  bind();
}
function bind(){
  document.querySelectorAll("[data-page]").forEach(function(b){b.onclick=function(){state.page=b.getAttribute("data-page");state.selected=null;render();};});
  document.querySelectorAll("[data-chantier]").forEach(function(r){r.onclick=function(){state.selected=r.getAttribute("data-chantier");state.page="chantier";state.tab="documents";render();};});
  document.querySelectorAll("[data-tab]").forEach(function(b){b.onclick=function(){state.tab=b.getAttribute("data-tab");render();};});
  document.querySelectorAll("[data-action=reload]").forEach(function(b){b.onclick=function(){load(true);};});
  var search=document.getElementById("searchChantiers");if(search){search.oninput=function(){state.query=search.value;var pos=search.selectionStart;render();var s=document.getElementById("searchChantiers");if(s){s.focus();try{s.setSelectionRange(pos,pos);}catch(e){}}};}
  document.querySelectorAll("[data-action=status]").forEach(function(s){s.onchange=function(){var id=s.getAttribute("data-id");state.overrides[id]=Object.assign({},state.overrides[id]||{},{statut:s.value});render();};});
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