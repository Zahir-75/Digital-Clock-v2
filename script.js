// Helper to fetch and parse the new alarms.csv format
async function fetchAlarms() {
    const resp = await fetch('alarms.csv');
    const text = await resp.text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    // Parse header
    // ["Date", "Day", "Alarm1", ...]
    return lines.slice(1).map(line => {
        const cols = line.split(',').map(col => col.trim());
        return {
            date: cols[0], // "29-June-2025"
            day: cols[1],  // "Sunday"
            times: cols.slice(2).filter(Boolean) // ["04:00", "10:00", ...]
        };
    });
}

// Digital clock
function updateDigitalClock() {
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    document.getElementById('digitalClock').textContent =
        `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

// Analog clock
function drawAnalogClock() {
    const canvas = document.getElementById('analogClock');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const now = new Date();
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w/2, h/2);
    ctx.beginPath();
    ctx.arc(0, 0, w/2-5, 0, 2*Math.PI);
    ctx.fillStyle = '#fff8';
    ctx.fill();
    ctx.strokeStyle = '#b84636';
    ctx.lineWidth = 3;
    ctx.stroke();

    for(let i=0;i<12;i++){
        ctx.save();
        ctx.rotate(i*Math.PI/6);
        ctx.beginPath();
        ctx.moveTo(0, -w/2+16);
        ctx.lineTo(0, -w/2+7);
        ctx.strokeStyle = '#b84636';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    const hr = now.getHours()%12 + now.getMinutes()/60;
    const min = now.getMinutes() + now.getSeconds()/60;
    const sec = now.getSeconds();

    ctx.save();
    ctx.rotate(hr*Math.PI/6);
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(0, -w/2+36);
    ctx.strokeStyle = '#d53369';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.rotate(min*Math.PI/30);
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.lineTo(0, -w/2+18);
    ctx.strokeStyle = '#daae51';
    ctx.lineWidth = 3.2;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.rotate(sec*Math.PI/30);
    ctx.beginPath();
    ctx.moveTo(0, 24);
    ctx.lineTo(0, -w/2+8);
    ctx.strokeStyle = '#b84636';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(0,0,4,0,2*Math.PI);
    ctx.fillStyle = '#b84636';
    ctx.fill();

    ctx.restore();
}

// Render alarms for today
function renderAlarms(alarmsByDay) {
    const now = new Date();
    const months = [
        "January","February","March","April","May","June","July",
        "August","September","October","November","December"
    ];
    const todayString = `${now.getDate().toString().padStart(2, '0')}-${months[now.getMonth()]}-${now.getFullYear()}`;
    const todayObj = alarmsByDay.find(row => row.date === todayString);

    const container = document.getElementById('alarmsList');
    container.innerHTML = '';

    if (!todayObj || !todayObj.times.length) {
        container.innerHTML = '<div class="alarm-row">No alarms scheduled for today.</div>';
        return;
    }

    // Create Date objects for each alarm time today
    const alarms = todayObj.times.map(timeStr => {
        const [hh, mm] = timeStr.split(':');
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(hh), Number(mm));
    });

    // Find the next upcoming alarm
    let soonestIdx = -1, soonestDiff = Infinity;
    alarms.forEach((alarmTime, idx) => {
        const diff = alarmTime - now;
        if (diff > 0 && diff < soonestDiff) {
            soonestDiff = diff;
            soonestIdx = idx;
        }
    });

    alarms.forEach((alarmTime, idx) => {
        const diff = alarmTime - now;
        let countdown = '';
        if (diff > 0) {
            const hours = Math.floor(diff / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            countdown = `${hours}h ${mins}m ${secs}s`;
        } else {
            countdown = 'Passed';
        }
        const row = document.createElement('div');
        row.className = 'alarm-row' + (idx === soonestIdx ? ' gold' : '');
        row.innerHTML = `<span>Alarm at ${todayObj.times[idx]}</span><span>${alarmTime.toLocaleTimeString()}<br><small>${countdown}</small></span>`;
        container.appendChild(row);
    });
}

// Carousel and messages are unchanged
const imageFolder = 'msgImges/';
const images = [
    'img1.jpg',
    'img2.jpg',
    'img3.jpg',
    'img4.jpg'
];
let carouselIdx = 0;
function showCarouselImage() {
    const img = document.getElementById('carouselImage');
    img.src = imageFolder + images[carouselIdx];
}
document.addEventListener('DOMContentLoaded', ()=>{
    document.getElementById('carouselPrev').onclick = ()=>{
        carouselIdx = (carouselIdx - 1 + images.length) % images.length;
        showCarouselImage();
    };
    document.getElementById('carouselNext').onclick = ()=>{
        carouselIdx = (carouselIdx + 1) % images.length;
        showCarouselImage();
    };
    showCarouselImage();
    document.getElementById('bottomMessage').textContent = getRandomMessage();
});

// Main
let alarmsData = [];
async function mainLoop() {
    if(!alarmsData.length){
        alarmsData = await fetchAlarms();
    }
    renderAlarms(alarmsData);
    updateDigitalClock();
    drawAnalogClock();
    setTimeout(mainLoop, 1000);
}
mainLoop();
