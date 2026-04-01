// ══════════════════════════════
//  UI描画（render系関数）
//  依存: ui-helpers.js, 全システムファイル
// ══════════════════════════════

// ── 町ビュー ──
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

  document.getElementById('townArea').dataset.area = cur.id;

  const prevBtn = document.getElementById('townNavPrev');
  const nextBtn = document.getElementById('townNavNext');
  if (prevBtn) prevBtn.disabled = (_townViewArea === 0);
  if (nextBtn) nextBtn.disabled = (_townViewArea === unlocked.length - 1);
  _updateTownMeta(cur);

  // ひと稼ぎ
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

  // 建物列
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
  const areaBuildingIds = BUILDINGS.filter(b => b.area === cur.id && (state.buildings[b.id]?.level || 0) > 0).map(b => b.id);
  const areaDecos = areaBuildingIds.flatMap(bId => (state.decoSlots || {})[bId] || [])
    .map(decoId => DECORATIONS.find(d => d.id === decoId))
    .filter(Boolean);
  if (areaDecos.length > 0) {
    const dr = document.createElement('div');
    dr.id = 'decoRow';
    dr.style.cssText = 'display:flex;gap:6px;justify-content:center;flex-wrap:wrap;position:relative;z-index:1;margin-top:4px';
    dr.innerHTML = areaDecos.map(d => `<span style="font-size:26px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.15))" title="${d.name}">${d.emoji}</span>`).join('');
    document.getElementById('townArea').appendChild(dr);
  }
}

// ── ショップ ──
function renderShop() {
  const grid=document.getElementById('shopGrid'); grid.innerHTML='';

  const bulkWrap = document.getElementById('bulkBarWrap');
  bulkWrap.innerHTML = '';
  const bulkUnlocked = !!state.prestigeSkills?.unlock_bulk_lv;
  if (!bulkUnlocked) { bulkMode = 1; }
  if (bulkUnlocked) {
    const bulkBar=document.createElement('div');
    bulkBar.className='bulk-bar';
    [[1,'×1'],[10,'×10'],[100,'×100'],[0,'MAX']].forEach(([mode,label])=>{
      const btn=document.createElement('button');
      btn.className='bulk-btn'+(bulkMode===mode?' active':'');
      btn.textContent=label;
      btn.dataset.mode=mode;
      btn.onclick=()=>setBulkMode(mode);
      bulkBar.appendChild(btn);
    });
    bulkWrap.appendChild(bulkBar);
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
      ${lv > 0 ? (() => {
        const decoSlots = (state.decoSlots || {})[b.id] || [];
        const hasDeco = decoSlots.length > 0;
        return `<button class="btn-deco-open${hasDeco ? ' has-deco' : ''}" onclick="openDecoModal('${b.id}')">🌺 飾り ${decoSlots.length}/3</button>`;
      })() : ''}
      ${lv > 0 && MINIGAMES[b.id] && MINIGAME_META[b.id] ? (() => {
        const meta = MINIGAME_META[b.id];
        return `<button class="btn-minigame" onclick="${meta.fn}()">${meta.emoji} ${meta.label}</button>`;
      })() : ''}
    `;
    grid.appendChild(div);
    });
  });
}

// ── 実績 ──
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

const _achievCollapsed = new Set();

function renderAchiev() {
  const unlocked = ACHIEVEMENTS.filter(a => state.achievements[a.id]).length;
  document.getElementById('achievSummary').textContent = `${unlocked} / ${ACHIEVEMENTS.length} 件解除`;

  const grid = document.getElementById('achievGrid');
  grid.innerHTML = '';

  ACHIEV_CATEGORIES.forEach(cat => {
    const list = ACHIEVEMENTS.filter(a => a.cat === cat.id);
    if (list.length === 0) return;
    const unlockedInCat = list.filter(a => state.achievements[a.id]).length;
    const isCollapsed = _achievCollapsed.has(cat.id);

    const sec = document.createElement('div');
    sec.className = 'achiev-section' + (isCollapsed ? ' collapsed' : '');

    const hdr = document.createElement('div');
    hdr.className = 'achiev-section-title';
    hdr.innerHTML = `<span>${cat.label}　<span style="font-weight:400;font-size:11px;color:var(--muted)">${unlockedInCat}/${list.length}</span></span><span class="achiev-toggle-arrow">▼</span>`;
    hdr.addEventListener('click', () => {
      if (_achievCollapsed.has(cat.id)) _achievCollapsed.delete(cat.id);
      else _achievCollapsed.add(cat.id);
      renderAchiev();
    });
    sec.appendChild(hdr);

    const cards = document.createElement('div');
    cards.className = 'achiev-cards';
    list.forEach(a => cards.appendChild(_makeAchievCard(a)));
    sec.appendChild(cards);

    grid.appendChild(sec);
  });
}

// ── 記録 ──
function renderRecord() {
  const el = document.getElementById('recordGrid');

  const fmtSec = s => {
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    if (d > 0) return `${d}日${h}時間${m}分`;
    if (h > 0) return `${h}時間${m}分`;
    return `${m}分`;
  };
  const fmtDate = ts => {
    if (!ts) return '—';
    const d = new Date(ts);
    return `${d.getFullYear()}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}`;
  };
  const row = (icon, label, value) =>
    `<div class="record-row"><span class="record-icon">${icon}</span><span class="record-label">${label}</span><span class="record-value">${value}</span></div>`;
  const barRow = (icon, label, value, pct, colorClass = '') =>
    `<div class="record-row"><span class="record-icon">${icon}</span>
      <div class="record-label-wrap">
        <div class="record-label-bar"><span class="record-label">${label}</span><span class="record-value">${value}</span></div>
        <div class="record-bar-track"><div class="record-bar-fill ${colorClass}" style="width:${Math.min(100, pct).toFixed(1)}%"></div></div>
      </div></div>`;
  const section = (title, content) =>
    `<div class="record-section"><div class="record-section-title">${title}</div>${content}</div>`;

  // 集計
  const achievCount     = Object.values(state.achievements || {}).filter(Boolean).length;
  const totalLv         = BUILDINGS.reduce((s, b) => s + (state.buildings[b.id]?.level || 0), 0);
  const unlockedAreaCount = (state.unlockedAreas || [1]).length;
  const skillCount      = Object.keys(state.skills || {}).length;
  const pskillCount     = Object.keys(state.prestigeSkills || {}).length;
  const researchCount   = Object.keys(state.research || {}).length;
  const decoOwnedCount  = Object.keys(state.decoOwned || {}).filter(id => state.decoOwned[id]).length;
  const lv100Count      = BUILDINGS.filter(b => (state.buildings[b.id]?.level || 0) >= 100).length;
  const highestB        = BUILDINGS.reduce((best, b) =>
    (state.buildings[b.id]?.level || 0) > (state.buildings[best.id]?.level || 0) ? b : best, BUILDINGS[0]);
  const highestLv       = state.buildings[highestB.id]?.level || 0;
  const top3            =[...BUILDINGS]
    .filter(b => (state.buildings[b.id]?.level || 0) > 0)
    .sort((a, b) => getBuildingCps(b) - getBuildingCps(a))
    .slice(0, 3);
  const totalCps        = getCps();
  const achievPct       = ACHIEVEMENTS.length > 0 ? achievCount / ACHIEVEMENTS.length * 100 : 0;
  const areaPct         = unlockedAreaCount / AREAS.length * 100;

  let html = '';

  // ── プレイ記録 ──
  html += section('📅 プレイ記録',
    row('📅', 'プレイ開始日', fmtDate(state.firstPlayedAt)) +
    row('⏱️', '総プレイ時間', fmtSec(state.totalPlaySecs || 0)) +
    row('🪙', '今世代累計収入', fmt(state.totalEarned || 0)) +
    row('💫', '全世代累計収入', fmt((state.allTimeTotalEarned || 0) + (state.totalEarned || 0))) +
    row('💸', '累計支出', fmt(state.totalSpent || 0)) +
    row('👆', 'ひと稼ぎ回数', `${(state.totalHarvestCount || 0).toLocaleString()} 回`) +
    row('🔥', 'デイリー連続記録', `${state.daily?.streak || 0} 日`) +
    row('🎁', 'デイリーボーナス受取', `${state.daily?.totalClaimed || 0} 回`)
  );

  // ── 収益記録 ──
  html += section('⚡ 収益記録',
    row('⚡', '最高CPS', `${fmt(state.maxCps || 0)} /秒`) +
    row('📈', '現在CPS', `${fmt(getEffectiveCps())} /秒`) +
    row('💰', '最高所持コイン', fmt(state.maxCoins || 0))
  );

  // ── CPS貢献トップ施設 ──
  if (top3.length > 0) {
    const medals = ['🥇', '🥈', '🥉'];
    const topHtml = top3.map((b, i) => {
      const cps = getBuildingCps(b);
      const pct = totalCps > 0 ? cps / totalCps * 100 : 0;
      return `<div class="record-top-building">
        <span class="record-top-rank">${medals[i]}</span>
        <span class="record-top-emoji">${b.emoji}</span>
        <div class="record-top-info">
          <div class="record-top-name">${b.name} <span class="record-top-lv">Lv${state.buildings[b.id].level}</span></div>
          <div class="record-top-bar-track"><div class="record-top-bar-fill" style="width:${Math.min(100,pct).toFixed(1)}%"></div></div>
        </div>
        <span class="record-top-cps">${fmt(cps)}/秒<span class="record-top-pct">${pct.toFixed(1)}%</span></span>
      </div>`;
    }).join('');
    html += section('🏆 CPS貢献トップ施設', topHtml);
  }

  // ── 施設記録 ──
  html += section('🏗️ 施設記録',
    row('🏗️', '建物総レベル', `${totalLv.toLocaleString()} Lv`) +
    row('👑', '最高Lv施設', highestLv > 0 ? `${highestB.emoji}${highestB.name} Lv${highestLv}` : '—') +
    row('💎', 'Lv100以上の施設', `${lv100Count} 棟`) +
    barRow('🗺️', '解放エリア数', `${unlockedAreaCount} / ${AREAS.length}`, areaPct, 'record-bar-blue')
  );

  // ── 育成記録 ──
  html += section('📚 育成記録',
    row('⭐', '転生回数', `${state.prestigeCount || 0} 回`) +
    row('🌟', 'スキル習得数', `${skillCount} 個`) +
    row('👑', '世代スキル習得数', `${pskillCount} 個`) +
    row('🔬', '研究完了数', `${researchCount} 件`) +
    row('🌺', '飾り所持数', `${decoOwnedCount} 個`) +
    row('🎪', 'イベント発生数', `${state.eventCount || 0} 回`)
  );

  // ── 実績 ──
  html += section('🏅 実績',
    barRow('🏅', `解除数 ${achievCount} / ${ACHIEVEMENTS.length}`, `${achievPct.toFixed(1)}%`, achievPct, 'record-bar-gold')
  );

  el.innerHTML = html;
}

// ── 統合レンダリング ──
function render() { renderStats(); renderTown(); renderShop(); renderSeason(); renderWeekendBadge(); updateEventBadge(); }
