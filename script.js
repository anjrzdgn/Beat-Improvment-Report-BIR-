// ---------- صوت و زمان (مثل قبل) ----------
function playBeep(frequency, duration, volume = 0.3) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        oscillator.connect(gain);
        gain.connect(audioCtx.destination);
        oscillator.frequency.value = frequency;
        gain.gain.value = volume;
        oscillator.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
        oscillator.stop(audioCtx.currentTime + duration);
        if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch(e) { console.log("Web Audio not supported"); }
}
function playSuccess() { playBeep(880, 0.2, 0.2); }
function playError() { playBeep(440, 0.4, 0.2); }

function getIranTime() {
    const now = new Date();
    const offset = 3.5 * 60 * 60 * 1000;
    const localOffset = now.getTimezoneOffset() * 60 * 1000;
    return new Date(now.getTime() + localOffset + offset);
}
function formatIranDateTime() {
    const date = getIranTime();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds} ${year}-${month}-${day}`;
}
function updateClock() {
    document.getElementById("liveClock").innerText = formatIranDateTime();
}
setInterval(updateClock, 1000);
updateClock();

// ---------- داده‌ها ----------
let birData = [];
function loadDataFromLocalStorage() {
    const stored = localStorage.getItem("bir_records");
    birData = stored ? JSON.parse(stored) : [];
    updateTodayCounter();
}
function saveAllToLocalStorage() {
    localStorage.setItem("bir_records", JSON.stringify(birData));
    updateTodayCounter();
}
function updateTodayCounter() {
    const today = getIranTime().toISOString().slice(0,10);
    const todayCount = birData.filter(rec => rec.date_saved === today).length;
    document.getElementById("todayCounter").innerText = `تعداد داده‌های ذخیره‌شده امروز: ${todayCount}`;
}

// ---------- پر کردن سال‌ها ----------
const yearSelect = document.getElementById("birthYear");
for (let y = 83; y <= 98; y++) {
    const option = document.createElement("option");
    option.value = y;
    option.textContent = y;
    if (y === 83) option.selected = true;
    yearSelect.appendChild(option);
}

// ---------- سختی شرطی ----------
const stationSelect = document.getElementById("station");
const difficultyGroup = document.getElementById("difficultyGroup");
function toggleDifficulty() {
    if (stationSelect.value === "1") {
        difficultyGroup.style.display = "flex";
        document.getElementById("difficulty").required = true;
    } else {
        difficultyGroup.style.display = "none";
        document.getElementById("difficulty").required = false;
    }
}
stationSelect.addEventListener("change", toggleDifficulty);
toggleDifficulty();

// ---------- کیبورد اختصاصی ----------
let activeField = null; // فیلدی که در حال ویرایش است

const sessionInput = document.getElementById("sessionNumber");
const scoreInput = document.getElementById("score");

// تابع کمکی برای جداسازی سه‌تایی اعداد (برای نمایش)
function formatWithCommas(x) {
    if (x === "" || x === null) return "";
    let numStr = x.toString().replace(/,/g, '');
    if (numStr === "") return "";
    let number = parseInt(numStr, 10);
    if (isNaN(number)) return "";
    return number.toLocaleString('en-US'); // 1,200,000
}

// دریافت مقدار خالص (بدون کاما) از فیلد نمایشی
function getRawValue(field) {
    let val = field.value.replace(/,/g, '');
    if (val === "") return "";
    let num = parseInt(val, 10);
    return isNaN(num) ? "" : num;
}

// تنظیم مقدار فیلد با فرمت سه‌تایی (فقط برای امتیاز)
function setScoreFormatted(value) {
    if (value === "" || value === null) {
        scoreInput.value = "";
        return;
    }
    let num = parseInt(value.toString().replace(/,/g, ''), 10);
    if (isNaN(num)) scoreInput.value = "";
    else scoreInput.value = num.toLocaleString('en-US');
}

// هنگام کلیک روی هر فیلد عددی، آن را فعال می‌کنیم
function activateField(field, isScore = false) {
    activeField = field;
    // مقدار خالص را برای ویرایش نگه می‌داریم (بدون کاما)
    let raw = getRawValue(field);
    field._rawValue = raw === "" ? "" : raw.toString();
    // ظاهر فیلد را تغییر نمی‌دهیم چون با کیبورد مقدار تغییر می‌کند
}

sessionInput.addEventListener("click", () => activateField(sessionInput, false));
scoreInput.addEventListener("click", () => activateField(scoreInput, true));

// توابع کیبورد
function appendToActive(value) {
    if (!activeField) return;
    let currentRaw = activeField._rawValue !== undefined ? activeField._rawValue : getRawValue(activeField);
    if (currentRaw === "") currentRaw = "";
    let newRaw = currentRaw + value;
    // حذف صفرهای ابتدایی غیرضروری
    if (newRaw.startsWith('0') && newRaw.length > 1) newRaw = newRaw.replace(/^0+/, '');
    if (newRaw === "") newRaw = "0";
    activeField._rawValue = newRaw;
    
    if (activeField === scoreInput) {
        // برای امتیاز: نمایش با کاما، ذخیره خالص
        let num = parseInt(newRaw, 10);
        if (!isNaN(num)) scoreInput.value = num.toLocaleString('en-US');
        else scoreInput.value = "";
    } else {
        // برای بار چندم: بدون کاما
        sessionInput.value = newRaw;
    }
}

function clearActive() {
    if (!activeField) return;
    activeField._rawValue = "";
    if (activeField === scoreInput) {
        scoreInput.value = "";
    } else {
        sessionInput.value = "";
    }
}

// اتصال دکمه‌های کیبورد
document.querySelectorAll('.key-btn[data-value]').forEach(btn => {
    btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-value');
        if (activeField) appendToActive(val);
        else showMessage("ابتدا روی فیلد بار چندم یا امتیاز کلیک کنید", "error");
    });
});
document.getElementById('clearDigitBtn').addEventListener('click', () => {
    clearActive();
});

// ---------- رفرش فرم ----------
function refreshForm() {
    document.getElementById("birthYear").value = "83";
    document.getElementById("birthMonth").value = "فروردین";
    document.getElementById("gender").value = "F";
    document.getElementById("station").value = "1";
    toggleDifficulty();
    document.getElementById("difficulty").value = "جهت‌دار-آسان";
    sessionInput.value = "";
    scoreInput.value = "";
    if (activeField) {
        activeField._rawValue = "";
        activeField = null;
    }
    showMessage("فرم به حالت اولیه برگشت.", "info");
}

// ---------- بررسی تکراری ----------
function isDuplicate(record) {
    return birData.some(existing => 
        existing.birth_year === record.birth_year &&
        existing.birth_month === record.birth_month &&
        existing.gender === record.gender &&
        existing.station === record.station &&
        existing.session_number === record.session_number &&
        existing.score === record.score &&
        (record.station === "2" ? existing.difficulty === null : existing.difficulty === record.difficulty)
    );
}

// ---------- اعتبارسنجی (با در نظر گرفتن مقدار واقعی) ----------
function validateForm() {
    let sessionRaw = sessionInput._rawValue !== undefined ? sessionInput._rawValue : sessionInput.value.replace(/,/g, '');
    let scoreRaw = scoreInput._rawValue !== undefined ? scoreInput._rawValue : scoreInput.value.replace(/,/g, '');
    
    if (!sessionRaw || sessionRaw === "") {
        showMessage("❌ لطفاً تعداد جلسه (بار چندم) را وارد کنید.", "error");
        playError();
        return false;
    }
    let sessionNum = parseInt(sessionRaw, 10);
    if (isNaN(sessionNum) || sessionNum < 0) {
        showMessage("❌ تعداد جلسه باید یک عدد صحیح نامنفی باشد.", "error");
        playError();
        return false;
    }
    
    if (!scoreRaw || scoreRaw === "") {
        showMessage("❌ لطفاً امتیاز را وارد کنید.", "error");
        playError();
        return false;
    }
    let scoreVal = parseInt(scoreRaw, 10);
    if (isNaN(scoreVal) || scoreVal < 0) {
        showMessage("❌ امتیاز باید یک عدد صحیح نامنفی باشد.", "error");
        playError();
        return false;
    }
    
    if (stationSelect.value === "1") {
        const diff = document.getElementById("difficulty").value;
        if (!diff) {
            showMessage("❌ در استیشن 1، حتماً باید سختی کار انتخاب شود.", "error");
            playError();
            return false;
        }
    }
    return { sessionNum, scoreVal };
}

// ---------- ذخیره ----------
function saveRecord() {
    const validation = validateForm();
    if (!validation) return;
    const { sessionNum, scoreVal } = validation;
    
    const iranNow = getIranTime();
    const timestampSave = formatIranDateTime();
    const dateSaved = iranNow.toISOString().slice(0,10);
    
    const record = {
        timestamp_save: timestampSave,
        date_saved: dateSaved,
        birth_year: document.getElementById("birthYear").value,
        birth_month: document.getElementById("birthMonth").value,
        gender: document.getElementById("gender").value,
        station: stationSelect.value,
        session_number: sessionNum,
        score: scoreVal,
        difficulty: stationSelect.value === "1" ? document.getElementById("difficulty").value : null
    };
    
    if (isDuplicate(record)) {
        showMessage("❌ این داده قبلاً ذخیره شده است! امکان ثبت تکراری وجود ندارد.", "error");
        playError();
        return;
    }
    
    birData.push(record);
    saveAllToLocalStorage();
    showMessage("✅ اطلاعات با موفقیت ذخیره شد.", "success");
    playSuccess();
    updateTodayCounter();
}

// ---------- سایر توابع (خروجی، پاک کردن امروز، پیام) ----------
function exportTodayData() {
    const today = getIranTime().toISOString().slice(0,10);
    const todayRecords = birData.filter(rec => rec.date_saved === today);
    if (todayRecords.length === 0) {
        showMessage("⚠️ هیچ داده‌ای برای امروز وجود ندارد.", "error");
        playError();
        return;
    }
    const jsonContent = JSON.stringify(todayRecords, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bir_data_${today}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage(`📁 خروجی ${todayRecords.length} رکورد از امروز دانلود شد.`, "success");
    playSuccess();
}

function clearTodayData() {
    const today = getIranTime().toISOString().slice(0,10);
    const todayCount = birData.filter(rec => rec.date_saved === today).length;
    if (todayCount === 0) {
        showMessage("⚠️ هیچ داده‌ای برای امروز وجود ندارد.", "error");
        playError();
        return;
    }
    const confirmClear = confirm(`آیا مطمئنی که می‌خواهی تمام ${todayCount} داده‌ی امروز (${today}) را پاک کنی؟`);
    if (!confirmClear) return;
    birData = birData.filter(rec => rec.date_saved !== today);
    saveAllToLocalStorage();
    showMessage(`🗑️ ${todayCount} داده مربوط به امروز پاک شد.`, "success");
    playSuccess();
}

let messageTimeout;
function showMessage(text, type) {
    const msgDiv = document.getElementById("message");
    msgDiv.innerText = text;
    msgDiv.style.color = (type === "error") ? "#ffaaaa" : "#aaffaa";
    if (messageTimeout) clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => { msgDiv.innerText = ""; }, 3000);
}

// رویدادها
document.getElementById("refreshBtn").addEventListener("click", refreshForm);
document.getElementById("birForm").addEventListener("submit", (e) => { e.preventDefault(); saveRecord(); });
document.getElementById("exportTodayBtn").addEventListener("click", exportTodayData);
document.getElementById("clearTodayBtn").addEventListener("click", clearTodayData);

// بارگذاری اولیه
loadDataFromLocalStorage();