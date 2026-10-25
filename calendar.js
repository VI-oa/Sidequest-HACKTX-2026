const container = document.getElementById('calendar-plans');
const status = document.getElementById('status');

let plans = [];
let statusTimer;

try {
    const saved = JSON.parse(
        localStorage.getItem('sidequest-plans') || '[]'
    );

    if (Array.isArray(saved)) {
        plans = saved;
    }
} catch {
    announce('Your saved plans could not be read.');
}

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

document.getElementById('timezone').textContent =
    `Dates and times use your timezone: ${timezone}`;

function announce(message) {
    status.textContent = message;

    clearTimeout(statusTimer);

    statusTimer = setTimeout(() => {
        status.textContent = '';
    }, 5000);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function localDateValue(date) {
    const offset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - offset)
        .toISOString()
        .slice(0, 16);
}

function defaultStart() {
    const date = new Date(Date.now() + 86400000);
    date.setHours(18, 0, 0, 0);

    return date;
}

function titleFor(plan) {
    return plan.title || plan.description?.slice(0, 80) || 'Sidequest';
}

function renderPlans() {
    container.innerHTML = plans.map((plan, index) => {
        const storedDate = new Date(plan.startsAt || '');
        const hasDate = Number.isFinite(storedDate.getTime());
        const start = hasDate ? storedDate : defaultStart();

        const minutes =
            Number.isInteger(plan.minutes) && plan.minutes > 0
                ? Math.min(plan.minutes, 180)
                : 30;

        return `
      <article class="calendar-card">
        <p class="eyebrow">
          ${plan.mode === 'Virtual' ? 'VIRTUAL' : 'IN PERSON'}
        </p>

        <h2>${escapeHTML(titleFor(plan))}</h2>
        <p>${escapeHTML(plan.description || '')}</p>

        ${hasDate ? `
          <p class="saved-time">
            Scheduled: ${escapeHTML(storedDate.toLocaleString())}
          </p>
        ` : ''}

        <form data-plan-index="${index}">
          <div class="schedule-fields">
            <label for="start-${index}">
              Starts at
              <input
                class="field"
                id="start-${index}"
                name="start"
                type="datetime-local"
                value="${localDateValue(start)}"
                required
              >
            </label>

            <label for="duration-${index}">
              Minutes
              <input
                class="field"
                id="duration-${index}"
                name="minutes"
                type="number"
                min="5"
                max="180"
                step="1"
                value="${minutes}"
                required
              >
            </label>
          </div>

          <div class="actions">
            <button
              type="submit"
              name="action"
              value="download"
            >Download calendar event</button>

            <button
              type="submit"
              class="secondary"
              name="action"
              value="google"
            >Add to Google Calendar ↗</button>
          </div>
        </form>
      </article>
    `;
    }).join('');

    document.getElementById('empty-message').hidden =
        plans.length !== 0;
}

// Calendar files use UTC timestamps, so calendar apps can convert
// the event to the viewer's local timezone.
function calendarTimestamp(date) {
    return date.toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}/, '');
}

function escapeCalendarText(value) {
    return String(value || '')
        .replace(/\\/g, '\\\\')
        .replace(/\r\n|\r|\n/g, '\\n')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,');
}

// Calendar lines should be no longer than 75 UTF-8 bytes.
function foldCalendarLine(line) {
    const encoder = new TextEncoder();

    let result = '';
    let current = '';
    let bytes = 0;

    for (const character of line) {
        const size = encoder.encode(character).length;

        if (bytes + size > 75) {
            result += current + '\r\n';
            current = ' ';
            bytes = 1;
        }

        current += character;
        bytes += size;
    }

    return result + current;
}

function downloadEvent(plan, start, end) {
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Sidequest//Shared Plans//EN',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        `UID:${plan.id}@sidequest.local`,
        `DTSTAMP:${calendarTimestamp(new Date())}`,
        `DTSTART:${calendarTimestamp(start)}`,
        `DTEND:${calendarTimestamp(end)}`,
        `SUMMARY:${escapeCalendarText(titleFor(plan))}`,
        `DESCRIPTION:${escapeCalendarText(plan.description)}`,
        `LOCATION:${plan.mode === 'Virtual' ? 'Online - agree on a call link' : 'To be agreed'}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ];

    const content =
        lines.map(foldCalendarLine).join('\r\n') + '\r\n';

    const blob = new Blob([content], {
        type: 'text/calendar;charset=utf-8'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'sidequest-plan.ics';

    document.body.append(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function openGoogleCalendar(plan, start, end) {
    const parameters = new URLSearchParams({
        action: 'TEMPLATE',
        text: titleFor(plan),
        dates:
            `${calendarTimestamp(start)}/${calendarTimestamp(end)}`,
        details: plan.description || '',
        location: plan.mode === 'Virtual'
            ? 'Online - agree on a call link'
            : 'To be agreed'
    });

    window.open(
        `https://calendar.google.com/calendar/render?${parameters}`,
        '_blank',
        'noopener,noreferrer'
    );
}

container.addEventListener('submit', (event) => {
    event.preventDefault();

    const form = event.target;
    const index = Number(form.dataset.planIndex);
    const plan = plans[index];

    if (!plan || !form.reportValidity()) return;

    const start = new Date(form.elements.start.value);
    const minutes = Number(form.elements.minutes.value);

    if (
        !Number.isFinite(start.getTime()) ||
        start.getTime() <= Date.now()
    ) {
        announce('Choose a future date and time.');
        return;
    }

    if (
        !Number.isInteger(minutes) ||
        minutes < 5 ||
        minutes > 180
    ) {
        announce('Choose a duration between 5 and 180 minutes.');
        return;
    }

    const end = new Date(start.getTime() + minutes * 60000);

    plan.id ||= crypto.randomUUID();
    plan.startsAt = start.toISOString();
    plan.minutes = minutes;

    try {
        localStorage.setItem(
            'sidequest-plans',
            JSON.stringify(plans)
        );
    } catch {
        announce('Could not save the schedule in this browser.');
        return;
    }

    if (event.submitter?.value === 'google') {
        openGoogleCalendar(plan, start, end);
        announce('Finish saving the event in Google Calendar.');
    } else {
        downloadEvent(plan, start, end);
        announce('Open the downloaded .ics file to add the event.');
    }

    renderPlans();
});

renderPlans();