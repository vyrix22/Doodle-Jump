//board
let board;
let boardWidth = 360;
let boardHeight = 720; // Increased height
let context;

//doodler
let doodlerWidth = 46;
let doodlerHeight = 46;
let doodlerX = boardWidth / 2 - doodlerWidth / 2;
let doodlerY = boardHeight * 7 / 8 - doodlerHeight;
let doodlerRightImg;
let doodlerLeftImg;

let doodler = {
    img: null,
    x: doodlerX,
    y: doodlerY,
    width: doodlerWidth,
    height: doodlerHeight
}

//physics
let velocityX = 0;
let velocityY = 0; //doodler jump speed
let initialVelocityY = -8; //starting velocity Y
let gravity = 0.4;

//platforms
let platformArray = [];
let platformWidth = 60;
let platformHeight = 18;
let platformImg;
let platformBrokenImg;

let score = 0;

// Game states: 'start', 'playing', 'gameover'
let gameState = 'start';

// Controls
let keys = {
    right: false,
    left: false
};

window.onload = function () {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); //used for drawing on the board

    //load images
    doodlerRightImg = new Image();
    doodlerRightImg.src = "./doodler-right.png";
    doodler.img = doodlerRightImg;

    doodlerLeftImg = new Image();
    doodlerLeftImg.src = "./doodler-left.png";

    platformImg = new Image();
    platformImg.src = "./platform.png";

    platformBrokenImg = new Image();
    platformBrokenImg.src = "./platform-broken.png";

    velocityY = initialVelocityY;
    
    // Initial draw to ensure start screen looks good when images load
    doodlerRightImg.onload = function () {
        if (gameState === 'start') {
            drawStartScreen();
        }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    
    // Mobile Touch Controls
    document.addEventListener("touchstart", handleTouchStart, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });
    
    requestAnimationFrame(update);
}

function update() {
    requestAnimationFrame(update);
    
    if (gameState === 'start') {
        drawStartScreen();
        return;
    }
    
    if (gameState === 'gameover') {
        // Draw the game over overlay once or just clear and draw solid
        context.clearRect(0, 0, board.width, board.height);
        context.fillStyle = "rgba(0, 0, 0, 0.7)"; 
        context.fillRect(0, 0, board.width, board.height);
        
        context.fillStyle = "white";
        context.font = "24px 'Press Start 2P', sans-serif";
        context.textAlign = "center";
        context.fillText("GAME OVER", boardWidth / 2, boardHeight / 2 - 40);
        
        context.font = "16px 'Press Start 2P', sans-serif";
        context.fillText("Score: " + score, boardWidth / 2, boardHeight / 2 + 10);
        
        context.font = "12px 'Press Start 2P', sans-serif";
        context.fillText("Press SPACE or TAP to Restart", boardWidth / 2, boardHeight / 2 + 60);
        context.textAlign = "left"; // reset
        return;
    }
    
    context.clearRect(0, 0, board.width, board.height);

    // Controls update
    if (keys.right) {
        velocityX = 4;
        doodler.img = doodlerRightImg;
    } else if (keys.left) {
        velocityX = -4;
        doodler.img = doodlerLeftImg;
    } else {
        velocityX = 0;
    }

    //doodler
    doodler.x += velocityX;
    if (doodler.x > boardWidth) {
        doodler.x = 0;
    }
    else if (doodler.x + doodler.width < 0) {
        doodler.x = boardWidth;
    }

    velocityY += gravity;
    doodler.y += velocityY;
    
    if (doodler.y > board.height) {
        gameState = 'gameover';
    }
    context.drawImage(doodler.img, doodler.x, doodler.y, doodler.width, doodler.height);

    //platforms
    for (let i = 0; i < platformArray.length; i++) {
        let platform = platformArray[i];
        
        // Moving platform logic
        if (platform.type === 2 && !platform.broken) { 
            platform.x += platform.vx;
            if (platform.x < 0 || platform.x + platform.width > boardWidth) {
                platform.vx *= -1; // reverse direction
            }
        }

        if (velocityY < 0 && doodler.y < boardHeight * 3 / 4) {
            platform.y -= initialVelocityY; //slide platform down
        }
        
        // Collision
        if (detectCollision(doodler, platform) && velocityY >= 0) {
            if (platform.type === 1 && !platform.broken) { 
                platform.broken = true;
            } else if (!platform.broken) {
                velocityY = initialVelocityY; //jump
            }
        }
        
        // Draw platform if not broken, or animate breaking
        if (!platform.broken) {
            context.drawImage(platform.img, platform.x, platform.y, platform.width, platform.height);
        } else if (platform.type === 1 && platform.broken) {
            // Broken platform falling animation
            platform.y += 5;
            context.drawImage(platform.img, platform.x, platform.y, platform.width, platform.height);
        }
    }

    // clear platforms and add new platform
    while (platformArray.length > 0 && platformArray[0].y >= boardHeight) {
        platformArray.shift(); //removes first element from the array
        newPlatform(); //replace with new platform on top
    }

    //score calculation (based on how much doodler goes up)
    updateScore();
    
    // Draw score
    context.fillStyle = "black";
    context.font = "16px 'Press Start 2P', sans-serif";
    context.fillText("Score: " + score, 10, 30);
}

function drawStartScreen() {
    context.clearRect(0, 0, board.width, board.height);
    context.fillStyle = "rgba(255, 255, 255, 0.8)";
    context.fillRect(0, 0, board.width, board.height);
    
    context.fillStyle = "black";
    context.font = "20px 'Press Start 2P', sans-serif";
    context.textAlign = "center";
    context.fillText("DOODLE JUMP", boardWidth / 2, boardHeight / 2 - 40);
    
    context.font = "12px 'Press Start 2P', sans-serif";
    context.fillText("Press SPACE or TAP to Start", boardWidth / 2, boardHeight / 2 + 20);
    context.textAlign = "left"; // reset
}



function handleKeyDown(e) {
    if (e.code == "ArrowRight" || e.code == "KeyD") {
        keys.right = true;
    }
    else if (e.code == "ArrowLeft" || e.code == "KeyA") {
        keys.left = true;
    }
    else if (e.code == "Space") {
        if (gameState === 'start' || gameState === 'gameover') {
            resetGame();
        }
    }
}

function handleKeyUp(e) {
    if (e.code == "ArrowRight" || e.code == "KeyD") {
        keys.right = false;
    }
    else if (e.code == "ArrowLeft" || e.code == "KeyA") {
        keys.left = false;
    }
}

function handleTouchStart(e) {
    e.preventDefault(); // prevent scrolling/zooming
    if (gameState === 'start' || gameState === 'gameover') {
        resetGame();
        return;
    }
    
    // Check where the touch occurred relative to the window
    let touchX = e.touches[0].clientX;
    if (touchX < window.innerWidth / 2) {
        keys.left = true;
        keys.right = false;
    } else {
        keys.right = true;
        keys.left = false;
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    keys.left = false;
    keys.right = false;
}

function resetGame() {
    doodler = {
        img: doodlerRightImg,
        x: doodlerX,
        y: doodlerY,
        width: doodlerWidth,
        height: doodlerHeight
    }

    velocityX = 0;
    velocityY = initialVelocityY;
    score = 0;
    keys.left = false;
    keys.right = false;
    gameState = 'playing';
    placePlatforms();
}

function placePlatforms() {
    platformArray = [];

    //starting platform
    let platform = {
        img: platformImg,
        x: boardWidth / 2,
        y: boardHeight - 50,
        width: platformWidth,
        height: platformHeight,
        type: 0 // 0: normal, 1: broken, 2: moving
    }
    platformArray.push(platform);

    for (let i = 0; i < 6; i++) {
        let randomX = Math.floor(Math.random() * (boardWidth - platformWidth)); 
        let platform = {
            img: platformImg,
            x: randomX,
            y: boardHeight - 75 * i - 150,
            width: platformWidth,
            height: platformHeight,
            type: 0,
            broken: false,
            vx: 0
        }
        platformArray.push(platform);
    }
}

function newPlatform() {
    let randomX = Math.floor(Math.random() * (boardWidth - platformWidth)); 
    
    // Determine platform type based on score to increase difficulty
    let type = 0;
    let pImg = platformImg;
    let vx = 0;

    let rand = Math.random();
    
    if (score > 1000) {
        if (rand < 0.2) {
            type = 1; // broken
            pImg = platformBrokenImg;
        } else if (rand < 0.5) {
            type = 2; // moving
            vx = Math.random() > 0.5 ? 2 : -2;
        }
    } else if (score > 500) {
        if (rand < 0.1) {
            type = 1;
            pImg = platformBrokenImg;
        } else if (rand < 0.3) {
            type = 2;
            vx = Math.random() > 0.5 ? 1.5 : -1.5;
        }
    }

    let platform = {
        img: pImg,
        x: randomX,
        y: -platformHeight,
        width: platformWidth,
        height: platformHeight,
        type: type,
        vx: vx,
        broken: false
    }

    platformArray.push(platform);
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&   //a's top left corner doesn't reach b's top right corner
           a.x + a.width > b.x &&   //a's top right corner passes b's top left corner
           a.y < b.y + b.height &&  //a's top left corner doesn't reach b's bottom left corner
           a.y + a.height > b.y;    //a's bottom left corner passes b's top left corner
}

function updateScore() {
    if (velocityY < 0 && doodler.y < boardHeight * 3 / 4) { 
        // Platforms move down by initialVelocityY, so we increase score
        score += 1;
    }
}
