// ══════════════════════════════
//  デコレーションシステム（施設設置型）
// ══════════════════════════════

// 設置数に基づく美観スコア（設置1つにつき5pt）
function getBeautyScore() {
  let total = 0;
  Object.values(state.decoSlots || {}).forEach(slots => {
    total += (slots || []).length;
  });
  return total * 5;
}
function getBeautyMult() { return (1 + getBeautyScore() * 0.01) * getSkillBeautyMult(); }

// buildings.jsとの後方互換（area効果はgetDecoBuildingMultに統合）
function getDecoAreaMult(_areaId) { return 1; }

// 建物ごとのデコレーション倍率
function getDecoBuildingMult(buildingId) {
  const b = BUILDINGS.find(x => x.id === buildingId);
  if (!b) return 1;
  const dm = 1 + getSkillEffect('deco_mult');
  let bonus = 0;
  Object.entries(state.decoSlots || {}).forEach(([bId, slots]) => {
    const pb = BUILDINGS.find(x => x.id === bId);
    if (!pb || !slots) return;
    slots.forEach(decoId => {
      const d = DECORATIONS.find(x => x.id === decoId);
      if (!d) return;
      switch (d.effect.type) {
        case 'self_cps':
          if (bId === buildingId && (!d.target || d.target === bId)) bonus += d.effect.value;
          break;
        case 'area_cps':
          if (pb.area === b.area) bonus += d.effect.value;
          break;
        case 'global_cps':
          bonus += d.effect.value;
          break;
      }
    });
  });
  return 1 + bonus * dm;
}

// 手動収穫ボーナス
function getDecoCollectMult() {
  const dm = 1 + getSkillEffect('deco_mult');
  let bonus = 0;
  Object.values(state.decoSlots || {}).forEach(slots => {
    (slots || []).forEach(decoId => {
      const d = DECORATIONS.find(x => x.id === decoId);
      if (d && d.effect.type === 'collect') bonus += d.effect.value;
    });
  });
  return 1 + bonus * dm;
}

// イベントボーナス（互換維持・新システムでは未使用）
function getDecoEventBonus() { return 0; }

// ── 購入 ──
function buyDecoration(id) {
  const d = DECORATIONS.find(x => x.id === id);
  if (!d) return;
  if (d.focusOnly && !state.prestigeSkills?.deco_focus) return;
  if (!state.decoOwned) state.decoOwned = {};
  if (state.decoOwned[id]) return;
  if (state.coins < d.cost) return;
  state.coins -= d.cost;
  state.totalSpent = (state.totalSpent || 0) + d.cost;
  state.decoOwned[id] = true;
  spawnFloatCoins(`-${fmt(d.cost)}`);
  playUnlockSfx();
  addLog(`🌺 ${d.emoji}${d.name}を入手！ショップの「飾り」ボタンから施設に設置しよう`);
  renderDeco();
  render();
}

// ── 配置 ──
function placeDecoration(buildingId, decoId) {
  if (!state.decoOwned?.[decoId]) return;
  if (!state.decoSlots) state.decoSlots = {};
  // 既存の配置先から除去
  Object.keys(state.decoSlots).forEach(bId => {
    state.decoSlots[bId] = (state.decoSlots[bId] || []).filter(id => id !== decoId);
  });
  if (!state.decoSlots[buildingId]) state.decoSlots[buildingId] = [];
  if (state.decoSlots[buildingId].length >= 3) {
    addLog('⚠️ スロットが満杯です（最大3つ）');
    return;
  }
  state.decoSlots[buildingId].push(decoId);
  const b = BUILDINGS.find(x => x.id === buildingId);
  const d = DECORATIONS.find(x => x.id === decoId);
  addLog(`🌺 ${d.emoji}${d.name}を${b.emoji}${b.name}に設置！`);
  renderDecoModal(buildingId);
  renderDeco();
  render();
}

// ── 取り外し ──
function removeDecoration(buildingId, decoId) {
  if (!state.decoSlots?.[buildingId]) return;
  state.decoSlots[buildingId] = state.decoSlots[buildingId].filter(id => id !== decoId);
  renderDecoModal(buildingId);
  renderDeco();
  render();
}

// ── 配置モーダル（施設から開く）──
let _decoModalBuildingId = null;

function openDecoModal(buildingId) {
  _decoModalBuildingId = buildingId;
  document.getElementById('decoModal').classList.add('show');
  renderDecoModal(buildingId);
}

function closeDecoModal() {
  document.getElementById('decoModal').classList.remove('show');
  _decoModalBuildingId = null;
}

function renderDecoModal(buildingId) {
  const modal = document.getElementById('decoModal');
  if (!modal?.classList.contains('show')) return;
  const b = BUILDINGS.find(x => x.id === buildingId);
  if (!b) return;

  const slots = (state.decoSlots || {})[buildingId] || [];
  document.getElementById('decoModalTitle').textContent = `${b.emoji} ${b.name} の飾り`;

  // ── 現在のスロット ──
  const slotsEl = document.getElementById('decoModalSlots');
  slotsEl.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const decoId = slots[i];
    const d = decoId ? DECORATIONS.find(x => x.id === decoId) : null;
    const div = document.createElement('div');
    div.className = `deco-slot ${d ? 'filled' : 'empty'}`;
    if (d) {
      const isWrongTarget = d.target && d.target !== buildingId;
      const targetB = d.target ? BUILDINGS.find(x => x.id === d.target) : null;
      div.innerHTML = `
        <span class="deco-slot-emoji">${d.emoji}</span>
        <div class="deco-slot-info">
          <div class="deco-slot-name">${d.name}</div>
          <div class="deco-slot-effect">${isWrongTarget
            ? `<span class="deco-wrong-target">⚠️ 効果なし（${targetB?.emoji}${targetB?.name}専用）</span>`
            : d.effectDesc}</div>
        </div>
        <button class="btn-deco-remove" onclick="removeDecoration('${buildingId}','${decoId}')">✕</button>`;
    } else {
      div.innerHTML = `<span class="deco-slot-empty-label">スロット ${i + 1}（空き）</span>`;
    }
    slotsEl.appendChild(div);
  }

  // ── 配置可能な飾り ──
  const availEl = document.getElementById('decoModalAvail');
  availEl.innerHTML = '';
  const owned = Object.keys(state.decoOwned || {}).filter(id => state.decoOwned[id]);
  const canPlace = slots.length < 3;

  // 未配置
  const unplaced = owned.filter(id => {
    return !Object.values(state.decoSlots || {}).some(s => (s || []).includes(id));
  });

  // 他の施設に配置中
  const elsewhere = owned.filter(id => {
    const bId = Object.keys(state.decoSlots || {}).find(bid =>
      bid !== buildingId && (state.decoSlots[bid] || []).includes(id)
    );
    return !!bId;
  });

  if (unplaced.length === 0 && elsewhere.length === 0) {
    availEl.innerHTML = '<div class="deco-modal-empty">所持中の飾りがありません。飾りタブから購入しよう！</div>';
  }

  if (unplaced.length > 0) {
    const hdr = document.createElement('div');
    hdr.className = 'deco-modal-section-title';
    hdr.textContent = '未配置の飾り';
    availEl.appendChild(hdr);
    unplaced.forEach(decoId => {
      const d = DECORATIONS.find(x => x.id === decoId);
      if (!d) return;
      const isWrongTarget = d.target && d.target !== buildingId;
      const targetB = d.target ? BUILDINGS.find(x => x.id === d.target) : null;
      const div = document.createElement('div');
      div.className = `deco-avail-item${isWrongTarget ? ' wrong-target' : ''}`;
      div.innerHTML = `
        <span class="deco-slot-emoji">${d.emoji}</span>
        <div class="deco-slot-info">
          <div class="deco-slot-name">${d.name}</div>
          <div class="deco-slot-effect">${d.effectDesc}${isWrongTarget ? ` <span class="deco-wrong-target">⚠️ ${targetB?.emoji}${targetB?.name}に設置で効果発動</span>` : ''}</div>
        </div>
        <button class="btn-deco-place${isWrongTarget ? ' no-effect' : ''}" onclick="placeDecoration('${buildingId}','${decoId}')" ${canPlace ? '' : 'disabled'}>
          ${canPlace ? (isWrongTarget ? '配置（効果なし）' : '配置') : '満杯'}
        </button>`;
      availEl.appendChild(div);
    });
  }

  if (elsewhere.length > 0) {
    const hdr = document.createElement('div');
    hdr.className = 'deco-modal-section-title';
    hdr.textContent = '他の施設に設置中（移動可能）';
    availEl.appendChild(hdr);
    elsewhere.forEach(decoId => {
      const d = DECORATIONS.find(x => x.id === decoId);
      if (!d) return;
      const curBId = Object.keys(state.decoSlots || {}).find(bid =>
        (state.decoSlots[bid] || []).includes(decoId)
      );
      const curB = BUILDINGS.find(x => x.id === curBId);
      const isWrongTarget = d.target && d.target !== buildingId;
      const targetB = d.target ? BUILDINGS.find(x => x.id === d.target) : null;
      const div = document.createElement('div');
      div.className = `deco-avail-item placed-elsewhere${isWrongTarget ? ' wrong-target' : ''}`;
      div.innerHTML = `
        <span class="deco-slot-emoji">${d.emoji}</span>
        <div class="deco-slot-info">
          <div class="deco-slot-name">${d.name}</div>
          <div class="deco-slot-effect">${d.effectDesc}
            <span class="deco-cur-building">📍 ${curB?.emoji}${curB?.name}</span>
            ${isWrongTarget ? `<span class="deco-wrong-target">⚠️ ${targetB?.emoji}${targetB?.name}で効果発動</span>` : ''}
          </div>
        </div>
        <button class="btn-deco-place move${isWrongTarget ? ' no-effect' : ''}" onclick="placeDecoration('${buildingId}','${decoId}')" ${canPlace ? '' : 'disabled'}>
          ${canPlace ? (isWrongTarget ? '移動（効果なし）' : '移動') : '満杯'}
        </button>`;
      availEl.appendChild(div);
    });
  }
}

// ── デコレーションタブ（カタログ表示）──
function renderDeco() {
  const grid = document.getElementById('decoGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const score = getBeautyScore();
  document.getElementById('beautyScore').textContent = score;
  document.getElementById('beautyBonus').textContent = score;

  const owned = state.decoOwned || {};
  const focusUnlocked = !!state.prestigeSkills?.deco_focus;

  // 通常飾りと特化飾りに分ける
  const normal = DECORATIONS.filter(d => !d.focusOnly);
  const focus  = DECORATIONS.filter(d =>  d.focusOnly);

  // 通常飾り：所持済みを先に、次にコスト順
  const sortedNormal = [...normal].sort((a, b) => {
    const ao = !!owned[a.id], bo = !!owned[b.id];
    if (ao !== bo) return ao ? -1 : 1;
    return a.cost - b.cost;
  });

  sortedNormal.forEach(d => _renderDecoItem(d, grid, owned));

  // 施設特化セクション
  const focusHdr = document.createElement('div');
  focusHdr.className = 'deco-focus-header';
  focusHdr.innerHTML = `
    <span>🎯 施設特化飾り</span>
    <span class="deco-focus-badge ${focusUnlocked ? 'unlocked' : 'locked'}">
      ${focusUnlocked ? '✅ 解放済み' : '🔒 転生スキル「飾りの極意」で解放'}
    </span>`;
  grid.appendChild(focusHdr);

  const sortedFocus = [...focus].sort((a, b) => {
    const ao = !!owned[a.id], bo = !!owned[b.id];
    if (ao !== bo) return ao ? -1 : 1;
    return a.cost - b.cost;
  });
  sortedFocus.forEach(d => _renderDecoItem(d, grid, owned, focusUnlocked));
}

function _renderDecoItem(d, grid, owned, focusUnlocked = true) {
  const isOwned = !!owned[d.id];
  const isLocked = d.focusOnly && !focusUnlocked;
  const canAfford = !isOwned && !isLocked && state.coins >= d.cost;

  let placedAt = '';
  if (isOwned) {
    const bId = Object.keys(state.decoSlots || {}).find(bid =>
      (state.decoSlots[bid] || []).includes(d.id)
    );
    if (bId) {
      const b = BUILDINGS.find(x => x.id === bId);
      placedAt = b ? `${b.emoji}${b.name}` : '';
    }
  }

  const div = document.createElement('div');
  div.className = `deco-item ${isOwned ? 'owned' : canAfford ? 'affordable' : ''} ${isLocked ? 'focus-locked' : ''}`;
  div.dataset.decoId = d.id;
  const targetB = d.target ? BUILDINGS.find(x => x.id === d.target) : null;
  div.innerHTML = `
    <div class="deco-item-top">
      <span class="deco-emoji">${isLocked ? '🔒' : d.emoji}</span>
      <div>
        <div class="deco-name">${d.name}</div>
        <div class="deco-desc">${isLocked ? '施設特化飾り（要：飾りの極意）' : d.desc}</div>
      </div>
    </div>
    ${targetB && !isLocked ? `<div class="deco-target-label">🎯 対象施設：${targetB.emoji}${targetB.name}</div>` : ''}
    <div class="deco-synergy">🔗 ${isLocked ? '???' : d.effectDesc}</div>
    ${isOwned
      ? `<div class="deco-placed-info">${placedAt ? `📍 ${placedAt}に設置中` : '⚪ 未配置'}</div>`
      : isLocked
        ? `<button class="btn-buy" disabled>🔒 解放が必要</button>`
        : `<button class="btn-buy" onclick="buyDecoration('${d.id}')" ${canAfford ? '' : 'disabled'}>
             🪙${fmt(d.cost)} 購入
           </button>`
    }`;
  grid.appendChild(div);
}
