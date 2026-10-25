const people = [
  {
    id: 'maya',
    name: 'Maya Chen',
    username: 'maya',
    bio: 'Cooking something new and finding good company.',
    interests: ['Cooking', 'Photography', 'Exploring']
  },
  {
    id: 'alex',
    name: 'Alex Rivera',
    username: 'alex',
    bio: 'A sketchbook, a playlist, and a little company.',
    interests: ['Drawing', 'Music', 'Games']
  },
  {
    id: 'jamie',
    name: 'Jamie Park',
    username: 'jamie',
    bio: 'Here for quiet conversations and tiny adventures.',
    interests: ['Walking', 'Photography', 'Music']
  }
];

const defaultProfile = {
  name: 'Ziying',
  bio: 'Creating things and making time for friends.',
  interests: ['Art', 'Music', 'Games']
};

function readSaved(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

let profile = readSaved('sidequest-profile', defaultProfile);

if (
  typeof profile.name !== 'string' ||
  typeof profile.bio !== 'string' ||
  !Array.isArray(profile.interests)
) {
  profile = defaultProfile;
}

let following = readSaved('sidequest-following', []);

if (!Array.isArray(following)) {
  following = [];
}

let filter = 'all';
let selectedPerson = null;
let statusTimer;

const grid = document.getElementById('people-grid');
const search = document.getElementById('people-search');
const editDialog = document.getElementById('edit-dialog');
const personDialog = document.getElementById('person-dialog');

function announce(message) {
  const status = document.getElementById('status');
  status.textContent = message;

  clearTimeout(statusTimer);

  statusTimer = setTimeout(() => {
    status.textContent = '';
  }, 3000);
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    announce('Browser storage is unavailable. Changes last this session only.');
    return false;
  }
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

function interestsHTML(interests) {
  return interests
    .filter((interest) => typeof interest === 'string')
    .map((interest) => `<li>${escapeHTML(interest)}</li>`)
    .join('');
}

function renderMyProfile() {
  document.getElementById('my-name').textContent = profile.name;
  document.getElementById('my-bio').textContent = profile.bio;
  document.getElementById('my-avatar').textContent =
    profile.name.charAt(0).toUpperCase();

  document.getElementById('my-interests').innerHTML =
    interestsHTML(profile.interests);
}

function renderPeople() {
  const query = search.value.trim().toLowerCase();

  const matches = people.filter((person) => {
    const searchable =
      `${person.name} ${person.interests.join(' ')}`.toLowerCase();

    const matchesSearch = searchable.includes(query);
    const matchesFilter =
      filter === 'all' || following.includes(person.id);

    return matchesSearch && matchesFilter;
  });

  grid.innerHTML = matches.map((person) => {
    const isFollowing = following.includes(person.id);

    return `
      <article class="person-card">
        <div class="avatar" aria-hidden="true">
          ${escapeHTML(person.name.charAt(0))}
        </div>

        <h3>${escapeHTML(person.name)}</h3>
        <p class="username">@${escapeHTML(person.username)}</p>
        <p class="person-bio">${escapeHTML(person.bio)}</p>

        <ul class="interests">
          ${interestsHTML(person.interests)}
        </ul>

        <div class="actions">
          <button
            type="button"
            data-follow="${person.id}"
            aria-pressed="${isFollowing}"
          >${isFollowing ? 'Following ✓' : 'Follow'}</button>

          <button
            type="button"
            class="secondary"
            data-view="${person.id}"
          >View profile</button>
        </div>
      </article>
    `;
  }).join('');

  const count = people.filter((person) =>
    following.includes(person.id)
  ).length;

  document.getElementById('following-count').textContent =
    `${count} following`;

  document.getElementById('empty-message').hidden =
    matches.length !== 0;
}

function renderPerson() {
  const person = people.find((person) =>
    person.id === selectedPerson
  );

  if (!person) return;

  const isFollowing = following.includes(person.id);

  document.getElementById('person-content').innerHTML = `
    <div class="avatar large" aria-hidden="true">
      ${escapeHTML(person.name.charAt(0))}
    </div>

    <h2 id="person-heading">${escapeHTML(person.name)}</h2>
    <p class="username">@${escapeHTML(person.username)}</p>
    <p class="person-bio">${escapeHTML(person.bio)}</p>

    <ul class="interests">
      ${interestsHTML(person.interests)}
    </ul>

    <button
      type="button"
      data-follow="${person.id}"
      aria-pressed="${isFollowing}"
    >${isFollowing ? 'Following ✓' : 'Follow'}</button>

    <p class="demo-note">Sample profile · local prototype</p>
  `;
}

document.addEventListener('click', (event) => {
  const followButton = event.target.closest('[data-follow]');
  const viewButton = event.target.closest('[data-view]');

  if (followButton) {
    const id = followButton.dataset.follow;
    const wasFollowing = following.includes(id);

    following = wasFollowing
      ? following.filter((personId) => personId !== id)
      : [...following, id];

    const saved = save('sidequest-following', following);

    renderPeople();

    if (personDialog.open) {
      renderPerson();
    }

    if (saved) {
      announce(wasFollowing ? 'Unfollowed sample profile.' : 'Following saved.');
    }
  }

  if (viewButton) {
    selectedPerson = viewButton.dataset.view;
    renderPerson();
    personDialog.showModal();
  }
});

search.addEventListener('input', renderPeople);

document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    filter = button.dataset.filter;

    document.querySelectorAll('[data-filter]').forEach((item) => {
      item.setAttribute('aria-pressed', String(item === button));
    });

    renderPeople();
  });
});

document.getElementById('edit-button').addEventListener('click', () => {
  document.getElementById('edit-name').value = profile.name;
  document.getElementById('edit-bio').value = profile.bio;
  document.getElementById('edit-interests').value =
    profile.interests.join(', ');

  editDialog.showModal();
});

document.getElementById('cancel-edit').addEventListener('click', () => {
  editDialog.close();
});

document.getElementById('close-person').addEventListener('click', () => {
  personDialog.close();
});

document.getElementById('edit-name').addEventListener('input', (event) => {
  event.target.setCustomValidity('');
});

document.getElementById('edit-form').addEventListener('submit', (event) => {
  event.preventDefault();

  const nameInput = document.getElementById('edit-name');
  const name = nameInput.value.trim();

  if (!name) {
    nameInput.setCustomValidity('Enter your name.');
    nameInput.reportValidity();
    return;
  }

  profile = {
    name,
    bio: document.getElementById('edit-bio').value.trim(),
    interests: document.getElementById('edit-interests').value
      .split(',')
      .map((interest) => interest.trim())
      .filter(Boolean)
      .slice(0, 8)
  };

  const saved = save('sidequest-profile', profile);

  renderMyProfile();
  editDialog.close();

  if (saved) announce('Profile saved.');
});

renderMyProfile();
renderPeople();