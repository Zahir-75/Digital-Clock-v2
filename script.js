// Helper to fetch and parse CSV
async function fetchAlarms() {
    fetch('alarms.csv')
      .then(response => response.text())
      .then(text => {
    const rows = text.trim().split('\n');
    const header = rows[0].split(',');
    const data = rows.slice(1).map(row => row.split(','));
    // Now, data[i] = [Date, Day, Alarm1, ..., Alarm8]
    // You can access alarms as data[i][2]...data[i][9]
  });

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
    const ctx = canvas.getContext('2d');
    const now = new Date();
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Draw clock face
    ctx.save();
    ctx.translate(w/2, h/2);
    ctx.beginPath();
    ctx.arc(0, 0, w/2-5, 0, 2*Math.PI);
    ctx.fillStyle = '#fff8';
    ctx.fill();
    ctx.strokeStyle = '#b84636';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Hour marks
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

    // Hands
    const hr = now.getHours()%12 + now.getMinutes()/60;
    const min = now.getMinutes() + now.getSeconds()/60;
    const sec = now.getSeconds();
    // Hour
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
    // Minute
    ctx.save();
    ctx.rotate(min*Math.PI/30);
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.lineTo(0, -w/2+18);
    ctx.strokeStyle = '#daae51';
    ctx.lineWidth = 3.2;
    ctx.stroke();
    ctx.restore();
    // Second
    ctx.save();
    ctx.rotate(sec*Math.PI/30);
    ctx.beginPath();
    ctx.moveTo(0, 24);
    ctx.lineTo(0, -w/2+8);
    ctx.strokeStyle = '#b84636';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Center dot
    ctx.beginPath();
    ctx.arc(0,0,4,0,2*Math.PI);
    ctx.fillStyle = '#b84636';
    ctx.fill();

    ctx.restore();
}

// Countdown for each alarm
function renderAlarms(alarms) {
    const now = new Date();

    // Get today's date boundaries
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Filter alarms for today only
    const todaysAlarms = alarms.filter(a =>
        a.time >= today && a.time < tomorrow
    ).slice(0, 6);

    // Find the next upcoming alarm (for today)
    let soonestIdx = -1, soonestDiff = Infinity;
    todaysAlarms.forEach((a, idx) => {
        const diff = a.time - now;
        if (diff > 0 && diff < soonestDiff) {
            soonestDiff = diff;
            soonestIdx = idx;
        }
    });

    const container = document.getElementById('alarmsList');
    container.innerHTML = '';
    todaysAlarms.forEach((alarm, idx) => {
        const diff = alarm.time - now;
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
        row.innerHTML = `<span>${alarm.label}</span><span>${alarm.time.toLocaleTimeString()}<br><small>${countdown}</small></span>`;
        container.appendChild(row);
    });

    // If no alarms for today, show a message
    if (todaysAlarms.length === 0) {
        container.innerHTML = '<div class="alarm-row">No alarms scheduled for today.</div>';
    }
}


// Carousel
const imageFolder = 'msgImges/';
const images = [
    'img1.jpg',
    'img2.jpg',
    'img3.jpg',
    'img4.jpg'
    // Add more image file names as needed
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
});

// Bottom message
document.addEventListener('DOMContentLoaded', ()=>{
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
