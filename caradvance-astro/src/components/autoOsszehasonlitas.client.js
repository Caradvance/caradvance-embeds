

// CARS és PHOTOS: build-időben (define:vars) érkezik — ár és link a bérlési adatokból
// --- Generikus, méretarányos autó-sziluettek (saját rajz, gyári méretekből) ---
const BP={
 hatch:{p:[[0,.22],[0,.42],[.025,.51],[.2,.59],[.34,.655],[.47,.97],[.56,1],[.85,.985],[.95,.82],[.995,.64],[1,.36],[.99,.22]],w:[[.365,.66],[.48,.935],[.56,.955],[.84,.94],[.925,.79],[.93,.665]],gc:140},
 sedan:{p:[[0,.22],[0,.42],[.025,.51],[.24,.6],[.37,.655],[.49,.97],[.58,1],[.75,.975],[.87,.71],[.995,.65],[1,.38],[.99,.22]],w:[[.395,.665],[.5,.935],[.58,.955],[.745,.94],[.835,.695]],gc:135},
 estate:{p:[[0,.22],[0,.42],[.025,.51],[.23,.6],[.36,.655],[.48,.97],[.56,1],[.92,.975],[.975,.8],[.997,.63],[1,.36],[.99,.22]],w:[[.385,.665],[.49,.935],[.56,.955],[.9,.935],[.955,.79],[.955,.665]],gc:140},
 coupe:{p:[[0,.2],[0,.4],[.025,.5],[.26,.6],[.39,.655],[.52,.97],[.6,1],[.73,.955],[.88,.72],[.995,.64],[1,.38],[.99,.2]],w:[[.415,.665],[.525,.935],[.6,.955],[.72,.92],[.8,.71]],gc:125},
 cabrio:{p:[[0,.22],[0,.42],[.025,.52],[.26,.62],[.4,.68],[.6,.72],[.85,.72],[.95,.69],[.995,.64],[1,.38],[.99,.22]],w:[],gc:130,ws:[[.395,.675],[.47,.98],[.49,.98],[.425,.69]]},
 suv:{p:[[0,.24],[0,.47],[.025,.57],[.2,.64],[.32,.7],[.44,.975],[.52,1],[.89,.985],[.965,.8],[.995,.6],[1,.36],[.99,.24]],w:[[.345,.71],[.455,.945],[.52,.96],[.88,.95],[.945,.79],[.95,.71]],gc:185},
 mpv:{p:[[0,.24],[0,.46],[.025,.56],[.16,.63],[.26,.7],[.4,.975],[.48,1],[.93,.985],[.985,.8],[1,.56],[1,.32],[.99,.24]],w:[[.285,.71],[.41,.945],[.48,.96],[.92,.95],[.97,.79],[.975,.71]],gc:160},
 van:{p:[[0,.2],[0,.5],[.04,.63],[.12,.7],[.22,.975],[.28,1],[.97,1],[.995,.96],[1,.42],[.995,.2]],w:[[.15,.71],[.235,.94],[.28,.955],[.95,.955],[.955,.71]],gc:180}};
function smoothPath(pts){let d=`M${pts[0][0].toFixed(0)},${pts[0][1].toFixed(0)}`;for(let i=1;i<pts.length-1;i++){const p=pts[i],n=pts[i+1];d+=` Q${p[0].toFixed(0)},${p[1].toFixed(0)} ${((p[0]+n[0])/2).toFixed(0)},${((p[1]+n[1])/2).toFixed(0)}`}const l=pts[pts.length-1];return d+` L${l[0].toFixed(0)},${l[1].toFixed(0)}`}
const SC={body:'#DCE0E6',line:'#8E97A5',win:'#9AA4B2',tire:'#2A2E35',rim:'#B4BBC5',hub:'#6B7480'};
function silSide(c){const L=c.L,H=c.H,B=BP[c.body]||BP.sedan,gc=B.gc,R=Math.max(290,Math.min(370,H*0.205));
 const X=f=>f*L,Y=f=>H-f*H;const P=B.p.map(([x,y])=>[X(x),Y(y)]);
 const fo=(L-c.WB)*0.46,fa=fo,ra=fo+c.WB;
 const hw=R*1.1,s=2*R+45-gc,r=(hw*hw+s*s)/(2*s),big=s>hw?1:0,yb=H-gc;
 let d=smoothPath(P)+` L${(ra+hw).toFixed(0)},${yb} A${r.toFixed(0)},${r.toFixed(0)} 0 ${big} 0 ${(ra-hw).toFixed(0)},${yb} L${(fa+hw).toFixed(0)},${yb} A${r.toFixed(0)},${r.toFixed(0)} 0 ${big} 0 ${(fa-hw).toFixed(0)},${yb} Z`;
 const poly=a=>'M'+a.map(([x,y])=>X(x).toFixed(0)+','+Y(y).toFixed(0)).join(' L')+' Z';
 const win=(B.w.length?`<path d="${poly(B.w)}" fill="${SC.win}" stroke="${SC.win}" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`:'')+(B.ws?`<path d="${poly(B.ws)}" fill="${SC.win}" stroke="${SC.line}" stroke-width="1.4" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`:'');
 const wheel=x=>`<circle cx="${x.toFixed(0)}" cy="${(H-R).toFixed(0)}" r="${R.toFixed(0)}" fill="${SC.tire}"/><circle cx="${x.toFixed(0)}" cy="${(H-R).toFixed(0)}" r="${(R*.62).toFixed(0)}" fill="${SC.rim}"/><circle cx="${x.toFixed(0)}" cy="${(H-R).toFixed(0)}" r="${(R*.16).toFixed(0)}" fill="${SC.hub}"/>`;
 return `<svg viewBox="0 0 ${L} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" fill="${SC.body}" stroke="${SC.line}" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>${win}${wheel(fa)}${wheel(ra)}</svg>`}
function silEnd(c,rear){const Wm=c.Wm,W=c.W,H=c.H,cx=Wm/2,bw=W/2,B=BP[c.body]||BP.sedan,gc=B.gc,belt=(c.body==='suv'||c.body==='mpv'||c.body==='van'?.6:.56)*H;
 const topW=(c.body==='van'?.9:c.body==='cabrio'?.7:.68)*W,ty=H-H, y0=H-gc*.55;
 const body=`M${cx-bw},${y0} L${cx-bw},${H-belt+60} Q${cx-bw},${H-belt} ${cx-bw+90},${H-belt-20} L${cx+bw-90},${H-belt-20} Q${cx+bw},${H-belt} ${cx+bw},${H-belt+60} L${cx+bw},${y0} Z`;
 const gh=c.body==='cabrio'?`M${cx-bw*.86},${H-belt-10} L${cx-topW/2},${H*.04} L${cx+topW/2},${H*.04} L${cx+bw*.86},${H-belt-10} Z`:`M${cx-bw*.9},${H-belt-10} Q${cx-topW/2-30},${ty+40} ${cx-topW/2+60},${ty} L${cx+topW/2-60},${ty} Q${cx+topW/2+30},${ty+40} ${cx+bw*.9},${H-belt-10} Z`;
 const glass=c.body==='cabrio'?`<path d="M${cx-bw*.78},${H-belt-30} L${cx-topW/2+30},${H*.08} L${cx+topW/2-30},${H*.08} L${cx+bw*.78},${H-belt-30} Z" fill="${SC.win}" opacity=".7"/>`:`<path d="M${cx-bw*.78},${H-belt-40} L${cx-topW/2+40},${ty+H*.1} L${cx+topW/2-40},${ty+H*.1} L${cx+bw*.78},${H-belt-40} Z" fill="${SC.win}" stroke="${SC.win}" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`;
 const my=H-belt-60,mir=`<path d="M${cx-bw},${my} L${cx-Wm/2},${my-40} L${cx-Wm/2+20},${my+90} L${cx-bw},${my+110} Z M${cx+bw},${my} L${cx+Wm/2},${my-40} L${cx+Wm/2-20},${my+90} L${cx+bw},${my+110} Z" fill="${SC.body}" stroke="${SC.line}" stroke-width="1.4" vector-effect="non-scaling-stroke"/>`;
 const tw=W*.13,tire=`<rect x="${cx-bw+40}" y="${H-gc-120}" width="${tw}" height="${gc+120}" rx="40" fill="${SC.tire}"/><rect x="${cx+bw-40-tw}" y="${H-gc-120}" width="${tw}" height="${gc+120}" rx="40" fill="${SC.tire}"/>`;
 const ly=H-belt*.78,lamp=rear?'#C55A63':'#F4F6F8',lamps=`<rect x="${cx-bw+70}" y="${ly}" width="${W*.2}" height="${H*.06}" rx="30" fill="${lamp}" stroke="${SC.line}" stroke-width="1.2" vector-effect="non-scaling-stroke"/><rect x="${cx+bw-70-W*.2}" y="${ly}" width="${W*.2}" height="${H*.06}" rx="30" fill="${lamp}" stroke="${SC.line}" stroke-width="1.2" vector-effect="non-scaling-stroke"/>`;
 const mid=rear?`<rect x="${cx-W*.13}" y="${H-belt*.62}" width="${W*.26}" height="${H*.07}" rx="14" fill="#fff" stroke="${SC.line}" stroke-width="1.2" vector-effect="non-scaling-stroke"/>`:`<rect x="${cx-W*.17}" y="${H-belt*.7}" width="${W*.34}" height="${H*.12}" rx="40" fill="#4A515C"/>`;
 return `<svg viewBox="0 0 ${Wm} ${H}" preserveAspectRatio="none" aria-hidden="true">${tire}<path d="${gh}" fill="${SC.body}" stroke="${SC.line}" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>${glass}<path d="${body}" fill="${SC.body}" stroke="${SC.line}" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>${mir}${lamps}${mid}</svg>`}
function sil(c,v){return v==='side'?silSide(c):silEnd(c,v==='rear')}


// Saját fotók: public/osszehasonlito/<slug>/{side,front,rear}.(webp|png|jpg) — szorosan az autóra vágva, átlátszó háttérrel.
// Oldalnézetben a kép szélessége = az autó hossza, elöl/hátul a kép magassága = az autó magassága.
const PH={};
function photo(c,v){const u=PHOTOS[c.slug]&&PHOTOS[c.slug][v];if(!u)return null;const p=PH[u];if(p&&p.w)return p;
 if(!p){const im=new Image();PH[u]={src:u};im.onload=()=>{PH[u]={src:u,w:im.naturalWidth,h:im.naturalHeight};render()};im.src=u}return null}
const $=s=>document.querySelector(s);const by=s=>CARS.find(c=>c.slug===s);
const fmtM=mm=>(mm/1000).toFixed(3).replace('.',',')+' m';const ft=n=>n?n.toLocaleString('hu-HU').replace(/,/g,' ')+' Ft/hó':'Ár kérésre';
const cm=d=>(Math.abs(d)/10).toLocaleString('hu-HU',{maximumFractionDigits:1})+' cm';
let view='side',align='r';
const AL=[['fa','Első tengely'],['ab','Tengelytáv'],['ra','Hátsó tengely'],['f','Eleje'],['c','Közepe'],['r','Hátulja']];
function icon(m,on){const S={L:40,fa:8.5,ra:31.5},G={L:52,fa:10.5,ra:41.5};const an=c=>({f:0,r:c.L,c:c.L/2,fa:c.fa,ra:c.ra,ab:(c.fa+c.ra)/2})[m];
 let s0=-an(S),g0=-an(G);const mn=Math.min(s0,g0),mx=Math.max(s0+S.L,g0+G.L),off=40-(mn+mx)/2;s0+=off;g0+=off;
 const car=(x,L,col,h)=>`<path d="M${x} 31 L${x} 24 Q${x} 20 ${x+L*.12} 19 L${x+L*.27} ${19-h} Q${x+L*.33} ${16-h} ${x+L*.42} ${16-h} L${x+L*.8} ${16-h} Q${x+L*.92} ${17-h} ${x+L*.97} 21 L${x+L} 24 L${x+L} 31 Z" fill="${col}"/><circle cx="${x+L*(L>45?G.fa/G.L:S.fa/S.L)}" cy="31" r="4.2" fill="${col}" stroke="#F1F2F4" stroke-width="1.6"/><circle cx="${x+L*(L>45?G.ra/G.L:S.ra/S.L)}" cy="31" r="4.2" fill="${col}" stroke="#F1F2F4" stroke-width="1.6"/>`;
 const ink=on?'#0B0B0D':'#8A919B';const ghost=on?'#B9BEC6':'#D3D6DB';
 const ln=x=>`<path d="M${x} 33 V46" stroke="${ink}" stroke-width="1.8"/>`;
 const arL=x=>`<path d="M${x+12} 40 H${x+2.5} M${x+6.5} 36.5 L${x+2.5} 40 L${x+6.5} 43.5" stroke="${ink}" stroke-width="1.8" fill="none"/>`;
 const arR=x=>`<path d="M${x-12} 40 H${x-2.5} M${x-6.5} 36.5 L${x-2.5} 40 L${x-6.5} 43.5" stroke="${ink}" stroke-width="1.8" fill="none"/>`;
 let mk='';const X=off;
 if(m==='f'||m==='fa')mk=ln(X)+arL(X);else if(m==='r'||m==='ra')mk=ln(X)+arR(X);else if(m==='c')mk=ln(X)+arR(X)+arL(X);
 else{const f=s0+S.fa,r=s0+S.ra;mk=ln(f)+arL(f)+ln(r)+arR(r)}
 return `<svg viewBox="0 0 80 48">${car(g0,G.L,ghost,2)}${car(s0,S.L,on?'#0B0B0D':'#A3A8B0',0)}${mk}</svg>`}
function drawAlign(){$('#align').innerHTML=AL.map(([m,l])=>`<button data-a="${m}" class="${m===align?'on':''}" title="Igazítás: ${l}" aria-label="Igazítás: ${l}">${icon(m,m===align)}<span>${l}</span></button>`).join('');$('#align').classList.toggle('off',view!=='side')}

function fill(sel){const g={};CARS.forEach(c=>{const b=c.name.split(' ')[0];(g[b]=g[b]||[]).push(c)});sel.innerHTML=Object.keys(g).map(b=>`<optgroup label="${b}">`+g[b].map(c=>`<option value="${c.slug}">${c.name}</option>`).join('')+'</optgroup>').join('')}
fill($('#s1'));fill($('#s2'));
const q=new URLSearchParams(location.search);$('#s1').value=q.get('a')||'bmw-x3';$('#s2').value=q.get('b')||'mercedes-benz-glc';
function kids(c){return c.three||c.seatsOpt>=7?3:c.isofix>=2?2:1}
function render(){const a=by($('#s1').value),b=by($('#s2').value);
 try{history.replaceState(null,'','?a='+a.slug+'&b='+b.slug)}catch(e){}
 const st=$('#stage');const side=view==='side';
 const W=st.clientWidth,mob=W<760;
 const bandH=mob?38:44,gap=6,lab=mob?64:96;
 const mL=Math.max(a.L,b.L),mH=Math.max(a.H,b.H),mWm=Math.max(a.Wm,b.Wm);
 const bandsH=side?2*bandH+gap+16:bandH+16;
 let k=side?W*0.78/mL:W*(mob?0.46:0.43)/mWm, H;
 if(mob){H=Math.round(lab+mH*k*1.06+bandsH)}
 else{H=Math.round(W/2.05);k=Math.min(k,(H-bandsH-lab)/mH)}
 st.style.height=H+'px';
 const floor=H-bandsH;
 const rs=$('#stage .croom');rs.style.height=(floor*425/365)+'px';rs.style.bottom='auto';
 let html='';
 const ax=c=>{const fa=(c.L-c.WB)*0.46;return {fa,ra:fa+c.WB}};const anc=c=>{const {fa,ra}=ax(c);return ({f:0,r:c.L,c:c.L/2,fa,ra,ab:(fa+ra)/2})[align]};
 const pos={};
 if(side){const la0=-anc(a)*k,lb0=-anc(b)*k,mn=Math.min(la0,lb0),mx=Math.max(la0+a.L*k,lb0+b.L*k),off=W/2-(mn+mx)/2;pos.c1=la0+off;pos.c2=lb0+off;pos.x=off}
 const cx={c1:W*0.285,c2:W*0.715};
 const geo={};
 // hátsó (2.) autó előbb – oldalnézetben halvány „szellem” a háttérben, az 1. autó teljesen előtte
 [[b,'c2'],[a,'c1']].forEach(([c,cl])=>{const im=photo(c,view);let w,h,y;
  if(im){if(side){w=c.L*k;h=w*im.h/im.w}else{h=c.H*k;w=h*im.w/im.h}y=floor-h}else{w=(side?c.L:c.Wm)*k;h=c.H*k;y=floor-h}
  const x=side?pos[cl]:cx[cl]-w/2;geo[cl]={x,w};
  const alt=`${c.name} ${side?'oldalnézet':view==='front'?'elölnézet':'hátulnézet'}`;
  const ghost=side&&cl==='c2';
  html+=`<div class="ccar ${ghost?'ghost':'solid'}" style="width:${w}px;height:${h}px;top:${y}px;left:${x}px">${im?`<img src="${im.src}" alt="${alt}" loading="lazy">`:sil(c,view)}</div>`;
 });
 if(side)html+=`<div class="anc" style="left:${pos.x}px;bottom:${H-floor-6}px"></div>`;
 // magasság-vonalak és címkék (carsized-stílus: 1 balra, 2 jobbra; a különbség a magasabb autónál)
 const ta=floor-a.H*k,tb=floor-b.H*k,dh=a.H-b.H,lw=W*(mob?0.36:0.27);
 html+=`<div class="hl r" style="left:0;width:${lw}px;top:${ta}px"></div><div class="hl b" style="right:0;width:${lw}px;top:${tb}px"></div>`;
 html+=`<div class="hlab r" style="left:0;top:${mob?ta-(dh>0?50:27):ta+5}px"><div class="hrow"><span class="cnum n1">1</span><span class="v">${fmtM(a.H)}</span><span class="t">Magasság</span></div>${dh>0?`<div class="hrow"><span class="d">+ ${cm(dh)}</span></div>`:''}</div>`;
 html+=`<div class="hlab b" style="right:0;top:${mob?tb-(dh<0?50:27):tb+5}px"><div class="hrow"><span class="t">Magasság</span><span class="v">${fmtM(b.H)}</span><span class="cnum n2">2</span></div>${dh<0?`<div class="hrow"><span class="d">+ ${cm(dh)}</span></div>`:''}</div>`;
 // hossz / szélesség sávok
 const la=side?a.L:a.W,lb=side?b.L:b.W,lbl=side?'Hossz':'Szélesség';
 const band=(cl,c,val,other,x,y)=>{const n=cl==='c1'?1:2;const w=val*k;return `<div class="band ${cl==='c1'?'r':'b'}" style="left:${x}px;width:${w}px;top:${y}px;height:${bandH}px"><span class="bl">${val>other?`<span class="d">+ ${cm(val-other)}</span>`:''}<span class="cnum n${n}">${n}</span><span class="v">${fmtM(val)}</span><span class="t">${lbl}</span></span></div>`};
 if(side){html+=band('c2',b,lb,la,pos.c2,floor+12)+band('c1',a,la,lb,pos.c1,floor+12+bandH+gap)}
 else{html+=band('c1',a,la,lb,cx.c1-la*k/2,floor+12)+band('c2',b,lb,la,cx.c2-lb*k/2,floor+12)}
 $('#note').innerHTML=side?'Valós arányban, azonos léptékben: az <b style="color:var(--red)">1-es</b> autó elöl, a <b style="color:var(--navy)">2-es</b> halványan mögötte. A „⇄ Csere” gombbal felcserélheted őket.':'Valós arányban, azonos léptékben, egymás mellett.';
 $('#cars').innerHTML=html;
 // tábla
 const rows=[['Havidíj (tartós bérlet)',a.price,b.price,ft,-1],['Hossz',a.L,b.L,v=>fmtM(v),0],['Szélesség (tükör nélkül)',a.W,b.W,v=>fmtM(v),0],['Magasság',a.H,b.H,v=>fmtM(v),0],['Csomagtartó',a.trunk,b.trunk,v=>v+' l',1],['Csomagtartó lehajtott üléssel',a.trunkMax,b.trunkMax,v=>v+' l',1],['Ülések',a.seatsOpt,b.seatsOpt,(v,c)=>c.seats===v?v+'':c.seats+' (opció: '+v+')',1],['ISOFIX hátul',a.isofix,b.isofix,v=>v+' db',1],['Hajtás',a.fuel,b.fuel,v=>v,0],['Motor (példa)',a.trim+' · '+a.kW+' kW',b.trim+' · '+b.kW+' kW',v=>v,0],['Fordulókör',a.turn,b.turn,v=>v.toFixed(1).replace('.',',')+' m',-1]];
 $('#tbl').innerHTML=`<tr><th></th><th><span class="cnum n1">1</span> ${a.name}</th><th><span class="cnum n2">2</span> ${b.name}</th></tr>`+rows.map(([l,x,y,f,dir])=>{const wa=dir&&x!==y&&(dir>0?x>y:x<y),wb=dir&&x!==y&&!wa;return `<tr><td>${l}</td><td class="v ${wa?'win':''}">${f(x,a)}${wa?'<span class="w">✓</span>':''}</td><td class="v ${wb?'win':''}">${f(y,b)}${wb?'<span class="w">✓</span>':''}</td></tr>`}).join('');
calc();
 $('#cards').innerHTML=[a,b].map((c,i)=>{const kd=kids(c),suits=Math.max(1,Math.floor(c.trunk/50));
  return `<div class="ccard k${i+1}"><h3><span class="cnum n${i+1}">${i+1}</span>${c.name}</h3><div class="pr">${c.price?'Tartós bérlet '+ft(c.price)+'-tól':'Tartós bérlet – ár kérésre'}</div>
  <div class="cbadges"><span class="bd ${kd>=2?'':'no'}">2 gyerekülés</span><span class="bd ${kd>=3?'':'no'}">3 gyerekülés</span><span class="bd ${c.seatsOpt>=7?'':'no'}">7+ ülés</span><span class="bd ${c.trunk>=450?'':'no'}">Babakocsi + bevásárlás</span><span class="bd i">${c.fuel}</span></div>
  <div class="csmall">Csomagtartó: <b>${c.trunk} l</b> ≈ ${suits} kabinbőrönd (becslés)</div><div class="trunk">${'<span class="suit"></span>'.repeat(Math.min(suits,16))}</div>
  <p style="margin:16px 0 0"><a class="ccta" href="${c.href}">Részletek és bérlés →</a></p></div>`}).join('');
}
function famList(f){const L=CARS.filter(c=>f==='all'||(f==='2'&&kids(c)>=2)||(f==='3'&&c.three)||(f==='7'&&c.seatsOpt>=7)||(f==='big'&&c.trunk>=600)||(f==='ev'&&c.fuel==='elektromos'));
 $('#fl').innerHTML=L.map(c=>`<div class="fi" data-s="${c.slug}"><b>${c.name}</b><span>${c.seats}${c.seatsOpt>c.seats?'–'+c.seatsOpt:''} ülés · ${c.trunk} l · ${ft(c.price)}</span></div>`).join('')}
document.querySelectorAll('.cviews .cbtn[data-v]').forEach(b=>b.onclick=()=>{view=b.dataset.v;document.querySelectorAll('.cviews .cbtn[data-v]').forEach(x=>x.classList.toggle('on',x===b));drawAlign();render()});
document.querySelectorAll('#flt .cbtn').forEach(b=>b.onclick=()=>{document.querySelectorAll('#flt .cbtn').forEach(x=>x.classList.toggle('on',x===b));famList(b.dataset.f)});
$('#fl').onclick=e=>{const it=e.target.closest('.fi');if(!it)return;$('#s2').value=$('#s1').value;$('#s1').value=it.dataset.s;render();$('#stage').scrollIntoView({behavior:'smooth',block:'center'})};
$('#swap').onclick=()=>{const t=$('#s1').value;$('#s1').value=$('#s2').value;$('#s2').value=t;render()};
$('#s1').onchange=$('#s2').onchange=render;addEventListener('resize',render);

const F=n=>Math.round(n).toLocaleString('hu-HU').replace(/,/g,' ');
let pe=115;
const fuelPrice={b:605,d:681,src:'NAV hivatalos üzemanyagár, 2026. október – havonta automatikusan frissül'};
function calc(){const a=by($('#s1').value),b=by($('#s2').value);const km=+$('#km').value;$('#kmv').textContent=F(km)+' km';
 const pb=+$('#pb').value||fuelPrice.b,pd=+$('#pd').value||fuelPrice.d;$('#fb').textContent=F(pb)+' Ft/l';$('#fd').textContent=F(pd)+' Ft/l';$('#fe').textContent=F(pe)+' Ft/kWh';
 const one=c=>{const ev=c.fuel==='elektromos',d=c.fuel==='dízel',pr=ev?pe:d?pd:pb,cons=c.cons*1.15,q=cons/100*km,en=q*pr;return {c,ev,cons,q,en,tot:c.price+en}};
 const A=one(a),B=one(b),np=!a.price||!b.price;
 const best=(x,y)=>x<y?'<span class="best">kedvezőbb</span>':'';
 const row=(l,x,y,cls='')=>`<tr class="${cls}"><td>${l}</td><td class="v k1">${x}</td><td class="v k2">${y}</td></tr>`;
 const en=r=>`${F(r.en)} Ft<span class="sub">${(r.cons).toFixed(1).replace('.',',')} ${r.ev?'kWh':'l'}/100 km · ${F(r.q)} ${r.ev?'kWh':'l'}/hó</span>`;
 $('#ct').innerHTML=`<tr><th></th><th class="c"><span class="cnum n1">1</span> ${a.name}</th><th class="c"><span class="cnum n2">2</span> ${b.name}</th></tr>`+
  (np?'':row('Bérleti díj<span class="sub">biztosítással, szervizzel, gumikkal</span>',F(a.price)+' Ft',F(b.price)+' Ft'))+
  row('Üzemanyag / áram',en(A),en(B))+
  (np?row('Üzemanyag / áram havonta',F(A.en)+' Ft'+best(A.en,B.en),F(B.en)+' Ft'+best(B.en,A.en),'tot'):row('Havonta összesen',F(A.tot)+' Ft'+best(A.tot,B.tot),F(B.tot)+' Ft'+best(B.tot,A.tot),'tot'))+
  row('Kilométerenként',F((np?A.en:A.tot)/km)+' Ft/km',F((np?B.en:B.tot)/km)+' Ft/km');
 const df=Math.round(np?A.en-B.en:A.tot-B.tot);
 $('#v-cost').innerHTML=(Math.abs(df)<1000?'Ennél a futásnál a két autó havi költsége gyakorlatilag azonos.':`Havi ${F(km)} km-rel a <b>${(df<0?a:b).name}</b> havonta <b>${F(Math.abs(df))} Ft-tal olcsóbb</b>.`);
 // garázs
 const gh=+$('#gh').value*1000,gw=+$('#gw').value*1000,gl=+$('#gl').value*1000;
 const fit=(v,okv,midv,txt)=>`<span class="fit ${v>=okv?'ok':v>=midv?'mid':'no'}">${v>=okv?'✓ '+txt[0]:v>=midv?txt[1]:txt[2]}</span>`;
 const g=c=>({h:gh-c.H,s:(gw-c.Wm)/2,l:gl-c.L});const ga=g(a),gb=g(b);
 const cm2=v=>(v>=0?'+':'')+F(v/10)+' cm';
 $('#gt').innerHTML=`<tr><th></th><th class="c"><span class="cnum n1">1</span> ${a.name}</th><th class="c"><span class="cnum n2">2</span> ${b.name}</th></tr>`+
  row('Magasság',`${cm2(ga.h)} ${fit(ga.h,50,0,['befér','épp befér','nem fér be'])}<span class="sub">${fmtM(a.H)}</span>`,`${cm2(gb.h)} ${fit(gb.h,50,0,['befér','épp befér','nem fér be'])}<span class="sub">${fmtM(b.H)}</span>`)+
  row('Hely oldalanként',`${F(ga.s/10)} cm ${fit(ga.s,350,200,['kényelmes','szűkös','nagyon szűk'])}<span class="sub">tükrökkel ${fmtM(a.Wm)}</span>`,`${F(gb.s/10)} cm ${fit(gb.s,350,200,['kényelmes','szűkös','nagyon szűk'])}<span class="sub">tükrökkel ${fmtM(b.Wm)}</span>`)+
  row('Hossz',`${cm2(ga.l)} ${fit(ga.l,300,0,['bőven','épp elfér','kilóg'])}<span class="sub">${fmtM(a.L)}</span>`,`${cm2(gb.l)} ${fit(gb.l,300,0,['bőven','épp elfér','kilóg'])}<span class="sub">${fmtM(b.L)}</span>`)+
  row('Fordulókör',a.turn.toFixed(1).replace('.',',')+' m'+best(a.turn,b.turn),b.turn.toFixed(1).replace('.',',')+' m'+best(b.turn,a.turn));
}
const segs=(id,fn)=>$(id).onclick=e=>{const btn=e.target.closest('button');if(!btn)return;$(id).querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===btn));fn(btn);calc()};
segs('#chg',b=>{pe=+b.dataset.p});
$('#fedit').onclick=()=>{$('#fed').hidden=!$('#fed').hidden};
['km','pb','pd','gh','gw','gl'].forEach(id=>{$('#'+id).addEventListener('input',calc)});
// élő oldalon: NAV-ár automatikusan (/api/uzemanyagar), helyi előnézetben a beépített érték marad
if(location.protocol.startsWith('http'))fetch('/api/uzemanyagar').then(r=>r.ok?r.json():null).then(j=>{if(!j||!j.benzin)return;fuelPrice.b=j.benzin;fuelPrice.d=j.dizel;$('#pb').value=j.benzin;$('#pd').value=j.dizel;$('#fsrc').textContent=`NAV hivatalos üzemanyagár, ${j.ev}. ${j.honap} – havonta automatikusan frissül`;calc()}).catch(()=>{});
$('#swap2').onclick=()=>$('#swap').click();
drawAlign();render();famList('all');
$('#align').onclick=e=>{const b=e.target.closest('button');if(!b)return;align=b.dataset.a;drawAlign();render()};

