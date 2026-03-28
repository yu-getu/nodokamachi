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
  ['shop','research','deco','achiev','prestige','skill','record'].forEach(t=>{
    document.getElementById(`panel-${t}`).style.display=t===name?'':'none';
    document.getElementById(`tab-${t}`).classList.toggle('active',t===name);
  });
  if(name==='research') renderResearch();
  if(name==='deco') renderDeco();
  if(name==='achiev') renderAchiev();
  if(name==='prestige') renderPrestige();
  if(name==='skill') renderSkills();
  if(name==='record') renderRecord();
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
  const cps=getEffectiveCps();
  const fmtCps = n => n>=1e4 ? fmt(n) : n.toFixed(2);
  document.getElementById('cps').textContent=fmtCps(cps);
  document.getElementById('totalEarned').textContent=fmt(state.totalEarned);
  document.getElementById('maxLvCap').textContent=getMaxLevel();
  if (document.getElementById('cpsDetailBar')?.classList.contains('open')) renderCpsDetail();
}

let _cpsDetailOpen = false;
function toggleCpsDetail() {
  _cpsDetailOpen = !_cpsDetailOpen;
  const bar = document.getElementById('cpsDetailBar');
  const hint = document.getElementById('cpsDetailHint');
  bar.classList.toggle('open', _cpsDetailOpen);
  if (hint) hint.textContent = _cpsDetailOpen ? '▲' : '▼';
  if (_cpsDetailOpen) renderCpsDetail();
}

function renderCpsDetail() {
  const fmtMult = v => v >= 10 ? `×${v.toFixed(1)}` : `×${v.toFixed(2)}`;
  const baseCps = getCps() / getAchievCpsBonus() / getPrestigeMult() / (1 + getPrestigeSkillEffect('cps_perm'));

  const buffs = [];

  // 基本CPS
  buffs.push({ icon:'🏗️', label:'建物CPS', raw: baseCps >= 1e4 ? fmt(baseCps) : baseCps.toFixed(2), type:'base' });

  // 転生倍率
  const pm = getPrestigeMult();
  if (pm > 1) buffs.push({ icon:'⭐', label:'転生', raw: fmtMult(pm), type:'buff' });

  // 転生スキル永続ボーナス
  const cpsPerm = getPrestigeSkillEffect('cps_perm');
  if (cpsPerm > 0) buffs.push({ icon:'🌌', label:'転生スキル', raw:`+${(cpsPerm*100).toFixed(0)}%`, type:'buff' });

  // 実績ボーナス
  const am = getAchievCpsBonus();
  if (am > 1) buffs.push({ icon:'🏅', label:'実績の目', raw: fmtMult(am), type:'buff' });

  // 季節
  const season = getCurrentSeason();
  const sm = season.cpsMult;
  buffs.push({ icon: season.emoji, label: season.name, raw: fmtMult(sm), type: sm >= 1 ? 'buff' : 'debuff' });

  // 美観
  const bm = getBeautyMult();
  if (bm > 1.001) buffs.push({ icon:'✨', label:'美観', raw: fmtMult(bm), type:'buff' });

  // 週末
  const wm = getWeekendMult();
  if (wm > 1) buffs.push({ icon:'🎉', label:'週末', raw: fmtMult(wm), type:'buff' });

  // イベント（重ねがけ対応）
  const now_ev = Date.now();
  (state.activeEvents || []).filter(ae => now_ev <= ae.endsAt && (ae.mult || 1) !== 1).forEach(ae => {
    const ev = EVENTS.find(e => e.id === ae.eventId);
    const m = ae.mult || 1;
    buffs.push({ icon: ev?.icon || '🎪', label: ev?.title?.replace(/[！。]/g,'') || 'イベント', raw: fmtMult(m), type: m >= 1 ? 'buff' : 'debuff' });
  });

  // 合計
  const total = getEffectiveCps();

  const el = document.getElementById('cpsDetailContent');
  el.innerHTML = buffs.map(b => `
    <div class="cps-buff-pill cps-buff-${b.type}">
      <span class="cps-buff-icon">${b.icon}</span>
      <span class="cps-buff-label">${b.label}</span>
      <span class="cps-buff-val">${b.raw}</span>
    </div>`).join('') +
    `<div class="cps-buff-pill cps-buff-total">
      <span class="cps-buff-icon">⏱️</span>
      <span class="cps-buff-label">合計</span>
      <span class="cps-buff-val">${total >= 1e4 ? fmt(total) : total.toFixed(2)}/秒</span>
    </div>`;
}

let _townViewArea = 0;

function _updateTownMeta(area) {
  const label = document.getElementById('townAreaLabel');
  const icon  = document.getElementById('townCenterIcon');
  if (label) label.textContent = `${area.emoji} ${area.name}`;
  if (icon)  icon.textContent  = area.emoji;
}

let _townSliding = false;
function changeTownArea(dir) {
  if (_townSliding) return;
  const unlocked = AREAS.filter(a => (state.unlockedAreas || [1]).includes(a.id));
  const newIdx = Math.max(0, Math.min(unlocked.length - 1, _townViewArea + dir));
  if (newIdx === _townViewArea) return;

  _townSliding = true;
  const content = document.getElementById('townContent');
  const outClass = dir > 0 ? 'tc-out-left'  : 'tc-out-right';
  const inClass  = dir > 0 ? 'tc-in-right'  : 'tc-in-left';

  // 背景色・ラベル・中央アイコンを即時切り替え
  _townViewArea = newIdx;
  document.getElementById('townArea').dataset.area = unlocked[newIdx].id;
  _updateTownMeta(unlocked[newIdx]);

  content.classList.add(outClass);
  setTimeout(() => {
    content.classList.remove(outClass);
    renderTown();
    content.classList.add(inClass);
    setTimeout(() => {
      content.classList.remove(inClass);
      _townSliding = false;
    }, 240);
  }, 180);
}

function _mkBuildingEl(b, i) {
  const lv = state.buildings[b.id].level;
  const d = document.createElement('div');
  d.className = 'building';
  d.style.setProperty('--delay', `${i * .4}s`);
  const cps = getBuildingCps(b).toFixed(1);
  d.innerHTML = `<div class="building-emoji">${b.emoji}</div>
    <div class="building-name">${b.name} Lv${lv}</div>
    <div class="building-rate">+${cps}/秒</div>`;
  return d;
}

function renderTown() {
  const unlockedIds = state.unlockedAreas || [1];
  const unlocked = AREAS.filter(a => unlockedIds.includes(a.id));
  _townViewArea = Math.max(0, Math.min(unlocked.length - 1, _townViewArea));
  const cur = unlocked[_townViewArea];

  // エリア背景
  document.getElementById('townArea').dataset.area = cur.id;

  // ナビゲーション更新
  const prevBtn = document.getElementById('townNavPrev');
  const nextBtn = document.getElementById('townNavNext');
  if (prevBtn) prevBtn.disabled = (_townViewArea === 0);
  if (nextBtn) nextBtn.disabled = (_townViewArea === unlocked.length - 1);
  _updateTownMeta(cur);

  // ひと稼ぎ（上段）
  const harvestRow = document.getElementById('harvestRow');
  harvestRow.innerHTML = '';
  harvestRow.style.cursor = 'pointer';
  const hNode = document.createElement('div');
  hNode.className = 'harvest-building';
  hNode.id = 'harvestSpot';
  hNode.innerHTML = `<div class="hv-coin">🪙</div>
    <div class="building-name">ひと稼ぎ</div>
    <div class="building-rate">タップ！</div>`;
  harvestRow.onclick = () => {
    manualHarvest();
    hNode.classList.add('harvest-click');
    setTimeout(() => hNode.classList.remove('harvest-click'), 300);
  };
  harvestRow.appendChild(hNode);

  // 建物列（下段）
  const row = document.getElementById('buildingsRow');
  row.innerHTML = '';
  const areaBuildings = BUILDINGS.filter(b => b.area === cur.id && (state.buildings[b.id]?.level || 0) > 0);
  areaBuildings.forEach((b, i) => row.appendChild(_mkBuildingEl(b, i)));

  if (areaBuildings.length === 0) {
    const hint = document.createElement('div');
    hint.className = 'town-hint';
    hint.textContent = '建設タブで建物を建ててみよう！';
    row.appendChild(hint);
  }

  // デコ列
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
  const bulkUnlocked = !!state.prestigeSkills?.unlock_bulk_lv;
  if (!bulkUnlocked) { bulkMode = 1; }
  if (bulkUnlocked) {
    [[1,'×1'],[10,'×10'],[100,'×100'],[0,'MAX']].forEach(([mode,label])=>{
      const btn=document.createElement('button');
      btn.className='bulk-btn'+(bulkMode===mode?' active':'');
      btn.textContent=label;
      btn.dataset.mode=mode;
      btn.onclick=()=>setBulkMode(mode);
      bulkBar.appendChild(btn);
    });
    grid.appendChild(bulkBar);
  }
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
          <div class="area-locked-info">${area.desc}</div>
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

    const totalBuildingCps = BUILDINGS.reduce((s,x)=>s+getBuildingCps(x),0);

    BUILDINGS.filter(b => b.area === area.id).forEach(b=>{
    if (!state.buildings[b.id]) state.buildings[b.id]={level:0};
    const lv=state.buildings[b.id].level;
    const cost=getBuildingCost(b);
    const isMax=lv>=maxLv;
    const bulk=!isMax?getBulkInfo(b):{count:0,totalCost:0};
    const canAfford=bulk.count>0;
    const bCps=getBuildingCps(b);
    const cpsPct=totalBuildingCps>0?(bCps/totalBuildingCps*100):0;
    const cpsLabel=lv>0?`<span class="item-cps-share">${fmt(bCps)}/秒 <span class="item-cps-pct">${cpsPct.toFixed(1)}%</span></span>`:'';

    const phase=getPhase(lv);
    const phaseLabel=getPhaseLabel(lv);

    let barPct=0;
    if(!isMax) {
      const prevPhaseMax = PHASES.find(p=>lv<=p.maxLv);
      const pStart = prevPhaseMax===PHASES[0]?0:PHASES[PHASES.indexOf(prevPhaseMax)-1]?.maxLv||0;
      const pEnd = Math.min(prevPhaseMax?.maxLv||100, maxLv);
      barPct=Math.min(100,((lv-pStart)/(pEnd-pStart))*100);
    }

    const sale=disc&&!isMax?`<span style="font-size:9px;color:#e53935;font-weight:800"> SALE</span>`:'';
    const bulkLabel=bulk.count>1?` +${bulk.count}Lv`:'';
    const btnCost=bulk.count>0?fmt(bulk.totalCost):fmt(cost);
    const btnText=isMax?`✨ MAX Lv${maxLv}`:lv===0?`🪙${btnCost} 建設${bulkLabel}`:`🪙${btnCost} 強化${bulkLabel}`;
    const btnClass=isMax?'maxed-btn':lv>0?'upgrade':'';

    const div=document.createElement('div');
    div.className='shop-item '+`${isMax?'maxed':canAfford?'affordable':''} ${phase.colorClass}`;
    div.innerHTML=`
      <div class="item-top">
        <span class="item-emoji">${b.emoji}</span>
        <div class="item-info">
          <div class="item-name">${b.name}${sale}</div>
          <div class="item-desc">${b.desc} · ${phaseLabel}</div>
        </div>
      </div>
      <div class="lv-bar-wrap ${phase.colorClass}">
        <div class="lv-bar-header">
          <span class="lv-label">Lv ${lv} / ${maxLv}</span>
          ${cpsLabel}
        </div>
        <div class="lv-bar-track"><div class="lv-bar-fill" style="width:${isMax?100:barPct}%"></div></div>
      </div>
      <button class="btn-buy ${btnClass}" onclick="buyBuilding('${b.id}')" ${isMax||(!isMax&&!canAfford)?'disabled':''}>${btnText}</button>
    `;
    grid.appendChild(div);
    });
  });
}

function _makeAchievCard(a) {
  const ok = !!state.achievements[a.id];
  const isHidden = !!a.hidden && !ok;
  const div = document.createElement('div');
  div.className = 'achiev-card' + (ok ? ' unlocked' : ' locked') + (isHidden ? ' hidden-achiev' : '');
  div.innerHTML = `<div class="achiev-icon">${isHidden ? '❓' : a.icon}</div><div>
    <div class="achiev-name">${isHidden ? '???' : a.name}</div>
    <div class="achiev-desc">${ok ? a.desc : (isHidden ? '隠し実績 — 解除条件は秘密です' : '???')}</div>
    <div class="achiev-reward">🎁 ${ok ? a.reward : '???'}</div>
    ${ok ? '<span class="unlocked-stamp">✅ 解除済み</span>' : ''}
  </div>`;
  return div;
}

function renderAchiev() {
  const normal  = ACHIEVEMENTS.filter(a => !a.hidden);
  const hidden  = ACHIEVEMENTS.filter(a =>  a.hidden);
  const unlocked = ACHIEVEMENTS.filter(a => state.achievements[a.id]).length;
  document.getElementById('achievSummary').textContent = `${unlocked} / ${ACHIEVEMENTS.length} 件解除`;

  const grid = document.getElementById('achievGrid');
  grid.innerHTML = '';

  const makeSection = (title, list) => {
    const sec = document.createElement('div');
    sec.className = 'achiev-section';
    const hdr = document.createElement('div');
    hdr.className = 'achiev-section-title';
    hdr.textContent = title;
    sec.appendChild(hdr);
    list.forEach(a => sec.appendChild(_makeAchievCard(a)));
    grid.appendChild(sec);
  };

  makeSection('🏅 通常実績', normal);
  makeSection('🔍 隠し実績', hidden);
}


function renderRecord() {
  const el = document.getElementById('recordGrid');
  const fmtSec = s => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}時間${m}分`;
    return `${m}分`;
  };
  const fmtDate = ts => {
    if (!ts) return '—';
    const d = new Date(ts);
    return `${d.getFullYear()}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}`;
  };
  const achievCount = Object.values(state.achievements || {}).filter(Boolean).length;
  const totalLv = BUILDINGS.reduce((s, b) => s + (state.buildings[b.id]?.level || 0), 0);
  const unlockedAreaCount = (state.unlockedAreas || [1]).length;

  const rows = [
    { icon:'📅', label:'プレイ開始日', value: fmtDate(state.firstPlayedAt) },
    { icon:'⏱️', label:'総プレイ時間', value: fmtSec(state.totalPlaySecs || 0) },
    { icon:'🪙', label:'総収入（今世代）', value: fmt(state.totalEarned || 0) },
    { icon:'💫', label:'総収入（全世代合計）', value: fmt((state.allTimeTotalEarned || 0) + (state.totalEarned || 0)) },
    { icon:'💸', label:'総支出', value: fmt(state.totalSpent || 0) },
    { icon:'👆', label:'総ひと稼ぎ回数', value: `${(state.totalHarvestCount || 0).toLocaleString()} 回` },
    { icon:'⚡', label:'最高CPS', value: fmt(state.maxCps || 0) + '/秒' },
    { icon:'💰', label:'最高所持コイン', value: fmt(state.maxCoins || 0) },
    { icon:'⭐', label:'転生回数', value: `${state.prestigeCount || 0} 回` },
    { icon:'🏅', label:'実績解除数', value: `${achievCount} / ${ACHIEVEMENTS.length} 件` },
    { icon:'🏗️', label:'建物総レベル', value: `Lv ${totalLv.toLocaleString()}` },
    { icon:'🗺️', label:'解放エリア数', value: `${unlockedAreaCount} / ${AREAS.length} エリア` },
    { icon:'🎪', label:'イベント発生数', value: `${state.eventCount || 0} 回` },
  ];

  el.innerHTML = rows.map(r => `
    <div class="record-row">
      <span class="record-icon">${r.icon}</span>
      <span class="record-label">${r.label}</span>
      <span class="record-value">${r.value}</span>
    </div>`).join('');
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
  const btn=document.getElementById('harvestSpot'), r=btn.getBoundingClientRect();
  const el=document.createElement('div'); el.className='float-coin';
  el.textContent=`🪙${text}`; el.style.left=(r.left+r.width/2-20)+'px'; el.style.top=(r.top-10)+'px';
  document.body.appendChild(el); setTimeout(()=>el.remove(),1300);
}
