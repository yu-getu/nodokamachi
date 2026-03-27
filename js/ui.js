// ══════════════════════════════
//  UI描画・ヘルパー関数
// ══════════════════════════════
function fmt(n){
  if(n>=1e44) return (n/1e44).toFixed(2)+'載';
  if(n>=1e40) return (n/1e40).toFixed(2)+'正';
  if(n>=1e36) return (n/1e36).toFixed(2)+'澗';
  if(n>=1e32) return (n/1e32).toFixed(2)+'溝';
  if(n>=1e28) return (n/1e28).toFixed(2)+'穰';
  if(n>=1e24) return (n/1e24).toFixed(2)+'秭';
  if(n>=1e20) return (n/1e20).toFixed(2)+'垓';
  if(n>=1e16) return (n/1e16).toFixed(2)+'京';
  if(n>=1e12) return (n/1e12).toFixed(2)+'兆';
  if(n>=1e8)  return (n/1e8).toFixed(2)+'億';
  if(n>=1e4)  return (n/1e4).toFixed(1)+'万';
  return Math.floor(n).toLocaleString();
}

function switchTab(name) {
  ['shop','research','deco','achiev','prestige','skill','lvdesign'].forEach(t=>{
    document.getElementById(`panel-${t}`).style.display=t===name?'':'none';
    document.getElementById(`tab-${t}`).classList.toggle('active',t===name);
  });
  if(name==='research') renderResearch();
  if(name==='deco') renderDeco();
  if(name==='achiev') renderAchiev();
  if(name==='prestige') renderPrestige();
  if(name==='skill') renderSkills();
  if(name==='lvdesign') renderLvDesign();
}

function getWeekendMult() {
  const d = new Date().getDay();
  return (d === 0 || d === 6) ? 1.3 : 1;
}

function renderWeekendBadge() {
  const badge = document.getElementById('weekendBadge');
  badge.style.display = getWeekendMult() > 1 ? 'flex' : 'none';
}

function renderStats() {
  document.getElementById('coinCount').textContent=fmt(state.coins);
  const cps=getEffectiveCps(), m=getEventMult();
  const fmtCps = n => n>=1e4 ? fmt(n) : n.toFixed(2);
  document.getElementById('cps').textContent=m!==1?`${fmtCps(cps)}(×${m})`:fmtCps(cps);
  document.getElementById('totalEarned').textContent=fmt(state.totalEarned);
  document.getElementById('maxLvCap').textContent=getMaxLevel();
}

function renderTown() {
  const row=document.getElementById('buildingsRow'); row.innerHTML=''; let any=false;
  BUILDINGS.forEach((b,i)=>{
    const lv=state.buildings[b.id].level; if(!lv) return; any=true;
    const msCount=(state.buildings[b.id].msReached||[]).length;
    const d=document.createElement('div'); d.className='building';
    d.style.setProperty('--delay',`${i*.4}s`);
    const cps=getBuildingCps(b).toFixed(1);
    const msGlow=msCount>0?`filter:drop-shadow(0 0 6px gold)`:'';
    d.innerHTML=`<div class="building-emoji" style="${msGlow}">${b.emoji}${msCount>0?`<span style="font-size:10px;vertical-align:top">×${Math.pow(2,msCount)}</span>`:''}</div>
      <div class="building-name">${b.name} Lv${lv}</div>
      <div class="building-rate">+${cps}/秒</div>`;
    row.appendChild(d);
  });
  if(!any) row.innerHTML='<div style="text-align:center;color:var(--muted);font-size:13px;padding:32px 0">🌱 最初の建物を建ててみよう！</div>';

  const decoRow = document.getElementById('decoRow');
  if (decoRow) decoRow.remove();
  const owned = DECORATIONS.filter(d => state.decorations[d.id]);
  if (owned.length > 0) {
    const dr = document.createElement('div');
    dr.id = 'decoRow';
    dr.style.cssText = 'display:flex;gap:6px;justify-content:center;flex-wrap:wrap;position:relative;z-index:1;margin-top:4px';
    dr.innerHTML = owned.map(d => `<span style="font-size:26px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.15))" title="${d.name}">${d.emoji}</span>`).join('');
    document.getElementById('townArea').appendChild(dr);
  }
}

function renderShop() {
  const grid=document.getElementById('shopGrid'); grid.innerHTML='';

  // 一括購入モード切り替えバー
  const bulkBar=document.createElement('div');
  bulkBar.className='bulk-bar';
  bulkBar.style.cssText='grid-column:1/-1';
  [[1,'×1'],[10,'×10'],[100,'×100'],[0,'MAX']].forEach(([mode,label])=>{
    const btn=document.createElement('button');
    btn.className='bulk-btn'+(bulkMode===mode?' active':'');
    btn.textContent=label;
    btn.dataset.mode=mode;
    btn.onclick=()=>setBulkMode(mode);
    bulkBar.appendChild(btn);
  });
  grid.appendChild(bulkBar);
  const maxLv=getMaxLevel();
  const disc=state.eventDiscount<1;
  const unlockedAreas = state.unlockedAreas || [1];

  AREAS.forEach(area => {
    const isUnlocked = unlockedAreas.includes(area.id);
    if (!isUnlocked) {
      const canAfford = state.coins >= area.unlockCost;
      const card = document.createElement('div');
      card.className = 'area-locked-card';
      card.style.cssText = 'grid-column:1/-1';
      card.innerHTML = `
        <div>
          <div class="area-locked-name">🔒 ${area.emoji} ${area.name}</div>
          <div class="area-locked-info">${area.desc}（新建物3種類）</div>
        </div>
        <button class="btn-buy" id="areaBtn${area.id}" onclick="unlockArea(${area.id})" ${canAfford?'':'disabled'}>
          🪙${fmt(area.unlockCost)} 解放
        </button>`;
      grid.appendChild(card);
      return;
    }
    if (area.id > 1) {
      const hdr = document.createElement('div');
      hdr.className = 'area-header';
      hdr.innerHTML = `${area.emoji} ${area.name}`;
      grid.appendChild(hdr);
    }

    BUILDINGS.filter(b => b.area === area.id).forEach(b=>{
    if (!state.buildings[b.id]) state.buildings[b.id]={level:0,msReached:[]};
    const lv=state.buildings[b.id].level;
    const cost=getBuildingCost(b);
    const isMax=lv>=maxLv;
    const bulk=!isMax?getBulkInfo(b):{count:0,totalCost:0};
    const canAfford=bulk.count>0;
    const msReached=state.buildings[b.id].msReached||[];
    const msCount=msReached.length;
    const nextMs=getNextMilestone(lv,maxLv);

    const phase=getPhase(lv);
    const phaseLabel=getPhaseLabel(lv);

    let barPct=0, barPhaseClass=phase.colorClass;
    if(!isMax) {
      const prevPhaseMax = PHASES.find(p=>lv<=p.maxLv);
      const pStart = prevPhaseMax===PHASES[0]?0:PHASES[PHASES.indexOf(prevPhaseMax)-1]?.maxLv||0;
      const pEnd = Math.min(prevPhaseMax?.maxLv||100, maxLv);
      barPct=Math.min(100,((lv-pStart)/(pEnd-pStart))*100);
    }

    const msBadges=MILESTONES.filter(ms=>ms<=maxLv).map(ms=>{
      const hit=msReached.includes(ms);
      return `<span class="ms-badge ${hit?'reached':'next'}">Lv${ms}${hit?' ✓':''}</span>`;
    }).join('');

    const sale=disc&&!isMax?`<span style="font-size:9px;color:#e53935;font-weight:800"> SALE</span>`:'';
    const bulkLabel=bulk.count>1?` +${bulk.count}Lv`:'';
    const btnCost=bulk.count>0?fmt(bulk.totalCost):fmt(cost);
    const btnText=isMax?`✨ MAX Lv${maxLv}`:lv===0?`🪙${btnCost} 建設${bulkLabel}`:`🪙${btnCost} 強化${bulkLabel}`;
    const btnClass=isMax?'maxed-btn':lv>0?'upgrade':'';

    const div=document.createElement('div');
    div.className='shop-item '+`${isMax?'maxed':canAfford?'affordable':''} ${phase.colorClass}`;
    div.innerHTML=`
      <div class="item-top">
        <span class="item-emoji">${b.emoji}${msCount>0?`<span style="font-size:10px;color:var(--coin2);font-weight:800;vertical-align:top">×${Math.pow(2,msCount)}</span>`:''}</span>
        <div class="item-info">
          <div class="item-name">${b.name}${sale}</div>
          <div class="item-desc">${b.desc} · ${phaseLabel}</div>
        </div>
      </div>
      <div class="lv-bar-wrap ${phase.colorClass}">
        <div class="lv-bar-header">
          <span class="lv-label">Lv ${lv} / ${maxLv}</span>
          <span class="lv-next-ms">${nextMs?`次のMS: Lv${nextMs}`:'全MS達成！'}</span>
        </div>
        <div class="lv-bar-track"><div class="lv-bar-fill" style="width:${isMax?100:barPct}%"></div></div>
      </div>
      <div class="ms-badges">${msBadges}</div>
      <button class="btn-buy ${btnClass}" onclick="buyBuilding('${b.id}')" ${isMax||(!isMax&&!canAfford)?'disabled':''}>${btnText}</button>
    `;
    grid.appendChild(div);
    });
  });
}

function renderAchiev() {
  const unlocked=ACHIEVEMENTS.filter(a=>state.achievements[a.id]).length;
  document.getElementById('achievSummary').textContent=`${unlocked} / ${ACHIEVEMENTS.length} 件解除`;
  const grid=document.getElementById('achievGrid'); grid.innerHTML='';
  ACHIEVEMENTS.forEach(a=>{
    const ok=!!state.achievements[a.id];
    const div=document.createElement('div');
    div.className='achiev-card'+(ok?' unlocked':' locked');
    div.innerHTML=`<div class="achiev-icon">${a.icon}</div><div>
      <div class="achiev-name">${a.name}</div>
      <div class="achiev-desc">${ok?a.desc:'???'}</div>
      <div class="achiev-reward">🎁 ${ok?a.reward:'???'}</div>
      ${ok?'<span class="unlocked-stamp">✅ 解除済み</span>':''}
    </div>`;
    grid.appendChild(div);
  });
}

function renderLvDesign() {
  const maxLv=getMaxLevel();
  const rows = BUILDINGS.map(b=>{
    const snapshots=[1,10,25,50,100].filter(lv=>lv<=maxLv).map(snapLv=>{
      const origLv=state.buildings[b.id].level;
      state.buildings[b.id].level=snapLv-1;
      const cost=getBuildingCost(b);
      state.buildings[b.id].level=origLv;
      const cps=b.baseCps*snapLv*(1+snapLv*.15);
      return {lv:snapLv,cost,cps};
    });
    return {b,snapshots};
  });

  let html=`
    <div class="lv-design-panel">
      <div style="font-size:12px;color:var(--muted);margin-bottom:10px">
        現在のLv上限：<strong style="color:var(--prestige2)">Lv${maxLv}</strong>
        （転生${state.prestigeCount}回 × +${PRESTIGE_LV_BONUS}）
      </div>
      <div style="margin-bottom:14px">
        <div style="font-weight:800;font-size:12px;color:var(--brown);margin-bottom:6px">📐 フェーズ定義</div>`;
  PHASES.forEach(p=>{
    const cap=Math.min(p.maxLv,maxLv);
    html+=`<div class="lv-design-row">
      <div class="lv-range">〜Lv${cap}</div>
      <div class="lv-phase-dot ${p.dot}"></div>
      <div class="lv-detail">${p.name}（コスト倍率×${p.mult}）${cap<p.maxLv?'<span style="color:#e53935">（上限外）</span>':''}</div>
    </div>`;
  });
  if(maxLv>100){
    html+=`<div class="lv-design-row">
      <div class="lv-range">101〜${maxLv}</div>
      <div class="lv-phase-dot dot-p4"></div>
      <div class="lv-detail">転生拡張（倍率×${PHASES[3].mult}継続）</div>
    </div>`;
  }
  html+=`</div><div style="margin-bottom:14px">
    <div style="font-weight:800;font-size:12px;color:var(--brown);margin-bottom:6px">🌟 マイルストーン（CPS×2ボーナス）</div>`;
  MILESTONES.filter(ms=>ms<=maxLv).forEach(ms=>{
    html+=`<div class="lv-design-row">
      <div class="lv-range">Lv${ms}</div>
      <div style="font-size:14px">⭐</div>
      <div class="lv-detail"><span class="lv-ms-note">CPS×2（累積：到達4回で最大×16）</span></div>
    </div>`;
  });
  html+=`</div><div>
    <div style="font-weight:800;font-size:12px;color:var(--brown);margin-bottom:6px">📊 建物別コスト早見表</div>
    <div style="overflow-x:auto"><table style="width:100%;font-size:10px;border-collapse:collapse">
    <thead><tr style="background:var(--warm)">
      <th style="padding:5px;text-align:left">建物</th>
      <th style="padding:5px">Lv1</th>
      <th style="padding:5px">Lv10</th>
      <th style="padding:5px">Lv25</th>
      <th style="padding:5px">Lv50</th>
      ${maxLv>=100?'<th style="padding:5px">Lv100</th>':''}
    </tr></thead><tbody>`;
  rows.forEach(({b,snapshots})=>{
    html+=`<tr style="border-bottom:1px solid #e8d8b0">
      <td style="padding:5px;font-weight:800">${b.emoji}${b.name}</td>`;
    snapshots.forEach(s=>{
      html+=`<td style="padding:5px;text-align:center;color:var(--muted)">${fmt(s.cost)}</td>`;
    });
    if(snapshots.length<5) html+=`<td style="padding:5px;text-align:center;color:#ccc">-</td>`;
    html+=`</tr>`;
  });
  html+=`</tbody></table></div></div></div>`;
  document.getElementById('lvDesignContent').innerHTML=html;
}

function render() { renderStats(); renderTown(); renderShop(); renderSeason(); renderWeekendBadge(); updateEventBadge(); }

function addLog(msg) {
  const log=document.getElementById('log'), now=new Date();
  const t=`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  const e=document.createElement('div'); e.className='log-entry';
  e.textContent=`[${t}] ${msg}`; log.insertBefore(e,log.firstChild);
  while(log.children.length>20) log.removeChild(log.lastChild);
}

function showOfflineModal(sec,coins) {
  const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60);
  document.getElementById('offlineMsg').textContent=`${h>0?h+'時間':''} ${m}分の間、街が働き続けました（効率50%）`;
  document.getElementById('offlineCoins').textContent=`+${fmt(coins)} 🪙`;
  document.getElementById('offlineModal').classList.add('show');
}

function closeModal(id) { document.getElementById(id).classList.remove('show'); }

function spawnFloatCoins(text) {
  const btn=document.getElementById('harvestBtn'), r=btn.getBoundingClientRect();
  const el=document.createElement('div'); el.className='float-coin';
  el.textContent=`🪙${text}`; el.style.left=(r.left+r.width/2-20)+'px'; el.style.top=(r.top-10)+'px';
  document.body.appendChild(el); setTimeout(()=>el.remove(),1300);
}
