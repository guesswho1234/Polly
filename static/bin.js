/* ===================================== */
/* AUTO LOAD PASTE FROM URL ============ */
/* ===================================== */
window.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);

  if (segments[0] === 'bin' && segments[1]) {
    const id = segments[1];
    submitOpenIdForm(id);
  }
});

/* ===================================== */
/* BOX CONTENT ========================= */
/* ===================================== */
const headerOptions = [
  {
    id: 'option-new-paste',
    onClick: () => openBox('new-paste', true),
    hotkey: 'N',
    text_before: '',
    text_after: 'ew',
  },
  {
    id: 'option-open-paste',
    onClick: () => openBox('open-paste', true),
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

const newPasteHtml = fragmentFromHTML(`` +
`<div id="new-paste-container">` +
 `<form id="new-paste-form" method="post">` +
   `<input id="new-paste-pw-value" type="hidden" name="password">` +
   `<input id="new-paste-expiry-value" type="hidden" name="expiry">` +
   `<input id="new-paste-uses-value" type="hidden" name="uses">` +
   `<textarea id="paste-content" class="input" maxlength="300000" name="content" placeholder="Type or paste your text here..."></textarea>` +
   `<div class="new-paste-button-container">` +
     `<button id="open-new-paste-settings" class="box-shadow item-element-lnk-purple" type="button">Se<span class="highlightYellow">t</span>tings</button>` +
     `<button id="submit-paste-content" class="box-shadow item-element-lnk-purple" type="submit">P<span class="highlightYellow">o</span>st</button>` +
   `</div>` +
 `</form>` +
`</div>`);
newPasteHtml.querySelector('#new-paste-container').style.height = (defaultBoxHeight * u_height - margin_scroll_v * 2) + "px";
newPasteHtml.querySelector('#new-paste-container').style.width = "calc(" + defaultBoxWidth + "ch - " + (margin_scroll_h * 2) + "px)";

const idHtml = fragmentFromHTML(`` + 
`<div id="id-container">` +
  `<br/>` +
  `<div>` +
    `<input type="text" id="paste-id" value="" readonly>` +
  `</div>` +
  `<button id="copy-paste-id" class="box-shadow item-element-lnk-purple"><span class="highlightYellow">C</span>opy</button>` +
`</div>`);

const openPasteHtml = fragmentFromHTML(`` +
`<div id="open-paste-container">` +
  `<br/>` +
  `<form id="open-paste-form" method="get">` +
    `<div>` +
      `<input type="text" id="open-paste-id" class="input" value="" name="id" placeholder="Type or paste the id to open here...">` +
    `</div>` +
    `<div class="new-paste-button-container">` +
      `<button id="submit-open-paste" class="box-shadow item-element-lnk-purple">Op<span class="highlightYellow">e</span>n</button>` +
    `</div>` +
  `</form>` +
`</div>`);

const openPastePwHtml = fragmentFromHTML(`` +
`<div id="open-paste-pw-container">` +
  `<br/>` +
  `<div>` +
    `<input type="password" id="open-paste-pw-value" class="pw-value input" value="" placeholder="Type in password here...">` +
  `</div>` +
  `<button id="submit-open-paste-pw" class="box-shadow item-element-lnk-purple">Op<span class="highlightYellow">e</span>n</button>` +
`</div>`);

const newPasteSettingsHtml = fragmentFromHTML(`` +
`<div id="new-paste-settings-container">` +
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
  `<button id="set-new-paste-settings-values" class="box-shadow item-element-lnk-purple"><span class="highlightYellow">S</span>et</button>` +
`</div>`);

/* ===================================== */
/* BOXES =============================== */
/* ===================================== */
addHeaderBar(
	'Welcome to Polly-Bin', 
	headerOptions, 
	true
);

createTurboInfoBox(
	'new-paste-settings', 
	'New Paste Settings', 
	13, 
	45, 
	false, 
	true, 
	false, 
	false, 
	newPasteSettingsHtml
);

createTurboInfoBox(
	'new-paste-id', 
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
	'open-paste', 
	'Open Id', 
	6, 
	45, 
	false, 
	true, 
	false, 
	false, 
	openPasteHtml
);

createTurboInfoBox(
	'open-paste-pw', 
	'Enter Passwort', 
	6, 
	45, 
	false, 
	true, 
	false, 
	false, 
	openPastePwHtml
);

createTurboBox(
	'new-paste', 
	'New Paste', 
	defaultBoxHeight, 
	defaultBoxWidth, 
	true, 
	true, 
	false, 
	newPasteHtml, 
	false,
	false,
	'#paste-content'
);

/* ===================================== */
/* SUBMIT EVENT ======================== */
/* ===================================== */
const newPasteForm = document.getElementById('new-paste-form');
const openPasteForm = document.getElementById('open-paste-form');

function clearForm(form) {
  form.reset();
  
  Array.from(form.elements).forEach(input => {
    if (input.type === 'checkbox' || input.type === 'radio') {
      input.checked = false;
    } else {
      input.value = '';
    }
  });
}

function openPasteBox(pasteId, content) {
  const openedIdBoxHtml = fragmentFromHTML(`` +
  `<div class="opened-paste-container">` +
    `<textarea class="input opened-paste-content" readonly></textarea>` +
    `<div class="opened-paste-button-container">` + 
      `<button id="copy-opened-paste-content" class="box-shadow item-element-lnk-purple"><span class="highlightYellow">C</span>opy</button>` +
    `</div>` + 
  `</div>`);
  openedIdBoxHtml.querySelector('.opened-paste-container').style.height = (defaultBoxHeight * u_height - margin_scroll_v * 2) + "px";
  openedIdBoxHtml.querySelector('.opened-paste-container').style.width = "calc(" + defaultBoxWidth + "ch - " + (margin_scroll_h * 2) + "px)";
  openedIdBoxHtml.querySelector('textarea').textContent = content;

  const safeId = pasteId.replace(/[^a-zA-Z0-9_-]/g, '');

  const idAlreadyOpened = document.getElementById(safeId);
  if (idAlreadyOpened) {
    closeBox(idAlreadyOpened);
  }

  createTurboBox(
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
    'textarea.input'
  );

  document.getElementById('copy-opened-paste-content').addEventListener('click', () => {
    copyContent();
  }); 
}

async function submitOpenIdForm(rawInput = '', password = '') {
  if (!rawInput) return;

  const openPaste = document.getElementById('open-paste');
  closeBox(openPaste);

  const segments = rawInput.split('/').filter(Boolean);
  const id = segments[segments.length - 1];
  if (!id) return;

  try {
    const headers = password ? { 'Authorization': 'Basic ' + btoa(':' + password) } : {};

    const response = await fetch(`/api/bin/${encodeURIComponent(id)}`, {
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
      openPasteBox(result.data.id, result.data.content);
    } else if (result?.status === 'protected') {
      const openPastePw = document.getElementById('open-paste-pw');
      openPastePw.dataset.id = id;
      openBox('open-paste-pw', true);
    } else {
      
      return;
    }

  } catch (err) {
    console.error('Error fetching paste:', err);
  } finally {
    clearForm(openPasteForm);
  }
}

async function submitNewPasteForm() {
  const submitButton = newPasteForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  const content = newPasteForm.querySelector('textarea[name="content"]').value.trim();

  if (!content) {
    submitButton.disabled = false;
    return;
  }

  const expiryInput = document.getElementById('new-paste-expiry-value');
  const usesInput = document.getElementById('new-paste-uses-value');

  const expiry = expiryInput.value ? Number(expiryInput.value) : 1;
  const uses = usesInput.value ? Number(usesInput.value) : 1;

  const password = document.getElementById('new-paste-pw-value').value || '';

  // Build JSON payload
  const payload = {
    content,
    expiry,
    uses,
    password,
  };

  try {
    const response = await fetchWithPow('/api/bin', {
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
      showPasteId(result.id);
    } else {
      
      return;
    }

  } catch (err) {
    console.error('Error submitting paste:', err);
  } finally {
    clearForm(newPasteForm);
    submitButton.disabled = false;
  }
}

function showPasteId(id) {
  const fullUrl = `${window.location.origin}/bin/${id}`;
  document.getElementById('paste-id').value = fullUrl;
  openBox('new-paste-id'); 
}

if (!openPasteForm) {
} else {
  openPasteForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const openPaste = document.getElementById('open-paste');
    const cond_openPasteActive = openPaste.classList.contains('active') && openPaste.classList.contains('top');

    if (cond_openPasteActive) {
      const rawInput = document.getElementById('open-paste-id').value.trim();
      submitOpenIdForm(rawInput);
    } 
  });
	
  clearForm(openPasteForm);
}

if (!newPasteForm) {
} else {
  newPasteForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPaste = document.getElementById('new-paste');
    const cond_newPasteActive = newPaste.classList.contains('active') && newPaste.classList.contains('top');

    if (cond_newPasteActive) {
      submitNewPasteForm();
    } 
  });
	
  clearForm(newPasteForm);
}

/* ===================================== */
/* SUBMIT PASSWORD ===================== */
/* ===================================== */
function openProtectedId() {
  let password = ''; 

  const pwInput = document.getElementById('open-paste-pw-value');
  if (pwInput && pwInput.value.trim()) {
    password = pwInput.value.trim();
    pwInput.value = '';
  }
 
   const openPastePw = document.getElementById('open-paste-pw');
   const id = openPastePw.dataset.id;

   closeBox(openPastePw);
   submitOpenIdForm(id, password);
}

/* ===================================== */
/* APPLY SETTIGNS ====================== */
/* ===================================== */
function applySettings() {
  const settings = document.getElementById('new-paste-settings'); 
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
  
  document.getElementById('new-paste-pw-value').value = pwValue1;
  document.getElementById('new-paste-expiry-value').value = expiryValue;
  document.getElementById('new-paste-uses-value').value = usesValue;

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
  if (document.querySelector('#new-paste-id.active.top') === null){
    return;
  }

  const pasteId = document.getElementById('paste-id');

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(pasteId.value);
  } else {
    console.error("Clipboard API not supported");
  }  

  pasteId.classList.add('content-copied');

  setTimeout(() => {
    pasteId.classList.remove('content-copied');
  }, 500);
}

document.getElementById('copy-paste-id').addEventListener('click', () => {
  copyId();
});

/* ===================================== */
/* COPY CONTENT ======================== */
/* ===================================== */
function copyContent() {
  if (document.querySelector('.box.active.top .opened-paste-content') === null){
    return;
  }

  const content = document.querySelector('.box.active.top .opened-paste-content');

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(content.value);
  } else {
    console.error("Clipboard API not supported");
  }

  content.classList.add('content-copied');

  setTimeout(() => {
    content.classList.remove('content-copied');
  }, 1000);
}



/* ===================================== */
/* BUTTONS ============================= */
/* ===================================== */
document.addEventListener('click', (e) => {
  const t = e.target;
	
  if (t?.id === 'open-new-paste-settings' || t?.parentElement?.id === 'open-new-paste-settings'){
    openBox('new-paste-settings', true); 
  }

  if (t?.id === 'set-new-paste-settings-values' || t?.parentElement.id === 'set-new-paste-settings-values'){
    applySettings();
  }

  if (t?.id === 'submit-open-paste-pw' || t?.parentElement.id === 'submit-open-paste-pw'){
    openProtectedId();
  }
});

/* ===================================== */
/* KEY MAPPING ========================= */
/* ===================================== */
window.pageKeymap = {
  H: (e) => window.location.href = document.getElementById('back-to-home').href,
  N: (e) => openBox('new-paste', true),
  G: (e) => openBox('open-paste', true),
  U: (e) => openBox('about'),

  T: handleBinKey,
  S: handleBinKey,
  E: handleBinKey,
  O: handleBinKey,
  C: handleBinKey,
};

function handleBinKey(e) {
  const key = e.key.toUpperCase();
  const settings = document.getElementById('new-paste-settings');
  const openPaste = document.getElementById('open-paste');
  const openPastePw = document.getElementById('open-paste-pw');
  const openedPaste = document.querySelector('.box.active.top .opened-paste-container');
  const newPaste = document.getElementById('new-paste');
  const id = document.getElementById('new-paste-id');

  const cond_openPasteActive = openPaste.classList.contains('active') && openPaste.classList.contains('top');
  const cond_newPasteActive = newPaste.classList.contains('active') && newPaste.classList.contains('top');
  const cond_idActive = id.classList.contains('active') && id.classList.contains('top');
  const cond_settingsActive = settings.classList.contains('active') && settings.classList.contains('top');
  const cond_idPwActive = openPastePw.classList.contains('active') && openPastePw.classList.contains('top');
  const cond_openedPaste = openedPaste;

  // Open settings
  if (cond_newPasteActive && key == 'T') {
    openBox('new-paste-settings', true);
  }

  // Set settings
  if (cond_settingsActive && key == 'S') {
    applySettings(); 
  }
  
  // Submit open id form
  if (cond_openPasteActive && key == 'E') {
    const rawInput = document.getElementById('open-paste-id').value.trim();
    submitOpenIdForm(rawInput);
  }

  if (cond_idPwActive && key == 'E') {
    openProtectedId();
  }

  // Submit new paste form
  if (cond_newPasteActive && key == 'O') {
    submitNewPasteForm();
  }
    
  // Copy id
  if (cond_idActive && key == 'C') {
    copyId();
  }    

  // Copy content
  if (cond_openedPaste && key == 'C') {
    copyContent();
  }
}
  
