// Build lépés: „Színpad” — a magyar főoldal Kínálat része görgetésre vezérelt autóbemutató.
// A szekció megáll a képernyőn, és lefelé görgetve az autók jobbról begördülnek a sötét színpad közepére,
// mögöttük óriási modellnév, balra lent az aktív autó adatai (az eredeti kártya másolata, így a gombok működnek).
// Mindhárom fülön működik (Bérelhető, Eladó, Bizományos): az autókat a meglévő körhinta adja, azt csak elrejtjük.
//  - fent végig látszanak a fülek és a márkaszűrők, a Cég/Magán kapcsoló az adatkártya fölött van;
//  - alul mini autósor (kattintásra odaugrik), számláló, nyilak; „Átugrom” gomb; a végén a „Mind a … autó” gomb.
// Képek: bérautóknál kivágott fotó (/berles-cut/<név>.webp); az eladó/bizományos autóknál a valódi fotó
// filmszerű, lekerekített „képkeretben” gördül be (lassú ráközelítéssel). Csökkentett mozgásnál nem kapcsol be.
import fs from 'node:fs';
import path from 'node:path';

const FILE = path.join('dist', 'index.html');

const CSS = '<style id="ca-stage-css">'
  + '#autoink.ca-show.ca-stg-on{overflow:clip!important}'
  + '#autoink.ca-stg-on .autok-panel .cw.cf3d{display:none!important}'
  + '#ca-stg{position:relative;margin-top:4px}'
  + '#autoink.ca-stg-on .autok-panel.on .autok-more{display:flex!important;justify-content:center;margin:34px 0 10px!important}'
  + '#ca-stg .stg-pin{position:sticky;top:0;height:100vh;height:100svh;overflow:hidden}'
  // felső sáv: fülek + márkák (az eredeti elemek, áthelyezve)
  + '#ca-stg .stg-top{position:absolute;left:0;right:0;top:96px;z-index:5}'
  + '#ca-stg .stg-top .autok-head{margin:0!important}'
  // háttér: óriási körvonalas modellnév, fénykúp, piros padlófény
  + '#ca-stg .stg-bgname{position:absolute;left:-10%;right:-10%;top:25vh;text-align:center;white-space:nowrap;font-weight:800;letter-spacing:-.045em;line-height:.9;'
  + 'font-size:clamp(80px,15vw,240px);color:transparent;-webkit-text-stroke:1.2px rgba(255,255,255,.13);will-change:transform;transition:opacity .35s;pointer-events:none}'
  + '#ca-stg .stg-bgname.sw{opacity:0}'
  + '#ca-stg .stg-light{position:absolute;left:30%;right:-5%;top:0;height:80vh;pointer-events:none;background:radial-gradient(ellipse 50% 60% at 50% 35%,rgba(255,255,255,.08),transparent 70%)}'
  + '#ca-stg .stg-floor{position:absolute;left:28%;right:-2%;bottom:15vh;height:22vh;pointer-events:none;background:radial-gradient(ellipse 50% 45% at 50% 60%,rgba(226,0,26,.42),transparent 72%)}'
  + '#ca-stg .stg-floor::after{content:"";position:absolute;left:8%;right:8%;top:60%;height:1px;background:linear-gradient(90deg,transparent,rgba(255,60,75,.85),transparent);box-shadow:0 0 18px rgba(226,0,26,.7)}'
  // autók
  + '#ca-stg .stg-cars{position:absolute;left:33%;right:2%;top:31vh;bottom:23vh}'
  + '#ca-stg .stg-car{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;will-change:transform,opacity,filter;opacity:0}'
  + '#ca-stg .stg-car img{display:block;max-width:92%;max-height:100%;width:auto;height:auto;object-fit:contain;'
  + 'filter:drop-shadow(0 28px 22px rgba(0,0,0,.75));-webkit-box-reflect:below 2px linear-gradient(transparent 78%,rgba(255,255,255,.13))}'
  + '#ca-stg .stg-car.stg-nocut img{max-height:90%;border-radius:22px;-webkit-box-reflect:none;filter:drop-shadow(0 24px 40px rgba(0,0,0,.6))}'
  // valódi fotó (eladó/bizományos): filmszerű képkeret, sötét széllel, lassú ráközelítéssel
  + '#ca-stg .stg-vig{position:absolute;inset:0;pointer-events:none}'
  + '#ca-stg .stg-bgl{position:absolute;inset:0;z-index:0;overflow:hidden}'
  + '#ca-stg .stg-bgl .stg-car{inset:0;display:flex;align-items:center;justify-content:center;padding:13vh 1% 8vh 31%;box-sizing:border-box}'
  + '#ca-stg .stg-bgl .stg-car img.stg-main{position:relative;width:auto;height:auto;max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 30px 60px rgba(0,0,0,.6));-webkit-box-reflect:none;'
  + '-webkit-mask-image:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent),linear-gradient(180deg,transparent,#000 12%,#000 88%,transparent);-webkit-mask-composite:source-in;mask-image:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent),linear-gradient(180deg,transparent,#000 12%,#000 88%,transparent);mask-composite:intersect}'
  + '#ca-stg .stg-shade{position:absolute;inset:0;z-index:0;pointer-events:none;opacity:0;transition:opacity .4s}'
  + '#ca-stg.ph-mode .stg-shade{opacity:1}#ca-stg.ph-mode :is(.stg-floor,.stg-light,.stg-bgname){display:none}'
  // adatkártya (az eredeti kártya másolata, fotó nélkül) + Cég/Magán kapcsoló fölötte
  + '#ca-stg .stg-side{position:absolute;left:0;bottom:6vh;width:min(380px,30%);display:flex;flex-direction:column;gap:12px}'
  + '#ca-stg .stg-side .ca-bt{align-self:flex-start;margin:0!important}'
  + '#ca-stg .stg-title{display:flex;flex-direction:column;gap:8px;margin-bottom:10px}'
  + '#ca-stg .stg-brand{font-size:13px;font-weight:800;letter-spacing:.24em;text-transform:uppercase;color:#ff3b4e}'
  + '#ca-stg .stg-model{font-size:clamp(34px,3.6vw,58px);font-weight:800;line-height:.98;letter-spacing:-.035em;color:#fff;text-wrap:balance}'
  + '#ca-stg .stg-spec{font-size:15px;color:rgba(255,255,255,.6)}'
  + '#ca-stg .stg-title>span{transition:opacity .35s,transform .45s cubic-bezier(.2,.8,.2,1)}#ca-stg .stg-title.sw>span{opacity:0;transform:translateY(14px)}'
  + '#ca-stg .stg-title.lg .stg-model{font-size:clamp(28px,2.6vw,42px)}#ca-stg .stg-title.sw .stg-model{transition-delay:.04s}#ca-stg .stg-title.sw .stg-spec{transition-delay:.08s}'
  + '#ca-stg .stg-card :is(.sub-title,.sub-specs,.title,.specs){display:none!important}'
  + '#ca-stg .stg-bgname{display:none!important}'
  + '#ca-stg .stg-info{position:relative}'
  + '#ca-stg .stg-card{position:absolute!important;left:0;right:0;bottom:0;opacity:0;transform:translateY(26px);transition:opacity .45s,transform .55s cubic-bezier(.2,.8,.2,1);pointer-events:none;margin:0!important}'
  + '#ca-stg .stg-card.on{position:relative!important;opacity:1;transform:none;pointer-events:auto}'
  + '#ca-stg .stg-card :is(.sub-media,.media,.biz-choose,.biz-total){display:none!important}'
  + '#ca-stg .stg-card .sub-btn{background:#E2001A!important;color:#fff!important;border:0!important;box-shadow:0 10px 30px rgba(226,0,26,.45)!important}'
  + 'html #autoink #ca-stg .stg-card .sub-actions .ca-row{display:flex!important;gap:10px;align-items:stretch}'
  + 'html #autoink #ca-stg .stg-card .ca-row .ca-row{flex:1;width:100%}'
  + 'html #autoink #ca-stg .stg-card .ca-row a{flex:1;display:inline-flex!important;align-items:center;justify-content:center;gap:6px;padding:0 16px;min-height:44px;border-radius:12px;font-weight:700;font-size:14px;text-decoration:none;color:#fff!important;'
  + 'background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.05))!important;border:1px solid rgba(255,255,255,.2)!important;box-shadow:inset 1px 1px 1px rgba(255,255,255,.3)!important}'
    + '#ca-stg .stg-card .sub-actions{display:flex!important;flex-direction:column;gap:10px}'
  // eladó/bizományos kártya a sötét színpadon
  + '#ca-stg .stg-card::after{display:none!important}#ca-stg .stg-card.card{display:block;border-radius:22px;overflow:hidden;color:#fff;background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.03) 30%,rgba(255,255,255,.02)),#15171c!important;'
  + 'border:1px solid rgba(255,255,255,.14)!important;box-shadow:inset 1.5px 1.5px 1px rgba(255,255,255,.22),0 24px 60px rgba(0,0,0,.5)!important}'
  + '#ca-stg .stg-card.card a,#ca-stg .stg-card.card a *{text-decoration:none!important}'
  + '#ca-stg .stg-card.card :is(.ca-reszlet,.cbtn){background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.05))!important;border:1px solid rgba(255,255,255,.2)!important;color:#fff!important;box-shadow:inset 1px 1px 1px rgba(255,255,255,.3)!important}'
  + '#ca-stg .stg-card.card .ca-inq{background:#E2001A!important;color:#fff!important;border:0!important;box-shadow:0 10px 30px rgba(226,0,26,.45)!important}'
+ '#ca-stg .stg-card.card :is(.title,.price){color:#fff!important}#ca-stg .stg-card.card :is(.specs,.peur,.meta){color:rgba(255,255,255,.6)!important}'
  // alsó sáv: nyilak, mini autósor, számláló
  + '#ca-stg .stg-nav{position:absolute;left:33%;right:190px;bottom:3.5vh;display:flex;align-items:center;justify-content:center;gap:12px;color:#fff;font-weight:700;font-variant-numeric:tabular-nums}'
  + '#ca-stg .stg-thumbs{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;max-width:100%;padding:4px}#ca-stg .stg-thumbs::-webkit-scrollbar{display:none}'
  + '#ca-stg .stg-th{flex:0 0 auto;width:74px;height:46px;border-radius:12px;cursor:pointer;padding:4px;display:flex;align-items:center;justify-content:center;opacity:.55;'
  + 'background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.14);transition:opacity .25s,transform .25s,border-color .25s,box-shadow .25s}'
  + '#ca-stg .stg-th img{max-width:100%;max-height:100%;object-fit:contain;display:block}#ca-stg .stg-th.ph img{width:100%;height:100%;object-fit:cover;border-radius:8px}'
  + '#ca-stg .stg-th:hover{opacity:.9;transform:translateY(-2px)}'
  + '#ca-stg .stg-th.on{opacity:1;border-color:rgba(255,90,100,.8);box-shadow:0 0 0 2px rgba(226,0,26,.3),0 6px 18px rgba(226,0,26,.35)}'
  + '#ca-stg .stg-cnt{font-size:14px;letter-spacing:.06em;min-width:60px;text-align:center}#ca-stg .stg-cnt b{font-size:20px}'
  + '#ca-stg .stg-nav button.stg-ar{flex:0 0 auto;width:44px;height:44px;border-radius:50%;cursor:pointer;color:#fff;font-size:18px;border:1px solid rgba(255,255,255,.2);'
  + 'background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.04));box-shadow:inset 1px 1px 1px rgba(255,255,255,.3);transition:background .2s,transform .2s}'
  + '#ca-stg .stg-nav button.stg-ar:hover{background:rgba(255,255,255,.22);transform:translateY(-2px)}'
  + '#ca-stg .stg-bar{position:absolute;left:33%;right:190px;bottom:1.4vh;height:2px;background:rgba(255,255,255,.1);border-radius:2px;overflow:hidden}'
  + '#ca-stg .stg-bar i{position:absolute;left:0;top:0;bottom:0;width:0;background:#E2001A;box-shadow:0 0 10px rgba(226,0,26,.9)}'
  + '#ca-stg .stg-skip{position:absolute;right:0;top:calc(96px + 62px);z-index:5;font-size:12.5px;font-weight:700;letter-spacing:.06em;color:rgba(255,255,255,.6);background:none;border:0;cursor:pointer;padding:8px 4px}'
  + '#ca-stg .stg-skip:hover{color:#fff}'
  // telefon
  + '@media(max-width:820px){#ca-stg .stg-bgl .stg-car{padding:14vh 3% 46vh;-webkit-mask-image:linear-gradient(180deg,#000 80%,transparent);mask-image:linear-gradient(180deg,#000 80%,transparent)}#ca-stg .stg-top{top:84px;overflow-x:auto}#ca-stg .stg-top .autok-head{flex-wrap:nowrap}'
  + '#ca-stg .stg-cars{left:0;right:0;top:27vh;bottom:50vh}#ca-stg .stg-floor{left:-10%;right:-10%;bottom:47vh}#ca-stg .stg-light{left:0}'
  + '#ca-stg .stg-bgname{top:24vh;font-size:clamp(60px,20vw,130px)}#ca-stg .stg-side{width:auto;right:0;bottom:11vh}'
  + '#ca-stg .stg-nav{left:0;right:0;bottom:2.5vh}#ca-stg .stg-bar{left:0;right:0;bottom:1vh}#ca-stg .stg-th{width:56px;height:38px}#ca-stg .stg-ar,#ca-stg .stg-cnt{display:none!important}#ca-stg .stg-skip{top:auto;bottom:calc(11vh - 34px)}}'
  + '</style>';

const JS = '<script id="ca-stage-js">(function(){'
  + 'if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;'
  + 'var S,stg,bgl,cars,infos,bg,cnt,bar,ths,n=0,items=[],act=-1,sig="",raf=0;'
  + 'function cut(src){var m=src&&src.match(/\\/berles\\/([^\\/?#]+)\\.webp/);return m?"/berles-cut/"+m[1]+".webp":null}'
  + 'function panel(){return S.querySelector(".autok-panel.on")||S.querySelector(".autok-panel")}'
  + 'function cardsOf(p){var c=p&&p.querySelector(".cw.cf3d");return c?[].slice.call(c.querySelectorAll(".cw-item")).map(function(it){return it.querySelector(".sub-card,.card")}).filter(Boolean):[]}'
  + 'function txt(k,s){var e=k.querySelector(s);return e?e.textContent.trim():""}'
  + 'function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}'
  + 'function shell(){stg=el("div");stg.id="ca-stg";'
  + 'stg.innerHTML=\'<div class="stg-pin"><div class="stg-bgl"></div><div class="stg-shade"></div><div class="stg-light"></div><div class="stg-bgname"></div><div class="stg-floor"></div><div class="stg-cars"></div>'
  + '<div class="stg-top"></div><button type="button" class="stg-skip">Átugrom ↓</button><div class="stg-side"><div class="stg-title"><span class="stg-brand"></span><span class="stg-model"></span><span class="stg-spec"></span></div><div class="stg-info"></div></div>'
  + '<div class="stg-nav"><button type="button" class="stg-ar stg-p" aria-label="Előző autó">←</button><div class="stg-thumbs"></div><span class="stg-cnt"></span><button type="button" class="stg-ar stg-n" aria-label="Következő autó">→</button></div><div class="stg-bar"><i></i></div></div>\';'
  + 'bgl=stg.querySelector(".stg-bgl");var sh=stg.querySelector(".stg-shade");sh.style.background="linear-gradient(180deg,rgba(11,12,15,.8) 0%,rgba(11,12,15,0) 24%,rgba(11,12,15,0) 76%,rgba(11,12,15,.88) 100%)";cars=stg.querySelector(".stg-cars");infos=stg.querySelector(".stg-info");bg=stg.querySelector(".stg-bgname");cnt=stg.querySelector(".stg-cnt");bar=stg.querySelector(".stg-bar i");ths=stg.querySelector(".stg-thumbs");'
  + 'stg.querySelector(".stg-p").onclick=function(){go(act-1)};stg.querySelector(".stg-n").onclick=function(){go(act+1)};'
  + 'stg.querySelector(".stg-skip").onclick=function(){var r=stg.getBoundingClientRect();scrollTo({top:scrollY+r.bottom-innerHeight*.35,behavior:"smooth"})};'
  // a fülek + márkák fent, a Cég/Magán kapcsoló az adatkártya fölött (az eredeti elemek, a működésük megmarad)
  + 'var hd=S.querySelector(".autok-head");if(hd)stg.querySelector(".stg-top").appendChild(hd);'
  + 'var bt=S.querySelector(".ca-sh .ca-bt");if(bt){var sd=stg.querySelector(".stg-side"),cp=bt.cloneNode(true);sd.insertBefore(cp,sd.querySelector(".stg-info"));'
  + 'var sync=function(){cp.innerHTML=bt.innerHTML};cp.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;var v=b.getAttribute("data-bt"),o=v&&bt.querySelector("[data-bt=\\""+v+"\\"]");if(o)o.click();setTimeout(sync,60)});'
  + 'new MutationObserver(sync).observe(bt,{subtree:true,attributes:true,childList:true})}'
  + 'S.classList.add("ca-stg-on")}'
  + 'function place(p){if(!stg||!p)return;var c=p.querySelector(".cw.cf3d");if(stg.parentNode!==p){if(c)p.insertBefore(stg,c.nextSibling);else p.insertBefore(stg,p.firstChild)}}'
  + 'function build(){var p=panel();place(p);var cs=cardsOf(p);if(!cs.length)return;'
  + 'var g=(p?p.id:"")+"#"+cs.map(function(k){return txt(k,".sub-title,.title")+txt(k,".ca-pv,.price")}).join("|");if(g===sig)return;sig=g;'
  + 'if(!stg){shell();place(p)}cars.innerHTML="";bgl.innerHTML="";var anyPh=false;infos.innerHTML="";ths.innerHTML="";'
  + 'items=cs.map(function(k,j){var im=k.querySelector(".sub-photo,.media img"),src=im?(im.getAttribute("src")||im.currentSrc||""):"",u=cut(src),ph=!u&&!/\\/berles\\//.test(src);'
  + 'var f=el("div","stg-car"+(ph?" stg-photo":u?"":" stg-nocut")),i=new Image();i.alt=im?im.alt:"";i.decoding="async";i.referrerPolicy="no-referrer";i.src=u||src;'
  + 'if(u)i.onerror=function(){i.onerror=null;f.classList.add("stg-nocut");i.src=src};if(ph)i.className="stg-main";f.appendChild(i);(ph?bgl:cars).appendChild(f);if(ph)anyPh=true;'
  + 'if(ph){var vg=el("div","stg-vig");vg.style.background="radial-gradient(ellipse 80% 75% at 50% 45%,rgba(8,9,12,0) 55%,rgba(8,9,12,.55)),linear-gradient(180deg,rgba(8,9,12,0) 65%,rgba(8,9,12,.45))";f.appendChild(vg)}'
  + 'var d=k.cloneNode(true);d.removeAttribute("style");'
  + ''
  + 'd.classList.add("stg-card");infos.appendChild(d);'
  + 'var t=el("button","stg-th"+(ph?" ph":""));t.type="button";t.setAttribute("aria-label",txt(k,".sub-title,.title"));var ti=new Image();ti.alt="";ti.loading="lazy";ti.referrerPolicy="no-referrer";ti.src=u||src;'
  + 'if(u)ti.onerror=function(){ti.onerror=null;ti.src=src};t.appendChild(ti);t.onclick=function(){go(j)};ths.appendChild(t);'
  + 'var nm=txt(k,".sub-title,.title").split("/")[0].trim(),bm=nm.match(/^(Mercedes-Benz|Land Rover|Range Rover|Alfa Romeo|Aston Martin|\\S+)\\s+(.*)$/)||[0,"",nm],mw=bm[2].split(/\\s+/);return{f:f,d:d,t:t,ph:ph,name:nm,brand:bm[1],model:mw.slice(0,3).join(" "),spec:txt(k,".sub-specs,.specs")}});stg.classList.toggle("ph-mode",anyPh);'
  + 'n=items.length;stg.style.height=(n*68+70)+"vh";act=-1;tick()}'
  + 'function geo(){var r=stg.getBoundingClientRect();return{r:r,tot:Math.max(1,r.height-innerHeight)}}'
  + 'function go(i){if(!stg||!n)return;i=Math.max(0,Math.min(n-1,i));var g=geo(),top=scrollY+g.r.top;scrollTo({top:top+(n>1?i/(n-1):0)*g.tot+2,behavior:"smooth"})}'
  + 'function ease(a){var e=a<=.12?0:Math.min((a-.12)/.5,1);return e*e*(3-2*e)}'
  + 'function short(s){s=s.replace(/^(BMW|Audi|Mercedes-Benz|Mercedes|MINI|Hyundai|Kia|CUPRA|Cupra|Volkswagen|VW|MAN|Volvo|SEAT|Seat|Land Rover|Range Rover|Porsche|Ford|Toyota|Opel|Skoda|Škoda|Renault|Peugeot|Tesla)\\s+/i,"");var w=s.split(/\\s+/);return w.slice(0,w.length>2?2:w.length).join(" ")}'
  + 'function tick(){raf=0;if(!stg||!n)return;var g=geo(),p=Math.min(Math.max(-g.r.top/g.tot,0),1)*(n-1);'
  + 'for(var i=0;i<n;i++){var t=i-p,a=Math.abs(t),s=t<0?-1:1,e=ease(a),f=items[i].f;'
  + 'if(a>1.6){f.style.opacity=0;continue}'
  + 'if(items[i].ph){var o=1-Math.min(1,a*1.6);f.style.opacity=Math.max(0,o).toFixed(3);f.style.transform="translate3d("+(s*e*5).toFixed(2)+"vw,0,0) scale("+(1.04+e*.06).toFixed(3)+")";f.style.filter="blur("+(Math.sin(Math.PI*e)*2).toFixed(2)+"px)";continue}'
  + 'f.style.transform="translate3d("+(s*e*78).toFixed(2)+"vw,"+(e*1.5).toFixed(2)+"vh,0) scale("+(1-e*.16).toFixed(3)+") skewX("+(-s*Math.sin(Math.PI*e)*4).toFixed(2)+"deg)";'
  + 'f.style.filter="blur("+(Math.sin(Math.PI*e)*3.2).toFixed(2)+"px)";f.style.opacity=(1-Math.max(0,(e-.45)/.55)).toFixed(3)}'
  + 'var na=Math.round(p);if(na!==act){var first=act<0;act=na;items.forEach(function(it,j){var o=j===act;it.d.classList.toggle("on",o);it.t.classList.toggle("on",o);it.f.classList.toggle("on",o)});'
  + 'var at=items[act].t;if(at.scrollIntoView&&!first){var tl=at.offsetLeft-ths.clientWidth/2+at.clientWidth/2;ths.scrollTo({left:tl,behavior:"smooth"})}'
  + 'cnt.innerHTML="<b>"+String(act+1).padStart(2,"0")+"</b> / "+String(n).padStart(2,"0");var nm=short(items[act].name);'
  + 'var it=items[act],tl=stg.querySelector(".stg-title"),put=function(){tl.querySelector(".stg-brand").textContent=it.brand;tl.querySelector(".stg-model").textContent=it.model;tl.querySelector(".stg-spec").textContent=it.spec;tl.classList.toggle("lg",it.model.length>11)};if(first)put();else{tl.classList.add("sw");setTimeout(function(){put();tl.classList.remove("sw")},280)}}'
  + 'bg.style.transform="translateX("+(-(p-act)*14).toFixed(2)+"vw)";bar.style.width=(n>1?p/(n-1)*100:100)+"%"}'
  + 'function q(){if(!raf)raf=requestAnimationFrame(tick)}'
  + 'var to=0;function later(){clearTimeout(to);to=setTimeout(build,140)}'
  + 'function boot(){S=document.getElementById("autoink");if(!S||!S.querySelector(".cw.cf3d .cw-item"))return setTimeout(boot,300);build();'
  + 'new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){if(!stg||!stg.contains(ms[i].target)){later();return}}}).observe(S,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["hidden","class"]});'
  // fülváltáskor (a fülek a színpadon belül vannak): újraépítés, és vissza az első autóhoz
  + 'S.addEventListener("click",function(e){var tb=e.target.closest&&e.target.closest(".autok-tab,.cf-br");if(tb){setTimeout(function(){place(panel())},0);setTimeout(function(){sig="";build();var r=stg&&stg.getBoundingClientRect();if(r&&r.top<0)scrollTo({top:scrollY+r.top+2})},420)}});'
  + 'addEventListener("scroll",q,{passive:true});addEventListener("resize",q)}'
  + 'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot()'
  + '})();</script>';

try {
  if (!fs.existsSync(FILE)) console.log('[home-stage] nincs dist/index.html — kihagyva');
  else {
    let h = fs.readFileSync(FILE, 'utf8');
    if (h.indexOf('id="ca-stage-js"') > -1) console.log('[home-stage] már alkalmazva');
    else if (h.indexOf('id="autoink"') < 0) console.log('[home-stage] nincs #autoink — kihagyva');
    else {
      h = h.replace('</head>', CSS + '</head>').replace(/<\/body>/i, JS + '</body>');
      fs.writeFileSync(FILE, h);
      console.log('[home-stage] színpad a Kínálat részben');
    }
  }
} catch (e) { console.log('[home-stage] hiba:', e.message); }
