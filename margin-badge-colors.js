(function(){
  'use strict';

  const STORE_KEY='YAYA_HOME_MARGIN_PCTS_V1';
  let marginStore={byId:{},byKey:{}};
  try{
    const saved=JSON.parse(localStorage.getItem(STORE_KEY)||'{}');
    if(saved&&typeof saved==='object'){
      marginStore.byId=saved.byId&&typeof saved.byId==='object'?saved.byId:{};
      marginStore.byKey=saved.byKey&&typeof saved.byKey==='object'?saved.byKey:{};
    }
  }catch(e){}

  function palette(pct){
    if(pct>=100) return {bg:'#E8F2F9', fg:'#003D7A'};
    if(pct>=70)  return {bg:'#ECFDF5', fg:'#047857'};
    if(pct>=30)  return {bg:'#FFF7ED', fg:'#C2410C'};
    return {bg:'#FEF2F2', fg:'#B91C1C'};
  }

  // KPI "% marge" : palette validée.
  // > 10 % = vert soutenu ; 0 à 10 % = bleu franc ; < 0 % = rose framboise.
  function kpiMarginPalette(pct){
    if(pct<0) return {bg:'#FDF2F8', fg:'#BE185D', border:'#F9A8D4'};
    if(pct<=10) return {bg:'#EFF6FF', fg:'#2563EB', border:'#93C5FD'};
    return {bg:'#F0FDF4', fg:'#15803D', border:'#86EFAC'};
  }

  function parsePct(text){
    const m=String(text||'').replace(/\u00a0/g,' ').match(/(-?\d+(?:[.,]\d+)?)\s*%/);
    if(!m)return NaN;
    return parseFloat(m[1].replace(',','.'));
  }

  function pctTextFrom(el){
    const text=String(el&&el.textContent||'').replace(/\u00a0/g,' ').trim();
    const m=text.match(/^(-?\d+(?:[.,]\d+)?)\s*%$/);
    return m?(m[1]+' %'):'';
  }

  function chantierKey(top){
    if(!top)return '';
    let nameEl=null;
    try{nameEl=top.querySelector(':scope > b');}catch(e){}
    if(!nameEl)nameEl=top.querySelector('b');
    const numEl=top.querySelector('.num');
    const name=String(nameEl&&nameEl.textContent||'').trim().toUpperCase();
    const num=String(numEl&&numEl.textContent||'').trim().toUpperCase();
    return (name+'|'+num).replace(/\s+/g,' ');
  }

  function chantierId(top){
    if(!top)return '';
    const nodes=top.querySelectorAll('[onclick]');
    for(const el of nodes){
      const code=String(el.getAttribute('onclick')||'');
      const m=code.match(/(?:toggleChantier|delChantier|setStatut|editMontantDevis)\(\s*['"]([^'"]+)['"]/);
      if(m&&m[1])return String(m[1]);
    }
    const card=top.closest('.card');
    return String(card&&(
      card.getAttribute('data-chantier-id')||
      card.getAttribute('data-id')||
      (card.dataset&&card.dataset.chantierId)
    )||'');
  }

  function saveMarginStore(){
    try{localStorage.setItem(STORE_KEY,JSON.stringify(marginStore));}catch(e){}
    window.__YAYA_HOME_MARGIN_PCTS=marginStore;
  }

  // La liste d'accueil est la source de vérité du pourcentage.
  // On mémorise exactement la valeur affichée, sans la recalculer.
  function captureHomeMarginPercentages(){
    const pane=document.getElementById('pane-chantiers');
    if(!pane)return;
    let changed=false;
    pane.querySelectorAll('.card .top').forEach(function(top){
      const pctEl=[...top.querySelectorAll('span')].find(function(el){
        return /^(-?\d+(?:[.,]\d+)?)\s*%$/.test(String(el.textContent||'').replace(/\u00a0/g,' ').trim());
      });
      if(!pctEl)return;
      const pctText=pctTextFrom(pctEl);
      if(!pctText)return;
      const id=chantierId(top);
      const key=chantierKey(top);
      if(id&&marginStore.byId[id]!==pctText){marginStore.byId[id]=pctText;changed=true;}
      if(key&&marginStore.byKey[key]!==pctText){marginStore.byKey[key]=pctText;changed=true;}
    });
    if(changed)saveMarginStore();
  }

  function sourcePctForCard(card){
    const top=card&&card.querySelector('.top');
    if(!top)return '';
    const id=chantierId(top);
    const key=chantierKey(top);
    return (id&&marginStore.byId[id])||(key&&marginStore.byKey[key])||'';
  }

  // Le KPI ne recalcule plus son propre taux :
  // il reprend strictement le pourcentage déjà affiché sur la liste d'accueil.
  function syncKpiPercentagesFromHome(){
    const pane=document.getElementById('pane-chantiers');
    if(!pane)return;
    pane.querySelectorAll('.card').forEach(function(card){
      if(!card.querySelector('.kpis'))return;
      const sourcePct=sourcePctForCard(card);
      if(!sourcePct)return;

      card.querySelectorAll('.kpis .stat, .kpi, [data-kpi]').forEach(function(kpi){
        const labelEl=kpi.querySelector('small,.label,.kpi-label,[data-kpi-label]');
        const label=String(labelEl&&labelEl.textContent||'').trim().toLowerCase();
        const isPercentKpi=/^%\s*marge$/.test(label)
          || /^marge\s*%$/.test(label)
          || /taux\s+de\s+marge/.test(label);

        if(isPercentKpi){
          const valueEl=kpi.querySelector('b,strong,.value,.kpi-value');
          if(valueEl&&String(valueEl.textContent||'').trim()!==sourcePct){
            valueEl.textContent=sourcePct;
          }
          kpi.setAttribute('data-yaya-home-margin-pct',sourcePct);
          return;
        }

        if(/marge/.test(label)){
          const sub=kpi.querySelector('.sub');
          if(sub&&/%/.test(String(sub.textContent||''))){
            const next=/du\s+devis/i.test(String(sub.textContent||''))?sourcePct+' du devis':sourcePct;
            if(String(sub.textContent||'').trim()!==next)sub.textContent=next;
            kpi.setAttribute('data-yaya-home-margin-pct',sourcePct);
          }
        }
      });
    });
  }

  function applyMarginKpiColors(){
    const pane=document.getElementById('pane-chantiers');
    if(!pane)return;

    pane.querySelectorAll('.kpis .stat, .kpi, [data-kpi]').forEach(function(card){
      const labelEl=card.querySelector('small,.label,.kpi-label,[data-kpi-label]');
      const label=String(labelEl?labelEl.textContent:'').trim().toLowerCase();
      const explicitMargin=String(card.getAttribute('data-kpi')||'').toLowerCase();
      const isMarginPct=/^%\s*marge$/.test(label)
        || /^marge\s*%$/.test(label)
        || /taux\s+de\s+marge/.test(label)
        || /margin/.test(explicitMargin)
        || /marge/.test(explicitMargin);
      if(!isMarginPct)return;

      const pct=parsePct(card.getAttribute('data-yaya-home-margin-pct')||card.textContent);
      if(!Number.isFinite(pct))return;

      const p=kpiMarginPalette(pct);
      card.style.setProperty('background',p.bg,'important');
      card.style.setProperty('border-color',p.border,'important');
      card.style.setProperty('box-shadow','none','important');

      card.querySelectorAll('b,strong,.value,.kpi-value,.sub').forEach(function(el){
        el.style.setProperty('color',p.fg,'important');
      });
    });
  }

  function applyMarginBadgeColors(){
    const pane=document.getElementById('pane-chantiers');
    if(!pane)return;
    pane.querySelectorAll('.card .top').forEach(function(top){
      const spans=[...top.querySelectorAll('span')];
      const pctEl=spans.find(function(el){
        return /^(-?\d+(?:[.,]\d+)?)\s*%$/.test(String(el.textContent||'').trim());
      });
      if(!pctEl)return;

      const m=String(pctEl.textContent||'').trim().match(/^(-?\d+(?:[.,]\d+)?)\s*%$/);
      if(!m)return;
      const pct=parseFloat(m[1].replace(',','.'));
      if(!Number.isFinite(pct))return;

      const p=palette(pct);
      pctEl.style.setProperty('background',p.bg,'important');
      pctEl.style.setProperty('color',p.fg,'important');
      pctEl.style.removeProperty('border');
      pctEl.style.removeProperty('box-shadow');

      const margeEl=spans.find(function(el){
        return /^Marge\b/i.test(String(el.textContent||'').trim());
      });
      if(margeEl){
        margeEl.style.setProperty('color',p.fg,'important');
        margeEl.querySelectorAll('b').forEach(function(b){
          b.style.setProperty('color',p.fg,'important');
        });
      }
    });
  }

  function applyAllMarginColors(){
    captureHomeMarginPercentages();
    syncKpiPercentagesFromHome();
    applyMarginBadgeColors();
    applyMarginKpiColors();
  }

  const oldRender=window.renderChantiers;
  if(typeof oldRender==='function'&&!oldRender.__yayaMarginColors){
    const wrapped=function(){
      const r=oldRender.apply(this,arguments);
      applyAllMarginColors();
      return r;
    };
    wrapped.__yayaMarginColors=true;
    window.renderChantiers=wrapped;
  }

  let raf=0;
  const observer=new MutationObserver(function(){
    if(raf)return;
    raf=requestAnimationFrame(function(){
      raf=0;
      applyAllMarginColors();
    });
  });
  observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});

  setTimeout(applyAllMarginColors,50);
  setTimeout(applyAllMarginColors,400);
  setTimeout(applyAllMarginColors,1200);
})();

// Harmonisation fiche chantier : « Dépenses » devient « Achats » dans l'interface.
(function(){
  if(document.querySelector('script[data-yaya-achats-label-v1]'))return;
  const s=document.createElement('script');
  s.src='chantier-achats-label.js?v=achats-label-1-'+Date.now();
  s.async=false;
  s.setAttribute('data-yaya-achats-label-v1','1');
  document.head.appendChild(s);
})();

// Navigation chantier : Marché reste dans les données mais n'est plus proposé comme onglet.
(function(){
  if(document.querySelector('script[data-yaya-hide-marche-tab]'))return;
  const s=document.createElement('script');
  s.src='hide-marche-tab.js?v=2-'+Date.now();
  s.async=false;
  s.setAttribute('data-yaya-hide-marche-tab','1');
  document.head.appendChild(s);
})();
