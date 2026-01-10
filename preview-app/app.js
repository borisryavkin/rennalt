const serialInput = document.getElementById("serial");
const scanBtn = document.getElementById("scanBtn");
const serialResult = document.getElementById("serialResult");
const stepsEl = document.getElementById("steps");
const issuesEl = document.getElementById("issues");
const issueSearch = document.getElementById("issueSearch");
const issueBtn = document.getElementById("issueBtn");
const chatInput = document.getElementById("chatInput");
const chatBtn = document.getElementById("chatBtn");
const chatAnswer = document.getElementById("chatAnswer");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const modelStat = document.getElementById("modelStat");
const stepStat = document.getElementById("stepStat");

let currentModel = "Unknown";
let completed = new Set();
let typeTimer = null;
let knowledgeBase = [];
let vocab = new Map();
let docVectors = [];
let docNorms = [];
let docFreq = new Map();
const OLLAMA_ENDPOINT = "http://localhost:11434/api/generate";
const OLLAMA_MODEL = "llama3.1:8b";
const MAX_CONTEXT_DOCS = 4;
const GREETING_RE = /^(hi|hello|hey|yo|sup|good (morning|afternoon|evening))\b/i;

function parseSerial(serial) {
  const match = serial.match(/EV\d{6}-(\d{5,8})/);
  if (!match) return null;
  const raw = match[1];
  const year = raw.slice(0, 4);
  return year;
}

function resolveModel(serial) {
  const date = parseSerial(serial);
  if (!date) return "Unknown";
  if (date >= "2025") return "LP3";
  if (date >= "2024") return "LP1";
  return "SOM";
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "into",
  "this",
  "that",
  "then",
  "when",
  "what",
  "how",
  "where",
  "which",
  "your",
  "you",
  "are",
  "can",
  "does",
  "do",
  "its",
  "it's",
  "on",
  "to",
  "in",
  "of",
  "a",
  "an",
  "is",
  "be",
  "or",
  "as",
  "at",
  "by",
  "it"
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

function buildKnowledgeBase() {
  const docs = [];

  DATA.steps.forEach((step) => {
    docs.push({
      id: step.id,
      type: "setup",
      title: step.title,
      body: `${step.summary} ${step.actions.join(" ")}`
    });
  });

  DATA.troubleshooting.forEach((issue) => {
    docs.push({
      id: issue.id,
      type: "troubleshooting",
      title: issue.title,
      body: issue.steps.join(" ")
    });
  });

  DATA.chatbot.forEach((item, index) => {
    docs.push({
      id: `faq.${index}`,
      type: "faq",
      title: item.q,
      body: `${item.q} ${item.a}`,
      answer: item.a
    });
  });

  if (typeof KB_DOCS !== "undefined" && Array.isArray(KB_DOCS)) {
    KB_DOCS.forEach((doc) => {
      if (!doc || !doc.body) return;
      docs.push({
        id: doc.id,
        type: "kb",
        title: doc.title || "Knowledge Base",
        body: doc.body,
        url: doc.url
      });
    });
  }

  if (typeof DOCX_DOCS !== "undefined" && Array.isArray(DOCX_DOCS)) {
    DOCX_DOCS.forEach((doc) => {
      if (!doc || !doc.body) return;
      docs.push({
        id: doc.id,
        type: "docx",
        title: doc.title || "Troubleshooting",
        body: doc.body
      });
    });
  }

  knowledgeBase = docs;
}

function trainModel() {
  buildKnowledgeBase();
  vocab = new Map();
  docVectors = [];
  docNorms = [];
  docFreq = new Map();

  knowledgeBase.forEach((doc) => {
    const tokens = new Set(tokenize(`${doc.title} ${doc.body}`));
    tokens.forEach((token) => {
      docFreq.set(token, (docFreq.get(token) || 0) + 1);
    });
  });

  const tokens = Array.from(docFreq.keys());
  tokens.forEach((token, index) => {
    vocab.set(token, index);
  });

  knowledgeBase.forEach((doc) => {
    const vector = new Array(vocab.size).fill(0);
    const tokensList = tokenize(`${doc.title} ${doc.body}`);
    const termCounts = new Map();
    tokensList.forEach((token) => {
      termCounts.set(token, (termCounts.get(token) || 0) + 1);
    });

    termCounts.forEach((count, token) => {
      const index = vocab.get(token);
      if (index === undefined) return;
      const tf = count / tokensList.length;
      const idf = Math.log((1 + knowledgeBase.length) / (1 + docFreq.get(token))) + 1;
      vector[index] = tf * idf;
    });

    const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
    docVectors.push(vector);
    docNorms.push(norm || 1);
  });
}

function renderSteps() {
  stepsEl.innerHTML = "";
  DATA.steps.forEach((step, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.animationDelay = `${index * 0.03}s`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = completed.has(step.id);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) completed.add(step.id);
      else completed.delete(step.id);
      updateProgress();
    });
    card.addEventListener("click", (event) => {
      if (event.target === checkbox) return;
      if (event.target.closest("a")) return;
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event("change"));
    });

    const title = document.createElement("h3");
    title.textContent = step.title;

    const summary = document.createElement("p");
    summary.textContent = step.summary;

    const list = document.createElement("p");
    list.className = "card-quick";
    list.textContent = step.actions.join(" | ");

    const detailLink = document.createElement("a");
    detailLink.className = "detail-link";
    detailLink.href = `step.html?id=${encodeURIComponent(step.id)}`;
    detailLink.textContent = "Open detailed steps";

    let tags = null;
    if (currentModel !== "Unknown") {
      tags = document.createElement("div");
      tags.className = "tags";
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = currentModel;
      tags.appendChild(tag);
    }

    card.appendChild(checkbox);
    card.appendChild(title);
    card.appendChild(summary);
    card.appendChild(list);
    card.appendChild(detailLink);
    if (tags) card.appendChild(tags);
    stepsEl.appendChild(card);
  });

  stepStat.textContent = DATA.steps.length;
}

function renderIssues(filter = "") {
  const query = filter.trim().toLowerCase();
  issuesEl.innerHTML = "";
  const results = DATA.troubleshooting.filter((issue) =>
    issue.title.toLowerCase().includes(query)
  );
  const list = results.length ? results : DATA.troubleshooting;

  list.forEach((issue, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.animationDelay = `${index * 0.03}s`;

    const title = document.createElement("h3");
    title.textContent = issue.title;

    const steps = document.createElement("p");
    steps.textContent = issue.steps.join(" | ");

    const detail = document.createElement("p");
    detail.className = "card-detail";
    detail.textContent = `Fix: ${issue.steps.join(" -> ")}`;
    detail.style.display = "none";

    card.addEventListener("click", () => {
      const isOpen = detail.style.display === "block";
      detail.style.display = isOpen ? "none" : "block";
      card.classList.toggle("active", !isOpen);
    });

    card.appendChild(title);
    card.appendChild(steps);
    card.appendChild(detail);
    issuesEl.appendChild(card);
  });
}

function embedQuery(text) {
  const vector = new Array(vocab.size).fill(0);
  const tokensList = tokenize(text);
  const termCounts = new Map();
  tokensList.forEach((token) => {
    termCounts.set(token, (termCounts.get(token) || 0) + 1);
  });

  termCounts.forEach((count, token) => {
    const index = vocab.get(token);
    if (index === undefined) return;
    const tf = count / tokensList.length;
    const idf = Math.log((1 + knowledgeBase.length) / (1 + docFreq.get(token))) + 1;
    vector[index] = tf * idf;
  });

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return { vector, norm: norm || 1 };
}

function searchKnowledge(query) {
  if (!vocab.size) return [];
  const { vector, norm } = embedQuery(query);
  const scored = knowledgeBase.map((doc, index) => {
    const dot = docVectors[index].reduce((sum, value, i) => sum + value * vector[i], 0);
    const score = dot / (docNorms[index] * norm);
    return { doc, score };
  });

  return scored
    .filter((item) => item.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function formatLocalAnswer(query) {
  if (GREETING_RE.test(query.trim())) {
    return "Hi! Ask me about setup, troubleshooting, or any Evolt scanner step.";
  }

  const results = searchKnowledge(query);
  if (!results.length) {
    return "I can help with setup, troubleshooting, and FAQs. Try asking about Wi-Fi, software updates, or printer setup.";
  }

  const primary = results[0].doc;
  const sources = results.map((item) => (
    item.doc.url ? `${item.doc.title} (${item.doc.url})` : item.doc.title
  ));
  let answer = "";

  if (primary.type === "faq" && primary.answer) {
    answer = primary.answer;
  } else if (primary.type === "troubleshooting") {
    answer = `Try this fix: ${extractSnippet(primary, query)}`;
  } else if (primary.type === "kb") {
    answer = extractSnippet(primary, query);
  } else {
    answer = extractSnippet(primary, query);
  }

  return `${answer}\n\nSources: ${sources.join(" | ")}`;
}

function buildContext(results) {
  if (!results.length) return "No relevant context found.";
  return results
    .slice(0, MAX_CONTEXT_DOCS)
    .map((item, index) => {
      const doc = item.doc;
      const title = doc.url ? `${doc.title} (${doc.url})` : doc.title;
      const snippet = extractSnippet(doc, item.query);
      return `Source ${index + 1}: ${title}\n${snippet}`;
    })
    .join("\n\n");
}

function extractSnippet(doc, query) {
  const body = doc.body.replace(/\s+/g, " ").trim();
  if (!body) return "";

  if (doc.type === "kb") {
    const lowerBody = body.toLowerCase();
    const title = (doc.title || "").trim();
    if (title) {
      const lowerTitle = title.toLowerCase();
      const lastTitleIndex = lowerBody.lastIndexOf(lowerTitle);
      if (lastTitleIndex !== -1) {
        const start = Math.min(lastTitleIndex + lowerTitle.length, body.length);
        const tail = body.slice(start).trim();
        if (tail.length) {
          return tail.length > 900 ? `${tail.slice(0, 900)}...` : tail;
        }
      }
    }
  }

  let start = 0;
  const tokens = tokenize(query);
  if (tokens.length) {
    const lowerBody = body.toLowerCase();
    for (const token of tokens) {
      const idx = lowerBody.indexOf(token);
      if (idx !== -1) {
        start = Math.max(idx - 200, 0);
        break;
      }
    }
  }

  const snippet = body.slice(start).trim();
  return snippet.length > 900 ? `${snippet.slice(0, 900)}...` : snippet;
}

async function askOllama(query) {
  if (GREETING_RE.test(query.trim())) {
    return formatLocalAnswer(query);
  }
  const results = searchKnowledge(query).map((item) => ({ ...item, query }));
  const context = buildContext(results);
  const prompt = [
    "You are the Evolt 360 support assistant.",
    "Use the context to answer the question accurately and concisely.",
    "If the answer is not in the context, say you do not know and suggest what to check next.",
    "",
    "Context:",
    context,
    "",
    `Question: ${query}`,
    "Answer:"
  ].join("\n");

  const response = await fetch(OLLAMA_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }

  const data = await response.json();
  const text = (data.response || "").trim();
  return text || formatLocalAnswer(query);
}

function typeAnswer(text) {
  if (typeTimer) clearInterval(typeTimer);
  chatAnswer.textContent = "";
  let index = 0;
  typeTimer = setInterval(() => {
    chatAnswer.textContent += text.charAt(index);
    index += 1;
    if (index >= text.length) {
      clearInterval(typeTimer);
      typeTimer = null;
    }
  }, 18);
}

function updateProgress() {
  const total = DATA.steps.length || 1;
  const percent = Math.round((completed.size / total) * 100);
  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${percent}% complete`;
}

scanBtn.addEventListener("click", () => {
  const serial = serialInput.value.trim();
  currentModel = resolveModel(serial);
  serialResult.textContent = currentModel === "Unknown"
    ? "Model not recognized. Check the serial format it should EV001693-20230."
    : `Model detected: ${currentModel}`;
  modelStat.textContent = currentModel;
  renderSteps();
});

issueBtn.addEventListener("click", () => {
  renderIssues(issueSearch.value);
});

chatBtn.addEventListener("click", () => {
  const query = chatInput.value.trim();
  if (!query) {
    chatAnswer.textContent = "Ask a question to see an answer.";
    return;
  }
  chatAnswer.textContent = "Thinking...";
  askOllama(query)
    .then((answer) => typeAnswer(answer))
    .catch(() => {
      typeAnswer(formatLocalAnswer(query));
    });
});

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    chatBtn.click();
  }
});

trainModel();
renderSteps();
renderIssues();
updateProgress();
