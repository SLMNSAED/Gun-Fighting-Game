const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ===== Settings ===== //
const PLAYER_SPEED = 5;
const BULLET_SPEED = 12;
const SHOOT_COOLDOWN = 300;
let score = 0;
let keys = {};
const bullets = [];
const effects = [];

// ===== Event Listeners ===== //
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

// ===== Classes ===== //
class Player {
  constructor(x, color, controls) {
    this.x = x;
    this.y = canvas.height / 2;
    this.width = 50;
    this.height = 50;
    this.color = color;
    this.health = 5;
    this.lastShot = 0;
    this.controls = controls;
  }

  move() {
    if (keys[this.controls.up] && this.y > 0) this.y -= PLAYER_SPEED;
    if (keys[this.controls.down] && this.y + this.height < canvas.height) this.y += PLAYER_SPEED;
  }

  shoot() {
    const now = Date.now();
    if (keys[this.controls.shoot] && now - this.lastShot > SHOOT_COOLDOWN) {
      bullets.push(new Bullet(this.x + (this.controls.dir === 'right' ? this.width : -12),
                              this.y + this.height / 2, this.controls.dir, this.color));
      this.lastShot = now;
    }
  }

  draw() {
    drawRect(this);
  }
}

class Bullet {
  constructor(x, y, dir, color) {
    this.x = x;
    this.y = y;
    this.width = 12;
    this.height = 5;
    this.color = color;
    this.dir = dir;
  }

  update() {
    this.x += (this.dir === 'right' ? BULLET_SPEED : -BULLET_SPEED);
  }

  draw() {
    drawRect(this);
  }
}

class Effect {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.life = 20;
  }

  update() {
    this.radius += 2;
    this.life--;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,0,0,${this.life / 20})`;
    ctx.stroke();
  }
}

// ===== Draw Helpers ===== //
function drawRect(obj) {
  ctx.fillStyle = obj.color;
  ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
}

function drawHealthBar(x, y, w, h, current, max, color) {
  ctx.fillStyle = 'gray';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, (w * current) / max, h);
}

// ===== Collision ===== //
function isColliding(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

// ===== Game State ===== //
const player1 = new Player(50, 'deepskyblue', {
  up: 'w',
  down: 's',
  shoot: ' ',
  dir: 'right'
});

const player2 = new Player(canvas.width - 100, 'crimson', {
  up: 'ArrowUp',
  down: 'ArrowDown',
  shoot: 'Enter',
  dir: 'left'
});

// ===== Main Loop ===== //
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  player1.move();
  player1.shoot();
  player1.draw();

  player2.move();
  player2.shoot();
  player2.draw();

  bullets.forEach((bullet, idx) => {
    bullet.update();
    bullet.draw();

    // Bullet collision with players
    if (bullet.dir === 'right' && isColliding(bullet, player2)) {
      player2.health--;
      effects.push(new Effect(bullet.x, bullet.y));
      bullets.splice(idx, 1);
    } else if (bullet.dir === 'left' && isColliding(bullet, player1)) {
      player1.health--;
      effects.push(new Effect(bullet.x, bullet.y));
      bullets.splice(idx, 1);
    }

    // Remove offscreen bullets
    if (bullet.x < 0 || bullet.x > canvas.width) bullets.splice(idx, 1);
  });

  effects.forEach((effect, idx) => {
    effect.update();
    effect.draw();
    if (effect.life <= 0) effects.splice(idx, 1);
  });

  // Healthbars
  drawHealthBar(20, 20, 150, 20, player1.health, 5, 'deepskyblue');
  drawHealthBar(canvas.width - 170, 20, 150, 20, player2.health, 5, 'crimson');

  // Win Condition
  if (player1.health <= 0 || player2.health <= 0) {
    ctx.fillStyle = 'black';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${player1.health <= 0 ? 'Player 2' : 'Player 1'} Wins!`, canvas.width / 2, canvas.height / 2);
    return;
  }

  requestAnimationFrame(update);
}

update();
