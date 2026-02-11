/* ===================================== */
/* BOX CONTENT ========================= */
/* ===================================== */
const headerOptions = [
  {
    id: 'option-new-survey',
    onClick: () => openBox('new-survey', true),
    hotkey: 'N',
    text_before: '',
    text_after: 'ew',
  },
  {
    id: 'option-open-survey',
    onClick: () => openBox('open-survey', true),
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

const newSurveyHtml = fragmentFromHTML(`` +
`<div id="new-survey-container">` +
  `<form id="new-survey-form" method="post">` +
    `<input id="new-survey-pw-value" type="hidden" name="password">` +
    `<input id="new-survey-expiry-value" type="hidden" name="expiry">` +
    `<input id="new-survey-type-value" type="hidden" name="survey_type">` +
    `<div id="survey-content">` +
      `<span id="survey-types">` +
        `<span class="survey-type item-element-option" id="survey-type-single-choice" data-value="singlechoice" data-key="I">` +
          `<span class="survey-type-checkbox">[ ]</span> S<span class="highlightYellow">i</span>ngle Choice` +
        `</span>` +
        `<span class="survey-type item-element-option" id="survey-type-multiple-choice" data-value="multiplechoice" data-key="M">` +
          `<span class="survey-type-checkbox">[ ]</span><span class="highlightYellow"> M</span>ultiple Choice` +
        `</span>` +
        `<span class="survey-type item-element-option" id="survey-type-rank-choice" data-value="rankchoice" data-key="R">` +
          `<span class="survey-type-checkbox">[ ]</span><span class="highlightYellow"> R</span>ank Choice` +
        `</span>` +
        `<span class="survey-type item-element-option" id="survey-type-matrix-choice" data-value="matrixchoice" data-key="X">` +
          `<span class="survey-type-checkbox">[ ]</span> Matri<span class="highlightYellow">x</span> Choice` +
        `</span>` +
      `</span>` +
      `<br/>` +
      `<span id="survey-title">` + 
        `<input name="title" class="input" maxlength="255" placeholder="Title" required>` + 
      `</span>` +
      `<br/>` +
      `<span id="choice-items">` +
        `<span id="choice-item-template" class="choice-item template">` +
          `<!--<input class="input" tabindex="-1" onfocus="this.blur()" readonly>-->` +
          `<button class="add-choice-item box-shadow item-element-lnk-purple" type="button" value="">A<span class="highlightYellow">d</span>d</button>` +
        `</span>` +
      `</span>` +
    `</div>` +
    `<div class="new-survey-button-container">` +
      `<button id="open-new-survey-settings" class="box-shadow item-element-lnk-purple" type="button">Se<span class="highlightYellow">t</span>tings</button>` +
      `<button id="submit-survey-content" class="box-shadow item-element-lnk-purple" type="submit">P<span class="highlightYellow">o</span>st</button>` +
    `</div>` +
  `</form>` +
`</div>`); 
newSurveyHtml.querySelector('#new-survey-container').style.height = (defaultBoxHeight * u_height - margin_scroll_v * 2) + "px";
newSurveyHtml.querySelector('#new-survey-container').style.width = "calc(" + defaultBoxWidth + "ch - " + (margin_scroll_h * 2) + "px)";
newSurveyHtml.querySelector('.add-choice-item').addEventListener('click', addChoice);

const idHtml = fragmentFromHTML(`` +
`<div id="id-container">` +
  `<br/>` + 
  `<div>` +
    `<input type="text" id="survey-id" value="" readonly>` +
  `</div>` +
  `<button id="copy-survey-id" class="box-shadow item-element-lnk-purple"><span class="highlightYellow">C</span>opy</button>` +
`</div>`); 

const openSurveyHtml = fragmentFromHTML(`` +
`<div id="open-survey-container">` +
  `<br/>` +
  `<form id="open-survey-form" method="get">` +
    `<div>` +
      `<input type="text" id="open-survey-id" class="input" value="" name="id" placeholder="Type or paste the id to open here...">` +
    `</div>` +
    `<div class="new-survey-button-container">` +
      `<button id="submit-open-survey" class="box-shadow item-element-lnk-purple">Op<span class="highlightYellow">e</span>n</button>` +
    `</div>` +
  `</form>` +
`</div>`);

const openSurveyPwHtml = fragmentFromHTML(`` +
`<div id="open-survey-pw-container">` +
`<br/>` +
`<div>` +
`<input type="password" id="open-survey-pw-value" class="pw-value input" value="" placeholder="Type in password here...">` +
`</div>` +
`<button id="submit-open-survey-pw" class="box-shadow item-element-lnk-purple">Op<span class="highlightYellow">e</span>n</button>` + 
`</div>`);

const voteSurveyPwHtml = fragmentFromHTML(`` +
`<div id="vote-survey-pw-container">` +
`<br/>` +
`<div>` +
`<input type="password" id="vote-survey-pw-value" class="pw-value input" value="" placeholder="Type in password here...">` +
`</div>` +
`<button id="submit-vote-survey-pw" class="box-shadow item-element-lnk-purple"><span class="highlightYellow">V</span>ote</button>` + 
`</div>`);

const newSurveySettingsHtml = fragmentFromHTML(`` + 
`<div id="new-survey-settings-container">` + 
  `<br/>` +
    `<div>` +
    `<input type="password" id="pw-value-1" class="pw-value input" value="" placeholder="Type your password here..." autocomplete="new-password">` +
    `<br/>` +
    `<input type="password" id="pw-value-2" class="pw-value input" value="" placeholder="Retype your password here...">` +
    `<br/>` +
    `<div id="lifetime-input-container">` +
      `<span><span>Hours till expiry: </span>` +
        `<input type="number" min="1" max="9999" step="1" id="expiry-value" class="input" value="1">` +
      `</span>` +
    `</div>` +
  `</div>` +
  `<button id="set-new-survey-settings-values" class="box-shadow item-element-lnk-purple"><span class="highlightYellow">S</span>et</button>` + 
`</div>`);

/* ===================================== */
/* BOXES =============================== */
/* ===================================== */
addHeaderBar(
	'Welcome to Polly-Ask', 
	headerOptions, 
	true
);

createTurboInfoBox(
	'new-survey-settings', 
	'New Survey Settings', 
	11, 
	45, 
	false, 
	true, 
	false, 
	false, 
	newSurveySettingsHtml
);

createTurboInfoBox(
	'new-survey-id', 
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
	'open-survey', 
	'Open Id', 
	6, 
	45, 
	false, 
	true, 
	false, 
	false, 
	openSurveyHtml
);

createTurboInfoBox(
	'open-survey-pw', 
	'Enter Passwort', 
	6, 
	45, 
	false, 
	true, 
	false, 
	false, 
	openSurveyPwHtml
);

createTurboInfoBox(
	'vote-survey-pw', 
	'Enter Passwort', 
	6, 
	45, 
	false, 
	true, 
	false, 
	false, 
	voteSurveyPwHtml
);

createTurboBox(
	'new-survey', 
	'New Survey', 
	defaultBoxHeight, 
	defaultBoxWidth, 
	true, 
	false, 
	false, 
	newSurveyHtml, 
	false,
	false,
	'#survey-content'
);

/* ===================================== */
/* SUBMIT SURVEY ======================== */
/* ===================================== */
const newSurveyForm = document.getElementById('new-survey-form');
const openSurveyForm = document.getElementById('open-survey-form');

function clearForm(form) {
  form.reset();
  
  Array.from(form.elements).forEach(input => {
    if (input.type === 'checkbox' || input.type === 'radio') {
      input.checked = false;
    } else {
      input.value = '';
    }
  });

  selectType("I");
}

function wilsonLowerBound(positive, total, z = 1.96) {
  if (total === 0) return 0;

  const p = positive / total;
  const z2 = z * z;

  const numerator =
    p +
    z2 / (2 * total) -
    z * Math.sqrt(
      (p * (1 - p)) / total +
      z2 / (4 * total * total)
    );

  const denominator = 1 + z2 / total;

  return numerator / denominator;
}

function aggregateVotes(items, votes, type) {
  const numItems = items.length;

  const absoluteCounts = Array(numItems).fill(0);
  let relativeCounts = Array(numItems).fill(0);
  const voteScores = Array(numItems).fill(0);

  if (!votes || votes.length === 0) {
    return { absoluteCounts, relativeCounts, voteScores };
  }

  const matrixScoreMap = {
    0: 1,
    1: 0.5,
    2: -1,
  };

  // ---------- Participation ----------
  votes.forEach(vote => {
    for (const indexStr of Object.keys(vote.vote)) {
      absoluteCounts[Number(indexStr)] += 1;
    }
  });

  const totalVotes = absoluteCounts.reduce((sum, v) => sum + v, 0);

  relativeCounts = totalVotes > 0
    ? absoluteCounts.map(v => (v / totalVotes) * 100)
    : relativeCounts;

  // ---------- Scoring ----------
  switch (type) {

    case "singlechoice":
    case "multiplechoice":
      for (let i = 0; i < numItems; i++) {
        voteScores[i] = wilsonLowerBound(absoluteCounts[i], totalVotes);
      }
      break;

    case "rankchoice": {
      const rankTotals = Array(numItems).fill(0);

      votes.forEach(vote => {
        for (const [indexStr, rank] of Object.entries(vote.vote)) {
          const index = Number(indexStr);
          rankTotals[index] += (numItems - 1 - rank);
        }
      });

      const totalPossibleScore = totalVotes * (numItems - 1);

      for (let i = 0; i < numItems; i++) {
        voteScores[i] =
          totalPossibleScore > 0
            ? rankTotals[i] / totalPossibleScore
            : 0;
      }
      break;
    }

    case "matrixchoice":
      votes.forEach(vote => {
        for (const [indexStr, value] of Object.entries(vote.vote)) {
          const index = Number(indexStr);
          if (matrixScoreMap[value] !== undefined) {
            voteScores[index] += matrixScoreMap[value];
          }
        }
      });

      // Normalization
      const maxPossible = totalVotes * Math.max(...Object.values(matrixScoreMap));

      if (maxPossible > 0) {
        for (let i = 0; i < numItems; i++) {
          voteScores[i] /= maxPossible;
        }
      }
      break;
  }

  return { absoluteCounts, relativeCounts, voteScores };
}

function openSurveyBox(surveyId, content, votes) {
  function items_survey_sc_mc_rank(items, votes, type) {
    const { absoluteCounts, relativeCounts, voteScores } = aggregateVotes(items, votes, type);
    const currentHighestScore = voteScores.indexOf(Math.max(...voteScores));

    const html = items.map((item, index) => {
      const html_item = fragmentFromHTML(`` +
      `<span class="opened-survey-choice-container" data-value="-1">` + 
        `<span class="opened-survey-choice-content">` + 
          `<span class="opened-survey-choice-focus highlightYellow">X</span>` +
          `<span class="opened-survey-choice-vote">[ ]</span>` +
          `<span class="opened-survey-choice-item"></span>` +
	      `</span>` +
        `<span class="opened-survey-choice-stats">` + 
          `<span class="rank-stats"></span>` +
          `<span class="absolute-stats"></span>` +
          `<span class="relative-stats"></span>` +
          `<span class="bar-chart"><span class="bar-chart-bar"><span></span></span></span>` +
	      `</span>` +
      `</span>`);

      html_item.querySelector('.opened-survey-choice-container').tabIndex = index + 1;
      html_item.querySelector('.opened-survey-choice-container').dataset.index = index;

      html_item.querySelector('.opened-survey-choice-item').textContent = item;

      if(index === currentHighestScore) {
        html_item.querySelector('.rank-stats').classList.add("highestScore");
      }
      html_item.querySelector('.rank-stats').textContent = voteScores[index].toFixed(2);
      html_item.querySelector('.absolute-stats').textContent = absoluteCounts[index];
      html_item.querySelector('.relative-stats').textContent = relativeCounts[index].toFixed(2) + "%";
      html_item.querySelector('.bar-chart .bar-chart-bar span').style.width = relativeCounts[index] + "%";

      return html_item;
    });

    return html;
  }

  function items_survey_matrix(items, votes, type) {
    const { absoluteCounts, relativeCounts, voteScores } = aggregateVotes(items, votes, type);
    const currentHighestScore = voteScores.indexOf(Math.max(...voteScores));

    const choiceHeaderHtml =  items != null ? items.map((item, index) => {
      const th = document.createElement('th');
      th.className = 'opened-survey-choice-item';
      th.dataset.index = index;
      th.textContent = item;

      return th;
    }) : null;

    const choiceStatsHtml = items != null ? items.map((item, index) => {
      const th = document.createElement('th');
      th.className = 'opened-survey-choice-stats';
      if(index === currentHighestScore) {
        th.classList.add("highestScore");
      }
      th.textContent = voteScores[index].toFixed(2);

      return th;
    }) : null;

    const choiceVoteTemplatesHtml = items != null ? items.map((item, index) => {
      const td = document.createElement('td');
      td.tabIndex = index + 1;
      td.className = 'opened-survey-choice-container';
      td.dataset.value = -1;
      td.dataset.index = index;
      td.append(fragmentFromHTML(`` +
        `<span class="opened-survey-choice-focus highlightYellow">X</span>` +
        `<span class="opened-survey-choice-vote">[ ]</span>`));

      return td;
    }) : null;

    const choiceVotesHtml = votes != null ? votes.map(vote => {
      const voteTr = document.createElement('tr');

      const voterTd = document.createElement('td');
      voterTd.className = 'opened-survey-matrix-choice-name';

      const voterSpan = document.createElement('span');
      voterSpan.textContent = vote.voter;

      voterTd.append(voterSpan);
      voteTr.append(voterTd);

      items.forEach((item, index) => {
        const vote_value = vote.vote[index] != null ? matrixChoiceOptions[vote.vote[index]] : ""; 
      
        const valueTd = document.createElement('td');
        valueTd.className = 'opened-survey-matrix-choice-vote ' + vote_value;
      
        const valueSpan = document.createElement('span');
        valueSpan.textContent = vote_value;
      
        valueTd.append(valueSpan);
        voteTr.append(valueTd);
      });

      return voteTr;
    }) : null;

    const html = fragmentFromHTML(`` +
    `<table class="opened-survey-matrix-choice-table">` +
      `<thead>` +
        `<tr class="choiceHeaderRow">` +
          `<th></th>` +
        `</tr>` +
        `<tr class="choiceStatsRow">` +
          `<th></th>` +
        `</tr>` +
      `</thead>` +
      `<tbody>` +
          `<tr class="choiceVoteTemplateRow">` +
          `<td class="opened-survey-matrix-choice-name-template">` +
	          `<input class="input" placeholder="Name...">` +
	        `</td>` +
        `</tr>` +
      `</tbody>` +
    `</table>`);

    if(choiceHeaderHtml !== null) choiceHeaderHtml.forEach(el => html.querySelector('.choiceHeaderRow').append(el));
    if(choiceStatsHtml !== null) choiceStatsHtml.forEach(el => html.querySelector('.choiceStatsRow').append(el));
    if(choiceVoteTemplatesHtml !== null) choiceVoteTemplatesHtml.forEach(el => html.querySelector('.choiceVoteTemplateRow').append(el));
    if(choiceVotesHtml !== null) choiceVotesHtml.forEach(el => html.querySelector('tbody').append(el));
    
    return html;
  }

  let type = null;
  let items = null;

  switch (content.survey_type) {
    case "singlechoice":
      type = "Single Choice Survey";
      items = items_survey_sc_mc_rank(content.items, votes, content.survey_type);
      break;
    case "multiplechoice":
      type = "Multiple Choice Survey";
      items = items_survey_sc_mc_rank(content.items, votes, content.survey_type);
      break;
    case "rankchoice":
      type = "Rank Order Survey";
      items = items_survey_sc_mc_rank(content.items, votes, content.survey_type);
      break;
    case "matrixchoice":
      type = "Person-Item Preference Matrix Survey";
      items = items_survey_matrix(content.items, votes, content.survey_type);
      break;
  }

  if (type === null || items === null) {
    return;
  }

  const openedIdBoxHtml = fragmentFromHTML(`` +
  `<div class="opened-survey-container">` +
    `<form method="post">` +
      `<div class="opened-survey-content">` +
        `<span class="opened-survey-title"></span>` +
        `<br/>` +
        `<span class="opened-survey-type"></span>` +
        `<br/>` +
        `<span class="opened-survey-choices"></span>` +
      `</div>` +
      `<div class="opened-survey-button-container">` +
        `<button class="survey-vote box-shadow item-element-lnk-purple" type="submit"><span class="highlightYellow">V</span>ote</button>` +
        `<button class="survey-refresh box-shadow item-element-lnk-purple" type="submit"><span class="highlightYellow">R</span>efresh</button>` +
      `</div>` +
    `</form>` +
    `<form method="get">` +
      `<input class="refresh-survey" type="hidden" name="id">` +
    `</form>` +
  `</div>`);
  openedIdBoxHtml.querySelector('.opened-survey-container').style.height = (defaultBoxHeight * u_height - margin_scroll_v * 2) + "px";
  openedIdBoxHtml.querySelector('.opened-survey-container').style.width = "calc(" + defaultBoxWidth + "ch - " + (margin_scroll_h * 2) + "px)";

  openedIdBoxHtml.querySelectorAll('form')[0].id = "vote-survey-" + surveyId + "-form";
  openedIdBoxHtml.querySelector('.opened-survey-title').textContent = content.title;
  openedIdBoxHtml.querySelector('.opened-survey-type').dataset.type = content.survey_type;
  openedIdBoxHtml.querySelector('.opened-survey-type').textContent = type;

  if(Array.isArray(items)) {
    items.forEach(item => openedIdBoxHtml.querySelector('.opened-survey-choices').append(item));
  } else {
    openedIdBoxHtml.querySelector('.opened-survey-choices').append(items);
  }

  openedIdBoxHtml.querySelector('.survey-refresh').setAttribute("form", `refresh-survey-${surveyId}-form`);
  openedIdBoxHtml.querySelectorAll('form')[1].id = "refresh-survey-" + surveyId + "-form";
  openedIdBoxHtml.querySelector('.refresh-survey').value = surveyId;

  const idAlreadyOpened = document.getElementById(surveyId);
  if (idAlreadyOpened) {
    closeBox(idAlreadyOpened);
  }

  createTurboBox(
	  surveyId, 
	  surveyId, 
	  defaultBoxHeight, 
	  defaultBoxWidth, 
	  true, 
	  false, 
	  true, 
	  openedIdBoxHtml, 
	  true,
	  true,
	  '.opened-survey-content'
  ); 
  
  const openedSurvey = document.querySelector('.turbo-box.active.top .opened-survey-container');
  const item_elements = openedSurvey.querySelectorAll('.opened-survey-choice-container');

  item_elements.forEach(item => {
    item.addEventListener('click', () => {
      selectChoice(item.dataset.index);
    });
  })

  // Submit vote survey form
  const voteSurveyForm = document.getElementById(`vote-survey-${surveyId}-form`);

  if (!voteSurveyForm) {
  } else {
    voteSurveyForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const openedSurvey = voteSurveyForm.closest('.box');      
      const cond_openedSurveyActive = openedSurvey.classList.contains('active') && openedSurvey.classList.contains('top');

      if (cond_openedSurveyActive) {
	const voteData = collectVoteData(openedSurvey);
        submitVoteIdForm(surveyId, voteData);
      } 
    });
  }

  // Submit refresh survey form
  const refreshSurveyForm = document.getElementById(`refresh-survey-${surveyId}-form`);

  if (!refreshSurveyForm) {
  } else {
    refreshSurveyForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const openedSurvey = refreshSurveyForm.closest('.box');      
      const cond_openedSurveyActive = openedSurvey.classList.contains('active') && openedSurvey.classList.contains('top');

      if (cond_openedSurveyActive) {
        const rawInput = refreshSurveyForm.querySelector('.refresh-survey').value.trim();
        submitOpenIdForm(rawInput);
      } 
    });
  }
}

async function submitOpenIdForm(rawInput = '', password = '') {
  if (!rawInput) return;

  const openSurvey = document.getElementById('open-survey');
  closeBox(openSurvey);

  const segments = rawInput.split('/').filter(Boolean);
  const id = segments[segments.length - 1];
  if (!id) return;

  try {
    const headers = password ? { 'Authorization': 'Basic ' + btoa(':' + password) } : {};

    const response = await fetch(`/api/ask/${encodeURIComponent(id)}`, {
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
      openSurveyBox(result.data.id, result.data.content, result.data.votes);
    } else if (result?.status === 'protected') {
      const openSurveyPw = document.getElementById('open-survey-pw');
      openSurveyPw.dataset.id = id;
      openBox('open-survey-pw', true);
    } else {
      
      return;
    }

  } catch (err) {
    console.error('Error fetching survey:', err);
  } finally {
    clearForm(openSurveyForm);
  }
}

async function autoLoadPaste(id) {
  await submitOpenIdForm(id);
}

async function submitVoteIdForm(id, voteData, password = '') {
  if (!id) return;

  const openedSurvey = document.querySelector('.box.active.top .opened-survey-container');
  const submitRefreshButton = openedSurvey.querySelector('button[type="submit"].survey-refresh');
  const submitVoteButton = openedSurvey.querySelector('button[type="submit"].survey-vote');

  if (submitRefreshButton) submitRefreshButton.disabled = true;
  if (submitVoteButton) submitVoteButton.disabled = true;

  // Basic validation
  if (!voteData) {
    if (submitRefreshButton) submitRefreshButton.disabled = false;
    if (submitVoteButton) submitVoteButton.disabled = false;

    return;
  }

  // Build JSON payload
  const payload = {
    vote: voteData.vote,
  };

  if (voteData.voter != null) { 
    payload.voter = voteData.voter;
  }

  // Basic validation
  if (Object.keys(payload.vote).length === 0) {
    if (submitRefreshButton) submitRefreshButton.disabled = false;
    if (submitVoteButton) submitVoteButton.disabled = false;

    return;
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (password) {
      headers['Authorization'] = 'Basic ' + btoa(':' + password);
    }

    const response = await fetchWithPow(`/api/ask/${encodeURIComponent(id)}/vote`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
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
      openSurveyBox(result.data.id, result.data.content, result.data.votes);
    } else if (result?.status === 'protected') {
      const voteSurveyPw = document.getElementById('vote-survey-pw');
      voteSurveyPw.dataset.id = id;
      openBox('vote-survey-pw', true);
    } else {
      return;
    }

  } catch (err) {
    console.error('Error submitting vote:', err);
  } finally {
    if (submitRefreshButton) submitRefreshButton.disabled = false;
    if (submitVoteButton) submitVoteButton.disabled = false;
  }
}

async function submitNewSurveyForm() {
  const submitButton = newSurveyForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  const title = newSurveyForm.querySelector('input[name="title"]').value.trim();
  const survey_type = newSurveyForm.querySelector('input[name="survey_type"]').value.trim();

  if (title.length === 0) {
    submitButton.disabled = false;
    return;
  }

  if (survey_type.length === 0) {
    submitButton.disabled = false;
    return;
  }

  let items = [...document.querySelectorAll("input[name='items[]']")];
  items = items.map(i => i.value.trim()).filter(Boolean);

  if (items.length === 0) {
    submitButton.disabled = false;
    return;
  }

  const expiryInput = document.getElementById('new-survey-expiry-value');
  const expiry = expiryInput.value ? Number(expiryInput.value) : 1;

  const password = document.getElementById('new-survey-pw-value').value || '';

  // Build JSON payload
  const payload = {
    survey_type,
    title,
    items,
    expiry,
    password,
  };

  try {
    const response = await fetchWithPow('/api/ask', {
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
      showSurveyId(result.id);
    } else {
      
      return;
    }

  } catch (err) {
    console.error('Error submitting survey:', err);
  } finally {
    clearForm(newSurveyForm);
    submitButton.disabled = false;
  }
}

function showSurveyId(id) {
  const fullUrl = `${window.location.origin}/ask/${id}`;
  document.getElementById('survey-id').value = fullUrl;
  openBox('new-survey-id'); 
}

if (!openSurveyForm) {
} else {
  openSurveyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const openSurvey = document.getElementById('open-survey');
    const cond_openSurveyActive = openSurvey.classList.contains('active') && openSurvey.classList.contains('top');

    if (cond_openSurveyActive) {
      const rawInput = document.getElementById('open-survey-id').value.trim();
      submitOpenIdForm(rawInput);
    } 
  });
	
  clearForm(openSurveyForm);
}

if (!newSurveyForm) {
} else {
  newSurveyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newSurvey = document.getElementById('new-survey');
    const cond_newSurveyActive = newSurvey.classList.contains('active') && newSurvey.classList.contains('top');

    if (cond_newSurveyActive) {
      submitNewSurveyForm();
    } 
  });
	
  clearForm(newSurveyForm);
}

/* ===================================== */
/* FORM MANIPULATIONS ================== */
/* ===================================== */
const matrixChoiceOptions = ["yes", "maybe", "no"];

function addChoice() {
  const choiceItemTemplate = document.getElementById('choice-item-template');
  const newChoiceItem = fragmentFromHTML(`` +
  `<div>` +
    `<span class="choice-item">` +
      `<input type="text" placeholder="Choice text" class="input" maxlength="255" name="items[]">` +
      `<button class="remove-choice-item box-shadow item-element-lnk-purple" type="button" value=""><span class="highlightYellow">DEL</span></button>` +
    `</span>` +
    `<br/>` +
  `</div>`);
  newChoiceItem.querySelector('.remove-choice-item').addEventListener('click', removeChoice);

  choiceItemTemplate.before(newChoiceItem);

  setItemRemovable();
}

function removeChoice() {
  const items = document.getElementById('choice-items').querySelectorAll('.choice-item:not(.template)');

  if (items.length <= 1) {
    return;
  }

  const last = items[items.length - 1];

  last.parentElement.remove();
  setItemRemovable();
}

function setItemRemovable() {
  const items = document.getElementById('choice-items').querySelectorAll('.remove-choice-item');

  items.forEach(el => el.classList.remove('active'));
  
  if (items.length > 1) {
    items[items.length - 1].classList.add('active');
  }
}

function selectType(key) {
  const items = newSurveyForm.querySelectorAll('.survey-type');
  const typeFormInput = document.getElementById('new-survey-type-value');

  items.forEach(el => {
    el.querySelector('.survey-type-checkbox').textContent = "[ ]";
    el.classList.remove('active')

    if (el.dataset.key === key) {
      el.classList.add('active');
      el.querySelector('.survey-type-checkbox').textContent = "[X]";
      typeFormInput.value = el.dataset.value;

      return;
    }
  });
}

if (!newSurveyForm) {
} else {
  const items = newSurveyForm.querySelectorAll('.survey-type');
  const addChoiceItems = newSurveyForm.querySelectorAll('.add-choice-item');
  const removeChoiceItems = newSurveyForm.querySelectorAll('.remove-choice-item');

  items.forEach(item => {
    item.addEventListener('click', () => {
      selectType(item.dataset.key);
    });
  })

  selectType("I");
  addChoice();
  addChoice();
  addChoice();
}

function selectChoice(index) {
  const openedSurvey = document.querySelector('.turbo-box.active.top .opened-survey-container');
  const items = openedSurvey.querySelectorAll('.opened-survey-choice-container');
  const type = openedSurvey.querySelector('.opened-survey-type').dataset.type; 

  function selectSingleChoice(el) {
    if (el.dataset.index === index) {
      if (el.classList.contains('selected')) {
	el.dataset.value = -1;
        el.classList.remove('selected');
        el.querySelector('.opened-survey-choice-vote').textContent = "[ ]";
      } else {
	el.dataset.value = 0;
        el.classList.add('selected');
        el.querySelector('.opened-survey-choice-vote').textContent = "[X]";
      }
    } else {
      el.dataset.value = -1;
      el.classList.remove('selected');
      el.querySelector('.opened-survey-choice-vote').textContent = "[ ]";
    }
  }

  function selectMultipleChoice(el) {
    if (el.dataset.index === index) {
      if (el.classList.contains('selected')) {
	el.dataset.value = -1;
        el.classList.remove('selected');
        el.querySelector('.opened-survey-choice-vote').textContent = "[ ]";
      } else {
	el.dataset.value = 0;
        el.classList.add('selected');
        el.querySelector('.opened-survey-choice-vote').textContent = "[X]";
      }
    }
  }

  function selectRankChoice(el) {
    if (el.dataset.index !== index) {
      return;
    }

    let currentValue = parseInt(el.dataset.value, 10);
    let ranked = [...items].map(item => ({
        el: item,
        rank: parseInt(item.dataset.value, 10)
    }))
      .filter(x => x.rank >= 0)
      .sort((a, b) => a.rank - b.rank);

    // CASE 1: No ranks applied yet -> set this to rank 0
    if (ranked.length === 0) {
      el.dataset.value = 0;
      return;
    }
  
    let maxRank = ranked[ranked.length - 1].rank;
  
    // CASE 2: This item is unranked (rank == -1)
    if (currentValue === -1) {
      el.dataset.value = maxRank + 1;     
      return;
    }
  
    // CASE 3: Item is ranked and rank > 0 -> move up (rank - 1)
    if (currentValue > 0) {
      let newRank = currentValue - 1;
  
      items.forEach(item => {
        let r = parseInt(item.dataset.value, 10);
        if (r === newRank) {
          item.dataset.value = r + 1;
        }
      });
  
      el.dataset.value = newRank;
      return;
    }
  
    // CASE 4: Item has rank 0 -> unrank it
    if (currentValue === 0) {
      el.dataset.value = -1;
  
      items.forEach(item => {
        let r = parseInt(item.dataset.value, 10);
        if (r > 0) {
          item.dataset.value = r - 1;
        }
      });
  
      return;
    }
  }

  function formatRankChoices() {
    const ranks = [...items].map(i => parseInt(i.dataset.value, 10)).filter(r => r >= 0);

    if (ranks.length === 0) {
      items.forEach(item => {
        item.classList.remove('selected');
        item.querySelector(".opened-survey-choice-vote").textContent = "[ ]";
      });

      return;
    }

    const maxRank = Math.max(...ranks);

    function formatRank(rank, maxRank) {

      const width = String(maxRank).length;   
      const formattedRank = String(rank).padStart(width, "0");

      return `[${formattedRank}]`;
    }

    items.forEach(item => {
      const rank = parseInt(item.dataset.value, 10);
      
      if (rank < 0) {
        item.classList.remove('selected');
        item.querySelector(".opened-survey-choice-vote").textContent = "[ ]";
	
	return;
      } 

      const formatted = formatRank(rank, maxRank);
      item.classList.add('selected');
      item.querySelector(".opened-survey-choice-vote").textContent = formatted; 
    });
  }

  function selectMatrixChoice(el) {
    if (el.dataset.index !== index) {
      return;
    }

    let currentValue = parseInt(el.dataset.value, 10);
   
    switch(currentValue){
      case -1:
	el.dataset.value = 0;
        el.querySelector('.opened-survey-choice-vote').textContent  = "[" + matrixChoiceOptions[0] + "]";
        el.classList.add('selected');
	break;
      case 0:
	el.dataset.value = 1;
        el.querySelector('.opened-survey-choice-vote').textContent = "[" + matrixChoiceOptions[1] + "]";
        el.classList.add('selected');
	break;
      case 1:
	el.dataset.value = 2;
        el.querySelector('.opened-survey-choice-vote').textContent = "[" + matrixChoiceOptions[2] + "]";
        el.classList.add('selected');
	break;
      case 2:
	el.dataset.value = -1;
        el.querySelector('.opened-survey-choice-vote').textContent = "[ ]";
        el.classList.remove('selected');
	break;
    }
  
    return;
  }

  items.forEach(el => {
    let resetChoices = true;

    switch (type){
      case "singlechoice":
	selectSingleChoice(el);
        break;
      case "multiplechoice":
	selectMultipleChoice(el);
        break;
      case "rankchoice":
	selectRankChoice(el);
        formatRankChoices(); 
        break;
      case "matrixchoice":
	selectMatrixChoice(el)
        break;
    }
  });
}

function collectVoteData(container) {
  const vote = {};
  const voter = container.querySelector('.opened-survey-matrix-choice-name-template input');

  const items = container.querySelectorAll('.opened-survey-choice-container[data-index][data-value]');

  items.forEach(el => {
    const index = Number(el.dataset.index);
    const value = Number(el.dataset.value);

    // Skip "no choice" / default
    if (value !== -1) {
      vote[index] = value;
    }
  });


  return {vote: vote, voter: voter !== null ? voter.value : null};
}

/* ===================================== */
/* SUBMIT PASSWORD ===================== */
/* ===================================== */
function openProtectedId() {
  let password = ''; 

  const pwInput = document.getElementById('open-survey-pw-value');
  if (pwInput && pwInput.value.trim()) {
    password = pwInput.value.trim();
    pwInput.value = '';
  }
 
   const openSurveyPw = document.getElementById('open-survey-pw');
   const id = openSurveyPw.dataset.id;

   closeBox(openSurveyPw);
   submitOpenIdForm(id, password);
}

function voteProtectedId() {
  let password = ''; 

  const pwInput = document.getElementById('vote-survey-pw-value');
  if (pwInput && pwInput.value.trim()) {
    password = pwInput.value.trim();
    pwInput.value = '';
  }

   const voteSurveyPw = document.getElementById('vote-survey-pw');
   const id = voteSurveyPw.dataset.id;
   const openedSurvey = document.getElementById(id);
   const voteData = collectVoteData(openedSurvey); 

   closeBox(voteSurveyPw);
   submitVoteIdForm(id, voteData, password);
}

/* ===================================== */
/* APPLY SETTIGNS ====================== */
/* ===================================== */
function applySettings() {
  const settings = document.getElementById('new-survey-settings'); 
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

  document.getElementById('new-survey-pw-value').value = pwValue1;
  document.getElementById('new-survey-expiry-value').value = expiryValue;

  settings.querySelectorAll('.pw-value').forEach(x => {
    x.value = '';
  });
  expiry.value = 1;

  closeBox(settings);
}

/* ===================================== */
/* COPY ID ============================= */
/* ===================================== */
function copyId() {
  if (document.querySelector('#new-survey-id.active.top') === null){
    return;
  }

  const surveyId = document.getElementById('survey-id');

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(surveyId.value);
  } else {
    console.error("Clipboard API not supported");
  }

  surveyId.classList.add('content-copied');

  setTimeout(() => {
    surveyId.classList.remove('content-copied');
  }, 500);
}

document.getElementById('copy-survey-id').addEventListener('click', () => {
  copyId();
});

/* ===================================== */
/* BUTTONS ============================= */
/* ===================================== */
document.addEventListener('click', (e) => {
  const t = e.target;
	
  if (t?.id === 'open-new-survey-settings' || t?.parentElement.id === 'open-new-survey-settings'){
    openBox('new-survey-settings', true); 
  }

  if (t?.id === 'set-new-survey-settings-values' || t?.parentElement.id === 'set-new-survey-settings-values'){
    applySettings();
  }

  if (t?.id === 'submit-open-survey-pw' || t?.parentElement.id === 'submit-open-survey-pw'){
    openProtectedId();
  }

  if (t?.id === 'submit-vote-survey-pw' || t?.parentElement.id === 'submit-vote-survey-pw'){
    voteProtectedId();
  }
});

/* ===================================== */
/* KEY MAPPING ========================= */
/* ===================================== */
window.pageKeymap = {
  H: (e) => window.location.href = document.getElementById('back-to-home').href,
  N: (e) => openBox('new-survey'),
  G: (e) => openBox('open-survey', true),
  U: (e) => openBox('about'),

  I: handleAskKey,
  M: handleAskKey,
  R: handleAskKey,
  X: handleAskKey,
  Delete: handleAskKey,
  D: handleAskKey,
  V: handleAskKey,

  T: handleAskKey,
  S: handleAskKey,
  E: handleAskKey,
  O: handleAskKey,
  C: handleAskKey,
};

function handleAskKey(e) {
  const key = e.key.toUpperCase();
  const settings = document.getElementById('new-survey-settings');
  const openSurvey = document.getElementById('open-survey');
  const openSurveyPw = document.getElementById('open-survey-pw');
  const voteSurveyPw = document.getElementById('vote-survey-pw');
  const openedSurvey = document.querySelector('.box.active.top .opened-survey-container');
  const newSurvey = document.getElementById('new-survey');
  const id = document.getElementById('new-survey-id');

  const cond_openSurveyActive = openSurvey.classList.contains('active') && openSurvey.classList.contains('top');
  const cond_openedSurvey = openedSurvey;
  const cond_openedSurveyChoiceFocused = openedSurvey && openedSurvey.querySelector('.opened-survey-choice-container:focus');
  const cond_newSurveyActive = newSurvey.classList.contains('active') && newSurvey.classList.contains('top');
  const cond_idActive = id.classList.contains('active') && id.classList.contains('top');
  const cond_settingsActive = settings.classList.contains('active') && settings.classList.contains('top');
  const cond_openIdPwActive = openSurveyPw.classList.contains('active') && openSurveyPw.classList.contains('top');
  const cond_voteIdPwActive = voteSurveyPw.classList.contains('active') && voteSurveyPw.classList.contains('top');

  // Set survey type
  const survey_type_keys = new Set(["I", "M", "R", "X"]);

  if (cond_newSurveyActive && survey_type_keys.has(key)) {
    selectType(key);
  }

  // Select choice in focus
  if (cond_openedSurveyChoiceFocused && key == "X") {
    const focusedChoice = openedSurvey.querySelector('.opened-survey-choice-container:focus');
    selectChoice(focusedChoice.dataset.index); 
  }

  // Refresh opened survey
  if (cond_openedSurvey && key == "R") {
    const surveyId = openedSurvey.closest('.box.active.top').id;
    const refreshSurveyForm = document.getElementById(`refresh-survey-${surveyId}-form`);
    const rawInput = refreshSurveyForm.querySelector('.refresh-survey').value.trim();

    submitOpenIdForm(rawInput);
  }

  // Vote on opened survey
  if (cond_openedSurvey && key == "V") {
    const surveyId = openedSurvey.closest('.box.active.top').id;
    const voteData = collectVoteData(openedSurvey);

    submitVoteIdForm(surveyId, voteData);
  }
 
  if (cond_voteIdPwActive && key == "V") {
    voteProtectedId(); 
  }

  // Add new choice item
  if (cond_newSurveyActive && key == "D") {
    addChoice();
  }

  // Remove focused choice item
  if (cond_newSurveyActive && key == "DELETE") {
    removeChoice();
  }

  // Open settings
  if (cond_newSurveyActive && key == 'T') {
    openBox('new-survey-settings', true);
  }

  // Set settings
  if (cond_settingsActive && key == 'S') {
    applySettings(); 
  }
  
  // Submit open id form
  if (cond_openSurveyActive && key == 'E') {
    const rawInput = document.getElementById('open-survey-id').value.trim();
    submitOpenIdForm(rawInput);
  }

  if (cond_openIdPwActive && key == 'E') {
    openProtectedId();
  }

  // Submit new survey form
  if (cond_newSurveyActive && key == 'O') {
    submitNewSurveyForm();
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

    if (segments[0] === 'ask' && segments[1]) {
      autoLoadPaste(segments[1]);
    }
  }, 50);
});
