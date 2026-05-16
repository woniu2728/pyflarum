import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveVisiblePostMetrics } from './useDiscussionPostViewportState.js'

test('resolveVisiblePostMetrics prefers closest visible post and interpolated progress', () => {
  const result = resolveVisiblePostMetrics({
    postRects: [
      { number: 10, rect: { top: 80, bottom: 180, height: 100 } },
      { number: 11, rect: { top: 190, bottom: 290, height: 100 } },
      { number: 12, rect: { top: 300, bottom: 400, height: 100 } },
    ],
    viewportTop: 96,
    viewportBottom: 320,
    anchorY: 120,
    maxPostNumber: 40,
    scrollBottom: 500,
    documentBottom: 1200,
  })

  assert.equal(result.trackedPostNumber, 10)
  assert.equal(result.progress > 10, true)
  assert.equal(result.progress < 11, true)
})

test('resolveVisiblePostMetrics pins progress to max when already at page bottom', () => {
  const result = resolveVisiblePostMetrics({
    postRects: [
      { number: 18, rect: { top: 40, bottom: 140, height: 100 } },
      { number: 19, rect: { top: 150, bottom: 250, height: 100 } },
      { number: 20, rect: { top: 260, bottom: 360, height: 100 } },
    ],
    viewportTop: 96,
    viewportBottom: 360,
    anchorY: 120,
    maxPostNumber: 20,
    scrollBottom: 980,
    documentBottom: 1000,
  })

  assert.equal(result.trackedPostNumber, 20)
  assert.equal(result.progress, 20)
})
