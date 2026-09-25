(function(){
  'use strict';
  if(window.__yayaFinanceEditActionsV17)return;
  window.__yayaFinanceEditActionsV17=true;
  window.__yayaFinanceEditActionsV15=true;
  const STYLE_ID='yaya-finance-edit-actions-v17';
  function txt(v){return String(v==null?'':v).trim();}
  function ensureStyle(){if(document.getElementById(STYLE_ID))return;const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`#modalRoot .yaya-finance-edit-overlay{display:flex!important;align-items:center!important;justify-content:center!important;padding:12px!important;box-sizing:border-box!important;overflow:auto!important}#modalRoot .achat-edit-modal{width:min(720px,calc(100vw - 24px))!important;max-width:720px!important;height:auto!important;min-height:0!important;max-height:calc(100dvh - 24px)!important;margin:auto!important;padding:14px!important;box-sizing:border-box!important;overflow-y:auto!important;border-radius:14px!important}#modalRoot .achat-edit-modal>h5{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;margin:0 0 9px!important;padding:0 0 7px!important}#modalRoot .achat-edit-modal>h5 button{min-width:auto!important;width:auto!important;height:34px!important;min-height:34px!important;padding:0 12px!important;margin:0!important;border-radius:9px!important}#modalRoot .achat-edit-modal .yaya-finance-edit-actions{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;align-items:stretch!important;margin:10px 0 0!important;padding-top:9px!important;border-top:1px solid #dce4ee!important;width:100%!important}#modalRoot .achat-edit-modal .yaya-finance-edit-actions>button{width:100%!important;min-width:0!important;min-height:40px!important;margin:0!important;padding:0 9px!important;border-radius:9px!important;font-weight:800!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;visibility:visible!important;opacity:1!important;cursor:pointer!important;pointer-events:auto!important}#modalRoot .achat-edit-modal .yaya-achat-single-save{background:#064b8e!important;color:#fff!important;border:1px solid #064b8e!important}#modalRoot .achat-edit-modal .yaya-achat-edit-delete{background:#fff3f3!important;color:#b42318!important;border:1px solid #efb4b4!important}#modalRoot .achat-edit-modal .yaya-achat-edit-close{background:#fff!important;color:#162d49!important;border:1px solid #cbd7e3!important}#modalRoot .achat-edit-modal .mrow{margin-bottom:8px!important}#modalRoot .achat-edit-modal .mrow label{margin-bottom:4px!important}#modalRoot .achat-edit-modal .msel,#modalRoot .achat-edit-modal .mnum,#modalRoot .achat-edit-modal input,#modalRoot .achat-edit-modal select{min-height:38px!important;padding-top:7px!important;padding-bottom:7px!important}@media(max-width:640px){#modalRoot .yaya-finance-edit-overlay{padding:7px!important}#modalRoot .achat-edit-modal{width:calc(100vw - 14px)!important;max-width:none!important;max-height:calc(100dvh - 14px)!important;padding:11px!important;border-radius:12px!important}#modalRoot .achat-edit-modal .yaya-finance-edit-actions{gap:6px!important;margin-top:8px!important;padding-top:8px!important}#modalRoot .achat-edit-modal .yaya-finance-edit-actions>button{min-height:38px!important;font-size:11.5px!important;padding:0 5px!important}}`;document.head.appendChild(style);}
  function isFinanceEdit(modal){if(!modal)return false;if(modal.querySelector('#eaCh,#eavCh'))return true;const title=txt(modal.querySelector('h5,h4,h3')&&modal.querySelector('h5,h4,h3').textContent);return /Modifier (?:l['’]achat|la charge)/i.test(title);}
  function bindAchatSave(modal,save){
    if(!modal.querySelector('#eaCh')||save.__yayaDirectAchatSaveV17)return;
    const raw=String(save.getAttribute('onclick')||'');
    const m=raw.match(/saveAchat\s*\(\s*['\"]([^'\"]+)['\"]/);
    const id=txt(save.dataset.achatId||(m&&m[1])||modal.dataset.yayaAchatId||'');
    if(!id)return;
    save.dataset.achatId=id;
    save.removeAttribute('onclick');
    try{save.onclick=null;}catch(e){}
    save.__yayaDirectAchatSaveV17=true;
    save.addEventListener('click',function(e){
      e.preventDefault();e.stopPropagation();if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();
      const fn=typeof window.__yayaSaveAchatFast==='function'?window.__yayaSaveAchatFast:window.saveAchat;
      if(typeof fn==='function')fn(id);
      else try{if(typeof toast==='function')toast('Enregistrement indisponible',true);}catch(err){}
    },true);
  }
  function ensureModal(modal){if(!isFinanceEdit(modal))return;modal.classList.add('achat-edit-modal','yaya-finance-edit-modal');const overlay=modal.closest('.overlay');if(overlay)overlay.classList.add('yaya-finance-edit-overlay');const buttons=Array.from(modal.querySelectorAll('button'));const save=buttons.find(function(b){return /saveAchat|saveAchat2/.test(String(b.getAttribute('onclick')||''))||/^Enregistrer(?:✓)?$/i.test(txt(b.textContent))||b.classList.contains('yaya-achat-single-save');});if(!save)return;save.classList.add('yaya-achat-single-save');bindAchatSave(modal,save);const foot=save.closest('.mfoot,.yaya-finance-edit-actions')||save.parentElement;if(!foot)return;foot.classList.add('yaya-finance-edit-actions');Array.from(foot.querySelectorAll('button')).forEach(function(b){if(b!==save&&/^[×x✕]$/i.test(txt(b.textContent)))b.remove();});let del=Array.from(foot.querySelectorAll('button')).find(function(b){return /^Supprimer(?: l['’]achat)?$/i.test(txt(b.textContent))||b.classList.contains('yaya-achat-edit-delete');});
    if(!del&&modal.querySelector('#eaCh')){
      const id=txt(save.dataset.achatId||modal.dataset.yayaAchatId||'');
      if(id){
        del=document.createElement('button');
        del.type='button';
        del.className='yaya-achat-edit-delete';
        del.dataset.achatId=id;
        del.textContent='Supprimer l’achat';
        del.title='Supprimer complètement cet achat de Yaya';
      }
    }
    if(del){
      del.classList.add('yaya-achat-edit-delete');
      const id=txt(del.dataset.achatId||save.dataset.achatId||modal.dataset.yayaAchatId||'');
      if(id)del.dataset.achatId=id;
    }
    let close=Array.from(foot.querySelectorAll('button')).find(function(b){return /^Fermer$/i.test(txt(b.textContent))||b.classList.contains('yaya-achat-edit-close');});if(!close){close=document.createElement('button');close.type='button';close.className='yaya-achat-edit-close';close.textContent='Fermer';close.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();try{if(typeof window.closeModal==='function')window.closeModal();else if(typeof closeModal==='function')closeModal();else if(overlay)overlay.remove();}catch(err){if(overlay)overlay.remove();}});foot.appendChild(close);}else close.classList.add('yaya-achat-edit-close');foot.appendChild(save);if(del)foot.appendChild(del);foot.appendChild(close);}
  function apply(){ensureStyle();const root=document.getElementById('modalRoot');if(!root)return;root.querySelectorAll('.overlay .modal').forEach(ensureModal);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();const root=document.getElementById('modalRoot');if(root){let raf=0;new MutationObserver(function(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;apply();});}).observe(root,{childList:true,subtree:true});}setTimeout(apply,100);setTimeout(apply,500);

  // Les modules principaux sont chargés par index.html. Ne pas les recharger
  // ici avec Date.now() : cela forçait des requêtes + parsing inutiles et
  // ralentissait la navigation après ouverture d'une modale Finance.
  setTimeout(function(){
    if(window.__yayaAchatCreateModalStableV1||document.querySelector('script[data-yaya-achat-create-modal-stable]'))return;
    const s=document.createElement('script');
    s.src='achat-create-modal-stable-fix.js?v=stable-1';
    s.setAttribute('data-yaya-achat-create-modal-stable','1');
    s.async=false;
    document.head.appendChild(s);
  },120);
})();
