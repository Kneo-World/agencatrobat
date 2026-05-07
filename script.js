const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.style.backgroundColor = "black";

const WIDTH = 1080;
const HEIGHT = 2132;

let scale = 1;
let offsetX = 0;
let offsetY = 0;

function resize() {
    const screenRatio = window.innerWidth / window.innerHeight;
    const gameRatio = WIDTH / HEIGHT;

    if (screenRatio > gameRatio) {
        scale = window.innerHeight / HEIGHT;
        offsetX = (window.innerWidth - WIDTH * scale) / 2;
        offsetY = 0;
    } else {
        scale = window.innerWidth / WIDTH;
        offsetY = (window.innerHeight - HEIGHT * scale) / 2;
        offsetX = 0;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

// --- Event Bus ---
const EventBus = {
    listeners: {},
    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    },
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }
};

// --- Variable Storage ---
const Variables = {
    "Очки": 0,
    "Очки 2": 0,
    "Ник": "Игрок",
    "золото": 0,
    "урофень": 1
};

const Persistence = {
    save() {
        localStorage.setItem('ninja_turtle_cats_save', JSON.stringify(Variables));
    },
    load() {
        const data = localStorage.getItem('ninja_turtle_cats_save');
        if (data) {
            Object.assign(Variables, JSON.parse(data));
        }
    }
};

// --- Asset Loader ---
const Assets = {
    images: {},
    loaded: 0,
    total: 0,
    load(name, src) {
        this.total++;
        const img = new Image();
        img.onload = () => this.loaded++;
        img.src = 'images/' + src;
        this.images[name] = img;
    }
};

// --- Sprite Class ---
class Sprite {
    constructor(name, scene) {
        this.name = name;
        this.scene = scene;
        this.x = 0;
        this.y = 0;
        this.size = 100;
        this.lookIndex = 0;
        this.looks = [];
        this.visible = true;
        this.rotation = 0;
        this.scripts = [];
        this.texts = [];
    }

    addLook(fileName) {
        this.looks.push(Assets.images[fileName]);
    }

    draw() {
        if (!this.visible || this.looks.length === 0) return;
        const img = this.looks[this.lookIndex];
        if (!img) return;

        const w = img.width * (this.size / 100);
        const h = img.height * (this.size / 100);
        
        ctx.save();
        // Convert Catrobat coordinates to Canvas
        const cx = WIDTH / 2 + this.x;
        const cy = HEIGHT / 2 - this.y;
        
        ctx.translate(offsetX + cx * scale, offsetY + cy * scale);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.drawImage(img, -w/2 * scale, -h/2 * scale, w * scale, h * scale);
        ctx.restore();

        // Draw attached texts
        this.texts.forEach(t => {
            ctx.save();
            ctx.fillStyle = t.color;
            ctx.font = `${t.size * scale}px Arial`;
            ctx.textAlign = "center";
            const tx = WIDTH / 2 + t.x;
            const ty = HEIGHT / 2 - t.y;
            ctx.fillText(Variables[t.variableName], offsetX + tx * scale, offsetY + ty * scale);
            ctx.restore();
        });
    }

    isTouched(touchX, touchY) {
        if (!this.visible || this.looks.length === 0) return false;
        const img = this.looks[this.lookIndex];
        const w = (img.width * (this.size / 100)) * scale;
        const h = (img.height * (this.size / 100)) * scale;
        const cx = (WIDTH / 2 + this.x) * scale + offsetX;
        const cy = (HEIGHT / 2 - this.y) * scale + offsetY;

        return touchX >= cx - w/2 && touchX <= cx + w/2 &&
               touchY >= cy - h/2 && touchY <= cy + h/2;
    }

    glide(targetX, targetY, duration) {
        const startX = this.x;
        const startY = this.y;
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            this.x = startX + (targetX - startX) * progress;
            this.y = startY + (targetY - startY) * progress;
            if (progress >= 1) clearInterval(interval);
        }, 16);
    }
}

// --- Scene Manager ---
class Scene {
    constructor(name) {
        this.name = name;
        this.sprites = [];
    }
    addSprite(sprite) { this.sprites.push(sprite); }
    update() {}
    draw() {
        this.sprites.forEach(s => s.draw());
    }
    handleTouch(x, y) {
        for (let i = this.sprites.length - 1; i >= 0; i--) {
            if (this.sprites[i].isTouched(x, y)) {
                if (this.sprites[i].onTouch) this.sprites[i].onTouch();
                return true;
            }
        }
        return false;
    }
}

const Scenes = {};
let currentScene = null;

function changeScene(name) {
    if (Scenes[name]) {
        currentScene = Scenes[name];
        if (currentScene.onEnter) currentScene.onEnter();
    }
}

// --- Game Logic Implementation ---

// Load Assets (Simplified Placeholder Names)
Assets.load('bg', 'Фон.png');
Assets.load('play_btn', 'Мой актер или объект.png');
Assets.load('cat_base', 'Мой актер или объект_#6.png');
// ... Assume other assets are loaded here ...

// Scene 2: Loading / Start Menu
Scenes['Сцена 2'] = new Scene('Сцена 2');
const startBg = new Sprite('Фон', Scenes['Сцена 2']);
startBg.addLook('bg');
Scenes['Сцена 2'].addSprite(startBg);

const playBtn = new Sprite('играть', Scenes['Сцена 2']);
playBtn.addLook('play_btn');
playBtn.x = 16;
playBtn.y = 6;
playBtn.onTouch = () => changeScene('Сцена 1');
Scenes['Сцена 2'].addSprite(playBtn);

// Scene 1: Main Game
Scenes['Сцена 1'] = new Scene('Сцена 1');
const mainBg = new Sprite('Фон', Scenes['Сцена 1']);
mainBg.addLook('bg');
mainBg.x = 1596;
mainBg.y = -90;
mainBg.size = 400;
mainBg.onEnter = () => {
    // Forever loop for background glide
    const loop = () => {
        mainBg.glide(-1600, 183, 25);
        setTimeout(() => {
            mainBg.glide(1596, -90, 25);
            setTimeout(loop, 25100);
        }, 25100);
    };
    loop();
};
Scenes['Сцена 1'].addSprite(mainBg);

const cat = new Sprite('1 (1)', Scenes['Сцена 1']);
cat.addLook('cat_base');
// Adding looks for all stages (indices 1..46)
for(let i=44; i<=88; i++) cat.addLook(`1_#${i}.png`);
cat.x = -270;
cat.y = 201;
cat.size = 50;
cat.texts.push({ variableName: 'Очки', x: -261, y: 582, color: '#84E0FF', size: 200 });

cat.onTouch = () => {
    Variables['Очки'] += 1;
    Persistence.save();
    updateCatLook();
};

function updateCatLook() {
    const score = Variables['Очки'];
    if (score >= 7250) cat.lookIndex = 47;
    else if (score >= 7100) cat.lookIndex = 46;
    else if (score >= 7000) cat.lookIndex = 45;
    else if (score >= 6900) cat.lookIndex = 44;
    else if (score >= 6700) cat.lookIndex = 43;
    else if (score >= 6500) cat.lookIndex = 42;
    else if (score >= 6300) cat.lookIndex = 41;
    else if (score >= 6100) cat.lookIndex = 40;
    else if (score >= 6000) cat.lookIndex = 39;
    else if (score >= 5900) cat.lookIndex = 38;
    else if (score >= 5800) cat.lookIndex = 37;
    else if (score >= 5700) cat.lookIndex = 36;
    else if (score >= 5500) cat.lookIndex = 35;
    else if (score >= 5300) cat.lookIndex = 34;
    else if (score >= 5200) cat.lookIndex = 33;
    else if (score >= 5000) cat.lookIndex = 32;
    else if (score >= 4800) cat.lookIndex = 31;
    else if (score >= 4600) cat.lookIndex = 30;
    else if (score >= 4400) cat.lookIndex = 29;
    else if (score >= 4100) cat.lookIndex = 28;
    else if (score >= 4000) cat.lookIndex = 27;
    else if (score >= 3800) cat.lookIndex = 26;
    else if (score >= 3600) cat.lookIndex = 25;
    else if (score >= 3500) cat.lookIndex = 24;
    else if (score >= 3400) cat.lookIndex = 23;
    else if (score >= 3200) cat.lookIndex = 22;
    else if (score >= 3000) cat.lookIndex = 21;
    else if (score >= 2800) cat.lookIndex = 20;
    else if (score >= 2600) cat.lookIndex = 19;
    else if (score >= 2400) cat.lookIndex = 18;
    else if (score >= 2200) cat.lookIndex = 17;
    else if (score >= 2000) cat.lookIndex = 16;
    else if (score >= 1900) cat.lookIndex = 15;
    else if (score >= 1700) cat.lookIndex = 14;
    else if (score >= 1500) cat.lookIndex = 13;
    else if (score >= 1300) cat.lookIndex = 12;
    else if (score >= 1100) cat.lookIndex = 11;
    else if (score >= 1000) cat.lookIndex = 8;
    else if (score >= 900) cat.lookIndex = 7;
    else if (score >= 750) cat.lookIndex = 6;
    else if (score >= 600) cat.lookIndex = 5;
    else if (score >= 450) cat.lookIndex = 4;
    else if (score >= 300) cat.lookIndex = 3;
    else if (score >= 250) cat.lookIndex = 2;
    else if (score >= 100) cat.lookIndex = 1;
}
Scenes['Сцена 1'].addSprite(cat);

// Passive income trackers
const ticketIcon = new Sprite('1', Scenes['Сцена 1']);
ticketIcon.addLook('Мой актер или объект.png');
ticketIcon.x = 260;
ticketIcon.y = 188;
ticketIcon.size = 50;
ticketIcon.texts.push({ variableName: 'Очки 2', x: 261, y: 579, color: '#FF9296', size: 200 });
Scenes['Сцена 1'].addSprite(ticketIcon);

// Gold tracker
const goldIcon = new Sprite('1 (2)', Scenes['Сцена 1']);
goldIcon.addLook('Мой актер или объект_#1.png');
goldIcon.x = 3;
goldIcon.y = -470;
goldIcon.size = 50;
goldIcon.texts.push({ variableName: 'золото', x: 4, y: -76, color: '#FFEF79', size: 200 });
Scenes['Сцена 1'].addSprite(goldIcon);

// Timers for income
setInterval(() => {
    Variables['Очки 2'] += 5;
    Persistence.save();
}, 10000);

setInterval(() => {
    Variables['золото'] += 1;
    Persistence.save();
}, 1000);

// Shop Button
const shopBtn = new Sprite('Мой актер или объект', Scenes['Сцена 1']);
shopBtn.addLook('Мой актер или объект_#0.png');
shopBtn.x = 336;
shopBtn.y = 981;
shopBtn.size = 105;
shopBtn.onTouch = () => changeScene('Магазин');
Scenes['Сцена 1'].addSprite(shopBtn);

// Profile Button
const profBtn = new Sprite('Мой актер или объект (6)', Scenes['Сцена 1']);
profBtn.addLook('Мой актер или объект_#2.png');
profBtn.x = -65;
profBtn.y = 981;
profBtn.size = 105;
profBtn.onTouch = () => changeScene('ппофиль');
Scenes['Сцена 1'].addSprite(profBtn);

// Scene: Shop (Магазин)
Scenes['Магазин'] = new Scene('Магазин');
const shopBg = new Sprite('Фон', Scenes['Магазин']);
shopBg.addLook('Фон_#4.png');
shopBg.size = 400;
Scenes['Магазин'].addSprite(shopBg);

const backToMain = new Sprite('Назад', Scenes['Магазин']);
backToMain.addLook('Мой актер или объект_#0.png');
backToMain.x = -360;
backToMain.y = 973;
backToMain.onTouch = () => changeScene('Сцена 1');
Scenes['Магазин'].addSprite(backToMain);

// Example Shop Item (10 Tickets -> 10 Points)
const shopItem1 = new Sprite('Акция (5)', Scenes['Магазин']);
shopItem1.addLook('Мой актер или объект_#3.png');
shopItem1.x = 5;
shopItem1.y = -739;
shopItem1.size = 70;
shopItem1.onTouch = () => {
    if (Variables['Очки 2'] >= 10) {
        Variables['Очки 2'] -= 10;
        Variables['Очки'] += 10;
        Persistence.save();
    }
};
Scenes['Магазин'].addSprite(shopItem1);

// Scene: Profile (ппофиль)
Scenes['ппофиль'] = new Scene('ппофиль');
const profBg = new Sprite('Фон', Scenes['ппофиль']);
profBg.addLook('Фон_#4.png');
profBg.size = 400;
Scenes['ппофиль'].addSprite(profBg);

const nickLabel = new Sprite('Паспорт', Scenes['ппофиль']);
nickLabel.addLook('Мой актер или объект.png');
nickLabel.x = -3;
nickLabel.y = 505;
nickLabel.texts.push({ variableName: 'Ник', x: 190, y: 767, color: '#FFFFFF', size: 120 });
nickLabel.texts.push({ variableName: 'урофень', x: 276, y: 595, color: '#FFFFFF', size: 120 });
Scenes['ппофиль'].addSprite(nickLabel);

const changeNick = new Sprite('Ник', Scenes['ппофиль']);
changeNick.addLook('Мой актер или объект_#8.png');
changeNick.x = 194;
changeNick.y = 745;
changeNick.onTouch = () => {
    const n = prompt("Как тебя зовут?");
    if (n) Variables['Ник'] = n;
    Persistence.save();
};
Scenes['ппофиль'].addSprite(changeNick);

const backFromProf = new Sprite('Назад', Scenes['ппофиль']);
backFromProf.addLook('Мой актер или объект_#1.png');
backFromProf.x = -360;
backFromProf.y = 973;
backFromProf.onTouch = () => changeScene('Сцена 1');
Scenes['ппофиль'].addSprite(backFromProf);

// Scene: Boxes (боксы)
Scenes['боксы'] = new Scene('боксы');
const boxBg = new Sprite('Фон', Scenes['боксы']);
boxBg.addLook('Фон_#4.png');
boxBg.size = 400;
Scenes['боксы'].addSprite(boxBg);

const megaBoxBtn = new Sprite('цена', Scenes['боксы']);
megaBoxBtn.addLook('Мой актер или объект_#0.png');
megaBoxBtn.x = 192;
megaBoxBtn.y = 557;
megaBoxBtn.size = 80;
megaBoxBtn.onTouch = () => {
    if (Variables['золото'] >= 100) {
        Variables['золото'] -= 100;
        changeScene('Мегабоксик');
    }
};
Scenes['боксы'].addSprite(megaBoxBtn);

const backFromBoxes = new Sprite('Назад', Scenes['боксы']);
backFromBoxes.addLook('Мой актер или объект_#1.png');
backFromBoxes.x = -360;
backFromBoxes.y = 973;
backFromBoxes.onTouch = () => changeScene('Сцена 1');
Scenes['боксы'].addSprite(backFromBoxes);

// Box Scenes (Example MegaBox)
Scenes['Мегабоксик'] = new Scene('Мегабоксик');
const megBg = new Sprite('Фон', Scenes['Мегабоксик']);
megBg.addLook('bg');
Scenes['Мегабоксик'].addSprite(megBg);

const animBox = new Sprite('бокс', Scenes['Мегабоксик']);
animBox.addLook('Мой актер или объект.png');
animBox.x = 4;
animBox.y = 1380;
animBox.onEnter = () => {
    animBox.y = 1380;
    animBox.glide(4, -217, 1);
};
animBox.onTouch = () => {
    Variables['Очки'] += 25;
    Persistence.save();
    changeScene('Сцена 1');
};
Scenes['Мегабоксик'].addSprite(animBox);

// --- Input Handling ---
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (currentScene) currentScene.handleTouch(x, y);
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    if (currentScene) currentScene.handleTouch(x, y);
}, { passive: false });

// --- Game Loop ---
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (currentScene) {
        currentScene.update();
        currentScene.draw();
    }
    requestAnimationFrame(loop);
}

// Start Game
Persistence.load();
changeScene('Сцена 2');
loop();