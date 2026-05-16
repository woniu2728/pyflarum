import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { runComposerSecondaryAction } from '@/forum/composerRuntime'
import {
  getComposerDraftMeta,
  getComposerNotices,
  getComposerSecondaryActions,
  getComposerStatusItems,
  getComposerTools,
  getUiCopy,
  runComposerMentionProviders,
  runComposerPreviewTransformers,
} from '@/forum/registry'
import {
  BASE_COMPOSER_TOOLS,
  COMPOSER_EMOJI_PICKER_WIDTH,
  EMOJI_GROUPS,
  buildComposerToolReplacement,
  buildEmojiReplacement,
  buildMentionReplacement,
  buildMentionTrigger,
  buildUploadedFileMarkdown,
  defaultToolCursorOffset,
  detectEmojiQuery,
  detectMentionQuery,
  fetchComposerPreview,
  getComposerErrorMessage,
  getTextareaCaretCoordinates,
  replaceSelection,
  searchEmojiItems,
  uploadComposerFile,
} from '@/utils/composer'

function sortByOrder(items) {
  return [...items].sort((left, right) => (left.order || 100) - (right.order || 100))
}

export function useComposerRuntime(options = {}) {
  const {
    composerStore,
    showComposer,
    content,
    submitting,
    submit,
    closeComposer,
    buildBaseContext,
    focusEditor,
    openComposer = () => composerStore?.showComposer?.(),
    saveRequestType = '',
    onSaveRequest = null,
    height = {},
  } = options

  const composerTextarea = ref(null)
  const attachmentInput = ref(null)
  const imageInput = ref(null)
  const emojiToolRef = ref(null)

  const uploading = ref(false)
  const uploadNotice = ref('')
  const uploadNoticeTone = ref('info')
  const showEmojiPicker = ref(false)
  const emojiSuggestions = ref([])
  const emojiAutocompleteState = ref(null)
  const emojiAutocompleteCaret = ref(null)
  const emojiAutocompleteActiveIndex = ref(0)
  const mentionUsers = ref([])
  const mentionState = ref(null)
  const mentionCaret = ref(null)
  const mentionLoading = ref(false)
  const mentionActiveIndex = ref(0)
  const showPreview = ref(false)
  const previewHtml = ref('')
  const previewLoading = ref(false)
  const previewError = ref('')
  const composerHeight = ref(loadComposerHeight())
  const resizing = ref(false)
  const viewportWidth = ref(typeof window === 'undefined' ? 1280 : window.innerWidth)

  let resizeStartY = 0
  let resizeStartHeight = composerHeight.value
  let previewTimer = null
  let mentionTimer = null
  let mentionRequestId = 0

  const emojiGroups = EMOJI_GROUPS
  const isPhoneViewport = computed(() => viewportWidth.value <= 768)
  const isPhoneOverlay = computed(() => isPhoneViewport.value && showComposer.value && !composerStore.isMinimized)
  const showBackdrop = computed(() => isPhoneOverlay.value)
  const showMentionPicker = computed(() => {
    return Boolean(mentionState.value) && (mentionLoading.value || mentionUsers.value.length > 0)
  })
  const showEmojiAutocomplete = computed(() => {
    return Boolean(emojiAutocompleteState.value) && emojiSuggestions.value.length > 0
  })
  const composerInlineStyle = computed(() => {
    if (composerStore.isMinimized || composerStore.isExpanded || isPhoneOverlay.value) return {}
    return { height: `${composerHeight.value}px` }
  })
  const emojiPickerStyle = computed(() => {
    const anchor = emojiToolRef.value
    if (!anchor || typeof window === 'undefined') return {}

    const rect = anchor.getBoundingClientRect()
    const pickerWidth = Math.min(COMPOSER_EMOJI_PICKER_WIDTH, Math.max(280, window.innerWidth - 32))
    const left = Math.max(16, Math.min(rect.right - pickerWidth, window.innerWidth - pickerWidth - 16))
    const top = Math.max(16, rect.top - 12)

    return {
      left: `${left}px`,
      top: `${top}px`,
      transform: 'translateY(-100%)',
    }
  })
  const mentionPickerStyle = computed(() => {
    return buildFloatingPickerStyle(mentionCaret.value, 280)
  })
  const emojiAutocompleteStyle = computed(() => {
    return buildFloatingPickerStyle(emojiAutocompleteCaret.value, 320)
  })
  const composerTools = computed(() => {
    return sortByOrder([
      ...BASE_COMPOSER_TOOLS,
      ...getComposerTools(buildExtensionContext()),
    ])
  })
  const composerSecondaryActions = computed(() => {
    return getComposerSecondaryActions(buildExtensionContext())
  })
  const composerStatusItems = computed(() => {
    return sortByOrder([
      ...getComposerStatusItems(buildExtensionContext()),
      ...getComposerDraftMeta(buildExtensionContext()),
    ])
  })
  const composerExtensionNotices = computed(() => {
    return getComposerNotices(buildExtensionContext())
  })

  watch(content, () => {
    schedulePreview()
  })

  watch(
    [
      showComposer,
      () => composerStore.isMinimized,
      () => composerStore.isExpanded,
      composerHeight,
      isPhoneViewport,
    ],
    () => {
      syncComposerViewportEffects()
    },
    { immediate: true }
  )

  onMounted(() => {
    window.addEventListener('resize', handleViewportResize)
    window.addEventListener('mousemove', handleResizeMove)
    window.addEventListener('mouseup', stopResize)
    document.addEventListener('mousedown', handleDocumentMouseDown)
    window.addEventListener('bias:composer-save-request', handleComposerSaveRequest)
  })

  onBeforeUnmount(() => {
    clearPreviewTimer()
    clearMentionSuggestions()
    window.removeEventListener('resize', handleViewportResize)
    window.removeEventListener('mousemove', handleResizeMove)
    window.removeEventListener('mouseup', stopResize)
    document.removeEventListener('mousedown', handleDocumentMouseDown)
    window.removeEventListener('bias:composer-save-request', handleComposerSaveRequest)
    clearComposerViewportEffects()
  })

  function buildExtensionContext(extra = {}) {
    return {
      ...(typeof buildBaseContext === 'function' ? buildBaseContext() : {}),
      ...extra,
      composerStore,
      content: content.value,
      isExpanded: composerStore.isExpanded,
      isMinimized: composerStore.isMinimized,
      minimized: composerStore.isMinimized,
      showPreview: showPreview.value,
      submitting: Boolean(submitting?.value),
      uploading: uploading.value,
    }
  }

  function buildToolContext(tool) {
    const textarea = composerTextarea.value
    return buildExtensionContext({
      tool,
      clearInlineSuggestions() {
        clearMentionSuggestions()
        clearEmojiAutocomplete()
      },
      focusEditor() {
        focusEditor?.()
      },
      insertText: insertComposerText,
      openAttachmentPicker() {
        attachmentInput.value?.click()
      },
      openImagePicker() {
        imageInput.value?.click()
      },
      selectionEnd: textarea?.selectionEnd ?? content.value.length,
      selectionStart: textarea?.selectionStart ?? content.value.length,
      setEmojiPickerVisible(value) {
        showEmojiPicker.value = Boolean(value)
      },
      setPreviewVisible(value) {
        showPreview.value = Boolean(value)
      },
    })
  }

  async function applyComposerTool(tool) {
    openComposer?.()
    await nextTick()

    if (typeof tool.run === 'function') {
      await tool.run(buildToolContext(tool))
      return
    }

    if (tool.key === 'upload') {
      showEmojiPicker.value = false
      clearMentionSuggestions()
      clearEmojiAutocomplete()
      attachmentInput.value?.click()
      return
    }
    if (tool.key === 'image') {
      showEmojiPicker.value = false
      clearMentionSuggestions()
      clearEmojiAutocomplete()
      imageInput.value?.click()
      return
    }
    if (tool.key === 'emoji') {
      clearMentionSuggestions()
      clearEmojiAutocomplete()
      if (showPreview.value) {
        showPreview.value = false
        await nextTick()
      }
      showEmojiPicker.value = !showEmojiPicker.value
      if (showEmojiPicker.value) {
        focusEditor?.()
      }
      return
    }

    const textarea = composerTextarea.value
    if (!textarea) return

    const start = textarea.selectionStart ?? content.value.length
    const end = textarea.selectionEnd ?? content.value.length
    if (tool.key === 'mention') {
      const replacement = buildMentionTrigger(content.value, start)
      await insertComposerText(replacement, {
        start,
        end,
        cursor: start + replacement.length,
      })
      return
    }

    const selected = content.value.slice(start, end)
    const replacement = buildComposerToolReplacement(tool, selected)
    const cursor = selected ? start + replacement.length : start + defaultToolCursorOffset(tool)

    await insertComposerText(replacement, { start, end, cursor })
  }

  function handleEditorInteraction(event) {
    if (
      event?.type === 'keyup'
      && ['ArrowUp', 'ArrowDown', 'Enter', 'Escape', 'Tab'].includes(event.key)
    ) {
      return
    }
    syncInlineSuggestions()
  }

  function handleEditorKeydown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      submit?.()
      return
    }

    if (event.key === 'Escape') {
      if (showMentionPicker.value) {
        event.preventDefault()
        clearMentionSuggestions()
        return
      }
      if (showEmojiAutocomplete.value) {
        event.preventDefault()
        clearEmojiAutocomplete()
        return
      }
      if (showEmojiPicker.value) {
        event.preventDefault()
        showEmojiPicker.value = false
        return
      }
      if (showPreview.value) {
        event.preventDefault()
        showPreview.value = false
        nextTick(() => focusEditor?.())
        return
      }
      event.preventDefault()
      closeComposer?.()
      return
    }

    if (showEmojiAutocomplete.value) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        emojiAutocompleteActiveIndex.value =
          (emojiAutocompleteActiveIndex.value + 1) % Math.max(emojiSuggestions.value.length, 1)
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        emojiAutocompleteActiveIndex.value =
          (emojiAutocompleteActiveIndex.value - 1 + Math.max(emojiSuggestions.value.length, 1)) % Math.max(emojiSuggestions.value.length, 1)
        return
      }

      if (
        (event.key === 'Enter' || event.key === 'Tab')
        && !event.shiftKey
        && !event.ctrlKey
        && !event.metaKey
        && !event.altKey
      ) {
        const activeEmoji = emojiSuggestions.value[emojiAutocompleteActiveIndex.value]
        if (!activeEmoji) return
        event.preventDefault()
        handleEmojiAutocompleteSelect(activeEmoji)
        return
      }
    }

    if (!showMentionPicker.value) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      mentionActiveIndex.value = (mentionActiveIndex.value + 1) % Math.max(mentionUsers.value.length, 1)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      mentionActiveIndex.value =
        (mentionActiveIndex.value - 1 + Math.max(mentionUsers.value.length, 1)) % Math.max(mentionUsers.value.length, 1)
      return
    }

    if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const activeUser = mentionUsers.value[mentionActiveIndex.value]
      if (!activeUser) return
      event.preventDefault()
      handleMentionSelect(activeUser)
      return
    }

    if (event.key === 'Escape') {
      clearMentionSuggestions()
    }
  }

  async function handleAttachmentSelected(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    await uploadAndInsertFile(file, false)
  }

  async function handleImageSelected(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    await uploadAndInsertFile(file, true)
  }

  async function uploadAndInsertFile(file, asImage) {
    uploading.value = true
    uploadNoticeTone.value = 'info'
    uploadNotice.value = getUiCopy({
      surface: 'composer-upload-progress',
      asImage,
      fileName: file.name,
    })?.text || `正在上传${asImage ? '图片' : '附件'}：${file.name}`

    try {
      const uploaded = await uploadComposerFile(file)
      if (!showComposer.value) return

      const markdown = buildUploadedFileMarkdown(uploaded.original_name || file.name, uploaded.url, {
        image: asImage,
      })
      await insertComposerText(markdown)
      uploadNoticeTone.value = 'success'
      uploadNotice.value = getUiCopy({
        surface: 'composer-upload-inserted',
        asImage,
      })?.text || `${asImage ? '图片' : '附件'}已插入编辑器`
    } catch (error) {
      uploadNoticeTone.value = 'error'
      uploadNotice.value = getComposerErrorMessage(error, getUiCopy({
        surface: 'composer-upload-failed',
        asImage,
      })?.text || (asImage ? '图片上传失败' : '附件上传失败'))
    } finally {
      uploading.value = false
    }
  }

  async function handleEmojiSelect(emoji) {
    showEmojiPicker.value = false
    await insertComposerText(emoji)
  }

  async function handleEmojiAutocompleteSelect(item) {
    if (!emojiAutocompleteState.value || !item?.emoji) return

    const replacement = buildEmojiReplacement(item.emoji)
    await insertComposerText(replacement, {
      start: emojiAutocompleteState.value.start,
      end: emojiAutocompleteState.value.end,
      cursor: emojiAutocompleteState.value.start + replacement.length,
    })
    clearEmojiAutocomplete()
  }

  function syncInlineSuggestions() {
    if (showPreview.value) {
      clearMentionSuggestions()
      clearEmojiAutocomplete()
      return
    }

    const textarea = composerTextarea.value
    if (!textarea || textarea.selectionStart !== textarea.selectionEnd) {
      clearMentionSuggestions()
      clearEmojiAutocomplete()
      return
    }

    const detected = detectMentionQuery(content.value, textarea.selectionStart)
    if (detected) {
      clearEmojiAutocomplete()
      mentionState.value = detected
      mentionCaret.value = getTextareaCaretCoordinates(textarea, detected.start)
      scheduleMentionSearch(detected.query)
      return
    }

    clearMentionSuggestions()

    const detectedEmoji = detectEmojiQuery(content.value, textarea.selectionStart)
    if (!detectedEmoji) {
      clearEmojiAutocomplete()
      return
    }

    emojiAutocompleteState.value = detectedEmoji
    emojiAutocompleteCaret.value = getTextareaCaretCoordinates(textarea, detectedEmoji.start)
    emojiSuggestions.value = searchEmojiItems(detectedEmoji.query, {
      limit: 8,
      includeCommonWhenEmpty: true,
    })
    emojiAutocompleteActiveIndex.value = 0
  }

  function scheduleMentionSearch(query) {
    if (mentionTimer) {
      clearTimeout(mentionTimer)
    }

    mentionLoading.value = true
    const requestId = ++mentionRequestId
    mentionTimer = setTimeout(async () => {
      try {
        const users = await runComposerMentionProviders(buildExtensionContext({
          mentionQuery: query,
          limit: 5,
        }))
        if (requestId !== mentionRequestId || !mentionState.value) return
        mentionUsers.value = Array.isArray(users) ? users.slice(0, 5) : []
        mentionActiveIndex.value = 0
      } catch (error) {
        if (requestId !== mentionRequestId) return
        mentionUsers.value = []
      } finally {
        if (requestId === mentionRequestId) {
          mentionLoading.value = false
        }
      }
    }, 150)
  }

  async function handleMentionSelect(user) {
    if (!mentionState.value || !user?.username) return

    const replacement = buildMentionReplacement(user.username)
    await insertComposerText(replacement, {
      start: mentionState.value.start,
      end: mentionState.value.end,
      cursor: mentionState.value.start + replacement.length,
    })
    clearMentionSuggestions()
  }

  function togglePreview() {
    showPreview.value = !showPreview.value
    previewError.value = ''
    showEmojiPicker.value = false
    clearMentionSuggestions()
    clearEmojiAutocomplete()

    if (showPreview.value) {
      requestPreview()
      return
    }

    nextTick(() => focusEditor?.())
  }

  function schedulePreview() {
    if (!showPreview.value) return

    clearPreviewTimer()
    previewTimer = setTimeout(() => {
      requestPreview()
    }, 220)
  }

  async function requestPreview() {
    if (!showPreview.value) return

    const currentContent = content.value.trim()
    previewError.value = ''
    if (!currentContent) {
      previewHtml.value = ''
      previewLoading.value = false
      return
    }

    previewLoading.value = true
    try {
      const data = await fetchComposerPreview(content.value)
      if (!showPreview.value) return
      const transformed = await runComposerPreviewTransformers(buildExtensionContext({
        content: content.value,
        data,
        html: data.html || '',
      }))
      previewHtml.value = transformed?.html || data.html || ''
    } catch (error) {
      previewError.value = getComposerErrorMessage(error, getUiCopy({
        surface: 'composer-preview-load-failed',
      })?.text || '预览加载失败')
    } finally {
      previewLoading.value = false
    }
  }

  async function insertComposerText(replacement, options = {}) {
    await nextTick()

    const textarea = composerTextarea.value
    const currentContent = content.value
    const start = options.start ?? textarea?.selectionStart ?? currentContent.length
    const end = options.end ?? textarea?.selectionEnd ?? currentContent.length
    const cursor = options.cursor ?? start + replacement.length

    content.value = replaceSelection(currentContent, start, end, replacement)

    await nextTick()
    focusEditor?.()
    composerTextarea.value?.setSelectionRange(cursor, cursor)
    syncInlineSuggestions()
  }

  function handleDocumentMouseDown(event) {
    if (showEmojiPicker.value && !emojiToolRef.value?.contains(event.target)) {
      showEmojiPicker.value = false
    }
    if (event.target !== composerTextarea.value) {
      clearMentionSuggestions()
      clearEmojiAutocomplete()
    }
  }

  function setEmojiToolRef(element) {
    emojiToolRef.value = element
  }

  function clearPreviewTimer() {
    if (previewTimer) {
      clearTimeout(previewTimer)
      previewTimer = null
    }
  }

  function clearMentionSuggestions() {
    if (mentionTimer) {
      clearTimeout(mentionTimer)
      mentionTimer = null
    }
    mentionLoading.value = false
    mentionUsers.value = []
    mentionState.value = null
    mentionCaret.value = null
    mentionActiveIndex.value = 0
  }

  function clearEmojiAutocomplete() {
    emojiSuggestions.value = []
    emojiAutocompleteState.value = null
    emojiAutocompleteCaret.value = null
    emojiAutocompleteActiveIndex.value = 0
  }

  function clearRuntimeState() {
    uploadNotice.value = ''
    uploadNoticeTone.value = 'info'
    showEmojiPicker.value = false
    showPreview.value = false
    previewHtml.value = ''
    previewLoading.value = false
    previewError.value = ''
    clearPreviewTimer()
    clearMentionSuggestions()
    clearEmojiAutocomplete()
  }

  function handleViewportResize() {
    viewportWidth.value = window.innerWidth
    if (mentionState.value || emojiAutocompleteState.value) {
      nextTick(() => {
        syncInlineSuggestions()
      })
    }
  }

  function startResize(event) {
    if (composerStore.isExpanded || composerStore.isMinimized || window.innerWidth <= 768) return

    resizing.value = true
    resizeStartY = event.clientY
    resizeStartHeight = composerHeight.value
  }

  function handleResizeMove(event) {
    if (!resizing.value) return

    const delta = resizeStartY - event.clientY
    composerHeight.value = clampComposerHeight(resizeStartHeight + delta)
  }

  function stopResize() {
    if (!resizing.value) return
    resizing.value = false
    persistComposerHeight(composerHeight.value)
  }

  function syncComposerViewportEffects() {
    if (typeof document === 'undefined') return
    if (composerStore.isOpen && !showComposer.value) return

    const activeDesktopComposer =
      showComposer.value
      && !composerStore.isMinimized
      && !composerStore.isExpanded
      && !isPhoneViewport.value

    document.documentElement.style.setProperty('--composer-offset', activeDesktopComposer ? `${composerHeight.value + 24}px` : '0px')
    document.body.style.overflow = showBackdrop.value ? 'hidden' : ''
  }

  function clearComposerViewportEffects() {
    if (typeof document === 'undefined') return
    document.documentElement.style.setProperty('--composer-offset', '0px')
    document.body.style.overflow = ''
  }

  function handleComposerSaveRequest(event) {
    if (!saveRequestType || typeof onSaveRequest !== 'function') return

    const detail = event?.detail || {}
    if (detail.composerType !== saveRequestType) return
    if (Number(detail.requestId || 0) !== Number(composerStore.current.requestId || 0)) return
    onSaveRequest(true)
  }

  async function handleComposerSecondaryAction(item) {
    await runComposerSecondaryAction(item, buildExtensionContext())
  }

  function loadComposerHeight() {
    if (typeof window === 'undefined') {
      return Number(height.defaultValue || 420)
    }
    const value = Number(window.localStorage.getItem(height.storageKey) || height.defaultValue || 420)
    return clampComposerHeight(value)
  }

  function persistComposerHeight(value) {
    if (typeof window === 'undefined' || !height.storageKey) return
    window.localStorage.setItem(height.storageKey, String(clampComposerHeight(value)))
  }

  function clampComposerHeight(value) {
    const min = Number(height.min || 280)
    const fallbackMax = Number(height.maxDefault || 680)
    const windowMax = typeof window === 'undefined'
      ? fallbackMax
      : Math.max(Number(height.maxFloor || 320), window.innerHeight - Number(height.windowOffset || 72))
    return Math.max(min, Math.min(value, windowMax))
  }

  function buildFloatingPickerStyle(anchor, preferredHeight) {
    if (!anchor || typeof window === 'undefined') return {}

    const pickerWidth = Math.min(320, Math.max(240, window.innerWidth - 32))
    const pickerHeight = Math.min(preferredHeight, Math.max(180, window.innerHeight - 32))
    const left = Math.max(16, Math.min(anchor.left, window.innerWidth - pickerWidth - 16))
    const belowTop = anchor.top + anchor.lineHeight + 8
    const openAbove = belowTop + pickerHeight > window.innerHeight - 16 && anchor.top > pickerHeight + 24

    return {
      left: `${left}px`,
      top: openAbove ? `${anchor.top - 8}px` : `${belowTop}px`,
      transform: openAbove ? 'translateY(-100%)' : 'none',
    }
  }

  return {
    attachmentInput,
    composerExtensionNotices,
    composerHeight,
    composerInlineStyle,
    composerSecondaryActions,
    composerStatusItems,
    composerTextarea,
    composerTools,
    emojiSuggestions,
    emojiAutocompleteActiveIndex,
    emojiAutocompleteStyle,
    emojiGroups,
    emojiPickerStyle,
    handleAttachmentSelected,
    handleComposerSecondaryAction,
    handleEditorInteraction,
    handleEditorKeydown,
    handleEmojiAutocompleteSelect,
    handleEmojiSelect,
    handleImageSelected,
    handleMentionSelect,
    imageInput,
    insertComposerText,
    isPhoneOverlay,
    isPhoneViewport,
    mentionActiveIndex,
    mentionLoading,
    mentionPickerStyle,
    mentionUsers,
    previewError,
    previewHtml,
    previewLoading,
    requestPreview,
    resizing,
    setEmojiToolRef,
    showBackdrop,
    showEmojiAutocomplete,
    showEmojiPicker,
    showMentionPicker,
    showPreview,
    startResize,
    syncInlineSuggestions,
    togglePreview,
    uploadNotice,
    uploadNoticeTone,
    uploading,
    applyComposerTool,
    clearRuntimeState,
    buildExtensionContext,
  }
}
