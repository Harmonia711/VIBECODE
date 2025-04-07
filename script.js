// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const cellSize = 80;
const rows = 5;
const cols = 9;

canvas.width = cols * cellSize;
canvas.height = rows * cellSize + cellSize; // Extra row at top for toolbar

// Game state
let plants = [];
let zombies = [];
let bullets = [];
let suns = [];
let sunPoints = 150;
let gameFrame = 0;
let gameOver = false;

// Load images for plants, zombies, and sun
const plantImages = {
    shooter: new Image(),
    sunflower: new Image(),
  };
  
  const zombieImages = {
    normal: new Image(),
  };
  
  const sunImage = new Image();
  
  // Set image sources (replace with actual image paths)
  plantImages.shooter.src = "./assets/peashooter.png";
  plantImages.sunflower.src = "./assets/sunflower.png";
  zombieImages.normal.src = "./assets/zombie.png";
  sunImage.src = "path/to/sun.png";
  
const shooterCost = 100;
const sunflowerCost = 50;

const sunCounter = document.getElementById("sunCounter");
const colors = {
  shooter: "green",
  sunflower: "orange",
  zombie: "brown",
  bullet: "yellow",
  sun: "gold",
  tileA: "#e6ffe6",
  tileB: "#ccffcc"
};

// UI Selection
let selectedPlant = "shooter";

// --- Classes ---

class Plant {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.row = y / cellSize - 1;
    this.width = cellSize;
    this.height = cellSize;
    this.health = 100;
    this.type = type;
    this.timer = 0;
  }

  draw() {
    const image = plantImages[this.type]; // Get the correct image based on plant type
    ctx.drawImage(image, this.x + 10, this.y + 10, this.width - 20, this.height - 20);
  }

  update() {
    this.timer++;

    if (this.type === "shooter") {
      const zombieInLane = zombies.some(z => z.y === this.y);
      if (zombieInLane && this.timer % 60 === 0) {
        bullets.push(new Bullet(this.x + this.width, this.y + this.height / 2));
      }
    }

    if (this.type === "sunflower") {
      if (this.timer % 300 === 0) {
        suns.push(new Sun(this.x + this.width / 2, this.y));
      }
    }
  }
}

class Zombie {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.row = y / cellSize - 1;
    this.width = cellSize;
    this.height = cellSize;
    this.speed = 0.3;
    this.health = 100;
    this.attacking = false;
    this.attackCooldown = 0;
  }

  draw() {
    ctx.drawImage(zombieImages.normal, this.x + 5, this.y + 5, this.width - 10, this.height - 10);
  }

  update() {
    this.attacking = false;

    for (let plant of plants) {
      if (this.y === plant.y &&
          this.x < plant.x + plant.width &&
          this.x + this.width > plant.x) {
        this.attacking = true;
        if (this.attackCooldown % 60 === 0) {
          plant.health -= 20;
        }
        break;
      }
    }

    if (!this.attacking) {
      this.x -= this.speed;
    }

    this.attackCooldown++;

    if (this.x <= 0) {
      gameOver = true;
    }
  }
}

class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 5;
    this.speed = 2;
  }

  draw() {
    ctx.fillStyle = colors.bullet;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  update() {
    this.x += this.speed;
  }
}

class Sun {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 15;
    this.speed = 0.5;
    this.collected = false;
  }

  draw() {
    ctx.fillStyle = colors.sun;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  update() {
    this.y += this.speed;
  }

  contains(mx, my) {
    const dx = this.x - mx;
    const dy = this.y - my;
    return dx * dx + dy * dy <= this.radius * this.radius;
  }
}

// --- Event Handlers ---

canvas.addEventListener("click", function (e) {
  if (gameOver) return;

  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  // Toolbar click
  if (my < cellSize) {
    if (mx < 100) selectedPlant = "shooter";
    else if (mx < 200) selectedPlant = "sunflower";
    return;
  }

  // Collect sun
  for (let i = suns.length - 1; i >= 0; i--) {
    if (suns[i].contains(mx, my)) {
      suns.splice(i, 1);
      sunPoints += 25;
      return;
    }
  }

  // Grid planting
  const x = Math.floor(mx / cellSize) * cellSize;
  const y = Math.floor(my / cellSize) * cellSize;

  if (y < cellSize) return;

  if (!plants.some(p => p.x === x && p.y === y)) {
    if (selectedPlant === "shooter" && sunPoints >= shooterCost) {
      plants.push(new Plant(x, y, "shooter"));
      sunPoints -= shooterCost;
    } else if (selectedPlant === "sunflower" && sunPoints >= sunflowerCost) {
      plants.push(new Plant(x, y, "sunflower"));
      sunPoints -= sunflowerCost;
    }
  }
});

// --- Game Functions ---

function spawnZombie() {
  if (gameFrame % 300 === 0) {
    const row = Math.floor(Math.random() * rows);
    const y = (row + 1) * cellSize;
    const x = canvas.width;
    zombies.push(new Zombie(x, y));
  }
}

function spawnSun() {
  if (gameFrame % 400 === 0) {
    const x = Math.random() * (canvas.width - 30) + 15;
    suns.push(new Sun(x, cellSize)); // Fall under toolbar
  }
}

function handleCollisions() {
  bullets.forEach((bullet, bIndex) => {
    zombies.forEach((zombie, zIndex) => {
      if (
        bullet.x > zombie.x &&
        bullet.x < zombie.x + zombie.width &&
        bullet.y > zombie.y &&
        bullet.y < zombie.y + zombie.height
      ) {
        zombie.health -= 20;
        bullets.splice(bIndex, 1);
        if (zombie.health <= 0) zombies.splice(zIndex, 1);
      }
    });
  });

  plants = plants.filter(p => p.health > 0);
}

// --- Draw Functions ---

function drawGrid() {
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tileColor = (r + c) % 2 === 0 ? colors.tileA : colors.tileB;
      ctx.fillStyle = tileColor;
      ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
    }
  }
}

function drawToolbar() {
  ctx.fillStyle = "#dddddd";
  ctx.fillRect(0, 0, canvas.width, cellSize);
  ctx.fillStyle = selectedPlant === "shooter" ? colors.shooter : "#888";
  ctx.fillRect(10, 10, 60, 60);
  ctx.fillStyle = selectedPlant === "sunflower" ? colors.sunflower : "#888";
  ctx.fillRect(110, 10, 60, 60);

  ctx.fillStyle = "black";
  ctx.font = "14px Arial";
  ctx.fillText("Peashooter", 10, 75);
  ctx.fillText("Sunflower", 110, 75);
}

// --- Main Loop ---

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  gameFrame++;

  drawGrid();
  drawToolbar();

  if (!gameOver) {
    spawnZombie();
    spawnSun();
    handleCollisions();

    plants.forEach(plant => {
      plant.update();
      plant.draw();
    });

    bullets.forEach((bullet, index) => {
      bullet.update();
      bullet.draw();
      if (bullet.x > canvas.width) bullets.splice(index, 1);
    });

    zombies.forEach((zombie, index) => {
      zombie.update();
      zombie.draw();
    });

    suns.forEach((sun, index) => {
      sun.update();
      sun.draw();
      if (sun.y > canvas.height) suns.splice(index, 1);
    });

    sunCounter.textContent = sunPoints;
    requestAnimationFrame(animate);
  } else {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "60px Arial";
    ctx.fillText("Game Over", canvas.width / 2 - 160, canvas.height / 2);
  }
}

animate();
