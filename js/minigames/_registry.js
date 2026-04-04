// ══════════════════════════════
//  ミニゲームレジストリ
//  新しいミニゲームを追加したら、ここに1行追加するだけでON/OFF管理できる
// ══════════════════════════════

const MINIGAMES = {
  bakery:     true,   // 🥐 パン屋タイミングゲーム（js/minigames/bakery.js）
  cafe:       true,   // ☕ 喫茶店 バー停止（js/minigames/cafe.js）
  shrine:     true,  // ⛩️ 神社おみくじ（js/minigames/shrine.js）
  onsen:      true,  // ♨️ 温泉湯加減調整（js/minigames/onsen.js）
  amusement:  true,   // 🎡 遊園地連打（js/minigames/amusement.js）
  rocket:     true,   // 🚀 宇宙基地カウントダウン（js/minigames/rocket.js）
  deepseasub: true,   // 🦈 深海調査船ソナー（js/minigames/deepseasub.js）
  dimgate:    true,   // 🌀 次元の扉デュアルバー（js/minigames/dimgate.js）
};

// ショップボタン表示用メタ情報
const MINIGAME_META = {
  bakery:     { emoji: '🥐', label: 'パンを焼く',       fn: 'openBakeryGame',      maxPlays: 10 },
  cafe:       { emoji: '☕', label: 'コーヒーを淹れる',  fn: 'openCafeGame',        maxPlays: 10 },
  shrine:     { emoji: '⛩️', label: 'おみくじを引く',   fn: 'openShrineGame',      maxPlays: 3  },
  onsen:      { emoji: '♨️', label: '湯加減を調整',     fn: 'openOnsenGame',       maxPlays: 10 },
  amusement:  { emoji: '🎡', label: '盛り上げる！',      fn: 'openAmusementGame',   maxPlays: 10 },
  rocket:     { emoji: '🚀', label: 'ロケット発射',      fn: 'openRocketGame',      maxPlays: 10 },
  deepseasub: { emoji: '🦈', label: 'ソナー探査',        fn: 'openDeepseasubGame',  maxPlays: 10 },
  dimgate:    { emoji: '🌀', label: '次元を開く',        fn: 'openDimgateGame',     maxPlays: 10 },
};
