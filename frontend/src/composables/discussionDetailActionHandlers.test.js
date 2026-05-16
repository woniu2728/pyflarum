import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createDiscussionActionHandlers,
  createPostActionHandlers,
} from './discussionDetailActionHandlers.js'

test('discussion detail discussion action handlers dispatch to the expected callbacks', async () => {
  const calls = []
  const handlers = createDiscussionActionHandlers({
    deleteDiscussion: async () => calls.push('delete'),
    editDiscussion: () => calls.push('edit'),
    goToLoginForReply: () => calls.push('login'),
    openComposer: () => calls.push('reply'),
    toggleHide: async () => calls.push('toggle-hide'),
    toggleLock: async () => calls.push('toggle-lock'),
    togglePin: async () => calls.push('toggle-pin'),
    toggleSubscription: async () => calls.push('toggle-subscription'),
  })

  await handlers.delete()
  await handlers.edit()
  await handlers.login()
  await handlers.reply()
  await handlers['toggle-hide']()
  await handlers['toggle-lock']()
  await handlers['toggle-pin']()
  await handlers['toggle-subscription']()

  assert.deepEqual(calls, [
    'delete',
    'edit',
    'login',
    'reply',
    'toggle-hide',
    'toggle-lock',
    'toggle-pin',
    'toggle-subscription',
  ])
})

test('discussion detail post action handlers pass the current post from context', async () => {
  const post = { id: 42 }
  const received = []
  const handlers = createPostActionHandlers({
    deletePost: async currentPost => received.push(['delete-post', currentPost]),
    editPost: currentPost => received.push(['edit-post', currentPost]),
    openReportModal: async currentPost => received.push(['open-report-modal', currentPost]),
    togglePostHidden: async currentPost => received.push(['toggle-hide-post', currentPost]),
  })

  await handlers['delete-post'](null, { post })
  await handlers['edit-post'](null, { post })
  await handlers['open-report-modal'](null, { post })
  await handlers['toggle-hide-post'](null, { post })

  assert.deepEqual(received, [
    ['delete-post', post],
    ['edit-post', post],
    ['open-report-modal', post],
    ['toggle-hide-post', post],
  ])
})
