const createButton = document.getElementById('create-button');
const planDialog = document.getElementById('plan-dialog');
const cancelButton = document.getElementById('cancel-button');
const savedPlans = JSON.parse(
    localStorage.getItem('sidequest-plans') || '[]'
);

createButton.addEventListener('click', () => {
    planDialog.showModal();
});

cancelButton.addEventListener('click', () => {
    planDialog.close();
});

const planForm = document.getElementById('plan-form');
const descriptionInput = document.getElementById('plan-description');
const modeInput = document.getElementById('plan-mode');
const feed = document.querySelector('.feed');

planForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const description = descriptionInput.value.trim();
    const mode = modeInput.value === 'virtual' ? 'Virtual' : 'In person';

    if (!description) {
        descriptionInput.setCustomValidity('Write a little about your plan.');
        descriptionInput.reportValidity();
        return;
    }

    addPlanToFeed({ description, mode });

    savedPlans.push({
        description: description,
        mode: mode
    });

    localStorage.setItem(
        'sidequest-plans',
        JSON.stringify(savedPlans)
    );

    planForm.reset();
    planDialog.close();
});

descriptionInput.addEventListener('input', () => {
    descriptionInput.setCustomValidity('');
});

savedPlans.forEach(addPlanToFeed);

function addPlanToFeed(plan) {
    const post = document.createElement('article');
    post.classList.add('post');

    post.dataset.mode = plan.mode === 'Virtual'
        ? 'virtual'
        : 'in-person';

    const author = document.createElement('p');
    author.classList.add('author');
    const profile = JSON.parse(
        localStorage.getItem('sidequest-profile')
    );

    const displayName = profile?.name || 'You';

    author.textContent = `${displayName} · Close friends`;

    const title = document.createElement('h2');
    title.textContent = plan.description;

    const footer = document.createElement('div');
    footer.classList.add('post-footer');

    const details = document.createElement('span');
    details.textContent = plan.mode;

    footer.append(details);
    post.append(author, title, footer);
    const activeFilter = document.querySelector(
        '[data-filter][aria-pressed="true"]'
    );

    const selectedMode = activeFilter?.dataset.filter || 'all';

    post.hidden =
        selectedMode !== 'all' &&
        post.dataset.mode !== selectedMode;
    feed.prepend(post);
}

const joinButton = document.getElementById('join-button');

let requestSent = localStorage.getItem('maya-request') === 'sent';

function updateJoinButton() {
    joinButton.textContent = requestSent
        ? 'Cancel request'
        : 'Ask to join';

    joinButton.disabled = false;
}

joinButton.addEventListener('click', () => {
    requestSent = !requestSent;

    if (requestSent) {
        localStorage.setItem('maya-request', 'sent');
    } else {
        localStorage.removeItem('maya-request');
    }

    updateJoinButton();
});

updateJoinButton();

const filterButtons = document.querySelectorAll('[data-filter]');
filterButtons[0].setAttribute('aria-pressed', 'true');

filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const selectedMode = button.dataset.filter;
        filterButtons.forEach((filterButton) => {
            filterButton.setAttribute(
                'aria-pressed',
                String(filterButton === button)
            );
        });
        const posts = feed.querySelectorAll('.post');

        posts.forEach((post) => {
            const matches =
                selectedMode === 'all' ||
                post.dataset.mode === selectedMode;

            post.hidden = !matches;
        });
    });
});