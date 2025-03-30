// ひらがな・カタカナ・数字なぞり練習アプリ（スマホ対応版）

// 文字データ
const characters = {
  hiragana: ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ', 'た', 'ち', 'つ', 'て', 'と', 'な', 'に', 'ぬ', 'ね', 'の', 'は', 'ひ', 'ふ', 'へ', 'ほ', 'ま', 'み', 'む', 'め', 'も', 'や', 'ゆ', 'よ', 'ら', 'り', 'る', 'れ', 'ろ', 'わ', 'を', 'ん'],
  katakana: ['ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク', 'ケ', 'コ', 'サ', 'シ', 'ス', 'セ', 'ソ', 'タ', 'チ', 'ツ', 'テ', 'ト', 'ナ', 'ニ', 'ヌ', 'ネ', 'ノ', 'ハ', 'ヒ', 'フ', 'ヘ', 'ホ', 'マ', 'ミ', 'ム', 'メ', 'モ', 'ヤ', 'ユ', 'ヨ', 'ラ', 'リ', 'ル', 'レ', 'ロ', 'ワ', 'ヲ', 'ン'],
  numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
};

// カラーパレット
const colorPalette = [
  '#FF6B6B', // 赤
  '#FF9E7D', // オレンジ
  '#FFDA77', // 黄色
  '#91F48F', // 緑
  '#4CACBC', // 青
  '#7367F0', // 紫
  '#F77FBE'  // ピンク
];

// フォントオプション
const fontOptions = [
  { id: 'Klee One', label: 'クレー' }
];

// アプリケーション状態
let state = {
  currentCategory: 'hiragana',
  currentChar: 'あ',
  currentFont: 'Klee One',  // デフォルトをKleeに
  strokeColor: colorPalette[0],
  strokeWidth: 12,
  userStrokes: [],
  isDrawing: false,
  accuracy: 0,
  showAccuracy: false,
  templateCreated: false
};

// テンプレート（文字の輪郭）を保存するバッファ
let templateBuffer;

// デバイスがモバイルかどうかを判定する関数
function isMobileDevice() {
  return (window.innerWidth <= 768);
}

// p5.jsのセットアップ関数
function setup() {
  // キャンバスを作成（モバイル向けに調整）
  let canvasWidth, canvasHeight;
  
  if (isMobileDevice()) {
    // モバイル用のサイズ設定
    canvasWidth = min(windowWidth - 20, 500);
    // モバイルでは高さを小さくして、下部のボタンが見えるようにする
    canvasHeight = min(windowHeight - 350, 400);
  } else {
    // PC用のサイズ設定（従来通り）
    canvasWidth = min(windowWidth - 40, 800);
    canvasHeight = min(windowHeight - 300, 600);
  }
  
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent('sketch-holder');
  
  // テンプレートバッファの初期化
  templateBuffer = createGraphics(canvasWidth, canvasHeight);
  
  // フォントを直接CSS名で指定
  textFont('Klee One');
  templateBuffer.textFont('Klee One');
  
  // UI要素の初期化
  createUI();
  
  // 描画設定
  background(255);
  noFill();
  
  // 最初の文字表示を少し遅延させる
  setTimeout(() => {
    updateDisplayChar();
  }, 200); // 200ミリ秒後に実行 
}

// UI要素を作成
function createUI() {
  // カテゴリ選択ボタン
  createCategoryButtons();
  
  // 文字選択ボタン
  createCharButtons();
  
  // フォント選択ボタン
  createFontButtons();
  
  // コントロールパネル
  createControlPanel();
}

// カテゴリ選択ボタンを作成
function createCategoryButtons() {
  const categoryDiv = document.getElementById('category-buttons');
  categoryDiv.innerHTML = '';
  
  const categories = [
    { id: 'hiragana', label: 'ひらがな' },
    { id: 'katakana', label: 'カタカナ' },
    { id: 'numbers', label: 'すうじ' }
  ];
  
  categories.forEach(category => {
    const button = document.createElement('button');
    button.className = `category-btn ${state.currentCategory === category.id ? 'active' : ''}`;
    button.textContent = category.label;
    button.onclick = () => {
      // 全てのカテゴリボタンからactiveクラスを削除
      document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      // クリックされたボタンにactiveクラスを追加
      button.classList.add('active');
      
      state.currentCategory = category.id;
      state.currentChar = characters[category.id][0];
      createCharButtons();
      resetCanvas();
    };
    categoryDiv.appendChild(button);
  });
}

// 文字選択ボタンを作成 - スマホ向けに最適化
function createCharButtons() {
  const charDiv = document.getElementById('char-buttons');
  charDiv.innerHTML = '';
  
  // スマホの場合は文字選択エリアの高さを小さくする
  if (isMobileDevice()) {
    charDiv.style.maxHeight = '80px';
  } else {
    charDiv.style.maxHeight = '120px';
  }
  
  characters[state.currentCategory].forEach(char => {
    const button = document.createElement('button');
    button.className = `char-btn ${state.currentChar === char ? 'active' : ''}`;
    button.textContent = char;
    button.onclick = () => {
      // 全ての文字ボタンからactiveクラスを削除
      document.querySelectorAll('.char-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      // クリックされたボタンにactiveクラスを追加
      button.classList.add('active');
      
      state.currentChar = char;
      resetCanvas();
    };
    charDiv.appendChild(button);
  });
}

// フォント選択ボタンを作成
function createFontButtons() {
  // フォントボタンを非表示にする
  if (!document.getElementById('font-buttons')) {
    const fontDiv = document.createElement('div');
    fontDiv.id = 'font-buttons';
    fontDiv.className = 'button-group';
    fontDiv.style.display = 'none'; // 完全に非表示にする
    
    // タイトルを追加
    const title = document.createElement('div');
    title.className = 'group-title';
    title.textContent = '字体：クレーフォント';
    fontDiv.appendChild(title);
    
    // 制御パネルの前に挿入
    const controlPanel = document.getElementById('control-panel');
    controlPanel.parentNode.insertBefore(fontDiv, controlPanel);
  }
}

let kleeFont;

function preload() {
  // 何もしない - フォントをプリロードしない
}

// コントロールパネルを作成 - スマホ向けに最適化
function createControlPanel() {
  const controlPanel = document.getElementById('control-panel');
  controlPanel.innerHTML = '';
  
  // スマホ用に2段組のレイアウトに変更
  if (isMobileDevice()) {
    controlPanel.style.flexDirection = 'column';
    controlPanel.style.alignItems = 'center';
    controlPanel.style.gap = '10px';
  }
  
  // 色選択
  const colorContainer = document.createElement('div');
  colorContainer.id = 'color-picker-container';
  
  colorPalette.forEach((color, index) => {
    const colorOption = document.createElement('div');
    colorOption.className = `color-option ${state.strokeColor === color ? 'active' : ''}`;
    colorOption.style.backgroundColor = color;
    colorOption.onclick = () => {
      // 全ての色オプションからactiveクラスを削除
      document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('active');
      });
      // クリックされたオプションにactiveクラスを追加
      colorOption.classList.add('active');
      
      state.strokeColor = color;
    };
    colorContainer.appendChild(colorOption);
  });
  controlPanel.appendChild(colorContainer);
  
  // ボタンコンテナ作成（スマホの場合は2行に分けるため）
  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'button-container';
  buttonContainer.style.display = 'flex';
  buttonContainer.style.flexWrap = 'wrap';
  buttonContainer.style.justifyContent = 'center';
  buttonContainer.style.gap = '10px';
  controlPanel.appendChild(buttonContainer);
  
  // リセットボタン
  const resetButton = document.createElement('button');
  resetButton.className = 'control-btn';
  resetButton.innerHTML = '🔄 リセット';
  resetButton.onclick = resetCanvas;
  buttonContainer.appendChild(resetButton);
  
  // 保存ボタン
  const saveButton = document.createElement('button');
  saveButton.className = 'control-btn';
  saveButton.innerHTML = '💾 ほぞん';
  saveButton.onclick = () => {
    saveCanvas(`なぞり書き_${state.currentChar}`, 'png');
  };
  buttonContainer.appendChild(saveButton);
  
  // 読み上げボタン
  const speakButton = document.createElement('button');
  speakButton.className = 'control-btn';
  speakButton.innerHTML = '🔊 よみあげ';
  speakButton.onclick = () => {
    speakText(`${state.currentChar}`);
  };
  buttonContainer.appendChild(speakButton);
  
  // 判定ボタン
  buttonContainer.appendChild(createCheckButton());
}

// キャンバスをリセット
function resetCanvas() {
  state.userStrokes = [];
  state.templateCreated = false; // テンプレートをリセット
  state.showAccuracy = false;    // 結果表示をクリア
  updateDisplayChar();
}

// テンプレート画像の作成を修正（数字向けに調整）
function createTemplateImage() {
  templateBuffer.clear();
  templateBuffer.background(255, 0); // 透明な背景
  
  // すべてのカテゴリで同じ処理
  templateBuffer.push();
  templateBuffer.textSize(min(width, height) * 0.7);
  templateBuffer.textAlign(CENTER, CENTER);
  templateBuffer.fill(0, 0, 0, 255); // 黒でクリアに
  templateBuffer.text(state.currentChar, width/2, height/2);
  templateBuffer.pop();
  
  state.templateCreated = true;
}

// 数字用の簡略化されたテンプレートを作成
function createSimplifiedNumberTemplate() {
  const centerX = width / 2;
  const centerY = height / 2;
  const size = min(width, height) * 0.6; // サイズを少し小さく
  
  templateBuffer.push();
  templateBuffer.stroke(0);
  templateBuffer.strokeWeight(size * 0.15); // 太めの線
  templateBuffer.noFill();
  
  switch(state.currentChar) {
    case '0': // 丸
      templateBuffer.ellipse(centerX, centerY, size * 0.6, size * 0.8);
      break;
      
    case '1': // 縦棒のみ（飾りなし）
      templateBuffer.line(centerX, centerY - size * 0.4, centerX, centerY + size * 0.4);
      break;
      
    case '2': // 簡略化した2
      templateBuffer.beginShape();
      templateBuffer.vertex(centerX - size * 0.3, centerY - size * 0.3); // 左上
      templateBuffer.vertex(centerX + size * 0.3, centerY - size * 0.3); // 右上
      templateBuffer.vertex(centerX + size * 0.3, centerY); // 右中央
      templateBuffer.vertex(centerX - size * 0.3, centerY + size * 0.3); // 左下
      templateBuffer.vertex(centerX + size * 0.3, centerY + size * 0.3); // 右下
      templateBuffer.endShape();
      break;
      
    case '3': // 簡略化した3
      templateBuffer.beginShape();
      templateBuffer.vertex(centerX - size * 0.3, centerY - size * 0.3); // 左上
      templateBuffer.vertex(centerX + size * 0.3, centerY - size * 0.3); // 右上
      templateBuffer.vertex(centerX - size * 0.3, centerY); // 左中央
      templateBuffer.vertex(centerX + size * 0.3, centerY); // 右中央
      templateBuffer.vertex(centerX - size * 0.3, centerY + size * 0.3); // 左下
      templateBuffer.vertex(centerX + size * 0.3, centerY + size * 0.3); // 右下
      templateBuffer.endShape();
      break;
      
    case '4': // 簡略化した4
      templateBuffer.line(centerX, centerY - size * 0.4, centerX, centerY + size * 0.4); // 縦線
      templateBuffer.line(centerX - size * 0.3, centerY, centerX + size * 0.3, centerY); // 横線
      break;
      
    case '5': // 簡略化した5
      templateBuffer.beginShape();
      templateBuffer.vertex(centerX + size * 0.3, centerY - size * 0.3); // 右上
      templateBuffer.vertex(centerX - size * 0.3, centerY - size * 0.3); // 左上
      templateBuffer.vertex(centerX - size * 0.3, centerY); // 左中央
      templateBuffer.vertex(centerX + size * 0.3, centerY); // 右中央
      templateBuffer.vertex(centerX + size * 0.3, centerY + size * 0.3); // 右下
      templateBuffer.vertex(centerX - size * 0.3, centerY + size * 0.3); // 左下
      templateBuffer.endShape();
      break;
      
    case '6': // 簡略化した6
      templateBuffer.beginShape();
      templateBuffer.vertex(centerX, centerY - size * 0.4); // 上
      templateBuffer.vertex(centerX - size * 0.3, centerY); // 左中央
      templateBuffer.vertex(centerX - size * 0.3, centerY + size * 0.3); // 左下
      templateBuffer.vertex(centerX + size * 0.3, centerY + size * 0.3); // 右下
      templateBuffer.vertex(centerX + size * 0.3, centerY); // 右中央
      templateBuffer.vertex(centerX - size * 0.3, centerY); // 左中央
      templateBuffer.endShape();
      break;
      
    case '7': // 簡略化した7（横線と右下がりの線）
      templateBuffer.line(centerX - size * 0.3, centerY - size * 0.3, centerX + size * 0.3, centerY - size * 0.3); // 上の横線
      templateBuffer.line(centerX + size * 0.3, centerY - size * 0.3, centerX - size * 0.1, centerY + size * 0.3); // 斜め線
      break;
      
    case '8': // 簡略化した8（上下2つの丸）
      templateBuffer.ellipse(centerX, centerY - size * 0.2, size * 0.5, size * 0.4); // 上の丸
      templateBuffer.ellipse(centerX, centerY + size * 0.2, size * 0.5, size * 0.4); // 下の丸
      break;
      
    case '9': // 簡略化した9
      templateBuffer.beginShape();
      templateBuffer.vertex(centerX, centerY + size * 0.4); // 下
      templateBuffer.vertex(centerX + size * 0.3, centerY); // 右中央
      templateBuffer.vertex(centerX + size * 0.3, centerY - size * 0.3); // 右上
      templateBuffer.vertex(centerX - size * 0.3, centerY - size * 0.3); // 左上
      templateBuffer.vertex(centerX - size * 0.3, centerY); // 左中央
      templateBuffer.vertex(centerX + size * 0.3, centerY); // 右中央
      templateBuffer.endShape();
      break;
      
    default: // 他の場合（通常のテキスト描画に戻る）
      templateBuffer.textSize(min(width, height) * 0.7);
      templateBuffer.textAlign(CENTER, CENTER);
      templateBuffer.textFont(state.currentFont);
      templateBuffer.fill(0, 0, 0, 255); 
      templateBuffer.text(state.currentChar, centerX, centerY);
  }
  
  templateBuffer.pop();
}

// 文字の「重要ポイント」を特定する関数
function identifyKeyPoints() {
  if (!state.templateCreated) {
    createTemplateImage();
  }
  
  templateBuffer.loadPixels();
  
  // 文字の輪郭の重要点（単純化のため、外周のサンプリングを使用）
  const keyPoints = [];
  const width = templateBuffer.width;
  const height = templateBuffer.height;
  
  // 1. 文字領域の大まかな境界を特定
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y += 5) {
    for (let x = 0; x < width; x += 5) {
      const idx = 4 * (y * width + x);
      if (templateBuffer.pixels[idx + 3] > 0) { // 文字の部分
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  
  // 2. 外周のサンプリングポイントを抽出（文字の形状に沿って）
  // 上部の縁
  for (let x = minX; x <= maxX; x += Math.max(5, Math.floor((maxX - minX) / 10))) {
    for (let y = minY; y <= maxY; y += 5) {
      const idx = 4 * (y * width + x);
      if (templateBuffer.pixels[idx + 3] > 0) {
        keyPoints.push({x, y});
        break; // 最初に見つかった点を追加して次の列へ
      }
    }
  }
  
  // 下部の縁（逆方向に走査）
  for (let x = maxX; x >= minX; x -= Math.max(5, Math.floor((maxX - minX) / 10))) {
    for (let y = maxY; y >= minY; y -= 5) {
      const idx = 4 * (y * width + x);
      if (templateBuffer.pixels[idx + 3] > 0) {
        keyPoints.push({x, y});
        break;
      }
    }
  }
  
  // 左側の縁
  for (let y = minY; y <= maxY; y += Math.max(5, Math.floor((maxY - minY) / 10))) {
    for (let x = minX; x <= maxX; x += 5) {
      const idx = 4 * (y * width + x);
      if (templateBuffer.pixels[idx + 3] > 0) {
        keyPoints.push({x, y});
        break;
      }
    }
  }
  
  // 右側の縁（逆方向に走査）
  for (let y = maxY; y >= minY; y -= Math.max(5, Math.floor((maxY - minY) / 10))) {
    for (let x = maxX; x >= minX; x -= 5) {
      const idx = 4 * (y * width + x);
      if (templateBuffer.pixels[idx + 3] > 0) {
        keyPoints.push({x, y});
        break;
      }
    }
  }
  
  return keyPoints;
}

// 重要ポイントがなぞられたかチェックする関数
function checkKeyPointsCoverage() {
  const keyPoints = identifyKeyPoints();
  const coveredKeyPoints = [];
  
  // ユーザーの線からある距離内にあるキーポイントは「カバーされた」と見なす
  const coverageDistance = state.strokeWidth * 1.5; // 少し大きめの範囲に
  
  for (const point of keyPoints) {
    let covered = false;
    
    // すべてのストロークをチェック
    for (const stroke of state.userStrokes) {
      for (const strokePoint of stroke) {
        // ユーザーの線とキーポイントの距離を計算
        const distance = Math.sqrt(
          Math.pow(strokePoint.x - point.x, 2) + 
          Math.pow(strokePoint.y - point.y, 2)
        );
        
        if (distance <= coverageDistance) {
          covered = true;
          break;
        }
      }
      if (covered) break;
    }
    
    if (covered) {
      coveredKeyPoints.push(point);
    }
  }
  
  // キーポイントのカバレッジ率を計算
  return keyPoints.length > 0 ? (coveredKeyPoints.length / keyPoints.length) * 100 : 0;
}

// 正確さを判定する関数（文字上のなぞり率）
function checkAccuracy() {
  if (!state.templateCreated) {
    createTemplateImage();
  }
  
  let totalPoints = 0;
  let pointsOnTemplate = 0;
  
  // ユーザーの描画ポイントをすべて調べる
  for (let userStroke of state.userStrokes) {
    for (let point of userStroke) {
      totalPoints++;
      
      // ポイントがテンプレート上にあるか確認
      let pixelColor = templateBuffer.get(point.x, point.y);
      
      // ピクセルの不透明度が一定以上ならテンプレート上にあると判断
      if (pixelColor[3] > 0) { // アルファ値をチェック
        pointsOnTemplate++;
      }
    }
  }
  
  // 文字の中を通ったポイントの割合を計算
  const onTemplateRatio = totalPoints > 0 ? (pointsOnTemplate / totalPoints) : 0;
  
  // 正確さを計算 (0-100の範囲)
  // 60%以上が文字の上にあれば満点、それ以下は比例配分
  return Math.min(100, Math.floor(onTemplateRatio * 166.67)); // 60%で100点になるよう調整
}

// カバレッジ計算（文字のどれだけをなぞれたか）
function calculateCoverage() {
  if (!state.templateCreated) {
    createTemplateImage();
  }
  
  // テンプレートの文字部分の総ピクセル数をカウント
  templateBuffer.loadPixels();
  let totalTemplatePixels = 0;
  
  for (let i = 0; i < templateBuffer.pixels.length; i += 4) {
    if (templateBuffer.pixels[i+3] > 0) { // アルファ値が0より大きいピクセル
      totalTemplatePixels++;
    }
  }
  
  // ユーザーがなぞった文字部分をカウント
  // 簡易的にするため、ユーザーの描画ポイントから一定範囲内のピクセルをカバーしたと見なす
  let coveredPixels = new Set();
  const radius = state.strokeWidth / 2;
  
  for (let userStroke of state.userStrokes) {
    for (let point of userStroke) {
      // ポイントの周囲のピクセルをカバー済みとしてマーク
      for (let y = Math.max(0, Math.floor(point.y - radius)); y <= Math.min(height-1, Math.floor(point.y + radius)); y++) {
        for (let x = Math.max(0, Math.floor(point.x - radius)); x <= Math.min(width-1, Math.floor(point.x + radius)); x++) {
          // (x,y)の位置のピクセルがテンプレート上にあるか確認
          let idx = 4 * (y * templateBuffer.width + x);
          if (idx < templateBuffer.pixels.length && templateBuffer.pixels[idx+3] > 0) {
            coveredPixels.add(`${x},${y}`); // カバーしたピクセルを記録
          }
        }
      }
    }
  }
  
  // カバレッジ率を計算
  const coverage = totalTemplatePixels > 0 ? (coveredPixels.size / totalTemplatePixels) : 0;
  
  return Math.min(100, Math.floor(coverage * 100));
}

// 子供向けに改善した判定関数を修正
function calculateFriendlyScore() {
  // 従来の指標
  let accuracyScore = checkAccuracy();    // はみ出さずに書けたか
  let coverageScore = calculateCoverage(); // 文字全体をなぞれたか
  let keyPointsScore = checkKeyPointsCoverage(); // 重要ポイントをなぞれたか
  
  // 数字カテゴリの場合は特別な判定
  if (state.currentCategory === 'numbers') {
    // 数字の場合は重要ポイント判定を優先
    keyPointsScore = Math.min(100, keyPointsScore * 1.3); // キーポイントスコアを増強
    
    // 数字の場合はカバレッジ要求を下げる
    if (keyPointsScore >= 60) {
      coverageScore = Math.max(coverageScore, 50); // キーポイントが良ければカバレッジも最低50%保証
    }
    
    // 配分も調整（キーポイントの比重を上げる）
    return Math.floor(
      accuracyScore * 0.2 + 
      coverageScore * 0.3 + 
      keyPointsScore * 0.5
    );
  }
  
  // ひらがな・カタカナは通常の判定
  // 最低限のカバレッジ要件を緩和（20%に下げる）
  if (coverageScore < 20 && keyPointsScore < 30) {
    return Math.min(40, Math.floor(
      accuracyScore * 0.3 + 
      coverageScore * 0.3 + 
      keyPointsScore * 0.4
    ));
  }
  
  // 重要ポイントのカバレッジを重視する配分
  return Math.floor(
    accuracyScore * 0.25 + 
    coverageScore * 0.35 + 
    keyPointsScore * 0.4
  );
}

// フィードバック表示関数
function showFriendlyFeedback() {
  if (!state.showAccuracy) return;
  
  push();
  // 評価のレベルに応じた設定（閾値を調整）
  let emoji, message, color;
  
  if (state.accuracy >= 70) { // 閾値を80→70に下げる
    emoji = '⭐⭐⭐';
    message = 'すごい！';
    color = '#4CAF50'; // 緑
    playSuccessSound();
  } else if (state.accuracy >= 40) { // 閾値を50→40に下げる
    emoji = '⭐⭐';
    message = 'がんばったね！';
    color = '#FFC107'; // 黄色
    playGoodSound();
  } else {
    emoji = '⭐';
    message = 'もう一度チャレンジ！';
    color = '#FF5722'; // オレンジ
    playTryAgainSound();
  }
  
  // フィードバック表示 - モバイル向けに位置調整
  textAlign(CENTER, TOP);
  // スマホではより小さく、上部に寄せる
  if (isMobileDevice()) {
    textSize(28);
    text(emoji, width/2, 10);
    textSize(24);
    text(message, width/2, 45);
  } else {
    textSize(32);
    text(emoji, width/2, 15);
    textSize(28);
    text(message, width/2, 55);
  }
  
  pop();
}

// 表示する文字を更新
function updateDisplayChar() {
  background(255);
  
  // すべてのカテゴリでKleeフォントを使用
  push();
  // スマホの場合は文字サイズを調整
  let textSizeValue = isMobileDevice() ? min(width, height) * 0.6 : min(width, height) * 0.7;
  textSize(textSizeValue);
  textAlign(CENTER, CENTER);
  textFont('Klee One'); // Kleeフォントを使用
  fill(220, 220, 220); // 透明度なしの薄いグレー
  text(state.currentChar, width/2, height/2);
  pop();
  
  // ユーザーの描画を再描画
  for (let userStroke of state.userStrokes) {
    if (userStroke.length > 0) {
      push();
      stroke(userStroke[0].color);
      strokeWeight(userStroke[0].weight);
      noFill();
      beginShape();
      for (let point of userStroke) {
        vertex(point.x, point.y);
      }
      endShape();
      pop();
    }
  }
  
  // フィードバック表示
  if (state.showAccuracy) {
    showFriendlyFeedback();
  }
}

// 判定ボタンの処理
function createCheckButton() {
  const checkButton = document.createElement('button');
  checkButton.className = 'control-btn';
  checkButton.innerHTML = '✓ はんてい';
  checkButton.onclick = () => {
    // 文字テンプレートの更新確認
    if (!state.templateCreated) {
      createTemplateImage();
    }
    
    // 新しい判定ロジックで計算
    state.accuracy = calculateFriendlyScore();
    state.showAccuracy = true;
    
    // 結果表示の更新
    updateDisplayChar();
  };
  return checkButton;
}

// マウスが押された時
function mousePressed() {
  if (isMouseInsideCanvas()) {
    state.isDrawing = true;
    state.userStrokes.push([]);
  }
}

// マウスがドラッグされた時
function mouseDragged() {
  if (state.isDrawing && isMouseInsideCanvas()) {
    let currentStroke = state.userStrokes[state.userStrokes.length - 1];
    
    // 点の情報（位置と描画スタイル）を保存
    currentStroke.push({
      x: mouseX,
      y: mouseY,
      color: state.strokeColor,
      weight: state.strokeWidth
    });
    
    // 線を描画
    push();
    stroke(state.strokeColor);
    strokeWeight(state.strokeWidth);
    
    if (currentStroke.length > 1) {
      let prev = currentStroke[currentStroke.length - 2];
      let curr = currentStroke[currentStroke.length - 1];
      line(prev.x, prev.y, curr.x, curr.y);
    } else if (currentStroke.length === 1) {
      // 単一点の場合は点を描画
      point(mouseX, mouseY);
    }
    
    pop();
  }
}

// マウスが離された時
function mouseReleased() {
  state.isDrawing = false;
}

// タッチスタート
function touchStarted() {
  if (!isMouseInsideCanvas()) return;
  
  // Prevent default touch behavior
  if (touches.length > 0) {
    state.isDrawing = true;
    state.userStrokes.push([]);
    return false;
  }
}

// タッチ移動
function touchMoved() {
  if (!state.isDrawing || !isMouseInsideCanvas()) return;
  
  if (touches.length > 0) {
    let currentStroke = state.userStrokes[state.userStrokes.length - 1];
    
    // タッチポイントの位置を取得
    let touchX = touches[0].x;
    let touchY = touches[0].y;
    
    // 点の情報を保存
    currentStroke.push({
      x: touchX,
      y: touchY,
      color: state.strokeColor,
      weight: state.strokeWidth
    });
    
    // 線を描画
    push();
    stroke(state.strokeColor);
    strokeWeight(state.strokeWidth);
    
    if (currentStroke.length > 1) {
      let prev = currentStroke[currentStroke.length - 2];
      let curr = currentStroke[currentStroke.length - 1];
      line(prev.x, prev.y, curr.x, curr.y);
    }
    
    pop();
    return false;
  }
}

// タッチエンド
function touchEnded() {
  state.isDrawing = false;
  return false;
}

// マウスがキャンバス内にあるかチェック
function isMouseInsideCanvas() {
  return mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
}

// 音声読み上げ機能
function speakText(text) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    
    // 音声を取得（日本語の女性の声があれば選択）
    let voices = speechSynthesis.getVoices();
    
    // 音声が読み込めていない場合は少し待ってから再取得
    if (voices.length === 0) {
      // 非同期で音声を読み込む
      speechSynthesis.onvoiceschanged = () => {
        voices = speechSynthesis.getVoices();
        setVoice();
      };
    } else {
      setVoice();
    }
    
    function setVoice() {
      // 優先順位で声を探す
      let selectedVoice = null;
      
      // 1. 日本語の子供向け音声があれば最優先
      selectedVoice = voices.find(voice => 
        voice.lang === 'ja-JP' && (voice.name.includes('Child') || voice.name.includes('子供')));
      
      // 2. 日本語の女性音声
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.lang === 'ja-JP' && (voice.name.includes('Female') || voice.name.includes('女性')));
      }
      
      // 3. どれでも日本語音声
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang === 'ja-JP');
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`選択された音声: ${selectedVoice.name}`);
      }
    }
    
    // 「ゆっくり解説」風の設定
    utterance.rate = 0.5;  // かなりゆっくり
    utterance.pitch = 1.5; // 高めのピッチ（まりさ・霊夢風）
    
    speechSynthesis.speak(utterance);
  } else {
    console.log('お使いのブラウザは音声合成に対応していません');
  }
}

// 評価結果に応じたサウンド再生
function playSuccessSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // 明るく高い音（成功）
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // ドの音
    
    // 短い音を連続で鳴らす
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.2);
    
    // 2つ目の音
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // ミの音
      
      gain2.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain2.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
      
      osc2.start();
      osc2.stop(audioCtx.currentTime + 0.2);
    }, 200);
    
    // 3つ目の音
    setTimeout(() => {
      const osc3 = audioCtx.createOscillator();
      const gain3 = audioCtx.createGain();
      osc3.connect(gain3);
      gain3.connect(audioCtx.destination);
      
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(783.99, audioCtx.currentTime); // ソの音
      
      gain3.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain3.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
      
      osc3.start();
      osc3.stop(audioCtx.currentTime + 0.3);
    }, 400);
  } catch (e) {
    console.log('効果音の再生に失敗しました:', e);
  }
}

function playGoodSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // 中間の音（まずまず）
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(392.00, audioCtx.currentTime); // ソの音
    
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
    
    // 2つ目の音
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25, audioCtx.currentTime); // ドの音
      
      gain2.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain2.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
      
      osc2.start();
      osc2.stop(audioCtx.currentTime + 0.3);
    }, 300);
  } catch (e) {
    console.log('効果音の再生に失敗しました:', e);
  }
}

function playTryAgainSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // 低めの音（もう一度）
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(329.63, audioCtx.currentTime); // ミの音
    
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.4);
  } catch (e) {
    console.log('効果音の再生に失敗しました:', e);
  }
}

// ウィンドウサイズが変更された時
function windowResized() {
  let canvasWidth, canvasHeight;
  
  if (isMobileDevice()) {
    // モバイル用のサイズ設定
    canvasWidth = min(windowWidth - 20, 500);
    canvasHeight = min(windowHeight - 350, 400);
  } else {
    // PC用のサイズ設定
    canvasWidth = min(windowWidth - 40, 800);
    canvasHeight = min(windowHeight - 300, 600);
  }
  
  resizeCanvas(canvasWidth, canvasHeight);
  
  // テンプレートバッファが存在する場合のみリサイズ
  if (templateBuffer) {
    templateBuffer.resizeCanvas(canvasWidth, canvasHeight);
    state.templateCreated = false; // テンプレートを再作成する必要がある
  }
  
  updateDisplayChar();
}