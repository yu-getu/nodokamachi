// ══════════════════════════════
//  セーブ・ロードシステム
// ══════════════════════════════
function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      coins:state.coins, totalEarned:state.totalEarned, buildings:state.buildings,
      savedAt:Date.now(), prestigeCount:state.prestigeCount,
      achievements:state.achievements, eventCount:state.eventCount, stormCount:state.stormCount,
      daily: state.daily, decorations: state.decorations,
      unlockedAreas: state.unlockedAreas, research: state.research,
      quests: state.quests, skills: state.skills,
    }));
    state.lastSaved = Date.now(); updateSaveStatus();
    addLog('💾 セーブしました！');
  } catch(e) { addLog('⚠️ セーブ失敗'); }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY); if(!raw) return false;
    const d = JSON.parse(raw);
    state.coins = d.coins||50; state.totalEarned = d.totalEarned||0;
    state.buildings = d.buildings||{}; state.prestigeCount = d.prestigeCount||0;
    state.achievements = d.achievements||{}; state.eventCount = d.eventCount||0;
    state.stormCount = d.stormCount||0;
    state.daily = d.daily || { lastClaimDate:null, streak:0, totalClaimed:0 };
    state.decorations = d.decorations || {};
    state.unlockedAreas = d.unlockedAreas || [1];
    state.research = d.research || {};
    BUILDINGS.forEach(b=>{
      if(!state.buildings[b.id]) state.buildings[b.id]={level:0,msReached:[]};
      if(!state.buildings[b.id].msReached) state.buildings[b.id].msReached=[];
    });
    if(!state.unlockedAreas) state.unlockedAreas=[1];
    if(!state.research) state.research={};
    state.quests = d.quests || null;
    state.skills = d.skills || {};
    const offSec = Math.min((Date.now()-d.savedAt)/1000, 8*3600);
    if(offSec>30 && getCps()>0){
      const earned = Math.floor(getEffectiveCps()*offSec*.5);
      state.coins+=earned; state.totalEarned+=earned;
      showOfflineModal(offSec,earned);
    }
    return true;
  } catch(e){ return false; }
}

function updateSaveStatus() {
  const el=document.getElementById('saveStatus');
  if(!state.lastSaved){el.textContent='未保存';return;}
  const s=Math.floor((Date.now()-state.lastSaved)/1000);
  el.textContent=s<60?`${s}秒前に保存`:`${Math.floor(s/60)}分前に保存`;
}
