    // ── Risk Calculator JS ──────────────────────────────────
    let isLong = true;
    let sizingMode = 'account';
    let deriskAuto = true;
    let levels = [{ id:1, priceTo:0, stopTo:0, sellPct:50 }];
    let nid = 2;
    let livePrice = null;

    function openCalc() {
      // Sync theme from portfolio tracker
      const rcWrap = document.getElementById('rc-wrap');
      const ptDark = document.documentElement.style.getPropertyValue('--date-invert') === '1'
        || document.querySelector('[data-pt-theme]')?.dataset.ptTheme === 'dark'
        || true; // will be updated by React
      document.getElementById('rc-overlay').classList.add('open');
    }
    function closeCalc() {
      document.getElementById('rc-overlay').classList.remove('open');
    }
    function onOverlayClick(e) {

    }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCalc(); });

    async function fetchPrice() {
      const symbol = document.getElementById('rc-symbol').value.trim().toUpperCase();
      if (!symbol) return;
      const btn = document.getElementById('fetch-btn');
      const disp = document.getElementById('price-display');
      const valEl = document.getElementById('price-val');
      btn.disabled = true; btn.classList.add('loading');
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;
      disp.className = 'price-display'; valEl.className = 'price-display-value placeholder'; valEl.textContent = 'Fetching…';
      document.getElementById('price-right').style.display = 'none';
      document.getElementById('price-meta').style.display  = 'none';
      try {
        let result;
        if (typeof window.rcGetPrice === 'function') { result = await window.rcGetPrice(symbol); }
        else {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
          let data;
          try { const res = await fetch(url, {signal:AbortSignal.timeout(6000)}); data = await res.json(); } catch {
            const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`, {signal:AbortSignal.timeout(8000)}); data = await res.json();
          }
          const meta = data?.chart?.result?.[0]?.meta;
          const price = meta?.regularMarketPrice;
          const prev = meta?.previousClose ?? meta?.chartPreviousClose;
          if (!price) throw new Error('No data');
          result = { price, changePct: prev ? ((price-prev)/prev)*100 : null, source:'Live' };
        }
        if (!result || !result.price) throw new Error('No price data');
        livePrice = result.price;
        valEl.className = 'price-display-value';
        valEl.textContent = '$' + result.price.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
        disp.className = 'price-display has-price';
        const chEl = document.getElementById('price-change');
        if (result.changePct != null) { const sign = result.changePct >= 0 ? '+':''; chEl.textContent = `${sign}${result.changePct.toFixed(2)}%`; chEl.className = 'price-change '+(result.changePct>=0?'up':'down'); } else { chEl.textContent=''; }
        document.getElementById('price-right').style.display='flex';
        const metaEl=document.getElementById('price-meta'); const metaTxt=document.getElementById('price-meta-text');
        metaEl.style.display='flex'; metaTxt.textContent=result.source||'Live';
      } catch(err) {
        livePrice=null; disp.className='price-display error';
        valEl.className='price-display-value placeholder'; valEl.textContent='Could not fetch — enter manually';
        document.getElementById('price-meta').style.display='none';
      }
      btn.disabled=false; btn.classList.remove('loading');
      btn.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`;
    }

    function useAsEntry() {
      if (!livePrice) return;
      document.getElementById('entry').value = livePrice.toFixed(2);
      onEntry();
      const entryInput = document.getElementById('entry');
      entryInput.style.borderColor = 'var(--rc-border-focus)';
      setTimeout(() => { entryInput.style.borderColor = ''; }, 1200);
    }

    function setSizingMode(mode) {
      sizingMode = mode;
      document.getElementById('mode-account').className='mode-btn'+(mode==='account'?' active':'');
      document.getElementById('mode-fixed').className='mode-btn'+(mode==='fixed'?' active':'');
      document.getElementById('account-fields').className='account-fields'+(mode==='account'?'':' hidden');
      document.getElementById('fixed-field').className='fixed-field'+(mode==='fixed'?'':' hidden');
      if (mode==='fixed') { document.getElementById('equity-icon').textContent='↗'; document.getElementById('equity-label').textContent='Return at Target'; }
      else { document.getElementById('equity-icon').textContent='%'; document.getElementById('equity-label').textContent='Plan Equity Risk %'; }
      calc();
    }

    function setDir(d) {
      isLong = d === 'long';
      document.getElementById('btn-long').className='ls-btn'+(isLong?' active-long':'');
      document.getElementById('btn-short').className='ls-btn'+(!isLong?' active-short':'');
      document.getElementById('stop-hint').textContent=isLong?'Stop below entry — you lose when price drops':'Stop above entry — you lose when price rises';
      document.getElementById('target-hint').textContent=isLong?'Target above entry — you profit when price rises':'Target below entry — you profit when price drops';
      const e=G('entry'), sp=G('stopPct'), tp=G('targetPct');
      if(e&&sp) S('stopDollar',(isLong?e*(1-sp/100):e*(1+sp/100)).toFixed(2));
      if(e&&tp) S('targetDollar',(isLong?e*(1+tp/100):e*(1-tp/100)).toFixed(2));
      const allLabels=document.querySelectorAll('.derisk-menu-field-label');
      if(allLabels[0]) allLabels[0].innerHTML='Take Profit <small>('+(isLong?'% above entry':'% below entry')+')</small>';
      if(allLabels[1]) allLabels[1].innerHTML='Move Stop To <small>('+(isLong?'% above entry':'% above entry — loss buffer')+')</small>';
      if(!deriskAuto) applyDeriskDefaults();
      calc();
    }

    const G = id => parseFloat(document.getElementById(id).value)||0;
    const S = (id,v) => { if(!isNaN(v)) document.getElementById(id).value=v; };
    const fd = n => isNaN(n)||n==null?'—':'$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
    const fp = n => isNaN(n)||n==null?'—':n.toFixed(2)+'%';
    const fn = n => isNaN(n)||n==null?'—':n.toFixed(2);

    function onAccountSize() { const acc=G('accountSize'); S('riskDollar',((G('riskPct')/100)*acc).toFixed(2)); S('maxPos',((G('maxPosPct')/100)*acc).toFixed(2)); calc(); }
    function onRiskDollar()  { S('riskPct',((G('riskDollar')/G('accountSize'))*100).toFixed(2)); calc(); }
    function onRiskPct()     { S('riskDollar',((G('riskPct')/100)*G('accountSize')).toFixed(2)); calc(); }
    function onMaxDollar()   { S('maxPosPct',((G('maxPos')/G('accountSize'))*100).toFixed(2)); calc(); }
    function onMaxPct()      { S('maxPos',((G('maxPosPct')/100)*G('accountSize')).toFixed(2)); calc(); }
    function onEntry() { const e=G('entry'),sp=G('stopPct'),tp=G('targetPct'); if(sp) S('stopDollar',(isLong?e*(1-sp/100):e*(1+sp/100)).toFixed(2)); if(tp) S('targetDollar',(isLong?e*(1+tp/100):e*(1-tp/100)).toFixed(2)); calc(); }
    function onStopDollar() { const e=G('entry'),st=G('stopDollar'),diff=isLong?e-st:st-e; if(e) S('stopPct',((diff/e)*100).toFixed(2)); calc(); }
    function onStopPct()    { const e=G('entry'),p=G('stopPct'); if(e) S('stopDollar',(isLong?e*(1-p/100):e*(1+p/100)).toFixed(2)); calc(); }
    function onTargetDollar() { const e=G('entry'),t=G('targetDollar'),diff=isLong?t-e:e-t; if(e) S('targetPct',((diff/e)*100).toFixed(2)); calc(); }
    function onTargetPct()    { const e=G('entry'),p=G('targetPct'); if(e) S('targetDollar',(isLong?e*(1+p/100):e*(1-p/100)).toFixed(2)); calc(); }

    function calc() {
      const e=G('entry'),st=G('stopDollar'),tgt=G('targetDollar');
      const rps=isLong?e-st:st-e, rwps=isLong?tgt-e:e-tgt, rMult=rps>0?rwps/rps:0;
      let shares,posVal,trueRisk,equityPct,capped;
      if(sizingMode==='fixed') { const fs=G('fixedSize'); shares=e>0?Math.floor(fs/e):0; posVal=shares*e; trueRisk=shares*rps; equityPct=0; capped=false; }
      else { const acc=G('accountSize'),rd=G('riskDollar'),mp=G('maxPos'); const rawSh=rps>0?rd/rps:0,capSh=e>0?mp/e:Infinity; shares=Math.floor(Math.min(rawSh,capSh)); capped=capSh<rawSh; posVal=shares*e; trueRisk=shares*rps; equityPct=acc>0?(trueRisk/acc)*100:0; }
      const hero=document.getElementById('shares-hero');
      hero.className='shares-hero '+(isLong?'long-mode':'short-mode');
      document.getElementById('shares-label').textContent=isLong?'SHARES TO BUY':'SHARES TO SHORT';
      document.getElementById('shares-val').textContent=shares>0?shares.toLocaleString():'—';
      document.getElementById('shares-capped').className='shares-hero-capped'+(capped?' show':'');
      document.getElementById('s-posval').textContent=fd(posVal);
      document.getElementById('s-risk').textContent=fd(trueRisk);
      const eq=document.getElementById('s-equity'),eqSub=document.getElementById('s-equity-sub');
      if(sizingMode==='fixed') { const fs=G('fixedSize'),rd=shares>0?shares*rwps:0,rp=fs>0&&shares>0?(rd/fs)*100:0; eq.textContent=rd>0?fd(rd):'—'; eq.className='stat-card-value '+(rd>0?'green':''); eqSub.textContent=rp>0?fp(rp):''; eqSub.style.display=rp>0?'block':'none'; }
      else { eq.textContent=fp(equityPct); eq.className='stat-card-value '+(equityPct>2?'red':equityPct>1?'amber':'green'); eqSub.style.display='none'; }
      const rm=document.getElementById('s-rmult'),rb=document.getElementById('s-rbadge');
      rm.textContent=rMult>0?fn(rMult)+'R':'—';
      if(rMult>=3){rm.className='stat-card-value green';rb.style.display='inline-block';rb.className='stat-badge green';rb.textContent='Excellent setup (3R+)';}
      else if(rMult>=2){rm.className='stat-card-value amber';rb.style.display='inline-block';rb.className='stat-badge amber';rb.textContent='Good setup (2–3R)';}
      else if(rMult>0){rm.className='stat-card-value red';rb.style.display='inline-block';rb.className='stat-badge red';rb.textContent='Marginal setup (<2R)';}
      else{rm.className='stat-card-value';rb.style.display='none';}
      document.getElementById('t-entry').textContent=fd(e);
      document.getElementById('t-stop').textContent=`${fd(st)} (${fp(G('stopPct'))})`;
      document.getElementById('t-target').textContent=`${fd(tgt)} (${fp(G('targetPct'))})`;
      document.getElementById('t-rps').textContent=fd(rps);
      document.getElementById('t-rwps').textContent=fd(rwps);
      if(levels.length>0&&deriskAuto) { const t2=G('targetDollar'),e2=G('entry'),lv1=levels[0]; if(t2) lv1.priceTo=t2; if(e2) lv1.stopTo=e2; const inputs=document.querySelectorAll('#lc-'+lv1.id+' .lf-input'); if(inputs[0]&&t2) inputs[0].value=t2; if(inputs[1]&&e2) inputs[1].value=e2; }
      updateDerisk(shares,e,trueRisk);
    }

    function renderLevels() {
      const c=document.getElementById('levels-container'); c.innerHTML='';
      levels.forEach(lv => {
        const d=document.createElement('div'); d.className='level-card'; d.id='lc-'+lv.id;
        d.innerHTML=`<div class="level-top"><span class="level-num">Trim ${lv.id}</span><button class="level-del" onclick="removeLevel(${lv.id})">✕</button></div><div class="level-grid"><div><div class="lf-label">Take Profit</div><div class="lf-wrap"><span class="lf-prefix">$</span><input class="lf-input" type="number" value="${lv.priceTo}" oninput="updLevel(${lv.id},'priceTo',this.value)" /></div></div><div><div class="lf-label">Move Stop To</div><div class="lf-wrap"><span class="lf-prefix">$</span><input class="lf-input" type="number" value="${lv.stopTo}" oninput="updLevel(${lv.id},'stopTo',this.value)" /></div></div></div><div class="sell-row"><span class="sell-label">Sell</span><input class="sell-slider" type="range" min="0" max="100" step="5" value="${lv.sellPct}" oninput="updLevel(${lv.id},'sellPct',this.value);this.nextElementSibling.textContent=this.value+'%'" /><span class="sell-pct">${lv.sellPct}%</span></div><div class="level-stats" id="ls-${lv.id}"><span class="ls">—</span></div>`;
        c.appendChild(d);
      });
      calc();
    }
    function updLevel(id,key,val) { levels=levels.map(l=>l.id===id?{...l,[key]:parseFloat(val)||0}:l); calc(); }
    function removeLevel(id) { levels=levels.filter(l=>l.id!==id); renderLevels(); }
    function addLevel() { levels.push({id:nid++,priceTo:G('targetDollar')||120,stopTo:G('entry')||100,sellPct:25}); renderLevels(); }

    function updateDerisk(shares,e,trueRisk) {
      let totalLocked=0,remainShares=shares,finalStopTo=G('stopDollar');
      levels.forEach(lv => {
        const sell=Math.min(Math.round((lv.sellPct/100)*shares),remainShares);
        const locked=sell*(isLong?lv.priceTo-e:e-lv.priceTo);
        totalLocked+=isNaN(locked)?0:locked; remainShares-=sell;
        if(lv.stopTo) finalStopTo=lv.stopTo;
        const el=document.getElementById('ls-'+lv.id);
        if(el){const lStr=isNaN(locked)?'—':(locked>=0?'+':'')+fd(locked);const lCls=locked>=0?'g':'r';el.innerHTML=`<span class="ls">Sell<b>${isNaN(sell)?'—':sell} sh</b></span><span class="ls">Lock<b class="${lCls}">${lStr}</b></span><span class="ls">Remain<b>${isNaN(remainShares)?'—':remainShares} sh</b></span>`;}
      });
      const finalRemainRisk=Math.max(0,remainShares*(isLong?e-finalStopTo:finalStopTo-e));
      const reduced=trueRisk>0?((trueRisk-finalRemainRisk)/trueRisk)*100:0;
      const net=totalLocked-finalRemainRisk;
      document.getElementById('ds-locked').textContent=totalLocked>=0?'+'+fd(totalLocked):fd(totalLocked);
      document.getElementById('ds-remain').textContent=fd(Math.max(0,finalRemainRisk));
      document.getElementById('ds-reduced').textContent=fp(reduced);
      const nel=document.getElementById('ds-net');nel.textContent=(net>=0?'+':'')+fd(net);nel.className='ds-item-value '+(net>=0?'g':'r');
    }

    function clearCalc() {
      const defaults={accountSize:1000000,riskDollar:10000,riskPct:1,maxPos:250000,maxPosPct:25,entry:'',stopDollar:'',stopPct:5,targetDollar:'',targetPct:15};
      Object.keys(defaults).forEach(id => { document.getElementById(id).value=defaults[id]; });
      document.getElementById('rc-symbol').value=''; livePrice=null;
      document.getElementById('price-display').className='price-display';
      document.getElementById('price-val').className='price-display-value placeholder';
      document.getElementById('price-val').textContent='$0.00';
      document.getElementById('price-right').style.display='none';
      document.getElementById('price-meta').style.display='none';
      document.getElementById('fixedSize').value='10000';
      setSizingMode('account');
      levels=[{id:1,priceTo:0,stopTo:0,sellPct:50}]; nid=2; renderLevels();
    }

    function applyDeriskDefaults() {
      if(levels.length===0) return;
      const lv1=levels[0],entry=G('entry');
      if(!entry) return;
      if(deriskAuto){lv1.priceTo=G('targetDollar')||0;lv1.stopTo=entry;}
      else{const pp=parseFloat(document.getElementById('derisk-price-pct').value)||0,sp=parseFloat(document.getElementById('derisk-stop-pct').value)||0;lv1.priceTo=parseFloat((isLong?entry*(1+pp/100):entry*(1-pp/100)).toFixed(2));lv1.stopTo=parseFloat((isLong?entry*(1+sp/100):entry*(1-sp/100)).toFixed(2));}
      const inputs=document.querySelectorAll('#lc-'+lv1.id+' .lf-input');
      if(inputs[0]) inputs[0].value=lv1.priceTo;
      if(inputs[1]) inputs[1].value=lv1.stopTo;
      calc();
    }

    (function(){
      const btn=document.getElementById('derisk-menu-btn'),popup=document.getElementById('derisk-menu-popup'),autoBtn=document.getElementById('derisk-auto-btn'),manualFields=document.getElementById('derisk-manual-fields'),pricePctInput=document.getElementById('derisk-price-pct'),stopPctInput=document.getElementById('derisk-stop-pct');
      btn.addEventListener('click',function(e){e.stopPropagation();const rect=btn.getBoundingClientRect();popup.style.top=(rect.bottom+6)+'px';popup.style.right=(window.innerWidth-rect.right)+'px';popup.classList.toggle('open');});
      document.addEventListener('click',function(){popup.classList.remove('open');});
      popup.addEventListener('click',function(e){e.stopPropagation();});
      autoBtn.addEventListener('click',function(){deriskAuto=!deriskAuto;autoBtn.textContent=deriskAuto?'On':'Off';autoBtn.classList.toggle('off',!deriskAuto);manualFields.classList.toggle('hidden',deriskAuto);applyDeriskDefaults();});
      function listenInput(el){el.addEventListener('input',applyDeriskDefaults);}
      listenInput(pricePctInput); listenInput(stopPctInput);
    })();

    // Init
    renderLevels();
    // Set initial theme based on body/localStorage
    (function() {
      try { const t = localStorage.getItem('pt_theme'); document.getElementById('rc-wrap').setAttribute('data-rc-theme', t === 'light' ? 'light' : 'dark'); } catch(e) { document.getElementById('rc-wrap').setAttribute('data-rc-theme','dark'); }
    })();

    // Expose openCalc globally for React to call
    window.openRiskCalc = function(isDark, prefill) {
      const wrap = document.getElementById('rc-wrap');
      wrap.setAttribute('data-rc-theme', isDark ? 'dark' : 'light');
      if (prefill) {
        if (prefill.symbol) document.getElementById('rc-symbol').value = prefill.symbol;
        if (prefill.entryPrice) { document.getElementById('entry').value = prefill.entryPrice; onEntry(); }
      }
      document.getElementById('rc-overlay').classList.add('open');
    };

    // Floating tooltip
    (function() {
      const tip = document.createElement('div');
      tip.id = 'rc-float-tip';
      document.body.appendChild(tip);
      document.querySelectorAll('[data-tip]').forEach(el => {
        el.addEventListener('mouseenter', function(e) { tip.textContent = this.dataset.tip; tip.classList.add('visible'); position(e); });
        el.addEventListener('mousemove', position);
        el.addEventListener('mouseleave', function() { tip.classList.remove('visible'); });
      });
      function position(e) {
        const tw=tip.offsetWidth, th=tip.offsetHeight, gap=10;
        let x=e.clientX-tw/2, y=e.clientY-th-gap;
        if(x<8) x=8;
        if(x+tw>window.innerWidth-8) x=window.innerWidth-tw-8;
        if(y<8) y=e.clientY+gap;
        tip.style.left=x+'px'; tip.style.top=y+'px';
      }
    })();
