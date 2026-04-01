const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const state = {
    week: 1,
    money: 10000,
    reputation: 100,
    team: { energy: 100, motivation: 100 },
    product: { bugs: 0, features: 0, stability: 100 },
    employees: [],
    eventActive: false
};

const FLOOR = {
    wallColor: '#2A2C36',
    floorColor: '#5C3D1E',
    floorStripeColor: '#4a3018',
    ceilingColor: '#23252f',
    wallTop: 0.15,
    wallBottom: 0.85,
};

function getFloorY() { return canvas.height * FLOOR.wallBottom; }
function getCeilY() { return canvas.height * FLOOR.wallTop; }
function getRoomHeight() { return getFloorY() - getCeilY(); }

function getRoom() {
    const w = canvas.width;
    return [
        { name: 'Dev Room', x: 0, width: w * 0.45, color: '#252730' },
        { name: 'Design', x: w * 0.45, width: w * 0.3, color: '#222430' },
        { name: 'Management', x: w * 0.75, width: w * 0.25, color: '#232530' },
    ];
}

function getDesks() {
    const floorY = getFloorY();
    const w = canvas.width;
    return [
        { x: w * 0.08, y: floorY },
        { x: w * 0.22, y: floorY },
        { x: w * 0.36, y: floorY },
        { x: w * 0.54, y: floorY },
        { x: w * 0.65, y: floorY },
        { x: w * 0.82, y: floorY },
    ];
}

const ROLES = ['Dev', 'Dev', 'Designer', 'Designer', 'Manager', 'Manager'];
const ROLE_COLOR = {
    'Dev': '#3A86FF',
    'Designer': '#FF7043',
    'Manager': '#4CAF50'
};

function createEmployee(id) {
    const desks = getDesks();
    const assignedDesk = desks[id % desks.length];
    return {
        id,
        role: ROLES[id % ROLES.length],
        x: assignedDesk.x,
        targetX: assignedDesk.x,
        deskX: assignedDesk.x,
        speed: 0.6 + Math.random() * 0.4,
        working: false,
        workTimer: 0,
        idleTimer: Math.floor(Math.random() * 120),
        facingRight: true,
        energy: 100,
        motivation: 100,
    };
}

for (let i = 0; i < 3; i++) {
    state.employees.push(createEmployee(i));
}

function drawRoom(room) {
    const ceilY = getCeilY();
    const floorY = getFloorY();
    const roomH = getRoomHeight();

    ctx.fillStyle = room.color;
    ctx.fillRect(room.x, ceilY, room.width, roomH);

    ctx.fillStyle = FLOOR.ceilingColor;
    ctx.fillRect(room.x, ceilY, room.width, 10);

    const plankHeight = 10;
    const plankCount = 6;
    for (let i = 0; i < plankCount; i++) {
        const py = floorY - plankHeight + (i * 2);
        ctx.fillStyle = i % 2 === 0 ? '#6B4423' : '#5C3A1A';
        ctx.fillRect(room.x, floorY - plankHeight, room.width, plankHeight);
    }

    ctx.strokeStyle = '#4a2e14';
    ctx.lineWidth = 1;
    const plankWidth = 60;
    for (let px = room.x; px < room.x + room.width; px += plankWidth) {
        ctx.beginPath();
        ctx.moveTo(px, floorY - plankHeight);
        ctx.lineTo(px, floorY);
        ctx.stroke();
    }

    ctx.strokeStyle = '#3a3c4a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(room.x + room.width, ceilY);
    ctx.lineTo(room.x + room.width, floorY);
    ctx.stroke();

    ctx.fillStyle = '#A8AAB5';
    ctx.font = '10px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(room.name, room.x + 8, ceilY + 20);
}

function drawWindow(x) {
    const ceilY = getCeilY();
    const windowW = 36;
    const windowH = 50;
    const windowY = ceilY + 30;

    ctx.fillStyle = '#3a3c4a';
    ctx.fillRect(x - windowW / 2 - 3, windowY - 3, windowW + 6, windowH + 6);

    ctx.fillStyle = '#1a2a4a';
    ctx.fillRect(x - windowW / 2, windowY, windowW, windowH);

    ctx.strokeStyle = '#3a3c4a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, windowY);
    ctx.lineTo(x, windowY + windowH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - windowW / 2, windowY + windowH / 2);
    ctx.lineTo(x + windowW / 2, windowY + windowH / 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    [[x - 8, windowY + 10], [x + 6, windowY + 20], [x - 4, windowY + 35]].forEach(([screenX, sy]) => {
        ctx.beginPath();
        ctx.arc(screenX, sy, 1, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawDesk(desk) {
    const deskW = 54;
    const deskH = 10;
    const legH = 18;
    const deskY = desk.y - legH - deskH;

    ctx.fillStyle = '#4a3c2a';
    ctx.fillRect(desk.x - deskW / 2 + 4, deskY + deskH, 6, legH);
    ctx.fillRect(desk.x + deskW / 2 - 10, deskY + deskH, 6, legH);

    ctx.fillStyle = '#7a5c3a';
    ctx.fillRect(desk.x - deskW / 2, deskY, deskW, deskH);

    ctx.fillStyle = '#2A2C36';
    ctx.fillRect(desk.x - 4, deskY - 2, 8, 4);

    ctx.fillStyle = '#3a3c4a';
    ctx.fillRect(desk.x - 2, deskY - 18, 4, 16);

    ctx.fillStyle = '#1E1F26';
    ctx.fillRect(desk.x - 14, deskY - 36, 28, 20);

    ctx.fillStyle = '#1a3a6a';
    ctx.fillRect(desk.x - 12, deskY - 34, 24, 16);

    ctx.fillStyle = '#3A86FF';
    ctx.fillRect(desk.x - 10, deskY - 31, 16, 2);
    ctx.fillStyle = '#2a6aaa';
    ctx.fillRect(desk.x - 10, deskY - 27, 10, 2);
    ctx.fillRect(desk.x - 10, deskY - 23, 13, 2);
}

function drawEmployee(emp) {
    const floorY = getFloorY();
    const groundY = floorY - 10;
    const baseColor = ROLE_COLOR[emp.role];

    const bodyW = 12;
    const bodyH = 22;
    const headR = 6;
    const legH = 10;

    const dir = emp.facingRight ? 1 : -1;

    const fade = 0.4 + (emp.energy / 100) * 0.6;
    function fadedColor(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${fade})`;
    }

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(emp.x, groundY + 2, 10, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(58,60,74,${fade})`;
    if (!emp.working) {
        ctx.fillRect(emp.x - 4, groundY - legH, 5, legH);
        ctx.fillRect(emp.x + 1, groundY - legH - 2, 5, legH);
    } else {
        ctx.fillRect(emp.x - 4, groundY - legH, 5, legH);
        ctx.fillRect(emp.x + 1, groundY - legH, 5, legH);
    }

    ctx.fillStyle = fadedColor(baseColor);
    ctx.fillRect(emp.x - bodyW / 2, groundY - legH - bodyH, bodyW, bodyH);

    if ( emp.working) {
        ctx.fillStyle = fadedColor(baseColor);
        ctx.fillRect(emp.x + dir * (bodyW / 2), groundY - legH - bodyH + 6, dir * 10, 4);
    }

    ctx.fillStyle = `rgba(234,234,240,${fade})`;
    ctx.beginPath();
    ctx.arc(emp.x, groundY - legH - bodyH - headR, headR, 0, Math.PI * 2);
    ctx.fill();

    const indicatorY = groundY - legH - bodyH - headR * 2 - 6;
    if (emp.motivation < 30) {
        ctx.font = '11px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('😤', emp.x, indicatorY);
    } else if (emp.energy < 30) {
        ctx.font = '11px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('😴', emp.x, indicatorY);
    } else if (emp.working) {
        ctx.font = '10px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('💻', emp.x, indicatorY);
    }

    ctx.fillStyle = `rgba(168,170,181,${fade})`;
    ctx.font = '8px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(emp.role, emp.x, indicatorY - 10);
    ctx.textAlign = 'left';
}


function updateEmployees() {
    state.employees.forEach(emp => {
        const dx = emp.targetX - emp.x;
        emp.facingRight = dx > 0;

        if (Math.abs(dx) > 2) {
            emp.x += Math.sign(dx) * emp.speed;
            emp.working = false;
        } else {
            if (emp.idleTimer > 0) {
                emp.idleTimer--;
            } else {
                if (emp.working) {
                    emp.workTimer--;
                    if (emp.workTimer <= 0) {
                        emp.working = false;
                        emp.idleTimer = 80 + Math.random() * 100;
                        emp.targetX = emp.deskX + (Math.random() * 80 - 40);
                    }
                } else {
                    emp.working = true;
                    emp.workTimer = 200 + Math.random() * 200;
                    emp.targetX = emp.deskX;
                }
            }
        }
    });
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#1E1F26';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const rooms = getRoom();
    rooms.forEach(room => drawRoom(room));

    drawWindow(canvas.width * 0.15);
    drawWindow(canvas.width * 0.58);

    const desks = getDesks();
    desks.forEach(desk => drawDesk(desk));

    state.employees.forEach(emp => drawEmployee(emp));
}

let gameSpeed = 0;
let paused = true;

document.getElementById('btn-pause').addEventListener('click', () => setSpeed(0));
document.getElementById('btn-1x').addEventListener('click', () => setSpeed(1));
document.getElementById('btn-2x').addEventListener('click', () => setSpeed(2));
document.getElementById('btn-3x').addEventListener('click', () => setSpeed(3));

function setSpeed(speed) {
    gameSpeed = speed;
    paused = speed === 0;
    document.querySelectorAll('.speed-btn').forEach(btn => btn.classList.remove('active'));
    const ids = ['btn-pause', 'btn-1x', 'btn-2x', 'btn-3x'];
    document.getElementById(ids[speed]).classList.add('active');
}

const WEEK_FRAMES = 900;
let tickCounter = 0;
let weekProgress = 0;

function gameTick() {
    state.employees.forEach(emp => {
        if (emp.working) {
            emp.energy = Math.max(0, emp.energy - 3);
        } else {
            emp.energy = Math.min(100, emp.energy + 1);
        }
        if (emp.energy < 50) {
            emp.motivation = Math.max(0, emp.motivation - 2);
        }
        emp.motivation = Math.max(0, emp.motivation - 1);
        emp.speed = 0.3 + (emp.energy / 100) * 0.7;
    });

    const count = state.employees.length;
    state.team.energy = Math.round(state.employees.reduce((s, e) => s + e.energy, 0) / count);
    state.team.motivation = Math.round(state.employees.reduce((s, e) => s + e.motivation, 0) / count);

    document.getElementById('energy').textContent = state.team.energy;
    document.getElementById('motivation').textContent = state.team.motivation;

    if (!state.eventActive) {
        const event = rollEvent();
        if (event) {
            state.eventActive = true;
            setSpeed(0);
            showEvent(event);
        }
    }
}

function showEvent(event) {
    const modal = document.getElementById('event-modal');
    const title = document.getElementById('event-modal-title');
    const text = document.getElementById('event-modal-text');
    const choices = document.getElementById('event-modal-choices');

    title.textContent = `⚡ Event — Week ${state.week}`;
    text.textContent = event.text;
    choices.innerHTML = '';

    event.choices.forEach((c, i) => {
        const btn = document.createElement('button');
        btn.className = 'action-btn';
        btn.textContent = c.label;
        btn.addEventListener('click', () => {
            c.effect();
            modal.classList.add('hidden');
            setTimeout(() => {
                state.eventActive = false;
                document.getElementById('event-box').innerHTML = 'Awaiting decisions...';
                setSpeed(1);
            }, 2000);
        });
        choices.appendChild(btn);
    });

    modal.classList.remove('hidden');
}

function advanceWeek() {
    state.week++;

    const baseRevenue = 2000;
    const featureBonus = state.product.features * 200;
    const stabilityMultiplier = state.product.stability / 100;
    const reputationMultiplier = state.reputation / 100;
    const revenue = Math.round((baseRevenue + featureBonus) * stabilityMultiplier * reputationMultiplier);
    const costs = state.employees.length * 800;
    const profit = revenue - costs;
    state.money += profit;
    showMoneyFloat(profit, 'money');

    const avgMotivation = state.team.motivation;
    const newBugs = avgMotivation < 70 ? 4 : avgMotivation < 85 ? 2 : 1;
    state.product.bugs += newBugs;
    state.product.stability = Math.max(0, 100 - state.product.bugs * 2);

    if (state.product.stability < 50) {
        state.reputation = Math.max(0, state.reputation - 2);
    } else if (state.product.stability > 80) {
        state.reputation = Math.min(100, state.reputation + 1);
    }

    document.getElementById('week').textContent = state.week;
    document.getElementById('money').textContent = '$' + state.money.toLocaleString();
    document.getElementById('reputation').textContent = state.reputation;
    document.getElementById('bugs').textContent = state.product.bugs;
    document.getElementById('stability').textContent = state.product.stability;

    if (state.money <= 0) {
        setSpeed(0);
        showMessage('💸 Bankruptcy. The company collapsed.');
        return;
    }
    if (state.reputation <= 0) {
        setSpeed(0);
        showMessage('💀 Reputation destroyed. Nobody trusts you anymore.');
        return;
    }

    setSpeed(0);
    showWeeklySummary(revenue, costs);
}

function showWeeklySummary(revenue, costs) {
    const profit = revenue - costs;
    const profitColor = profit >= 0 ? 'var(--good)' : 'var(--danger)';
    const box = document.getElementById('event-box');

    box.innerHTML = `
        <div style="color: var(--accent); font-weight: bold; margin-bottom: 10px;">
            📅 Week ${state.week} Summary
        </div>
        <div class="stat-row">Revenue <span style="color: var(--good)">+$${revenue.toLocaleString()}</span></div>
        <div class="stat-row">Costs <span style="color: var(--danger)">-$${costs.toLocaleString()}</span></div>
        <div class="stat-row">Profit <span style="color: ${profitColor}">$${profit.toLocaleString()}</span></div>
        <div class="stat-row" style="margin-top: 8px;">Bugs <span>${state.product.bugs}</span></div>
        <div class="stat-row">Stability <span>${state.product.stability}</span></div>
        <div style="margin-top: 12px;">
            <button class="action-btn" id="btn-continue">▶ Continue to Week ${state.week + 1}</button>
        </div>
    `;
    document.getElementById('btn-continue').addEventListener('click', () => {
        box.innerHTML = 'Awaiting decisions...';
        setSpeed(1);
    });
}

const EVENTS = [
    {
        id: 'buggy_release',
        text: '⚠️A dev pulls you aside before the weekly release: "We have 5+ unresolved bugs. If we ship now, clients will notice. Do we delay?"',
        choices: [
            {
                label: '🚀 Ship it anyway.',
                effect: () => {
                    state.reputation = Math.max(0, state.reputation - 10);
                    state.product.bugs += 2;
                    showMoneyFloat(0, 'money');
                    showMessage('Shipped with bugs. Reputation took a hit.');
                }
            },
            {
                label: '🔧 Delay and fix bugs',
                effect: () => {
                    state.product.bugs = Math.max(0, state.product.bugs - 3);
                    state.money -= 1000;
                    showMoneyFloat(-1000, 'money');
                    showMessage('Delayed release. Bugs fixed but missed revenue.');
                }
            },
            {
                label: '⚡ Crunch the team overnight',
                effect: () => {
                    state.product.bugs = Math.max(0, state.product.bugs - 2);
                    state.employees.forEach(emp => {
                        emp.energy = Math.max(0, emp.energy - 30);
                        emp.motivation = Math.max(0, emp.motivation - 20);
                    });
                    showMoneyFloat(0, 'money');
                    showMessage('Bugs reduced but team is exhausted.');
                }
            }
        ]
    },
    {
        id: 'team_burnout',
        text: '😤 The team is visibly struggling. Motivation is critically low. A manager warns: "People are close to quitting.',
        choices: [
            {
                label: '💰 Give everyone a bonus',
                effect: () => {
                    state.money -= 2000;
                    state.employees.forEach(emp => {
                        emp.motivation = Math.min(100, emp.motivation + 30);
                    });
                    showMoneyFloat(-2000, 'money');
                    showMessage('Bonuses paid. Team morale recovered.');
                }
            },
            {
                label: '🏖️ Force a rest week',
                effect: () => {
                    state.employees.forEach(emp => {
                        emp.energy = Math.min(100, emp.energy + 40);
                        emp.motivation = Math.min(100, emp.motivation + 20);
                    });
                    state.money -= 500;
                    showMoneyFloat(-500, 'money');
                    showMessage('Rest week taken. Team recovered.');
                }
            },
            {
                label: '😤 Push through it',
                effect: () => {
                    state.employees.forEach(emp => {
                        emp.motivation = Math.max(0, emp.motivation - 15);
                    });
                    showMessage('Team pushed harder. Motivation dropped further.');
                }
            }
        ]
    }
];

function rollEvent() {
    if (state.product.bugs >= 5 && Math.random() < 0.15) {
        return EVENTS.find(e => e.id === 'buggy_release');
    }
    if (state.team.motivation < 40 && Math.random() < 0.15) {
        return EVENTS.find(e => e.id === 'team_burnout');
    }
    return null;
}

function gameLoop() {
    if (!paused) {
        for (let i = 0; i < gameSpeed; i++) {
            updateEmployees();

            tickCounter++;
            weekProgress++;

            if (tickCounter % 180 === 0) {
                gameTick();
            }

            if (weekProgress >= WEEK_FRAMES) {
                weekProgress = 0;
                advanceWeek();
            }
        }
    }

    render();
    requestAnimationFrame(gameLoop);
}

function saveGame() {
    const save = {
        week: state.week,
        money: state.money,
        reputation: state.reputation,
        team: state.team,
        product: state.product,
        employees: state.employees.map(emp => ({
            id: emp.id,
            role: emp.role,
            x: emp.x,
            deskX: emp.deskX,
            targetX: emp.targetX,
            energy: emp.energy,
            motivation: emp.motivation,
            working: emp.working,
            workTimer: emp.workTimer,
            idleTimer: emp.idleTimer,
            facingRight: emp.facingRight,
            speed: emp.speed,
        }))
    };
    localStorage.setItem('deadlineCollapse_save', JSON.stringify(save));
    showMessage('💾 Game saved.');
}



function loadGame() {
    const raw = localStorage.getItem('deadlineCollapse_save');
    if (!raw) return false;

    const save = JSON.parse(raw);
    state.week = save.week;
    state.money = save.money;
    state.reputation = save.reputation;
    state.team = save.team;
    state.product = save.product;
    state.employees = save.employees;

    document.getElementById('week').textContent = state.week;
    document.getElementById('money').textContent = '$' + state.money.toLocaleString();
    document.getElementById('reputation').textContent = state.reputation;
    document.getElementById('energy').textContent = state.team.energy;
    document.getElementById('motivation').textContent = state.team.motivation;
    document.getElementById('bugs').textContent = state.product.bugs;
    document.getElementById('stability').textContent = state.product.stability;
    document.getElementById('features').textContent = state.product.features;

    return true;
}

function showMoneyFloat(amount, anchorElementId) {
    const anchor = document.getElementById(anchorElementId);
    const rect = anchor.getBoundingClientRect();

    const el = document.createElement('div');
    el.className = 'money-float';
    el.textContent = amount > 0 ? `$${amount.toLocaleString()}` : `-$${Math.abs(amount).toLocaleString()}`;
    el.style.color = amount > 0 ? 'var(--good)' : 'var(--danger)';
    el.style.left = rect.left + 'px';
    el.style.top = rect.bottom + 4 + 'px';

    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
}

document.getElementById('btn-save').addEventListener('click', saveGame);
const loaded = loadGame();
if (!loaded) {
    showMessage('New game started. Good luck.');
}

gameLoop();

canvas.addEventListener('click', function(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const floorY = getFloorY();
    const groundY = floorY - 10;
    const bodyH = 22;
    const legH = 10;
    const headR = 6;

    const topY = groundY - legH - bodyH - headR * 2 - 14;
    const bottomY = groundY;

    let clicked = null;
    state.employees.forEach(emp => {
        if (
            mouseX >= emp.x - 12 &&
            mouseX <= emp.x + 12 &&
            mouseY >= topY &&
            mouseY <= bottomY
        ) {
            clicked = emp;
        }
    });

    if (clicked) {
        showEmployeePanel(clicked);
    } else {
        hideEmployeePanel();
    }
});

function showEmployeePanel(emp) {
    const box = document.getElementById('event-box');
    const statusText = emp.working ? '💻 Working' : '🚶 Idle';

    const energyColor = emp.energy > 60 ? 'var(--good)' : emp.energy > 30 ? 'var(--warn)' : 'var(--danger)';
    const motivationColor = emp.motivation > 60 ? 'var(--good)' : emp.motivation > 30 ? 'var(--warn)' : 'var(--danger)';

    box.innerHTML = `
        <div style="color: var(--accent); font-weight: bold; margin-bottom: 8px;">
            ${emp.role} #${emp.id + 1}
        </div>
        <div class="stat-row">Status <span>${statusText}</span></div>
        <div class="stat-row">Energy <span style="color: ${energyColor}">${emp.energy}</span></div>
        <div class="stat-row">Motivation <span style="color: ${motivationColor}">${emp.motivation}</span></div>
        <div style="margin-top: 12px; color: var(--text-sec); font-size: 0.75rem;">
            Click elsewhere to close
        </div>
    `;
}

function hideEmployeePanel() {
    document.getElementById('event-box').innerHTML = 'Awaiting decisions...';
}

document.getElementById('btn-hire').addEventListener('click', function() {
    if (state.money < 1500) {
        showMessage('Not enough money to hire.');
        return;
    }
    if (state.employees.length >= 6) {
        showMessage('No more desk space. Expand first.')
        return;
    }

    state.money -= 1500;
    showMoneyFloat(-1500, 'money');
    const id = state.employees.length;
    const newEmp = createEmployee(id);
    newEmp.energy = 100;
    newEmp.motivation = 100;
    state.employees.push(newEmp);

    document.getElementById('money').textContent = '$' + state.money.toLocaleString();
    document.getElementById('employees').textContent = state.employees.length;
    showMessage(`👤 New ${newEmp.role} hired!`);
});

document.getElementById('btn-fix-bugs').addEventListener('click', function() {
    if (state.money < 800) {
        showMessage('Not enough money to fix bugs.');
        return;
    }
    if (state.product.bugs === 0) {
        showMessage('No bugs to fix.');
        return;
    }

    state.money -= 800;
    showMoneyFloat(-800, 'money');
    const fixed = Math.min(state.product.bugs, 3);
    state.product.bugs -= fixed;
    state.product.stability = Math.max(0, 100 - state.product.bugs * 2);

    document.getElementById('money').textContent = '$' + state.money.toLocaleString();
    document.getElementById('bugs').textContent = state.product.bugs;
    document.getElementById('stability').textContent = state.product.stability;

    showMessage(`🔧 Fixed ${fixed} bugs. Stability ${state.product.stability}`);
});

document.getElementById('btn-rest').addEventListener('click', function() {
    if (state.money < 500) {
        showMessage('Not enough money for a team break.');
        return;
    }
    state.money -= 500;
    showMoneyFloat(-500, 'money');
    state.employees.forEach(emp => {
        emp.energy = Math.min(100, emp.energy + 30);
        emp.motivation = Math.min(100, emp.motivation + 10);
        emp.working = false;
        emp.idleTimer = 300;
    });
    document.getElementById('money').textContent = '$' + state.money.toLocaleString();
    showMessage('Team took a break. Energy restored.');
});

function showMessage(text) {
    const box = document.getElementById('event-box');
    box.innerHTML = `<span style="color: var(--accent)">${text}</span>`;
    setTimeout(() => {
        box.innerHTML = 'Awaiting decisions...';
    }, 3000);
}