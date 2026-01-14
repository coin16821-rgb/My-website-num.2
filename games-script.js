// Игра 1: Змейка
let snakeCanvas, snakeCtx, snakeGame, snakeScore = 0;
let snake = [{x: 200, y: 200}];
let dx = 10, dy = 0;
let food = {x: 0, y: 0};
let snakeRunning = false;

function initSnake() {
    snakeCanvas = document.getElementById('snakeCanvas');
    snakeCtx = snakeCanvas.getContext('2d');
    generateFood();
    drawSnake();
}

function startSnake() {
    if (snakeRunning) return;
    snakeRunning = true;
    snakeGame = setInterval(gameLoopSnake, 100);
    document.addEventListener('keydown', changeDirectionSnake);
}

function resetSnake() {
    clearInterval(snakeGame);
    snakeRunning = false;
    snake = [{x: 200, y: 200}];
    dx = 10; dy = 0;
    snakeScore = 0;
    document.getElementById('snakeScore').textContent = '0';
    generateFood();
    drawSnake();
    document.removeEventListener('keydown', changeDirectionSnake);
}

function generateFood() {
    food.x = Math.floor(Math.random() * 40) * 10;
    food.y = Math.floor(Math.random() * 40) * 10;
}

function changeDirectionSnake(e) {
    const key = e.key;
    if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
        e.preventDefault();
    }
    if ((key === 'ArrowUp' || key === 'w' || key === 'W') && dy === 0) { dx = 0; dy = -10; }
    if ((key === 'ArrowDown' || key === 's' || key === 'S') && dy === 0) { dx = 0; dy = 10; }
    if ((key === 'ArrowLeft' || key === 'a' || key === 'A') && dx === 0) { dx = -10; dy = 0; }
    if ((key === 'ArrowRight' || key === 'd' || key === 'D') && dx === 0) { dx = 10; dy = 0; }
}

function gameLoopSnake() {
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};
    if (head.x < 0 || head.x >= 400 || head.y < 0 || head.y >= 400 || snake.some(s => s.x === head.x && s.y === head.y)) {
        resetSnake();
        return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        snakeScore++;
        document.getElementById('snakeScore').textContent = snakeScore;
        generateFood();
    } else {
        snake.pop();
    }
    drawSnake();
}

function drawSnake() {
    snakeCtx.fillStyle = '#0b0b0b';
    snakeCtx.fillRect(0, 0, 400, 400);
    snakeCtx.fillStyle = '#00d4ff';
    snake.forEach(s => snakeCtx.fillRect(s.x, s.y, 10, 10));
    snakeCtx.fillStyle = '#ff6b6b';
    snakeCtx.fillRect(food.x, food.y, 10, 10);
}

// Игра 2: Пинг-Понг
let pongCanvas, pongCtx, pongGame, pongPlayerScore = 0, pongAIScore = 0;
let paddle1Y = 125, paddle2Y = 125, ballX = 250, ballY = 150, ballDX = 5, ballDY = 3;
let paddle1DY = 0;
let pongRunning = false;

function initPong() {
    pongCanvas = document.getElementById('pongCanvas');
    pongCtx = pongCanvas.getContext('2d');
    drawPong();
}

function startPong() {
    if (pongRunning) return;
    pongRunning = true;
    pongGame = setInterval(gameLoopPong, 16);
    document.addEventListener('keydown', keyDownPong);
    document.addEventListener('keyup', keyUpPong);
}

function resetPong() {
    clearInterval(pongGame);
    pongRunning = false;
    paddle1Y = paddle2Y = 125;
    ballX = 250; ballY = 150;
    ballDX = 5; ballDY = 3;
    pongPlayerScore = pongAIScore = 0;
    document.getElementById('pongPlayerScore').textContent = '0';
    document.getElementById('pongAIScore').textContent = '0';
    drawPong();
    document.removeEventListener('keydown', keyDownPong);
    document.removeEventListener('keyup', keyUpPong);
}

function keyDownPong(e) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
    }
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') paddle1DY = -5;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') paddle1DY = 5;
}

function keyUpPong(e) {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') paddle1DY = 0;
}

function gameLoopPong() {
    paddle1Y += paddle1DY;
    if (paddle1Y < 0) paddle1Y = 0;
    if (paddle1Y > 200) paddle1Y = 200;
    
    paddle2Y += (ballY - paddle2Y - 50) * 0.1;
    
    ballX += ballDX;
    ballY += ballDY;
    
    if (ballY <= 0 || ballY >= 300) ballDY = -ballDY;
    if (ballX <= 20 && ballY >= paddle1Y && ballY <= paddle1Y + 80) { ballDX = -ballDX; ballX = 20; }
    if (ballX >= 480 && ballY >= paddle2Y && ballY <= paddle2Y + 80) { ballDX = -ballDX; ballX = 480; }
    
    if (ballX < 0) { pongAIScore++; document.getElementById('pongAIScore').textContent = pongAIScore; resetBallPong(); }
    if (ballX > 500) { pongPlayerScore++; document.getElementById('pongPlayerScore').textContent = pongPlayerScore; resetBallPong(); }
    
    drawPong();
}

function resetBallPong() {
    ballX = 250; ballY = 150;
    ballDX = (Math.random() > 0.5 ? 5 : -5);
    ballDY = (Math.random() > 0.5 ? 3 : -3);
}

function drawPong() {
    pongCtx.fillStyle = '#0b0b0b';
    pongCtx.fillRect(0, 0, 500, 300);
    pongCtx.fillStyle = '#00d4ff';
    pongCtx.fillRect(10, paddle1Y, 10, 80);
    pongCtx.fillRect(480, paddle2Y, 10, 80);
    pongCtx.fillRect(ballX - 5, ballY - 5, 10, 10);
}

// Игра 3: Космический шутер
let shooterCanvas, shooterCtx, shooterGame, shooterScore = 0, shooterLives = 3;
let playerX = 250, bullets = [], enemies = [], enemySpeed = 2;
let shooterRunning = false;
let keys = {};

function initShooter() {
    shooterCanvas = document.getElementById('shooterCanvas');
    shooterCtx = shooterCanvas.getContext('2d');
    drawShooter();
}

function startShooter() {
    if (shooterRunning) return;
    shooterRunning = true;
    shooterGame = setInterval(gameLoopShooter, 16);
    document.addEventListener('keydown', keyDownShooter);
    document.addEventListener('keyup', keyUpShooter);
    setInterval(() => {
        if (shooterRunning && Math.random() < 0.02) {
            enemies.push({x: Math.random() * 480, y: 0, speed: enemySpeed});
        }
    }, 100);
}

function resetShooter() {
    clearInterval(shooterGame);
    shooterRunning = false;
    playerX = 250;
    bullets = [];
    enemies = [];
    shooterScore = 0;
    shooterLives = 3;
    document.getElementById('shooterScore').textContent = '0';
    document.getElementById('shooterLives').textContent = '3';
    drawShooter();
    document.removeEventListener('keydown', keyDownShooter);
    document.removeEventListener('keyup', keyUpShooter);
}

function keyDownShooter(e) {
    keys[e.key] = true;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
    }
    if (e.key === ' ') {
        bullets.push({x: playerX, y: 380});
    }
}

function keyUpShooter(e) {
    keys[e.key] = false;
}

function gameLoopShooter() {
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) playerX -= 5;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) playerX += 5;
    if (playerX < 10) playerX = 10;
    if (playerX > 490) playerX = 490;
    
    bullets.forEach(b => b.y -= 8);
    bullets = bullets.filter(b => b.y > 0);
    
    enemies.forEach(e => e.y += e.speed);
    
    bullets.forEach((bullet, bi) => {
        enemies.forEach((enemy, ei) => {
            if (Math.abs(bullet.x - enemy.x) < 20 && Math.abs(bullet.y - enemy.y) < 20) {
                bullets.splice(bi, 1);
                enemies.splice(ei, 1);
                shooterScore++;
                document.getElementById('shooterScore').textContent = shooterScore;
            }
        });
    });
    
    enemies.forEach((enemy, i) => {
        if (Math.abs(enemy.x - playerX) < 30 && enemy.y > 370) {
            enemies.splice(i, 1);
            shooterLives--;
            document.getElementById('shooterLives').textContent = shooterLives;
            if (shooterLives <= 0) resetShooter();
        }
        if (enemy.y > 400) enemies.splice(i, 1);
    });
    
    drawShooter();
}

function drawShooter() {
    shooterCtx.fillStyle = '#0b0b0b';
    shooterCtx.fillRect(0, 0, 500, 400);
    shooterCtx.fillStyle = '#00d4ff';
    shooterCtx.fillRect(playerX - 15, 380, 30, 15);
    bullets.forEach(b => {
        shooterCtx.fillRect(b.x - 2, b.y, 4, 10);
    });
    shooterCtx.fillStyle = '#ff6b6b';
    enemies.forEach(e => {
        shooterCtx.fillRect(e.x - 15, e.y, 30, 20);
    });
}

// Игра 4: Додж
let dodgeCanvas, dodgeCtx, dodgeGame, dodgeScore = 0, dodgeTime = 0;
let playerDodge = {x: 200, y: 450}, obstacles = [];
let dodgeRunning = false;
let dodgeKeys = {};

function initDodge() {
    dodgeCanvas = document.getElementById('dodgeCanvas');
    dodgeCtx = dodgeCanvas.getContext('2d');
    drawDodge();
}

function startDodge() {
    if (dodgeRunning) return;
    dodgeRunning = true;
    dodgeTime = 0;
    dodgeGame = setInterval(gameLoopDodge, 16);
    setInterval(() => dodgeTime++, 1000);
    document.addEventListener('keydown', keyDownDodge);
    document.addEventListener('keyup', keyUpDodge);
    setInterval(() => {
        if (dodgeRunning && Math.random() < 0.03) {
            obstacles.push({x: Math.random() * 350, y: 0, speed: 3 + Math.random() * 2});
        }
    }, 100);
}

function resetDodge() {
    clearInterval(dodgeGame);
    dodgeRunning = false;
    playerDodge = {x: 200, y: 450};
    obstacles = [];
    dodgeScore = 0;
    dodgeTime = 0;
    document.getElementById('dodgeScore').textContent = '0';
    document.getElementById('dodgeTime').textContent = '0';
    drawDodge();
    document.removeEventListener('keydown', keyDownDodge);
    document.removeEventListener('keyup', keyUpDodge);
}

function keyDownDodge(e) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
    }
    dodgeKeys[e.key] = true;
}

function keyUpDodge(e) {
    dodgeKeys[e.key] = false;
}

function gameLoopDodge() {
    if (dodgeKeys['ArrowLeft'] || dodgeKeys['a'] || dodgeKeys['A']) playerDodge.x -= 5;
    if (dodgeKeys['ArrowRight'] || dodgeKeys['d'] || dodgeKeys['D']) playerDodge.x += 5;
    if (dodgeKeys['ArrowUp'] || dodgeKeys['w'] || dodgeKeys['W']) playerDodge.y -= 5;
    if (dodgeKeys['ArrowDown'] || dodgeKeys['s'] || dodgeKeys['S']) playerDodge.y += 5;
    if (playerDodge.x < 0) playerDodge.x = 0;
    if (playerDodge.x > 350) playerDodge.x = 350;
    if (playerDodge.y < 0) playerDodge.y = 0;
    if (playerDodge.y > 450) playerDodge.y = 450;
    
    obstacles.forEach(o => o.y += o.speed);
    obstacles = obstacles.filter(o => o.y < 500);
    
    obstacles.forEach((obstacle, i) => {
        if (Math.abs(obstacle.x - playerDodge.x) < 30 && Math.abs(obstacle.y - playerDodge.y) < 30) {
            resetDodge();
        }
    });
    
    dodgeScore = Math.floor(dodgeTime / 2);
    document.getElementById('dodgeScore').textContent = dodgeScore;
    document.getElementById('dodgeTime').textContent = dodgeTime;
    
    drawDodge();
}

function drawDodge() {
    dodgeCtx.fillStyle = '#0b0b0b';
    dodgeCtx.fillRect(0, 0, 400, 500);
    dodgeCtx.fillStyle = '#00d4ff';
    dodgeCtx.fillRect(playerDodge.x, playerDodge.y, 50, 50);
    dodgeCtx.fillStyle = '#ff6b6b';
    obstacles.forEach(o => dodgeCtx.fillRect(o.x, o.y, 40, 40));
}

// Игра 5: Арканоид
let breakoutCanvas, breakoutCtx, breakoutGame, breakoutScore = 0;
let paddleX = 200, ballBX = 250, ballBY = 350, ballBDX = 3, ballBDY = -3;
let blocks = [];
let breakoutRunning = false;
let breakoutKeys = {};

function initBreakout() {
    breakoutCanvas = document.getElementById('breakoutCanvas');
    breakoutCtx = breakoutCanvas.getContext('2d');
    for (let i = 0; i < 30; i++) {
        blocks.push({
            x: (i % 10) * 50 + 5,
            y: Math.floor(i / 10) * 30 + 50,
            active: true
        });
    }
    drawBreakout();
}

function startBreakout() {
    if (breakoutRunning) return;
    breakoutRunning = true;
    breakoutGame = setInterval(gameLoopBreakout, 16);
    document.addEventListener('keydown', keyDownBreakout);
    document.addEventListener('keyup', keyUpBreakout);
}

function resetBreakout() {
    clearInterval(breakoutGame);
    breakoutRunning = false;
    paddleX = 200;
    ballBX = 250; ballBY = 350;
    ballBDX = 3; ballBDY = -3;
    breakoutScore = 0;
    blocks = [];
    for (let i = 0; i < 30; i++) {
        blocks.push({
            x: (i % 10) * 50 + 5,
            y: Math.floor(i / 10) * 30 + 50,
            active: true
        });
    }
    document.getElementById('breakoutScore').textContent = '0';
    document.getElementById('breakoutBlocks').textContent = '30';
    drawBreakout();
    document.removeEventListener('keydown', keyDownBreakout);
    document.removeEventListener('keyup', keyUpBreakout);
}

function keyDownBreakout(e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
    }
    breakoutKeys[e.key] = true;
}

function keyUpBreakout(e) {
    breakoutKeys[e.key] = false;
}

function gameLoopBreakout() {
    if (breakoutKeys['ArrowLeft'] || breakoutKeys['a'] || breakoutKeys['A']) paddleX -= 5;
    if (breakoutKeys['ArrowRight'] || breakoutKeys['d'] || breakoutKeys['D']) paddleX += 5;
    if (paddleX < 0) paddleX = 0;
    if (paddleX > 400) paddleX = 400;
    
    ballBX += ballBDX;
    ballBY += ballBDY;
    
    if (ballBX <= 5 || ballBX >= 495) ballBDX = -ballBDX;
    if (ballBY <= 5) ballBDY = -ballBDY;
    
    if (ballBY >= 380 && ballBX >= paddleX && ballBX <= paddleX + 100) {
        ballBDY = -Math.abs(ballBDY);
        ballBY = 380;
    }
    
    blocks.forEach((block, i) => {
        if (block.active && ballBX >= block.x && ballBX <= block.x + 45 && ballBY >= block.y && ballBY <= block.y + 25) {
            block.active = false;
            ballBDY = -ballBDY;
            breakoutScore += 10;
            document.getElementById('breakoutScore').textContent = breakoutScore;
            const activeBlocks = blocks.filter(b => b.active).length;
            document.getElementById('breakoutBlocks').textContent = activeBlocks;
            if (activeBlocks === 0) resetBreakout();
        }
    });
    
    if (ballBY > 400) resetBreakout();
    
    drawBreakout();
}

function drawBreakout() {
    breakoutCtx.fillStyle = '#0b0b0b';
    breakoutCtx.fillRect(0, 0, 500, 400);
    breakoutCtx.fillStyle = '#00d4ff';
    breakoutCtx.fillRect(paddleX, 380, 100, 10);
    breakoutCtx.fillRect(ballBX - 5, ballBY - 5, 10, 10);
    blocks.forEach(block => {
        if (block.active) {
            breakoutCtx.fillStyle = '#ff6b6b';
            breakoutCtx.fillRect(block.x, block.y, 45, 25);
        }
    });
}

// Игра 6: Платформер
let platformerCanvas, platformerCtx, platformerGame, platformerScore = 0, platformerCoins = 0;
let playerPlat = {x: 50, y: 300, vx: 0, vy: 0, onGround: false};
let platforms = [{x: 0, y: 370, w: 500}, {x: 100, y: 300, w: 100}, {x: 250, y: 250, w: 100}, {x: 400, y: 200, w: 100}];
let coins = [{x: 150, y: 270, collected: false}, {x: 300, y: 220, collected: false}, {x: 450, y: 170, collected: false}];
let platformerRunning = false;
let platformerKeys = {};

function initPlatformer() {
    platformerCanvas = document.getElementById('platformerCanvas');
    platformerCtx = platformerCanvas.getContext('2d');
    drawPlatformer();
}

function startPlatformer() {
    if (platformerRunning) return;
    platformerRunning = true;
    platformerGame = setInterval(gameLoopPlatformer, 16);
    document.addEventListener('keydown', keyDownPlatformer);
    document.addEventListener('keyup', keyUpPlatformer);
}

function resetPlatformer() {
    clearInterval(platformerGame);
    platformerRunning = false;
    playerPlat = {x: 50, y: 300, vx: 0, vy: 0, onGround: false};
    coins.forEach(c => c.collected = false);
    platformerScore = 0;
    platformerCoins = 0;
    document.getElementById('platformerScore').textContent = '0';
    document.getElementById('platformerCoins').textContent = '0';
    drawPlatformer();
    document.removeEventListener('keydown', keyDownPlatformer);
    document.removeEventListener('keyup', keyUpPlatformer);
}

function keyDownPlatformer(e) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
    }
    platformerKeys[e.key] = true;
    if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && playerPlat.onGround) {
        playerPlat.vy = -12;
        playerPlat.onGround = false;
    }
}

function keyUpPlatformer(e) {
    platformerKeys[e.key] = false;
}

function gameLoopPlatformer() {
    if (platformerKeys['ArrowLeft'] || platformerKeys['a'] || platformerKeys['A']) playerPlat.vx = -5;
    else if (platformerKeys['ArrowRight'] || platformerKeys['d'] || platformerKeys['D']) playerPlat.vx = 5;
    else playerPlat.vx *= 0.8;
    
    playerPlat.vy += 0.5;
    playerPlat.x += playerPlat.vx;
    playerPlat.y += playerPlat.vy;
    
    if (playerPlat.x < 0) playerPlat.x = 0;
    if (playerPlat.x > 490) playerPlat.x = 490;
    
    playerPlat.onGround = false;
    platforms.forEach(platform => {
        if (playerPlat.x + 20 >= platform.x && playerPlat.x <= platform.x + platform.w && 
            playerPlat.y + 30 >= platform.y && playerPlat.y + 30 <= platform.y + 10) {
            playerPlat.y = platform.y - 30;
            playerPlat.vy = 0;
            playerPlat.onGround = true;
        }
    });
    
    if (playerPlat.y > 400) {
        playerPlat.y = 300;
        playerPlat.x = 50;
        playerPlat.vx = playerPlat.vy = 0;
    }
    
    coins.forEach((coin, i) => {
        if (!coin.collected && Math.abs(playerPlat.x - coin.x) < 30 && Math.abs(playerPlat.y - coin.y) < 30) {
            coin.collected = true;
            platformerCoins++;
            platformerScore += 100;
            document.getElementById('platformerCoins').textContent = platformerCoins;
            document.getElementById('platformerScore').textContent = platformerScore;
        }
    });
    
    drawPlatformer();
}

function drawPlatformer() {
    platformerCtx.fillStyle = '#0b0b0b';
    platformerCtx.fillRect(0, 0, 500, 400);
    platformerCtx.fillStyle = '#666';
    platforms.forEach(p => platformerCtx.fillRect(p.x, p.y, p.w, 10));
    platformerCtx.fillStyle = '#ffd43b';
    coins.forEach(c => {
        if (!c.collected) platformerCtx.fillRect(c.x, c.y, 20, 20);
    });
    platformerCtx.fillStyle = '#00d4ff';
    platformerCtx.fillRect(playerPlat.x, playerPlat.y, 30, 30);
}

// Инициализация всех игр
document.addEventListener('DOMContentLoaded', function() {
    initSnake();
    initPong();
    initShooter();
    initDodge();
    initBreakout();
    initPlatformer();
});
