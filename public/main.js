
const cameraWidth = 800;
const cameraHeight = 600;
const ratio = .25;
const mapWidth = cameraWidth / ratio;
const mapHeight = cameraHeight / ratio;
let offsetTop = 0;
let offsetLeft = 0;
const img = new Image();
img.src = './background.jpg';

function getPositionByAngle(x, y, increment, angle, quadrant) {
  x = quadrant ? x + Math.sin(Math.atan(angle)) * increment : x - Math.sin(Math.atan(angle)) * increment;
  y = quadrant ? y + Math.cos(Math.atan(angle)) * increment : y - Math.cos(Math.atan(angle)) * increment;
  return { x, y };
}

class Camera {
  constructor(canvas, context) {
    this.canvas = canvas;
    this.context = context;
    this.camera = document.createElement('canvas');
    this.cameraContext = this.camera.getContext('2d');

    this.camera.width = cameraWidth;
    this.camera.height = cameraHeight;

    document.getElementById('app').appendChild(this.camera);
    offsetTop = this.camera.offsetTop + 2;
    offsetLeft = this.camera.offsetLeft + 2;
  }

  lookAt(target) {
    let x = target.centerPosX - cameraWidth / 2;
    let y = target.centerPosY - cameraHeight / 2;
    if (x < 0) x = 0;
    else if (x > mapWidth - cameraWidth) x = mapWidth - cameraWidth;
    if (y < 0) y = 0;
    else if (y > mapHeight - cameraHeight) y = mapHeight - cameraHeight;
    this.cameraContext.drawImage(
      this.canvas,
      x,
      y,
      cameraWidth,
      cameraHeight,
      0,
      0,
      cameraWidth,
      cameraHeight
    );
  }

  createMap(target) {
    this.context.lineWidth = 20;
    this.context.strokeStyle = 'rgb(255, 255, 255)';
    let x = target.centerPosX - cameraWidth / 2;
    let y = target.centerPosY - cameraHeight / 2;
    if (x < 0) x = 0;
    else if (x > mapWidth - cameraWidth) x = mapWidth - cameraWidth;
    if (y < 0) y = 0;
    else if (y > mapHeight - cameraHeight) y = mapHeight - cameraHeight;
    this.context.strokeRect(x, y, cameraWidth, cameraHeight);
    this.cameraContext.globalAlpha = .5;
    this.cameraContext.drawImage(
      this.canvas,
      0,
      0,
      mapWidth,
      mapHeight,
      cameraWidth * (1 - ratio),
      cameraHeight * (1 - ratio),
      cameraWidth * ratio,
      cameraHeight * ratio
    );
    this.cameraContext.lineWidth = 1;
    this.cameraContext.globalAlpha = 1;
    this.cameraContext.strokeStyle = 'rgb(255, 255, 255)';
    this.cameraContext.strokeRect(
      cameraWidth * (1 - ratio) - 1,
      cameraHeight * (1 - ratio) - 1,
      cameraWidth * ratio + 1,
      cameraHeight * ratio + 1
    );
  }
}

class Bullet {
  constructor(context, x, y, angle, quadrant) {
    this.context = context;
    this._x = x;
    this._y = y;
    this.angle = angle;
    this.quadrant = quadrant;
    this._step = .08;
    this._speed = .02;
    this._r = .002;
  }

  get speed() {
    return this._speed * mapWidth;
  }
  get x() {
    return this._x * mapWidth;
  }
  get y() {
    return this._y * mapHeight;
  }
  set x(newX) {
    this._x = newX / mapWidth;
  }
  set y(newY) {
    this._y = newY / mapHeight;
  }
  get r() {
    return this._r * mapWidth;
  }

  render() {
    this.context.save();
    this.context.fillStyle = 'red';
    this.context.beginPath();
    this.context.arc(this.x, this.y, this.r, 0, 360);
    this.context.fill();
    this.context.closePath();
    this.context.fillStyle = 'rgb(255, 244, 64)';
    this.context.beginPath();
    this.context.arc(this.x, this.y, this.r * .8, 0, 360);
    this.context.fill();
    this.context.closePath();
    this.context.restore();
  }

  update() {
    this._speed -= this._speed * this._step;
    const { x, y } = getPositionByAngle(this._x, this._y, this._speed, this.angle, this.quadrant);
    this._x = x;
    this._y = y;
  }

  isStop() {
    return this._speed <= 0.01;
  }
}

class People {
  initClip = 40;
  initHP = 100;
  constructor(context, id, centerPosX, centerPosY, HP = this.initHP, clip = this.initClip) {
    this.context = context;
    this.id = id;
    this._centerPosX = centerPosX;
    this._centerPosY = centerPosY;
    this.name = '敌人';
    this.HP = HP;
    this.clip = clip;

    this._r = .008;
    this._step = .002;
    this.color = 'blue';
    this.angle = 0;
    this.quadrant = true;
  }

  get step() {
    return this._step * mapWidth;
  }
  get r() {
    return this._r * mapWidth;
  }
  get centerPosX() {
    return this._centerPosX * mapWidth;
  }
  get centerPosY() {
    return this._centerPosY * mapHeight;
  }
  set centerPosX(centerPosX) {
    const newCenterPosX = centerPosX / mapWidth;
    if (this._centerPosX === newCenterPosX) return;
    this._centerPosX = newCenterPosX;
    this.boundaryDetection();
  }
  set centerPosY(centerPosY) {
    const newCenterPosY = centerPosY / mapHeight;
    if (this._centerPosY === newCenterPosY) return;
    this._centerPosY = newCenterPosY;
    this.boundaryDetection();
  }

  setStep(ratio) {
    this._step = .002 * ratio;
  }

  render() {
    this.context.save();
    this.context.fillStyle = '#fff';
    this.context.beginPath();
    this.context.arc(this.centerPosX, this.centerPosY, this.r, 0, 360);
    this.context.fill();
    this.context.closePath();
    this.context.fillStyle = this.color;
    this.context.beginPath();
    this.context.arc(this.centerPosX, this.centerPosY, this.r * .9, 0, 360);
    this.context.fill();
    this.context.closePath();
    for (let i = 0; i < this.HP; ++i) {
      this.context.fillRect(this.centerPosX - this.r + i * this.r / (this.initHP / 2), this.centerPosY - this.r * 2.5, this.r / this.initHP, this.r * .5);
    }
    this.context.restore();
    this.context.save();
    this.context.fillStyle = 'rgb(255, 244, 64)';
    for (let i = 0; i < this.clip; ++i) {
      this.context.fillRect(this.centerPosX - this.r + i * this.r / (this.initClip / 2), this.centerPosY - this.r * 1.8, this.r / this.initClip, this.r * .5);
    }
    this.context.restore();
    this.context.save();
    this.context.fillStyle = 'rgb(255, 255, 255)';
    this.context.font = '16px 微软雅黑';
    this.context.fillText(this.name, this.centerPosX - this.name.length * 8, this.centerPosY + 5);
    this.context.beginPath();
    const { x, y } = getPositionByAngle(this.centerPosX, this.centerPosY, this.r, this.angle, this.quadrant);
    this.context.arc(x, y, this.r / 2, 0, 360);
    this.context.fill();
    this.context.closePath();
    this.context.restore();
  }

  isInside(x, y) {
    return x >= this.centerPosX - this.r &&
      x <= this.centerPosX + this.r &&
      y >= this.centerPosY - this.r &&
      y <= this.centerPosY + this.r;
  }

  bruise() {
    send('bruise', {
      id: this.id
    });
  }

  boundaryDetection() {
    if (this.centerPosY <= 0 + this.r) this.centerPosY = 0 + this.r;
    else if (this.centerPosY >= mapHeight - this.r) this.centerPosY = mapHeight - this.r;
    if (this.centerPosX <= 0 + this.r) this.centerPosX = 0 + this.r;
    else if (this.centerPosX >= mapWidth - this.r) this.centerPosX = mapWidth - this.r;
  }
}

class Protagonist extends People {
  constructor(context) {
    super(context, Math.random().toString(), Math.random(), Math.random());
    this.color = 'red';
    this.name = '我';

    this.isStop = true;

    let keydownFlag = true;
    document.body.addEventListener('keydown', (e) => {
      if (!keydownFlag) return;
      keydownFlag = false;

      if (e.code === 'KeyA') {
        this.isStop = false;
      } else if (e.code === 'KeyS') {
        if (this.clip !== 0) {
          const { x, y } = getPositionByAngle(this._centerPosX, this._centerPosY, this._r + this._step * 5, this.angle, this.quadrant);
          send('click', {
            id: this.id,
            x,
            y,
            angle: this.angle,
            quadrant: this.quadrant
          });
        }
      }

      window.requestAnimationFrame(() => {
        keydownFlag = true;
      });
    });
    document.addEventListener('keyup', (e) => {
      if (e.code === 'KeyA') {
        this.isStop = true;
      }
    });
    let moveFlag = true;
    document.body.addEventListener('mousemove', (e) => {
      if (!moveFlag) return;
      moveFlag = false;

      const { pageX, pageY } = e;
      let centerPosX;
      let centerPosY;
      if (this.centerPosX < cameraWidth / 2) {
        centerPosX = this.centerPosX;
      } else if (this.centerPosX > mapWidth - cameraWidth / 2) {
        centerPosX = this.centerPosX - mapWidth + cameraWidth;
      } else {
        centerPosX = cameraWidth / 2;
      }
      if (this.centerPosY < cameraHeight / 2) {
        centerPosY = this.centerPosY;
      } else if (this.centerPosY > mapHeight - cameraHeight / 2) {
        centerPosY = this.centerPosY - mapHeight + cameraHeight;
      } else {
        centerPosY = cameraHeight / 2;
      }
      const ex = pageX - centerPosX - offsetLeft;
      const ey = pageY - centerPosY - offsetTop;
      this.angle = ex / ey;
      this.quadrant = ey >= 0;

      send('beacon', {
        id: this.id,
        angle: this.angle,
        quadrant: this.quadrant
      });

      window.requestAnimationFrame(() => {
        moveFlag = true;
      });
    });
  }

  move() {
    if (this.isStop) return;
    const { x, y } = getPositionByAngle(this.centerPosX, this.centerPosY, this.step, this.angle, this.quadrant);
    this.centerPosX = x;
    this.centerPosY = y;
  }
}

class Game {
  constructor() {
    this.ws = new WebSocket((window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host);
    this.persons = new Set();
    this.bullets = new Set();
    this.protagonist = null;
    this.camera = null;
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');

    this.canvas.width = mapWidth;
    this.canvas.height = mapHeight;
  }

  start() {
    this.ws.addEventListener('open', () => {
      this.protagonist = new Protagonist(this.context);
      this.persons.add(this.protagonist);
      this.camera = new Camera(this.canvas, this.context);

      send('init', {
        id: this.protagonist.id,
        centerPosX: this.protagonist._centerPosX,
        centerPosY: this.protagonist._centerPosY,
        HP: this.protagonist.HP,
        clip: this.protagonist.clip
      });

      window.requestAnimationFrame(() => this.render());
    });

    this.ws.addEventListener('message', (e) => {
      const { type, data } = JSON.parse(e.data);
      if (type === 'newPeople') {
        const { id, centerPosX, centerPosY, HP, clip } = data;
        this.persons.add(new People(this.context, id, centerPosX, centerPosY, HP, clip));
        console.log('new people, count: ' + this.persons.size);
      } else if (type === 'newPerson') {
        data.forEach(({ id, centerPosX, centerPosY, HP, clip }) => {
          this.persons.add(new People(this.context, id, centerPosX, centerPosY, HP, clip));
        });
      } else if (type === 'move') {
        const { id, centerPosX, centerPosY } = data;
        this.persons.forEach(people => {
          if (people.id === id && people !== this.protagonist) {
            people._centerPosX = centerPosX;
            people._centerPosY = centerPosY;
          }
        });
      } else if (type === 'beacon') {
        const { id, angle, quadrant } = data;
        this.persons.forEach(people => {
          if (people.id === id) {
            people.angle = angle;
            people.quadrant = quadrant;
          }
        });
      } else if (type === 'click') {
        const { id, x, y, angle, quadrant, clip } = data;
        this.persons.forEach(people => {
          if (people.id === id) {
            people.clip = clip;
          }
        });
        this.bullets.add(new Bullet(this.context, x, y, angle, quadrant));
      } else if (type === 'loadClip') {
        const { id } = data;
        this.persons.forEach(people => {
          if (people.id === id) {
            people.clip = people.initClip;
          }
        });
      } else if (type === 'bruise') {
        const { id, HP } = data;
        this.persons.forEach(people => {
          if (people.id === id) {
            people.HP = HP;
            let count = 30;
            const back = () => {
              if (count <= 0) {
                people.setStep(1);
                return;
              };
              count--;
              people.setStep(.5);
              window.requestAnimationFrame(() => {
                back();
              });
            };
            window.requestAnimationFrame(() => {
              back();
            });
          }
        });
      } else if (type === 'over') {
        const { id } = data;
        if (this.protagonist.id === id) {
          this.persons.delete(this.protagonist);
          document.body.innerHTML = '你已死亡';
          document.body.style.background = '#fff';
        } else {
          this.persons.forEach(people => {
            if (people.id === id) {
              this.persons.delete(people);
            }
          });
        }
      } else if (type === 'close') {
        const { id } = data;
        this.persons.forEach(people => {
          if (people.id === id) {
            this.persons.delete(people);
            console.log('close, count: ' + this.persons.size);
          }
        });
      }
    });
  }

  render() {
    this.context.clearRect(0, 0, mapWidth, mapWidth);

    this.context.drawImage(img, 0, 0, mapWidth, mapHeight);
    flag:
    for (const bullet of this.bullets) {
      for (const people of this.persons) {
        if (people.isInside(bullet.x, bullet.y)) {
          if (people === this.protagonist) {
            people.bruise();
          }
          this.bullets.delete(bullet);
          continue flag;
        }
      }
      bullet.update();
      bullet.render();
      if (bullet.isStop()) {
        this.bullets.delete(bullet);
      }
    }
    this.persons.forEach(people => {
      if (people === this.protagonist) {
        people.move();
        !people.isStop && send('move', {
          id: people.id,
          centerPosX: people._centerPosX,
          centerPosY: people._centerPosY
        });
      }
      people.render();
    });
    this.camera.lookAt(this.protagonist);
    this.camera.createMap(this.protagonist);

    window.requestAnimationFrame(() => this.render());
  }
}

const game = new Game();
game.start();

function send(type, data) {
  game.ws.send(JSON.stringify({
    type, data
  }));
}
