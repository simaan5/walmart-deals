
(function(){
  var tb=document.getElementById('themeBtn');
  if(tb){tb.addEventListener('click',function(){
    var n=document.documentElement.getAttribute('data-theme')==='light'?'dark':'light';
    document.documentElement.setAttribute('data-theme',n);
    try{localStorage.setItem('sd-theme',n);}catch(e){}
  });}
  var nt=document.getElementById('navToggle'), nb=document.getElementById('navBackdrop');
  function closeNav(){document.body.classList.remove('nav-open');if(nt)nt.setAttribute('aria-expanded','false');}
  if(nt){nt.addEventListener('click',function(){
    var open=document.body.classList.toggle('nav-open');
    nt.setAttribute('aria-expanded',open?'true':'false');
  });}
  if(nb){nb.addEventListener('click',closeNav);}
  [].slice.call(document.querySelectorAll('#navLinks a')).forEach(function(a){a.addEventListener('click',closeNav);});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeNav();});
  var q=document.getElementById('q'), sort=document.getElementById('sort');
  var grid=document.querySelector('.grid'), none=document.getElementById('noresults');
  if(!grid) return;
  var cards=[].slice.call(grid.querySelectorAll('.card')), cat='';
  function apply(){
    var term=(q.value||'').trim().toLowerCase(), shown=0;
    cards.forEach(function(c){
      var ok=(!cat||c.dataset.cat===cat)&&(!term||c.dataset.title.indexOf(term)>-1);
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
  q && q.addEventListener('input', apply);
  sort && sort.addEventListener('change', apply);
  [].slice.call(document.querySelectorAll('.chip')).forEach(function(ch){
    ch.addEventListener('click', function(){
      var a=document.querySelector('.chip.active'); if(a)a.classList.remove('active');
      ch.classList.add('active'); cat=ch.dataset.cat||''; apply();
    });
  });
})();
