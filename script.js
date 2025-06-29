// Helper to fetch and parse the new alarms.csv format
async function fetchAlarms() {
    const resp = await fetch('alarms.csv');
    const text = await resp.text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) return []; // No data

    // Parse new header
    const header = lines[0].split(',').map(h => h.trim());
    const dateIdx = header.indexOf('Date');
    const dayIdx = header.indexOf('Day');
    const alarmStartIdx = 2; // Alarm1 is at index 2

    // Map each row to an object for that day with alarm times
    return lines.slice(1).map(line => {
        const cols = line.split(',').map(col => col.trim());
        // Collect only non-empty alarm times
        const alarms = [];
        for (let i = alarmStartIdx; i < header.length; i++) {
            if (cols[i]) {
                // Create a Date object for today with this alarm time
                // Parse date string DD-MMM-YYYY or DD/MM/YYYY or similar
                let dateStr = cols[dateIdx];
                let timeStr = cols[i];
                // Adjust for different date formats
                let dateParts;
                if (dateStr.includes('-')) {
                    // e.g., 29-June-2025 or 29-Jun-2025
                    dateParts = dateStr.split('-');
                } else if (dateStr.includes('/')) {
                    // e.g., 29/06/2025
                    dateParts = dateStr.split('/');
                } else {
                    dateParts = [ "", "", "" ];
                }
                let day = Number(dateParts[0]);
                let month = isNaN(Number(dateParts[1])) ? 
                    (new Date(Date.parse(dateParts[1] +" 1, 2012")).getMonth()) : 
                    (Number(dateParts[1])-1);
                let year = Number(dateParts[2]);
                let [hh, mm] = timeStr.split(':');
                let alarmDate = new Date(year, month, day, Number(hh), Number(mm));
                alarms.push({
                    date: alarmDate,
                    label: `Alarm at ${timeStr}`,
                    originalRow: cols
                });
            }
        }
        return {
            date: cols[dateIdx],
            day: cols[dayIdx],
            alarms: alarms
        };
    });
}

// Digital clock (unchanged)
function updateDigitalClock() {
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    document.getElementById('digitalClock').textContent =
        `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

// Analog clock (unchanged)
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

// Render alarms for today
function renderAlarms(alarmsByDay) {
    const now = new Date();
    // Find today's entry
    let todayObj = alarmsByDay.find(row => {
        // Parse row.date into comparable Date object
        let dateStr = row.date;
        let dateParts;
        if (dateStr.includes('-')) {
            dateParts = dateStr.split('-');
        } else if (dateStr.includes('/')) {
            dateParts = dateStr.split('/');
        } else {
            dateParts = ["", "", ""];
        }
        let day = Number(dateParts[0]);
        let month = isNaN(Number(dateParts[1])) ? 
            (new Date(Date.parse(dateParts[1] +" 1, 2012")).getMonth()) : 
            (Number(dateParts[1])-1);
        let year = Number(dateParts[2]);
        return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
    });

    const container = document.getElementById('alarmsList');
    container.innerHTML = '';

    if (!todayObj || !todayObj.alarms.length) {
        container.innerHTML = '<div class="alarm-row">No alarms scheduled for today.</div>';
        return;
    }

    // Find the next upcoming alarm
    let soonestIdx = -1, soonestDiff = Infinity;
    todayObj.alarms.forEach((a, idx) => {
        const diff = a.date - now;
        if (diff > 0 && diff < soonestDiff) {
            soonestDiff = diff;
            soonestIdx = idx;
        }
    });

    todayObj.alarms.forEach((alarm, idx) => {
        const diff = alarm.date - now;
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
        row.innerHTML = `<span>${alarm.label}</span><span>${alarm.date.toLocaleTimeString()}<br><small>${countdown}</small></span>`;
        container.appendChild(row);
    });
}

// Carousel (unchanged)
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

// Bottom message (unchanged)
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
