import axios from 'axios'
import * as yup from 'yup'
import _ from 'lodash'
import onChange from 'on-change'
import i18next from 'i18next'
import resources from './locales/index.js'
import parseRSS from './parser.js'
import {
  renderFeed,
  renderPosts,
  renderLanguage,
  renderFeedback,
  renderModals,
  handleFormAccessibility,
  handleErrors,
} from './view.js'

const downloadFeed = url =>
  axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`)
    .then(response => response.data.contents)

const validateURL = async (url, parsedLinks) => {
  const schema = yup.string().url().notOneOf(parsedLinks).required()
  return schema.validate(url)
}

const updatePosts = (watchedState) => {
  const links = watchedState.parsedFeeds.map(feed => feed.feedsURL)
  const downloadPromises = links.map(link =>
    downloadFeed(link).then((response) => {
      const parsedData = parseRSS(response)
      const newPosts = _.differenceBy(parsedData.loadedPosts, watchedState.parsedPosts, 'postTitle')
      if (newPosts.length > 0) {
        watchedState.parsedPosts = [...newPosts, ...watchedState.parsedPosts]
      }
    }),
  )
  Promise.all(downloadPromises)
    .finally(() => setTimeout(() => updatePosts(watchedState), 5000))
}

const handleSubmit = (elements, watchedState) => (e) => {
  e.preventDefault()
  const data = new FormData(e.target)
  const currentURL = data.get('url').trim()
  watchedState.loadingProcess = 'loading'
  const parsedLinks = watchedState.parsedFeeds.map(feed => feed.feedsURL)

  validateURL(currentURL, parsedLinks)
    .then(() => downloadFeed(currentURL))
    .then((response) => {
      const parsedResponce = parseRSS(response, currentURL)
      const feeds = parsedResponce.loadedFeeds
      const posts = parsedResponce.loadedPosts
      posts.forEach((post) => {
        post.postID = _.uniqueId()
      })
      watchedState.valid = true
      watchedState.loadingProcess = 'success'
      watchedState.parsedFeeds.unshift(feeds)
      watchedState.parsedPosts.unshift(...posts)
    })
    .catch((error) => {
      watchedState.valid = false
      watchedState.loadingProcess = 'failed loading'
      handleErrors(error.message, watchedState)
    })
}

const setupWatcher = (state, elements, i18n) => onChange(state, (path, value, previousValue) => {
  switch (path) {
    case 'loadingProcess':
    case 'error':
      handleFormAccessibility(elements, state)
      handleErrors(state.error, state)
      renderFeedback(elements, state, i18n)
      break
    case 'parsedFeeds':
      renderFeed(elements, state, i18n)
      break
    case 'parsedPosts':
    case 'uiState.viewedLinks':
      renderPosts(elements, state, i18n)
      break
    case 'uiState.clickedPostLink':
      renderModals(elements, state)
      break
    case 'lng':
      i18n.changeLanguage(value)
      renderLanguage(elements, value, previousValue, i18n)
      break
    default:
      break
  }
})

const setupEventListeners = (elements, watchedState) => {
  elements.form.addEventListener('submit', handleSubmit(elements, watchedState))

  elements.languageButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      watchedState.lng = btn.dataset.lng
    })
  })

  elements.posts.addEventListener('click', (e) => {
    const { target } = e

    if (target.tagName === 'A') {
      watchedState.uiState.viewedLinks.push(target.href)
    }

    if (target.tagName === 'BUTTON') {
      const li = target.closest('li')
      const link = li.querySelector('a')
      if (link) {
        const href = link.getAttribute('href')
        watchedState.uiState.viewedLinks.push(href)
        watchedState.uiState.clickedPostLink = href
      }
    }
  })
}

export default () => {
  const defaultLanguage = 'ru'
  const i18n = i18next.createInstance()

  i18n.init({
    lng: defaultLanguage,
    debug: true,
    resources,
  }).then(() => {
    yup.setLocale({
      mixed: { notOneOf: 'Duplication Error' },
      string: { url: 'Nonvalid URL Error' },
    })

    const elements = {
      form: document.querySelector('.rss-form'),
      input: document.querySelector('#url-input'),
      feedback: document.querySelector('.feedback'),
      posts: document.querySelector('.posts'),
      feeds: document.querySelector('.feeds'),
      languageButtons: document.querySelectorAll('[data-lng]'),
      modalButtons: document.querySelectorAll('[data-bs-toggle="modal"]'),
      title: document.querySelector('h1'),
      subtitle: document.querySelector('.lead'),
      inputPlaceholder: document.querySelector('label[for="url-input"]'),
      button: document.querySelector('.rss-form button[type="submit"]'),
      example: document.querySelector('p.mt-2'),
      hexlet: document.querySelector('footer a[href*="hexlet"]'),
      modalWindow: {
        modalTitle: document.querySelector('.modal-title'),
        modalBody: document.querySelector('.modal-body'),
        modalFullArticle: document.querySelector('.full-article'),
        modalCloseSecondary: document.querySelector('.btn-secondary'),
        modalCloseButtons: document.querySelectorAll('[data-bs-dismiss="modal"]'),
      },
    }

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
    }

    const watchedState = setupWatcher(state, elements, i18n)
    updatePosts(watchedState)
    setupEventListeners(elements, watchedState)
  })
}
