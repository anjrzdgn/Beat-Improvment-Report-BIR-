// داده‌ها
let birData = JSON.parse(localStorage.getItem("bir_records") || "[]");
let activeField = null;

// پخش صدا
function playBeep(freq, duration) {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.connect(gain);
    gain.connect(context.destination);
    osc.frequency.value = freq;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    osc.stop(context.currentTime + duration);
}

// نمایش پیام در statusBox
function reportStatus(text, type) {
    const box = document.getElementById("statusBox");
    box.innerText = text;
    box.className = type === "error" ? "status-error" : "status-success";
    
    if(type === "error") playBeep(440, 0.4);
    else playBeep(880, 0.2);

    setTimeout(() => {
        box.className = "";
        if(box.innerText === text) box.innerText = "آماده برای ثبت داده...";
    }, 4000);
}

// پر کردن سال تولد
const yearSelect = document.getElementById("birthYear");
for (let y = 83; y <= 98; y++) {
    let opt = document.createElement("option");
    opt.value = y; opt.textContent = y;
    yearSelect.appendChild(opt);
}

// ساعت زنده
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fa-IR', { hour12: false });
    const dateStr = now.toISOString().slice(0, 10);
    document.getElementById("liveClock").innerText = `${timeStr} ${dateStr}`;
}
setInterval(updateClock, 1000);
updateClock();

// مدیریت فیلدهای عددی
const numericInputs = document.querySelectorAll(".numeric-input");
numericInputs.forEach(input => {
    input.addEventListener("click", function() {
        numericInputs.forEach(i => i.style.background = "white");
        this.style.background = "#e3f2fd";
        activeField = this;
        if (!this._rawValue) this._rawValue = "";
    });
});

// دکمه‌های کیبورد عددی
document.querySelectorAll(".key-btn[data-value]").forEach(btn => {
    btn.addEventListener("click", () => {
        if (activeField) {
            activeField._rawValue += btn.getAttribute("data-value");
            activeField.value = activeField._rawValue;
        } else {
            reportStatus("⚠️ ابتدا یک فیلد را انتخاب کنید", "error");
        }
    });
});

// پاک کردن آخرین رقم
document.getElementById("clearDigitBtn").addEventListener("click", () => {
    if (activeField) {
        activeField._rawValue = activeField._rawValue.slice(0, -1);
        activeField.value = activeField._rawValue;
    }
});

// غیرفعال‌سازی سختی کار در استیشن 2
const stationSelect = document.getElementById("station");
const diffGroup = document.getElementById("difficultyGroup");
stationSelect.addEventListener("change", () => {
    if (stationSelect.value === "2") {
        diffGroup.style.opacity = "0.2";
        diffGroup.style.pointerEvents = "none";
    } else {
        diffGroup.style.opacity = "1";
        diffGroup.style.pointerEvents = "all";
    }
});

// ثبت داده
document.getElementById("birForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const score = document.getElementById("score").value;
    const session = document.getElementById("sessionNumber").value;
    const day = document.getElementById("birthDay").value;

    if (!score || !session || !day) {
        reportStatus("❌ خطا: فیلدهای عددی خالی هستند!", "error");
        return;
    }

    const dayNum = parseInt(day);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
        reportStatus("❌ خطا: روز تولد باید بین 1 تا 31 باشد!", "error");
        document.getElementById("birthDay").style.background = "#ffcccc";
        return;
    }

    const record = {
        date_iso: new Date().toISOString().slice(0,10),
        birth_year: document.getElementById("birthYear").value,
        birth_month: document.getElementById("birthMonth").value,
        birth_day: day,
        gender: document.getElementById("gender").value,
        station: stationSelect.value,
        difficulty: stationSelect.value === "1" ? document.getElementById("difficulty").value : "N/A",
        session_number: session,
        score: score
    };

    // بررسی تکراری (ساده)
    const isDup = birData.some(r => 
        r.birth_year === record.birth_year && r.birth_day === record.birth_day &&
        r.session_number === record.session_number && r.score === record.score
    );

    if (isDup) {
        reportStatus("❌ تکراری: این داده قبلاً ثبت شده!", "error");
        return;
    }

    birData.push(record);
    localStorage.setItem("bir_records", JSON.stringify(birData));
    updateTodayCounter();
    numericInputs.forEach(i => { i.value = ""; i._rawValue = ""; i.style.background = "white"; });
    activeField = null;
    reportStatus("✅ موفقیت: داده با موفقیت ذخیره شد", "success");
});

// شمارنده امروز
function updateTodayCounter() {
    const today = new Date().toISOString().slice(0,10);
    const count = birData.filter(r => r.date_iso === today).length;
    document.getElementById("todayCounter").innerText = `تعداد امروز: ${count}`;
}

// خروجی امروز
document.getElementById("exportTodayBtn").addEventListener("click", () => {
    const today = new Date().toISOString().slice(0,10);
    const todayData = birData.filter(r => r.date_iso === today);
    if (todayData.length === 0) { reportStatus("⚠️ داده‌ای برای امروز یافت نشد", "error"); return; }
    const blob = new Blob([JSON.stringify(todayData, null, 2)], {type: "application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `BIR_${today}.json`;
    a.click();
    reportStatus("📁 فایل خروجی آماده دانلود شد", "success");
});

// حذف داده‌های امروز
document.getElementById("clearTodayBtn").addEventListener("click", () => {
    if (confirm("تمامی داده‌های امروز حذف شوند؟")) {
        const today = new Date().toISOString().slice(0,10);
        birData = birData.filter(r => r.date_iso !== today);
        localStorage.setItem("bir_records", JSON.stringify(birData));
        updateTodayCounter();
        reportStatus("🗑️ داده‌های امروز پاکسازی شدند", "success");
    }
});

// تازه‌سازی صفحه
document.getElementById("refreshBtn").addEventListener("click", () => location.reload());

// تمام صفحه
document.getElementById("fullscreenBtn").addEventListener("click", () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
});

// اجرای اولیه شمارنده
updateTodayCounter();