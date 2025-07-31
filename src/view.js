import _ from 'lodash'

const handleFormAccessibility = (elements, state) => {
  if (state.loadingProcess === 'loading') {
    elements.input.disabled = true
    elements.button.disabled = true
  }
  else {
    elements.input.disabled = false
    elements.button.disabled = false
  }
}

const handleErrors = (errorName, watchedState) => {
  switch (errorName) {
    case 'Parser Error':
      watchedState.error = 'validation.invalid.noRSS'
      break
    case 'Network Error':
      watchedState.error = 'validation.invalid.networkError'
      break
    case 'Nonvalid URL Error':
      watchedState.error = 'validation.invalid.nonvalidURL'
      break
    case 'Duplication Error':
      watchedState.error = 'validation.invalid.duplicate'
      break
    default:
      break
  }
}

const renderFrame = (elements, state) => {
  switch (true) {
    case (state.loadingProcess === 'loading'):
      elements.input.classList.remove('is-invalid')
      break
    case (!state.valid && state.error === 'validation.invalid.networkError'):
    case (!state.valid && state.error === 'validation.invalid.noRSS'):
      elements.input.classList.remove('is-invalid')
      elements.feedback.classList.replace('text-success', 'text-danger')
      break
    case (!state.valid && !_.isEmpty(state.error)):
      elements.input.classList.add('is-invalid')
      elements.feedback.classList.replace('text-success', 'text-danger')
      break
    case (state.loadingProcess === 'success'):
      elements.input.classList.remove('is-invalid')
      elements.feedback.classList.replace('text-danger', 'text-success')
      break
    default:
      break
  }
}

const renderFeedback = (elements, state, i18n) => {
  switch (true) {
    case (state.loadingProcess === 'loading'):
      elements.feedback.textContent = ''
      break
    case (!state.valid && !_.isEmpty(state.error)):
      elements.feedback.textContent = i18n.t(`${state.error}`)
      elements.feedback.setAttribute('data-link-message', `${state.error}`)
      break
    case (state.loadingProcess === 'success'):
      elements.feedback.textContent = i18n.t('validation.valid.success')
      elements.feedback.setAttribute('data-link-message', 'validation.valid.success')
      elements.form.reset()
      break
    default:
      break
  }
  renderFrame(elements, state)
  elements.input.focus()
}

const renderFeedsContainer = (elements, i18n) => {
  elements.feeds.textContent = ''

  const feedsCard = document.createElement('div')
  const feedsCardBody = document.createElement('div')
  const feedsCardTitle = document.createElement('h2')
  const feedsListGroup = document.createElement('ul')

  feedsCard.classList.add('card', 'border-0')
  feedsCardBody.classList.add('card-body')
  feedsCardTitle.classList.add('card-title', 'h4')
  feedsListGroup.classList.add('list-group', 'border-0', 'rounded-0')

  feedsCardTitle.textContent = i18n.t('interface.feeds')

  feedsCardBody.append(feedsCardTitle)
  feedsCard.append(feedsCardBody, feedsListGroup)
  elements.feeds.append(feedsCard)

  return feedsListGroup
}

const renderFeedsList = (feed, listGroup) => {
  const { feedsTitle, feedsDescription, id } = feed

  const existingItem = listGroup.querySelector(`[data-feed-id="${id}"]`)
  if (existingItem) return

  const li = document.createElement('li')
  li.classList.add('list-group-item', 'border-0', 'border-end-0')
  li.setAttribute('data-feed-id', id)

  const h3 = document.createElement('h3')
  h3.classList.add('h6', 'm-0')
  h3.textContent = feedsTitle || 'No title'

  const p = document.createElement('p')
  p.classList.add('m-0', 'small', 'text-black-50')
  p.textContent = feedsDescription || 'No description'

  li.append(h3, p)
  listGroup.append(li)
}

const renderFeed = (elements, state, i18n) => {
  const listGroup = renderFeedsContainer(elements, i18n)
  state.parsedFeeds.forEach((feed) => {
    renderFeedsList(feed, listGroup)
  })
}

const renderPostsContainer = (elements, i18n) => {
  elements.posts.textContent = ''
  const postsCard = document.createElement('div')
  const postsCardBody = document.createElement('div')
  const postsCardTitle = document.createElement('h2')
  const postsListGroup = document.createElement('ul')

  postsCard.classList.add('card', 'border-0')
  postsCardBody.classList.add('card-body')
  postsCardTitle.classList.add('card-title', 'h4')
  postsListGroup.classList.add('list-group', 'border-0', 'rounded-0')

  postsCardTitle.textContent = i18n.t('interface.posts')

  postsCardBody.append(postsCardTitle)
  postsCard.append(postsCardBody, postsListGroup)
  elements.posts.append(postsCard)

  return postsListGroup
}

const renderPostsList = (state, post, i18n, listGroup) => {
  const { postTitle, postLink } = post

  const li = document.createElement('li')
  li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0')

  const a = document.createElement('a')
  a.href = postLink
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  a.textContent = postTitle
  if (state.uiState.viewedLinks.includes(postLink)) {
    a.classList.add('fw-normal', 'link-secondary')
  }
  else {
    a.classList.add('fw-bold')
  }

  const button = document.createElement('button')
  button.type = 'button'
  button.classList.add('btn', 'btn-outline-primary', 'btn-sm')
  button.dataset.bsToggle = 'modal'
  button.dataset.bsTarget = '#modal'
  button.textContent = i18n.t('interface.view')

  li.append(a, button)
  listGroup.append(li)
}

const renderPosts = (elements, state, i18n) => {
  const listGroup = renderPostsContainer(elements, i18n)
  state.parsedPosts.forEach((post) => {
    renderPostsList(state, post, i18n, listGroup)
  })
}

const renderModals = (elements, state) => {
  const { modalTitle, modalBody, modalFullArticle } = elements.modalWindow
  const post = state.parsedPosts.find(p => p.postLink === state.uiState.clickedPostLink)

  if (!post) return

  modalTitle.textContent = post.postTitle
  modalBody.textContent = post.postDescription
  modalFullArticle.href = post.postLink
}

const renderLanguage = (elements, value, previousValue, i18n) => {
  document.querySelector(`[data-lng="${previousValue}"]`)
    ?.classList.replace('btn-primary', 'btn-outline-primary')
  document.querySelector(`[data-lng="${value}"]`)
    ?.classList.replace('btn-outline-primary', 'btn-primary')

  elements.title.textContent = i18n.t('interface.title')
  elements.subtitle.textContent = i18n.t('interface.subtitle')
  elements.button.textContent = i18n.t('interface.button')
  elements.example.textContent = i18n.t('interface.example')

  const feedbackMessage = elements.feedback.dataset.linkMessage
  if (feedbackMessage) {
    elements.feedback.textContent = i18n.t(feedbackMessage)
  }

  document.querySelectorAll('.feeds .card-title, .posts .card-title').forEach((el) => {
    if (el.closest('.feeds')) {
      el.textContent = i18n.t('interface.feeds')
    }
    else {
      el.textContent = i18n.t('interface.posts')
    }
  })

  document.querySelectorAll('[data-bs-toggle="modal"]').forEach((btn) => {
    btn.textContent = i18n.t('interface.view')
  })
}

export {
  renderFeedback,
  renderLanguage,
  renderPosts,
  renderFeed,
  renderModals,
  handleFormAccessibility,
  handleErrors,
}
