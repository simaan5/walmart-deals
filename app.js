
(function(){
  'use strict';
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  var LS={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};

  /* ── cookie consent (banner only if analytics configured) ── */
  (function(){
    var b=$('#cookieBanner'); if(!b||!window.__sdAnalytics) return;
    if(LS.get('sd-consent')) return;
    b.hidden=false;
    function decide(v){LS.set('sd-consent',v); b.hidden=true;}
    var a=$('#cookieAccept'), d=$('#cookieDecline');
    if(a)a.addEventListener('click',function(){decide('granted'); if(window.__sdLoadAnalytics)window.__sdLoadAnalytics();});
    if(d)d.addEventListener('click',function(){decide('denied');});
  })();

  /* ── GA4 outbound-click events (fires only after consent loaded gtag) ── */
  document.addEventListener('click',function(e){
    var a=e.target&&e.target.closest?e.target.closest('a[href*="goto.walmart.com"],a[href*="amazon.com"]'):null;
    if(!a||!window.gtag)return;
    var m=(a.getAttribute('href')||'').match(/subId1=([^&]+)/);
    gtag('event','outbound_click',{link_domain:a.hostname||'',link_sub:m?m[1]:''});
  });

  /* ── mobile drawer ── */
  var nt=$('#navToggle'), nd=$('#navDrawer'), lastFocus=null;
  function setNav(open){
    document.body.classList.toggle('nav-open',open);
    if(nt)nt.setAttribute('aria-expanded',open?'true':'false');
    if(nd){ nd.setAttribute('aria-hidden',open?'false':'true'); if('inert' in nd) nd.inert=!open; }
    if(open){lastFocus=document.activeElement; var x=$('#navClose'); if(x)x.focus();}
    else if(lastFocus&&lastFocus.focus){lastFocus.focus(); lastFocus=null;}
  }
  if(nd&&'inert' in nd) nd.inert=true;
  if(nt)nt.addEventListener('click',function(){setNav(!document.body.classList.contains('nav-open'))});
  var nb=$('#navBackdrop'), nc=$('#navClose');
  if(nb)nb.addEventListener('click',function(){ if(document.body.classList.contains('filters-open')) setFilters(false); else setNav(false); });
  if(nc)nc.addEventListener('click',function(){setNav(false)});
  $$('#navLinks a').forEach(function(a){a.addEventListener('click',function(){setNav(false)})});
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape')return;
    if(document.body.classList.contains('nav-open'))setNav(false);
    if(document.body.classList.contains('filters-open'))setFilters(false);
  });

  /* ── saved deals (browser-only wishlist; NOT a price tracker) ──
     Stores only title/image/link/store/date. Never stores or re-checks a price. */
  var HEART='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
  var KEY='sd-saved-v1';
  function readSaved(){try{var v=JSON.parse(LS.get(KEY)||'[]'); return Array.isArray(v)?v:[]}catch(e){return []}}
  function writeSaved(v){LS.set(KEY,JSON.stringify(v)); paintSaved();}
  function isSaved(id){return readSaved().some(function(x){return x.id===id})}
  function paintSaved(){
    var n=readSaved().length;
    $$('.savecount').forEach(function(el){el.textContent=n; el.hidden=!n;});
    $$('.heart').forEach(function(h){
      var on=isSaved(h.dataset.id); h.setAttribute('aria-pressed',on?'true':'false');
      h.setAttribute('aria-label',(on?'Remove from saved: ':'Save deal: ')+(h.dataset.t||''));
    });
    var qs=$('#qvSave'); if(qs&&qs.dataset.id){var on=isSaved(qs.dataset.id); qs.setAttribute('aria-pressed',on?'true':'false'); qs.textContent=on?'Saved ✓':'Save for later';}
  }
  function toggleSaved(item){
    var list=readSaved(), i=-1;
    list.forEach(function(x,j){if(x.id===item.id)i=j});
    if(i>-1)list.splice(i,1); else {item.d=new Date().toISOString().slice(0,10); list.unshift(item);}
    writeSaved(list);
    var live=$('#live'); if(live)live.textContent=(i>-1?'Removed from saved: ':'Saved: ')+item.t;
    if(typeof renderSavedPage==='function')renderSavedPage();
  }
  function itemFrom(card){
    return {id:card.dataset.id,t:card.dataset.t,i:card.dataset.i||'',l:card.dataset.l,s:card.dataset.s,c:card.dataset.c||'',r:card.dataset.r||''};
  }
  document.addEventListener('click',function(e){
    var h=e.target.closest&&e.target.closest('.heart'); if(!h)return;
    var card=h.closest('.card'); if(!card)return;
    e.preventDefault(); toggleSaved(itemFrom(card));
  });

  /* ── quick view dialog ── */
  var qv=$('#qv');
  function fillQv(card){
    var d=card.dataset, img=$('#qvImg'), ph=$('#qvPh');
    if(d.i){img.src=d.i; img.alt=d.t; img.hidden=false; ph.hidden=true;} else {img.hidden=true; ph.hidden=false; ph.textContent=d.t;}
    $('#qvT').textContent=d.t;
    $('#qvStore').textContent=d.s;
    var pr=$('#qvPrice'); pr.innerHTML='';
    if(d.p){var n=document.createElement('span'); n.className='now'; n.textContent='$'+d.p; pr.appendChild(n);}
    if(d.w){var w=document.createElement('span'); w.className='was'; w.textContent='$'+d.w; pr.appendChild(w);}
    if(d.sv){var s=document.createElement('span'); s.className='save'; s.textContent='Save $'+d.sv; pr.appendChild(s);}
    $('#qvSrc').textContent=d.s+' ('+d.dom+')';
    $('#qvFound').textContent=fmtDate((d.found||'').slice(0,10))||'—';
    $('#qvCat').textContent=d.c||'—';
    var wasRow=$('#qvWasRow'); if(d.w){wasRow.hidden=false; $('#qvWas').textContent='$'+d.w+' — the retailer’s listed reference price';} else wasRow.hidden=true;
    $('#qvNote').textContent=d.note||'';
    var go=$('#qvGo'); go.href=d.l; go.firstChild.textContent='View at '+d.s;
    var sv=$('#qvSave'); sv.dataset.id=d.id; sv._card=card;
    paintSaved();
  }
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('.qv-btn'); if(!b||!qv||!qv.showModal)return;
    var card=b.closest('.card'); if(!card)return;
    fillQv(card); qv.showModal();
  });
  if(qv){
    var x=$('#qvClose'); if(x)x.addEventListener('click',function(){qv.close()});
    qv.addEventListener('click',function(e){if(e.target===qv)qv.close()});
    var qs=$('#qvSave'); if(qs)qs.addEventListener('click',function(){ if(qs._card)toggleSaved(itemFrom(qs._card)); });
  }

  /* ── saved page renderer ── */
  var savedRoot=$('#savedRoot');
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function safeUrl(u){return /^https:\/\//.test(u)?u:'#'}
  function fmtDate(iso){var p=(iso||'').split('-'); if(p.length!==3)return ''; return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+p[1]-1]+' '+(+p[2])+', '+p[0];}
  window.renderSavedPage=function(){
    if(!savedRoot)return;
    var list=readSaved(), grid=$('#savedGrid'), empty=$('#savedEmpty'), bar=$('#savedBar');
    empty.hidden=list.length>0; bar.hidden=!list.length;
    $('#savedN').textContent=list.length+(list.length===1?' saved deal':' saved deals');
    grid.innerHTML=list.map(function(x){
      var img=x.i?'<img loading="lazy" src="'+esc(x.i)+'" alt="'+esc(x.t)+'">':'<div class="noimg">'+esc(x.s)+'</div>';
      return '<article class="card" data-id="'+esc(x.id)+'" data-t="'+esc(x.t)+'" data-i="'+esc(x.i)+'" data-l="'+esc(x.l)+'" data-s="'+esc(x.s)+'" data-c="'+esc(x.c)+'">'
        +'<a class="thumb" href="'+esc(safeUrl(x.l))+'" target="_blank" rel="sponsored nofollow noopener">'+img+'</a>'
        +'<button class="heart" type="button" data-id="'+esc(x.id)+'" data-t="'+esc(x.t)+'" aria-pressed="true" aria-label="Remove from saved: '+esc(x.t)+'">'+HEART+'</button>'
        +'<div class="cbody"><div class="cmeta"><span class="store-badge">'+esc(x.s)+'</span></div>'
        +'<a class="ttl" href="'+esc(safeUrl(x.l))+'" target="_blank" rel="sponsored nofollow noopener">'+esc(x.t)+'</a>'
        +'<span class="src">Saved '+esc(fmtDate(x.d))+' · price not stored — check the current price at '+esc(x.s)+'</span>'
        +'<div class="cta-row"><a class="cta" href="'+esc(safeUrl(x.l))+'" target="_blank" rel="sponsored nofollow noopener">View at '+esc(x.s)+'<span class="arr">→</span></a></div></div></article>';
    }).join('');
    paintSaved();
  };
  var clr=$('#savedClear'); if(clr)clr.addEventListener('click',function(){ if(confirm('Remove all saved deals from this browser?'))writeSaved([]), renderSavedPage(); });

  /* ── all-deals: search / filter / sort / show-more (state lives in the URL) ── */
  var grid=$('#dealgrid');
  function setFilters(open){
    document.body.classList.toggle('filters-open',open);
    var fb=$('#filterBtn'); if(fb)fb.setAttribute('aria-expanded',open?'true':'false');
    var f=$('#filters'); if(f&&'inert' in f&&window.matchMedia('(max-width:900px)').matches) f.inert=!open;
    if(open){var first=$('#filters input'); if(first)first.focus();} else if(fb&&window.matchMedia('(max-width:900px)').matches){ }
  }
  window.setFilters=setFilters;
  if(grid){
    var PAGE=36, shown=PAGE, cards=$$('.card',grid), form=$('#filters'), sortEl=$('#sort'), countEl=$('#count'),
        none=$('#noresults'), moreWrap=$('#moreWrap'), moreBtn=$('#moreBtn'), qInput=$('#fq'), af=$('#activeFilters');
    var qp=new URLSearchParams(location.search);
    var st={q:qp.get('q')||'',cat:qp.get('cat')||'',store:qp.get('store')||'',max:qp.get('max')||'',mk:qp.get('mk')==='1',sort:qp.get('sort')||'best'};
    function label(name,val){var el=form&&form.querySelector('input[name="'+name+'"][value="'+val+'"]'); return el?el.parentNode.textContent.replace(/\s+\d+$/,'').trim():val;}
    function sync(){
      if(form){
        ['cat','store','max'].forEach(function(n){var r=form.querySelector('input[name="'+n+'"][value="'+st[n]+'"]'); if(r)r.checked=true;});
        var mk=form.querySelector('input[name="mk"]'); if(mk)mk.checked=st.mk;
      }
      if(sortEl)sortEl.value=st.sort; if(qInput)qInput.value=st.q;
      var hq=$('#hq'); if(hq)hq.value=st.q;
    }
    function match(c){
      var d=c.dataset, t=(st.q||'').trim().toLowerCase();
      if(st.cat&&d.cat!==st.cat)return false;
      if(st.store&&d.store!==st.store)return false;
      if(st.max&&!(+d.price>0&&+d.price<=+st.max))return false;
      if(st.mk&&!(+d.disc>0))return false;
      if(t){var hay=(d.title||'')+' '+(d.catl||'')+' '+(d.storel||''); return t.split(/\s+/).every(function(w){return hay.indexOf(w)>-1});}
      return true;
    }
    function apply(reset){
      if(reset)shown=PAGE;
      var vis=cards.filter(match);
      vis.sort(function(a,b){
        var A=a.dataset,B=b.dataset;
        if(st.sort==='new')return (B.found||'').localeCompare(A.found||'');
        if(st.sort==='save')return (+B.save)-(+A.save);
        if(st.sort==='price-asc')return (+A.price||1e9)-(+B.price||1e9);
        if(st.sort==='price-desc')return (+B.price)-(+A.price);
        return (+B.rank)-(+A.rank);
      });
      cards.forEach(function(c){c.hidden=true;});
      vis.forEach(function(c,i){c.hidden=i>=shown; grid.appendChild(c);});
      var n=vis.length;
      if(countEl)countEl.textContent=n+(n===1?' deal':' deals')+(st.q?' for “'+st.q+'”':'');
      if(none)none.hidden=n>0;
      if(moreWrap)moreWrap.hidden=n<=shown;
      var fc=$('#filterCount'); if(fc)fc.textContent=n;
      // active filter chips
      if(af){
        af.innerHTML='';
        var items=[];
        if(st.q)items.push(['q','Search: '+st.q]);
        if(st.cat)items.push(['cat',label('cat',st.cat)]);
        if(st.store)items.push(['store',label('store',st.store)]);
        if(st.max)items.push(['max','Under $'+st.max]);
        if(st.mk)items.push(['mk','Has a markdown']);
        items.forEach(function(it){
          var b=document.createElement('button'); b.type='button'; b.className='chip'; b.setAttribute('aria-label','Remove filter: '+it[1]);
          b.textContent=it[1]+' ✕'; b.addEventListener('click',function(){st[it[0]]=(it[0]==='mk')?false:''; sync(); apply(true); push();}); af.appendChild(b);
        });
      }
    }
    function push(){
      var p=new URLSearchParams();
      if(st.q)p.set('q',st.q); if(st.cat)p.set('cat',st.cat); if(st.store)p.set('store',st.store);
      if(st.max)p.set('max',st.max); if(st.mk)p.set('mk','1'); if(st.sort!=='best')p.set('sort',st.sort);
      var s=p.toString(); try{history.replaceState(null,'',location.pathname+(s?'?'+s:''));}catch(e){}
    }
    if(form){
      form.addEventListener('change',function(e){
        var n=e.target.name; if(n==='mk')st.mk=e.target.checked; else if(n)st[n]=e.target.value;
        apply(true); push();
      });
      form.addEventListener('submit',function(e){e.preventDefault(); setFilters(false);});
      var clearBtn=$('#filtersClear'); if(clearBtn)clearBtn.addEventListener('click',function(){st.cat=st.store=st.max='';st.mk=false;st.q='';sync();apply(true);push();});
    }
    if(sortEl)sortEl.addEventListener('change',function(){st.sort=sortEl.value; apply(true); push();});
    if(qInput){
      qInput.addEventListener('input',function(){st.q=qInput.value; apply(true); push();});
      qInput.closest('form').addEventListener('submit',function(e){e.preventDefault();});
    }
    var hq0=$('#hq');
    if(hq0){
      hq0.addEventListener('input',function(){st.q=hq0.value; sync(); apply(true); push();});
      if(hq0.form)hq0.form.addEventListener('submit',function(e){e.preventDefault(); st.q=hq0.value; sync(); apply(true); push(); hq0.blur(); var t=$('#dealtop'); if(t)t.scrollIntoView();});
    }
    if(moreBtn)moreBtn.addEventListener('click',function(){shown+=PAGE; apply(false); var first=cards.filter(match)[shown-PAGE]; if(first){var l=$('a.ttl',first); if(l)l.focus({preventScroll:true});}});
    var fb=$('#filterBtn'); if(fb)fb.addEventListener('click',function(){setFilters(true)});
    var fx=$('#filtersClose'); if(fx)fx.addEventListener('click',function(){setFilters(false)});
    if(form&&'inert' in form&&window.matchMedia('(max-width:900px)').matches)form.inert=true;
    window.matchMedia('(max-width:900px)').addEventListener&&window.matchMedia('(max-width:900px)').addEventListener('change',function(m){if(form&&'inert' in form)form.inert=m.matches&&!document.body.classList.contains('filters-open');});
    sync(); apply(true);
  }

  paintSaved();
  if(typeof renderSavedPage==='function')renderSavedPage();
  var sy=$('#year'); if(sy)sy.textContent=new Date().getFullYear();
})();
