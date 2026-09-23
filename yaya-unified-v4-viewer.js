(function(){
'use strict';
if(window.__YAYA_UNIFIED_V4_VIEWER__)return;
window.__YAYA_UNIFIED_V4_VIEWER__=true;

const MODAL_ID='yayaUnifiedV4Viewer';
const STYLE_ID='yaya-unified-v4-viewer-style';
let currentItems=[],currentIndex=0;

function text(v){return String(v==null?'':v).trim();}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function docs(){try{return typeof S!=='undefined'&&S&&Array.isArray(S.documents)?S.documents:[];}catch(e){return[];}}
function docById(id){id=text(id);return docs().find(d=>text(d&&d.id)===id)||null;}
function driveId(url){
  const s=text(url);let m=s.match(/drive\.google\.com\/file\/d\/([^/?#]+)/i);
  if(m&&m[1])return m[1];
  m=s.match(/[?&]id=([^&#]+)/i);return m&&m[1]?decodeURIComponent(m[1]):'';
}
function directDownloadUrl(url){
  url=text(url);if(!url)return '';
  const id=driveId(url);
  if(id)return 'https://drive.usercontent.google.com/download?id='+encodeURIComponent(id)+'&export=download&confirm=t';
  try{
    const u=new URL(url,location.href);
    if(/(?:^|\.)dropbox\.com$/i.test(u.hostname)){u.searchParams.delete('raw');u.searchParams.set('dl','1');}
    return u.toString();
  }catch(e){return url;}
}
function mailBody(d){
  const explicit=text(d&&(d.contenuMail||d.corpsMail||d.bodyMail||d.mailBody||d.body||d.contenu||d.message));
  let raw='';
  try{if(typeof window.contenuMailYaya==='function')raw=window.contenuMailYaya(d)||'';}catch(e){}
  raw=raw||explicit||(d&&d.titre)||'';
  if(!raw)return '';
  const holder=document.createElement('div');holder.innerHTML=String(raw);
  const body=text(holder.textContent||holder.innerText||raw);
  return !explicit&&body===mailSubject(d)?'':body;
}
function gmailUrl(d){
  const url=text(d&&(d.lienGmail||d.gmailUrl||d.lien));
  try{return new URL(url).hostname==='mail.google.com'?url:'';}catch(e){return '';}
}
function mailSubject(d){return text(d&&(d.objetMail||d.mailSubject||d.emailSubject||d.subject||d.objet||d.sujet))||'Mail';}
function mailSender(d){return text(d&&(d.nomMail||d.expediteur||d.from||d.sender||d.sujet))||'Expéditeur non renseigné';}
function fileName(d,index){return text(d&&(d.pieceNom||d.nomFichier||d.filename||d.fileName||d.sujet||d.titre))||('Pièce '+(index+1));}
function fileUrl(d){return text(d&&(d.lienPieceJointe||d.pieceJointeUrl||d.attachmentUrl||d.fichierUrl||d.fileUrl||d.oneDriveWebUrl||d.dropboxUrl||d.lien));}

function installStyle(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement('style');s.id=STYLE_ID;
  s.textContent=`
    #${MODAL_ID}{
      position:fixed;inset:0;z-index:60000;display:none;align-items:center;justify-content:center;
      padding:12px;background:rgba(12,27,47,.58);box-sizing:border-box;
    }
    #${MODAL_ID}.show{display:flex}
    #${MODAL_ID} .v4-card{
      width:min(1120px,calc(100vw - 24px));height:min(88dvh,820px);
      display:grid;grid-template-rows:auto minmax(0,1fr);background:#fff;border-radius:14px;
      box-shadow:0 28px 90px rgba(8,25,46,.34);overflow:hidden;
    }
    #${MODAL_ID} .v4-head{
      display:grid;
      grid-template-columns:minmax(0,1fr) auto;
      grid-template-areas:"tabs actions";
      align-items:center;
      gap:10px;
      padding:9px 12px;
      border-bottom:1px solid #dfe6ee;
      color:#162d49;background:#fff;
      min-height:58px;
      box-sizing:border-box;
    }
    #${MODAL_ID} .v4-tabs{
      grid-area:tabs;
      display:flex;gap:6px;align-items:center;min-width:0;
      overflow-x:auto;padding:2px 1px;scrollbar-width:none;
    }
    #${MODAL_ID} .v4-tabs::-webkit-scrollbar{display:none}
    #${MODAL_ID} .v4-tab{
      min-height:32px;border:1px solid #c8d8e8;border-radius:7px;background:#fff;color:#205f9d;
      padding:0 11px;font:inherit;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap;
    }
    #${MODAL_ID} .v4-tab.on{background:#eaf4ff;border-color:#90bce6}
    #${MODAL_ID} .v4-head-actions{
      grid-area:actions;display:flex;align-items:center;justify-content:flex-end;
      gap:7px;min-width:0;white-space:nowrap
    }
    #${MODAL_ID} .v4-download,#${MODAL_ID} .v4-delete,#${MODAL_ID} .v4-close{
      border:1px solid #9fc0df;background:#eef6ff;color:#245d91;border-radius:8px;
      height:36px;min-height:36px;padding:0 14px;font:inherit;font-size:12px;font-weight:850;
      cursor:pointer;white-space:nowrap;
      display:inline-flex;align-items:center;justify-content:center;text-align:center;line-height:1;
      box-sizing:border-box;
    }
    #${MODAL_ID} .v4-download{border-color:#b9dfc5;background:#eef9f1;color:#17653a}
    #${MODAL_ID} .v4-delete{border-color:#efc3c3;background:#fff5f5;color:#b42318}
    #${MODAL_ID} .v4-close{border-color:#cfd9e6;background:#fff;color:#334155}
    #${MODAL_ID} .v4-stage{min-height:0;overflow:hidden;background:#eef2f6}
    #${MODAL_ID} iframe{display:block;width:100%;height:100%;border:0;background:#fff}
    #${MODAL_ID} .v4-image{display:block;width:100%;height:100%;object-fit:contain;background:#fff}
    #${MODAL_ID} .v4-mail{height:100%;overflow:auto;background:#fff;padding:18px 22px;box-sizing:border-box;color:#21364f}
    #${MODAL_ID} .v4-mail-head{position:sticky;top:-18px;z-index:2;margin:-18px -22px 16px;padding:15px 22px 12px;border-bottom:1px solid #e3e9f0;background:#fff}
    #${MODAL_ID} .v4-mail-head strong{display:block;font-size:16px;line-height:1.35;color:#142c48}
    #${MODAL_ID} .v4-mail-meta{display:flex;align-items:center;gap:12px;margin-top:6px;color:#6b7b8d;font-size:11.5px;font-weight:650}
    #${MODAL_ID} .v4-mail-body{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;line-height:1.55;color:#243b55}
    #${MODAL_ID} .v4-empty{height:100%;display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;text-align:center;color:#708095;font-size:13px;font-weight:700}
    .yaya-mail-pj-edit-safe{
      position:fixed;inset:0;z-index:65000;display:flex;align-items:center;justify-content:center;
      padding:16px;background:rgba(15,30,50,.46);box-sizing:border-box
    }
    .yaya-mail-pj-edit-safe-card{
      width:min(440px,100%);background:#fff;border-radius:13px;padding:18px;
      box-shadow:0 18px 55px rgba(15,30,50,.28);box-sizing:border-box
    }
    .yaya-mail-pj-edit-safe-card h3{margin:0 0 14px;color:#162d49;font-size:17px}
    .yaya-mail-pj-edit-safe-card input{
      width:100%;height:42px;border:1px solid #c9d7e5;border-radius:8px;padding:0 11px;
      box-sizing:border-box;font:inherit;color:#203750
    }
    .yaya-mail-pj-edit-safe-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}
    .yaya-mail-pj-edit-safe-actions button{
      min-height:36px;padding:0 14px;border-radius:8px;border:1px solid #cbd5e1;
      background:#fff;color:#334155;font-weight:800;cursor:pointer
    }
    .yaya-mail-pj-edit-safe-actions .save{background:#14558a;border-color:#14558a;color:#fff}
    @media(max-width:760px){
      #${MODAL_ID}{padding:4px}
      #${MODAL_ID} .v4-card{width:calc(100vw - 8px);height:calc(100dvh - 8px);border-radius:8px}
      #${MODAL_ID} .v4-head{
        grid-template-columns:minmax(0,1fr) auto;
        grid-template-areas:"tabs actions";
        gap:5px;
        padding:6px 7px;
        min-height:48px;
      }
      #${MODAL_ID} .v4-tab{
        min-height:30px!important;
        padding:0 8px!important;
        font-size:10px!important;
      }
      #${MODAL_ID} .v4-head-actions{
        gap:4px!important;
        overflow:visible!important;
        max-width:none!important;
      }
      #${MODAL_ID} .v4-download,
      #${MODAL_ID} .v4-delete,
      #${MODAL_ID} .v4-close{
        min-height:30px!important;
        padding:0 7px!important;
        font-size:9.5px!important;
        border-radius:7px!important;
      }
    }
  `;
  document.head.appendChild(s);
}

function ensureModal(){
  installStyle();
  let m=document.getElementById(MODAL_ID);
  if(m)return m;
  m=document.createElement('div');m.id=MODAL_ID;m.setAttribute('aria-hidden','true');
  m.innerHTML='<div class="v4-card" role="dialog" aria-modal="true"><div class="v4-head"><div class="v4-tabs"></div><div class="v4-head-actions"><button type="button" class="v4-download">Télécharger</button><button type="button" class="v4-delete">Supprimer</button><button type="button" class="v4-close">Fermer</button></div></div><div class="v4-stage"></div></div>';
  document.body.appendChild(m);
  m.querySelector('.v4-close').onclick=close;
  m.onclick=e=>{if(e.target===m)close();};
  return m;
}
function close(){
  const m=document.getElementById(MODAL_ID);
  if(m){
    m.classList.remove('show');m.setAttribute('aria-hidden','true');
    const f=m.querySelector('iframe');if(f)f.src='about:blank';
    const stage=m.querySelector('.v4-stage');if(stage)stage.replaceChildren();
  }
  currentItems=[];currentIndex=0;
}
function showItems(items,index){
  currentItems=Array.isArray(items)?items.filter(Boolean):[];
  currentIndex=Math.max(0,Math.min(Number(index)||0,Math.max(0,currentItems.length-1)));
  const m=ensureModal();render();m.classList.add('show');m.setAttribute('aria-hidden','false');
}
function render(){
  const m=ensureModal(),tabs=m.querySelector('.v4-tabs'),stage=m.querySelector('.v4-stage');
  const dl=m.querySelector('.v4-download'),del=m.querySelector('.v4-delete');
  tabs.replaceChildren();stage.replaceChildren();
  if(!currentItems.length){stage.innerHTML='<div class="v4-empty">Aucun élément à visualiser.</div>';return;}
  currentItems.forEach((item,i)=>{
    const b=document.createElement('button');b.type='button';b.className='v4-tab'+(i===currentIndex?' on':'');
    b.textContent=item.tab||('Pièce '+(i+1));b.title=item.title||b.textContent;b.onclick=()=>{currentIndex=i;render();};tabs.appendChild(b);
  });
  const item=currentItems[currentIndex];
  dl.style.display=item.kind==='mail'?'none':'inline-flex';
  del.style.display=item.canDelete===false?'none':'inline-flex';

  dl.onclick=e=>{e.preventDefault();e.stopPropagation();const url=directDownloadUrl(item.url);if(!url)return;const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.download='';document.body.appendChild(a);a.click();a.remove();};
  del.onclick=e=>{e.preventDefault();e.stopPropagation();close();if(typeof item.onDelete==='function')setTimeout(item.onDelete,0);};

  if(item.kind==='mail'){
    const box=document.createElement('div');box.className='v4-mail';
    const head=document.createElement('div');head.className='v4-mail-head';
    const subj=document.createElement('strong');subj.textContent=item.title||'Mail';
    const meta=document.createElement('div');meta.className='v4-mail-meta';
    const from=document.createElement('span');from.textContent=item.sender||'Expéditeur non renseigné';meta.appendChild(from);
    if(item.date){const dt=document.createElement('span');dt.textContent=item.date;meta.appendChild(dt);}
    if(item.gmailUrl){const link=document.createElement('a');link.href=item.gmailUrl;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Ouvrir dans Gmail';meta.appendChild(link);}
    head.append(subj,meta);
    const body=document.createElement('div');body.className='v4-mail-body';body.textContent=item.body||'Corps du mail absent dans Yaya. Consultez le message original dans Gmail.';
    box.append(head,body);stage.appendChild(box);return;
  }

  if(item.kind==='photo'){
    const img=document.createElement('img');img.className='v4-image';img.alt=item.title||'Photo';
    const id=driveId(item.url);
    img.src=id?'https://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz=w2200':item.url;
    img.onerror=function(){
      if(id){
        const iframe=document.createElement('iframe');iframe.src='https://drive.google.com/file/d/'+encodeURIComponent(id)+'/preview';iframe.title=item.title||'Photo';stage.replaceChildren(iframe);
      }
    };
    stage.appendChild(img);return;
  }

  if(!item.url){stage.innerHTML='<div class="v4-empty">Lien de cette pièce introuvable.</div>';return;}
  const id=driveId(item.url);
  const iframe=document.createElement('iframe');
  iframe.src=id?'https://drive.google.com/file/d/'+encodeURIComponent(id)+'/preview':item.url;
  iframe.title=item.title||'Pièce jointe';iframe.loading='eager';iframe.referrerPolicy='no-referrer-when-downgrade';
  stage.appendChild(iframe);
}

async function saveMailAttachmentSafe(id,newName){
  id=text(id);newName=text(newName);
  const current=docById(id);
  if(!current||String(current.type||'').toUpperCase()!=='MAIL_PJ')return false;
  if(!newName)newName=fileName(current,0);

  const safe=Object.assign({},current,{
    id:current.id,
    type:'MAIL_PJ',
    sujet:current.sujet,
    chantierId:current.chantierId,
    lien:current.lien,
    pieceNom:newName,
    titre:newName,
    origine:'YAYA_WEB_EDIT'
  });

  let ok=false;
  try{
    if(typeof window.apiPost!=='function')throw new Error('API Yaya indisponible');
    ok=await window.apiPost('addDocument',safe);
  }catch(e){ok=false;}
  if(!ok){
    try{if(typeof toast==='function')toast('Modification non enregistrée',true);}catch(e){}
    return false;
  }

  try{
    if(typeof S!=='undefined'&&S&&Array.isArray(S.documents)){
      const i=S.documents.findIndex(d=>text(d&&d.id)===id);
      if(i>=0)S.documents[i]=Object.assign({},safe);
    }
    const raw=localStorage.getItem('YAYA_CACHE_DATA_V2');
    if(raw){
      const cache=JSON.parse(raw);
      if(cache&&Array.isArray(cache.documents)){
        const i=cache.documents.findIndex(d=>text(d&&d.id)===id);
        if(i>=0)cache.documents[i]=Object.assign({},safe);
        localStorage.setItem('YAYA_CACHE_DATA_V2',JSON.stringify(cache));
      }
    }
  }catch(e){}
  try{if(typeof toast==='function')toast('Pièce modifiée ✓');}catch(e){}
  return true;
}

function editMailAttachmentSafe(id){
  id=text(id);
  const d=docById(id);if(!d)return false;
  const old=document.querySelector('.yaya-mail-pj-edit-safe');if(old)old.remove();

  const overlay=document.createElement('div');
  overlay.className='yaya-mail-pj-edit-safe';
  overlay.innerHTML='<div class="yaya-mail-pj-edit-safe-card" role="dialog" aria-modal="true">'
    +'<h3>Modifier la pièce jointe</h3>'
    +'<input type="text" class="name" maxlength="180">'
    +'<div class="yaya-mail-pj-edit-safe-actions"><button type="button" class="cancel">Annuler</button><button type="button" class="save">Enregistrer</button></div>'
    +'</div>';
  document.body.appendChild(overlay);
  const input=overlay.querySelector('.name');
  input.value=fileName(d,0);
  input.focus();input.select();

  const closeEdit=()=>{if(overlay.isConnected)overlay.remove();};
  overlay.querySelector('.cancel').onclick=closeEdit;
  overlay.onclick=e=>{if(e.target===overlay)closeEdit();};
  overlay.querySelector('.save').onclick=async function(){
    const btn=this;btn.disabled=true;btn.textContent='Enregistrement…';
    const ok=await saveMailAttachmentSafe(id,input.value);
    if(ok){closeEdit();openMailAttachment(id);}
    else{btn.disabled=false;btn.textContent='Enregistrer';}
  };
  input.addEventListener('keydown',e=>{
    if(e.key==='Escape')closeEdit();
    if(e.key==='Enter'){e.preventDefault();overlay.querySelector('.save').click();}
  });
  return true;
}

window.__yayaEditMailAttachmentSafe=editMailAttachmentSafe;

function mailItems(id){
  const mail=docById(id);if(!mail)return [];
  const items=[{
    kind:'mail',id:text(mail.id),tab:'📧 Mail',title:mailSubject(mail),sender:mailSender(mail),date:text(mail.date),body:mailBody(mail),gmailUrl:gmailUrl(mail),
    onEdit:()=>{if(typeof window.__yayaEditMailSubject==='function')window.__yayaEditMailSubject(text(mail.id));},
    onDelete:()=>{try{if(typeof window.delDocument==='function')window.delDocument(text(mail.id));else if(typeof delDocument==='function')delDocument(text(mail.id));}catch(e){}}
  }];
  const pjs=docs().filter(d=>String(d&&d.type||'').toUpperCase()==='MAIL_PJ'&&text(d.sujet)===text(mail.id));
  pjs.forEach((d,i)=>items.push({
    kind:'file',id:text(d.id),tab:'📎 Pièce '+(i+1),title:fileName(d,i),url:fileUrl(d),
    onEdit:()=>{try{
      if(typeof window.__yayaEditMailAttachmentSafe==='function')window.__yayaEditMailAttachmentSafe(text(d.id));
      else if(typeof window.editDocument==='function')window.editDocument(text(d.id));
      else if(typeof editDocument==='function')editDocument(text(d.id));
    }catch(e){}},
    onDelete:()=>{try{if(typeof window.delDocument==='function')window.delDocument(text(d.id));else if(typeof delDocument==='function')delDocument(text(d.id));}catch(e){}}
  }));
  return items;
}
function openMail(id){const items=mailItems(id);if(!items.length)return false;showItems(items,0);return true;}
function openMailAttachment(id){
  const d=docById(id);if(!d)return false;
  const parent=text(d.sujet),items=mailItems(parent);
  if(!items.length)return false;
  const index=Math.max(1,items.findIndex(x=>text(x.id)===text(id)));
  showItems(items,index);return true;
}
function openDocument(id,url){
  const d=docById(id),u=text(url)||fileUrl(d);
  const item={kind:'file',id:text(id),tab:'📎 Pièce 1',title:fileName(d,0),url:u,
    onEdit:()=>{try{if(typeof window.editDocument==='function')window.editDocument(text(id));else if(typeof editDocument==='function')editDocument(text(id));}catch(e){}},
    onDelete:()=>{try{if(typeof window.delDocument==='function')window.delDocument(text(id));else if(typeof delDocument==='function')delDocument(text(id));}catch(e){}}
  };
  showItems([item],0);return true;
}
function openPhoto(id){
  const p=docById(id);if(!p)return false;
  const list=docs().filter(d=>String(d&&d.type||'').toUpperCase()==='PHOTO'&&text(d.chantierId)===text(p.chantierId)&&text(d.date)===text(p.date))
    .sort((a,b)=>text(b.id).localeCompare(text(a.id)));
  const items=(list.length?list:[p]).map((d,i)=>({
    kind:'photo',id:text(d.id),tab:'📷 Photo '+(i+1),title:(text(d.date)?text(d.date)+' — ':'')+(text(d.titre)||'Photo'),url:fileUrl(d),
    canEdit:typeof window.__yayaPhotoEditById==='function',
    onEdit:()=>{if(typeof window.__yayaPhotoEditById==='function')window.__yayaPhotoEditById(text(d.id));},
    onDelete:()=>{if(typeof window.__yayaPhotoDeleteById==='function')window.__yayaPhotoDeleteById(text(d.id));}
  }));
  const index=Math.max(0,items.findIndex(x=>text(x.id)===text(id)));
  showItems(items,index);return true;
}

window.yayaUnifiedV4Viewer={openMail,openMailAttachment,openDocument,openPhoto,close};
installStyle();
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById(MODAL_ID)?.classList.contains('show'))close();});
})();
