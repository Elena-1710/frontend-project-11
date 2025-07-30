import * as yup from 'yup';

yup.setLocale({
  mixed: {
    notOneOf: 'Duplication Error',
  },
  string: {
    url: 'Nonvalid URL Error',
  },
});

const validateURL = async (url, parsedLinks) => {
  const schema = yup
    .string()
    .url()
    .notOneOf(parsedLinks)
    .required();
  return schema.validate(url);
};

const watchedState = onChange(state, (path, value, previousValue) => {
  switch (path) {
    case 'loadingProcess':
    case 'error':
      handleFormAccessibility(elements, watchedState);
      handleErrors(state.error, state);
      renderFeedback(elements, state, i18n);
      break;
    case 'parsedFeeds':
      renderFeed(elements, state, i18n);
      break;
    case 'parsedPosts':
    case 'uiState.viewedLinks':
      renderPosts(elements, state, i18n);
      break;
    case 'uiState.clickedPostLink':
      renderModals(elements, state);
      break;
    case 'lng':
      i18n.changeLanguage(value);
      renderLanguage(elements, value, previousValue, i18n);
      break;
    default:
      break;
  }
});