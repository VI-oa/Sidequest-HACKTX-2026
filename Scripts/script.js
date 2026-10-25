const byId = (id) => document.getElementById(id);

const createButton = byId('create-button');
const planDialog = byId('plan-dialog');
const planForm = byId('plan-form');
const feed = document.querySelector('.feed');

const descriptionInput = byId('plan-description');
const modeInput = byId('plan-mode');
const imageInput = byId('plan-image');
const audienceInput = byId('plan-audience');
const approvalInput = byId('plan-approval');

const submitButton = planForm.querySelector('button[type="submit"]');

const photoEditor = byId('photo-editor');
const canvas = byId('photo-canvas');
const context = canvas.getContext('2d');

const zoom = byId('photo-zoom');
const photoX = byId('photo-x');
const photoY = byId('photo-y');

const filters = document.querySelectorAll('[data-filter]');

let savedPlans = [];
let editingId = null;
let existingImage = null;
let cropImage = null;
let photoChanged = false;
let pendingPhoto = Promise.resolve();
let photoToken = 0;
let photoError = '';
let saving = false;
let drag = null;

// Added automatically, so you don't need to edit the HTML.
const removePhotoButton = document.createElement('button');
removePhotoButton.type = 'button';
removePhotoButton.classList.add('delete-post');
removePhotoButton.textContent = 'Remove photo';
removePhotoButton.hidden = true;

photoEditor.before(removePhotoButton);

function readPlans() {
    const plans = JSON.parse(
        localStorage.getItem('sidequest-plans') || '[]'
    );

    if (!Array.isArray(plans)) {
        throw new Error('Saved plans could not be read.');
    }

    return plans.filter((plan) =>
        plan && typeof plan.description === 'string'
    );
}

try {
    savedPlans = readPlans();

    savedPlans.forEach((plan) => {
        plan.id ||= crypto.randomUUID();
    });

    localStorage.setItem(
        'sidequest-plans',
        JSON.stringify(savedPlans)
    );
} catch (error) {
    alert(error.message);
}

function writePlans(plans) {
    try {
        localStorage.setItem(
            'sidequest-plans',
            JSON.stringify(plans)
        );
    } catch {
        throw new Error(
            'Could not save. Browser storage may be full; try a smaller photo.'
        );
    }

    savedPlans = plans;
}

function displayName() {
    try {
        return JSON.parse(
            localStorage.getItem('sidequest-profile')
        )?.name || 'You';
    } catch {
        return 'You';
    }
}

function updateAccessHelp() {
    byId('audience-help').textContent =
        audienceInput.value === 'close-friends'
            ? 'Close friends selected. Access restrictions are not connected in this local prototype.'
            : 'Everyone can see the plan.';

    byId('approval-help').textContent = approvalInput.checked
        ? 'On: people request to join and wait for the host.'
        : 'Off: people can join immediately.';
}

function applyFilter() {
    const selected = document.querySelector(
        '[data-filter][aria-pressed="true"]'
    )?.dataset.filter || 'all';

    feed.querySelectorAll('.post').forEach((post) => {
        post.hidden =
            selected !== 'all' &&
            post.dataset.mode !== selected;
    });
}

filters.forEach((button) => {
    button.setAttribute(
        'aria-pressed',
        String(button.dataset.filter === 'all')
    );

    button.addEventListener('click', () => {
        filters.forEach((item) => {
            item.setAttribute(
                'aria-pressed',
                String(item === button)
            );
        });

        applyFilter();
    });
});

audienceInput.addEventListener('change', updateAccessHelp);
approvalInput.addEventListener('change', updateAccessHelp);

descriptionInput.addEventListener('input', () => {
    descriptionInput.setCustomValidity('');
});

function clearEditor() {
    editingId = null;
    existingImage = null;
    cropImage = null;
    photoChanged = false;
    photoError = '';

    photoToken++;
    pendingPhoto = Promise.resolve();
    drag = null;

    photoEditor.hidden = true;
    removePhotoButton.hidden = true;

    byId('plan-title').textContent = 'What are you up for?';
    submitButton.textContent = 'Create plan';

    descriptionInput.setCustomValidity('');
}

planForm.addEventListener('reset', () => {
    clearEditor();

    // Wait until the browser finishes resetting native controls.
    setTimeout(updateAccessHelp, 0);
});

createButton.addEventListener('click', (event) => {
    event.preventDefault();
    if (saving) return;

    byId('plan-menu').open = false;
    planForm.reset();
    updateAccessHelp();
    planDialog.showModal();
});

if (new URLSearchParams(location.search).get('create') === '1') {
    history.replaceState(null, '', location.pathname);
    planForm.reset();
    updateAccessHelp();
    planDialog.showModal();
}

byId('cancel-button').addEventListener('click', () => {
    planDialog.close();
});

planDialog.addEventListener('close', () => {
    planForm.reset();
});

function localDateValue(date) {
    return new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
    ).toISOString().slice(0, 16);
}

function validPhoto(value) {
    return (
        typeof value === 'string' &&
        /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value)
    );
}

function dimensions() {
    const scale = Math.max(
        canvas.width / cropImage.naturalWidth,
        canvas.height / cropImage.naturalHeight
    ) * Number(zoom.value);

    const width = cropImage.naturalWidth * scale;
    const height = cropImage.naturalHeight * scale;

    return {
        width,
        height,
        overflowX: Math.max(0, width - canvas.width),
        overflowY: Math.max(0, height - canvas.height)
    };
}

function drawCrop() {
    if (!cropImage || !context) return;

    const size = dimensions();

    context.fillStyle = '#202022';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    context.drawImage(
        cropImage,
        -size.overflowX * Number(photoX.value),
        -size.overflowY * Number(photoY.value),
        size.width,
        size.height
    );
}

function centerPhoto() {
    zoom.value = '1';
    photoX.value = '0.5';
    photoY.value = '0.5';

    drawCrop();
}

async function loadPhoto(source, token) {
    if (!context) {
        throw new Error('The photo editor is unavailable.');
    }

    const image = new Image();
    image.src = source;

    await image.decode();

    if (token !== photoToken) return;

    cropImage = image;
    photoEditor.hidden = false;
    removePhotoButton.hidden = false;

    centerPhoto();
}

function openEdit(id) {
    if (saving) return;

    let plan;

    try {
        plan = readPlans().find((item) => item.id === id);
    } catch (error) {
        alert(error.message);
        return;
    }

    if (!plan) {
        alert('This post no longer exists. Refresh the page.');
        return;
    }

    planForm.reset();
    editingId = plan.id;

    byId('plan-title').textContent = 'Edit your plan';
    submitButton.textContent = 'Save changes';

    byId('plan-name').value =
        plan.title || plan.description.slice(0, 80);

    descriptionInput.value = plan.description;

    modeInput.value = plan.mode === 'Virtual'
        ? 'virtual'
        : 'in-person';

    audienceInput.value = plan.audience === 'close-friends'
        ? 'close-friends'
        : 'everyone';

    approvalInput.checked = Boolean(plan.requiresApproval);

    byId('plan-place').value =
        plan.location || 'To be agreed';

    byId('plan-tags').value = Array.isArray(plan.tags)
        ? plan.tags.join(', ')
        : '';

    const start = new Date(plan.startsAt || '');

    byId('plan-start').value =
        Number.isFinite(start.getTime())
            ? localDateValue(start)
            : '';

    const duration =
        Number.isInteger(plan.minutes) &&
            plan.minutes >= 5 &&
            plan.minutes <= 180
            ? plan.minutes
            : 30;

    const durationInput = byId('plan-duration');

    if (
        ![...durationInput.options].some((option) =>
            Number(option.value) === duration
        )
    ) {
        const option = document.createElement('option');
        option.value = String(duration);
        option.textContent = `${duration} minutes`;
        durationInput.append(option);
    }

    durationInput.value = String(duration);

    existingImage = validPhoto(plan.image)
        ? plan.image
        : null;

    updateAccessHelp();
    planDialog.showModal();

    if (existingImage) {
        const token = ++photoToken;
        removePhotoButton.hidden = false;

        pendingPhoto = loadPhoto(existingImage, token).catch(() => {
            if (token !== photoToken) return;

            photoEditor.hidden = true;

            alert(
                'The preview could not load. The saved photo will still be kept unless you remove or replace it.'
            );
        });
    }
}

imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];

    // Cancelling file selection keeps the previous photo.
    if (!file) return;

    const token = ++photoToken;

    cropImage = null;
    photoChanged = true;
    photoError = '';
    photoEditor.hidden = true;
    removePhotoButton.hidden = false;

    pendingPhoto = (async () => {
        if (
            !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
        ) {
            throw new Error('Choose a JPG, PNG, or WebP image.');
        }

        if (file.size > 8 * 1024 * 1024) {
            throw new Error('Choose a photo smaller than 8 MB.');
        }

        const url = URL.createObjectURL(file);

        try {
            await loadPhoto(url, token);
        } finally {
            URL.revokeObjectURL(url);
        }
    })().catch((error) => {
        if (token !== photoToken) return;

        photoError = error.message;
        alert(photoError);
    });
});

removePhotoButton.addEventListener('click', () => {
    photoToken++;

    existingImage = null;
    cropImage = null;
    photoChanged = true;
    photoError = '';
    pendingPhoto = Promise.resolve();

    imageInput.value = '';
    photoEditor.hidden = true;
    removePhotoButton.hidden = true;
});

[zoom, photoX, photoY].forEach((slider) => {
    slider.addEventListener('input', () => {
        if (!cropImage) return;

        photoChanged = true;
        drawCrop();
    });
});

byId('reset-photo').addEventListener('click', () => {
    if (!cropImage) return;

    photoChanged = true;
    centerPhoto();
});

canvas.addEventListener('pointerdown', (event) => {
    if (!cropImage) return;

    drag = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY
    };

    canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener('pointermove', (event) => {
    if (
        !drag ||
        !cropImage ||
        drag.id !== event.pointerId
    ) {
        return;
    }

    const rect = canvas.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const size = dimensions();
    const clamp = (value) => Math.max(0, Math.min(1, value));

    if (size.overflowX) {
        photoX.value = String(clamp(
            Number(photoX.value) -
            (event.clientX - drag.x) *
            canvas.width / rect.width / size.overflowX
        ));
    }

    if (size.overflowY) {
        photoY.value = String(clamp(
            Number(photoY.value) -
            (event.clientY - drag.y) *
            canvas.height / rect.height / size.overflowY
        ));
    }

    drag.x = event.clientX;
    drag.y = event.clientY;

    photoChanged = true;
    drawCrop();
});

['pointerup', 'pointercancel', 'lostpointercapture'].forEach(
    (type) => {
        canvas.addEventListener(type, () => {
            drag = null;
        });
    }
);

planForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (saving || !planForm.reportValidity()) return;

    const title = byId('plan-name').value.trim();
    const description = descriptionInput.value.trim();
    const location = byId('plan-place').value.trim();

    const start = new Date(byId('plan-start').value);
    const minutes = Number(byId('plan-duration').value);

    if (!title || !description || !location) {
        alert('Enter a title, description, and place or call details.');
        return;
    }

    if (!Number.isFinite(start.getTime())) {
        alert('Choose a date and time.');
        return;
    }

    if (!editingId && start.getTime() <= Date.now()) {
        alert('Choose a future date and time.');
        return;
    }

    if (
        !Number.isInteger(minutes) ||
        minutes < 5 ||
        minutes > 180
    ) {
        alert('Choose a duration between 5 and 180 minutes.');
        return;
    }

    const editId = editingId;
    const token = photoToken;

    const fields = {
        title,
        description,
        location,
        minutes,
        startsAt: start.toISOString(),
        mode: modeInput.value === 'virtual'
            ? 'Virtual'
            : 'In person',
        audience: audienceInput.value === 'close-friends'
            ? 'close-friends'
            : 'everyone',
        requiresApproval: approvalInput.checked,
        tags: [
            ...new Set(
                byId('plan-tags').value
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean)
            )
        ].slice(0, 6)
    };

    saving = true;
    submitButton.disabled = true;
    submitButton.textContent = 'Saving…';

    try {
        await pendingPhoto;

        // Cancelled forms or changed uploads must not save stale data.
        if (token !== photoToken || !planDialog.open) return;

        if (photoError) {
            throw new Error(photoError);
        }

        let image = existingImage;

        if (photoChanged) {
            drawCrop();

            image = cropImage
                ? canvas.toDataURL('image/jpeg', 0.82)
                : null;
        }

        const latest = readPlans();

        const index = editId
            ? latest.findIndex((plan) => plan.id === editId)
            : -1;

        if (editId && index === -1) {
            throw new Error('This post was removed. Refresh the page.');
        }

        const now = new Date().toISOString();
        const old = index >= 0 ? latest[index] : {};

        const plan = {
            ...old,
            ...fields,
            image,
            id: editId || crypto.randomUUID(),
            createdAt: old.createdAt || now,
            updatedAt: now
        };

        if (index >= 0) {
            latest[index] = plan;
        } else {
            latest.push(plan);
        }

        writePlans(latest);
        renderPlans();

        planDialog.close();
        planForm.reset();
    } catch (error) {
        alert(error.message);
    } finally {
        saving = false;
        submitButton.disabled = false;

        submitButton.textContent = editingId
            ? 'Save changes'
            : 'Create plan';
    }
});

function addPlanDetails(post, plan) {
    const information = document.createElement('div');
    information.classList.add('plan-information');

    const add = (text) => {
        const line = document.createElement('p');
        line.textContent = text;
        information.append(line);
    };

    const date = new Date(plan.startsAt || '');

    if (Number.isFinite(date.getTime())) {
        add(date.toLocaleString([], {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        }));
    }

    if (plan.minutes) {
        add(`${plan.minutes} minutes`);
    }

    if (plan.location) {
        add(`Place: ${plan.location}`);
    }

    add(
        plan.requiresApproval
            ? 'Joining: host approval required'
            : 'Joining: open — no request needed'
    );

    if (plan.audience === 'close-friends') {
        add(
            'Close friends selected · privacy not connected in this local prototype'
        );
    }

    post.append(information);

    if (Array.isArray(plan.tags) && plan.tags.length) {
        const tags = document.createElement('div');
        tags.classList.add('plan-tags');

        plan.tags.forEach((tag) => {
            const item = document.createElement('span');
            item.classList.add('plan-tag');
            item.textContent = tag;
            tags.append(item);
        });

        post.append(tags);
    }
}

function addPlanToFeed(plan) {
    const post = document.createElement('article');
    post.classList.add('post');

    post.dataset.localPlan = 'true';
    post.dataset.planId = plan.id;

    post.dataset.mode = plan.mode === 'Virtual'
        ? 'virtual'
        : 'in-person';

    const author = document.createElement('p');
    author.classList.add('author');

    const visibility = plan.audience === 'close-friends'
        ? 'Close friends'
        : plan.audience === 'everyone'
            ? 'Everyone'
            : 'Audience not set';

    author.textContent = `${displayName()} · ${visibility}`;

    const title = document.createElement('h2');
    title.textContent = plan.title || plan.description;

    post.append(author, title);

    if (plan.title) {
        const description = document.createElement('p');
        const prefix = `${plan.title} — `;

        description.textContent = plan.description.startsWith(prefix)
            ? plan.description.slice(prefix.length)
            : plan.description;

        post.append(description);
    }

    if (validPhoto(plan.image)) {
        const image = document.createElement('img');

        image.classList.add('post-image');
        image.src = plan.image;
        image.alt = 'Photo attached by the post author';
        image.loading = 'lazy';

        post.append(image);
    }

    const footer = document.createElement('div');
    footer.classList.add('post-footer');

    const mode = document.createElement('span');
    mode.textContent = plan.mode;

    footer.append(mode);
    post.append(footer);

    addPlanDetails(post, plan);

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.flexWrap = 'wrap';
    actions.style.gap = '8px';

    const edit = document.createElement('button');
    edit.type = 'button';
    edit.classList.add('delete-post');
    edit.textContent = 'Edit post';

    edit.addEventListener('click', () => {
        openEdit(plan.id);
    });

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.classList.add('delete-post');
    remove.textContent = 'Delete post';

    remove.addEventListener('click', () => {
        if (!confirm('Delete this post and its attached photo?')) {
            return;
        }

        try {
            writePlans(
                readPlans().filter((item) => item.id !== plan.id)
            );

            renderPlans();
        } catch (error) {
            alert(error.message);
        }
    });

    actions.append(edit, remove);
    post.append(actions);

    feed.prepend(post);
}

function renderPlans() {
    feed.querySelectorAll('[data-local-plan="true"]').forEach(
        (post) => post.remove()
    );

    savedPlans.forEach(addPlanToFeed);
    applyFilter();
}

// Maya remains a sample invitation, separate from your saved posts.
const joinButton = byId('join-button');

if (joinButton) {
    const approval = joinButton.dataset.approval === 'true';

    const key = approval
        ? 'maya-approval-demo'
        : 'maya-open-demo';

    let active = false;

    try {
        active = localStorage.getItem(key) === 'active';
    } catch {
        // Leave the initial demo state unchanged.
    }

    const update = () => {
        joinButton.textContent = approval
            ? (active ? 'Cancel request' : 'Request to join')
            : (active ? 'Leave plan' : 'Join plan');

        joinButton.setAttribute('aria-pressed', String(active));
    };

    joinButton.addEventListener('click', () => {
        try {
            const next = !active;

            if (next) {
                localStorage.setItem(key, 'active');
            } else {
                localStorage.removeItem(key);
            }

            active = next;
            update();
        } catch {
            alert('Could not save your joining status.');
        }
    });

    update();
}

updateAccessHelp();
renderPlans();