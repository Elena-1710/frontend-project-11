import _ from 'lodash';

const handleFormAccessibility = (elements, state) => {
  const isLoading = state.loadingProcess === 'loading';
  elements.input.disabled = isLoading;
  elements.button.disabled = isLoading;
};

const handleErrors = (errorName, watchedState) => {
  switch (errorName) {
    case 'Parser Error':
      watchedState.error = 'validation.invalid.noRSS';
      break;
    case 'Network Error':
      watchedState.error = 'validation.invalid.networkError';
      break;
    case 'Nonvalid URL Error':
      watchedState.error = 'validation.invalid.nonvalidURL';
      break;
    case 'Duplication Error':
      watchedState.error = 'validation.invalid.duplicate';
      break;
    default:
      watchedState.error = 'validation.invalid.unknownError';
      break;
  }
};

const renderFrame = (elements, state) => {
  const { input, feedback } = elements;

  const isNetworkError = state.error === 'validation.invalid.networkError';
  const isParseError = state.error === 'validation.invalid.noRSS';
  const isValid = state.valid;
  const hasError = !isValid && !_.isEmpty(state.error);

  input.classList.toggle('is-invalid', hasError);

  if (hasError) {
    feedback.classList.replace('text-success', 'text-danger');
  }

  if (state.loadingProcess === 'success') {
    feedback.classList.replace('text-danger', 'text-success');
  }
};

const renderFeedback = (elements, state, i18n) => {
  const { feedback, form, input } = elements;

  switch (true) {
    case state.loadingProcess === 'loading':
      feedback.textContent = '';
      break;
    case !state.valid && !_.isEmpty(state.error):
      feedback.textContent = i18n.t(state.error);
      feedback.setAttribute('data-link-message', state.error);
      break;
    case state.loadingProcess === 'success':
      feedback.textContent = i18n.t('validation.valid.success');
      feedback.setAttribute('data-link-message', 'validation.valid.success');
      form.reset();
      break;
    default:
      break;
  }

  renderFrame(elements, state);
  input.focus();
};

const renderFeedsContainer = (elements, i18n) => {
  elements.feeds.textContent = '';

  const card = document.createElement('div');
  card.classList.add('card', 'border-0');

  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');

  const title = document.createElement('h2');
  title.classList.add('card-title', 'h4');
  title.textContent = i18n.t('interface.feeds');

  const listGroup = document.createElement('ul');
  listGroup.classList.add('list-group', 'border-0', 'rounded-0');

  cardBody.append(title);
  card.append(cardBody, listGroup);
  elements.feeds.append(card);

  return listGroup;
};

const renderFeedsList = (feed, listGroup) => {
  const existingItem = listGroup.querySelector(`[data-feed-id="${feed.id}"]`);
  if (existingItem) return;

  const item = document.createElement('li');
  item.classList.add('list-group-item', 'border-0', 'border-end-0');
  item.setAttribute('data-feed-id', feed.id);

  const title = document.createElement('h3');
  title.classList.add('h6', 'm-0');
  title.textContent = feed.feedsTitle || 'No title';

  const description = document.createElement('p');
  description.classList.add('m-0', 'small', 'text-black-50');
  description.textContent = feed.feedsDescription || 'No description';

  item.append(title, description);
  listGroup.prepend(item);
};

const renderFeed = (elements, state, i18n) => {
  const listGroup = renderFeedsContainer(elements, i18n);
  state.parsedFeeds.forEach((feed) => {
    renderFeedsList(feed, listGroup);
  });
};

export {
  renderFeedback,
  renderFeed,
  handleFormAccessibility,
  handleErrors,
};