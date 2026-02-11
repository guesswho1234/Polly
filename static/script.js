/* ===================================== */
/* HEIGHT UNITS ======================== */
/* ===================================== */
const u_height = 19;
const margin_scroll_v = 19;
const margin_scroll_h = 10;

const defaultBoxHeight = 24;
const defaultBoxWidth = 77;

/* ===================================== */
/* PROOF OF WORK ======================= */
/* ===================================== */
function countLeadingBits(hash) {
  let bits = 0;
  for (const b of hash) {
    for (let i = 7; i >= 0; i--) {
      if ((b & (1 << i)) === 0) bits++;
      else return bits;
    }
  }
  return bits;
}

async function solvePow(challenge, difficulty) {
  let nonce = 0;
  const encoder = new TextEncoder();

  while (true) {
    const data = new Uint8Array([...encoder.encode(challenge), ...encoder.encode(nonce.toString())]);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hash = new Uint8Array(hashBuffer);

    if (countLeadingBits(hash) >= difficulty) {
      const hex = Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
      return { nonce: nonce.toString(), hash: hex };
    }

    nonce++;
  }
}

async function fetchWithPow(url, options = {}) {
  let response = await fetch(url, options);

  // Server does not require PoW
  if (response.status !== 428) {
    return response;
  }

  // Server demands PoW
  const challenge = response.headers.get('X-POW-Challenge');
  const difficulty = Number(response.headers.get('X-POW-Difficulty'));

  if (!challenge || !difficulty) {
    return response; 
  }

  const { nonce, hash } = await solvePow(challenge, difficulty);

  options.headers = {
    ...(options.headers || {}),
    'X-POW-Challenge': challenge,
    'X-POW-Nonce': nonce,
    'X-POW-Hash': hash,
  };

  return fetch(url, options);
}

/* ===================================== */
/* HTML TEMPLATES ====================== */
/* ===================================== */
/**
 * WARNING: html must be trusted, static markup only.
 * Never pass user input.
 */
function fragmentFromHTML(html) {
  if (typeof html !== 'string') {
    throw new TypeError('HTML must be a string');
  }
  return document.createRange().createContextualFragment(html);
}

/* ===================================== */
/* BOX FUNCTIONS ======================= */
/* ===================================== */
function openBox(id, focusInput = false){
  const element = document.getElementById(id);	

  if(element === null){
    return;
  }	
	
  if(document.querySelectorAll('.turbo-infobox.active').length > 0){
    return;  
  }
  
  document.querySelectorAll('.box').forEach(b => b.classList.remove('top'));
  element.classList.add('active');
  setBoxTop(element, focusInput);
};

function openResponseBox(r_status, r_statusText){
  document.getElementById('response-status').textContent = r_status;
  document.getElementById('response-message').textContent = r_statusText;

  openBox('response', false);
}
  
function resetBoxTop(){
  document.querySelectorAll('.box.top').forEach(x => { 
    x.closest('.box').classList.remove('top');
  });
}

function setBoxTop(element, focusInput = false){
  const container = document.getElementById('turbo-box-container');
  container.append(element);
  element.classList.add('top');	
  
  if(focusInput){
    focusFirstInput(element);
  }
}

function focusFirstInput(element){
  const input = element.querySelector('input:not([type="hidden"]):not([disabled]), textarea:not([disabled])');
  
  if(input){
    input.focus();
  }
}

function getCurrentBoxTop(focusInput = false){
  if(document.querySelectorAll('.box.active.top').length !== 0){
    return;
  }
  
  if(document.querySelectorAll('.box.active').length === 0){
    return;
  }	  
    
  let boxes = null;
    
  if(document.querySelectorAll('.turbo-infobox.active').length > 0){
	  boxes = document.querySelectorAll('.turbo-infobox.active');  
  } else {
	  boxes = document.querySelectorAll('.box.active');  
  }
  
  if(boxes === null){
    return;
  }
    
  const topBox = boxes[boxes.length - 1];
  topBox.classList.add('top');
  
  if(focusInput){
    focusFirstInput(topBox);
  }
}

function closeBox(element, focusInput = false){
  element.classList.remove('active');
    
  if(element.classList.contains('removeOnClose')){
  	element.remove(); 
  }
 
  resetBoxTop();
  getCurrentBoxTop(focusInput);
};

function setBoxToBackground() {	
  if(document.querySelectorAll('.turbo-infobox.active').length > 0){
    return;  
  }

  const activeBoxes = Array.from(document.querySelectorAll('.box.active'));

  if (activeBoxes.length <= 1) {
    return; 
  }

  const currentTop = document.querySelector('.box.active.top');
  currentTop.classList.remove('top');

  if (!currentTop) {
    return;
  }

  const currentIndex = activeBoxes.indexOf(currentTop);
  const nextIndex = (currentIndex + 1) % activeBoxes.length;
  const nextBox = activeBoxes[nextIndex];

  setBoxTop(nextBox, false);
}

function fitTurboContainerDimensions(width = 0, height = 0){
  const minWidth = 50;
  const minHeight = 0;
  
  const turboContainer = document.getElementById('turbo-box-container');
  
  let setWidth = Math.max(minWidth, width);
  let setHeight = Math.max(minHeight, height);
  	
  document.querySelectorAll('.box.active').forEach(b => { 
    setWidth = Math.max(b.dataset.width, setWidth);
    setHeight = Math.max(b.dataset.height, setHeight);
  });
  
  turboContainer.setAttribute('data-width', setWidth);
  turboContainer.setAttribute('data-height', setHeight);
	
  turboContainer.style.width = `${setWidth}ch`;
  turboContainer.style.height = `${setHeight * u_height}px`;
}

function randomSafeHtmlAscii() {
  const unsafe = new Set(['<', '>', '&', '"', "'", '/', '`', '=', '\n', '\r']);
  const safeAscii = Array.from({ length: 95 }, (_, i) =>
    String.fromCharCode(i + 32)
  ).filter(ch => !unsafe.has(ch))
        ;
  return safeAscii[Math.floor(Math.random() * safeAscii.length)];
}

function randomAsciiString(length = 1) {
  return Array.from({ length }, randomSafeHtmlAscii).join('');
}

/* ===================================== */
/* BOX CREATORS ======================== */
/* ===================================== */
function createTurboContainer(){
  const id = 'turbo-container';

  if(document.getElementById(id) !== null) {
    return;
  }

  const container = document.createElement('div');
  container.id = id;
  document.body.append(container);

  return container;
}

function createTurboBoxContainer(){
  const id = 'turbo-box-container';

  if(document.getElementById(id) !== null) {
    return;
  }

  const boxContainer = document.createElement('div');
  boxContainer.id = id;
  document.getElementById('turbo-container').append(boxContainer);

  return boxContainer;
} 

function addHeaderBar(title, options, home = true){
  const id = 'header-bar';
  const turboContainer = document.getElementById('turbo-container');
  
  if(document.getElementById(id) !== null) {
    return;
  }
	
  const headerBar = fragmentFromHTML(`` +
  `<div id="header-bar">` +
    `<span class="header-options"></span>` +
    `<div class="title-bar">` +
      `<div>` +
        `<a href="/">` +
          `<img src="/logo.svg" alt="Polly Logo">` +
        `</a>` +
        `<span class="header-title"></span>` +
      `</div>` +
    `</div>` +
  `</div>`);
  headerBar.querySelector('.header-title').textContent = title;
  
  if(home){
    const backToHome = fragmentFromHTML(`` +
    `<a id="back-to-home" href="/" class="item-element-lnk-purple">` +
      `<span class="highlightRed">H</span>ome</span>` +
    `</a>`);

	  headerBar.querySelector('#header-bar').append(backToHome);
  }

  options.forEach(x => {
    const option = fragmentFromHTML(`` +
    `<span>` +
      `<span class="header-option item-element-lnk-purple">` +
        `<span class="option-text-before"></span>` +
        `<span class="option-text-hotkey highlightRed"></span>` +
        `<span class="option-text-after"></span>` +
      `</span>` +
    `</span>`);
    option.querySelector('.option-text-before').textContent = x.text_before;
    option.querySelector('.option-text-hotkey').textContent = x.hotkey;
    option.querySelector('.option-text-after').textContent = x.text_after;
    option.querySelector('.header-option').addEventListener('click', x.onClick);

    headerBar.querySelector('.header-options').append(option);
  });

  turboContainer.prepend(headerBar);  

  return headerBar;
}

function addFooterBar(items){
  const id = 'footer-bar';
  const turboContainer = document.getElementById('turbo-container');
	
  if(document.getElementById(id) !== null) {
    return;
  }

  const footerBar = fragmentFromHTML(`` +
  `<div id="footer-bar">` +
    `<span class="footer-items"></span>` +
  `<div>`);

  items.forEach(x => {
    const item = fragmentFromHTML(`` +
    `<span>` +
      `<span class="footer-item">` +
        `<span class="global-hotkey highlightRed"></span>` +
      `<span class="global-hotkey-function"></span>` +
    `</span>`);
    item.querySelector('span').id = x.id;
    item.querySelector('.global-hotkey').textContent = x.hotkey;
    item.querySelector('.global-hotkey-function').textContent = x.func;

    footerBar.querySelector('.footer-items').append(item);
  });

  turboContainer.append(footerBar);  

  return footerBar;
}

function createTurboBox(id, title, height, width, show = false, focusInput = false, removeOnClose = false, content = null, saved = false, asciiBackground = false, target = ''){
  if(document.querySelectorAll('.turbo-infobox.active').length > 0){
    return;
  }	

  resetBoxTop();
  
  const minWidthTop = 18;
  const minWidthMiddle = 2;
  const minWidthBottom = 14;
  const minHeight = 6;	
  
  const baseWidth = Math.max(width, minWidthTop, minWidthMiddle, minWidthBottom);
  const extraWidthTop = Math.max(0, title.length - (baseWidth - minWidthTop));
  const totalWidth = baseWidth + extraWidthTop;
  const fillWidthTop = totalWidth - title.length - minWidthTop;
  const fillWidthMiddle = totalWidth - minWidthMiddle;
  const fillWidthBottom = totalWidth - minWidthBottom;
  
  const baseHeight = Math.max(height, minHeight);
  const extraHeight = baseHeight - minHeight;
  
  const boxIndex = document.querySelectorAll('.box').length + 1;
  const turboBoxIndex = document.querySelectorAll('.turbo-box').length + 1;
  
  // Generate fill content
  let fillOne = '';
  let fillTwo = '';
  for (let i = 0; i < fillWidthTop; i++){
    if (i % 2 === 0){
      fillOne += '═';
    } else {
      fillTwo += '═';
    }
  }
 
  let middleFill = () => ' '.repeat(fillWidthMiddle);
  if(asciiBackground) {
    middleFill = () => randomAsciiString(fillWidthMiddle);
  }
  const bottomFill = '▒'.repeat(fillWidthBottom);

  // Create the container div
  const box = document.createElement('div');
  
  if(id !== "" && id !== null && id !== undefined){
    box.id = id;
  }
  
  box.className = 'box turbo-box' + (show ? ' active top' : '') + (removeOnClose ? ' removeOnClose' : '') + (saved ? ' saved' : '');
  
  box.setAttribute('data-width', totalWidth);
  box.setAttribute('data-height', baseHeight);
  box.setAttribute('data-minWidth', Math.max(minWidthTop, minWidthMiddle, minWidthBottom));
  box.setAttribute('data-minHeight', minHeight);
  box.setAttribute('data-index', turboBoxIndex);
  if (target !== '' && target.length > 0) box.setAttribute('data-target', target);
  box.style.width = `${totalWidth}ch`;
  box.style.height = `${baseHeight * u_height}px`;
  
  // First line
  let boxInnerHtmlContent = `<div class="turbo-border first-line">╔═[<div class="b-exit item-element-lnk-brown">▪</div>]══<span class="box-top-fill-half-one"></span>═ <span class="box-title item-element-lnk-brown"></span> ═<span class="box-top-fill-half-two"></span><span class="box-index"></span>═[<div class="b-background item-element-lnk-brown">↕</div>]═╗</div>`;

  // Middle lines
  boxInnerHtmlContent += `<div class="turbo-border middle-line">║<div class="box-middle-fill"></div><div class="block-bg b-v-scroll-up item-element-lnk-red">▲</div></div><div class="turbo-border middle-line">║<div class="box-middle-fill"></div><div class="block-bg b-v-scroll item-element-lnk-brown">▪</div><div class="block-bg2 item-element-lnk-brown">▒</div></div><div class="turbo-border middle-line">║<div class="box-middle-fill"></div><div class="block-bg2 item-element-lnk-brown">▒</div></div>`;

  for (let i = 0; i < extraHeight; i++){
    boxInnerHtmlContent += `<div class="turbo-border middle-line">║<div class="box-middle-fill"></div><div class="block-bg2 item-element-lnk-brown">▒</div></div>`;
  }

  // Second to last line
  boxInnerHtmlContent += `<div class="turbo-border middle-line">║<div class="box-middle-fill"></div><div class="block-bg b-v-scroll-down item-element-lnk-red">▼</div></div>`;
  
  // Last line
  boxInnerHtmlContent += `<div class="turbo-border last-line">╚═<span class="status"><span class="status-saved">*</span><span class="status-unsaved">═</span></span>═<span class="cursor-position"><span class="cursor-position-on"> <span class="cursor-position-line">1</span>:<span class="cursor-position-column">1</span> </span><span class="cursor-position-off">═════</span></span>═<div class="block-bg b-h-scroll-left item-element-lnk-brown-left item-element-lnk-red">◄</div><div class="block-bg b-h-scroll item-element-lnk-brown">▪</div><div class="box-bottom-fill block-bg2 item-element-lnk-brown"></div><div class="block-bg b-h-scroll-right item-element-lnk-red">►</div><span class="b-resize item-element-lnk-brown">─┘</span></div>`;
  

  const boxInnerHtml = fragmentFromHTML(boxInnerHtmlContent);
  boxInnerHtml.querySelector('.box-top-fill-half-one').textContent = fillOne;
  boxInnerHtml.querySelector('.box-title').textContent = title;
  boxInnerHtml.querySelector('.box-top-fill-half-two').textContent = fillTwo;
  boxInnerHtml.querySelector('.box-index').textContent = turboBoxIndex;
  boxInnerHtml.querySelectorAll('.box-middle-fill').forEach(el => el.textContent = middleFill());
  boxInnerHtml.querySelector('.box-bottom-fill').textContent = bottomFill;

  box.append(boxInnerHtml);

  // Overlay box to disable contents
  const overlayBox = document.createElement('div');
  overlayBox.className = 'turbo-overlay turbo-overlay-box';
  box.append(overlayBox);

  // Clip inner box
  const clipBox = document.createElement('div');
  clipBox.className = 'turbo-clip turbo-clip-box';
  box.append(clipBox);
  
  // Turbo content box
  const contentBox = document.createElement('div');
  contentBox.className = 'turbo-content turbo-content-box';
  contentBox.append(content);
  clipBox.append(contentBox);
  
  // Append to main turbo container
  const turboContainer = document.getElementById('turbo-box-container');
  turboContainer.append(box);
  
  fitTurboContainerDimensions();
  
  if(focusInput) {
    focusFirstInput(box);
  }

  return box;
}

function createTurboInfoBox(id, title, height, width, show = false, focusInput = false, okButton = true, removeOnClose = false, content = null, asciiBackground){
  if(document.querySelectorAll('.turbo-infobox.active').length > 0){
    return;
  }	
  
  resetBoxTop();
  
  const minWidthTop = 15;
  const minWidthMiddle = 2;
  const minWidthBottom = 14;
  const minHeight = 3;	
  
  const baseWidth = Math.max(width, minWidthTop, minWidthMiddle, minWidthBottom);
  const extraWidthTop = Math.max(0, title.length - (baseWidth - minWidthTop));
  const totalWidth = baseWidth + extraWidthTop;
  const fillWidthTop = totalWidth - title.length - minWidthTop;
  const fillWidthMiddle = totalWidth - minWidthMiddle;
  const fillWidthBottom = totalWidth - minWidthBottom;
  
  const baseHeight = Math.max(height, minHeight);
  const extraHeight = baseHeight - minHeight;
  
  const boxIndex = document.querySelectorAll('.box').length + 1;
  
  // Generate fill content
  let fillOne = '';
  let fillTwo = '';
  for (let i = 0; i < fillWidthTop; i++){
    if (i % 2 === 0){
      fillOne += '═';
    } else {
      fillTwo += '═';
    }
  }
  
  let middleFill = () => ' '.repeat(fillWidthMiddle);
  if(asciiBackground) {
    middleFill = () => randomAsciiString(fillWidthMiddle);
  }
  const bottomFill = '═'.repeat(fillWidthBottom);
	
  // Create the container div
  const box = document.createElement('div');
  
  if(id !== '' && id !== null && id !== undefined){
    box.id = id;
  }
  
  box.className = 'box turbo-infobox box-shadow' + (show ? ' active top' : '') + (removeOnClose ? ' removeOnClose' : '');
  box.setAttribute('data-width', totalWidth);
  box.setAttribute('data-height', baseHeight);
  box.setAttribute('data-minWidth', Math.max(minWidthTop, minWidthMiddle, minWidthBottom));
  box.setAttribute('data-minHeight', minHeight);
  box.setAttribute('data-index', boxIndex);
  	
  box.style.top = `calc(50% - ${baseHeight * u_height / 2 - u_height / 2}px)`; 
  box.style.left = `calc(50% - ${totalWidth / 2}ch)`;
  box.style.width = `${totalWidth}ch`;
  box.style.height = `${baseHeight * u_height}px`;
  
  // First line
  let boxInnerHtmlContent = `<div class="turbo-border first-line">╔═[<div class="b-exit item-element-lnk-brown">▪</div>]<span class="box-top-fill-half-one"></span>═ <span class="box-title"></span> ═<span class="box-top-fill-half-two"></span>═════╗</div>`;

  // Middle lines
  for (let i = 0; i < extraHeight; i++){
    boxInnerHtmlContent += `<div class="turbo-border middle-line">║<div class="box-middle-fill"></div>║</div>`;
  }

  // Second to last line
  boxInnerHtmlContent += `<div class="turbo-border middle-line">║<div class="box-middle-fill"></div>║</div>`;
  
  // Last line
  boxInnerHtmlContent += `<div class="turbo-border last-line">╚═══════════<div class="box-bottom-fill"></div>═╝</div>`;
  
  // OK button
  if (okButton){
    boxInnerHtmlContent += `<button class="b-ok box-shadow item-element-lnk-purple">O<span class="highlightYellow">K</span></button>`;
  }

  const boxInnerHtml = fragmentFromHTML(boxInnerHtmlContent);
  boxInnerHtml.querySelector('.box-top-fill-half-one').textContent = fillOne;
  boxInnerHtml.querySelector('.box-title').textContent = title;
  boxInnerHtml.querySelector('.box-top-fill-half-two').textContent = fillTwo;
  boxInnerHtml.querySelectorAll('.box-middle-fill').forEach(el => el.textContent = middleFill());
  boxInnerHtml.querySelector('.box-bottom-fill').textContent = bottomFill;

  box.append(boxInnerHtml);

  // Overlay box to disable contents
  const overlayBox = document.createElement('div');
  overlayBox.className = 'turbo-overlay turbo-overlay-infobox';
  box.append(overlayBox);

  // Clip inner box
  const clipBox = document.createElement('div');
  clipBox.className = 'turbo-clip turbo-clip-infobox';
  box.append(clipBox);
  
  // Turbo content box
  const contentBox = document.createElement('div');
  contentBox.className = 'turbo-content turbo-content-infobox';
  contentBox.append(content);
  clipBox.append(contentBox);
  
  // Append to main turbo container
  const turboContainer = document.getElementById('turbo-box-container');
  turboContainer.append(box);
  
  fitTurboContainerDimensions();
  
  if(focusInput) {
    focusFirstInput(box);
  }

  return box;
}

/* ===================================== */
/* BOX EVENTS ========================== */
/* ===================================== */
document.addEventListener('click', (e) => {
  const b = e.target.closest('.box');
  if (!b) return;

  // 'top' click
  if (b.classList.contains('active') && !b.classList.contains('top') && document.querySelectorAll('.turbo-infobox.active.top').length === 0) {
    resetBoxTop();
    setBoxTop(b);
    return;
  }

  // 'close' click
  if (e.target.classList.contains('b-exit') && b.classList.contains('top')) {
    closeBox(b);
    return;
  }

  // 'inactive' click
  if (e.target.classList.contains('b-background') && b.classList.contains('top')) {
    setBoxToBackground();
    return;
  }

  // 'ok' click
  if ((e.target.classList.contains('b-ok') || e.target.parentElement.classList.contains('b-ok')) && b.classList.contains('top')) {
    closeBox(b);
    return;
  }

  // 'id' click
  if (e.target.classList.contains('box-title') && b.classList.contains('active') && b.classList.contains('top') && b.id == e.target.textContent) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
	  const fullUrl = `${window.location.href}/${e.target.textContent}`;
		
	  navigator.clipboard.writeText(fullUrl);
    } else {
	  console.error("Clipboard API not supported");
    }
	  
    e.target.classList.add('content-copied');

    setTimeout(() => {
	  e.target.classList.remove('content-copied');
    }, 1000);
    return;
  }
});

// 'scroll'  
function scrollTurboBox(tb, direction) {
  if (!tb) return;

  // Resolve target element
  const targetSelector = tb.dataset.target;
  if (!targetSelector) return;

  const scrollContainer = document.querySelector(targetSelector);
  if (!scrollContainer) return;

  const dim_container = scrollContainer.getBoundingClientRect();
  const dim_content = {
    width: scrollContainer.scrollWidth,
    height: scrollContainer.scrollHeight
  };

  // Scrollbar UI elements
  const hScrollLeft  = tb.querySelector('.b-h-scroll-left');
  const hScrollRight = tb.querySelector('.b-h-scroll-right');
  const hScrollBar   = tb.querySelector('.b-h-scroll');
  const vScrollUp    = tb.querySelector('.b-v-scroll-up');
  const vScrollDown  = tb.querySelector('.b-v-scroll-down');
  const vScrollBar   = tb.querySelector('.b-v-scroll');

  // Scrollbar limits (UI-only)
  const min_h = 11;
  const max_h = tb.dataset.width - 4;
  const min_v = u_height * 2;
  const max_v = u_height * (tb.dataset.height - 3);

  // Scrollable distances
  const maxScrollX = Math.max(0, dim_content.width - dim_container.width);
  const maxScrollY = Math.max(0, dim_content.height - dim_container.height);

  // Map scrollbar units → scroll offset
  const h_step = maxScrollX / (max_h - min_h || 1);
  const v_step = maxScrollY / (max_v - min_v || 1) * u_height;

  const canScroll = tb.classList.contains('active') && tb.classList.contains('top');
  if (!canScroll) return;

  // ----- HORIZONTAL -----

  if (direction === 'left') {
    if (hScrollLeft?.classList.contains('disabled') || maxScrollX === 0) return;

    let barLeft = parseFloat(hScrollBar.style.left) || min_h;
    if (barLeft <= min_h) return;

    scrollContainer.scrollLeft = Math.max(
      0,
      scrollContainer.scrollLeft - h_step
    );

    hScrollBar.style.left = (barLeft - 1) + 'ch';
  }

  if (direction === 'right') {
    if (hScrollRight?.classList.contains('disabled') || maxScrollX === 0) return;

    let barLeft = parseFloat(hScrollBar.style.left) || min_h;
    if (barLeft >= max_h) return;

    scrollContainer.scrollLeft = Math.min(
      maxScrollX,
      scrollContainer.scrollLeft + h_step
    );

    hScrollBar.style.left = (barLeft + 1) + 'ch';
  }

  // ----- VERTICAL -----

  if (direction === 'up') {
    if (vScrollUp?.classList.contains('disabled') || maxScrollY === 0) return;

    let barTop = parseFloat(vScrollBar.style.top) || min_v;
    if (barTop <= min_v) return;

    scrollContainer.scrollTop = Math.max(
      0,
      scrollContainer.scrollTop - v_step
    );

    vScrollBar.style.top = (barTop - u_height) + 'px';
  }

  if (direction === 'down') {
    if (vScrollDown?.classList.contains('disabled') || maxScrollY === 0) return;

    let barTop = parseFloat(vScrollBar.style.top) || min_v;
    if (barTop >= max_v) return;

    scrollContainer.scrollTop = Math.min(
      maxScrollY,
      scrollContainer.scrollTop + v_step
    );

    vScrollBar.style.top = (barTop + u_height) + 'px';
  }
}

document.addEventListener('click', (e) => {
  const tb = e.target.closest('.turbo-box');
  if (!tb) return;

  if (e.target.classList.contains('b-h-scroll-left')) scrollTurboBox(tb, 'left');
  if (e.target.classList.contains('b-h-scroll-right')) scrollTurboBox(tb, 'right');
  if (e.target.classList.contains('b-v-scroll-up')) scrollTurboBox(tb, 'up');
  if (e.target.classList.contains('b-v-scroll-down')) scrollTurboBox(tb, 'down');
});

/* ===================================== */
/* KEY MAPPING ========================= */
/* ===================================== */
const globalKeymap = {
  Q: {
    locked: true, 
    handler: (e) => {
      setBoxToBackground();
    }
  },
	
  F: {
    locked: true, 
    handler: (e) => {
      const currentTop = document.querySelector('.box.active.top');
      
      if (!currentTop) {
	return;
      }

      focusFirstInput(currentTop)
    }
  },
  
  K: {
    locked: true, 
    handler: (e) => {
      const boxesActiveTop = document.querySelectorAll('.box.active.top');
      let boxClosed = false;

      boxesActiveTop.forEach(b => {
        if (!boxClosed && b.querySelector('.b-ok') !== null) {
          closeBox(b);
          boxClosed = true;
        }
      });
    }
  },
  
  Escape: {
    locked: true,
    handler: (e) => {
      const boxesActiveTop = document.querySelectorAll('.box.active.top');
      let boxClosed = false;
      boxesActiveTop.forEach(b => {
        if (!boxClosed) {
          closeBox(b);
          boxClosed = true;
        }
      });
    }
  },

    Tab: {
    locked: true,
    handler: (e) => {
      e.preventDefault(); 

      function isVisible(el) {
        if (!(el instanceof Element)) return false;
      
        const style = window.getComputedStyle(el);
      
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.opacity !== '0' &&
          el.offsetWidth > 0 &&
          el.offsetHeight > 0
        );
      }
      
      const tabbables = Array.from(
        document.querySelectorAll('.box.active.top [tabindex]:not([tabindex="-1"])')
      )

      .filter(el => {
        const tabindex = parseInt(el.getAttribute('tabindex'));
        return (
          !isNaN(tabindex) &&
          !el.disabled &&
          el.offsetParent !== null &&
          isVisible(el)
        );
      })
      .sort((a, b) => {
        return parseInt(a.getAttribute('tabindex')) - parseInt(b.getAttribute('tabindex'));
      });

      if (tabbables.length === 0) return;
  
      const active = document.activeElement;
      let index = tabbables.indexOf(active);
  
      if (e.shiftKey) {
        index = (index <= 0) ? tabbables.length - 1 : index - 1;
      } else {
        index = (index === -1 || index === tabbables.length - 1) ? 0 : index + 1;
      }
  
      const next = tabbables[index];
      next.focus();
    }
  },
	 
  ArrowUp: {
    locked: true,
    handler: (e) => {
      const tb = document.querySelector('.turbo-box.active.top');
      if (!tb) return; 

      e.preventDefault();
      scrollTurboBox(tb, 'up');
    }
  },

  ArrowDown: {
    locked: true,
    handler: (e) => {
      const tb = document.querySelector('.turbo-box.active.top');
      if (!tb) return; 
      
      e.preventDefault();
      scrollTurboBox(tb, 'down');
    }
  },

  ArrowLeft: {
    locked: true,
    handler: (e) => {
      const tb = document.querySelector('.turbo-box.active.top');
      if (!tb) return; 

      e.preventDefault();
      scrollTurboBox(tb, 'left');
    }
  },

  ArrowRight: {
    locked: true,
    handler: (e) => {
      const tb = document.querySelector('.turbo-box.active.top');
      if (!tb) return; 

      e.preventDefault();
      scrollTurboBox(tb, 'right');
    }
  }
};

document.addEventListener('keydown', (e) => {
  if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
    return;
  }
  
  if (e.key === 'Escape') { 
    if (document.activeElement && document.activeElement !== document.body) { 
      document.activeElement.blur(); 
      return;
    }
  }
  
  if (document.activeElement.tagName === 'TEXTAREA') {
    return; 
  }

  if (e.key === 'Enter') {
    const activeTopBoxes = document.querySelectorAll('.box.active.top');

    if (activeTopBoxes.length === 1) {
      const forms = activeTopBoxes[0].querySelectorAll('form');

      // Only submit if exactly one form exists in the box
      if (forms.length === 1) {
        e.preventDefault();
        e.stopPropagation();
        forms[0].dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));

        return;
      }

      const buttons = activeTopBoxes[0].querySelectorAll('button');

      // Only submit if exactly one button exists in the box
      if (buttons.length === 1) {
        e.preventDefault();
        e.stopPropagation();
        buttons[0].dispatchEvent(new Event('click', { cancelable: true, bubbles: true }));

        return;
      }
    }
  }

  if (document.activeElement.classList.contains('input')) {
    return;
  }
  
  const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  const globalEntry = globalKeymap[key];
  const hasPageAction = window.pageKeymap && typeof window.pageKeymap[key] === 'function';

  // CASE 1: Global key exists and is locked
  if (globalEntry && globalEntry.locked) {
    e.preventDefault();
    e.stopPropagation();
    globalEntry.handler(e);
    return; 
  }

  // CASE 2: Global key exists, is NOT locked, and no override exists
  if (globalEntry && !globalEntry.locked && !hasPageAction) {
    e.preventDefault();
    e.stopPropagation();
    globalEntry.handler(e);
  }

  // CASE 3: Run page-specific if it exists
  if (hasPageAction) {
    e.preventDefault();
    e.stopPropagation();
    window.pageKeymap[key](e);
  }
});

/* ===================================== */
/* BOX CONTENT ========================= */
/* ===================================== */
const globalHotkeyItems = [
  {
    id: 'global-hotkey-escape',
    hotkey: 'ESC',
    func: 'Unfocus/Close',
  },
  {
    id: 'global-hotkey-enter',
    hotkey: 'ENTER',
    func: 'Submit',
  },
  {
    id: 'global-hotkey-q',
    hotkey: 'Q',
    func: 'Cycle',
  },
  {
    id: 'global-hotkey-f',
    hotkey: 'F',
    func: 'Focus',
  },
  {
    id: 'global-hotkey-up',
    hotkey: '↑',
    func: 'Up',
  },
  {
    id: 'global-hotkey-down',
    hotkey: '↓',
    func: 'Down',
  },
  {
    id: 'global-hotkey-left',
    hotkey: '←',
    func: 'Left',
  },
  {
    id: 'global-hotkey-right',
    hotkey: '→',
    func: 'Right',
  }
];
    
const aboutHtmlContent = fragmentFromHTML(`<div><div id="footer-copyright"><span>© <span id="copyright-year"></span> Sebastian Bachler</span></div><div id="footer-source"><span><a class="highlightYellow item-element-lnk-red" href="https://github.com/guesswho1234/Polly" target="_blank" rel="noopener noreferrer">Polly</a> source code</span></div><div id="footer-version"><span>Version </span><span id="version-number">0.0.0</span></div><div id="footer-license"><span>Licensed under <a class="highlightYellow item-element-lnk-red" href="LICENSE.html" target="_blank" rel="noopener noreferrer">MIT</a></span></div><div id="footer-info"></div><span><a class="highlightYellow item-element-lnk-red" href="INFO.html" target="_blank" rel="noopener noreferrer">Info</a> on use and data</span></div>`);
aboutHtmlContent.querySelector('#copyright-year').textContent = new Date().getFullYear();

const responseHtmlContent = fragmentFromHTML(`<div id="response-content"><span id="response-status"></span><span id="response-message"></span></div>`);

/* ===================================== */
/* BOXES =============================== */
/* ===================================== */
createTurboContainer();
createTurboBoxContainer();
addFooterBar(items = globalHotkeyItems);
createTurboInfoBox(
	'about', 
	'About', 
	9, 
	27, 
	false, 
	false, 
	true, 
	false, 
	aboutHtmlContent
);

createTurboInfoBox(
	'response', 
	'Response', 
	6, 
	47, 
	false, 
	false, 
	true, 
	false, 
	responseHtmlContent
);
