const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let ship = { x: canvas.width / 2, y: canvas.height / 2, points: 0, health: 100 };
let planets = [];
let stars = [];
let keys = {};
let gameOver = false;
let gameStarted = false;
let showLandingPage = true;
let difficulty = 0.5;
const planetRadius = 15;
const arrowLength = 20;
const minPlanetDistance = 150;
const borderMargin = 50;
const numInitialStars = 30;

const minDifficultyMultiplier = 0.7;
const maxDifficultyMultiplier = 1.6;
const minPlanets = 6;
const maxPlanets = 10;
const noPlanetSpawnRadius = 100;

let bestScore = localStorage.getItem('bestScore') || 0;

let enemyShip = {
    x: canvas.width / 4,
    y: canvas.height / 4,
    speed: 1.5,
    reloadTime: 2000,
    lastShotTime: 0,
    
};

let bullets = [];

const backgroundMusic = new Audio('music.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;
backgroundMusic.play();
let musicVolume = 0.5; 

function createPlanet() {
    let newPlanet;
    let numGreen = planets.filter(p => p.points > 0).length;
    let numRed = planets.filter(p => p.points < 0).length;
    let spawnX, spawnY;

    do {
        spawnX = borderMargin + Math.random() * (canvas.width - 2 * borderMargin);
        spawnY = borderMargin + Math.random() * (canvas.height - 2 * borderMargin);

        newPlanet = {
            x: spawnX,
            y: spawnY,
            radius: planetRadius,
            points: (numGreen < numPlanetsForDifficulty() / 2) ? 4 : (numRed < numPlanetsForDifficulty() / 2) ? -5 : (Math.random() > 0.5 ? 4 : -5)
        };
    } while (
        !isSpreadOut(newPlanet) ||
        !isInBorder(newPlanet) ||
        isTooCloseToShip(spawnX, spawnY)
    );

    planets.push(newPlanet);
}

function isTooCloseToShip(x, y) {
    const dx = x - ship.x;
    const dy = y - ship.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < noPlanetSpawnRadius;
}

function numPlanetsForDifficulty() {
    return Math.round(minPlanets + difficulty * (maxPlanets - minPlanets)) * 2;
}

function isSpreadOut(newPlanet) {
    for (let i = 0; i < planets.length; i++) {
        const planet = planets[i];
        const dx = newPlanet.x - planet.x;
        const dy = newPlanet.y - planet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minPlanetDistance) {
            return false;
        }
    }
    return true;
}

function isInBorder(planet) {
    return planet.x > borderMargin && planet.x < canvas.width - borderMargin &&
        planet.y > borderMargin && planet.y < canvas.height - borderMargin;
}

function createStar() {
    let starX, starY;
    let isOverlapping;

    do {
        starX = Math.random() * canvas.width;
        starY = Math.random() * canvas.height;
        isOverlapping = false;

        for (let i = 0; i < planets.length; i++) {
            const planet = planets[i];
            const dx = starX - planet.x;
            const dy = starY - planet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < planet.radius + 5) { 
                isOverlapping = true;
                break;
            }
        }
    } while (isOverlapping);

    const star = {
        x: starX,
        y: starY,
        radius: 5
    };
    stars.push(star);
}

function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);

    if (keys['ArrowRight'] || keys['d']) {
        ctx.rotate(Math.PI / 2);
    } else if (keys['ArrowLeft'] || keys['a']) {
        ctx.rotate(-Math.PI / 2);
    } else if (keys['ArrowDown'] || keys['s']) {
        ctx.rotate(Math.PI);
    }

    ctx.fillStyle = 'white';
    ctx.fillRect(-10, -5, 20, 10);

    ctx.fillStyle = 'lightblue';
    ctx.fillRect(-10, -5, 5, 10);

    ctx.fillStyle = 'lightgray';
    ctx.beginPath();
    ctx.moveTo(-15, -5);
    ctx.lineTo(-25, -10);
    ctx.lineTo(-25, 10);
    ctx.lineTo(-15, 5);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(15, -5);
    ctx.lineTo(25, -10);
    ctx.lineTo(25, 10);
    ctx.lineTo(15, 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawEnemyShip() {
    ctx.save();
    ctx.translate(enemyShip.x, enemyShip.y);
    const dx = ship.x - enemyShip.x;
    const dy = ship.y - enemyShip.y;
    const angle = Math.atan2(dy, dx);
    ctx.rotate(angle);
    ctx.fillStyle = 'red';
    ctx.fillRect(-10, -5, 20, 10);

    ctx.fillStyle = 'black';
    ctx.fillRect(-10, -5, 5, 10);

    ctx.fillStyle = 'lightgray';
    ctx.beginPath();
    ctx.moveTo(-15, -5);
    ctx.lineTo(-25, -10);
    ctx.lineTo(-25, 10);
    ctx.lineTo(-15, 5);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(15, -5);
    ctx.lineTo(25, -10);
    ctx.lineTo(25, 10);
    ctx.lineTo(15, 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawPlanets() {
    planets.forEach(planet => {
        ctx.save();
        ctx.translate(planet.x, planet.y);
        ctx.beginPath();
        ctx.arc(0, 0, planet.radius, 0, Math.PI * 2);
        ctx.fillStyle = planet.points > 0 ? 'green' : 'red';
        ctx.fill();

        for (let i = 0; i < 360; i += 30) {
            const x = planet.radius * 0.7 * Math.cos(i * Math.PI / 180);
            const y = planet.radius * 0.7 * Math.sin(i * Math.PI / 180);
            ctx.beginPath();
            ctx.arc(x, y, planet.radius / 8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; 
            ctx.fill();
        }

        ctx.restore();
        drawArrows(planet);
    });
}

function drawArrows(planet) {
    const numArrows = 8;
    const arrowAngle = 0.3;
    const arrowHeadSize = 5;
    for (let i = 0; i < numArrows; i++) {
        const angle = (i / numArrows) * 2 * Math.PI;
        const x = planet.x + (planet.radius + 15) * Math.cos(angle);
        const y = planet.y + (planet.radius + 15) * Math.sin(angle);
        let startX, startY, endX, endY;

        if (planet.points > 0) {
            startX = x + arrowLength * Math.cos(angle);
            startY = y + arrowLength * Math.sin(angle);
            endX = x;
            endY = y;
        } else {
            startX = x;
            startY = y;
            endX = x + arrowLength * Math.cos(angle);
            endY = y + arrowLength * Math.sin(angle);
        }

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);

        ctx.lineTo(
            endX - arrowHeadSize * Math.cos(angle - Math.PI / 6),
            endY - arrowHeadSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            endX - arrowHeadSize * Math.cos(angle + Math.PI / 6),
            endY - arrowHeadSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();

        ctx.strokeStyle = planet.points > 0 ? 'green' : 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = planet.points > 0 ? 'green' : 'red';
        ctx.fill();
    }
}

function drawStars() {
    stars.forEach(star => {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawPoints() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Courier New';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Points: ${ship.points}`, 10, 10);

    ctx.fillText(`Best Score: ${bestScore}`, 10, 40);
}

function drawHealthBar() {
    const healthBarWidth = 100;
    const healthBarHeight = 10;
    const healthBarX = canvas.width - healthBarWidth - 10;
    const healthBarY = 10;

    ctx.font = '14px Courier New';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'right';
    ctx.fillText('Health', healthBarX - 10, healthBarY + healthBarHeight / 2 + 3);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

    const currentHealthWidth = (ship.health / 100) * healthBarWidth;
    ctx.fillStyle = 'green';
    ctx.fillRect(healthBarX, healthBarY, currentHealthWidth, healthBarHeight);
}

function drawGameOver() {
    ctx.fillStyle = 'red';
    ctx.font = '50px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 50);

    ctx.fillStyle = 'white';
    ctx.font = '24px Courier New';
    ctx.fillText('Play Again', canvas.width / 2, canvas.height / 2 + 50);
    const buttonWidth = 150;
    const buttonHeight = 60;
    const buttonX = canvas.width / 2 - buttonWidth / 2;
    const buttonY = canvas.height / 2 + 30;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

    playAgainButton = {
        x: buttonX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight
    };
}

function drawLandingPage() {
    ctx.fillStyle = 'white';
    ctx.font = '40px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('Starfall', canvas.width / 2, canvas.height / 2 - 150);

    ctx.font = '20px Courier New';
    ctx.fillText('Instructions:', canvas.width / 2, canvas.height / 2 - 90);
    ctx.fillText('- Use arrow keys or WASD to move your ship', canvas.width / 2, canvas.height / 2 - 60);
    ctx.fillText('- Collect white stars for points', canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillText('- Green planets pull you in, red planets push you away', canvas.width / 2, canvas.height / 2);
    ctx.fillText('- Avoid crashing into planets!', canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText('- Use the difficulty slider to adjust the game', canvas.width / 2, canvas.height / 2 + 60);
    ctx.fillText('- Watch out for the enemy ship!', canvas.width / 2, canvas.height / 2 + 90);
    ctx.fillText('Press Space to Continue', canvas.width / 2, canvas.height / 2 + 130);

    ctx.fillText(`Best Score: ${bestScore}`, canvas.width / 2, canvas.height / 2 + 180);

    drawVolumeControl();
}

function drawStartScreen() {
    ctx.fillStyle = 'white';
    ctx.font = '30px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('Select Difficulty', canvas.width / 2, canvas.height / 2 - 80);

    const sliderWidth = 200;
    const sliderHeight = 20;
    const sliderX = canvas.width / 2 - sliderWidth / 2;
    const sliderY = canvas.height / 2;

    ctx.fillStyle = 'lightgray';
    ctx.fillRect(sliderX, sliderY, sliderWidth, sliderHeight);

    const filledWidth = difficulty * sliderWidth;
    ctx.fillStyle = 'gray';
    ctx.fillRect(sliderX, sliderY, filledWidth, sliderHeight);

    const handleWidth = 10;
    const handleX = sliderX + filledWidth - handleWidth / 2;
    ctx.fillStyle = 'gray';
    ctx.fillRect(handleX, sliderY - 5, handleWidth, sliderHeight + 10);


    ctx.font = '20px Courier New';
    ctx.textAlign = 'center'
    ctx.fillText('Left is Easy and Right is Hard. Press Space to Start', canvas.width / 2, canvas.height / 2 + 80);
}

function drawVolumeControl() {
    const volumeControlWidth = 100;
    const volumeControlHeight = 10;
    const volumeControlX = canvas.width / 2 - volumeControlWidth / 2;
    const volumeControlY = canvas.height / 2 + 250; 
  
    ctx.fillStyle = "lightgray";
    ctx.fillRect(
      volumeControlX,
      volumeControlY,
      volumeControlWidth,
      volumeControlHeight
    );
  
    const filledWidth = musicVolume * volumeControlWidth;
    ctx.fillStyle = "gray";
    ctx.fillRect(volumeControlX, volumeControlY, filledWidth, volumeControlHeight);
  
    const handleWidth = 5;
    const handleX = volumeControlX + filledWidth - handleWidth / 2;
    ctx.fillStyle = "gray";
    ctx.fillRect(
      handleX,
      volumeControlY - 2,
      handleWidth,
      volumeControlHeight + 4
    );
  
    ctx.font = "14px Courier New";
    ctx.textAlign = "center";
    ctx.fillText(
      "Volume",
      canvas.width / 2,
      volumeControlY + volumeControlHeight + 15
    );
  
    volumeControl = {
      x: volumeControlX,
      y: volumeControlY,
      width: volumeControlWidth,
      height: volumeControlHeight,
    };
}

function updateShip() {
    if (gameOver || !gameStarted) return;

    const difficultyMultiplier = minDifficultyMultiplier + difficulty * (maxDifficultyMultiplier - minDifficultyMultiplier);

    if (keys['ArrowUp'] || keys['w']) ship.y -= 5 * (2 - difficultyMultiplier);
    if (keys['ArrowDown'] || keys['s']) ship.y += 5 * (2 - difficultyMultiplier);
    if (keys['ArrowLeft'] || keys['a']) ship.x -= 5 * (2 - difficultyMultiplier);
    if (keys['ArrowRight'] || keys['d']) ship.x += 5 * (2 - difficultyMultiplier);

    for (let i = planets.length - 1; i >= 0; i--) {
        const planet = planets[i];
        const dx = planet.x - ship.x;
        const dy = planet.y - ship.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 300) {
            const force = planet.points > 0 ? 1.2 / (distance / 50) : 0.8 / (distance / 50);
            const adjustedForce = force * difficultyMultiplier;
            const angle = Math.atan2(dy, dx);
            const direction = planet.points > 0 ? 1 : -1;

            ship.x += Math.cos(angle) * adjustedForce * direction;
            ship.y += Math.sin(angle) * adjustedForce * direction;

            if (distance < planet.radius + 10) {
                gameOver = true;
                if (ship.points > bestScore) {
                    bestScore = ship.points;
                    localStorage.setItem('bestScore', bestScore);
                }
                return;
            }
        }
    }
    const dx = enemyShip.x - ship.x;
    const dy = enemyShip.y - ship.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 15 + 10) {
        ship.health = 0
        gameOver = true;
        if (ship.points > bestScore) {
            bestScore = ship.points;
            localStorage.setItem('bestScore', bestScore);
        }
        return;
    }
    for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i];
        const dx = star.x - ship.x;
        const dy = star.y - ship.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < star.radius + 10) {
            ship.points += 1;
            stars.splice(i, 1);
            createStar();
        }
    }

    if (ship.x + 10 < 0) {
        ship.x = canvas.width + 10;
        regenerateWorldOffScreen();
    } else if (ship.x - 10 > canvas.width) {
        ship.x = -10;
        regenerateWorldOffScreen();
    }

    if (ship.y + 10 < 0) {
        ship.y = canvas.height + 10;
        regenerateWorldOffScreen();
    } else if (ship.y - 10 > canvas.height) {
        ship.y = -10;
        regenerateWorldOffScreen();
    }
}

function updateEnemyShip() {
    if (!gameStarted || gameOver) return;

    const dx = ship.x - enemyShip.x;
    const dy = ship.y - enemyShip.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const erraticFactor = 0.6; 
    const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * erraticFactor;

    enemyShip.x += enemyShip.speed * Math.cos(angle);
    enemyShip.y += enemyShip.speed * Math.sin(angle);

    const now = Date.now();
    if (now - enemyShip.lastShotTime > enemyShip.reloadTime) {
        bullets.push({
            x: enemyShip.x,
            y: enemyShip.y,
            angle: angle,
            speed: 5
        });
        enemyShip.lastShotTime = now;
    }
}

function updateBullets() {
  const minShotsToKill = 6;
  const maxShotsToKill = 12;

  const shotsToKill = Math.round(
    maxShotsToKill - difficulty * (maxShotsToKill - minShotsToKill)
  );
  const damagePerShot = 100 / shotsToKill;
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += bullet.speed * Math.cos(bullet.angle);
        bullet.y += bullet.speed * Math.sin(bullet.angle);

        if (
            bullet.x < 0 ||
            bullet.x > canvas.width ||
            bullet.y < 0 ||
            bullet.y > canvas.height
        ) {
            bullets.splice(i, 1);
        } else {
          const dx = bullet.x - ship.x;
          const dy = bullet.y - ship.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 10) {
            bullets.splice(i, 1);
            ship.health -= damagePerShot;
            if (ship.health <= 0) {
              ship.health = 0;
              gameOver = true;
              if (ship.points > bestScore) {
                bestScore = ship.points;
                localStorage.setItem("bestScore", bestScore);
              }
              return;
            }
          }
        }
    }
}

function drawBullets() {
    ctx.fillStyle = 'yellow';
    for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function regenerateWorldOffScreen(){
    const oldShipX = ship.x
    const oldShipY = ship.y

    planets.forEach(planet => {
        planet.x = (planet.x - oldShipX + ship.x + canvas.width) % canvas.width;
        planet.y = (planet.y - oldShipY + ship.y + canvas.height) % canvas.height;
    });
    stars.forEach(star => {
        star.x = (star.x - oldShipX + ship.x + canvas.width) % canvas.width;
        star.y = (star.y - oldShipY + ship.y + canvas.height) % canvas.height;
    });

    for (let i = planets.length - 1; i >= 0; i--) {
        const planet = planets[i];

        if (!isInBorder(planet)) {
            planets.splice(i, 1);
            continue;
        }

        for (let j = i - 1; j >= 0; j--) {
            const otherPlanet = planets[j];
            const dx = planet.x - otherPlanet.x;
            const dy = planet.y - otherPlanet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minPlanetDistance) {
                planets.splice(i, 1);
                break;
            }
        }
    }

    while (planets.length < numPlanetsForDifficulty()) {
        createPlanet();
    }

    while (stars.length < numInitialStars) {
        createStar();
    }
}

function regenerateWorld() {
    const oldShipX = ship.x
    const oldShipY = ship.y
    ship.x = canvas.width / 2;
    ship.y = canvas.height / 2;

    planets.forEach(planet => {
        planet.x = (planet.x - oldShipX + canvas.width / 2 + canvas.width) % canvas.width;
        planet.y = (planet.y - oldShipY + canvas.height / 2 + canvas.height) % canvas.height;
    });
    stars.forEach(star => {
        star.x = (star.x - oldShipX + canvas.width / 2 + canvas.width) % canvas.width;
        star.y = (star.y - oldShipY + canvas.height / 2 + canvas.height) % canvas.height;
    });

    for (let i = planets.length - 1; i >= 0; i--) {
        const planet = planets[i];

        if (!isInBorder(planet)) {
            planets.splice(i, 1);
            continue;
        }

        for (let j = i - 1; j >= 0; j--) {
            const otherPlanet = planets[j];
            const dx = planet.x - otherPlanet.x;
            const dy = planet.y - otherPlanet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minPlanetDistance) {
                planets.splice(i, 1);
                break;
            }
        }
    }

    while (planets.length < numPlanetsForDifficulty()) {
        createPlanet();
    }

    while (stars.length < numInitialStars) {
        createStar();
    }
}

function resetGame() {
    ship = { x: canvas.width / 2, y: canvas.height / 2, points: 0 , health: 100};
    planets = [];
    stars = [];
    keys = {};
    gameOver = false;
    gameStarted = false;
    showLandingPage = true;
    difficulty = 0.5;

    enemyShip = {
        x: canvas.width / 4,
        y: canvas.height / 4,
        speed: 1.5,
        reloadTime: 2000,
        lastShotTime: 0,
        health: 100
    };
    
    bullets = [];

    for (let i = 0; i < numPlanetsForDifficulty(); i++) createPlanet();
    for (let i = 0; i < numInitialStars; i++) createStar();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showLandingPage) {
        backgroundMusic.play();
        drawLandingPage();
    } else if (!gameStarted) {
        backgroundMusic.play();
        drawStartScreen();
    } else {
        backgroundMusic.play();
        drawShip();
        drawPlanets();
        drawStars();
        drawPoints();
        drawHealthBar();
        updateShip();
        updateEnemyShip();
        updateBullets();
        drawBullets();
        drawEnemyShip();

        if (gameOver) {
            drawGameOver();
        }
    }

    requestAnimationFrame(gameLoop);
}

let playAgainButton = null;

let isDragging = false;
let isDraggingVolume = false;
window.addEventListener("mousedown", (e) => {
  if (!gameStarted && !showLandingPage) {
    const sliderWidth = 200;
    const sliderHeight = 20;
    const sliderX = canvas.width / 2 - sliderWidth / 2;
    const sliderY = canvas.height / 2;

    if (
      e.clientX >= sliderX &&
      e.clientX <= sliderX + sliderWidth &&
      e.clientY >= sliderY &&
      e.clientY <= sliderY + sliderHeight
    ) {
      difficulty = (e.clientX - sliderX) / sliderWidth;
      difficulty = Math.max(0, Math.min(1, difficulty));
      isDragging = true;
      regenerateWorld();
    }
  } else if (gameOver && playAgainButton) {
    if (
      e.clientX >= playAgainButton.x &&
      e.clientX <= playAgainButton.x + playAgainButton.width &&
      e.clientY >= playAgainButton.y &&
      e.clientY <= playAgainButton.y + playAgainButton.height
    ) {
      resetGame();
    }
  } else if (showLandingPage && volumeControl) {
    if (
      e.clientX >= volumeControl.x &&
      e.clientX <= volumeControl.x + volumeControl.width &&
      e.clientY >= volumeControl.y &&
      e.clientY <= volumeControl.y + volumeControl.height
    ) {
      musicVolume = (e.clientX - volumeControl.x) / volumeControl.width;
      musicVolume = Math.max(0, Math.min(1, musicVolume));
      backgroundMusic.volume = musicVolume;
      isDraggingVolume = true;
    }
  }
});

window.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const sliderWidth = 200;
        const sliderX = canvas.width / 2 - sliderWidth / 2;
        const sliderY = canvas.height / 2;

        let newDifficulty = (e.clientX - sliderX) / sliderWidth;
        newDifficulty = Math.max(0, Math.min(1, newDifficulty));
        difficulty = newDifficulty;

        if (planets.length !== numPlanetsForDifficulty()) {
            regenerateWorld();
        }
    }
    if (isDraggingVolume) {
        const volumeControlWidth = 100;
        const volumeControlX = canvas.width / 2 - volumeControlWidth / 2;
    
        let newVolume = (e.clientX - volumeControlX) / volumeControlWidth;
        newVolume = Math.max(0, Math.min(1, newVolume));
        musicVolume = newVolume;
        backgroundMusic.volume = musicVolume;
      }
});

window.addEventListener('mouseup', () => {
    isDragging = false;
    isDraggingVolume = false;
});

window.addEventListener('keydown', (e) => {
    if (showLandingPage && e.key === ' ') {
        showLandingPage = false;
    } else if (!gameStarted && e.key === ' ') {
        gameStarted = true;
    } else if (gameStarted) {
        keys[e.key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

for (let i = 0; i < numPlanetsForDifficulty(); i++) createPlanet();
for (let i = 0; i < numInitialStars; i++) createStar();

gameLoop();