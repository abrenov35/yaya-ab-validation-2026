(function(){
  'use strict';

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

      const pct=parsePct(card.textContent);
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
      applyMarginKpiColors();
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
