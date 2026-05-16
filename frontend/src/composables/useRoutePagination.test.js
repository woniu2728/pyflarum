import test from 'node:test'
import assert from 'node:assert/strict'
import { useRoutePagination } from './useRoutePagination.js'

test('changePage skips navigation when the target page matches current page', async () => {
  const pushes = []
  const pagination = useRoutePagination({
    page: { value: 2 },
    push: async overrides => {
      pushes.push(overrides)
    }
  })

  const changed = await pagination.changePage(2)

  assert.equal(changed, false)
  assert.deepEqual(pushes, [])
})

test('changePage pushes the next page and scrolls to top by default', async () => {
  const pushes = []
  const scrollCalls = []
  const previousWindow = globalThis.window
  globalThis.window = {
    scrollTo: (...args) => {
      scrollCalls.push(args)
    }
  }

  try {
    const pagination = useRoutePagination({
      page: { value: 1 },
      push: async overrides => {
        pushes.push(overrides)
      }
    })

    const changed = await pagination.changePage(3)

    assert.equal(changed, true)
    assert.deepEqual(pushes, [{ page: 3 }])
    assert.deepEqual(scrollCalls, [[0, 0]])
  } finally {
    globalThis.window = previousWindow
  }
})

test('resetPage forces page 1 and preserves other route overrides', async () => {
  const pushes = []
  const pagination = useRoutePagination({
    page: { value: 5 },
    pageStateKey: 'currentPage',
    scrollAfterNavigate: false,
    push: async overrides => {
      pushes.push(overrides)
    }
  })

  await pagination.resetPage({
    activeType: 'mentions',
    currentPage: 9,
  })

  assert.deepEqual(pushes, [{
    activeType: 'mentions',
    currentPage: 1,
  }])
})
