import test from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import { useRequestedPaginatedListState } from './useRequestedPaginatedListState.js'

function flushWatchers() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

test('requested paginated list state skips loading until requested', async () => {
  const source = ref('alpha')
  const requested = ref(false)
  const loads = []
  const resets = []

  useRequestedPaginatedListState({
    watchSources: () => [source.value],
    isRequested: () => requested.value,
    reset() {
      resets.push(source.value)
    },
    async load() {
      loads.push(source.value)
      return null
    },
  })

  await flushWatchers()

  assert.deepEqual(loads, [])
  assert.deepEqual(resets, ['alpha'])

  requested.value = true
  await flushWatchers()

  assert.deepEqual(loads, ['alpha'])
  assert.deepEqual(resets, ['alpha', 'alpha'])
})

test('requested paginated list state only resets on watched changes while idle', async () => {
  const source = ref('alpha')
  const requested = ref(false)
  const loads = []
  const resets = []

  useRequestedPaginatedListState({
    watchSources: () => [source.value],
    isRequested: () => requested.value,
    reset() {
      resets.push(source.value)
    },
    async load() {
      loads.push(source.value)
      return null
    },
  })

  await flushWatchers()
  source.value = 'beta'
  await flushWatchers()

  assert.deepEqual(loads, [])
  assert.deepEqual(resets, ['alpha', 'beta'])
})
