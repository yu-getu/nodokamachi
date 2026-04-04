// ══════════════════════════════
//  デコレーションシステム（施設設置型）
// ══════════════════════════════

// スロット上限（スロット拡張解放で4に増加）
function getMaxDecoSlots() {
  return state.prestigeSkills?.deco_slot_extend ? 4 : 3;
}

// ── 飾り一括配置 ──
function bulkPlaceDecorations() {
  const maxSlots = getMaxDecoSlots();
  const owned = Object.keys(state.decoOwned || {}).filter(id => state.decoOwned[id]);
  // 未配置の飾りを効果値降順でソート（対象施設専用は後回し）
  const unplaced = owned
    .filter(id => !Object.values(state.decoSlots || {}).some(s => (s || []).includes(id)))
    .sort((a, b) => {
      const da = findDeco(a), db = findDeco(b);
      const aTarget = da?.target ? 0 : 1, bTarget = db?.target ? 0 : 1;
      if (aTarget !== bTarget) return bTarget - aTarget; // 汎用を先に
      return (db?.effect?.value || 0) - (da?.effect?.value || 0);
    });

  if (unplaced.length === 0) { addLog('🌺 未配置の飾りはありません'); return; }

  const unlockedAreas = state.unlockedAreas || [1];
  let placed = 0;
  if (!state.decoSlots) state.decoSlots = {};

  unplaced.forEach(decoId => {
    const d = findDeco(decoId);
    if (!d) return;
    // 対象施設指定ありはその施設のみ候補
    const candidates = BUILDINGS.filter(b => {
      if (!unlockedAreas.includes(b.area)) return false;
      if ((state.buildings?.[b.id]?.level || 0) <= 0) return false;
      if (d.target && d.target !== b.id) return false;
      return ((state.decoSlots[b.id] || []).length < maxSlots);
    });
    if (candidates.length === 0) return;
    // 効果種別に応じてベストな施設を選ぶ（self_cps は最高レベル施設優先）
    const target = candidates.sort((a, b) =>
      (state.buildings?.[b.id]?.level || 0) - (state.buildings?.[a.id]?.level || 0)
    )[0];
    if (!state.decoSlots[target.id]) state.decoSlots[target.id] = [];
    state.decoSlots[target.id].push(decoId);
    placed++;
  });

  addLog(`🏗️ 飾りを一括配置しました（${placed}個）`);
  renderDeco();
  render();
  saveGame();
}

// ── 飾りレベルアップ ──
const DECO_MAX_LEVEL = 10;

function getDecoLevel(decoId) {
  return (state.decoLevels || {})[decoId] || 1;
}

// Lv(n+1)へのコスト = deco.cost × 50000 × 40^(n-1)
function getDecoLevelUpCost(deco, targetLevel) {
  return Math.floor(deco.cost * 50000 * Math.pow(40, targetLevel - 2));
}

function levelUpDecoration(decoId) {
  if (!state.prestigeSkills?.deco_levelup) return;
  const d = findDeco(decoId);
  if (!d) return;
  const cur = getDecoLevel(decoId);
  if (cur >= DECO_MAX_LEVEL) { addLog('⚠️ 最大レベルに達しています'); return; }
  const cost = getDecoLevelUpCost(d, cur + 1);
  if (state.coins < cost) { addLog(`⚠️ コインが足りません（必要：${fmt(cost)}）`); return; }
  state.coins -= cost;
  state.totalSpent = (state.totalSpent || 0) + cost;
  if (!state.decoLevels) state.decoLevels = {};
  state.decoLevels[decoId] = cur + 1;
  spawnFloatCoins(`-${fmt(cost)}`);
  addLog(`⬆️ ${d.emoji}${d.name} を Lv${cur + 1} に強化！（効果×${cur + 1}）`);
  renderDeco();
  render();
  saveGame();
}

// 通常 + 時代の証 両方を検索するヘルパー
function findDeco(id) {
  return DECORATIONS.find(x => x.id === id) || LEGACY_DECORATIONS.find(x => x.id === id) || null;
}

// 時代の証が設置されている場合、baseCps に掛ける追加レート（Lv×value）を返す
function getLegacyBaseCpsRate(buildingId, lv) {
  const legacyId = `legacy_${buildingId}`;
  if (!(state.decoOwned || {})[legacyId]) return 0;
  const placed = ((state.decoSlots || {})[buildingId] || []).includes(legacyId);
  if (!placed) return 0;
  const d = LEGACY_DECORATIONS.find(x => x.id === legacyId);
  return d ? d.effect.value * lv : 0;
}

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
  const unlockedAreas = state.unlockedAreas || [1];
  let bonus = 0;
  Object.entries(state.decoSlots || {}).forEach(([bId, slots]) => {
    const pb = BUILDINGS.find(x => x.id === bId);
    if (!pb || !slots) return;
    if ((state.buildings?.[bId]?.level || 0) <= 0) return;
    if (!unlockedAreas.includes(pb.area)) return;
    slots.forEach(decoId => {
      const d = findDeco(decoId);
      if (!d) return;
      const lv = getDecoLevel(decoId);
      const val = d.effect.value * lv;
      switch (d.effect.type) {
        case 'self_cps':
          if (bId === buildingId && (!d.target || d.target === bId)) bonus += val;
          break;
        case 'area_cps':
          if (pb.area === b.area) bonus += val;
          break;
        case 'global_cps':
          bonus += val;
          break;
      }
    });
  });
  return 1 + bonus * dm;
}

// 手動収穫ボーナス
function getDecoCollectMult() {
  const dm = 1 + getSkillEffect('deco_mult');
  const unlockedAreas = state.unlockedAreas || [1];
  let bonus = 0;
  Object.entries(state.decoSlots || {}).forEach(([bId, slots]) => {
    const pb = BUILDINGS.find(x => x.id === bId);
    if (!pb || !slots) return;
    if ((state.buildings?.[bId]?.level || 0) <= 0) return;
    if (!unlockedAreas.includes(pb.area)) return;
    slots.forEach(decoId => {
      const d = findDeco(decoId);
      if (d && d.effect.type === 'collect') bonus += d.effect.value * getDecoLevel(decoId);
    });
  });
  return 1 + bonus * dm;
}

// イベントボーナス（互換維持・新システムでは未使用）
function getDecoEventBonus() { return 0; }

// ── 購入 ──
function buyDecoration(id) {
  const d = findDeco(id);
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
  if (state.decoSlots[buildingId].length >= getMaxDecoSlots()) {
    addLog(`⚠️ スロットが満杯です（最大${getMaxDecoSlots()}つ）`);
    return;
  }
  state.decoSlots[buildingId].push(decoId);
  const b = BUILDINGS.find(x => x.id === buildingId);
  const d = findDeco(decoId);
  addLog(`🌺 ${d.emoji}${d.name}を${b.emoji}${b.name}に設置！`);
  if (_decoModalBuildingId) renderDecoModal(_decoModalBuildingId);
  if (_decoSelectDecoId) renderDecoSelectModal(_decoSelectDecoId);
  renderDeco();
  render();
}

// ── 取り外し ──
function removeDecoration(buildingId, decoId) {
  if (!state.decoSlots?.[buildingId]) return;
  state.decoSlots[buildingId] = state.decoSlots[buildingId].filter(id => id !== decoId);
  renderDecoModal(buildingId);
  if (_decoSelectDecoId) renderDecoSelectModal(_decoSelectDecoId);
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
  for (let i = 0; i < getMaxDecoSlots(); i++) {
    const decoId = slots[i];
    const d = decoId ? findDeco(decoId) : null;
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
  const canPlace = slots.length < getMaxDecoSlots();

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

  // 効果値の高い順にソート
  const byEffectDesc = (a, b) => (findDeco(b)?.effect?.value || 0) - (findDeco(a)?.effect?.value || 0);
  unplaced.sort(byEffectDesc);
  elsewhere.sort(byEffectDesc);

  if (unplaced.length === 0 && elsewhere.length === 0) {
    availEl.innerHTML = '<div class="deco-modal-empty">所持中の飾りがありません。飾りタブから購入しよう！</div>';
  }

  if (unplaced.length > 0) {
    const hdr = document.createElement('div');
    hdr.className = 'deco-modal-section-title';
    hdr.textContent = '未配置の飾り';
    availEl.appendChild(hdr);
    unplaced.forEach(decoId => {
      const d = findDeco(decoId);
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
      const d = findDeco(decoId);
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

// ── 飾りタブからの配置先選択モーダル ──
let _decoSelectDecoId = null;

function openDecoSelectModal(decoId) {
  _decoSelectDecoId = decoId;
  document.getElementById('decoSelectModal').classList.add('show');
  renderDecoSelectModal(decoId);
}

function closeDecoSelectModal() {
  document.getElementById('decoSelectModal').classList.remove('show');
  _decoSelectDecoId = null;
}

function renderDecoSelectModal(decoId) {
  const d = findDeco(decoId);
  if (!d) return;

  document.getElementById('decoSelectEmoji').textContent = d.emoji;
  document.getElementById('decoSelectTitle').textContent = `${d.name} の配置先`;
  document.getElementById('decoSelectEffect').textContent = d.effectDesc;

  const list = document.getElementById('decoSelectList');
  list.innerHTML = '';

  // 現在この飾りが置かれている施設ID
  const currentBId = Object.keys(state.decoSlots || {}).find(bid =>
    (state.decoSlots[bid] || []).includes(decoId)
  );

  // 解放済みエリアかつレベル>0の建物のみ表示
  const unlockedAreas = state.unlockedAreas || [1];
  BUILDINGS.forEach(b => {
    if (!unlockedAreas.includes(b.area)) return;
    const lv = (state.buildings || {})[b.id] || 0;
    if (lv <= 0) return;

    const slots = (state.decoSlots || {})[b.id] || [];
    const isHere = slots.includes(decoId);
    const isFull = !isHere && slots.length >= getMaxDecoSlots();
    const isWrongTarget = d.target && d.target !== b.id;

    const div = document.createElement('div');
    div.className = `deco-select-building-item${isHere ? ' current' : ''}${isFull ? ' full' : ''}`;

    let btnHtml;
    if (isHere) {
      btnHtml = `<span class="deco-select-here">✅ 設置中</span>`;
    } else if (isFull) {
      btnHtml = `<button class="btn-deco-place" disabled>満杯</button>`;
    } else {
      const label = currentBId ? (isWrongTarget ? '移動（効果なし）' : '移動') : (isWrongTarget ? '配置（効果なし）' : '配置');
      btnHtml = `<button class="btn-deco-place${isWrongTarget ? ' no-effect' : ''}${currentBId ? ' move' : ''}"
        onclick="placeDecorationFromSelect('${b.id}','${decoId}')">${label}</button>`;
    }

    div.innerHTML = `
      <span class="deco-select-b-emoji">${b.emoji}</span>
      <div class="deco-select-b-info">
        <div class="deco-select-b-name">${b.name} <span class="deco-select-b-slots">${slots.length}/${getMaxDecoSlots()}</span></div>
        ${isWrongTarget ? `<div class="deco-wrong-target" style="font-size:10px">⚠️ この施設では効果なし</div>` : ''}
      </div>
      ${btnHtml}`;
    list.appendChild(div);
  });

  if (list.children.length === 0) {
    list.innerHTML = '<div class="deco-modal-empty">建設済みの施設がありません</div>';
  }
}

function placeDecorationFromSelect(buildingId, decoId) {
  placeDecoration(buildingId, decoId);
  // モーダルを再描画
  renderDecoSelectModal(decoId);
  // decoGrid も更新
  renderDeco();
}

// ── デコレーションタブ（カタログ表示）──
function renderDeco() {
  const grid = document.getElementById('decoGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const score = getBeautyScore();
  document.getElementById('beautyScore').textContent = score;
  document.getElementById('beautyBonus').textContent = score;

  // 一括配置ボタン（deco_bulk_place 解放時のみ表示）
  if (state.prestigeSkills?.deco_bulk_place) {
    const bulkBar = document.createElement('div');
    bulkBar.className = 'deco-bulk-bar';
    bulkBar.innerHTML = `
      <button class="btn-deco-bulk" onclick="bulkPlaceDecorations()">🏗️ 未配置を一括配置</button>
      <span class="deco-bulk-hint">未配置の飾りを施設へ自動配置します</span>`;
    grid.appendChild(bulkBar);
  }

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

  // 時代の証セクション（所持しているものだけ表示）
  const ownedLegacy = LEGACY_DECORATIONS.filter(d => !!owned[d.id]);
  if (ownedLegacy.length > 0) {
    const legacyHdr = document.createElement('div');
    legacyHdr.className = 'deco-focus-header';
    legacyHdr.innerHTML = `<span>✨ 時代の証</span><span class="deco-focus-badge unlocked">Lv100達成で解放</span>`;
    grid.appendChild(legacyHdr);
    ownedLegacy.forEach(d => _renderDecoItem(d, grid, owned));
  }
}

function _renderDecoItem(d, grid, owned, focusUnlocked = true) {
  const isOwned = !!owned[d.id];
  const isLocked = d.focusOnly && !focusUnlocked;
  const isLegacy = !!d.legacyOnly;
  const canAfford = !isOwned && !isLocked && !isLegacy && state.coins >= d.cost;
  const levelupUnlocked = !!state.prestigeSkills?.deco_levelup;

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

  const curLv = isOwned ? getDecoLevel(d.id) : 1;
  const nextLv = curLv + 1;
  const isMaxLv = curLv >= DECO_MAX_LEVEL;
  const lvUpCost = (!isMaxLv && isOwned) ? getDecoLevelUpCost(d, nextLv) : 0;
  const canAffordLvUp = isOwned && !isMaxLv && state.coins >= lvUpCost;

  const div = document.createElement('div');
  div.className = `deco-item ${isOwned ? 'owned' : canAfford ? 'affordable' : ''} ${isLocked ? 'focus-locked' : ''}`;
  div.dataset.decoId = d.id;
  const targetB = d.target ? BUILDINGS.find(x => x.id === d.target) : null;

  const effectDesc = isLocked ? '???' : isLegacy ? (() => {
    const lv = state.buildings[d.target]?.level || 0;
    return `${targetB?.name ?? ''}のCPS +${(d.effect.value * lv * 100).toFixed(0)}%（Lv×1%・現在Lv${lv}）`;
  })() : (isOwned && curLv > 1 ? `${d.effectDesc}（Lv${curLv}：効果×${curLv}）` : d.effectDesc);

  div.innerHTML = `
    <div class="deco-item-top">
      <span class="deco-emoji">${isLocked ? '🔒' : d.emoji}</span>
      <div>
        <div class="deco-name">${d.name}${isOwned && levelupUnlocked ? `<span class="deco-lv-badge ${isMaxLv ? 'max' : ''}">Lv${curLv}</span>` : ''}</div>
        <div class="deco-desc">${isLocked ? '施設特化飾り（要：飾りの極意）' : d.desc}</div>
      </div>
    </div>
    ${targetB && !isLocked ? `<div class="deco-target-label">🎯 対象施設：${targetB.emoji}${targetB.name}</div>` : ''}
    <div class="deco-synergy">🔗 ${effectDesc}</div>
    ${isOwned
      ? `<div class="deco-placed-info">${placedAt ? `📍 ${placedAt}に設置中` : '⚪ 未配置'}</div>
         <button class="btn-deco-open" onclick="openDecoSelectModal('${d.id}')">🔄 配置変更</button>
         ${levelupUnlocked ? (isMaxLv
           ? `<button class="btn-deco-levelup" disabled>✨ MAX</button>`
           : `<button class="btn-deco-levelup${canAffordLvUp ? '' : ' unaffordable'}" onclick="levelUpDecoration('${d.id}')" ${canAffordLvUp ? '' : 'disabled'}>
                ⬆️ Lv${nextLv}に強化 🪙${fmt(lvUpCost)}
              </button>`) : ''}`
      : isLocked
        ? `<button class="btn-buy" disabled>🔒 解放が必要</button>`
        : `<button class="btn-buy" onclick="buyDecoration('${d.id}')" ${canAfford ? '' : 'disabled'}>
             🪙${fmt(d.cost)} 購入
           </button>`
    }`;
  grid.appendChild(div);
}
