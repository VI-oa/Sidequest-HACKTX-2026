const editProfileButton = document.getElementById('edit-profile-button');
const profileDialog = document.getElementById('profile-dialog');
const cancelProfileButton = document.getElementById('cancel-profile-button');

editProfileButton.addEventListener('click', () => {
    profileDialog.showModal();
});

cancelProfileButton.addEventListener('click', () => {
    profileDialog.close();
});

const profileForm = document.getElementById('profile-form');
const nameInput = document.getElementById('edit-name');
const bioInput = document.getElementById('edit-bio');
const interestsInput = document.getElementById('edit-interests');

const profileName = document.getElementById('profile-name');
const profileBio = document.querySelector('.profile > p:not(.subtitle)');
const profileAvatar = document.querySelector('.profile-avatar');
const interestsList = document.querySelector('.profile-interests');

profileForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = nameInput.value.trim();

    if (!name) {
        nameInput.setCustomValidity('Enter your name.');
        nameInput.reportValidity();
        return;
    }

    profileName.textContent = name;
    profileBio.textContent = bioInput.value.trim();
    profileAvatar.textContent = name.charAt(0).toUpperCase();

    interestsList.replaceChildren();

    interestsInput.value.split(',').forEach((interest) => {
        const text = interest.trim();

        if (text) {
            const item = document.createElement('li');
            item.textContent = text;
            interestsList.append(item);
        }
    });

    const profile = {
        name: name,
        bio: bioInput.value.trim(),
        interests: interestsInput.value
            .split(',')
            .map((interest) => interest.trim())
            .filter((interest) => interest !== '')
    };

    localStorage.setItem(
        'sidequest-profile',
        JSON.stringify(profile)
    );
    profileDialog.close();
});

nameInput.addEventListener('input', () => {
    nameInput.setCustomValidity('');
});

const savedProfile = JSON.parse(
    localStorage.getItem('sidequest-profile')
);

if (savedProfile) {
    profileName.textContent = savedProfile.name;
    profileBio.textContent = savedProfile.bio;
    profileAvatar.textContent = savedProfile.name
        .charAt(0)
        .toUpperCase();

    nameInput.value = savedProfile.name;
    bioInput.value = savedProfile.bio;
    interestsInput.value = savedProfile.interests.join(', ');

    interestsList.replaceChildren();

    savedProfile.interests.forEach((interest) => {
        const item = document.createElement('li');
        item.textContent = interest;
        interestsList.append(item);
    });
}