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
    eventActive: false,
    researchPoints: 0,
    project: null,
    unlockedFeatures: []
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
        { x: w * 0.08, y: floorY, room: 'Dev' },
        { x: w * 0.22, y: floorY, room: 'Dev' },
        { x: w * 0.36, y: floorY, room: 'Dev' },
        { x: w * 0.54, y: floorY, room: 'Designer' },
        { x: w * 0.65, y: floorY, room: 'Designer' },
        { x: w * 0.82, y: floorY, room: 'Manager' },
    ];
}

function createEmployee(id, role) {
    const desks = getDesks();
    const roleToRoom = { 'Dev': 'Dev', 'Designer': 'Designer', 'Manager': 'Manager' };
    const targetRoom = roleToRoom[role || ROLES[id % ROLES.length]];
    const matching = desks.filter(d => d.room === targetRoom);
    const occupied = state.employees.map(e => e.deskX);
    const free = matching.filter(d => !occupied.includes(d.x));
    const assignedDesk = free.length > 0 ? free[0] : matching[0];

    return {
        id,
        role: role || ROLES[id % ROLES.length],
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

const ROLES = ['Dev', 'Dev', 'Designer', 'Designer', 'Manager', 'Manager'];
const ROLE_COLOR = {
    'Dev': '#3A86FF',
    'Designer': '#FF7043',
    'Manager': '#4CAF50'
};

const INITIAL_ROLES = ['Dev', 'Dev', 'Designer'];
for (let i = 0; i < 3; i++) {
    state.employees.push(createEmployee(i, INITIAL_ROLES[i]));
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
    const desks = getDesks();
    state.employees.forEach(emp => {
        const dx = emp.targetX - emp.x;
        emp.facingRight = dx > 0;

        const roomDesks = desks.filter(d => d.room === emp.role);
        const minX = Math.min(...roomDesks.map(d => d.x)) - 40;
        const maxX = Math.max(...roomDesks.map(d => d.x)) + 40;

        if (Math.abs(dx) > 2) {
            emp.x += Math.sign(dx) * emp.speed;
            emp.x = Math.max(minX, Math.min(maxX, emp.x));
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
                        emp.targetX = Math.max(minX, Math.min(maxX, emp.deskX + (Math.random() * 80 - 40)));
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

        if (emp.skills) {
            if (emp.role === 'Dev' && emp.working) {
                if (emp.skills.bugFix && Math.random() < 0.05 * emp.skills.bugFix) {
                    state.product.bugs = Math.max(0, state.product.bugs - 1);
                }
            }
            if (emp.role === 'Designer') {
                if (emp.skills.motivationAura && emp.skills.motivationAura > 0) {
                    state.employees.forEach(other => {
                        if (other.id !== emp.id) {
                            other.motivation = Math.min(100, other.motivation + 0.05 * emp.skills.motivationAura);
                        }
                    });
                }
            }
            if (emp.role === 'Manager') {
                if (emp.skills.motivationBonus && emp.working) {
                    state.employees.forEach(other => {
                        if (other.role !== 'Manager') {
                            other.motivation = Math.min(100, other.motivation + 0.1 * emp.skills.motivationBonus);
                        }
                    });
                }
            }
        }
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
    const featureBonus = (state.product.features || 0) * 200;
    const stabilityMultiplier = (state.product.stability || 100) / 100;
    const reputationMultiplier = (state.reputation || 100) / 100;
    const revenue = Math.round((baseRevenue + featureBonus) * stabilityMultiplier * reputationMultiplier) || 0;
    const costs = (state.employees.length || 0) * 800;
    const profit = Number(revenue) - Number(costs);
    state.money = Number(state.money || 10000) + profit;
    console.log('Week calc:', {week: state.week, revenue, costs, profit, money: state.money});
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

    if (state.project) {
        state.project.weeksInDev++;
        state.product.bugs += state.project.bugRisk * 0.5;
        updateProjectPanel();
    }

    state.employees.forEach(emp => {
        if (!emp.skills) return;
        if (emp.role === 'Designer' && emp.skills.reputationBonus) {
            state.reputation = Math.min(100, state.reputation + emp.skills.reputationBonus * 0.5);
        }
        if (emp.role === 'Manager' && emp.skills.costReduction) {

        }
    });

    const rpGained = Math.floor(
        state.employees
            .filter(e => e.role === 'Dev')
            .reduce((sum, e) => sum + 0.5 + (e.skills?.researchBonus || 0), 0) + 1
    );
    state.researchPoints += rpGained;
    document.getElementById('research').textContent = state.researchPoints;

    showWeeklySummary(revenue, costs);
}

const rpGained = Math.floor(state.employees.filter(e => e.role === 'Dev').length * 0.5 + 1);
state.researchPoints += rpGained;
document.getElementById('research').textContent = state.researchPoints;

function showWeeklySummary(revenue, costs) {
    const profit = revenue - costs;
    const profitColor = profit >= 0 ? 'var(--good)' : 'var(--danger)';
    const profitSign = profit >= 0 ? '+' : '';

    let titleColor = 'var(--good)';
    let titleText = `📅 Week ${state.week} - Holding steady`;
    if (state.money < 3000 || state.reputation < 40) {
        titleColor = 'var(--danger)';
        titleText = `📅 Week ${state.week} - Things are bad`;
    } else if (profit < 0 || state.product.bugs > 10) {
        titleColor = 'var(--warn)';
        titleText = `📅 Week ${state.week} - Watch out`;
    }

    const modal = document.getElementById('summary-modal');
    const title = document.getElementById('summary-modal-title');
    const body = document.getElementById('summary-modal-body');
    const btn = document.getElementById('summary-continue');

    title.style.color = titleColor;
    title.textContent = titleText;

    body.innerHTML = `
    <div class="summary-row">Revenue <span style="color: var(--good)">+$${revenue.toLocaleString()}</span></div>
    <div class="summary-row">Salaries <span style="color: var(--danger)">-$${costs.toLocaleString()}</span></div>
    <div class="summary-row">Net <span style="color: ${profitColor}">${profitSign}$${profit.toLocaleString()}</span></div>
    <hr class="summary-divider">
    <div class="summary-row">Cash <span>$${state.money.toLocaleString()}</span></div>
    <div class="summary-row">Reputation <span>${state.reputation}</span></div>
    <hr class="summary-divider">
    <div class="summary-row">Bugs <span style="color: ${state.product.bugs > 10 ? 'var(--danger)' : state.product.bugs > 5 ? 'var(--warn)' : 'var(--good)'}">${state.product.bugs}</span></div>
    <div class="summary-row">Stability <span style="color: ${state.product.stability < 50 ? 'var(--danger)' : state.product.stability < 75 ? 'var(--warn)' : 'var(--good)'}">${state.product.stability}%</span></div>
    <div class="summary-row">Features <span>${state.product.features}</span></div>
    <hr class="summary-divider">
    <div class="summary-row">Team Energy <span style="color: ${state.team.energy < 30 ? 'var(--danger)' : state.team.energy < 60 ? 'var(--warn)' : 'var(--good)'}">${state.team.energy}</span></div>
    <div class="summary-row">Motivation <span style="color: ${state.team.motivation < 30 ? 'var(--danger)' : state.team.motivation < 60 ? 'var(--warn)' : 'var(--good)'}">${state.team.motivation}</span></div>
    `;
    
    btn.textContent = `▶ Continue to Week ${state.week + 1}`;
    btn.onclick = () => {
        modal.classList.add('hidden');
        document.getElementById('event-box').innerHTML = 'Awaiting decisions...';
        setSpeed(1);
    };

    modal.classList.remove('hidden');
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
    },
    {
        id: 'investor_pressure',
        text: '📈 An investor calls: "We expected more growth this quarter. We need to see results or we\'re pulling funding. What\'s your plan?"', 
        choices: [
            {
                label: '🚀 Promise a big release next week',
                effect: () => {
                    state.product.bugs += 4;
                    state.employees.forEach(emp => {
                        emp.energy = Math.max(0, emp.energy - 20);
                        emp.motivation =Math.max(0, emp.motivation - 10);
                    });
                    showMessage('Promised a big release. Team under pressure.');
                }
            },
            {
                label: '📊 Show current metrics honestly',
                effect: () => {
                    state.reputation = Math.max(0, state.reputation - 5);
                    showMessage('Investor unhappy but respected the honesty.');
                }
            },
            {
                label: '💰 Offer equity to keep them calm',
                effect: () => {
                    state.money -= 3000;
                    showMoneyFloat(-3000, 'money');
                    showMessage('Investor satisfied. Cost you $3,000 in concessions.');
                }
            }
        ]
    },
    {
        id: 'key_dev_quits',
        text: '😰 Your best Dev sends a resignation email: "I\'ve been offered a better position. My last day is Friday. Sorry."',
        choices: [
            {
                label: '💸 Counter-offer with a raise',
                effect: () => {
                    state.money -= 2500;
                    showMoneyFloat(-2500, 'money');
                    state.employees.forEach(emp => {
                        if (emp.role === 'Dev') emp.motivation = Math.min(100, emp.motivation + 20);
                    });
                    showMessage('Dev stayed. Cost you $2,500 but kept the knowledge.');
                }
            },
            {
                label: '👋 Let them go and hire new',
                effect: () => {
                    state.money -= 1500;
                    showMoneyFloat(-1500, 'money');
                    state.product.bugs += 3;
                    showMessage('Dev left. Bugs increased during transition.');
                }
            },
            {
                label: '😤 Guilt-trip them into staying',
                effect: () => {
                    state.employees.forEach(emp => {
                        emp.motivation = Math.max(0, emp.motivation - 10);
                    });
                    showMessage('Dev stayed... resentfully. Team morale dropped.');
                }
            }
        ]
    },
    {
        id: 'server_crash',
        text: '🔥 The production server crashed. Clients are reporting outages. The team is scrambling. What do you do?',
        choices: [
            {
                label: '⚡ All hands on deck - fix it now',
                effect: () => {
                    state.employees.forEach(emp => {
                        emp.energy = Math.max(0, emp.energy - 40);
                        emp.motivation = Math.max(0, emp.motivation - 15);
                    });
                    state.reputation = Math.min(100, state.reputation + 5);
                    showMessage('Server fixed fast. Team exhausted but reputation held.');
                }
            },
            {
                label: '📧 Send clients an apology email',
                effect: () => {
                    state.reputation = Math.max(0, state.reputation - 8);
                    showMessage('Clients acknowledged. Reputation took a hit.');
                }
            },
            {
                label: '💰 Hire emergency contractors',
                effect: () => {
                    state.money -= 2000;
                    showMoneyFloat(-2000, 'money');
                    state.reputation = Math.max(0, state.reputation - 3);
                    showMessage('Contractors fixed it. Expensive but team spared.');
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
    if (state.week > 5 && Math.random() < 0.08) {
        return EVENTS.find(e => e.id === 'investor_pressure');
    }
    if (state.team.motivation < 60 && Math.random() < 0.06) {
        return EVENTS.find(e => e.id === 'key_dev_quits');
    }
    if (state.product.stability < 60 && Math.random() < 0.08) {
        return EVENTS.find(e => e.id === 'server_crash');
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
        document.getElementById('week-progress-bar').style.width = ((weekProgress / WEEK_FRAMES * 100) + '%');
    }

    render();
    requestAnimationFrame(gameLoop);
}

function saveGame() {
    if (isNaN(state.money) || isNaN(state.reputation)) {
        console.warn('Save skipped: NaN in state');
        return;
    }
    const save = {
        week: Number(state.week) || 1,
        money: Number(state.money),
        reputation: Number(state.reputation),
        team: state.team || {energy:100, motivation:100},
        product: state.product || {bugs:0, features:0, stability:100},
        employees: (state.employees || []).map(emp => ({
            id: emp.id,
            role: emp.role || 'Dev',
            x: Number(emp.x) || 0,
            deskX: Number(emp.deskX) || 0,
            targetX: Number(emp.targetX) || 0,
            energy: Number(emp.energy) || 100,
            motivation: Number(emp.motivation) || 100,
            working: !!emp.working,
            workTimer: Number(emp.workTimer) || 0,
            idleTimer: Number(emp.idleTimer) || 0,
            facingRight: !!emp.facingRight,
            speed: Number(emp.speed) || 1,
        }))
    };
    localStorage.setItem('deadlineCollapse_save', JSON.stringify(save));
    showMessage('💾 Game saved.');
}



function loadGame() {
    const raw = localStorage.getItem('deadlineCollapse_save');
    if (!raw) return false;

    try {
        const save = JSON.parse(raw);
        state.week = Number(save.week) || 1;
        state.money = Number(save.money) || 10000;
        if (isNaN(state.money)) state.money = 10000;
        state.reputation = Number(save.reputation) || 100;
        if (isNaN(state.reputation)) state.reputation = 100;
        state.team = save.team || {energy:100, motivation:100};
        state.product = save.product || {bugs:0, features:0, stability:100};
        state.employees = save.employees || [];

        // Update UI
        document.getElementById('week').textContent = state.week;
        document.getElementById('money').textContent = '$' + state.money.toLocaleString();
        document.getElementById('reputation').textContent = state.reputation;
        document.getElementById('energy').textContent = state.team.energy;
        document.getElementById('motivation').textContent = state.team.motivation;
        document.getElementById('bugs').textContent = state.product.bugs;
        document.getElementById('stability').textContent = state.product.stability;
        document.getElementById('features').textContent = state.product.features;

        console.log('Loaded state:', {money: state.money, reputation: state.reputation});
        return true;
    } catch (e) {
        console.error('Load failed:', e);
        localStorage.removeItem('deadlineCollapse_save');
        return false;
    }
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

const ALL_FEATURES = [
    { id: 'auth', name: 'User Authentication', desc: 'Login/signup system', rpCost: 0, revenueBonus: 300, bigRisk: 1 },
    { id: 'dashboard', name: 'Analytics Dashboard', desc: 'Usage stats for clients', rpCost: 0, revenueBonus: 400, bugRisk: 2 },
    { id: 'api', name: 'Public API', desc: 'Let clients integrate', rpCost: 3, revenueBonus: 600, bugRisk: 3 },
    { id: 'mobile', name: 'Mobile Support', desc: 'iOS and Android ready', rpCost: 5, revenueBonus: 800, bugRisk: 4 },
    { id: 'ai', name: 'AI Integration', desc: 'Smart recommendations', rpCost: 8, revenueBonus: 1200, bugRisk: 5 },
    { id: 'offline', name: 'Offline Mode', desc: 'Works without internet', rpCost: 4, revenueBonus: 500, bugRisk: 3 },
    { id: 'collab', name: 'Real-time Collaboration', desc: 'Multiple users at once', rpCost: 6, revenueBonus: 900, bugRisk: 4 },
];

function openProjectModal() {
    if (state.project) {
        showMessage('Already working on a project. Ship it first.');
        return;
    }

    const modal = document.getElementById('project-modal');
    const featureList = document.getElementById('feature-list');
    featureList.innerHTML = '';

    ALL_FEATURES.forEach(f => {
        const unlocked = f.rpCost === 0 || state.researchPoints >= f.rpCost || state.unlockedFeatures.includes(f.id);
        const div = document.createElement('div');
        div.className = 'feature-option' + (unlocked ? '' : ' locked');
        div.dataset.id = f.id;
        div.innerHTML = `
        <input type="checkbox" ${unlocked ? '' : 'disabled'} data-id="${f.id}">
        <div>
            <div style="font-weight: bold; color: var(--text)">${f.name}</div>
            <div style="font-size: 0.75rem">${f.desc}</div>
        </div>
        <div class="rp-cost">${f.rpCost > 0 && !state.unlockedFeatures.includes(f.id) ? `🔬 ${f.rpCost} RP to unlock` : `+$${f.revenueBonus}/week`}</div>
        `;

        if (unlocked) {
            div.addEventListener('click', () => {
                const cb = div.querySelector('input[type="checkbox"]');
                const selected = featureList.querySelectorAll('input:checked').length;
                if (!cb.checked && selected >= 3) {
                    showMessage('Maximum 3 features per project.');
                    return;
                }
                cb.checked = !cb.checked;
                div.classList.toggle('selected', cb.checked);
            });
        }

        featureList.appendChild(div);
    });

    modal.classList.remove('hidden');
}

document.getElementById('btn-cancel-project').addEventListener('click', () => {
    document.getElementById('project-modal').classList.add('hidden');
    resetProjectModal();
});

document.getElementById('btn-start-project').addEventListener('click', () => {
    const name = document.getElementById('project-name').value.trim();
    const desc = document.getElementById('project-desc').value.trim();

    if (!name) {
        showMessage('Give your project a name.');
        return;
    }

    const selectedFeatures = [];
    let totalBugRisk = 0;
    let totalRevenueBonus = 0;

    document.querySelectorAll('#feature-list input:checked').forEach(cb => {
        const f = ALL_FEATURES.find(f => f.id === cb.dataset.id);
        if (f) {
            selectedFeatures.push(f);
            totalBugRisk += f.bugRisk;
            totalRevenueBonus += f.revenueBonus;

            if (f.rpCost > 0 && !state.unlockedFeatures.includes(f.id)) {
                state.researchPoints -= f.rpCost;
                state.unlockedFeatures.push(f.id);
                document.getElementById('research').textContent = state.researchPoints;
            }
        }
    });

    state.project = {
        name,
        desc,
        features: selectedFeatures,
        bugRisk: totalBugRisk,
        revenueBonus: totalRevenueBonus,
        weeksInDev: 0,
    };

    document.getElementById('project-modal').classList.add('hidden');
    document.getElementById('project-name').value = '';
    document.getElementById('project-desc').value = '';

    showMessage(`🚀 Project "${name}" started! Ship when ready.`);
    updateProjectPanel();
});

function updateProjectPanel() {
    const panel = document.getElementById('project-panel');
    const info = document.getElementById('project-info');

    if (!state.project) {
        panel.classList.add('hidden');
        return;
    }

    panel.classList.remove('hidden');
    const p = state.project;

    info.innerHTML = `
    <div style="color: var(--accent); font-weight: bold; margin-bottom: 6px;">📦 ${p.name}</div>
    <div style="color: var(--text-sec); font-size: 0.75rem; margin-bottom: 8px;">${p.desc}</div>
    ${p.features.map(f => `<div class="stat-row">${f.name} <span style="color: var(--good)">+$${f.revenueBonus}</span></div>`).join('')}
    <div class="stat-row" style="margin-top: 6px;">In dev <span>${p.weeksInDev}w</span></div>
    <div class="stat-row">Bug risk <span style="color: var(--warn)">${p.bugRisk}</span></div>
    <button class="action-btn" id="btn-ship" style="margin-top: 10px;">🚢 Ship Project</button>
    `;

    document.getElementById('btn-ship').addEventListener('click', shipProject);
}

function shipProject() {
    const p = state.project;
    if (!p) return;

    const bugPenalty = state.product.bugs * 3;
    const stabilityBonus = state.product.stability;
    const reputationBonus = state.reputation;
    const score = stabilityBonus + reputationBonus - bugPenalty;

    if (score >= 120) {
        state.money += p.revenueBonus * 4;
        state.reputation = Math.min(100, state.reputation + 10);
        showMoneyFloat(p.revenueBonus * 4, 'money');
        showMessage(`🎉 "${p.name}" shipped successfully! Great reception.`);
    } else if (score >= 60) {
        state.money += p.revenueBonus * 2;
        showMoneyFloat(p.revenueBonus * 2, 'money');
        showMessage(`📦 "${p.name}" shipped. Decent reception.`);
    } else {
        state.reputation = Math.max(0, state.reputation - 15);
        state.money -= 1000;
        showMoneyFloat(-1000, 'money');
        showMessage(`💥 "${p.name}" flopped. Too many bugs.`);
    }

    document.getElementById('money').textContent = '$' + state.money.toLocaleString();
    document.getElementById('reputation').textContent = state.reputation;
    state.project = null;
    setTimeout(() => {
        document.getElementById('event-box').innerHTML = 'Awaiting decisions...';
    }, 3000);
}

window.onerror = function(msg, url, line) {
    console.error('Game error:', msg, 'at line', line);
};

// Debug state viewer
window.state = state; // Safe global for console inspection
console.log('Fixed game loaded. Use console.log(state) to inspect. Clear localStorage if issues persist.');

const DEV_NAMES = ['Alex', 'Jordan', 'Sam', 'Riley', 'Casey', 'Morgan', 'Drew', 'Blake'];
const DESIGNER_NAMES = ['Mia', 'Lena', 'Kai', 'Nova', 'Zara', 'Eli', 'Soren', 'Iris'];
const MANAGER_NAMES = ['Dana', 'Chris', 'Pat', 'Robin', 'Quinn', 'Jamie', 'Taylor', 'Avery'];

const ROLE_NAMES = { Dev: DEV_NAMES, Designer: DESIGNER_NAMES, Manager: MANAGER_NAMES };

function generateCandidates(role) {
    const names = ROLE_NAMES[role];
    const used = state.employees.map(e => e.name);
    const available = names.filter(n => !used.includes(n));

    const candidates = [];
    for (let i = 0; i < 3; i++) {
        const name = available[Math.floor(Math.random() * available.length)] || role + ' ' + (i + 1);
        const salary = 600 + Math.floor(Math.random() * 5) * 100;

        let skills = {};
        if (role === 'Dev') {
            skills = {
                bugFix: Math.floor(Math.random() * 3) + 1,
                speed: Math.floor(Math.random() * 3) + 1,
                researchBonus: Math.floor(Math.random() * 2),
            };
        } else if (role === 'Designer') {
            skills = {
                reputationBonus: Math.floor(Math.random() * 3) + 1,
                speed: Math.floor(Math.random() * 3) + 1,
                motivationAura: Math.floor(Math.random() * 2),
            };
        } else if (role === 'Manager') {
            skills = {
                motivationBonus: Math.floor(Math.random() * 3) + 1,
                costReduction: Math.floor(Math.random() * 2),
                eventChanceReduction: Math.floor(Math.random() * 2),
            };
        }

        candidates.push({ name, role, salary, skills });
    }
    return candidates;
}

let currentCandidates = [];
let selectedCandidate = null;

function openHireModal() {
    const modal = document.getElementById('hire-modal');
    document.getElementById('hire-candidates').classList.add('hidden');
    document.getElementById('btn-confirm-hire').style.display = 'none';
    document.querySelectorAll('.hire-role-btn').forEach(b => b.classList.remove('selected'));
    selectedCandidate = null;
    modal.classList.remove('hidden');
}

document.querySelectorAll('.hire-role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.hire-role-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const role = btn.dataset.role;
        currentCandidates = generateCandidates(role);
        renderCandidates(currentCandidates);
        document.getElementById('hire-candidates').classList.remove('hidden');
        document.getElementById('btn-confirm-hire').style.display = '';
        selectedCandidate = null;
    });
});

function renderCandidates(candidates) {
    const list = document.getElementById('candidate-list');
    list.innerHTML = '';
    candidates.forEach((c, i) => {
        const card = document.createElement('div');
        card.className = 'candidate-card';

        let skillText = '';
        if (c.role === 'Dev') {
            skillText = `🐛 Bug Fix +${c.skills.bugFix} | ⚡ Speed +${c.skills.speed} | 🔬 RP +${c.skills.researchBonus}`;
        } else if (c.role === 'Designer') {
            skillText = `⭐ Reputation +${c.skills.reputationBonus}/wk | ⚡ Speed +${c.skills.speed} | 😊 Morale aura +${c.skills.motivationAura}`;
        } else {
            skillText = `😊 Motivation +${c.skills.motivationBonus}/wk | 💰 Cost -${c.skills.costReduction}% | 🛡 Event risk -${c.skills.eventChanceReduction}%`;
        }

        card.innerHTML = `
            <div class="candidate-name">${c.name} <span class="candidate-salary">$${c.salary}/wk</span></div>
            <div class="candidate-stats">${skillText}</div>
        `;
        card.addEventListener('click', () => {
            list.querySelectorAll('.candidate-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedCandidate = candidates[i];
        });
        list.appendChild(card);
    });
}

document.getElementById('btn-confirm-hire').addEventListener('click', () => {
    if (!selectedCandidate) {
        showMessage('Select a candidate first.');
        return;
    }
    const c = selectedCandidate;
    state.money -= 1500;
    showMoneyFloat(-1500, 'money');

    const id = state.employees.length;
    const emp = createEmployee(id, c.role);
    emp.name = c.name;
    emp.salary = c.salary;
    emp.skills = c.skills;
    emp.energy = 100;
    emp.motivation = 100;
    state.employees.push(emp);

    document.getElementById('money').textContent = '$' + state.money.toLocaleString();
    document.getElementById('employees').textContent = state.employees.length;
    document.getElementById('hire-modal').classList.add('hidden');
    showMessage(`👤 ${c.name} joined as ${c.role}!`);
});

document.getElementById('btn-cancel-hire').addEventListener('click', () => {
    document.getElementById('hire-modal').classList.add('hidden');
});

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
        showMessage('No more desk space. Expand first.');
        return;
    }
    openHireModal();
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

document.getElementById('btn-feature').addEventListener('click', function() {
    if (!state.project) {
        showMessage('No active project. Start a project first.');
        return;
    }

    const p = state.project;
    const currentIds = p.features.map(f => f.id);
    const available = ALL_FEATURES.filter(f => !currentIds.includes(f.id) && (f.rpCost === 0 || state.researchPoints >= f.rpCost || state.unlockedFeatures.includes(f.id)));

    if (available.length === 0) {
        showMessage('No features available to add. Earn more RP to unlock.');
        return;
    }

    if (p.features.length >= 3) {
        openReplaceFeatureModal(available);
    } else {
        openAddFeatureModal(available);
    }
});

function openAddFeatureModal(available) {
    const modal = document.getElementById('project-modal');
    const featureList = document.getElementById('feature-list');
    document.getElementById('project-modal-title').textContent = '⚙️ Add Feature';
    document.getElementById('project-name').closest('div').style.display = 'none';
    document.getElementById('project-desc').closest('div').style.display = 'none';

    featureList.innerHTML = '';
    available.forEach(f => {
        const div = document.createElement('div');
        div.className = 'feature-option';
        div.innerHTML = `
            <input type="radio" name="add-feature" data-id="${f.id}">
            <div>
                <div style="font-weight: bold; color: var(--text)">${f.name}</div>
                <div style="font-size: 0.75rem">${f.desc}</div>
            </div>
            <div class="rp-cost">${f.rpCost > 0 && !state.unlockedFeatures.includes(f.id) ? `🔬 ${f.rpCost} RP` : `+$${f.revenueBonus}/wk`}</div>
        `;
        div.addEventListener('click', () => {
            featureList.querySelectorAll('.feature-option').forEach(d => d.classList.remove('selected'));
            div.classList.add('selected');
            div.querySelector('input').checked = true;
        });
        featureList.appendChild(div);
    });

    document.getElementById('btn-start-project').textContent = '✚ Add Feature';
    document.getElementById('btn-start-project').onclick = () => {
        const selected = document.querySelector('input[name="add-feature"]:checked');
        if (!selected) { showMessage('Select a feature.'); return; }
        const f = ALL_FEATURES.find(f => f.id === selected.dataset.id);
        if (f.rpCost > 0 && !state.unlockedFeatures.includes(f.id)) {
            state.researchPoints -= f.rpCost;
            state.unlockedFeatures.push(f.id);
            document.getElementById('research').textContent = state.researchPoints;
        }
        state.project.features.push(f);
        state.project.bugRisk += f.bugRisk;
        state.project.revenueBonus += f.revenueBonus;
        document.getElementById('project-modal').classList.add('hidden');
        resetProjectModal();
        updateProjectPanel();
        showMessage(`⚙️ "${f.name}" added to ${state.project.name}.`);
    };

    modal.classList.remove('hidden');
}

function openReplaceFeatureModal(available) {
    const p = state.project;
    const modal = document.getElementById('project-modal');
    const featureList = document.getElementById('feature-list');
    document.getElementById('project-modal-title').textContent = '🔄️ Replace a Feature';
    document.getElementById('project-name').closest('div').style.display = 'none';
    document.getElementById('project-desc').closest('div').style.display = 'none';

    featureList.innerHTML = `
    <div class="panel-title" style="margin-bottom: 6px;">Remove which feature?</div>
    ${p.features.map((f, i) => `
        <div class="feature-option" id="remove-opt-${i}" data-index="${i}">
            <input type="radio" name="remove-feature" data-index="${i}">
            <div><div style="font-weight:bold;color:var(--text)">${f.name}</div></div>
            <div class="rp-cost" style="color:var(--danger)">remove</div>
        </div>
    `).join('')}
    <div class="panel-title" style="margin: 10px 0 6px;">Add which feature?</div>
    ${available.map(f => `
        <div class="feature-option" id="add-opt-${f.id}" data-id="${f.id}">
            <input type="radio" name="add-feature2" data-id="${f.id}">
            <div>
                <div style="font-weight:bold;color:var(--text)">${f.name}</div>
                <div style="font-size:0.75rem">${f.desc}</div>
            </div>
            <div class="rp-cost">${f.rpCost > 0 && !state.unlockedFeatures.includes(f.id) ? `🔬 ${f.rpCost} RP` : `+$${f.revenueBonus}/wk`}</div>
        </div>
        `).join('')}
    `;

    featureList.querySelectorAll('[id^="remove-opt-"]').forEach(div => {
        div.addEventListener('click', () => {
            featureList.querySelectorAll('[id^="remove-opt-"]').forEach(d => d.classList.remove('selected'));
            div.classList.add('selected');
            div.querySelector('input').checked = true;
        });
    });
    featureList.querySelectorAll('[id^="add-opt-"]').forEach(div => {
        div.addEventListener('click', () => {
            featureList.querySelectorAll('[id^="add-opt-"]').forEach(d => d.classList.remove('selected'));
            div.classList.add('selected');
            div.querySelector('input').checked = true;
        });
    });

    document.getElementById('btn-start-project').textContent = '🔄️ Replace Feature';
    document.getElementById('btn-start-project').onclick = () => {
        const removeInput = document.querySelector('input[name="remove-feature"]:checked');
        const addInput = document.querySelector('input[name="add-feature2"]:checked');
        if (!removeInput || !addInput) { showMessage('Select both a feature to remove and one to add.'); return; }

        const removeIndex = parseInt(removeInput.dataset.index);
        const addFeature = ALL_FEATURES.find(f => f.id === addInput.dataset.id);
        const removed = p.features.splice(removeIndex, 1)[0];
        p.bugRisk -= removed.bugRisk;
        p.revenueBonus -= removed.revenueBonus;

        if (addFeature.rpCost > 0 && !state.unlockedFeatures.includes(addFeature.id)) {
            state.researchPoints -= addFeature.rpCost;
            state.unlockedFeatures.push(addFeature.id);
            document.getElementById('research').textContent = state.researchPoints;
        }
        p.features.push(addFeature);
        p.bugRisk += addFeature.bugRisk;
        p.revenueBonus += addFeature.revenueBonus;

        document.getElementById('project-modal').classList.add('hidden');
        resetProjectModal();
        updateProjectPanel();
        showMessage(`🔄️ Replaced "${removed.name}" with "${addFeature.name}".`);
    };

    modal.classList.remove('hidden');
}

function resetProjectModal() {
    document.getElementById('project-modal-title').textContent = '🚀 New Project';
    document.getElementById('project-name').closest('div').style.display = '';
    document.getElementById('project-desc').closest('div').style.display = '';
    document.getElementById('btn-start-project').textContent = '▶ Start Project';
    document.getElementById('btn-start-project').onclick = null;
}

function showMessage(text) {
    const box = document.getElementById('event-box');
    box.innerHTML = `<span style="color: var(--accent)">${text}</span>`;
    setTimeout(() => {
        box.innerHTML = 'Awaiting decisions...';
    }, 3000);
}

document.getElementById('btn-new-project').addEventListener('click', openProjectModal);