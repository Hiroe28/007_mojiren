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
  templateCreated: false,
  pixelDensity: 1,  // デバイスピクセル比を保存
  canvasRect: null, // キャンバスの位置情報
  debugMode: false  // デバッグモード
};

// テンプレート（文字の輪郭）を保存するバッファ
let templateBuffer;

// デバイスがモバイルかどうかを判定する関数
function isMobileDevice() {
  return (window.innerWidth <= 768);
}

// タッチデバイスかどうかを判定
function isTouchDevice() {
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}

// p5.jsのセットアップ関数
function setup() {
  // キャンバスを作成（モバイル向けに調整）
  let canvasWidth, canvasHeight;
  
  if (isMobileDevice()) {
    // モバイル用のサイズ設定 - 固定値ではなく比率で計算
    canvasWidth = min(windowWidth - 20, 400);
    // モバイルでは画面の60%をキャンバスに使用（固定値の減算ではなく）
    canvasHeight = min(windowHeight * 0.6, 400);
    console.log(`モバイルキャンバスサイズ: ${canvasWidth}x${canvasHeight}, 画面サイズ: ${windowWidth}x${windowHeight}`);
  } else {
    // PC用のサイズ設定（縮小）
    canvasWidth = min(windowWidth - 40, 600);
    canvasHeight = min(windowHeight - 300, 500);
  }
  
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent('sketch-holder');
  
  // キャンバスの実際の位置とサイズをログ出力（デバッグ用）
  const canvasRect = canvas.elt.getBoundingClientRect();
  console.log(`キャンバス実際の位置: x=${canvasRect.left}, y=${canvasRect.top}, 幅=${canvasRect.width}, 高さ=${canvasRect.height}`);
  
  // テンプレートバッファの初期化
  templateBuffer = createGraphics(canvasWidth, canvasHeight);
  
  // フォントを直接CSS名で指定
  textFont('Klee One');
  templateBuffer.textFont('Klee One');
  
  // デバイスピクセル比を記録（高解像度デバイス対応）
  state.pixelDensity = pixelDensity();
  console.log(`デバイスピクセル比: ${state.pixelDensity}`);
  
  // UI要素の初期化
  createUI();
  
  // 描画設定
  background(255);
  noFill();
  
  // モバイルタッチ対応の追加処理
  if (isTouchDevice()) {
    console.log('タッチデバイスを検出しました');
    const sketchHolder = document.getElementById('sketch-holder');
    // スケッチ領域内のタッチイベントはデフォルト動作を防止
    sketchHolder.addEventListener('touchstart', function(e) {
      // キャンバス内のタッチのみpreventDefault
      e.preventDefault();
    }, { passive: false });
  }
  
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
    // デバッグ用にdata属性を追加
    button.setAttribute('data-category', category.id);
    
    // タッチデバイス対応の処理
    if (isTouchDevice()) {
      // タッチスタートでタッチデバイス向けの処理を追加
      button.addEventListener('touchstart', function(event) {
        console.log(`カテゴリ変更タッチ: ${category.id}`);
        
        // 全てのカテゴリボタンからactiveクラスを削除
        document.querySelectorAll('.category-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        
        // タッチされたボタンにactiveクラスを追加
        this.classList.add('active');
        
        // 状態を更新
        state.currentCategory = category.id;
        state.currentChar = characters[category.id][0];
        
        // UIと表示を更新
        createCharButtons();
        resetCanvas();
        
        // イベントの伝播を止めない (preventDefault不使用)
      });
    } else {
      // 従来のクリックイベントリスナー (非タッチデバイス用)
      button.addEventListener('click', function(event) {
        event.preventDefault();
        console.log(`カテゴリ変更クリック: ${category.id}`);
        
        // 全てのカテゴリボタンからactiveクラスを削除
        document.querySelectorAll('.category-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        
        // クリックされたボタンにactiveクラスを追加
        this.classList.add('active');
        
        // 状態を更新
        state.currentCategory = category.id;
        state.currentChar = characters[category.id][0];
        
        // UIと表示を更新
        createCharButtons();
        resetCanvas();
      });
    }
    
    categoryDiv.appendChild(button);
  });
}

// 文字選択ボタンを作成 - スマホ向けに最適化
function createCharButtons() {
  const charDiv = document.getElementById('char-buttons');
  charDiv.innerHTML = '';
  
  // スマホの場合は文字選択エリアの高さをより大きくする
  if (isMobileDevice()) {
    charDiv.style.maxHeight = '140px';  // 高さを大幅に増加
    charDiv.style.padding = '8px 5px';
  } else {
    charDiv.style.maxHeight = '120px';
  }
  
  // 現在選択されているカテゴリを表示（デバッグ用）
  console.log(`文字ボタン生成: カテゴリ=${state.currentCategory}, 文字数=${characters[state.currentCategory].length}`);
  
  // 文字ボタンに直接タッチイベントリスナーを追加
  const charArray = characters[state.currentCategory];
  
  charArray.forEach(char => {
    const button = document.createElement('button');
    button.className = `char-btn ${state.currentChar === char ? 'active' : ''}`;
    button.textContent = char;
    
    // タッチデバイス対応の処理
    if (isTouchDevice()) {
      // タッチスタートでタッチデバイス向けの処理を追加
      button.addEventListener('touchstart', function(event) {
        console.log(`文字ボタンタッチ: ${char}`);
        // すべての文字ボタンからactiveクラスを削除
        document.querySelectorAll('.char-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        
        // クリックされたボタンにactiveクラスを追加
        this.classList.add('active');
        
        // 状態を更新
        state.currentChar = char;
        resetCanvas();
        
        // イベントの伝播を止めない (preventDefault不使用)
      });
    } else {
      // 従来のクリックイベントリスナー (非タッチデバイス用)
      button.addEventListener('click', function(event) {
        event.preventDefault();
        
        // すべての文字ボタンからactiveクラスを削除
        document.querySelectorAll('.char-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        
        // クリックされたボタンにactiveクラスを追加
        this.classList.add('active');
        
        // 状態を更新
        state.currentChar = char;
        resetCanvas();
      });
    }
    
    charDiv.appendChild(button);
  });
  
  // スクロール位置をリセット
  charDiv.scrollTop = 0;
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
  
  // スマホ用にレイアウトを変更
  if (isMobileDevice()) {
    controlPanel.style.flexDirection = 'column';
    controlPanel.style.alignItems = 'center';
    controlPanel.style.gap = '5px';
    controlPanel.style.padding = '5px';
  }
  
  // 色選択
  const colorContainer = document.createElement('div');
  colorContainer.id = 'color-picker-container';
  
  colorPalette.forEach((color, index) => {
    const colorOption = document.createElement('div');
    colorOption.className = `color-option ${state.strokeColor === color ? 'active' : ''}`;
    colorOption.style.backgroundColor = color;
    
    // タッチデバイスかどうかで処理を分ける
    if (isTouchDevice()) {
      colorOption.addEventListener('touchstart', function(event) {
        console.log(`色選択タッチ: ${color}`);
        
        // 全ての色オプションからactiveクラスを削除
        document.querySelectorAll('.color-option').forEach(option => {
          option.classList.remove('active');
        });
        
        // タッチされたオプションにactiveクラスを追加
        this.classList.add('active');
        
        state.strokeColor = color;
        
        // イベントの伝播を止めない (preventDefault不使用)
      });
    } else {
      // 従来のクリックイベントリスナー
      colorOption.addEventListener('click', function(event) {
        event.preventDefault();
        
        // 全ての色オプションからactiveクラスを削除
        document.querySelectorAll('.color-option').forEach(option => {
          option.classList.remove('active');
        });
        
        // クリックされたオプションにactiveクラスを追加
        this.classList.add('active');
        
        state.strokeColor = color;
      });
    }
    
    colorContainer.appendChild(colorOption);
  });
  controlPanel.appendChild(colorContainer);
  
  // ボタンコンテナ作成（スマホ用に最適化）
  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'button-container';
  buttonContainer.style.display = 'flex';
  buttonContainer.style.flexWrap = 'wrap';
  buttonContainer.style.justifyContent = 'center';
  buttonContainer.style.gap = '5px';
  buttonContainer.style.width = '100%';
  controlPanel.appendChild(buttonContainer);
  
  // リセットボタン
  const resetButton = document.createElement('button');
  resetButton.className = 'control-btn';
  resetButton.innerHTML = '🔄 リセット';
  
  if (isTouchDevice()) {
    resetButton.addEventListener('touchstart', function(event) {
      console.log('リセットボタンタッチ');
      resetCanvas();
      // イベントの伝播を止めない (preventDefault不使用)
    });
  } else {
    resetButton.addEventListener('click', function(event) {
      event.preventDefault();
      resetCanvas();
    });
  }
  
  buttonContainer.appendChild(resetButton);
  
  // 保存ボタン
  const saveButton = document.createElement('button');
  saveButton.className = 'control-btn';
  saveButton.innerHTML = '💾 ほぞん';
  
  if (isTouchDevice()) {
    saveButton.addEventListener('touchstart', function(event) {
      console.log('保存ボタンタッチ');
      saveCanvas(`なぞり書き_${state.currentChar}`, 'png');
      // イベントの伝播を止めない (preventDefault不使用)
    });
  } else {
    saveButton.addEventListener('click', function(event) {
      event.preventDefault();
      saveCanvas(`なぞり書き_${state.currentChar}`, 'png');
    });
  }
  
  buttonContainer.appendChild(saveButton);
  
  // 読み上げボタン - モバイルでの問題修正
  const speakButton = document.createElement('button');
  speakButton.className = 'control-btn';
  speakButton.id = 'speak-button'; // IDを追加
  speakButton.innerHTML = '🔊 よみあげ';
  
  if (isTouchDevice()) {
    // モバイル用のイベントハンドラ強化
    speakButton.addEventListener('touchstart', function(event) {
      event.stopPropagation(); // イベントの伝播を止める
      console.log('読み上げボタンタッチ');
      
      // iOSの制約対策: ユーザージェスチャ内で音声合成APIを呼び出す
      setTimeout(function() {
        speakText(`${state.currentChar}`);
      }, 10);
    }, { passive: false });
  } else {
    speakButton.addEventListener('click', function(event) {
      event.preventDefault();
      speakText(`${state.currentChar}`);
    });
  }
  
  buttonContainer.appendChild(speakButton);
  
  // 判定ボタン - モバイルでより目立つように
  const checkButton = createCheckButton();
  if (isMobileDevice()) {
    checkButton.style.backgroundColor = '#ff5c5c';
    checkButton.style.fontWeight = 'bold';
    checkButton.style.fontSize = '15px';
    checkButton.style.padding = '8px 16px';
  }
  buttonContainer.appendChild(checkButton);
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
  
  // Y位置を調整（キャンバスの30%の位置に配置して文字位置と合わせる）
  let yPosition = isMobileDevice() ? templateBuffer.height * 0.3 : templateBuffer.height * 0.45;
  
  // すべてのカテゴリで同じ処理
  templateBuffer.push();
  templateBuffer.textSize(min(width, height) * 0.7);
  templateBuffer.textAlign(CENTER, CENTER);
  templateBuffer.fill(0, 0, 0, 255); // 黒でクリアに
  templateBuffer.text(state.currentChar, templateBuffer.width/2, yPosition);
  templateBuffer.pop();
  
  state.templateCreated = true;
}

// 数字用の簡略化されたテンプレートを作成
function createSimplifiedNumberTemplate() {
  // Y位置を調整（キャンバスの30%の位置に配置して文字位置と合わせる）
  const centerX = width / 2;
  const centerY = isMobileDevice() ? height * 0.3 : height * 0.45;
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
  // モバイルではやや広めに取る
  const coverageDistance = isMobileDevice() ? 
                          state.strokeWidth * 3.0 : // モバイルではより広い範囲を許容（2.2→3.0）
                          state.strokeWidth * 1.5;  // PCでの値
  
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
  let coverageRate = keyPoints.length > 0 ? (coveredKeyPoints.length / keyPoints.length) * 100 : 0;
  
  // モバイル環境の場合は判定を緩くする補正
  if (isMobileDevice() && coverageRate > 0) {
    coverageRate = Math.min(100, coverageRate * 1.5); // 20%→50%増加
  }
  
  return coverageRate;
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
      // モバイルではより広い範囲をチェック
      if (isMobileDevice()) {
        // モバイルデバイスの場合、点の周辺もチェック
        const checkRadius = 3; // ピクセル単位で周辺もチェック
        let isOnTemplate = false;
        
        // 点の周辺もチェック
        for (let offsetY = -checkRadius; offsetY <= checkRadius; offsetY++) {
          for (let offsetX = -checkRadius; offsetX <= checkRadius; offsetX++) {
            let pixelColor = templateBuffer.get(point.x + offsetX, point.y + offsetY);
            if (pixelColor[3] > 0) { // アルファ値をチェック
              isOnTemplate = true;
              break;
            }
          }
          if (isOnTemplate) break;
        }
        
        if (isOnTemplate) {
          pointsOnTemplate++;
        }
      } else {
        // PC環境では通常のチェック
        let pixelColor = templateBuffer.get(point.x, point.y);
        if (pixelColor[3] > 0) { // アルファ値をチェック
          pointsOnTemplate++;
        }
      }
    }
  }
  
  // 文字の中を通ったポイントの割合を計算
  const onTemplateRatio = totalPoints > 0 ? (pointsOnTemplate / totalPoints) : 0;
  
  // 正確さを計算 (0-100の範囲)
  // モバイルでは閾値を下げる（50%以上→40%以上）
  const threshold = isMobileDevice() ? 40 : 60;
  const multiplier = 100 / threshold;
  
  return Math.min(100, Math.floor(onTemplateRatio * multiplier * 100));
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
  // モバイルではストローク幅をやや広めに取る
  const radius = isMobileDevice() ? state.strokeWidth * 1.2 : state.strokeWidth / 2;
  
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
  
  // モバイル環境の場合は加点する
  const coverageScore = Math.min(100, Math.floor(coverage * 100));
  
  return coverageScore;
}

// 子供向けに改善した判定関数を修正
function calculateFriendlyScore() {
  // 従来の指標
  let accuracyScore = checkAccuracy();    // はみ出さずに書けたか
  let coverageScore = calculateCoverage(); // 文字全体をなぞれたか
  let keyPointsScore = checkKeyPointsCoverage(); // 重要ポイントをなぞれたか
  
  console.log(`判定前の生スコア - 精度:${accuracyScore.toFixed(1)}, カバー:${coverageScore.toFixed(1)}, キーポイント:${keyPointsScore.toFixed(1)}`);
  
  // モバイル環境では判定を適切に調整（過剰な加点はしない）
  if (isMobileDevice()) {
    // モバイルでは判定を緩和するがランク分けを保持
    accuracyScore = Math.min(100, accuracyScore * 1.2);  // 20%増加
    coverageScore = Math.min(100, coverageScore * 1.2);  // 20%増加
    keyPointsScore = Math.min(100, keyPointsScore * 1.2); // 20%増加
  }
  
  // カテゴリ別の判定調整
  if (state.currentCategory === 'numbers') {
    // 数字は特に簡単に書けるように
    keyPointsScore = Math.min(100, keyPointsScore * 1.2);
    
    // 配分も調整（キーポイントの比重を上げる）
    return Math.floor(
      accuracyScore * 0.2 + 
      coverageScore * 0.3 + 
      keyPointsScore * 0.5
    );
  }
  
  // ひらがな・カタカナも適切に
  let finalScore = Math.floor(
    accuracyScore * 0.25 + 
    coverageScore * 0.3 + 
    keyPointsScore * 0.45
  );
  
  // モバイル環境でも過剰な加点はしない
  if (isMobileDevice()) {
    finalScore = Math.min(100, finalScore + 10); // 加点を10に制限
  }
  
  console.log(`最終スコア: ${finalScore}`);
  return finalScore;
}

// フィードバック表示関数
function showFriendlyFeedback() {
  if (!state.showAccuracy) return;
  
  push();
  // 評価のレベルに応じた設定
  let emoji, message, color;
  
  // 評価を適切に分ける（モバイルでも適切な評価を返すように）
  const actualScore = state.accuracy;
  
  // 実際の判定に基づいて評価を決定（閾値はそのまま）
  if (actualScore >= 60) {
    emoji = '⭐⭐⭐';
    message = 'すごい！';
    color = '#4CAF50'; // 緑
    playSuccessSound();
  } else if (actualScore >= 30) {
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
  
  // スコアとフィードバックをログに出力（デバッグ用）
  console.log(`判定結果: ${actualScore}点, 評価: ${message}`);
  
  // フィードバック表示 - 位置を明確に指定
  textAlign(CENTER, TOP);
  
  // デバッグ情報は本番では表示しない
  if (state.debugMode) {
    textSize(12);
    fill(100);
    text(`判定結果: ${actualScore}点`, width/2, 5);
  }
  
  // モバイルデバイスでの表示位置調整
  let yPosEmoji, yPosMessage;
  
  if (isMobileDevice()) {
    // モバイル用表示位置 - 文字より下の空きスペースに表示
    yPosEmoji = height * 0.55;  // 0.75→0.55へ移動
    yPosMessage = height * 0.65; // 0.85→0.65へ移動
    
    // サイズを大きく
    textSize(48);
    fill(color);
    text(emoji, width/2, yPosEmoji);
    
    textSize(32);
    text(message, width/2, yPosMessage);
  } else {
    // PC用表示位置 - 文字の下に表示
    yPosEmoji = height * 0.7;
    yPosMessage = height * 0.8;
    
    textSize(40);
    fill(color);
    text(emoji, width/2, yPosEmoji);
    
    textSize(28);
    text(message, width/2, yPosMessage);
  }
  
  pop();
}

// 表示する文字を更新
function updateDisplayChar() {
  background(255);
  
  // すべてのカテゴリでKleeフォントを使用
  push();
  // スマホの場合は文字サイズを大きくする
  let textSizeValue = isMobileDevice() ? min(width, height) * 0.8 : min(width, height) * 0.7;
  textSize(textSizeValue);
  textAlign(CENTER, CENTER);
  textFont('Klee One'); // Kleeフォントを使用
  fill(220, 220, 220); // 透明度なしの薄いグレー
  
  // Y位置をさらに上に調整（キャンバスの30%の位置に配置）
  let yPosition = isMobileDevice() ? height * 0.3 : height * 0.45;
  text(state.currentChar, width/2, yPosition);
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
  checkButton.id = 'judge-button'; // IDを追加
  checkButton.innerHTML = '✓ はんてい';
  
  // タッチデバイスかどうかで処理を分ける
  if (isTouchDevice()) {
    checkButton.addEventListener('touchstart', function(event) {
      console.log('はんていボタンタッチ');
      
      // 文字テンプレートの更新確認
      if (!state.templateCreated) {
        createTemplateImage();
      }
      
      // 新しい判定ロジックで計算
      state.accuracy = calculateFriendlyScore();
      console.log(`判定結果: ${state.accuracy}点`); // デバッグログ追加
      state.showAccuracy = true;
      
      // 結果表示の更新
      updateDisplayChar();
      
      // 結果を表示するためにスクロールを制御
      if (isMobileDevice()) {
        // キャンバスがある位置に自動スクロール
        const canvasElement = document.getElementById('sketch-holder');
        if (canvasElement) {
          canvasElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      
      // イベントの伝播を止めない (preventDefault不使用)
    });
  } else {
    // 従来のクリックイベントリスナー
    checkButton.addEventListener('click', function(event) {
      event.preventDefault();
      console.log('はんていボタンがクリックされました');
      
      // 文字テンプレートの更新確認
      if (!state.templateCreated) {
        createTemplateImage();
      }
      
      // 新しい判定ロジックで計算
      state.accuracy = calculateFriendlyScore();
      console.log(`判定結果: ${state.accuracy}点`); // デバッグログ追加
      state.showAccuracy = true;
      
      // 結果表示の更新
      updateDisplayChar();
    });
  }
  
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

// タッチスタート - p5.jsのタッチイベント
function touchStarted() {
  // キャンバスの位置を更新（タッチのたびに更新して位置ずれに対応）
  updateCanvasPosition();
  
  if (!isMouseInsideCanvas()) return;
  
  if (touches.length > 0) {
    state.isDrawing = true;
    state.userStrokes.push([]);
    
    // キャンバス内のタッチのみpreventDefault
    // これは描画のスクロール防止のためだけに使用
    return false;
  }
}

// タッチ移動 - p5.jsのタッチイベント 
function touchMoved() {
  if (!state.isDrawing || !isMouseInsideCanvas()) return;
  
  if (touches.length > 0) {
    let currentStroke = state.userStrokes[state.userStrokes.length - 1];
    
    // p5.jsのtouchX, touchYを使用（より正確な座標変換が行われる）
    let touchX = touches[0].x;
    let touchY = touches[0].y;
    
    // モバイルでのキャンバス内座標に変換
    if (state.canvasRect) {
      // キャンバスの位置を考慮した相対座標に変換
      const relativeX = touchX;
      const relativeY = touchY;
      
      if (state.debugMode) {
        console.log(`タッチ座標: raw=(${touches[0].x}, ${touches[0].y}), 変換後=(${relativeX}, ${relativeY})`);
      }
      
      touchX = relativeX;
      touchY = relativeY;
    }
    
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
    
    // キャンバス内の描画中のみpreventDefault
    return false;
  }
}

// タッチエンド - p5.jsのタッチイベント
function touchEnded() {
  state.isDrawing = false;
  // falseを返さないことでタッチイベントを伝播させる
}

// マウスがキャンバス内にあるかチェック
function isMouseInsideCanvas() {
  return mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
}

// キャンバスの位置情報を更新する関数
function updateCanvasPosition() {
  const canvas = document.getElementById('defaultCanvas0');
  if (canvas) {
    state.canvasRect = canvas.getBoundingClientRect();
    if (state.debugMode) {
      console.log(`キャンバス位置更新: x=${state.canvasRect.left}, y=${state.canvasRect.top}, 幅=${state.canvasRect.width}, 高さ=${state.canvasRect.height}`);
    }
  }
}

// 音声読み上げ機能
function speakText(text) {
  if ('speechSynthesis' in window) {
    // iOS Safariでの読み上げ問題対策
    window.speechSynthesis.cancel(); // 既存の読み上げをキャンセル
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    
    console.log('読み上げリクエスト: ' + text);
    
    // 音声を取得（日本語の女性の声があれば選択）
    let voices = window.speechSynthesis.getVoices();
    
    // iOS/Safariでの音声取得問題対策
    if (voices.length === 0) {
      // 音声が読み込めていない場合はタイマーを使って再試行
      setTimeout(function() {
        voices = window.speechSynthesis.getVoices();
        console.log(`利用可能な音声: ${voices.length}個`);
        setVoiceAndSpeak();
      }, 1000);
    } else {
      setVoiceAndSpeak();
    }
    
    function setVoiceAndSpeak() {
      // 利用可能な音声をログ出力
      if (voices.length > 0) {
        console.log('利用可能な音声:');
        voices.forEach((voice, index) => {
          console.log(`${index}: ${voice.name} (${voice.lang})`);
        });
      }
      
      // 優先順位で声を探す
      let selectedVoice = null;
      
      // 1. 日本語の子供向け音声があれば最優先
      selectedVoice = voices.find(voice => 
        voice.lang.includes('ja') && (voice.name.includes('Child') || voice.name.includes('子供')));
      
      // 2. 日本語の女性音声
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.lang.includes('ja') && (voice.name.includes('Female') || voice.name.includes('女性')));
      }
      
      // 3. どれでも日本語音声
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.includes('ja'));
      }
      
      // 4. どの音声でも
      if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices[0];
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`選択された音声: ${selectedVoice.name}`);
      }
      
      // 「ゆっくり解説」風の設定
      utterance.rate = 0.7;  // 少しゆっくり (0.5→0.7)
      utterance.pitch = 1.2; // 高めのピッチ (1.5→1.2)
      utterance.volume = 1.0; // 最大音量
      
      try {
        window.speechSynthesis.speak(utterance);
        console.log('読み上げ開始');
        
        // モバイルでの問題対策: 読み上げ中に画面が切り替わるのを防ぐ
        utterance.onend = function() {
          console.log('読み上げ完了');
        };
        
        utterance.onerror = function(event) {
          console.error('読み上げエラー:', event);
        };
      } catch (e) {
        console.error('音声合成エラー:', e);
      }
    }
  } else {
    console.log('お使いのブラウザは音声合成に対応していません');
    alert('お使いのブラウザは音声合成に対応していません');
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
    // モバイル用のサイズ設定（固定値ではなく比率で計算）
    canvasWidth = min(windowWidth - 20, 400);
    canvasHeight = min(windowHeight * 0.6, 400);
  } else {
    // PC用のサイズ設定
    canvasWidth = min(windowWidth - 40, 600);
    canvasHeight = min(windowHeight - 300, 500);
  }
  
  resizeCanvas(canvasWidth, canvasHeight);
  
  // キャンバスの位置情報を更新
  const canvas = document.getElementById('defaultCanvas0');
  if (canvas) {
    state.canvasRect = canvas.getBoundingClientRect();
    console.log(`リサイズ後のキャンバス位置: x=${state.canvasRect.left}, y=${state.canvasRect.top}, 幅=${state.canvasRect.width}, 高さ=${state.canvasRect.height}`);
  }
  
  // テンプレートバッファが存在する場合のみリサイズ
  if (templateBuffer) {
    templateBuffer.resizeCanvas(canvasWidth, canvasHeight);
    state.templateCreated = false; // テンプレートを再作成する必要がある
  }
  
  // UIの再構築も検討
  createUI();
  
  updateDisplayChar();
}