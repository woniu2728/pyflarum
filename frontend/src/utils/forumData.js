export function unwrapList(payload) {
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.results)) return payload.results
  if (Array.isArray(payload)) return payload
  return []
}

export function normalizeTag(tag = {}) {
  return {
    ...tag,
    color: tag.color || '#6c7a89',
    children: unwrapList(tag.children).map(normalizeTag),
    last_posted_discussion: tag.last_posted_discussion || null
  }
}

export function flattenTags(tags) {
  return unwrapList(tags).flatMap(tag => {
    const normalized = normalizeTag(tag)
    return [normalized, ...flattenTags(normalized.children)]
  })
}
