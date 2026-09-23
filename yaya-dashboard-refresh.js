(function(){
  'use strict';
  const required=['chantiers','documents','achats','commandes','heures','salaries','avenants','validations'];
  const initialBuild=(new URL(document.currentScript.src,location.href)).searchParams.get('_build')||(document.title.match(/Yaya v([\d.]+)/i)||[])[1]||'';
  let busy=false, lastSuccess=null, versionAvailable=false;
  const style=document.createElement('style');
  style.textContent='.yaya-refresh-controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:8px 0 12px}.yaya-refresh-controls button{min-height:38px;padding:7px 12px;border-radius:8px;border:1px solid #9aabc2;background:#fff;color:#183457;font-weight:700;cursor:pointer}.yaya-refresh-controls button:disabled{opacity:.55;cursor:wait}.yaya-refresh-controls [role=status]{font-size:12px;color:#35506c}.yaya-refresh-controls [data-error]{color:#b42318}.yaya-refresh-controls .yaya-new-version{background:#fff5d6;border-color:#dcae33}';
  document.head.appendChild(style);
  function controls(){
    let host=document.getElementById('yaya-dashboard-refresh');
    if(host){
      if(!host.querySelector('.yaya-refresh-button')){
        const button=document.createElement('button');button.type='button';button.className='yaya-refresh-button';button.textContent='⟳ Actualiser';
        host.insertBefore(button,host.firstChild);button.addEventListener('click',refresh);status();
      }
      return host;
    }
    const pane=document.getElementById('pane-chantiers');
    if(!pane)return null;
    host=document.createElement('div');host.id='yaya-dashboard-refresh';host.className='yaya-refresh-controls';
    host.innerHTML='<button type="button" class="yaya-refresh-button">⟳ Actualiser</button><span role="status" aria-live="polite"></span><button type="button" class="yaya-new-version" hidden>Nouvelle version disponible — recharger Yaya</button>';
    pane.insertBefore(host,pane.firstChild);
    host.querySelector('.yaya-refresh-button').addEventListener('click',refresh);
    host.querySelector('.yaya-new-version').addEventListener('click',reloadVersion);
    status();
    return host;
  }
  function status(message='',error=false){
    const host=document.getElementById('yaya-dashboard-refresh');if(!host)return;
    const el=host.querySelector('[role=status]');
    el.textContent=message||(lastSuccess?'Dernière actualisation réussie : '+lastSuccess.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'');
    el.toggleAttribute('data-error',error);
    const refreshButton=host.querySelector('.yaya-refresh-button');if(refreshButton)refreshButton.disabled=busy;
    host.querySelector('.yaya-new-version').hidden=!versionAvailable;
  }
  async function refresh(){
    if(busy)return;
    if(document.querySelector('#modalRoot .overlay, .modal.show')||document.querySelector('input:focus,textarea:focus,[contenteditable="true"]:focus')){
      status('Terminez ou fermez la saisie avant d’actualiser.',true);return;
    }
    busy=true;status('Actualisation en cours…');
    try{
      if(typeof apiGet!=='function'||typeof render!=='function')throw new Error('Interface Yaya indisponible');
      const previous=S, project=typeof focusChantier!=='undefined'?focusChantier:null;
      const section=document.querySelector('#pane-chantiers .card[data-yaya-detail-section]')?.getAttribute('data-yaya-detail-section');
      const fresh=await apiGet(true);
      if(!fresh||required.some(key=>!Array.isArray(fresh[key])))throw new Error('Réponse API incomplète');
      S=fresh;
      try{
        if(project&&typeof focusChantier!=='undefined')focusChantier=fresh.chantiers.some(c=>String(c.id)===String(project))?project:null;
        render();
        if(section){
          const tab=document.querySelector('#pane-chantiers .yaya-detail-section-tab[data-section="'+section+'"]');
          if(tab)tab.click();
        }
        if(typeof tab==='string'&&!document.getElementById('pane-'+tab))throw new Error('Écran indisponible');
      }catch(err){S=previous;try{render();}catch(e){}throw err;}
      window.dispatchEvent(new CustomEvent('yaya:data-refreshed',{detail:{tabs:required,source:'dashboard'}}));
      lastSuccess=new Date();status();
    }catch(err){
      console.warn('Actualisation Yaya impossible',err);
      status('Échec de l’actualisation : '+(err?.message||'connexion indisponible')+'. Réessayez.',true);
    }finally{busy=false;const b=document.querySelector('#yaya-dashboard-refresh .yaya-refresh-button');if(b)b.disabled=false;}
  }
  async function checkVersion(){
    if(!initialBuild)return;
    try{
      const response=await fetch('version.txt?_version='+Date.now(),{cache:'no-store'});
      if(!response.ok)return;
      const latest=(await response.text()).trim();
      if(/^\d+(?:\.\d+)+$/.test(latest)&&latest!==initialBuild){versionAvailable=true;status();}
    }catch(e){}
  }
  function reloadVersion(){
    if(busy||document.querySelector('#modalRoot .overlay, .modal.show')||document.querySelector('input:focus,textarea:focus,[contenteditable="true"]:focus')){
      status('Terminez ou fermez la saisie avant de recharger.',true);return;
    }
    const url=new URL(location.href);url.searchParams.set('_yaya_build',Date.now());
    location.assign(url.href);
  }
  const observer=new MutationObserver(()=>{const host=document.getElementById('yaya-dashboard-refresh');if(!host||!host.querySelector('.yaya-refresh-button'))controls();});
  observer.observe(document.body,{childList:true,subtree:true});
  controls();checkVersion();setInterval(checkVersion,60000);
})();
