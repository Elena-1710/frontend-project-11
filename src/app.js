import axios from 'axios';
import * as yup from 'yup';
import _ from 'lodash';
import onChange from 'on-change';
import i18next from 'i18next';
import resources from './locales/index.js';
import parseRSS from './parser.js';
import {
  renderFeed,
  renderFeedback,
  handleFormAccessibility,
  handleErrors,
} from './view.js';

const downloadFeed = (url) => axios
  .get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`)
  .then((response) => {
    if (!response.data?.contents) {
      throw new Error('Invalid RSS feed: empty contents');
    }
    return response.data.contents;
  });

const updatePosts = (watchedState) => {
  const links = watchedState.parsedFeeds.map((feed) => feed.feedsURL);
  const promises = links.map((link) =>
    downloadFeed(link)
      .then((response) => {
        const { loadedPosts } = parseRSS(response, link);
        const newPosts = _.differenceBy(loadedPosts, watchedState.parsedPosts, 'postTitle');

        const postsWithIds = newPosts.map((post) => ({
          ...post,
          postID: _.uniqueId(),
          feedId: watchedState.parsedFeeds.find(f => f.feedsURL === link)?.id,
        }));

        if (postsWithIds.length > 0) {
          watchedState.parsedPosts.unshift(...postsWithIds);
        }
      })
      .catch((error) => {
        console.error('Error updating posts:', error.message);
      })
  );

  Promise.all(promises).finally(() => setTimeout(() => updatePosts(watchedState), 5000));
};

export default () => {
  const defaultLanguage = 'ru';
  const i18n = i18next.createInstance();

  i18n.init({
    lng: defaultLanguage,
    debug: false,
    resources,
  }).then(() => {
    yup.setLocale({
      mixed: { notOneOf: 'Duplication Error' },
      string: { url: 'Nonvalid URL Error' },
    });

    const validateURL = (url, parsedLinks) => {
      const schema = yup.string().url().notOneOf(parsedLinks).required();
      return schema.validate(url);
    };

    const elements = {
      form: document.querySelector('.rss-form'),
      input: document.querySelector('#url-input'),
      feedback: document.querySelector('.feedback'),
      posts: document.querySelector('.posts'),
      feeds: document.querySelector('.feeds'),
      languageButtons: document.querySelectorAll('[data-lng]'),
      title: document.querySelector('h1'),
      subtitle: document.querySelector('.lead'),
      inputPlaceholder: document.querySelector('[data-label]'),
      button: document.querySelector('[data-button]'),
      example: document.querySelector('[data-example]'),
      hexlet: document.querySelector('[data-hexlet]'),
      modalWindow: {
        modalTitle: document.querySelector('.modal-title'),
        modalBody: document.querySelector('.modal-body'),
        modalFullArticle: document.querySelector('.full-article'),
      },
    };

    const state = {
      lng: defaultLanguage,
      loadingProcess: 'ready to load feed',
      valid: false,
      error: '',
      uiState: {
        viewedLinks: [],
        clickedPostLink: '',
      },
      parsedFeeds: [],
      parsedPosts: [],
    };

    const watchedState = onChange(state, (path, value, prev) => {
      switch (path) {
        case 'loadingProcess':
          handleFormAccessibility(elements, watchedState);
          renderFeedback(elements, state, i18n);
          break;
        case 'error':
          handleErrors(state.error, watchedState);
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
          renderLanguage(elements, value, prev, i18n);
          break;
        default:
          break;
      }
    });

    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(e.target);
      const currentURL = data.get('url').trim();
      watchedState.loadingProcess = 'loading';

      const parsedLinks = watchedState.parsedFeeds.map(feed => feed.feedsURL);

      validateURL(currentURL, parsedLinks)
        .then(() => downloadFeed(currentURL))
        .then((response) => {
          const { loadedFeeds, loadedPosts } = parseRSS(response, currentURL);

          const feedId = _.uniqueId();
          const feedWithId = {
            ...loadedFeeds,
            id: feedId,
            feedsURL: currentURL,
          };

          const postsWithIds = loadedPosts.map((post) => ({
            ...post,
            postID: _.uniqueId(),
            feedId,
          }));

          watchedState.valid = true;
          watchedState.loadingProcess = 'success';
          watchedState.error = '';
          watchedState.parsedFeeds.unshift(feedWithId);
          watchedState.parsedPosts.unshift(...postsWithIds);
        })
        .catch((error) => {
          watchedState.valid = false;
          watchedState.loadingProcess = 'failed';
          watchedState.error = error.message;
        });
    });

    updatePosts(watchedState);

    elements.languageButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        watchedState.lng = btn.dataset.lng;
      });
    });

    elements.posts.addEventListener('click', (e) => {
      const { target } = e;
      const link = target.closest('[href]');
      const button = target.closest('[data-bs-toggle="modal"]');

      if (link) {
        watchedState.uiState.viewedLinks.push(link.href);
      }

      if (button) {
        const postLink = button.previousElementSibling?.href || button.closest('a')?.href;
        if (postLink) {
          watchedState.uiState.viewedLinks.push(postLink);
          watchedState.uiState.clickedPostLink = postLink;
        }
      }
    });
  });
};