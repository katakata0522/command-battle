// script.js

// --- グローバル変数・定数定義 ---
let currentPlayerHP = 100; // HP初期値（固定）
let playerAttack = 30;
let playerDefense = 30;
let playerSpeed = 30;
let playerJob = "---";

let actionLogs = {
    phase1_buttonClickTime: 0,
    phase1_buttonClickCount: 0,
    phase1_dialogueClickCount: 0,
    phase2_choice: null,
    phase2_choiceTime: 0,
    phase2_isChoiceBeforeDialogueEnd: false
};

let currentPhase = 1;
let goddessDialogueTimer = null;
// let choiceTimer = null; // 現状未使用
let phase1DialogueFullyDisplayed = false;
let glowingButtonClicked = false;
let phase2DialogueFullyDisplayed = false;
let phase2ChoiceMade = false;
let phase2TimeoutId = null;

// 敵のステータス
let enemyHP = 75;
let enemyAttack = 25;
let enemyDefense = 15;
let enemyName = "ゴブリン";
let isPlayerTurn = true;
let isPlayerDefending = false;

const GODDESS_DIALOGUE_INTERVAL = 2500; // 女神セリフ間隔 (ms)

// HTML要素の取得
const gameContainer = document.getElementById('game-container');
const phase1Element = document.getElementById('phase-1');
const phase2Element = document.getElementById('phase-2');
const phase3Element = document.getElementById('phase-3');
const phase4Element = document.getElementById('phase-4');
const phase5Element = document.getElementById('phase-5');

const goddessMessageArea1 = document.getElementById('goddess-message-area-1');
const glowingButton = document.getElementById('glowing-button');

const goddessMessageArea2 = document.getElementById('goddess-message-area-2');
const choicesArea = document.getElementById('choices-area');

const goddessMessageArea3 = document.getElementById('goddess-message-area-3');
const playerJobDisplay = document.getElementById('player-job');
const playerHpDisplay = document.getElementById('player-hp');
const playerAttackDisplay = document.getElementById('player-attack');
const playerDefenseDisplay = document.getElementById('player-defense');
const playerSpeedDisplay = document.getElementById('player-speed');
const toBattleButton = document.getElementById('to-battle-button');

const battlePlayerJobDisplay = document.getElementById('battle-player-job');
const battlePlayerHpDisplay = document.getElementById('battle-player-hp');
const battlePlayerMaxHpDisplay = document.getElementById('battle-player-max-hp');
const enemyNameDisplay = document.getElementById('enemy-name');
const battleEnemyHpDisplay = document.getElementById('battle-enemy-hp');
const battleEnemyMaxHpDisplay = document.getElementById('battle-enemy-max-hp');
const battleLogArea = document.getElementById('battle-log-area');
const attackCommandButton = document.getElementById('attack-command');
const defenseCommandButton = document.getElementById('defense-command');

const resultMessageArea = document.getElementById('result-message-area');
const retryBattleButton = document.getElementById('retry-battle-button');
const reincarnateButton = document.getElementById('reincarnate-button');


// --- 初期化処理 ---
function initializeGame() {
    currentPlayerHP = 100;
    playerAttack = 30;
    playerDefense = 30;
    playerSpeed = 30;
    playerJob = "---";

    actionLogs = {
        phase1_buttonClickTime: 0,
        phase1_buttonClickCount: 0,
        phase1_dialogueClickCount: 0,
        phase2_choice: null,
        phase2_choiceTime: 0,
        phase2_isChoiceBeforeDialogueEnd: false
    };

    goddessMessageArea1.textContent = "";
    goddessMessageArea1.classList.remove('single-sentence');
    goddessMessageArea2.textContent = "";
    goddessMessageArea2.classList.remove('single-sentence');
    goddessMessageArea3.textContent = ""; // フェーズ3のメッセージエリアもクリア

    glowingButton.style.display = 'none';
    glowingButtonClicked = false;
    actionLogs.phase1_buttonClickCount = 0;
    choicesArea.innerHTML = "";

    clearTimeout(goddessDialogueTimer);
    clearTimeout(phase2TimeoutId);

    // イベントリスナーのクリア (重要なものだけ)
    glowingButton.removeEventListener('click', handleGlowingButtonClick);
    gameContainer.removeEventListener('click', handlePhase1ScreenClick);
    toBattleButton.removeEventListener('click', handleToBattleButtonClick);
    attackCommandButton.removeEventListener('click', handleAttackCommand);
    defenseCommandButton.removeEventListener('click', handleDefenseCommand);
    // フェーズ5のボタンは .onclick を使っているので、関数内で再設定される

    currentPhase = 1;
    showPhase(currentPhase);
    startPhase1();
}

// --- フェーズ管理 ---
function showPhase(phaseNumber) {
    const phases = document.querySelectorAll('.phase');
    phases.forEach(phase => {
        phase.classList.remove('active');
    });
    const currentPhaseElement = document.getElementById(`phase-${phaseNumber}`);
    if (currentPhaseElement) {
        currentPhaseElement.classList.add('active');
    } else {
        console.error("指定されたフェーズの要素が見つかりません:", phaseNumber);
    }
}

// --- フェーズ1：導入と最初の行動ログ取得 ---
const phase1Dialogues = [
    "……あなたは、目を開けた。",
    "ここは、世界の狭間……魂の在り処。",
    "私は、この場所を管理する者……そうね、『女神』とでも呼んでちょうだい。",
    "あなたの魂の形、少し見せてもらうわね……"
];
const phase1ButtonAppearDialogueIndex = 3;

const phase1PostButtonDialogues = [
    "さあ、覚悟は決まったかしら？",
    "この光に触れてみて。",
    "あなたの勇気や慈愛で満ちるように。"
];

let phase1DialogueIndex = 0;
let phase1PostButtonDialogueIndex = 0;
let phase1ButtonAppearTime = 0;

function startPhase1() {
    phase1DialogueIndex = 0;
    phase1PostButtonDialogueIndex = 0;
    goddessMessageArea1.textContent = "";
    goddessMessageArea1.classList.remove('single-sentence');
    actionLogs.phase1_dialogueClickCount = 0;
    phase1DialogueFullyDisplayed = false;
    glowingButton.style.display = 'none';

    glowingButton.removeEventListener('click', handleGlowingButtonClick); // リスナーをクリア
    gameContainer.removeEventListener('click', handlePhase1ScreenClick); // リスナーをクリア

    displayNextPhase1Dialogue();
    gameContainer.addEventListener('click', handlePhase1ScreenClick);
}

function handlePhase1ScreenClick(event) {
    if (event.target !== glowingButton && !phase1DialogueFullyDisplayed) {
        actionLogs.phase1_dialogueClickCount++;
        console.log("セリフ中クリックカウント:", actionLogs.phase1_dialogueClickCount);
    }
}

function displayNextPhase1Dialogue() {
    goddessMessageArea1.classList.remove('single-sentence');
    goddessMessageArea1.textContent = "";

    if (phase1DialogueIndex < phase1Dialogues.length) {
        goddessMessageArea1.textContent = phase1Dialogues[phase1DialogueIndex];
        goddessMessageArea1.classList.add('single-sentence');

        if (phase1DialogueIndex === phase1ButtonAppearDialogueIndex) {
            glowingButton.style.display = 'inline-block';
            phase1ButtonAppearTime = Date.now();
            glowingButton.addEventListener('click', handleGlowingButtonClick);
        }
        phase1DialogueIndex++;
        goddessDialogueTimer = setTimeout(displayNextPhase1Dialogue, GODDESS_DIALOGUE_INTERVAL);
    } else if (phase1PostButtonDialogueIndex < phase1PostButtonDialogues.length) {
        goddessMessageArea1.textContent = phase1PostButtonDialogues[phase1PostButtonDialogueIndex];
        goddessMessageArea1.classList.add('single-sentence');

        phase1PostButtonDialogueIndex++;
        if (phase1PostButtonDialogueIndex === phase1PostButtonDialogues.length) {
            phase1DialogueFullyDisplayed = true;
            console.log("フェーズ1: 全セリフ表示完了");
            if (glowingButtonClicked) {
                handleGlowingButtonClick(); // セリフ表示完了時点でボタンが押されていれば遷移
            }
        }
        // 次のセリフがあるか、まだ全セリフ表示が完了していなければタイマー起動
        if (phase1PostButtonDialogueIndex < phase1PostButtonDialogues.length || !phase1DialogueFullyDisplayed) {
             goddessDialogueTimer = setTimeout(displayNextPhase1Dialogue, GODDESS_DIALOGUE_INTERVAL);
        } else if (phase1DialogueFullyDisplayed && !glowingButtonClicked) {
            console.log("フェーズ1: 全セリフ表示完了、ボタンクリック待ち");
        }
    } else {
        phase1DialogueFullyDisplayed = true; // 念のため
        console.log("フェーズ1: 全セリフ表示完了（通常はここに来ない）");
         if (glowingButtonClicked) {
            handleGlowingButtonClick();
        }
    }
}

function handleGlowingButtonClick() {
    actionLogs.phase1_buttonClickCount++;
    console.log("光るボタン クリック回数:", actionLogs.phase1_buttonClickCount);

    if (!glowingButtonClicked) {
        actionLogs.phase1_buttonClickTime = Date.now() - phase1ButtonAppearTime;
        console.log("光るボタン クリックまでの時間:", actionLogs.phase1_buttonClickTime, "ms");
        glowingButtonClicked = true;
    }

    if (phase1DialogueFullyDisplayed && glowingButtonClicked) {
        clearTimeout(goddessDialogueTimer);
        gameContainer.removeEventListener('click', handlePhase1ScreenClick);
        console.log("フェーズ1完了、フェーズ2へ");
        currentPhase = 2;
        showPhase(currentPhase);
        startPhase2();
    } else if (phase1DialogueFullyDisplayed && !glowingButtonClicked) {
        console.log("フェーズ1: 全セリフ表示完了、ボタンクリック待ち（ボタンハンドラ内）");
    } else if (!phase1DialogueFullyDisplayed && glowingButtonClicked) {
        console.log("フェーズ1: ボタンクリック済み、セリフ表示完了待ち");
    }
}

// --- フェーズ2：簡単な選択と追加ログ取得 ---
const phase2Dialogues = [
    "ふむ……あなたの最初の行動、確かに見届けたわ。",
    "では、一つ質問よ。",
    "あなたは目の前に『道』が分かれていたら、どうするかしら？"
];
let phase2DialogueIndex = 0;
let phase2ChoiceStartTime = 0;

function startPhase2() {
    console.log("フェーズ2 開始");
    phase2DialogueIndex = 0;
    phase2DialogueFullyDisplayed = false;
    phase2ChoiceMade = false;
    goddessMessageArea2.textContent = "";
    goddessMessageArea2.classList.remove('single-sentence');
    choicesArea.innerHTML = "";
    clearTimeout(phase2TimeoutId);

    displayNextPhase2Dialogue();
}

function displayNextPhase2Dialogue() {
    goddessMessageArea2.classList.remove('single-sentence');
    goddessMessageArea2.textContent = "";

    if (phase2DialogueIndex < phase2Dialogues.length) {
        goddessMessageArea2.textContent = phase2Dialogues[phase2DialogueIndex];
        goddessMessageArea2.classList.add('single-sentence');

        phase2DialogueIndex++;
        if (phase2DialogueIndex === phase2Dialogues.length) {
            phase2DialogueFullyDisplayed = true;
            console.log("フェーズ2: 全セリフ表示完了、選択肢表示開始");
            renderPhase2Choices();
            phase2ChoiceStartTime = Date.now();
            phase2TimeoutId = setTimeout(addExtraChoice, 60 * 1000); // 1分
        }
        if (phase2DialogueIndex < phase2Dialogues.length) { // 最後のセリフでなければタイマー起動
            goddessDialogueTimer = setTimeout(displayNextPhase2Dialogue, GODDESS_DIALOGUE_INTERVAL);
        }
    }
}

function renderPhase2Choices() {
    choicesArea.innerHTML = `
        <button class="choice-button" data-choice="迷わず進む">迷わず進む</button>
        <button class="choice-button" data-choice="慎重に調べる">慎重に調べる</button>
    `;
    const choiceButtons = choicesArea.querySelectorAll('.choice-button');
    choiceButtons.forEach(button => {
        button.removeEventListener('click', handlePhase2Choice);
        button.addEventListener('click', handlePhase2Choice);
    });
}

function addExtraChoice() {
    if (phase2ChoiceMade) return;

    console.log("1分経過、追加選択肢表示");
    const extraButton = document.createElement('button');
    extraButton.classList.add('choice-button');
    extraButton.dataset.choice = "女神に聞いてみる";
    extraButton.textContent = "女神に聞いてみる";
    extraButton.removeEventListener('click', handlePhase2Choice);
    extraButton.addEventListener('click', handlePhase2Choice);
    choicesArea.appendChild(extraButton);
}

function handlePhase2Choice(event) {
    if (phase2ChoiceMade) return;
    phase2ChoiceMade = true;
    clearTimeout(phase2TimeoutId);
    clearTimeout(goddessDialogueTimer); // フェーズ2のセリフタイマーも止める

    actionLogs.phase2_choice = event.target.dataset.choice;
    actionLogs.phase2_choiceTime = Date.now() - phase2ChoiceStartTime;
    actionLogs.phase2_isChoiceBeforeDialogueEnd = !phase2DialogueFullyDisplayed;

    console.log("選択肢:", actionLogs.phase2_choice);
    console.log("選択までの時間:", actionLogs.phase2_choiceTime, "ms");
    console.log("セリフ完了前に選択:", actionLogs.phase2_isChoiceBeforeDialogueEnd);

    if (actionLogs.phase2_choice === "女神に聞いてみる") {
        // 一旦既存のセリフエリアに追加する形でコメント
        goddessMessageArea2.classList.remove('single-sentence'); // 強調を解除
        goddessMessageArea2.textContent += "\n\n女神：「あら、私に頼るの？それも一つの手ね…」";
    }

    setTimeout(() => {
        console.log("フェーズ2完了、フェーズ3へ");
        currentPhase = 3;
        showPhase(currentPhase);
        startPhase3();
    }, actionLogs.phase2_choice === "女神に聞いてみる" ? 2000 : 1000); // 女神コメント表示のため少し待つ時間を調整
}

// --- フェーズ3：職業決定、ステータス表示、女神のコメント ---
function startPhase3() {
    console.log("フェーズ3 開始");
    calculateStatsAndJob();

    // HTMLのステータス表示順に合わせて更新
    playerHpDisplay.textContent = currentPlayerHP;
    playerAttackDisplay.textContent = playerAttack;
    playerDefenseDisplay.textContent = playerDefense;
    playerSpeedDisplay.textContent = playerSpeed;
    playerJobDisplay.textContent = `職業：${playerJob}`;


    let jobComment = "";
    let hintComment = "";
    if (playerJob === "バーサーカー") {
        jobComment = "……あなたの魂は、燃えるような赤ね。衝動と、力強さを感じるわ。\nその性質、まさに《バーサーカー》。振るわれる力は、全てを薙ぎ払うでしょう。";
        hintComment = "……でもちょっと...焦りすぎよ？";
    } else if (playerJob === "賢者") {
        jobComment = "……あなたの魂は、深い青ね。冷静と、探求心を感じるわ。\nその性質、まさしく《賢者》。その知識は、あらゆる困難を解き明かすでしょう。";
        hintComment = "……それでも少しくらいは衝動のまま進んでみるのもいいかもしれないわね";
    } else if (playerJob === "風刃の影") {
        jobComment = "……あなたの魂は、疾風のような緑ね。機敏さと、鋭さを感じるわ。\nその性質、まさに《風刃の影》。その速さは、誰にも捉えられないでしょう。";
        hintComment = "……私の話ちゃんと覚えていますわよね？";
    }

    goddessMessageArea3.textContent = jobComment + "\n" + hintComment + "\n\n";
    goddessMessageArea3.textContent += "あなたの行動は全部見せてもらったわ。最初の光にどれだけ触れたかとか、道をどう選んだかとかは……些細なことよね。きっと。";

    toBattleButton.removeEventListener('click', handleToBattleButtonClick);
    toBattleButton.addEventListener('click', handleToBattleButtonClick);
}

function calculateStatsAndJob() {
    playerAttack = 30;
    playerDefense = 30;
    playerSpeed = 30;

    playerAttack += actionLogs.phase1_buttonClickCount * 2;
    playerAttack += actionLogs.phase1_dialogueClickCount * 1;

    if (actionLogs.phase1_buttonClickTime < 3000) {
        playerSpeed += 15;
    } else if (actionLogs.phase1_buttonClickTime < 5000) {
        playerSpeed += 5;
    } else {
        playerDefense += Math.floor(actionLogs.phase1_buttonClickTime / 5000) * 3;
    }

    if (actionLogs.phase2_choice === "迷わず進む") {
        playerAttack += 10;
        playerSpeed += 5;
    } else if (actionLogs.phase2_choice === "慎重に調べる") {
        playerDefense += 15;
    } else if (actionLogs.phase2_choice === "女神に聞いてみる") {
        playerDefense += 20;
        playerSpeed -= 5;
    }

    if (actionLogs.phase2_isChoiceBeforeDialogueEnd) {
        playerSpeed += 20;
    } else if (actionLogs.phase2_choiceTime < 4000) {
        playerSpeed += 10;
    } else {
        playerDefense += Math.floor(actionLogs.phase2_choiceTime / 8000) * 2;
    }

    playerAttack = Math.max(1, Math.min(playerAttack, 100));
    playerDefense = Math.max(1, Math.min(playerDefense, 100));
    playerSpeed = Math.max(1, Math.min(playerSpeed, 100));

    if (playerAttack >= playerDefense && playerAttack >= playerSpeed) {
        playerJob = "バーサーカー";
    } else if (playerDefense > playerAttack && playerDefense >= playerSpeed) { // 賢者は防御最優先
        playerJob = "賢者";
    } else { // 残りが風刃の影
        playerJob = "風刃の影";
    }
    console.log(`計算後ステータス: HP:${currentPlayerHP}, ATK:${playerAttack}, DEF:${playerDefense}, SPD:${playerSpeed}, JOB:${playerJob}`);
}

function handleToBattleButtonClick() {
    console.log("フェーズ3完了、フェーズ4へ");
    currentPhase = 4;
    showPhase(currentPhase);
    startPhase4();
}

// --- フェーズ4：戦闘 ---
function startPhase4() {
    console.log("フェーズ4 開始: 戦闘！");
    battleLogArea.textContent = "";

    enemyHP = 75; // 敵のHPを戦闘開始時にリセット
    enemyNameDisplay.textContent = enemyName;

    battlePlayerJobDisplay.textContent = playerJob;
    battlePlayerMaxHpDisplay.textContent = 100; // MaxHP固定
    // currentPlayerHPは、敗北後の再挑戦で回復されているか、
    // フェーズ3から来た場合は初期値のままのはず
    updateBattleHPDisplay(); // プレイヤーHPもここで更新

    battleEnemyMaxHpDisplay.textContent = enemyHP;
    updateBattleHPDisplay();

    addBattleLog(`${enemyName}が現れた！`);

    isPlayerTurn = true;
    isPlayerDefending = false;
    enableCommands();

    attackCommandButton.removeEventListener('click', handleAttackCommand);
    defenseCommandButton.removeEventListener('click', handleDefenseCommand);
    attackCommandButton.addEventListener('click', handleAttackCommand);
    defenseCommandButton.addEventListener('click', handleDefenseCommand);
}

function updateBattleHPDisplay() {
    battlePlayerHpDisplay.textContent = Math.max(0, currentPlayerHP);
    battleEnemyHpDisplay.textContent = Math.max(0, enemyHP);
}

function addBattleLog(message) {
    battleLogArea.innerHTML += message + "<br>";
    battleLogArea.scrollTop = battleLogArea.scrollHeight;
}

function enableCommands() {
    attackCommandButton.disabled = false;
    defenseCommandButton.disabled = false;
}

function disableCommands() {
    attackCommandButton.disabled = true;
    defenseCommandButton.disabled = true;
}

function handleAttackCommand() {
    if (!isPlayerTurn) return;
    disableCommands();

    let damage = Math.max(1, playerAttack - enemyDefense);
    enemyHP -= damage;
    addBattleLog(`あなたの攻撃！ ${enemyName}に${damage}のダメージ！`);
    updateBattleHPDisplay();
    isPlayerDefending = false;

    if (checkBattleEnd()) return;
    setTimeout(enemyAction, 1000);
}

function handleDefenseCommand() {
    if (!isPlayerTurn) return;
    disableCommands();

    addBattleLog("あなたは防御している！");
    isPlayerDefending = true;

    if (checkBattleEnd()) return;
    setTimeout(enemyAction, 1000);
}

function enemyAction() {
    if (enemyHP <= 0) return;
    isPlayerTurn = false;

    let damageToPlayer = enemyAttack;
    let actualDamageDealt = damageToPlayer;

    if (isPlayerDefending) {
        actualDamageDealt = Math.max(1, Math.floor(damageToPlayer / 2));
        addBattleLog(`${enemyName}の攻撃！ あなたは防御していて${actualDamageDealt}のダメージを受けた。`);
    } else {
        addBattleLog(`${enemyName}の攻撃！ あなたに${actualDamageDealt}のダメージ！`);
    }
    currentPlayerHP -= actualDamageDealt;
    updateBattleHPDisplay();
    isPlayerDefending = false;

    if (checkBattleEnd()) return;
    isPlayerTurn = true;
    enableCommands();
}

function checkBattleEnd() {
    if (enemyHP <= 0) {
        addBattleLog(`${enemyName}を倒した！`);
        disableCommands();
        setTimeout(() => startPhase5(true), 1500);
        return true;
    }
    if (currentPlayerHP <= 0) {
        addBattleLog("あなたは倒れてしまった…");
        disableCommands();
        setTimeout(() => startPhase5(false), 1500);
        return true;
    }
    return false;
}

// --- フェーズ5：結果と次のステップへの示唆 ---
function startPhase5(isVictory) {
    console.log("フェーズ5 開始: 結果");
    showPhase(5);

    if (isVictory) {
        resultMessageArea.textContent = "ゴブリンに勝利した！\n女神：「ふふ、なかなか筋がいいじゃない。その魂の輝き、ドラゴンにも通用するかしら？ あなたの雄姿、もっと見ていたくなったわ。」";
    } else {
        currentPlayerHP = 100; // 敗北時はHPを全回復
        resultMessageArea.textContent = "ゴブリンに敗北した…\n女神：「あらら、ゴブリン程度にやられてしまうなんて……残念だったわね。でも、魂の形は一つじゃないのよ？ 次は違うあなたが目覚めるかも……しれないわね？ 諦めずに、またその姿を見せてちょうだい。」";
    }
    resultMessageArea.textContent += "\n\nこの洞窟の奥には、伝説のドラゴンが眠っているわ。あなたの挑戦、いつでも待っているわよ。";

    retryBattleButton.onclick = () => {
        console.log("戦闘へ戻る");
        // 敗北時はHP回復済み。勝利時はそのままのHPで再戦（実質、勝利後の再戦はあまり意味がないが、ボタンとしては機能する）
        // もし勝利後もHP全快で再挑戦させたいなら、ここで currentPlayerHP = 100; をisVictoryに関わらず実行
        currentPhase = 4;
        showPhase(currentPhase);
        startPhase4();
    };
    reincarnateButton.onclick = () => {
        console.log("最初から");
        initializeGame();
    };
}

// --- ゲーム開始 ---
window.onload = initializeGame;