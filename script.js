const counter = document.getElementById("counter");
const dialogStart = document.querySelector("dialog#start");
const dialogForm = document.querySelector("dialog > form");
const stopNotification = document.getElementById("stopNotification");
const dialogEnd = document.querySelector("dialog#end");

const formFieldTime = document.querySelector(".field-time");

const formMinutes = document.getElementById("minutes");
const formSeconds = document.getElementById("seconds");
const formStopwatch = document.getElementById("stopwatch");

let time = {
    mode: "countdown",
    minutes: 0,
    seconds: 0,
    limit: {
        minutes: 0,
        seconds: 0
    },
    overtime: false
}

let countdownInterval;
let stopwatchInterval;

dialogForm.addEventListener("submit", (e) => { e.preventDefault(); goLive(); });

formStopwatch.addEventListener("change", function() {
    if (formStopwatch.checked) {
        formFieldTime.setAttribute("disabled", "");
    } else {
        formFieldTime.removeAttribute("disabled");
    }
})

document.addEventListener("click", confirmEndSession);
document.addEventListener("keyup", (e) => confirmEndSession(e))
document.getElementById("restart-btn").addEventListener("click", function() { location.reload(); });

formMinutes.addEventListener('focus', function() { formMinutes.select(); });
formSeconds.addEventListener('focus', function() { formSeconds.select(); });

function loadURLParams() {
    let params = new URLSearchParams(document.location.search);
    if (params.get("minutes")) { formMinutes.value = params.get("minutes"); }
    if (params.get("seconds")) { formSeconds.value = params.get("seconds"); }
    if (params.get("stopwatch") == "on") { formStopwatch.click(); }
}

loadURLParams();

function goLive() {
    dialogStart.close();

    let formData = new FormData(dialogForm);
    let url = new URL(window.location.href);

    let fStopwatch = formData.get("stopwatch");

    if (fStopwatch == "on") {
        url.searchParams.delete("minutes");
        url.searchParams.delete("seconds");
        url.searchParams.set("stopwatch", formData.get("stopwatch"));
        window.history.replaceState(null, null, url);

        time.mode = "stopwatch";

        stopwatch(true);
        stopwatchInterval = setInterval(stopwatch, 1000);
    } else {
        time = {
            mode: "countdown",
            minutes: formData.get("minutes"),
            seconds: formData.get("seconds"),
            limit: {
                minutes: formData.get("minutes"),
                seconds: formData.get("seconds")
            }
        }
        
        url.searchParams.set("minutes", formData.get("minutes"));
        url.searchParams.set("seconds", formData.get("seconds"));
        url.searchParams.delete("stopwatch");
        window.history.replaceState(null, null, url);

        countdown(true);
        countdownInterval = setInterval(countdown, 1000);
    }
}

function formatTime(t = time) {
    let newTime = {...t};
    if (t.minutes < 10) {
        newTime.minutes = `0${t.minutes}`;
        if (t.minutes == 0) {
            newTime.minutes = "00";
        }
    }
    if (t.seconds < 10) {
        newTime.seconds = `0${t.seconds}`;
        if (t.seconds == 0) {
            newTime.seconds = "00";
        }
    }
    return newTime;
}

function countdown(onlyUpdate = false) {
    if (onlyUpdate == false) {
        if (time.minutes <= 0 && time.seconds <= 0) {
            clearInterval(countdownInterval);
            time.overtime = true;
            stopwatch(true);
            stopwatchInterval = setInterval(stopwatch, 1000);
            document.body.classList.add("overtime");
            return;
        }
    
        if (time.seconds <= 0) {
            time.minutes -= 1;
            time.seconds = 59;
        } else {
            time.seconds -= 1;
        }
    }

    let formattedTime = formatTime();
    counter.innerText = `T-${formattedTime.minutes}:${formattedTime.seconds}`;
}

function stopwatch(onlyUpdate = false) {
    if (onlyUpdate == false) {
        if (time.seconds >= 59) {
            time.minutes += 1;
            time.seconds = 0;
        } else {
            time.seconds += 1;
        }
    }

    let formattedTime = formatTime();
    if (time.seconds % 2 != 0) {
        counter.innerText = `T ${formattedTime.minutes}:${formattedTime.seconds}`;
    } else {
        counter.innerText = `T+${formattedTime.minutes}:${formattedTime.seconds}`;
    }
}

function confirmEndSession(e) {
    if (e.code != undefined && e.code != "Space") { return; }

    if (stopNotification.classList.contains("snVisible")) {
        endSession();
        return;
    } else if (!dialogStart.open && !dialogEnd.open && !stopNotification.classList.contains("snVisible")) {
        stopNotification.style.display = "block";
        stopNotification.classList.add("snVisible");

        setTimeout(function() {
            stopNotification.classList.remove("snVisible");
            stopNotification.classList.add("snFadeOut");
        }, 5000)

        setTimeout(function() {
            stopNotification.style.display = "none";
            stopNotification.classList.remove("snFadeOut");
        }, 6000);
    }
}

function endSession() {
    clearInterval(countdownInterval);
    clearInterval(stopwatchInterval);

    document.body.classList.remove("overtime");

    let runtimeElm = document.getElementById("end-runtime");
    let limitAndOvertimeElm = document.getElementById("end-limitAndOvertime");

    if (time.mode == "stopwatch") {
        if (time.minutes <= 0) {
            runtimeElm.innerText = `${time.seconds} second`;
        } else if (time.minutes == 1) {
            runtimeElm.innerText = `${time.minutes} minutes ${time.seconds} second`;
        } else {
            runtimeElm.innerText = `${time.minutes} minutes ${time.seconds} second`;
        }
        if (time.seconds == 0 || time.seconds > 1) {
            runtimeElm.innerText += "s";
        }
        limitAndOvertimeElm.innerText = "";
    } else if (time.mode == "countdown") {
        let correctedTime = {
            minutes: time.limit.minutes - time.minutes,
            seconds: time.limit.seconds - time.seconds
        }
        if (time.seconds < 60) { correctedTime.minutes -= 1; }
        if (time.limit.seconds - time.seconds < 0 && time.overtime == false) { correctedTime.seconds += 60; }

        // Overtime
        if (time.overtime == true) {
            correctedTime.minutes = parseInt(time.limit.minutes) + parseInt(time.minutes);
            correctedTime.seconds = parseInt(time.limit.seconds) + parseInt(time.seconds);
        }

        if (correctedTime.minutes <= 0) {
            runtimeElm.innerText = `${correctedTime.seconds} second`;
        } else if (correctedTime.minutes == 1) {
            runtimeElm.innerText = `${correctedTime.minutes} minute ${correctedTime.seconds} second`;
        } else {
            runtimeElm.innerText = `${correctedTime.minutes} minutes ${correctedTime.seconds} second`;
        }
        if (correctedTime.seconds == 0 || correctedTime.seconds > 1) {
            runtimeElm.innerText += "s";
        }

        let formattedLimit = formatTime(time.limit);
        let formattedOvertime = formatTime(time);

        limitAndOvertimeElm.innerText = `${formattedLimit.minutes}:${formattedLimit.seconds}`;

        if (time.overtime == true) {
            limitAndOvertimeElm.innerText = `${formattedLimit.minutes}:${formattedLimit.seconds} • Overtime: ${formattedOvertime.minutes}:${formattedOvertime.seconds}`;
        } else {
            limitAndOvertimeElm.innerText = `${formattedLimit.minutes}:${formattedLimit.seconds}`;
        }
    }

    dialogEnd.showModal();
}