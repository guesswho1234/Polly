/* ===================================== */
/* BOX CONTENT ========================= */
/* ===================================== */
const headerOptions = [
  {
    id: 'option-new-event',
    onClick: () => openBox('new-event', true),
    hotkey: 'N',
    text_before: '',
    text_after: 'ew',
  },
  {
    id: 'option-open-event',
    onClick: () => openBox('open-event', true),
    hotkey: 'G',
    text_before: '',
    text_after: 'et',
  },
  {
    id: 'option-about',
    onClick: () => openBox('about'),
    hotkey: 'u',
    text_before: 'Abo',
    text_after: 't',
  }
];

const newEventHtml = fragmentFromHTML(`` + 
`<div id="new-event-container">` + 
  `<form id="new-event-form" method="post">` + 
    `<input id="new-event-pw-value" type="hidden" name="password">` + 
    `<input id="new-event-expiry-value" type="hidden" name="expiry">` + 
    `<input id="new-event-uses-value" type="hidden" name="uses">` + 
    `<div id="event-content">` + 
      `<div id="calendar-grid" class="grid">` + 
        `<div id="calendar-grid-header">` + 
          `<span id="calendar-grid-display-year"></span>` + 
        `</div>` + 
        `<div id="calendar-grid-nav">` + 
          `<button id="calendar-grid-prev-year" class="box-shadow item-element-lnk-purple" type="button" value=""><</button>` + 
          `<div id="calendar-grid-content"></div>` + 
          `<button id="calendar-grid-next-year" class="box-shadow item-element-lnk-purple" type="button" value="">></button>` + 
        `</div>` + 
      `</div>` + 
      `<br/>` +
      `<span class="event-input-item">` + 
        `<input id="event-title" type="text" name="title" class="input" maxlength="255" placeholder="Title" required>` + 
      `</span>` + 
      `<br/>` + 
      `<span class="event-input-item">` + 
        `<input id="event-location" type="text" name="location" class="input" maxlength="255" placeholder="Location (optional)">` + 
      `</span>` + 
      `<br/>` + 
      `<span id="event-date-range">` + 
        `<span class="event-input-item">` + 
          `<input type="date" name="from" id="event-from-date" class="input" required>` + 
        `</span> - ` + 
        `<span class="event-input-item">` + 
          `<input type="date" name="to" id="event-to-date" class="input" required>` + 
        `</span>` + 
      `</span>` + 
      `<br/>` + 
      `<span id="event-time-range">` + 
        `<span class="event-input-item">` + 
          `<input id="event-start-time" type="time" name="start" class="input">` + 
        `</span> - ` + 
        `<span class="event-input-item">` + 
          `<input id="event-end-time" type="time" name="end" class="input">` + 
        `</span> @ ` + 
        `<select id="event-timezone" name="timezone" class="input"></select>` + 
      `</span>` + 
      `<br/>` + 
      `<textarea id="event-description" name="description" class="input" maxlength="4096" rows="4" placeholder="Description (optional)"></textarea>` + 
    `</div>` + 
    `<div class="new-event-button-container">` + 
      `<button id="open-new-event-settings" class="box-shadow item-element-lnk-purple" type="button">Se<span class="highlightYellow">t</span>tings</button>` + 
      `<button id="submit-event-content" class="box-shadow item-element-lnk-purple" type="submit">P<span class="highlightYellow">o</span>st</button>` + 
    `</div>` + 
  `</form>` + 
`</div>`);
newEventHtml.querySelector('#new-event-container').style.height = (defaultBoxHeight * u_height - margin_scroll_v * 2) + "px";
newEventHtml.querySelector('#new-event-container').style.width = "calc(" + defaultBoxWidth + "ch - " + (margin_scroll_h * 2) + "px)";

const idHtml = fragmentFromHTML(`` + 
`<div id="id-container">` + 
  `<br/>` + 
  `<div>` + 
    `<input type="text" id="event-id" value="" readonly>` + 
  `</div>` + 
  `<button id="copy-event-id" class="box-shadow item-element-lnk-purple"><span class="highlightYellow">C</span>opy</button>` +
`</div>`);

const openEventHtml = fragmentFromHTML(`` + 
`<div id="open-event-container">` + 
  `<br/>` + 
  `<form id="open-event-form" method="get">` + 
    `<div>` + 
      `<input type="text" id="open-event-id" class="input" value="" name="id" placeholder="Type or paste the id to open here...">` + 
    `</div>` + 
    `<div class="new-event-button-container">` + 
      `<button id="submit-open-event" class="box-shadow item-element-lnk-purple">Op<span class="highlightYellow">e</span>n</button>` + 
    `</div>` + 
  `</form>` +
`</div>`);

const openEventPwHtml = fragmentFromHTML(`` + 
`<div id="open-event-pw-container">` + 
  `<br/>` + 
  `<div>` + 
    `<input type="password" id="open-event-pw-value" class="pw-value input" value="" placeholder="Type in password here...">` + 
  `</div>` + 
  `<button id="submit-open-event-pw" class="box-shadow item-element-lnk-purple">Op<span class="highlightYellow">e</span>n</button>` +
`</div>`);

const newEventSettingsHtml = fragmentFromHTML(`` + 
`<div id="new-event-settings-container">` + 
  `<br/>` + 
  `<div>` + 
    `<input type="password" id="pw-value-1" class="pw-value input" value="" placeholder="Type your password here..." autocomplete="new-password">` + 
    `<br/>` + 
    `<input type="password" id="pw-value-2" class="pw-value input" value="" placeholder="Retype your password here...">` + 
    `<br/>` + 
    `<div id="lifetime-input-container">` + 
      `<span>` + 
        `<span>Hours till expiry: </span>` + 
        `<input type="number" min="1" max="9999" step="1" id="expiry-value" class="input" value="1">` + 
      `</span>` + 
      `<br/>` + 
      `<span>` +
	`<span>Number of uses: </span>` + 
        `<input type="number" min="1" max="9999" step="1" id="uses-value" class="input" value="1">` + 
      `</span>` + 
    `</div>` + 
  `</div>` + 
  `<button id="set-new-event-settings-values" class="box-shadow item-element-lnk-purple"><span class="highlightYellow">S</span>et</button>` +
`</div>`);

/* ===================================== */
/* BOXES =============================== */
/* ===================================== */
addHeaderBar(
	'Welcome to Polly-Cal', 
	headerOptions, 
	true
);

createTurboInfoBox(
	'new-event-settings', 
	'New Event Settings', 
	13, 
	45, 
	false, 
	true, 
	false, 
	false, 
	newEventSettingsHtml
);

createTurboInfoBox(
	'new-event-id', 
	'Id', 
	6, 
	45, 
	false, 
	false, 
	false, 
	false, 
	idHtml
);

createTurboInfoBox(
	'open-event', 
	'Open Id', 
	6, 
	45, 
	false, 
	true, 
	false, 
	false, 
	openEventHtml
);

createTurboInfoBox(
	'open-event-pw', 
	'Enter Passwort', 
	6, 
	45, 
	false, 
	true, 
	false, 
	false, 
	openEventPwHtml
);

createTurboBox(
	'new-event', 
	'New Event', 
	defaultBoxHeight, 
	defaultBoxWidth, 
	true, 
	true, 
	false, 
	newEventHtml, 
	false,
	false,
	'#event-description'
);

/* ===================================== */
/* INIT NEW EVENT FORM ================= */
/* ===================================== */
document.addEventListener("DOMContentLoaded", () => {
  generateCalendarGrid();
  getTimeZones();
  initDateTime();
});

function generateCalendarGrid(year = new Date().getFullYear()) {
    const displayYear = document.getElementById("calendar-grid-display-year")
    displayYear.textContent = year; 
    displayYear.dataset.year = year;

    const grid = document.getElementById("calendar-grid-content");
    grid.replaceChildren();

    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    const ISOWeeks = [];
    const monthStartColumn = {};     
    const monthClass = {};           

    months.forEach((m, i) => {
        monthClass[i] = i % 2 === 0 ? "month-even" : "month-odd";
    });
    
    // Weekday labels 
    weekdays.forEach((name, index) => {
        const label = document.createElement("div");
        label.className = "weekday-label";
        label.textContent = name;
        label.style.gridColumn = 1;
        label.style.gridRow = index + 2;

        grid.append(label);
    });


    let current = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year, 11, 31));

    let weekIndex = 0;
    let previousWeek = null;

    function weekdayToRowIndex(d) {
        const w = d.getUTCDay();
        return w === 0 ? 6 : w - 1;
    }

    // Cells
    while (current <= end) {
        const week = getISOWeek(current);

        if (previousWeek !== null && week !== previousWeek) {
            weekIndex++;
        }
        previousWeek = week;

        const row = weekdayToRowIndex(current);
        const col = weekIndex + 2;

        const dateStr = current.toISOString().slice(0, 10);
        const m = current.getMonth();

        if (weekIndex == ISOWeeks.length) {
            ISOWeeks.push(week);
        }

        if (!(m in monthStartColumn)) {
            monthStartColumn[m] = col;
        }

        const cell = document.createElement("div");
        cell.className = "day-cell " + monthClass[m];  
	      cell.title = dateStr;
        cell.dataset.date = dateStr;
        cell.style.gridColumn = col;
        cell.style.gridRow = row + 2;

	      cell.addEventListener("click", () => {
          const fromDate = document.getElementById('event-from-date');
          const toDate = document.getElementById('event-to-date');

	        const fromDateValid = isValidISODate(fromDate.value);
	        const toDateValid = isValidISODate(toDate.value);
	
	        if(!fromDateValid || toDateValid && fromDate.value !== toDate.value) {
	          fromDate.value = cell.dataset.date;
	          toDate.value = cell.dataset.date; 

	          markDateRange(fromDate.value, toDate.value); 

  	        return;
	        }

	        if(!toDateValid || fromDate.value === toDate.value) {
	          toDate.value = cell.dataset.date; 

	          if(toDate.value < fromDate.value){
		          toDate.value = fromDate.value;
		          fromDate.value = cell.dataset.date;
	          }

	          markDateRange(fromDate.value, toDate.value); 

  	        return;
	        }
        });

        grid.append(cell);

        current.setUTCDate(current.getUTCDate() + 1);
    }

    // Month labels 
    months.forEach((name, monthIndex) => {
        const col = monthStartColumn[monthIndex];
        if (!col) return;

        const label = document.createElement("div");
        label.className = "month-label " + monthClass[monthIndex];
        label.textContent = name;
        label.style.gridColumn = col;
        label.style.gridRow = 1;

        grid.append(label);
    });
	
    // ISO-week labels
    ISOWeeks.forEach((name, weekIndex) => {
        const col = weekIndex + 2;
        const label = document.createElement("div");
        const weekClass = weekIndex % 2 === 0 ? "iso-week-even" : "iso-week-odd";

        label.className = "iso-week-label " + weekClass; 
        label.textContent = name;
        label.style.gridColumn = col;
        label.style.gridRow = 9;

        grid.append(label);
    });

    const fromDate = document.getElementById('event-from-date');
    const toDate = document.getElementById('event-to-date');
    markDateRange(fromDate.value, toDate.value); 
}

function getTimeZones(){
  const timezones = Intl.supportedValuesOf("timeZone");
  const select = document.getElementById("event-timezone");
  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  select.replaceChildren();

  timezones.forEach(tz => {
      const offset = offsetOf(tz);
      const option = document.createElement("option");
      option.value = tz;
      option.textContent = `${tz} (${offset})`;
      if (tz === userTz) option.selected = true;

      select.append(option);
  });
}

function offsetOf(tz) {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        timeZoneName: "shortOffset"
    });
    const parts = fmt.formatToParts(now);
    const offset = parts.find(p => p.type === "timeZoneName").value;
    return offset.replace("GMT", "UTC");
}

function getISOWeek(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

function isValidISODate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const date = new Date(value);
    if (isNaN(date)) return false;

    const [y, m, d] = value.split("-").map(Number);

    return (
        date.getUTCFullYear() === y &&
        date.getUTCMonth() + 1 === m &&
        date.getUTCDate() === d
    );
}

function prevYear(){
  const year = parseInt(document.getElementById("calendar-grid-display-year").dataset.year);
  generateCalendarGrid(Math.max(1970, year - 1));
}

function nextYear(){
  const year = parseInt(document.getElementById("calendar-grid-display-year").dataset.year);
  generateCalendarGrid(Math.min(9999, year + 1));
}

function markDateRange(fromDate, toDate) {
    const container = document.getElementById("calendar-grid-content");
    if (!container) return;

    const from = new Date(fromDate);
    const to = new Date(toDate);

    const items = container.querySelectorAll("[data-date]");

    items.forEach(el => {
        const current = new Date(el.dataset.date);

        el.classList.remove("in-range", "selected");

        if (current >= from && current <= to) {
            el.classList.add("in-range");
        }

        if (current.getTime() === from.getTime()) {
            el.classList.add("selected");
            el.classList.add("start-range");
        }

        if (current.getTime() === to.getTime()) {
            el.classList.add("selected");
            el.classList.add("end-range");
        }
    });
}

function initDateTime() {
    const fromDate = document.getElementById('event-from-date');
    const toDate = document.getElementById('event-to-date');
    const startTime = document.getElementById('event-start-time');
    const endTime = document.getElementById('event-end-time');

    const today = new Date().toISOString().split("T")[0];

    fromDate.value = today;
    toDate.value = today; 
    startTime.value = "00:00";
    endTime.value = "23:59";

    markDateRange(fromDate.value, toDate.value);
}

function formatInTimezone(dateString, tz) {
  const date = new Date(dateString);

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const formatted = formatter.format(date);

  // Compute ISO week in the chosen timezone
  const dateInTZ = new Date(
    date.toLocaleString("en-US", { timeZone: tz })
  );
  const week = getISOWeek(dateInTZ);

  return {
    formatted,
    week
  };
}

function parseFormattedDate(x) {
  const str = x.formatted;
  const regex = /^([^,]+), (\d{1,2}) (\w+) (\d{4}) at (\d{1,2}:\d{2})$/;
  const match = str.match(regex);

  if (!match) return null;

  const [, weekday, day, month, year, time] = match;
  const week = x.week;

  return { weekday, day, month, year, time, week };
}

/* ===================================== */
/* SUBMIT EVENT ======================== */
/* ===================================== */
const newEventForm = document.getElementById('new-event-form');
const openEventForm = document.getElementById('open-event-form');

function clearForm(form) {
  form.reset();
  
  Array.from(form.elements).forEach(input => {
    if (input.type === 'checkbox' || input.type === 'radio') {
      input.checked = false;
    } else {
      input.value = '';
    }
  });

  getTimeZones(); 
  initDateTime();
}

function openEventBox(eventId, content, ics) {
  const openedIdBoxHtml = fragmentFromHTML(`` + 
  `<div class="opened-event-container">` + 
    `<div class="opened-event-content"></div>` + 
    `<div class="opened-event-url-container">` + 
      `<a class="download-ics btn box-shadow item-element-lnk-purple" href="#" download="event.ics">` +
        `<span class="highlightYellow">D</span>ownload ICS` +
      `</a>` + 
    `</div>` + 
  `</div>`);  
  openedIdBoxHtml.querySelector('.opened-event-container').style.height = (defaultBoxHeight * u_height - margin_scroll_v * 2) + "px";
  openedIdBoxHtml.querySelector('.opened-event-container').style.width = "calc(" + defaultBoxWidth + "ch - " + (margin_scroll_h * 2) + "px)";

  const safeId = eventId.replace(/[^a-zA-Z0-9_-]/g, '');

  const idAlreadyOpened = document.getElementById(safeId);
  if (idAlreadyOpened) {
    closeBox(idAlreadyOpened);
  }

  const box = createTurboBox(
	  safeId, 
	  safeId, 
	  defaultBoxHeight, 
	  defaultBoxWidth, 
	  true, 
	  false, 
	  true, 
	  openedIdBoxHtml, 
	  true,
	  true,
	  '.opened-event-content'
  ); 

  requestAnimationFrame(() => {
    renderOpenedEventBox(box, eventId, content, ics);
    setupIcsDownload(box, eventId, ics);
  });
}

function formatDateBlock(v) {
  if (!v) return "";

  return `${v.weekday}, ${v.day} ${v.month} ${v.year} at ${v.time} (Week ${v.week})`;
}

function renderOpenedEventBox(container, eventId, content, ics) {
  const root = container.querySelector(".opened-event-content");
  root.replaceChildren();

  const escape = (v) => (v === null || v === undefined) ? "" : String(v);

  // ---- Duration ----
  const start = new Date(content.start);
  const end = new Date(content.end);
  const ms = end - start;

  const days = Math.floor(ms / 86400e3);
  const hours = Math.floor((ms / 3600e3) % 24);
  const minutes = Math.floor((ms / 60000) % 60);

  // ---- Date formatting ----
  const start_fmt = parseFormattedDate(formatInTimezone(content.start, content.timezone));
  const end_fmt   = parseFormattedDate(formatInTimezone(content.end, content.timezone));

  const tz_offset = offsetOf(content.timezone);
  const timezoneLabel = `${content.timezone} (${tz_offset})`;

  const fields = [
    ["title", content.title],
    ["location", content.location],
    ["start", formatDateBlock(start_fmt)],
    ["end", formatDateBlock(end_fmt)],
    ["timezone", timezoneLabel],
    ["duration", `${days}d ${hours}h ${minutes}m`],
    ["description", content.description],
  ];

  for (const [key, value] of fields) {
    if (value === undefined || value === null || value === "") continue;

    const lines = escape(value).split("\n");

    lines.forEach((line, i) => {
      const row = document.createElement("span");
      row.className = key;

      const keySpan = document.createElement("span");
      keySpan.className = "key";
      keySpan.textContent = i === 0 ? key.padEnd(12, " ") : " ".repeat(13);

      const valSpan = document.createElement("span");
      valSpan.className = "value";
      valSpan.textContent = line;

      row.append(keySpan);
      row.append(valSpan);
      root.append(row);
      root.append(document.createElement("br"));
    });
  }
}

function setupIcsDownload(container, eventId, ics){
  const icsLink = container.querySelector(".download-ics");
  
  if (!icsLink || !ics) return;

  const blob = new Blob([ics], {
    type: 'text/calendar;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);

  icsLink.href = url;
  icsLink.download = `${eventId.replace(/[^a-zA-Z0-9_-]/g, '')}.ics`;

  icsLink.addEventListener('click', () => {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  });
}

async function submitOpenIdForm(rawInput = '', password = '') {
  if (!rawInput) return;

  const openEvent = document.getElementById('open-event');
  closeBox(openEvent);

  const segments = rawInput.split('/').filter(Boolean);
  const id = segments[segments.length - 1];
  if (!id) return;

  try {
    const headers = password ? { 'Authorization': 'Basic ' + btoa(':' + password) } : {};

    const response = await fetch(`/api/cal/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers,
    });

    const rawText = await response.text();

    let result = null;
    try {
      result = rawText ? JSON.parse(rawText) : null;
    } catch {
      // Plain text error
    }

    if (!response.ok) {
      const message = result?.message || rawText || "Unexpected error.";
      openResponseBox(response.status + ' ' + response.statusText, message)
      
      return; 
    }

    if (result?.status === 'success') {
      openEventBox(result.data.id, result.data.content, result.data.ics); 
    } else if (result?.status === 'protected') {
      const openEventPw = document.getElementById('open-event-pw');
      openEventPw.dataset.id = id;
      openBox('open-event-pw', true);
    } else {
      
      return;
    }

  } catch (err) {
    console.error('Error fetching event:', err);
  } finally {
    clearForm(openEventForm);
  }
}

async function autoLoadPaste(id) {
  await submitOpenIdForm(id);
}

async function submitNewEventForm() {
  const submitButton = newEventForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  const title = newEventForm.querySelector('input[name="title"]').value.trim();
  const location = newEventForm.querySelector('input[name="location"]').value.trim();
  const from = newEventForm.querySelector('input[name="from"]').value.trim();
  const to = newEventForm.querySelector('input[name="to"]').value.trim();
  const start = newEventForm.querySelector('input[name="start"]').value.trim();
  const end = newEventForm.querySelector('input[name="end"]').value.trim();
  const timezone = newEventForm.querySelector('select[name="timezone"]').value.trim();
  const description = newEventForm.querySelector('textarea[name="description"]').value.trim();

  if (title.length === 0)  {
    submitButton.disabled = false;
    return;
  }

  if (from.length === 0)  {
    submitButton.disabled = false;
    return;
  }

  if (to.length === 0)  {
    submitButton.disabled = false;
    return;
  }

  if (start.length === 0)  {
    submitButton.disabled = false;
    return;
  }

  if (end.length === 0)  {
    submitButton.disabled = false;
    return;
  }

  if (timezone.length === 0)  {
    submitButton.disabled = false;
    return;
  }

  const expiryInput = document.getElementById('new-event-expiry-value');
  const usesInput = document.getElementById('new-event-uses-value');

  const expiry = expiryInput.value ? Number(expiryInput.value) : 1;
  const uses = usesInput.value ? Number(usesInput.value) : 1;

  const password = document.getElementById('new-event-pw-value').value || '';

  // Build JSON payload
  const payload = {
    title,
    location,
    from,
    to,
    start,
    end,
    timezone,
    description,
    expiry,
    uses,
    password,
  };
	
  try {
    const response = await fetchWithPow('/api/cal', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const rawText = await response.text();

    let result = null;
    try {
      result = rawText ? JSON.parse(rawText) : null;
    } catch {
      // Plain text error
    }

    if (!response.ok) {
      const message = result?.message || rawText || "Unexpected error.";
      openResponseBox(response.status + ' ' + response.statusText, message)
      
      return; 
    }

    if (result?.status === 'success') {
      showEventId(result.id);
    } else {
      
      return;
    }

  } catch (err) {
    console.error('Error submitting event:', err);
  } finally {
    clearForm(newEventForm);
    submitButton.disabled = false;
  }
}

function showEventId(id) {
  const fullUrl = `${window.location.origin}/cal/${id}`;
  document.getElementById('event-id').value = fullUrl;
  openBox('new-event-id'); 
}

if (!openEventForm) {
} else {
  openEventForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const openEvent = document.getElementById('open-event');
    const cond_openEventActive = openEvent.classList.contains('active') && openEvent.classList.contains('top');

    if (cond_openEventActive) {
      const rawInput = document.getElementById('open-event-id').value.trim();
      submitOpenIdForm(rawInput);
    } 
  });
	
  clearForm(openEventForm);
}

if (!newEventForm) {
} else {
  newEventForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newEvent = document.getElementById('new-event');
    const cond_newEventActive = newEvent.classList.contains('active') && newEvent.classList.contains('top');

    if (cond_newEventActive) {
      submitNewEventForm();
    } 
  });

  const fromDate = document.getElementById('event-from-date');
  const toDate = document.getElementById('event-to-date');

  fromDate.addEventListener('change', () => {
    if(toDate.value === "") {
      toDate.value = fromDate.value;
    }

    const toDate_value = new Date(toDate.value);
    const fromDate_value = new Date(fromDate.value);

    if(fromDate_value > toDate_value) {
      toDate.value = fromDate.value
    }

    markDateRange(fromDate.value, toDate.value); 
    generateCalendarGrid(fromDate_value.getFullYear());
  });
	
  toDate.addEventListener('change', () => {
    if(fromDate.value === "") {
      fromDate.value = toDate.value;
    }

    const toDate_value = new Date(toDate.value);
    const fromDate_value = new Date(fromDate.value);

    if(toDate_value < fromDate_value) {
      fromDate.value = toDate.value; 
    }

    markDateRange(fromDate.value, toDate.value); 
    generateCalendarGrid(toDate_value.getFullYear());
  });

  clearForm(newEventForm);
}

/* ===================================== */
/* SUBMIT PASSWORD ===================== */
/* ===================================== */
function openProtectedId() {
  let password = ''; 

  const pwInput = document.getElementById('open-event-pw-value');
  if (pwInput && pwInput.value.trim()) {
    password = pwInput.value.trim();
    pwInput.value = '';
  }
 
   const openEventPw = document.getElementById('open-event-pw');
   const id = openEventPw.dataset.id;

   closeBox(openEventPw);
   submitOpenIdForm(id, password);
}

/* ===================================== */
/* APPLY SETTIGNS ====================== */
/* ===================================== */
function applySettings() {
  const settings = document.getElementById('new-event-settings'); 
  const pwValue1 = document.getElementById('pw-value-1').value; 
  const pwValue2 = document.getElementById('pw-value-2').value; 

  if (pwValue1 !== pwValue2){
	settings.querySelectorAll('.pw-value').forEach(x => {
      x.value = '';
    });
	
    const input = document.getElementById('pw-value-1');
    input.focus();
	
    return;
  }

  const expiry = document.getElementById('expiry-value');
  const expiryValue = Number(expiry.value.trim().replace(/[^\d.-]/g, ''));
  const expiryMin = Number(expiry.min);
  const expiryMax = Number(expiry.max);
  
  if(isNaN(expiryValue) || !isFinite(expiryValue)) {
    expiry.value = 1;

    return;
  }

  if(expiryValue < expiryMin || expiryValue > expiryMax) {
    expiry.value = 1;

    return;
  }

  const uses = document.getElementById('uses-value');
  const usesValue = Number(uses.value.trim().replace(/[^\d.-]/g, ''));
  const usesMin = Number(uses.min);
  const usesMax = Number(uses.max);
  
  if(isNaN(usesValue) || !isFinite(usesValue)) {
    uses.value = 1;

    return;
  }

  if(usesValue < usesMin || usesValue > usesMax) {
    uses.value = 1;

    return;
  }
  
  document.getElementById('new-event-pw-value').value = pwValue1;
  document.getElementById('new-event-expiry-value').value = expiryValue;
  document.getElementById('new-event-uses-value').value = usesValue;

  settings.querySelectorAll('.pw-value').forEach(x => {
    x.value = '';
  });
  expiry.value = 1;
  uses.value = 1;

  closeBox(settings);
}

/* ===================================== */
/* COPY ID ============================= */
/* ===================================== */
function copyId() {
  if (document.querySelector('#new-event-id.active.top') === null){
    return;
  }

  const eventId = document.getElementById('event-id');

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(eventId.value);
  } else {
    console.error("Clipboard API not supported");
  }

  eventId.classList.add('content-copied');

  setTimeout(() => {
    eventId.classList.remove('content-copied');
  }, 500);
}

document.getElementById('copy-event-id').addEventListener('click', () => {
  copyId();
});

/* ===================================== */
/* BUTTONS ============================= */
/* ===================================== */
document.addEventListener('click', (e) => {
  const t = e.target;
	
  if (t?.id === 'open-new-event-settings' || t?.parentElement.id === 'open-new-event-settings'){
    openBox('new-event-settings', true); 
  }

  if (t?.id === 'set-new-event-settings-values' || t?.parentElement.id === 'set-new-event-settings-values'){
    applySettings();
  }

  if (t?.id === 'submit-open-event-pw' || t?.parentElement.id === 'submit-open-event-pw'){
    openProtectedId();
  }

  if (t?.id === 'calendar-grid-prev-year' || t?.parentElement.id === 'calendar-grid-prev-year'){
    prevYear();
  }

  if (t?.id === 'calendar-grid-next-year' || t?.parentElement.id === 'calendar-grid-next-year'){
    nextYear(); 
  }
});

/* ===================================== */
/* KEY MAPPING ========================= */
/* ===================================== */
window.pageKeymap = {
  H: (e) => window.location.href = document.getElementById('back-to-home').href,
  N: (e) => openBox('new-event', true),
  G: (e) => openBox('open-event', true),
  U: (e) => openBox('about'),

  T: handleCalKey,
  S: handleCalKey,
  E: handleCalKey,
  O: handleCalKey,
  C: handleCalKey,
  D: handleCalKey,
};

function handleCalKey(e) {
  const key = e.key.toUpperCase();
  const settings = document.getElementById('new-event-settings');
  const openEvent = document.getElementById('open-event');
  const openEventPw = document.getElementById('open-event-pw');
  const openedEvent = document.querySelector('.box.active.top .opened-event-container');
  const openedEventIcsUrl = openedEvent?.querySelector('.download-ics');
  const newEvent = document.getElementById('new-event');
  const id = document.getElementById('new-event-id');

  const cond_openEventActive = openEvent.classList.contains('active') && openEvent.classList.contains('top');
  const cond_openedEventIcsAvailable = openedEvent && openedEventIcsUrl.getAttribute('href') !== '#';
  const cond_newEventActive = newEvent.classList.contains('active') && newEvent.classList.contains('top');
  const cond_idActive = id.classList.contains('active') && id.classList.contains('top');
  const cond_settingsActive = settings.classList.contains('active') && settings.classList.contains('top');
  const cond_idPwActive = openEventPw.classList.contains('active') && openEventPw.classList.contains('top');

  // Download ICS 
  if (cond_openedEventIcsAvailable && key == 'D') {
    openedEventIcsUrl.click(); 
  }

  // Open settings
  if (cond_newEventActive && key == 'T') {
    openBox('new-event-settings', true);
  }

  // Set settings
  if (cond_settingsActive && key == 'S') {
    applySettings(); 
  }
  
  // Submit open id form
  if (cond_openEventActive && key == 'E') {
    const rawInput = document.getElementById('open-event-id').value.trim();
    submitOpenIdForm(rawInput);
  }

  if (cond_idPwActive && key == 'E') {
    openProtectedId();
  }

  // Submit new event form
  if (cond_newEventActive && key == 'O') {
    submitNewEventForm();
  }
    
  // Copy id
  if (cond_idActive && key == 'C') {
    copyId();
  }
}

/* ===================================== */
/* AUTO LOAD FROM URL ================== */
/* ===================================== */
window.addEventListener('load', () => {
  setTimeout(() => {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);

    if (segments[0] === 'cal' && segments[1]) {
      autoLoadPaste(segments[1]);
    }
  }, 50);
});
