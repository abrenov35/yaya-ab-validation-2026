(function(){
  'use strict';

  if(window.__yayaEvolutionDashboardV2Installed)return;
  window.__yayaEvolutionDashboardV2Installed=true;

  const STYLE_ID='yaya-evolution-dashboard-v2-style';
  const MONTHS=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const SHORT=['Janv.','Févr.','Mars','Avril','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'];

  function installStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      #pane-evolution{
        --evo-blue:#1769d3;
        --evo-blue2:#3aa0ff;
        --evo-navy:#123967;
        --evo-teal:#13b8a6;
        --evo-green:#109b67;
        --evo-orange:#f59e0b;
        --evo-purple:#7556d8;
        --evo-red:#dc4f4f;
        --evo-border:#dbe6f1;
        --evo-ink:#17324f;
        --evo-muted:#6b7d91;
        color:var(--evo-ink);
      }
      #pane-evolution .evo2-shell{display:grid;gap:14px}
      #pane-evolution .evo2-toolbar{
        display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;
        padding:3px 2px 0;
      }
      #pane-evolution .evo2-title{display:flex;align-items:flex-start;gap:11px}
      #pane-evolution .evo2-title-icon{
        width:38px;height:38px;border-radius:11px;display:grid;place-items:center;
        color:#fff;font-size:21px;font-weight:900;
        background:linear-gradient(145deg,#1e78ea,#1749a7);
        box-shadow:0 7px 18px rgba(30,120,234,.23);
      }
      #pane-evolution .evo2-toolbar h3{margin:0;font-size:23px;line-height:1.08;color:#102f55;letter-spacing:-.02em}
      #pane-evolution .evo2-sub{margin-top:5px;font-size:12.5px;color:var(--evo-muted);font-weight:500}
      #pane-evolution .evo2-controls{display:flex;gap:8px;align-items:center}
      #pane-evolution .evo2-history,#pane-evolution .evo2-year{
        height:38px;border:1px solid #cfdeed;border-radius:10px;background:#fff;color:#174f91;
        font-size:12px;font-weight:800;box-shadow:0 2px 7px rgba(18,57,103,.06);
      }
      #pane-evolution .evo2-history{padding:0 14px}
      #pane-evolution .evo2-year{padding:0 34px 0 12px;min-width:96px;color:#243b55}

      #pane-evolution .evo2-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
      #pane-evolution .evo2-kpi{
        position:relative;overflow:hidden;min-height:92px;padding:14px 15px 13px 76px;
        border:1px solid var(--evo-border);border-radius:14px;background:#fff;
        box-shadow:0 5px 18px rgba(30,62,94,.07);
      }
      #pane-evolution .evo2-kpi:after{
        content:"";position:absolute;right:-24px;bottom:-30px;width:108px;height:108px;border-radius:50%;opacity:.12;background:currentColor;
      }
      #pane-evolution .evo2-kpi-icon{
        position:absolute;left:15px;top:16px;width:46px;height:46px;border-radius:13px;display:grid;place-items:center;
        color:#fff;font-weight:900;font-size:19px;box-shadow:0 7px 15px rgba(0,0,0,.12)
      }
      #pane-evolution .evo2-kpi small{display:block;font-size:10.5px;font-weight:900;letter-spacing:.045em;text-transform:uppercase;margin-bottom:6px}
      #pane-evolution .evo2-kpi b{display:block;font-size:24px;line-height:1;font-weight:900;letter-spacing:-.025em;color:#122f52;white-space:nowrap}
      #pane-evolution .evo2-kpi-blue{color:var(--evo-blue);background:linear-gradient(135deg,#fff,#edf6ff)}
      #pane-evolution .evo2-kpi-blue .evo2-kpi-icon{background:linear-gradient(145deg,#2890ff,#1457bd)}
      #pane-evolution .evo2-kpi-green{color:var(--evo-green);background:linear-gradient(135deg,#fff,#edfbf5)}
      #pane-evolution .evo2-kpi-green .evo2-kpi-icon{background:linear-gradient(145deg,#20b97d,#0c8157)}
      #pane-evolution .evo2-kpi-orange{color:#d98000;background:linear-gradient(135deg,#fff,#fff7e8)}
      #pane-evolution .evo2-kpi-orange .evo2-kpi-icon{background:linear-gradient(145deg,#ffac25,#ef7c00)}
      #pane-evolution .evo2-kpi-purple{color:var(--evo-purple);background:linear-gradient(135deg,#fff,#f6f2ff)}
      #pane-evolution .evo2-kpi-purple .evo2-kpi-icon{background:linear-gradient(145deg,#8f73ef,#6546c6)}
      #pane-evolution .evo2-kpi .positive{color:#11875b!important}
      #pane-evolution .evo2-kpi .negative{color:var(--evo-red)!important}

      #pane-evolution .evo2-card{
        background:#fff;border:1px solid var(--evo-border);border-radius:15px;
        box-shadow:0 6px 22px rgba(28,60,92,.075);overflow:hidden;
      }
      #pane-evolution .evo2-card-head{
        display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px 8px;
      }
      #pane-evolution .evo2-card-title{font-size:14px;font-weight:900;color:#143a69;display:flex;align-items:center;gap:8px}
      #pane-evolution .evo2-card-note{font-size:10.5px;color:#71849a;font-weight:600}
      #pane-evolution .evo2-chart-scroll{overflow-x:auto;padding:0 12px 9px}
      #pane-evolution .evo2-chart{position:relative;min-width:910px;height:332px;padding:14px 8px 0 66px}
      #pane-evolution .evo2-y-axis{position:absolute;left:0;top:14px;bottom:43px;width:58px}
      #pane-evolution .evo2-y-label{
        position:absolute;right:7px;transform:translateY(50%);font-size:10px;font-weight:700;color:#71849a;white-space:nowrap;
      }
      #pane-evolution .evo2-gridline{
        position:absolute;left:66px;right:8px;border-top:1px dashed #d7e2ee;pointer-events:none;
      }
      #pane-evolution .evo2-columns{
        position:absolute;left:66px;right:8px;top:14px;bottom:0;
        display:grid;grid-template-columns:repeat(12,minmax(56px,1fr));gap:7px;
      }
      #pane-evolution .evo2-month{
        display:grid;grid-template-rows:1fr 37px;min-width:0;
      }
      #pane-evolution .evo2-bars-zone{position:relative;display:flex;align-items:flex-end;justify-content:center;gap:3px;min-height:0}
      #pane-evolution .evo2-bar-wrap{height:100%;width:min(36px,44%);display:flex;align-items:flex-end;justify-content:center;position:relative}
      #pane-evolution .evo2-bar{
        width:100%;min-height:2px;border-radius:7px 7px 2px 2px;
        background:linear-gradient(180deg,var(--evo-blue2),var(--evo-blue));
        box-shadow:0 3px 8px rgba(23,105,211,.18);position:relative;
        transition:height .25s ease,filter .2s ease;
      }
      #pane-evolution .evo2-bar:hover{filter:saturate(1.18) brightness(1.03)}
      #pane-evolution .evo2-bar.best{background:linear-gradient(180deg,#26d8c2,#0ba58f);box-shadow:0 4px 13px rgba(13,165,143,.28)}
      #pane-evolution .evo2-bar.previous{background:linear-gradient(180deg,#ffc763,#f29b0e);opacity:.58;box-shadow:none}
      #pane-evolution .evo2-bar.evo2-manual-click{cursor:pointer;outline:1px solid transparent}
      #pane-evolution .evo2-bar.evo2-manual-click:hover{outline-color:#0b5ca1;filter:saturate(1.16) brightness(1.04)}
      #pane-evolution .evo2-month-editor{
        position:absolute;left:50%;top:8px;z-index:20;transform:translateX(-50%);width:150px;
        padding:9px;background:#fff;border:1px solid #b9cce0;border-radius:10px;
        box-shadow:0 10px 28px rgba(15,45,78,.22);box-sizing:border-box;
      }
      #pane-evolution .evo2-month-editor strong{display:block;margin-bottom:6px;font-size:11px;color:#143a69;text-align:center}
      #pane-evolution .evo2-month-editor input{width:100%;height:34px;padding:0 8px;border:1px solid #aac0d6;border-radius:7px;font-size:12px;text-align:right;box-sizing:border-box}
      #pane-evolution .evo2-month-editor-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:7px}
      #pane-evolution .evo2-month-editor button{height:30px;padding:0 5px;border-radius:7px;font-size:10px;font-weight:800;cursor:pointer}
      #pane-evolution .evo2-month-save{border:1px solid #075da8;background:#075da8;color:#fff}
      #pane-evolution .evo2-month-cancel{border:1px solid #cbd6e2;background:#fff;color:#526579}
      #pane-evolution .evo2-value{
        position:absolute;bottom:calc(var(--bar-height) + 6px);left:50%;transform:translateX(-50%);
        font-size:9px;font-weight:900;color:#174f91;white-space:nowrap;z-index:3;
      }
      #pane-evolution .evo2-value.best{color:#07816f;font-size:10px}
      #pane-evolution .evo2-trophy{
        position:absolute;bottom:calc(var(--bar-height) + 23px);left:50%;transform:translateX(-50%);font-size:16px;line-height:1;
      }
      #pane-evolution .evo2-month-label{
        display:flex;align-items:center;justify-content:center;text-align:center;font-size:10.5px;font-weight:800;color:#324d6d;border-top:1px solid #cfdae6;
      }
      #pane-evolution .evo2-month.best .evo2-month-label{color:#07816f;font-weight:900}
      #pane-evolution .evo2-legend{display:flex;gap:14px;align-items:center;font-size:10.5px;color:#62778f;padding:0 16px 11px;font-weight:700}
      #pane-evolution .evo2-legend-dot{width:9px;height:9px;border-radius:3px;display:inline-block;margin-right:4px;vertical-align:-1px}

      #pane-evolution .evo2-table-head{padding:11px 15px 8px;font-size:13px;font-weight:900;color:#143a69;display:flex;align-items:center;gap:8px}
      #pane-evolution .evo2-table-wrap{overflow-x:auto;padding:0 12px 12px}
      #pane-evolution .evo2-table{width:100%;min-width:760px;border-collapse:separate;border-spacing:0;font-size:11.5px;box-shadow:none;border-radius:10px;overflow:hidden}
      #pane-evolution .evo2-table th{background:linear-gradient(90deg,#0d4b87,#0b5ca1);padding:8px 10px;font-size:10.5px;text-align:left}
      #pane-evolution .evo2-table th:not(:first-child),#pane-evolution .evo2-table td:not(:first-child){text-align:right}
      #pane-evolution .evo2-table td{padding:7px 10px;border-top:1px solid #e7edf4;background:#fff;color:#334d68}
      #pane-evolution .evo2-table tbody tr:nth-child(even) td{background:#f7f9fc}
      #pane-evolution .evo2-table tbody tr.best td{background:#e8faf5!important;color:#155d52}
      #pane-evolution .evo2-table td strong{font-weight:900;color:#0d57a5}
      #pane-evolution .evo2-month-cell{display:flex;align-items:center;gap:7px;text-align:left!important;font-weight:700}
      #pane-evolution .evo2-dot{width:8px;height:8px;border-radius:50%;background:#2d8df1;flex:0 0 auto}
      #pane-evolution .evo2-manual{font-size:8px;color:#a86a00;background:#fff0cf;border-radius:9px;padding:2px 6px;font-weight:900;letter-spacing:.04em}
      #pane-evolution .evo2-change{display:inline-flex;align-items:center;justify-content:center;min-width:48px;padding:3px 7px;border-radius:10px;font-weight:900}
      #pane-evolution .evo2-change.up{background:#e2f7ed;color:#087a4f}
      #pane-evolution .evo2-change.down{background:#fde9e9;color:#b53c3c}
      #pane-evolution .evo2-change.neutral{background:#eef2f6;color:#75869a}
      #pane-evolution .evo2-empty{padding:2px 16px 14px;color:#7a8b9e;font-size:11px}

      @media(max-width:900px){
        #pane-evolution .evo2-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
        #pane-evolution .evo2-toolbar h3{font-size:19px}
      }
      @media(max-width:560px){
        #pane-evolution .evo2-shell{gap:10px}
        #pane-evolution .evo2-kpis{grid-template-columns:1fr 1fr;gap:8px}
        #pane-evolution .evo2-kpi{min-height:78px;padding:11px 9px 10px 56px;border-radius:11px}
        #pane-evolution .evo2-kpi-icon{left:9px;top:13px;width:38px;height:38px;border-radius:10px;font-size:15px}
        #pane-evolution .evo2-kpi small{font-size:8.5px;margin-bottom:5px}
        #pane-evolution .evo2-kpi b{font-size:18px}
        #pane-evolution .evo2-title-icon{width:32px;height:32px;font-size:17px}
        #pane-evolution .evo2-toolbar h3{font-size:17px}
        #pane-evolution .evo2-controls{width:100%}
        #pane-evolution .evo2-history{flex:1}
        #pane-evolution .evo2-chart{height:300px}
      }
    `;
    document.head.appendChild(style);
  }

  function money(v){
    return Math.round(Number(v)||0).toLocaleString('fr-FR')+' €';
  }

  function axisMoney(v){
    v=Math.round(Number(v)||0);
    if(v>=1000000)return (v/1000000).toLocaleString('fr-FR',{maximumFractionDigits:1})+' M€';
    if(v>=1000)return Math.round(v/1000)+' k€';
    return v+' €';
  }

  function safeEsc(v){
    return String(v==null?'':v)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function signatureCanonique(c){
    const fixe=String(c&&c.dateSignatureFixe||'').trim().match(/^(\d{4}-\d{2})(?:-\d{2})?/);
    if(fixe)return fixe[1];
    const marker=String(c&&c.notes||'').match(/\[\[YAYA_SIG:(\d{4}-\d{2})\]\]/);
    if(marker&&marker[1])return marker[1];
    const direct=String(c&&c.dateSignature||'').trim().match(/^(\d{4}-\d{2})/);
    return direct&&direct[1]?direct[1]:'';
  }

  function roundAxis(max){
    max=Math.max(1,Number(max)||0);
    const rough=max/4;
    const mag=Math.pow(10,Math.floor(Math.log10(rough)));
    const norm=rough/mag;
    const nice=norm<=1?1:norm<=2?2:norm<=2.5?2.5:norm<=5?5:10;
    return nice*mag*4;
  }

  function valuesFor(year){
    const montants=Array(12).fill(0);
    const nombres=Array(12).fill(0);
    const chantiers=(typeof S!=='undefined'&&S&&Array.isArray(S.chantiers))?S.chantiers:[];

    chantiers.forEach(function(c){
      const sig=signatureCanonique(c);
      const m=sig.match(/^(\d{4})-(\d{2})/);
      if(!m||Number(m[1])!==year)return;
      const month=Number(m[2])-1;
      if(month<0||month>11)return;
      // Le marché HT synchronisé est la source du CA signé. Ne pas additionner
      // les devis/avenants : ils peuvent déjà être inclus dans ce montant.
      const marche=c.montantMarcheHT;
      const amount=Number(marche!==null&&marche!==undefined&&marche!==''?marche:c.montantDevisHT)||0;
      montants[month]+=amount;
      nombres[month]++;
    });

    let manuels=Array(12).fill(null);
    if(year===2026&&typeof window.montantsCaManuel2026==='function'){
      try{manuels=window.montantsCaManuel2026();}catch(e){}
    }
    if(!Array.isArray(manuels))manuels=Array(12).fill(null);
    while(manuels.length<12)manuels.push(null);
    manuels=manuels.slice(0,12);
    manuels.forEach(function(v,i){if(v!==null&&v!==''&&v!==undefined)montants[i]=Number(v)||0;});

    return {montants,nombres,manuels};
  }

  function cumulative(arr){
    let total=0;
    return arr.map(function(v){total+=Number(v)||0;return total;});
  }

  function renderDashboard(){
    installStyle();
    const el=document.getElementById('pane-evolution');
    if(!el)return;

    const chantiers=(typeof S!=='undefined'&&S&&Array.isArray(S.chantiers))?S.chantiers:[];
    const found=chantiers.map(signatureCanonique).map(function(sig){const m=sig.match(/^(\d{4})-/);return m?Number(m[1]):0;}).filter(function(y){return y>=2026;});
    const maxYear=Math.max(2026,new Date().getFullYear(),...found);
    try{if(anneeEvolution<2026||anneeEvolution>maxYear)anneeEvolution=maxYear;}catch(e){return;}

    const year=Number(anneeEvolution)||2026;
    const current=valuesFor(year);
    const previous=valuesFor(year-1);
    const cumCurrent=cumulative(current.montants);
    const cumPrevious=cumulative(previous.montants);
    const total=cumCurrent[11]||0;
    const totalPrev=cumPrevious[11]||0;
    const signedCount=current.nombres.reduce(function(a,b){return a+b;},0);
    const activeMonths=current.montants.filter(function(v){return v>0;}).length;
    const average=activeMonths?total/activeMonths:0;
    const evolution=totalPrev?Math.round((total-totalPrev)/totalPrev*100):null;
    const bestValue=Math.max.apply(null,current.montants.concat([0]));
    const bestMonth=current.montants.indexOf(bestValue);
    const maxChart=Math.max.apply(null,current.montants.concat(year>2026?previous.montants:[],[1]));
    const axisMax=250000;
    const options=Array.from({length:maxYear-2026+1},function(_,i){return 2026+i;}).map(function(y){return '<option value="'+y+'"'+(y===year?' selected':'')+'>'+y+'</option>';}).join('');

    const evoText=evolution===null?'Base de départ':((evolution>0?'+':'')+evolution+' %');
    const evoClass=evolution===null?'':(evolution>=0?'positive':'negative');
    const evoIcon=evolution===null?'◎':(evolution>=0?'↗':'↘');

    let html='<div class="evo2-shell">';
    html+='<div class="evo2-toolbar">'
      +'<div class="evo2-title"><div class="evo2-title-icon">▥</div><div><h3>Évolution du CA signé HT</h3><div class="evo2-sub">Chantiers signés à partir du 1er janvier 2026</div></div></div>'
      +'<div class="evo2-controls"><select class="evo2-year" onchange="anneeEvolution=Number(this.value);renderEvolution()">'+options+'</select></div>'
      +'</div>';

    html+='<div class="evo2-kpis">'
      +'<div class="evo2-kpi evo2-kpi-blue"><div class="evo2-kpi-icon">€</div><small>CA signé '+year+'</small><b>'+money(total)+'</b></div>'
      +'<div class="evo2-kpi evo2-kpi-green"><div class="evo2-kpi-icon">✓</div><small>Chantiers signés</small><b>'+signedCount+'</b></div>'
      +'<div class="evo2-kpi evo2-kpi-orange"><div class="evo2-kpi-icon">▥</div><small>Moyenne mensuelle</small><b>'+money(average)+'</b></div>'
      +'<div class="evo2-kpi evo2-kpi-purple"><div class="evo2-kpi-icon">'+evoIcon+'</div><small>Évolution / '+(year-1)+'</small><b class="'+evoClass+'">'+evoText+'</b></div>'
      +'</div>';

    html+='<div class="evo2-card">'
      +'<div class="evo2-card-head"><div class="evo2-card-title">▥ Évolution mensuelle du CA signé HT — '+year+'</div><div class="evo2-card-note">'+(year===2026?'Cliquez sur une barre de janvier à août pour modifier le montant':'Montants en euros (€)')+'</div></div>'
      +'<div class="evo2-chart-scroll"><div class="evo2-chart">';

    const levels=[1,.75,.5,.25,0];
    html+='<div class="evo2-y-axis">';
    levels.forEach(function(level){html+='<span class="evo2-y-label" style="bottom:'+(level*100)+'%">'+axisMoney(axisMax*level)+'</span>';});
    html+='</div>';
    levels.forEach(function(level){html+='<div class="evo2-gridline" style="bottom:'+(43+level*(100-13))+'%"></div>';});

    html+='<div class="evo2-columns">';
    MONTHS.forEach(function(month,i){
      const value=current.montants[i]||0;
      const prev=previous.montants[i]||0;
      const h=Math.max(0,Math.min(100,value/axisMax*100));
      const hp=Math.max(0,Math.min(100,prev/axisMax*100));
      const isBest=value>0&&i===bestMonth;
      const currentWidth=year>2026?'43%':'62%';
      html+='<div class="evo2-month'+(isBest?' best':'')+'"><div class="evo2-bars-zone">';
      if(year>2026){
        html+='<div class="evo2-bar-wrap" style="width:43%"><div class="evo2-bar previous" title="'+safeEsc((year-1)+' : '+money(prev))+'" style="height:'+hp+'%"></div></div>';
      }
      html+='<div class="evo2-bar-wrap" style="width:'+currentWidth+';--bar-height:'+h+'%">'
        +'<span class="evo2-value'+(isBest?' best':'')+'" style="--bar-height:'+h+'%">'+money(value)+'</span>'
        +(isBest?'<span class="evo2-trophy" style="--bar-height:'+h+'%">★</span>':'')
        +'<div class="evo2-bar'+(isBest?' best':'')+(year===2026&&i<8?' evo2-manual-click':'')+'" title="'+safeEsc(year===2026&&i<8?'Modifier '+month+' 2026 : '+money(value):year+' : '+money(value))+'"'+(year===2026&&i<8?' onclick="openCaMonthEditor(event,'+i+')"':'')+' style="height:'+h+'%"></div></div>';
      html+='</div><div class="evo2-month-label">'+SHORT[i]+'</div></div>';
    });
    html+='</div></div></div>';
    html+='<div class="evo2-legend"><span><i class="evo2-legend-dot" style="background:#2187ed"></i>'+year+'</span>'+(year>2026?'<span><i class="evo2-legend-dot" style="background:#f4a51c"></i>'+(year-1)+'</span>':'')+(bestValue>0?'<span style="margin-left:auto;color:#07816f">★ Meilleur mois : '+MONTHS[bestMonth]+' · '+money(bestValue)+'</span>':'')+'</div></div>';

    html+='<div class="evo2-card"><div class="evo2-table-head">▤ Détail mensuel du CA signé HT</div><div class="evo2-table-wrap"><table class="evo2-table"><thead><tr><th>Mois</th><th>CA HT du mois</th><th>Cumul '+year+'</th><th>Cumul '+(year-1)+'</th><th>Évolution</th></tr></thead><tbody>';
    MONTHS.forEach(function(month,i){
      const ep=cumPrevious[i]?Math.round((cumCurrent[i]-cumPrevious[i])/cumPrevious[i]*100):null;
      const manual=current.manuels[i]!==null&&current.manuels[i]!==undefined&&current.manuels[i]!=='';
      const change=year===2026||ep===null?'<span class="evo2-change neutral">—</span>':'<span class="evo2-change '+(ep>=0?'up':'down')+'">'+(ep>0?'↑ +':ep<0?'↓ ':'')+ep+' %</span>';
      const dotColor=(i===bestMonth&&bestValue>0)?'#0fa68f':(current.montants[i]>0?'#2589ee':'#c7d1dc');
      html+='<tr'+(i===bestMonth&&bestValue>0?' class="best"':'')+'>'
        +'<td class="evo2-month-cell"><i class="evo2-dot" style="background:'+dotColor+'"></i>'+month+(manual?' <span class="evo2-manual">MANUEL</span>':'')+'</td>'
        +'<td>'+money(current.montants[i])+'</td>'
        +'<td><strong>'+money(cumCurrent[i])+'</strong></td>'
        +'<td>'+(year===2026?'—':money(cumPrevious[i]))+'</td>'
        +'<td>'+change+'</td></tr>';
    });
    html+='</tbody></table></div>';
    if(!signedCount)html+='<div class="evo2-empty">Aucun chantier signé en '+year+'. Les montants se compléteront à partir des dates de signature.</div>';
    html+='</div></div>';

    el.innerHTML=html;
  }

  window.openCaMonthEditor=function(event,index){
    if(event){event.preventDefault();event.stopPropagation();}
    index=Number(index);
    if(index<0||index>7)return;
    document.querySelectorAll('#pane-evolution .evo2-month-editor').forEach(function(el){el.remove();});
    const bar=event&&event.currentTarget;
    const zone=bar&&bar.closest('.evo2-bars-zone');
    if(!zone)return;
    const current=valuesFor(2026).montants[index]||0;
    const editor=document.createElement('div');
    editor.className='evo2-month-editor';
    editor.onclick=function(e){e.stopPropagation();};
    editor.innerHTML='<strong>'+MONTHS[index]+' 2026</strong><input type="number" min="0" step="0.01" inputmode="decimal" value="'+current+'" aria-label="CA HT '+MONTHS[index]+' 2026"><div class="evo2-month-editor-actions"><button type="button" class="evo2-month-cancel">Annuler</button><button type="button" class="evo2-month-save">Valider</button></div>';
    zone.appendChild(editor);
    const input=editor.querySelector('input');
    editor.querySelector('.evo2-month-cancel').onclick=function(){editor.remove();};
    editor.querySelector('.evo2-month-save').onclick=async function(){
      const value=String(input.value||'').trim();
      if(value===''){input.focus();return;}
      const button=this;button.disabled=true;button.textContent='…';
      const ok=typeof window.saveCaManuel2026Month==='function'&&await window.saveCaManuel2026Month(index,value);
      if(!ok&&editor.isConnected){button.disabled=false;button.textContent='Valider';}
    };
    input.onkeydown=function(e){if(e.key==='Enter')editor.querySelector('.evo2-month-save').click();else if(e.key==='Escape')editor.remove();};
    requestAnimationFrame(function(){input.focus();input.select();});
  };

  function install(){
    installStyle();
    if(typeof window.renderEvolution!=='function'||typeof S==='undefined'){
      setTimeout(install,120);
      return;
    }
    window.renderEvolution=renderDashboard;
    if(typeof tab!=='undefined'&&tab==='evolution')renderDashboard();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
