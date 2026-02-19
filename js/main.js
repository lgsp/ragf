// ════════════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════════════

const pick  = arr => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => {
  const a = [...arr]; const r = [];
  while (r.length < n && a.length) r.push(a.splice(Math.floor(Math.random()*a.length),1)[0]);
  return r;
};
const pickTwo = arr => pickN([...arr], 2);

function shuffle(arr) {
  const a = [...arr];
  for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

function gcd(a,b){return b===0?a:gcd(b,a%b);}

function latexFrac(n,d){
  if(d===0) return '\\text{indéf.}';
  if(d<0){n=-n;d=-d;}
  const g=gcd(Math.abs(n),d); n/=g; d/=g;
  return d===1?String(n):`\\dfrac{${n}}{${d}}`;
}

function fmt(v){
  if(Number.isInteger(v)) return String(v);
  return v.toFixed(2).replace(/\.?0+$/,'');
}

function linspace(a,b,n){
  const arr=[];
  for(let i=0;i<n;i++) arr.push(a+(b-a)*i/(n-1));
  return arr;
}

/** Build 4 distinct option strings */
function buildOptions(correct, wrongPool){
  const filtered=[...new Set(wrongPool.filter(w=>w!==correct))];
  const chosen=pickN(filtered,Math.min(3,filtered.length));
  return shuffle([correct,...chosen]);
}

// ════════════════════════════════════════════════════════
// FUNCTION CATALOGUE
// ════════════════════════════════════════════════════════

const FN = {
  sq:   { tex:'x^2-2',     fn:x=>x*x-2,           xR:[-3.2,3.2], yR:[-3,8] },
  aff:  { tex:'2x+1',      fn:x=>2*x+1,            xR:[-3,3],     yR:[-7,8] },
  aff2: { tex:'2x-1',      fn:x=>2*x-1,            xR:[-3,3],     yR:[-8,6] },
  aff3: { tex:'3x-2',      fn:x=>3*x-2,            xR:[-3,3],     yR:[-12,8]},
  cub:  { tex:'x^3-x',     fn:x=>x*x*x-x,          xR:[-2.2,2.2], yR:[-5,5] },
  sqrt: { tex:'\\sqrt{x+1}',fn:x=>x>=-1?Math.sqrt(x+1):null, xR:[-1.5,5], yR:[-0.3,3] },
  inv:  { tex:'\\dfrac{1}{x}',fn:x=>x?1/x:null,    xR:[-4,4],     yR:[-5,5] },
  // For f vs g
  aff_g:{ tex:'x+1',       fn:x=>x+1,              xR:[-4,4],     yR:[-5,8] },
  sq_g: { tex:'x^2',       fn:x=>x*x,              xR:[-3,3],     yR:[-1,9] },
  cst:  { tex:'2',         fn:()=>2,               xR:[-4,4],     yR:[-1,6] },
  cub_g:{ tex:'x^3',       fn:x=>x*x*x,            xR:[-2.2,2.2], yR:[-8,8] },
};

// ════════════════════════════════════════════════════════
// CHART HELPERS
// ════════════════════════════════════════════════════════

function makeChart(canvasId, datasets, xMin, xMax, yMin, yMax){
  const ctx=document.getElementById(canvasId).getContext('2d');
  return new Chart(ctx,{
    type:'scatter',
    data:{datasets},
    options:{
      animation:false,
      plugins:{legend:{display:false},tooltip:{enabled:false}},
      scales:{
        x:{type:'linear',min:xMin,max:xMax,grid:{color:'#1a2235'},ticks:{color:'#6b7a99',maxTicksLimit:9}},
        y:{type:'linear',min:yMin,max:yMax,grid:{color:'#1a2235'},ticks:{color:'#6b7a99',maxTicksLimit:9}}
      },
      responsive:true,maintainAspectRatio:false,showLine:true
    }
  });
}

function curveDataset(fn, xMin, xMax, color, w=2.5, dash=[]){
  const pts=linspace(xMin,xMax,400).map(x=>({x,y:fn(x)})).filter(p=>p.y!==null);
  return {data:pts,borderColor:color,borderWidth:w,pointRadius:0,showLine:true,fill:false,borderDash:dash};
}

function splitCurve(fn, xMin, xMax, color, gap=0.07){
  const pts=linspace(xMin,xMax,400);
  const neg=pts.filter(x=>x<-gap).map(x=>({x,y:fn(x)})).filter(p=>p.y!==null);
  const pos=pts.filter(x=>x>gap).map(x=>({x,y:fn(x)})).filter(p=>p.y!==null);
  const style={borderColor:color,borderWidth:2.5,pointRadius:0,showLine:true,fill:false};
  return [{data:neg,...style},{data:pos,...style}];
}

// ════════════════════════════════════════════════════════
// 02 — APPARTENANCE TOOL
// ════════════════════════════════════════════════════════

let appChart=null, currentAppFn='sq';

function initAppChart(){
  const ctx=document.getElementById('app-canvas').getContext('2d');
  appChart=new Chart(ctx,{
    type:'scatter',data:{datasets:[]},
    options:{
      animation:false,
      plugins:{legend:{display:false},tooltip:{enabled:false}},
      scales:{
        x:{type:'linear',grid:{color:'#1a2235'},ticks:{color:'#6b7a99'}},
        y:{type:'linear',grid:{color:'#1a2235'},ticks:{color:'#6b7a99'}}
      },
      responsive:true,maintainAspectRatio:false,showLine:true
    }
  });
  renderAppChart();
}

function renderAppChart(){
  const f=FN[currentAppFn];
  const a=parseFloat(document.getElementById('input-a').value)||0;
  const b=parseFloat(document.getElementById('input-b').value)||0;

  let curveSets;
  if(currentAppFn==='inv') curveSets=splitCurve(f.fn,f.xR[0],f.xR[1],'#5ab8e0');
  else curveSets=[curveDataset(f.fn,f.xR[0],f.xR[1],'#5ab8e0')];

  const fa=f.fn(a);
  const belongs=fa!==null && Math.abs(fa-b)<1e-9;
  const ptColor=belongs?'#6be05a':'#e05a5a';

  const datasets=[
    ...curveSets,
    {data:[{x:a,y:b}],backgroundColor:ptColor,pointRadius:11,pointHoverRadius:11,type:'scatter'},
  ];
  if(fa!==null){
    datasets.push({data:[{x:a,y:fa}],backgroundColor:'#f7c948',pointRadius:7,type:'scatter'});
    // dashed vertical
    const yLo=Math.min(b,fa), yHi=Math.max(b,fa);
    if(Math.abs(yHi-yLo)>0.02)
      datasets.push({data:[{x:a,y:yLo},{x:a,y:yHi}],borderColor:'rgba(200,200,200,.3)',borderWidth:1,borderDash:[5,5],pointRadius:0,showLine:true});
  }

  appChart.data.datasets=datasets;
  appChart.options.scales.x.min=f.xR[0]; appChart.options.scales.x.max=f.xR[1];
  appChart.options.scales.y.min=f.yR[0]; appChart.options.scales.y.max=f.yR[1];
  appChart.update('none');
}

function checkBelonging(){
  const f=FN[currentAppFn];
  const a=parseFloat(document.getElementById('input-a').value)||0;
  const b=parseFloat(document.getElementById('input-b').value)||0;
  const fa=f.fn(a);
  const res=document.getElementById('app-result');

  renderAppChart();

  if(fa===null){
    res.innerHTML=`<span class="ko">\\(x=${fmt(a)}\\) n'est pas dans le domaine de \\(f\\). Le point \\(A(${fmt(a)}\\,;\\,${fmt(b)})\\) n'appartient pas à \\(\\mathcal{C}_f\\).</span>`;
  } else {
    const belongs=Math.abs(fa-b)<1e-9;
    const faStr=fmt(+fa.toFixed(6));
    if(belongs)
      res.innerHTML=`<span class="ok">✓  \\(f(${fmt(a)})=${faStr}=${fmt(b)}\\) → \\(A(${fmt(a)}\\,;\\,${fmt(b)}) \\in \\mathcal{C}_f\\).</span>`;
    else
      res.innerHTML=`<span class="ko">✗  \\(f(${fmt(a)})=${faStr}\\neq ${fmt(b)}\\) → \\(A(${fmt(a)}\\,;\\,${fmt(b)}) \\notin \\mathcal{C}_f\\).</span>`;
  }
  if(window.MathJax) MathJax.typesetPromise([res]);
}

// Modélisation chart
function initModelChart(){
  const h=t=>-5*t*t+20*t;
  const ctx=document.getElementById('model-canvas').getContext('2d');
  new Chart(ctx,{
    type:'scatter',
    data:{datasets:[
      {data:linspace(0,4,120).map(t=>({x:t,y:h(t)})),borderColor:'#b05ae0',borderWidth:2.5,pointRadius:0,showLine:true,fill:false},
      {data:[{x:2,y:20}],backgroundColor:'#f7c948',pointRadius:9,type:'scatter'},
      {data:[{x:3,y:15}],backgroundColor:'#6be05a',pointRadius:9,type:'scatter'},
    ]},
    options:{
      animation:false,
      plugins:{legend:{display:false},tooltip:{enabled:false}},
      scales:{
        x:{type:'linear',min:0,max:4,grid:{color:'#1a2235'},ticks:{color:'#6b7a99'},title:{display:true,text:'t (s)',color:'#6b7a99'}},
        y:{type:'linear',min:0,max:22,grid:{color:'#1a2235'},ticks:{color:'#6b7a99'},title:{display:true,text:'h (m)',color:'#6b7a99'}}
      },
      responsive:true,maintainAspectRatio:false,showLine:true
    }
  });
}

// ════════════════════════════════════════════════════════
// 03 — PARITÉ
// ════════════════════════════════════════════════════════

function miniChart(id,fn,color,xR,yR){
  const ctx=document.getElementById(id).getContext('2d');
  const pts=linspace(xR[0],xR[1],300).map(x=>({x,y:fn(x)})).filter(p=>p.y!==null);
  new Chart(ctx,{
    type:'scatter',data:{datasets:[{data:pts,borderColor:color,borderWidth:2.5,pointRadius:0,showLine:true,fill:false}]},
    options:{animation:false,plugins:{legend:{display:false},tooltip:{enabled:false}},
      scales:{x:{type:'linear',min:xR[0],max:xR[1],grid:{color:'#1a2235'},ticks:{color:'#6b7a99',maxTicksLimit:5}},
              y:{type:'linear',min:yR[0],max:yR[1],grid:{color:'#1a2235'},ticks:{color:'#6b7a99',maxTicksLimit:5}}},
      responsive:true,maintainAspectRatio:false,showLine:true}
  });
}

const PAR_FNS={
  x2:   {fn:x=>x*x,     xR:[-3,3],   yR:[-0.5,9], type:'even', tex:'x^2',    why:'\\(f(-x)=(-x)^2=x^2=f(x)\\)'},
  x3:   {fn:x=>x*x*x,   xR:[-2.5,2.5],yR:[-8,8],  type:'odd',  tex:'x^3',    why:'\\(f(-x)=(-x)^3=-x^3=-f(x)\\)'},
  inv:  {fn:x=>x?1/x:null,xR:[-4,4], yR:[-5,5],   type:'odd',  tex:'\\tfrac{1}{x}', why:'\\(f(-x)=\\tfrac{1}{-x}=-\\tfrac{1}{x}=-f(x)\\)'},
  aff:  {fn:x=>2*x+1,   xR:[-3,3],   yR:[-7,8],   type:'none', tex:'2x+1',   why:'\\(f(-x)=-2x+1\\neq f(x)\\) et \\(\\neq -f(x)\\)'},
  x2px: {fn:x=>x*x+x,   xR:[-3,3],   yR:[-1,9],   type:'none', tex:'x^2+x',  why:'\\(f(-x)=x^2-x\\neq f(x)\\) et \\(\\neq -f(x)\\)'},
};

let parityChart=null, currentPar='x2';

function initParityChart(){
  const ctx=document.getElementById('parity-canvas').getContext('2d');
  parityChart=new Chart(ctx,{
    type:'scatter',data:{datasets:[]},
    options:{animation:false,plugins:{legend:{display:false},tooltip:{enabled:false}},
      scales:{x:{type:'linear',grid:{color:'#1a2235'},ticks:{color:'#6b7a99'}},
              y:{type:'linear',grid:{color:'#1a2235'},ticks:{color:'#6b7a99'}}},
      responsive:true,maintainAspectRatio:false,showLine:true}
  });
  renderParityChart();
}

function renderParityChart(){
  const pf=PAR_FNS[currentPar];
  const [x0,x1]=pf.xR, [y0,y1]=pf.yR;

  let main,sym;
  if(currentPar==='inv'){
    main=splitCurve(pf.fn,x0,x1,'#5ab8e0');
    sym=splitCurve(x=>pf.fn(-x),x0,x1,'#e05a5a').map(d=>({...d,borderDash:[6,4],borderWidth:1.5}));
  } else {
    main=[curveDataset(pf.fn,x0,x1,'#5ab8e0')];
    sym=[curveDataset(x=>pf.fn(-x),x0,x1,'#e05a5a',1.5,[6,4])];
  }

  parityChart.data.datasets=[...main,...sym];
  parityChart.options.scales.x.min=x0; parityChart.options.scales.x.max=x1;
  parityChart.options.scales.y.min=y0; parityChart.options.scales.y.max=y1;
  parityChart.update('none');

  const v=document.getElementById('parity-verdict');
  const {type,tex,why}=pf;
  const cls=type==='even'?'verdict-even':type==='odd'?'verdict-odd':'verdict-none';
  const word=type==='even'?'PAIRE':type==='odd'?'IMPAIRE':'NI PAIRE NI IMPAIRE';
  const geo=type==='even'?"La courbe (bleue) coïncide avec son image par la symétrie d'axe \\(Oy\\)."
           :type==='odd' ?"La courbe (bleue) coïncide avec son image par la symétrie de centre \\(O\\)."
           :"Les deux courbes (bleue et rouge) ne se superposent pas.";
  v.className=`verdict-box ${cls}`;
  v.innerHTML=`<strong>\\(f(x)=${tex}\\) est ${word}</strong><br>${why}<br>${geo}`;
  if(window.MathJax) MathJax.typesetPromise([v]);
}

// ════════════════════════════════════════════════════════
// 04 — f vs g
// ════════════════════════════════════════════════════════

let fgChart=null, curF='sq', curG='aff_g';

const FG_MAP={
  sq:{key:'sq'},cub:{key:'cub'},aff2:{key:'aff2'},sqrt:{key:'sqrt'},inv:{key:'inv'},
  aff:{key:'aff_g'},sq_g:{key:'sq_g'},cst:{key:'cst'},aff3:{key:'aff3'},cub_g:{key:'cub_g'},
};

function initFgChart(){
  const ctx=document.getElementById('fg-canvas').getContext('2d');
  fgChart=new Chart(ctx,{
    type:'scatter',data:{datasets:[]},
    options:{animation:false,plugins:{legend:{display:false},tooltip:{enabled:false}},
      scales:{x:{type:'linear',grid:{color:'#1a2235'},ticks:{color:'#6b7a99'}},
              y:{type:'linear',grid:{color:'#1a2235'},ticks:{color:'#6b7a99'}}},
      responsive:true,maintainAspectRatio:false,showLine:true}
  });
  renderFgChart();
}

function renderFgChart(){
  const fDef=FN[curF], gDef=FN[curG];
  const xMin=Math.max(fDef.xR[0],gDef.xR[0]);
  const xMax=Math.min(fDef.xR[1],gDef.xR[1]);
  const yMin=Math.max(Math.min(fDef.yR[0],gDef.yR[0]),-14);
  const yMax=Math.min(Math.max(fDef.yR[1],gDef.yR[1]),14);

  const xs=linspace(xMin,xMax,600);

  // Curves
  let fCurves, gCurves;
  if(curF==='inv') fCurves=splitCurve(fDef.fn,xMin,xMax,'#f7c948');
  else fCurves=[curveDataset(fDef.fn,xMin,xMax,'#f7c948')];
  if(curG==='inv') gCurves=splitCurve(gDef.fn,xMin,xMax,'#5ab8e0');
  else gCurves=[curveDataset(gDef.fn,xMin,xMax,'#5ab8e0')];

  // Intersections by sign change
  const intersections=[];
  for(let i=0;i<xs.length-1;i++){
    const x1=xs[i],x2=xs[i+1];
    const f1=fDef.fn(x1),f2=fDef.fn(x2),g1=gDef.fn(x1),g2=gDef.fn(x2);
    if(f1===null||f2===null||g1===null||g2===null) continue;
    const d1=f1-g1, d2=f2-g2;
    if(d1*d2<=0 && Math.abs(d1-d2)>1e-12){
      const xi=x1-d1*(x2-x1)/(d2-d1);
      const yi=fDef.fn(xi);
      if(yi!==null && Math.abs(xi-xMin)>0.05 && Math.abs(xi-xMax)>0.05)
        intersections.push({x:+xi.toFixed(4),y:+yi.toFixed(4)});
    }
  }

  // Shade where f < g (green fill via polygon)
  const shadePts=xs.map(x=>{
    const fy=fDef.fn(x),gy=gDef.fn(x);
    if(fy===null||gy===null) return null;
    return fy<gy?{x,y:gy,y0:fy}:null;
  }).filter(Boolean);
  const shadeTop=shadePts.map(p=>({x:p.x,y:p.y}));
  const shadeBot=[...shadePts].reverse().map(p=>({x:p.x,y:p.y0}));

  const datasets=[
    ...fCurves,...gCurves,
    // shade
    {data:[...shadeTop,...shadeBot],backgroundColor:'rgba(107,224,90,.14)',borderColor:'transparent',
     pointRadius:0,showLine:true,fill:true,tension:0},
    // intersection dots
    ...intersections.map(p=>({data:[p],backgroundColor:'#b05ae0',pointRadius:9,type:'scatter'})),
  ];

  fgChart.data.datasets=datasets;
  fgChart.options.scales.x.min=xMin; fgChart.options.scales.x.max=xMax;
  fgChart.options.scales.y.min=yMin; fgChart.options.scales.y.max=yMax;
  fgChart.update('none');

  // Labels
  document.getElementById('fg-f-label').innerHTML=`\\(f(x)=${fDef.tex}\\)`;
  document.getElementById('fg-g-label').innerHTML=`\\(g(x)=${gDef.tex}\\)`;

  // Result text
  const res=document.getElementById('fg-result');
  if(intersections.length===0){
    res.innerHTML=`Aucune intersection détectée sur cet intervalle.`;
  } else {
    const iStr=intersections.map(p=>`\\(x\\approx ${p.x}\\)`).join(', ');
    res.innerHTML=`<strong>Intersections :</strong> ${iStr}<br>
    La zone verte indique \\(f(x)&lt;g(x)\\). En dehors, \\(f(x)&gt;g(x)\\) (ou f non défini).`;
  }
  if(window.MathJax) MathJax.typesetPromise([
    document.getElementById('fg-f-label'),
    document.getElementById('fg-g-label'),
    res,
  ]);
}

// ════════════════════════════════════════════════════════
// 05 — SIGN TABLE GENERATOR
// ════════════════════════════════════════════════════════

function buildSignTable(){
  const ua=parseFloat(document.getElementById('ua').value)||0;
  const ub=parseFloat(document.getElementById('ub').value)||0;
  const va=parseFloat(document.getElementById('va').value)||0;
  const vb=parseFloat(document.getElementById('vb').value)||0;
  const type=document.querySelector('input[name="stype"]:checked').value;

  // roots
  const ru = ua!==0 ? -ub/ua : null;
  const rv = va!==0 ? -vb/va : null;

  // Build list of breakpoints
  const breaks=[];
  if(ru!==null) breaks.push({x:ru,which:'u'});
  if(rv!==null && (ru===null || Math.abs(rv-ru)>1e-9)) breaks.push({x:rv,which:'v'});
  breaks.sort((a,b)=>a.x-b.x);

  // Sign of affine in interval
  function sgn(a,b,x){ if(a===0) return b>0?'+':b<0?'-':'0'; return (a*x+b)>0?'+':'-'; }

  // Columns: alternating [interval, break, interval, break, ..., interval]
  const allX=[-Infinity,...breaks.map(b=>b.x),Infinity];
  const cols=[];
  for(let i=0;i<allX.length-1;i++){
    // interval column
    const lo=allX[i], hi=allX[i+1];
    const mid=isFinite(lo)&&isFinite(hi)?(lo+hi)/2 : isFinite(lo)?lo+1 : isFinite(hi)?hi-1 : 0;
    const su=sgn(ua,ub,mid), sv=sgn(va,vb,mid);
    let res;
    if(type==='prod') res=su===sv?'+':'-';
    else res=sv==='0'?'∄':su===sv?'+':'-';
    cols.push({kind:'int',su,sv,res});

    // breakpoint column (if not last interval)
    if(i<allX.length-2){
      const bx=allX[i+1];
      const bsu=ua!==0&&Math.abs(ua*bx+ub)<1e-9?'0':sgn(ua,ub,bx);
      const bsv=va!==0&&Math.abs(va*bx+vb)<1e-9?'0':sgn(va,vb,bx);
      let bres;
      if(type==='prod') bres=bsu==='0'||bsv==='0'?'0':bsu===bsv?'+':'-';
      else bres=bsv==='0'?'∄':bsu==='0'?'0':bsu===bsv?'+':'-';
      cols.push({kind:'brk',x:bx,su:bsu,sv:bsv,res:bres,which:breaks[i]?.which});
    }
  }

  // Build header labels
  const hdr=['\\(-\\infty\\)'];
  cols.forEach(c=>{ if(c.kind==='brk') hdr.push(`\\(${fmt(c.x)}\\)`); else hdr.push(''); });
  hdr.push('\\(+\\infty\\)');

  // Labels for u and v
  function affTex(a,b){
    if(a===0) return String(b);
    const aStr=a===1?'':a===-1?'-':String(a);
    const bStr=b===0?'':(b>0?`+${b}`:`${b}`);
    return `${aStr}x${bStr}`;
  }
  const uTex=affTex(ua,ub), vTex=affTex(va,vb);
  const resTex=type==='prod'?`(${uTex})(${vTex})`:`\\dfrac{${uTex}}{${vTex}}`;
  const resRowClass=type==='prod'?'result-row':'quot-row';

  function cell(s){
    if(s==='∄') return `<td class="undef-cell">||</td>`;
    return `<td class="${s==='+'?'pos':s==='-'?'neg':s==='0'?'zero':''}">${s}</td>`;
  }

  let html=`<table class="sign-tbl"><thead><tr>
    <th style="min-width:110px">\\(x\\)</th>
    ${hdr.map(h=>`<th>${h}</th>`).join('')}
    <th></th>
  </tr></thead><tbody>`;

  // u row
  html+=`<tr><td>\\(${uTex}\\)</td>`;
  cols.forEach(c=>{ html+=cell(c.su); });
  html+=`<td></td></tr>`;

  // v row
  html+=`<tr><td>\\(${vTex}\\)</td>`;
  cols.forEach(c=>{ html+=cell(c.sv); });
  html+=`<td></td></tr>`;

  // result row
  html+=`<tr class="${resRowClass}"><td>\\(${resTex}\\)</td>`;
  cols.forEach(c=>{ html+=cell(c.res); });
  html+=`<td></td></tr>`;

  html+=`</tbody></table>`;

  const out=document.getElementById('sign-out');
  out.innerHTML=html;

  // Conclusion
  const posIntervals=[];
  const zeroVals=[];
  cols.forEach((c,i)=>{
    if(c.kind==='int'&&c.res==='+'){
      const lo=i>0&&cols[i-1].kind==='brk'?fmt(cols[i-1].x):'-\\infty';
      const hi=i<cols.length-1&&cols[i+1].kind==='brk'?fmt(cols[i+1].x):'+\\infty';
      posIntervals.push(`\\(\\mathopen]${lo}\\,;\\,${hi}[\\)`);
    }
    if(c.kind==='brk'&&c.res==='0') zeroVals.push(`\\(x=${fmt(c.x)}\\)`);
  });

  const conclu=document.getElementById('sign-conclu-out');
  let txt=`\\(${resTex}>0\\) : ${posIntervals.length?posIntervals.join(' ∪ '):'Aucune solution'}`;
  if(zeroVals.length) txt+=`<br>\\(${resTex}=0\\) : ${zeroVals.join(' ou ')}`;
  conclu.innerHTML=txt;

  if(window.MathJax) MathJax.typesetPromise([out,conclu]);
}

// ════════════════════════════════════════════════════════
// 06 — QCM ENGINE
// ════════════════════════════════════════════════════════

let qcmScore=0, qcmAnswered=0, qcmTotal=0;

// ── Q1: Appartenance — point ∈ Cf ? ─────────────────────
function qBelonging(){
  const fns=[
    {tex:'x^2',       fn:x=>x*x},
    {tex:'2x+3',      fn:x=>2*x+3},
    {tex:'x^3',       fn:x=>x*x*x},
    {tex:'x^2-1',     fn:x=>x*x-1},
    {tex:'3x-2',      fn:x=>3*x-2},
    {tex:'-x^2+4',    fn:x=>-x*x+4},
  ];
  const f=pick(fns);
  const a=pick([-3,-2,-1,1,2,3]);
  const fa=f.fn(a);
  const givesRight=Math.random()<0.5;
  const b=givesRight?fa:fa+pick([-3,-2,-1,1,2,3]);
  const belongs=b===fa;

  const correct=belongs
    ? `Oui : \\(f(${a})=${fa}=${b}\\)`
    : `Non : \\(f(${a})=${fa}\\neq ${b}\\)`;
  const wrongs=belongs?[
    `Non : \\(f(${a})=${fa+1}\\neq ${b}\\)`,
    `Oui : \\(f(${a})=${b+1}\\)`,
    `On ne peut pas décider sans le graphe`,
  ]:[
    `Oui : \\(f(${a})=${b}\\)`,
    `Oui : \\(f(${b})=${a}\\)`,
    `Non : \\(f(${a})=${fa+2}\\neq ${b}\\)`,
  ];
  const opts=buildOptions(correct,wrongs);
  return {
    text:`Le point \\(A(${a}\\,;\\,${b})\\) appartient-il à la courbe de \\(f(x)=${f.tex}\\) ?`,
    opts, correctIndex:opts.indexOf(correct),
    expl:`On calcule \\(f(${a})=${fa}\\). ${belongs?`Comme \\(${fa}=${b}\\)`:` Comme \\(${fa}\\neq ${b}\\)`}, le point \\(A\\) ${belongs?"appartient":"n'appartient pas"} à \\(\\mathcal{C}_f\\).`
  };
}

// ── Q2: Calculer f(a) ───────────────────────────────────
function qComputeImage(){
  const fns=[
    {tex:'x^2-3',  fn:x=>x*x-3},
    {tex:'2x^2+1', fn:x=>2*x*x+1},
    {tex:'x^3+2',  fn:x=>x*x*x+2},
    {tex:'-x^2+5', fn:x=>-x*x+5},
    {tex:'3x-4',   fn:x=>3*x-4},
    {tex:'x^2+2x', fn:x=>x*x+2*x},
  ];
  const f=pick(fns);
  const a=pick([-3,-2,-1,0,1,2,3]);
  const fa=f.fn(a);
  const correct=`\\(f(${a})=${fa}\\)`;
  const wrongs=[
    `\\(f(${a})=${fa+1}\\)`,
    `\\(f(${a})=${fa-1}\\)`,
    `\\(f(${a})=${-fa}\\)`,
  ];
  const opts=buildOptions(correct,wrongs);
  return {
    text:`Soit \\(f(x)=${f.tex}\\). Quelle est l'image de \\(${a}\\) par \\(f\\) ?`,
    opts, correctIndex:opts.indexOf(correct),
    expl:`\\(f(${a})=${f.tex.replace(/x/g,`(${a})`)} = ${fa}\\).`
  };
}

// ── Q3: Trouver l'antécédent ────────────────────────────
function qAntecedent(){
  const scenarios=[
    {tex:'2x+1', fn:x=>2*x+1, inv:k=>(k-1)/2, oneSol:true},
    {tex:'x^2',  fn:x=>x*x,   inv:k=>k>=0?Math.sqrt(k):null, oneSol:false},
    {tex:'x^3',  fn:x=>x*x*x, inv:k=>Math.cbrt(k), oneSol:true},
  ];
  const sc=pick(scenarios);
  const k=pick([0,1,4,9]);
  const sol=sc.inv(k);

  let correct, expl;
  if(sol===null){
    correct=`Aucun antécédent dans \\(\\mathbb{R}\\)`;
    expl=`\\(${sc.tex}=${k}\\) est impossible dans \\(\\mathbb{R}\\).`;
  } else if(!sc.oneSol && k>0){
    const s=fmt(sol);
    correct=`\\(x=${s}\\) et \\(x=-${s}\\)`;
    expl=`\\(x^2=${k}\\Leftrightarrow x=\\pm\\sqrt{${k}}=\\pm${s}\\). Deux antécédents.`;
  } else if(!sc.oneSol && k===0){
    correct=`\\(x=0\\) (antécédent unique)`;
    expl=`\\(0^2=0\\). Un seul antécédent.`;
  } else {
    const s=Number.isInteger(sol)?String(sol):fmt(+sol.toFixed(4));
    correct=`\\(x=${s}\\)`;
    expl=`\\(${sc.tex}=${k}\\Rightarrow x=${s}\\).`;
  }
  const wrongs=[
    `\\(x=${k+1}\\)`,
    `\\(x=${k*2}\\)`,
    `Aucun antécédent dans \\(\\mathbb{R}\\)`,
  ].filter(w=>w!==correct);
  const opts=buildOptions(correct,wrongs);
  return {
    text:`Soit \\(f(x)=${sc.tex}\\). Quel(s) est(sont) les antécédents de \\(${k}\\) par \\(f\\) ?`,
    opts, correctIndex:opts.indexOf(correct), expl
  };
}

// ── Q4: Domaine de définition ───────────────────────────
function qDomain(){
  const cases=[
    {tex:'\\dfrac{1}{x-3}',  dom:'\\mathbb{R}\\setminus\\{3\\}',  w1:'\\mathbb{R}', w2:'\\mathbb{R}\\setminus\\{-3\\}', w3:'[3;+\\infty[', why:'\\(x-3=0\\Rightarrow x=3\\) est exclu.'},
    {tex:'\\sqrt{x-2}',      dom:'[2;+\\infty[',                   w1:'\\mathbb{R}', w2:']-\\infty;2]',                  w3:']2;+\\infty[', why:'\\(x-2\\geq 0\\Leftrightarrow x\\geq 2\\).'},
    {tex:'\\dfrac{1}{x+1}',  dom:'\\mathbb{R}\\setminus\\{-1\\}', w1:'\\mathbb{R}', w2:'\\mathbb{R}\\setminus\\{1\\}',  w3:'[-1;+\\infty[', why:'\\(x+1=0\\Rightarrow x=-1\\) est exclu.'},
    {tex:'\\sqrt{2x+4}',     dom:'[-2;+\\infty[',                  w1:'\\mathbb{R}', w2:']0;+\\infty[',                 w3:'[-4;+\\infty[', why:'\\(2x+4\\geq 0\\Leftrightarrow x\\geq -2\\).'},
    {tex:'\\dfrac{2}{x^2-1}',dom:'\\mathbb{R}\\setminus\\{-1,1\\}',w1:'\\mathbb{R}',w2:'\\mathbb{R}\\setminus\\{1\\}', w3:']-1;1[',        why:'\\(x^2-1=0\\Rightarrow x=\\pm 1\\) sont exclus.'},
  ];
  const c=pick(cases);
  const correct=`\\(${c.dom}\\)`;
  const wrongs=[`\\(${c.w1}\\)`,`\\(${c.w2}\\)`,`\\(${c.w3}\\)`];
  const opts=buildOptions(correct,wrongs);
  return {
    text:`Quel est le domaine de définition de \\(f(x)=${c.tex}\\) ?`,
    opts, correctIndex:opts.indexOf(correct),
    expl:`${c.why} Donc \\(D_f=${c.dom}\\).`
  };
}

// ── Q5: Parité ──────────────────────────────────────────
function qParity(){
  const fns=[
    {tex:'x^2',        type:'paire',   why:"\\(f(-x)=x^2=f(x)\\)"},
    {tex:'x^4',        type:'paire',   why:"\\(f(-x)=x^4=f(x)\\)"},
    {tex:'x^3',        type:'impaire', why:"\\(f(-x)=-x^3=-f(x)\\)"},
    {tex:'\\tfrac{1}{x}', type:'impaire',why:"\\(f(-x)=-\\tfrac{1}{x}=-f(x)\\)"},
    {tex:'x^2+x',      type:'aucune',  why:"\\(f(-x)=x^2-x\\neq f(x)\\) et \\(\\neq -f(x)\\)"},
    {tex:'2x+1',       type:'aucune',  why:"\\(f(-x)=-2x+1\\neq f(x)\\) et \\(\\neq -f(x)\\)"},
    {tex:'x^2-4',      type:'paire',   why:"\\(f(-x)=x^2-4=f(x)\\)"},
    {tex:'x^5',        type:'impaire', why:"\\(f(-x)=-x^5=-f(x)\\)"},
  ];
  const f=pick(fns);
  const label=f.type==='paire'?'Paire':f.type==='impaire'?'Impaire':'Ni paire ni impaire';
  const correct=label;
  const wrongs=['Paire','Impaire','Ni paire ni impaire'].filter(t=>t!==correct);
  const opts=buildOptions(correct,wrongs);
  const geo=f.type==='paire'?"symétrique par rapport à l'axe \\(Oy\\)"
           :f.type==='impaire'?"symétrique par rapport à l'origine \\(O\\)"
           :"sans symétrie axiale ni centrale particulière";
  return {
    text:`La fonction \\(f(x)=${f.tex}\\) définie sur \\(\\mathbb{R}\\) est :`,
    opts, correctIndex:opts.indexOf(correct),
    expl:`${f.why}. La fonction est donc <strong>${f.type}</strong>, et sa courbe est ${geo}.`
  };
}

// ── Q6: Traduction géométrique parité ───────────────────
function qParityGeo(){
  const cases=[
    {type:'paire',   geo:"symétrique par rapport à l'axe des ordonnées \\((Oy)\\)"},
    {type:'impaire', geo:"symétrique par rapport à l'origine \\(O\\)"},
  ];
  const c=pick(cases);
  const correct=`La courbe est ${c.geo}`;
  const wrongs=c.type==='paire'?[
    `La courbe est symétrique par rapport à l'origine \\(O\\)`,
    `La courbe est symétrique par rapport à l'axe \\((Ox)\\)`,
    `La fonction est croissante sur \\(\\mathbb{R}\\)`,
  ]:[
    `La courbe est symétrique par rapport à l'axe \\((Oy)\\)`,
    `La courbe est symétrique par rapport à l'axe \\((Ox)\\)`,
    `La fonction est paire`,
  ];
  const opts=buildOptions(correct,wrongs);
  const cond=c.type==='paire'?'\\(f(-x)=f(x)\\)':'\\(f(-x)=-f(x)\\)';
  return {
    text:`Quelle est la traduction géométrique du fait qu'une fonction soit <strong>${c.type}</strong> ?`,
    opts, correctIndex:opts.indexOf(correct),
    expl:`Si ${cond}, la courbe est ${c.geo}. C'est la définition géométrique de la ${c.type === 'paire' ? 'parité' : 'imparité'}.`
  };
}

// ── Q7: Signe d'un produit ──────────────────────────────
function qSignProduct(){
  const pairs=[[-3,-1],[1,3],[-2,2],[-1,4],[0,3],[-4,1],[-2,3]];
  const [r1,r2]=pick(pairs).sort((a,b)=>a-b);
  const uT=r1===0?'x':`x${r1>0?`-${r1}`:`+${-r1}`}`;
  const vT=r2===0?'x':`x${r2>0?`-${r2}`:`+${-r2}`}`;
  const zone=pick(['gauche','milieu','droite']);
  let tx, expSign;
  if(zone==='gauche'){tx=r1-1;expSign='+';}
  else if(zone==='milieu'){tx=(r1+r2)/2;expSign='-';}
  else {tx=r2+1;expSign='+';}

  const correct=`Le signe est \\(${expSign}\\)`;
  const wrongs=[
    `Le signe est \\(${expSign==='+'?'-':'+'  }\\)`,
    `Le signe est \\(0\\)`,
    `On ne peut pas conclure sans le graphe`,
  ];
  const opts=buildOptions(correct,wrongs);
  const reg=zone==='gauche'?`\\(]-\\infty;${r1}[\\)`:zone==='milieu'?`\\(]${r1};${r2}[\\)`:`\\(]${r2};+\\infty[\\)`;
  return {
    text:`Quel est le signe de \\((${uT})(${vT})\\) pour \\(x=${tx}\\) ?`,
    opts, correctIndex:opts.indexOf(correct),
    expl:`Racines : \\(x=${r1}\\) et \\(x=${r2}\\). En \\(x=${tx}\\in${reg}\\) : \\(${uT}\\) est ${tx>r1?'positif':'négatif'}, \\(${vT}\\) est ${tx>r2?'positif':'négatif'}. Produit → \\(${expSign}\\).`
  };
}

// ── Q8: Résoudre inéquation produit ─────────────────────
function qIneqProduct(){
  const pairs=[[-2,3],[1,4],[-1,2],[0,3],[-3,1]];
  const [a,b]=pick(pairs);
  const uT=a===0?'x':`x${a>0?`-${a}`:`+${-a}`}`;
  const vT=b===0?'x':`x${b>0?`-${b}`:`+${-b}`}`;
  const correct=`\\(x\\in\\mathopen]-\\infty;${a}[\\cup\\mathopen]${b};+\\infty[\\)`;
  const wrongs=[
    `\\(x\\in\\mathopen]${a};${b}[\\)`,
    `\\(x\\in[-${Math.abs(b)};${Math.abs(a)}]\\)`,
    `\\(x\\in\\mathopen]-\\infty;${a}]\\cup[${b};+\\infty[\\)`,
  ];
  const opts=buildOptions(correct,wrongs);
  return {
    text:`Résoudre \\((${uT})(${vT})>0\\).`,
    opts, correctIndex:opts.indexOf(correct),
    expl:`Racines \\(x=${a}\\) et \\(x=${b}\\). Le produit est positif à l'extérieur des racines (strictement) : \\(x\\in\\mathopen]-\\infty;${a}[\\cup\\mathopen]${b};+\\infty[\\).`
  };
}

// ── Q9: Résoudre f(x)=g(x) ──────────────────────────────
function qSolveFG(){
  const scenarios=[
    {f:'x^2',g:'x+2',    sols:[2,-1], check:x=>x*x===x+2},
    {f:'x^2',g:'2x+3',   sols:[3,-1], check:x=>x*x===2*x+3},
    {f:'x^3',g:'x',      sols:[-1,0,1],check:x=>x*x*x===x},
    {f:'x^2-1',g:'0',    sols:[1,-1], check:x=>x*x-1===0},
  ];
  const sc=pick(scenarios);
  const solStr=sc.sols.map(s=>`\\(x=${s}\\)`).join(' ou ');
  const correct=solStr;
  const wrongs=[
    sc.sols.map(s=>`\\(x=${s+1}\\)`).join(' ou '),
    sc.sols.map(s=>`\\(x=${s*2}\\)`).join(' ou '),
    'Aucune solution réelle',
  ];
  const opts=buildOptions(correct,wrongs);
  return {
    text:`Les solutions de \\(${sc.f}=${sc.g}\\) (abscisses des intersections) sont :`,
    opts, correctIndex:opts.indexOf(correct),
    expl:`On substitue : ${sc.sols.map(s=>`\\(f(${s})=${sc.f.replace(/x/g,`(${s})`)
      .replace('((-1))^2','1').replace('((-1))^3','-1')
      .replace('((2))^2','4').replace('((3))^2','9')
    }\\)`).join(', ')}. Les solutions sont ${solStr}.`
  };
}

// ── Q10: Quotient — quel signe ? ─────────────────────────
function qSignQuotient(){
  // u/(v) where u and v are affine with known roots
  const configs=[
    {uR:2, vR:-1, tex:{u:'x-2',v:'x+1'}},
    {uR:-3,vR:1,  tex:{u:'x+3',v:'x-1'}},
    {uR:0, vR:2,  tex:{u:'x',  v:'x-2'}},
  ];
  const c=pick(configs);
  const [r1,r2]=[c.uR,c.vR].sort((a,b)=>a-b);
  const testX=pick([r1-1, (r1+r2)/2, r2+1]);
  const fu=(c.uR-r1 === c.uR ? testX-c.uR : testX-c.uR); // testX - uR
  const fv=testX-c.vR;
  const realU=testX-c.uR, realV=testX-c.vR;
  const expSign=realV===0?'∄':realU/realV>0?'+':realU/realV<0?'-':'0';
  const correct=expSign==='∄'?`Indéfini (\\(${c.tex.v}=0\\))`:`Le signe est \\(${expSign}\\)`;
  const wrongs=[
    `Le signe est \\(${expSign==='+'?'-':'+'  }\\)`,
    `Le signe est \\(0\\)`,
    `Indéfini (\\(${c.tex.u}=0\\))`,
  ].filter(w=>w!==correct);
  const opts=buildOptions(correct,wrongs);
  return {
    text:`Quel est le signe de \\(\\dfrac{${c.tex.u}}{${c.tex.v}}\\) pour \\(x=${fmt(testX)}\\) ?`,
    opts, correctIndex:opts.indexOf(correct),
    expl:`\\(${c.tex.u}=${realU>0?'+':''}${realU}\\) et \\(${c.tex.v}=${realV>0?'+':''}${realV}\\)${realV===0?' → dénominateur nul, expression indéfinie':realU/realV>0?' → même signe → quotient positif':' → signes opposés → quotient négatif'}.`
  };
}

// ── Pool ─────────────────────────────────────────────────
const Q_POOL=[
  qBelonging, qComputeImage, qAntecedent, qDomain,
  qParity, qParityGeo, qSignProduct, qIneqProduct,
  qSolveFG, qSignQuotient,
];

function generateQuestions(n=6){
  return shuffle([...Q_POOL]).slice(0,n).map(gen=>gen());
}

// ── Render ───────────────────────────────────────────────
function renderQCM(questions){
  const container=document.getElementById('questions-container');
  container.innerHTML='';
  qcmScore=0; qcmAnswered=0; qcmTotal=questions.length;
  updateScore();

  questions.forEach((q,qi)=>{
    const block=document.createElement('div');
    block.className='question-block'; block.dataset.qi=qi;
    const labels=['A','B','C','D'];
    const optsHTML=q.opts.map((opt,oi)=>`
      <div class="option" data-qi="${qi}" data-oi="${oi}">
        <span class="option-label">${labels[oi]}</span><span>${opt}</span>
      </div>`).join('');
    block.innerHTML=`
      <p class="question-text"><b>Q${qi+1}.</b> ${q.text}</p>
      <div class="options">${optsHTML}</div>
      <div class="explanation" id="expl-${qi}">💡 ${q.expl}</div>`;
    container.appendChild(block);
  });

  container.querySelectorAll('.option').forEach(opt=>{
    opt.addEventListener('click',function(){
      const qi=parseInt(this.dataset.qi), oi=parseInt(this.dataset.oi);
      const block=container.querySelector(`.question-block[data-qi="${qi}"]`);
      if(block.dataset.answered) return;
      block.dataset.answered='1'; qcmAnswered++;
      const q=questions[qi];
      block.querySelectorAll('.option').forEach(o=>o.classList.add('locked'));
      if(oi===q.correctIndex){this.classList.add('correct');qcmScore++;}
      else{this.classList.add('wrong');block.querySelectorAll('.option')[q.correctIndex].classList.add('correct');}
      const explEl=document.getElementById(`expl-${qi}`);
      explEl.classList.add('show');
      updateScore();
      if(window.MathJax) MathJax.typesetPromise([explEl]);
    });
  });
  if(window.MathJax) MathJax.typesetPromise([container]);
}

function updateScore(){
  document.getElementById('score-display').textContent=`${qcmScore} / ${qcmAnswered}`;
  document.getElementById('progress-fill').style.width=qcmTotal>0?(qcmAnswered/qcmTotal*100)+'%':'0%';
}

function regenerateQCM(){ renderQCM(generateQuestions(6)); }

// ════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded',()=>{

  setTimeout(()=>{
    initAppChart();
    initModelChart();
    miniChart('even-canvas', x=>x*x,    '#f7c948', [-3,3],    [-0.5,9]);
    miniChart('odd-canvas',  x=>x*x*x,  '#b05ae0', [-2.5,2.5],[-8,8]);
    initParityChart();
    initFgChart();
    buildSignTable();
    regenerateQCM();
    if(window.MathJax) MathJax.typesetPromise();
  },300);

  // Appartenance tabs
  document.querySelectorAll('#app-tabs .tab2').forEach(t=>{
    t.addEventListener('click',()=>{
      document.querySelectorAll('#app-tabs .tab2').forEach(x=>x.classList.remove('active'));
      t.classList.add('active'); currentAppFn=t.dataset.fn; renderAppChart();
    });
  });
  document.getElementById('input-a').addEventListener('change', renderAppChart);
  document.getElementById('input-b').addEventListener('change', renderAppChart);

  // Parity tabs
  document.querySelectorAll('#parity-tabs .tab2').forEach(t=>{
    t.addEventListener('click',()=>{
      document.querySelectorAll('#parity-tabs .tab2').forEach(x=>x.classList.remove('active'));
      t.classList.add('active'); currentPar=t.dataset.par; renderParityChart();
    });
  });

  // f vs g tabs
  document.querySelectorAll('#fg-f-tabs .tab2').forEach(t=>{
    t.addEventListener('click',()=>{
      document.querySelectorAll('#fg-f-tabs .tab2').forEach(x=>x.classList.remove('active'));
      t.classList.add('active'); curF=t.dataset.f; renderFgChart();
    });
  });
  document.querySelectorAll('#fg-g-tabs .tab2').forEach(t=>{
    t.addEventListener('click',()=>{
      document.querySelectorAll('#fg-g-tabs .tab2').forEach(x=>x.classList.remove('active'));
      t.classList.add('active'); curG=t.dataset.g; renderFgChart();
    });
  });

  // Nav pills
  document.querySelectorAll('.nav-pill2').forEach(pill=>{
    pill.addEventListener('click',e=>{
      e.preventDefault();
      document.querySelectorAll('.nav-pill2').forEach(p=>p.classList.remove('active'));
      pill.classList.add('active');
      document.getElementById(pill.getAttribute('href').slice(1))
        ?.scrollIntoView({behavior:'smooth',block:'start'});
    });
  });
});