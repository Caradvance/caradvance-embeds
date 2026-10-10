(function(){if(window.__caBTi)return;window.__caBTi=1;
var K='ca_bt';
function get(){try{return localStorage.getItem(K)==='p'?'p':'c';}catch(e){return 'c';}}
function fmt(n){return Math.round(n).toLocaleString('hu-HU');}
function rnd(v,r){return Math.ceil(v/r)*r;}
function one(b,m){var p=m==='p';b.classList.toggle('is-p',p);
  [].forEach.call(b.querySelectorAll('[data-bt]'),function(x){var on=x.getAttribute('data-bt')===m;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on?'true':'false');});
  var t=b.querySelector('.ca-pt');if(t)t.textContent=p?'19% német áfával':'nettó';
  var e=+b.getAttribute('data-bteur')||0;if(!e)return;
  var fx=window.__caFX||+b.getAttribute('data-fx')||364,r=+b.getAttribute('data-r')||10000,eu=p?e*1.19:e;
  var v=b.querySelector('.ca-pv');if(v)v.textContent=fmt(rnd(eu*fx,r))+' Ft';
  var pe=b.querySelector('.ca-pe');if(pe)pe.textContent=fmt(eu)+' €/hó'+(p?' · bruttó':' · nettó');
  b.setAttribute('data-applied',m);}
function apply(m){window.__caBT=m;[].forEach.call(document.querySelectorAll('.ca-pbox'),function(b){one(b,m);});}
window.caSetBT=function(m){m=m==='p'?'p':'c';if(m===window.__caBT)return;try{localStorage.setItem(K,m);}catch(e){}apply(m);};
window.caBTApply=function(){apply(window.__caBT||get());};
document.addEventListener('click',function(ev){var x=ev.target&&ev.target.closest&&ev.target.closest('.ca-pbox [data-bt]');if(!x)return;ev.preventDefault();ev.stopPropagation();window.caSetBT(x.getAttribute('data-bt'));},true);
function init(){apply(get());
  try{var t=0;new MutationObserver(function(){clearTimeout(t);t=setTimeout(function(){var m=window.__caBT||get();[].forEach.call(document.querySelectorAll('.ca-pbox:not([data-applied="'+m+'"])'),function(b){one(b,m);});},30);}).observe(document.body,{childList:true,subtree:true});}catch(e){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
