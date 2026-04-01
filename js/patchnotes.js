// ══════════════════════════════
//  パッチノート
// ══════════════════════════════

const PATCH_NOTES = [
  {
    version: '0.10',
    date: '2026-04-01',
    entries: [
      'スキルツリーを「生産強化」「飾り系」「効率系」の3列に再編',
      'ミニゲームの回数制限を撤廃（おみくじは1日1回に維持）',
      'ミニゲームモーダルのサイズを拡大',
      'ミニゲームのプレイ回数がリロード後もリセットされないよう修正',
      'ショップのマイルストーンバッジを削除',
    ],
  },
  {
    version: '0.9',
    date: '2026-03-31',
    entries: [
      '神社ミニゲーム（おみくじ）を追加',
      'レガシー飾りシステム追加（施設Lv100でアンロック、レベルに応じてbaseCPS増加）',
      'スキルツリーにT11・T12を追加（36スキルへ拡充）',
      'ミニゲームスキル「ミニゲームの達人」追加',
      'CPS計算にスキル・飾りの連携ボーナスを改善',
    ],
  },
  {
    version: '0.8',
    date: '2026-03-29',
    entries: [
      'パン屋・喫茶店のミニゲームを追加',
      'ミニゲーム共通フレームワーク（_shared.js）を整備',
      'ミニゲーム報酬にスキル倍率を反映',
    ],
  },
  {
    version: '0.7',
    date: '2026-03-27',
    entries: [
      'マイルストーン演出を追加（Lv10・25・50・100・200）',
      '記録タブを詳細化（エリア別CPS・実績進捗など）',
      '転生後のSP・スキル計算を修正',
    ],
  },
  {
    version: '0.6',
    date: '2026-03-25',
    entries: [
      'JSとCSSをドメイン別ファイルに分割してコード整理',
      '施設特化飾りの対象施設限定効果を追加',
      '飾り一括バーを固定表示に変更',
    ],
  },
  {
    version: '0.5',
    date: '2026-03-22',
    entries: [
      '飾りシステムを全面刷新（施設スロット制、特化飾り追加）',
      '研究システムを刷新（ツリー型に変更）',
      '礎スキルを追加（飾り枠拡張）',
      '転生UI改善・実績を大幅拡充',
    ],
  },
  {
    version: '0.4',
    date: '2026-03-18',
    entries: [
      '特別住人イベントを追加',
      '町エリアのスライドナビを追加',
      'エリア別背景グラフィックを実装',
      '設定モーダルを追加（BGM・効果音のON/OFF・音量調整）',
    ],
  },
  {
    version: '0.3',
    date: '2026-03-14',
    entries: [
      'スキルツリーを追加',
      'スキル一括習得機能を追加',
      'クエストシステムを追加',
      'UI全体をリニューアル',
    ],
  },
  {
    version: '0.2',
    date: '2026-03-10',
    entries: [
      '転生（プレステージ）システムを追加',
      '実績システムを追加',
      '季節・週末ボーナスを追加',
    ],
  },
  {
    version: '0.1',
    date: '2026-03-01',
    entries: [
      '初期リリース',
      '施設の建設・CPS収入の基本システム',
      '複数エリア（農村・商業・文化・癒し・都市・宇宙・深海・異次元）',
    ],
  },
];

function openPatchNotes() {
  const list = document.getElementById('patchNotesList');
  if (list) {
    list.innerHTML = PATCH_NOTES.map(p => `
      <div class="pn-entry">
        <div class="pn-header">
          <span class="pn-version">v${p.version}</span>
          <span class="pn-date">${p.date}</span>
        </div>
        <ul class="pn-list">
          ${p.entries.map(e => `<li>${e}</li>`).join('')}
        </ul>
      </div>
    `).join('');
  }
  document.getElementById('patchNotesModal').classList.add('show');
}

function closePatchNotes() {
  document.getElementById('patchNotesModal').classList.remove('show');
}
