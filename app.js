
(function(){
  var tb=document.getElementById('themeBtn');
  if(tb){tb.addEventListener('click',function(){
    var n=document.documentElement.getAttribute('data-theme')==='light'?'dark':'light';
    document.documentElement.setAttribute('data-theme',n);
    try{localStorage.setItem('sd-theme',n);}catch(e){}
  });}
  // ── GDPR cookie consent: show the banner only if analytics is configured AND
  // no choice yet; load analytics only on Accept. ──
  (function(){
    var b=document.getElementById('cookieBanner');
    if(!b||!window.__sdAnalytics) return;
    var choice=null; try{choice=localStorage.getItem('sd-consent');}catch(e){}
    if(choice) return;            // already accepted/declined — stay hidden
    b.hidden=false;
    function decide(v){try{localStorage.setItem('sd-consent',v);}catch(e){} b.hidden=true;}
    var a=document.getElementById('cookieAccept'), d=document.getElementById('cookieDecline');
    if(a)a.addEventListener('click',function(){decide('granted'); if(window.__sdLoadAnalytics)window.__sdLoadAnalytics();});
    if(d)d.addEventListener('click',function(){decide('denied');});
  })();
  // GA4 outbound-click events (fires only after consent has loaded gtag) —
  // lets us reconcile real human clicks against Impact's bot-inflated totals.
  document.addEventListener('click',function(e){
    var a=e.target&&e.target.closest?e.target.closest('a[href*="goto.walmart.com"],a[href*="amazon.com"]'):null;
    if(!a||!window.gtag)return;
    var m=(a.getAttribute('href')||'').match(/subId1=([^&]+)/);
    gtag('event','outbound_click',{link_domain:a.hostname||'',link_sub:m?m[1]:''});
  });
  var nt=document.getElementById('navToggle'), nb=document.getElementById('navBackdrop');
  var nd=document.getElementById('navDrawer');
  function setNav(open){
    document.body.classList.toggle('nav-open',open);
    if(nt)nt.setAttribute('aria-expanded',open?'true':'false');
    if(nd)nd.setAttribute('aria-hidden',open?'false':'true');  // a11y: don't trap focus in an aria-hidden subtree
  }
  function closeNav(){setNav(false);}
  if(nt){nt.addEventListener('click',function(){
    setNav(!document.body.classList.contains('nav-open'));
  });}
  if(nb){nb.addEventListener('click',closeNav);}
  var nc=document.getElementById('navClose');
  if(nc){nc.addEventListener('click',closeNav);}
  [].slice.call(document.querySelectorAll('#navLinks a')).forEach(function(a){a.addEventListener('click',closeNav);});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeNav();});
  var q=document.getElementById('q'), sort=document.getElementById('sort');
  var grid=document.getElementById('dealgrid')||document.querySelector('.grid'), none=document.getElementById('noresults');
  if(!grid) return;
  var cards=[].slice.call(grid.querySelectorAll('.card')), cat='', store='';
  function apply(){
    var term=(q.value||'').trim().toLowerCase(), shown=0;
    cards.forEach(function(c){
      var ok=(!cat||c.dataset.cat===cat)&&(!store||c.dataset.store===store)&&(!term||c.dataset.title.indexOf(term)>-1);
      c.style.display=ok?'':'none'; if(ok)shown++;
    });
    if(none) none.hidden = shown>0;
    var v=sort.value, vis=cards.filter(function(c){return c.style.display!=='none';});
    vis.sort(function(a,b){
      if(v==='disc') return (+b.dataset.disc)-(+a.dataset.disc);
      if(v==='price-asc') return (+a.dataset.price)-(+b.dataset.price);
      if(v==='price-desc') return (+b.dataset.price)-(+a.dataset.price);
      return (+b.dataset.score)-(+a.dataset.score);
    });
    vis.forEach(function(c){grid.appendChild(c);});
  }
  q && q.addEventListener('input', function(){
    apply();
    var all=document.getElementById('all');
    if(all && q.value && window.scrollY < all.offsetTop-140){ all.scrollIntoView({behavior:'smooth'}); }
  });
  sort && sort.addEventListener('change', apply);
  [].slice.call(document.querySelectorAll('.chips .chip')).forEach(function(ch){
    ch.addEventListener('click', function(){
      var grp=ch.parentNode, a=grp.querySelector('.chip.active');
      if(a)a.classList.remove('active'); ch.classList.add('active');
      if('store' in ch.dataset) store=ch.dataset.store||''; else cat=ch.dataset.cat||'';
      apply();
    });
  });
  // ── sticky search + category bar ──
  var q2=document.getElementById('q2'), bar=document.getElementById('stickybar');
  // Two-way mirror q <-> q2: set partner value then dispatch a native 'input'
  // event so the EXISTING #q listener (which calls apply()) runs. A guard flag
  // prevents the dispatched event from echoing back into an infinite loop.
  if(q && q2){
    var syncing=false;
    function mirror(from,to){
      if(syncing) return; syncing=true;
      to.value=from.value;
      to.dispatchEvent(new Event('input',{bubbles:true}));
      syncing=false;
    }
    q2.addEventListener('input', function(){ mirror(q2,q); });
    q.addEventListener('input', function(){ if(!syncing) q2.value=q.value; });
  }
  // Sticky chips proxy to the real #all category chips so all filter/active
  // state stays in the existing '.chips .chip' handler (no duplicated logic).
  var sbChips=document.getElementById('sbChips');
  var realCats=document.querySelector('#all .chips.cats');
  if(sbChips && realCats){
    [].slice.call(sbChips.querySelectorAll('.schip')).forEach(function(sc){
      sc.addEventListener('click', function(){
        var sa=sbChips.querySelector('.schip.active');
        if(sa)sa.classList.remove('active'); sc.classList.add('active');
        var target=realCats.querySelector('.chip[data-cat="'+(sc.dataset.cat||'')+'"]');
        if(target) target.click();
      });
    });
  }
  // Reveal the bar only once the hero search has scrolled out of view.
  var heroSearch=document.querySelector('.hero-search');
  if(bar && heroSearch && 'IntersectionObserver' in window){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        var show=!en.isIntersecting;
        bar.classList.toggle('visible', show);
        bar.setAttribute('aria-hidden', show?'false':'true');
      });
    }, {rootMargin:'-56px 0px 0px 0px', threshold:0});
    io.observe(heroSearch);
  }
})();
