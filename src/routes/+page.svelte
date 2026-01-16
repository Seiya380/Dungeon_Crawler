<script>
    import {
        roll,
        createPlayer,
        generateEnemy,
        calculateDamage,
        potionHeal,
        canFlee,
        fleePenalty,
        findPotion,
        goldReward
    } from '$lib/game.js';

    // Game state
    let gameState = $state('menu'); // 'menu', 'loading', 'playing', 'victory', 'gameover'
    let player = $state(createPlayer());
    let currentRoom = $state(1);
    let enemy = $state(null);
    let logs = $state([]);
    let waitingForAction = $state(false);

    const TOTAL_ROOMS = 3;

    // Add a log message to the console
    function log(message, type = 'info') {
        logs.push({ message, type, id: Date.now() + Math.random() });
    }

    // Clear logs
    function clearLogs() {
        logs = [];
    }

    // Start loading sequence
    function startLoadingSequence() {
        gameState = 'loading';
        setTimeout(() => {
            startGame();
        }, 3000);
    }

    // Start a new game
    function startGame() {
        player = createPlayer();
        currentRoom = 1;
        enemy = null;
        clearLogs();
        gameState = 'playing';

        log('='.repeat(50), 'separator');
        log('BIENVENUE DANS LE DONJON', 'title');
        log('='.repeat(50), 'separator');
        log('');
        log('Vous entrez dans un donjon sombre et humide...');
        log('Vous devez survivre a 3 salles pour vous echapper!');
        log('');

        enterRoom();
    }

    // Enter a new room
    function enterRoom() {
        log('-'.repeat(40), 'separator');
        log(`SALLE ${currentRoom}/${TOTAL_ROOMS}`, 'room');
        log('-'.repeat(40), 'separator');

        enemy = generateEnemy(currentRoom);

        if (enemy.isBoss) {
            log('');
            log('*** UN BOSS APPARAIT! ***', 'danger');
        }

        log(`Un ${enemy.name} apparait!`, 'enemy');
        log(`PV: ${enemy.hp}/${enemy.maxHp} | Degats: ${enemy.dmgMin}-${enemy.dmgMax}`);
        log('');

        startCombat();
    }

    // Start combat
    function startCombat() {
        showStatus();
        waitingForAction = true;
    }

    // Show current status
    function showStatus() {
        log('');
        log(`[VOUS] PV: ${player.hp}/${player.maxHp} | Potions: ${player.potions} | Or: ${player.gold}`, 'player');
        log(`[${enemy.name}] PV: ${enemy.hp}/${enemy.maxHp}`, 'enemy');
        log('');
        log('Actions: (A)ttaquer | (P)otion | (F)uir', 'action');
    }

    // Handle player action
    function handleAction(action) {
        if (!waitingForAction) return;
        waitingForAction = false;

        log('');

        switch(action.toUpperCase()) {
            case 'A':
                performAttack();
                break;
            case 'P':
                usePotion();
                break;
            case 'F':
                attemptFlee();
                break;
            default:
                log('Action invalide! Attaque par defaut.', 'warning');
                performAttack();
        }
    }

    // Player attacks enemy
    function performAttack() {
        const baseDamage = roll(player.attack - 5, player.attack + 5);
        const { damage, isCritical } = calculateDamage(baseDamage);

        enemy.hp = Math.max(0, enemy.hp - damage);

        if (isCritical) {
            log(`COUP CRITIQUE! Vous infligez ${damage} degats!`, 'critical');
        } else {
            log(`Vous attaquez et infligez ${damage} degats.`, 'player');
        }

        if (enemy.hp <= 0) {
            enemyDefeated();
        } else {
            enemyTurn();
        }
    }

    // Enemy attacks player
    function enemyTurn() {
        const damage = roll(enemy.dmgMin, enemy.dmgMax);
        player.hp = Math.max(0, player.hp - damage);

        log(`${enemy.name} riposte et inflige ${damage} degats!`, 'danger');

        if (player.hp <= 0) {
            gameOver();
        } else {
            showStatus();
            waitingForAction = true;
        }
    }

    // Use a potion
    function usePotion() {
        if (player.potions <= 0) {
            log('Vous n\'avez plus de potions!', 'warning');
            log('Attaque par defaut.', 'warning');
            performAttack();
            return;
        }

        player.potions--;
        const heal = potionHeal();
        const actualHeal = Math.min(heal, player.maxHp - player.hp);
        player.hp = Math.min(player.maxHp, player.hp + heal);

        log(`Vous buvez une potion et recuperez ${actualHeal} PV!`, 'heal');

        // Enemy still attacks after potion
        enemyTurn();
    }

    // Attempt to flee
    function attemptFlee() {
        if (canFlee(currentRoom)) {
            const penalty = fleePenalty();
            player.hp = Math.max(1, player.hp - penalty);

            log(`Vous fuyez! Mais vous prenez ${penalty} degats en fuyant.`, 'warning');
            log('La salle recommence...', 'info');
            log('');

            if (player.hp <= 0) {
                gameOver();
            } else {
                // Regenerate enemy for same room
                enterRoom();
            }
        } else {
            log('Fuite echouee! L\'ennemi vous bloque!', 'danger');
            enemyTurn();
        }
    }

    // Enemy defeated
    function enemyDefeated() {
        log('');
        log(`${enemy.name} est vaincu!`, 'victory');

        // Gold reward
        const gold = goldReward(currentRoom);
        player.gold += gold;
        log(`Vous gagnez ${gold} pieces d'or!`, 'gold');

        // Chance to find potion
        if (findPotion()) {
            player.potions++;
            log('Vous trouvez une potion!', 'heal');
        }

        // Check for victory
        if (currentRoom >= TOTAL_ROOMS) {
            victory();
        } else {
            currentRoom++;
            log('');
            log('Vous avancez vers la prochaine salle...', 'info');
            setTimeout(() => enterRoom(), 500);
        }
    }

    // Game Over
    function gameOver() {
        gameState = 'gameover';
        waitingForAction = false;

        log('');
        log('='.repeat(50), 'separator');
        log('GAME OVER', 'gameover');
        log('='.repeat(50), 'separator');
        log('Vous etes mort dans le donjon...', 'danger');
        log(`Salles completees: ${currentRoom - 1}/${TOTAL_ROOMS}`);
        log(`Or collecte: ${player.gold}`);
    }

    // Victory
    function victory() {
        gameState = 'victory';
        waitingForAction = false;

        log('');
        log('='.repeat(50), 'separator');
        log('VICTOIRE!', 'victory');
        log('='.repeat(50), 'separator');
        log('Vous avez survecu au donjon!', 'victory');
        log(`Or total: ${player.gold} pieces`);
        log(`Potions restantes: ${player.potions}`);
        log(`PV restants: ${player.hp}/${player.maxHp}`);
    }

    // Keyboard handler
    function handleKeydown(event) {
        if (gameState === 'menu') {
            if (event.key === 'Enter' || event.key === ' ') {
                startLoadingSequence();
            }
        } else if (waitingForAction) {
            const key = event.key.toUpperCase();
            if (['A', 'P', 'F'].includes(key)) {
                handleAction(key);
            }
        } else if (gameState === 'victory' || gameState === 'gameover') {
            if (event.key === 'Enter' || event.key === ' ') {
                gameState = 'menu';
            }
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<main>
    <div class="console">
        <div class="console-header">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
            <span class="title">Dungeon Crawler - Console</span>
        </div>

        <div class="console-body">
            {#if gameState === 'menu'}
                <div class="menu">
                    <pre class="ascii-art">
    ____
   / __ \__  ______  ____ ____  ____  ____
  / / / / / / / __ \/ __ `/ _ \/ __ \/ __ \
 / /_/ / /_/ / / / / /_/ /  __/ /_/ / / / /
/_____/\__,_/_/ /_/\__, /\___/\____/_/ /_/
                  /____/
   ______                    __
  / ____/________ __      __/ /__  _____
 / /   / ___/ __ `/ | /| / / / _ \/ ___/
/ /___/ /  / /_/ /| |/ |/ / /  __/ /
\____/_/   \__,_/ |__/|__/_/\___/_/
                    </pre>
                    <p class="blink">&gt; Appuyez sur ENTREE pour commencer...</p>
                    <p class="instructions">
                        Survivez a 3 salles pour vous echapper!<br>
                        Controles: (A)ttaquer | (P)otion | (F)uir
                    </p>
                </div>
            {:else if gameState === 'loading'}
                <div class="loading-screen">
                    <pre class="ascii-art-combat">
        /| ________________
  O|===|* >________________>
        \|

         O                  (@@)
        /|\                /|__|\
        / \                 /  \
      [HEROS]             [MONSTRE]
                    </pre>
                    <p class="blink loading-text">PREPARATION DU COMBAT...</p>
                    <div class="loading-bar">
                        <div class="loading-progress"></div>
                    </div>
                </div>
            {:else}
                <div class="logs">
                    {#each logs as log (log.id)}
                        <p class="log-line {log.type}">{log.message}</p>
                    {/each}
                </div>

                {#if waitingForAction}
                    <div class="input-line">
                        <span class="prompt">&gt;</span>
                        <span class="cursor blink">_</span>
                    </div>
                    <div class="action-buttons">
                        <button onclick={() => handleAction('A')}>Attaquer (A)</button>
                        <button onclick={() => handleAction('P')}>Potion (P)</button>
                        <button onclick={() => handleAction('F')}>Fuir (F)</button>
                    </div>
                {/if}

                {#if gameState === 'victory' || gameState === 'gameover'}
                    <p class="blink restart">&gt; Appuyez sur ENTREE pour rejouer...</p>
                    <button class="restart-btn" onclick={() => gameState = 'menu'}>Rejouer</button>
                {/if}
            {/if}
        </div>
    </div>
</main>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        background: #1a1a2e;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Courier New', Courier, monospace;
    }

    main {
        width: 100%;
        max-width: 800px;
        padding: 20px;
        box-sizing: border-box;
    }

    .console {
        background: #0d0d0d;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }

    .console-header {
        background: #2d2d2d;
        padding: 10px 15px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
    }

    .dot.red { background: #ff5f56; }
    .dot.yellow { background: #ffbd2e; }
    .dot.green { background: #27ca40; }

    .title {
        color: #888;
        margin-left: 10px;
        font-size: 14px;
    }

    .console-body {
        padding: 20px;
        min-height: 500px;
        max-height: 600px;
        overflow-y: auto;
        color: #00ff00;
    }

    .menu {
        text-align: center;
    }

    .ascii-art {
        color: #ff6b6b;
        font-size: 10px;
        line-height: 1.2;
        margin-bottom: 30px;
    }

    .instructions {
        color: #888;
        margin-top: 20px;
        line-height: 1.8;
    }

    .blink {
        animation: blink 1s step-end infinite;
    }

    @keyframes blink {
        50% { opacity: 0; }
    }

    .loading-screen {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
    }

    .ascii-art-combat {
        font-size: 12px;
        color: #fff;
        margin-bottom: 20px;
        font-weight: bold;
    }

    .loading-text {
        color: #ffd700;
        margin-bottom: 20px;
    }

    .loading-bar {
        width: 80%;
        height: 10px;
        background: #333;
        border: 1px solid #ffd700;
        border-radius: 5px;
        overflow: hidden;
    }

    .loading-progress {
        width: 0%;
        height: 100%;
        background: #ffd700;
        animation: progress 3s linear forwards;
    }

    @keyframes progress {
        0% { width: 0%; }
        100% { width: 100%; }
    }

    .logs {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .log-line {
        margin: 0;
        padding: 2px 0;
        font-size: 14px;
        white-space: pre-wrap;
        word-wrap: break-word;
    }

    .log-line.separator { color: #444; }
    .log-line.title { color: #ffd700; font-weight: bold; font-size: 18px; text-align: center; }
    .log-line.room { color: #00bfff; font-weight: bold; }
    .log-line.player { color: #00ff00; }
    .log-line.enemy { color: #ff6b6b; }
    .log-line.danger { color: #ff4444; }
    .log-line.warning { color: #ffaa00; }
    .log-line.heal { color: #44ff44; }
    .log-line.critical { color: #ff00ff; font-weight: bold; }
    .log-line.victory { color: #ffd700; font-weight: bold; }
    .log-line.gameover { color: #ff0000; font-weight: bold; font-size: 24px; text-align: center; }
    .log-line.gold { color: #ffd700; }
    .log-line.action { color: #00ffff; }

    .input-line {
        margin-top: 10px;
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .prompt {
        color: #00ff00;
    }

    .cursor {
        color: #00ff00;
        font-weight: bold;
    }

    .action-buttons {
        margin-top: 15px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }

    .action-buttons button {
        background: #1a1a2e;
        color: #00ff00;
        border: 1px solid #00ff00;
        padding: 10px 20px;
        font-family: inherit;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .action-buttons button:hover {
        background: #00ff00;
        color: #0d0d0d;
    }

    .restart {
        margin-top: 20px;
        color: #ffd700;
    }

    .restart-btn {
        margin-top: 15px;
        background: #ffd700;
        color: #0d0d0d;
        border: none;
        padding: 12px 30px;
        font-family: inherit;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
    }

    .restart-btn:hover {
        background: #ffed4a;
        transform: scale(1.05);
    }
</style>
