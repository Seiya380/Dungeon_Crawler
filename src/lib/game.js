// =====================================================
// DUNGEON CRAWLER - Game Logic
// =====================================================

// Utility function: random number between min and max (inclusive)
export function roll(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Enemy names by difficulty
const ENEMY_NAMES = {
    easy: ['Gobelin', 'Rat Géant', 'Slime', 'Squelette'],
    medium: ['Orc', 'Loup-Garou', 'Spectre', 'Golem de Pierre'],
    hard: ['Dragon', 'Démon', 'Liche', 'Hydre']
};

// Create initial player state
export function createPlayer() {
    return {
        hp: 100,
        maxHp: 100,
        potions: 3,
        attack: 15,
        gold: 0
    };
}

// Generate an enemy based on room number (difficulty scales)
export function generateEnemy(roomNumber) {
    let names, hpMin, hpMax, dmgMin, dmgMax;

    if (roomNumber === 1) {
        names = ENEMY_NAMES.easy;
        hpMin = 30;
        hpMax = 50;
        dmgMin = 5;
        dmgMax = 12;
    } else if (roomNumber === 2) {
        names = ENEMY_NAMES.medium;
        hpMin = 50;
        hpMax = 80;
        dmgMin = 10;
        dmgMax = 18;
    } else {
        // Room 3 - Boss final!
        names = ENEMY_NAMES.hard;
        hpMin = 80;
        hpMax = 120;
        dmgMin = 15;
        dmgMax = 25;
    }

    const name = names[roll(0, names.length - 1)];
    const hp = roll(hpMin, hpMax);

    return {
        name: roomNumber === 3 ? `${name} [BOSS]` : name,
        hp,
        maxHp: hp,
        dmgMin,
        dmgMax,
        isBoss: roomNumber === 3
    };
}

// Calculate damage with critical hit chance (20%)
export function calculateDamage(baseDamage) {
    const isCritical = roll(1, 100) <= 20;
    const damage = isCritical ? baseDamage * 2 : baseDamage;
    return { damage, isCritical };
}

// Potion healing amount
export function potionHeal() {
    return roll(25, 40);
}

// Flee success chance (decreases with room number)
export function canFlee(roomNumber) {
    const fleeChance = Math.max(30, 70 - (roomNumber * 15));
    return roll(1, 100) <= fleeChance;
}

// Flee penalty damage
export function fleePenalty() {
    return roll(5, 15);
}

// Chance to find a potion after winning
export function findPotion() {
    return roll(1, 100) <= 40; // 40% chance
}

// Gold reward for defeating enemy
export function goldReward(roomNumber) {
    return roll(10, 20) * roomNumber;
}
