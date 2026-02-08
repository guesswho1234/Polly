/* ===================================== */
/* BOX CONTENT ========================= */
/* ===================================== */
const headerOptions = [
  {
    id: 'option-services',
    onClick: () => openBox('services'),
    hotkey: 'S',
    text_before: '',
    text_after: 'ervices',
  },
  {
    id: 'option-about',
    onClick: () => openBox('about'),
    hotkey: 'u',
    text_before: 'Abo',
    text_after: 't',
  }
];

const servicesHtml = fragmentFromHTML(`<div><div class="services-container box-shadow"><div class="services-list"><span class="item-element"><a class="item-element-url item-element-lnk-purple" href="/bin" data-key="B">🗒️ <span class="item-element-key highlightRed">B</span>in</a></span><span class="item-element"><a class="item-element-url item-element-lnk-purple" href="/cal" data-key="C">📅 <span class="item-element-key highlightRed">C</span>al</a></span><span class="item-element"><a class="item-element-url item-element-lnk-purple" href="/ask" data-key="A">📊 <span class="item-element-key highlightRed">A</span>sk</a></span></div></div><p class="prompt"><br/><span class="prompt-message">Select your service...</span><span class="prompt-cursor"></span></p></div>`);

/* ===================================== */
/* BOXES =============================== */
/* ===================================== */
addHeaderBar(
	'Welcome to Polly', 
	headerOptions, 
	false
);

createTurboBox(
	'services', 
  'Services', 
	defaultBoxHeight, 
	defaultBoxWidth, 
	true, 
	false, 
	false, 
	servicesHtml, 
	false
);

/* ===================================== */
/* SERVICE INTERACTION ================= */
/* ===================================== */
const links = document.querySelectorAll('.item-element-url'); // hyperlinks

const resetSelection = () => {
  links.forEach(lnk => lnk.classList.remove('selected'));
  
  if(document.querySelector('.box.active .prompt-message') !== null){
	document.querySelector('.box.active .prompt-message').textContent = `Select your service...`;
  }
};

const launchService = (element) => {
  if(document.querySelector('.box.active .prompt-message') === null){
	return;
  }
  
  const msg = document.querySelector('.box.active .prompt-message');
  msg.textContent = 'Launching ';

  const b = document.createElement('b');
  b.className = 'highlightYellow';
  b.textContent = element.textContent.trim();

  msg.append(b);
  msg.append('...');

  setTimeout(() => {
    const url = new URL(element.href, window.location.origin);
     
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      window.location.href = url.href;
    }
    resetSelection();
  }, 500);
};

// Reset selection on hover
links.forEach(lnk => {
  lnk.addEventListener('mouseenter', () => {
	resetSelection();
  });
  
  lnk.addEventListener('click', (evt) => {
	evt.preventDefault();
	if (!lnk) return;  
	launchService(lnk);
  });
});

/* ===================================== */
/* KEY MAPPING ========================= */
/* ===================================== */
window.pageKeymap = {
  S: (e) => openBox('services'),
  U: (e) => openBox('about'),

  C: handleServiceKey,
  B: handleServiceKey,
  A: handleServiceKey,
};

function handleServiceKey(e) {
  const key = e.key.toUpperCase();
  const services = document.getElementById('services');

  if (!services) return;

  const cond_servicesActive = services.classList.contains('active') && services.classList.contains('top');

  if (!cond_servicesActive) {
    resetSelection();
    return;
  }

  // Clear previous selection
  links.forEach(lnk => lnk.classList.remove('selected'));

  // Find link corresponding to the key and launch
  const lnk = Array.from(links).find(lnk => lnk.dataset.key === key);
  launchService(lnk);
}
