(function(){
  'use strict';
  if(window.__yayaPhotoEditButtonPolishV1)return;
  window.__yayaPhotoEditButtonPolishV1=true;

  const STYLE_ID='yaya-photo-edit-button-polish-v1';

  function installStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      #pane-chantiers .yaya-photo-card-polished{
        display:flex!important;
        flex-direction:column!important;
        min-width:0!important;
        height:100%!important;
      }
      #pane-chantiers .yaya-photo-edit-polished{
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        width:calc(100% - 16px)!important;
        min-width:0!important;
        height:30px!important;
        min-height:30px!important;
        margin:auto 8px 8px!important;
        padding:0 10px!important;
        border:1px solid #b7c8d9!important;
        border-radius:7px!important;
        background:#f8fbff!important;
        color:#0b4f8a!important;
        box-shadow:none!important;
        font-size:11px!important;
        font-weight:750!important;
        line-height:1!important;
      }
      #pane-chantiers .yaya-photo-edit-polished:hover{
        background:#edf5fc!important;
        border-color:#8eabc7!important;
        color:#073d6d!important;
      }
      @media(max-width:640px){
        #pane-chantiers .yaya-photo-edit-polished{
          width:calc(100% - 12px)!important;
          height:28px!important;
          min-height:28px!important;
          margin:auto 6px 6px!important;
          padding:0 7px!important;
          font-size:10.5px!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function isEditButton(btn){
    return String(btn&&btn.textContent||'').trim().toLowerCase()==='modifier';
  }

  function looksLikePhotoCard(el){
    if(!el||el.nodeType!==1)return false;
    return !!el.querySelector('img, picture, [style*="background-image"]');
  }

  function photoScopes(){
    return Array.from(document.querySelectorAll(
      '#pane-chantiers .yaya-detail-photos-pane,'+
      '#pane-chantiers [data-yaya-detail-section="photos"],'+
      '#pane-chantiers [data-section="photos"]'
    ));
  }

  function polishButton(btn){
    if(!btn||btn.dataset.yayaPhotoEditPolished==='1')return;
    let card=btn.closest('.yaya-photo-card,.photo-card,.yaya-pic-wrap,[data-photo-card]');

    if(!card){
      const prev=btn.previousElementSibling;
      if(looksLikePhotoCard(prev))card=prev;
    }

    if(!card){
      const parent=btn.parentElement;
      if(parent&&looksLikePhotoCard(parent))card=parent;
    }

    if(card){
      card.classList.add('yaya-photo-card-polished');
      if(!card.contains(btn)){
        try{card.appendChild(btn);}catch(e){}
      }
    }

    btn.classList.add('yaya-photo-edit-polished');
    btn.dataset.yayaPhotoEditPolished='1';
  }

  function patch(){
    installStyle();
    photoScopes().forEach(function(scope){
      scope.querySelectorAll('button').forEach(function(btn){
        if(isEditButton(btn))polishButton(btn);
      });
    });
  }

  let raf=0;
  function schedule(){
    if(raf)return;
    raf=requestAnimationFrame(function(){raf=0;patch();});
  }

  patch();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('yaya:data-refreshed',schedule);
})();
