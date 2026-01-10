const titleEl = document.getElementById("stepTitle");
const summaryEl = document.getElementById("stepSummary");
const actionsEl = document.getElementById("stepActions");
const detailsEl = document.getElementById("stepDetails");
const metaEl = document.getElementById("stepMeta");

function populateList(listEl, items) {
  listEl.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    listEl.appendChild(li);
  });
}

const params = new URLSearchParams(window.location.search);
const stepId = params.get("id");
const step = DATA.steps.find((item) => item.id === stepId);

if (!step) {
  titleEl.textContent = "Step not found";
  summaryEl.textContent = "Return to the guided setup and select a valid step.";
  metaEl.textContent = stepId ? `Missing step: ${stepId}` : "Missing step id";
  populateList(actionsEl, ["Return to the guided setup", "Select a step with details"]);
  populateList(detailsEl, ["If this persists, refresh the page or reopen the step."]);
} else {
  titleEl.textContent = step.title;
  summaryEl.textContent = step.summary;
  document.title = `${step.title} | Evolt 360`;
  metaEl.textContent = `Step ID: ${step.id}`;
  populateList(actionsEl, step.actions || []);
  const detailItems = step.details && step.details.length ? step.details : step.actions;
  populateList(detailsEl, detailItems || []);
}
