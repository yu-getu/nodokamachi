// ══════════════════════════════
//  プレステージ転生システム
// ══════════════════════════════
function getPrestigeMult() { return 1 + state.prestigeCount * 0.2; }
function getPrestigeRequired() { return 50000 * Math.pow(3, state.prestigeCount); }

function confirmPrestige() {
  const req=getPrestigeRequired();
  if(state.totalEarned<req) return;
  const newMax = BASE_MAX_LV + (state.prestigeCount+1)*PRESTIGE_LV_BONUS;
  const nextMult=(1+(state.prestigeCount+1)*.2).toFixed(1);
  document.getElementById('prestigeConfirmList').innerHTML=
    `✅ 転生後のCPS永続倍率：×${nextMult}<br>`+
    `✅ レベル上限が <strong>Lv${newMax}</strong> に拡張<br>`+
    `✅ 実績・転生回数は引き継ぎ<br>`+
    `❌ コイン・建物レベルがリセット<br>`+
    `❌ マイルストーン達成状況もリセット`;
  document.getElementById('prestigeModal').classList.add('show');
}

function doPrestige() {
  closeModal('prestigeModal');
  state.prestigeCount++;
  state.coins=50; state.totalEarned=0;
  BUILDINGS.forEach(b=>{ state.buildings[b.id]={level:0,msReached:[]}; });
  state.activeEvent=null; state.eventDiscount=1; state.skills={};
  const newMax=getMaxLevel();
  addLog(`⭐ プレステージ転生(${state.prestigeCount}回目)！Lv上限→${newMax}、CPS倍率×${(1+state.prestigeCount*.2).toFixed(1)}`);
  saveGame(); checkAchievements(); render(); renderPrestige();
  document.getElementById('prestigeBadge').style.display='flex';
  document.getElementById('prestigeCount').textContent=state.prestigeCount;
  for(let i=0;i<10;i++) setTimeout(()=>spawnFloatCoins('⭐'),i*100);
}

function renderPrestige() {
  const req=getPrestigeRequired(), can=state.totalEarned>=req;
  const prog=Math.min(100,(state.totalEarned/req)*100);
  const newMax=BASE_MAX_LV+(state.prestigeCount+1)*PRESTIGE_LV_BONUS;
  const nextMult=(1+(state.prestigeCount+1)*.2).toFixed(1);
  const curMult=(1+state.prestigeCount*.2).toFixed(1);
  document.getElementById('prestigeInfo').innerHTML=
    `現在の永続CPS倍率：<strong style="color:var(--prestige2)">×${curMult}</strong><br>
     現在のレベル上限：<strong style="color:var(--prestige2)">Lv${getMaxLevel()}</strong>`;
  document.getElementById('prestigeBonusList').innerHTML=
    `<div class="prestige-bonus-item"><span class="pb-icon">⭐</span>永続CPS倍率 → ×<strong>${nextMult}</strong></div>
     <div class="prestige-bonus-item"><span class="pb-icon">📈</span>レベル上限 → <strong>Lv${newMax}</strong>（+${PRESTIGE_LV_BONUS}）</div>
     <div class="prestige-bonus-item"><span class="pb-icon">📌</span>実績・転生回数は引き継ぎ</div>
     <div class="prestige-bonus-item"><span class="pb-icon">🔄</span>コイン・建物・マイルストーンはリセット</div>`;
  document.getElementById('prestigeReq').innerHTML=
    `転生条件：累計コイン <strong style="color:var(--prestige2)">${fmt(req)}</strong> 以上<br>
     現在：${fmt(state.totalEarned)} ${can?'✅ 転生可能！':'（あと '+fmt(req-state.totalEarned)+'）'}`;
  document.getElementById('prestigeProgressBar').style.width=`${prog}%`;
  document.getElementById('btnPrestige').disabled=!can;
  document.getElementById('prestigeHistory').innerHTML=
    state.prestigeCount>0?'⭐'.repeat(Math.min(state.prestigeCount,10))+` ${state.prestigeCount}回転生済み`:'まだ転生したことがありません';
}
