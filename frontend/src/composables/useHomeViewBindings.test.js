import test from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import { createHomeViewBindings } from './useHomeViewBindings.js'

test('home view bindings expose hero and action props', () => {
  const bindings = createHomeViewBindings({
    authStore: { canStartDiscussion: true },
    browseDiscussionsText: ref('浏览讨论'),
    handleStartDiscussion() {},
    heroDescriptionText: ref('论坛首页'),
    heroTitleText: ref('Bias'),
    registerAccountText: ref('注册账号'),
    startDiscussionText: ref('发起讨论'),
  })

  assert.deepEqual(bindings.heroBindings.value, {
    title: 'Bias',
    description: '论坛首页',
    variant: 'default',
  })
  assert.equal(bindings.actionBindings.value.canStartDiscussion, true)
  assert.equal(bindings.actionBindings.value.startDiscussionText, '发起讨论')
})

test('home view bindings expose stable action handlers', () => {
  const calls = []
  const bindings = createHomeViewBindings({
    authStore: { canStartDiscussion: false },
    browseDiscussionsText: ref('浏览讨论'),
    handleStartDiscussion() {
      calls.push('start')
    },
    heroDescriptionText: ref('论坛首页'),
    heroTitleText: ref('Bias'),
    registerAccountText: ref('注册账号'),
    startDiscussionText: ref('发起讨论'),
  })

  bindings.actionEvents.startDiscussion()

  assert.deepEqual(calls, ['start'])
})
