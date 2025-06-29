// Helper to fetch and parse the new alarms.csv format with DD/MM/YYYY date
async function fetchAlarms() {
    const resp = await fetch('alarms.csv');
    const text = await resp.text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    // ["Date", "Day", "Alarm1", ...]
    return lines.slice(1).map(line => {
        const cols = line.split(',').map(col => col.trim());
        return {
            date: cols[0], // "29/06/2025"
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
    const todayString = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    const todayObj = alarmsByDay.find(row => row.date === todayString);

    const container = document.getElementById('alarmsList');
    container.innerHTML = '';

    if (!todayObj || !todayObj.times.length) {
        container.innerHTML = '<div class="alarm-row">No alarms scheduled for today.</div>';
        return;
    }

    // Only take the first 7 alarms
    const alarms = todayObj.times.slice(0, 7).map((timeStr, idx) => {
        const [hh, mm] = timeStr.split(':');
        return {
            time: timeStr,
            dateObj: new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(hh), Number(mm)),
            idx
        };
    });

    // Helper to generate alarm HTML with countdown
    function alarmHtml(alarm) {
        const diff = alarm.dateObj - now;
        let countdown = '';
        if (diff > 0) {
            const hours = Math.floor(diff / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            countdown = `${hours}h ${mins}m ${secs}s`;
        } else {
            countdown = 'Passed';
        }
        return `<span>Alarm at ${alarm.time} <small>(${alarm.dateObj.toLocaleTimeString()})<br>${countdown}</small></span>`;
    }

    // Find soonest alarm (for optional highlight)
    let soonestIdx = -1, soonestDiff = Infinity;
    alarms.forEach((alarm, idx) => {
        const diff = alarm.dateObj - now;
        if (diff > 0 && diff < soonestDiff) {
            soonestDiff = diff;
            soonestIdx = idx;
        }
    });

    // Layout: [0|1], [2], [3|4], [5|6]
    let html = '';
    // First line: Alarm1 | Alarm2
    if (alarms[0] || alarms[1]) {
        html += `<div class="alarm-row${soonestIdx === 0 || soonestIdx === 1 ? ' gold' : ''}">`;
        if (alarms[0]) html += alarmHtml(alarms[0]);
        if (alarms[1]) html += " &nbsp;|&nbsp; " + alarmHtml(alarms[1]);
        html += '</div>';
    }
    // Second line: Alarm3
    if (alarms[2]) {
        html += `<div class="alarm-row${soonestIdx === 2 ? ' gold' : ''}">`;
        html += alarmHtml(alarms[2]);
        html += '</div>';
    }
    // Third line: Alarm4 | Alarm5
    if (alarms[3] || alarms[4]) {
        html += `<div class="alarm-row${soonestIdx === 3 || soonestIdx === 4 ? ' gold' : ''}">`;
        if (alarms[3]) html += alarmHtml(alarms[3]);
        if (alarms[4]) html += " &nbsp;|&nbsp; " + alarmHtml(alarms[4]);
        html += '</div>';
    }
    // Fourth line: Alarm6 | Alarm7
    if (alarms[5] || alarms[6]) {
        html += `<div class="alarm-row${soonestIdx === 5 || soonestIdx === 6 ? ' gold' : ''}">`;
        if (alarms[5]) html += alarmHtml(alarms[5]);
        if (alarms[6]) html += " &nbsp;|&nbsp; " + alarmHtml(alarms[6]);
        html += '</div>';
    }

    container.innerHTML = html;
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
