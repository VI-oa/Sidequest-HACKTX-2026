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

  const author = document.createElement('p');
  author.classList.add('author');
  author.textContent = 'You · Close friends';

  const title = document.createElement('h2');
  title.textContent = plan.description;

  const footer = document.createElement('div');
  footer.classList.add('post-footer');

  const details = document.createElement('span');
  details.textContent = plan.mode;

  footer.append(details);
  post.append(author, title, footer);
  feed.prepend(post);
}