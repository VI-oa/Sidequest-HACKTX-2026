const form = document.getElementById('planner-form');
const generateButton = document.getElementById('generate-button');
const saveButton = document.getElementById('save-plan');
const status = document.getElementById('planner-status');

let currentPlan = null;

function localDateValue(date) {
  return new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  ).toISOString().slice(0, 16);
}

const defaultStart = new Date();
defaultStart.setDate(defaultStart.getDate() + 1);
defaultStart.setHours(18, 0, 0, 0);
document.getElementById('plan-start').value = localDateValue(defaultStart);

async function generatePlan() {
  if (!form.reportValidity()) return;

  const idea = document.getElementById('idea').value.trim();
  const startsAt = new Date(document.getElementById('plan-start').value);
  const location = document.getElementById('plan-location').value.trim();

  if (!idea || !location) {
    status.textContent = 'Add your idea and place or call details first.';
    return;
  }

  if (!Number.isFinite(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
    status.textContent = 'Choose a future date and time for your plan.';
    return;
  }

  generateButton.disabled = true;
  currentPlan = null;

  document.getElementById('result').hidden = true;

  status.textContent = 'Finding a little overlap with Meta…';

  try {
    const response = await fetch('/api/plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idea,
        mode: document.getElementById('mode').value,
        minutes: Number(document.getElementById('minutes').value),
        budget: Number(document.getElementById('budget').value),
        friends: Array.from(
          document.querySelectorAll('[name="friend"]:checked')
        ).map((input) => input.value)
      }),
      signal: AbortSignal.timeout(30000)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Could not generate a plan.');
    }

    currentPlan = data;

    document.getElementById('result-source').textContent =
      data.source === 'meta'
        ? 'META AI SUGGESTION'
        : 'SAMPLE IDEA · NOT LIVE AI';

    document.getElementById('result-title').textContent = data.title;
    document.getElementById('result-description').textContent =
      data.description;

    document.getElementById('result-details').textContent =
      `${data.mode === 'virtual' ? 'Virtual' : 'In person'} · ` +
      `${data.minutes} minutes · $${data.cost} per person`;

    document.getElementById('result-why').textContent = data.why;

    const steps = document.getElementById('result-steps');
    steps.replaceChildren();

    data.steps.forEach((step) => {
      const item = document.createElement('li');
      item.textContent = step;
      steps.append(item);
    });

    saveButton.disabled = false;
    saveButton.textContent = 'Save invitation to my feed';

    document.getElementById('result').hidden = false;
    status.textContent = 'Your idea is ready. Review it before saving.';
  } catch (error) {
    status.textContent =
      error.name === 'TimeoutError'
        ? 'That took too long. Please try again.'
        : error.message;
  } finally {
    generateButton.disabled = false;
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  generatePlan();
});

saveButton.addEventListener('click', () => {
  if (!currentPlan) return;

  try {
    const startsAt = new Date(document.getElementById('plan-start').value);
    const location = document.getElementById('plan-location').value.trim();

    if (!Number.isFinite(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
      throw new Error('Choose a future date and time for your plan.');
    }

    if (!location) {
      throw new Error('Add a place or call detail for your plan.');
    }

    const saved = JSON.parse(
      localStorage.getItem('sidequest-plans') || '[]'
    );

    if (!Array.isArray(saved)) {
      throw new Error('Your saved plans could not be read.');
    }

    saved.push({
      id: crypto.randomUUID(),
      title: currentPlan.title,
      description:
        `${currentPlan.title} — ${currentPlan.description}`,
      mode: currentPlan.mode === 'virtual' ? 'Virtual' : 'In person',
      minutes: currentPlan.minutes,
      cost: currentPlan.cost,
      startsAt: startsAt.toISOString(),
      location,
      tags: [
        ...new Set(
          document.getElementById('plan-tags').value
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        )
      ].slice(0, 6),
      audience: 'everyone',
      requiresApproval: false,
      steps: currentPlan.steps,
      why: currentPlan.why,
      source: currentPlan.source,
      createdAt: new Date().toISOString()
    });

    localStorage.setItem('sidequest-plans', JSON.stringify(saved));

    saveButton.disabled = true;
    saveButton.textContent = 'Saved ✓';

    status.textContent =
      'Saved. Go back to your circle to see your invitation.';
  } catch (error) {
    status.textContent = `Could not save: ${error.message}`;
  }
});