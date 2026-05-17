import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveApprovalSelectionState, resolveApprovalTemplateOptions } from './approvalQueueTemplates.js'

test('approval queue templates resolve by action and item type', () => {
  const options = resolveApprovalTemplateOptions({
    noteTemplates: [
      {
        label: '通过模板',
        value: '内容符合社区规范，已放行。',
        actions: ['approve'],
      },
      {
        label: '拒绝模板',
        value: '内容质量不足，请补充更完整的信息后重新提交。',
        actions: ['reject'],
      },
      {
        label: '仅讨论',
        value: '讨论主题与现有内容重复，请合并到已有讨论。',
        actions: ['reject'],
        itemTypes: ['discussion'],
      },
      {
        label: '无效模板',
        value: '',
        actions: ['reject'],
      },
    ],
  }, {
    action: 'reject',
    itemType: 'discussion',
  })

  assert.deepEqual(options, [
    {
      label: '拒绝模板',
      value: '内容质量不足，请补充更完整的信息后重新提交。',
      description: '',
    },
    {
      label: '仅讨论',
      value: '讨论主题与现有内容重复，请合并到已有讨论。',
      description: '',
    },
  ])
})

test('approval queue templates keep only templates compatible with all selected item types', () => {
  const options = resolveApprovalTemplateOptions({
    noteTemplates: [
      {
        label: '通用拒绝',
        value: '请补充更多信息后重新提交。',
        actions: ['reject'],
      },
      {
        label: '仅讨论',
        value: '讨论主题重复，请合并到已有讨论。',
        actions: ['reject'],
        itemTypes: ['discussion'],
      },
      {
        label: '讨论和回复',
        value: '内容表达不完整，请整理后重新提交。',
        actions: ['reject'],
        itemTypes: ['discussion', 'post'],
      },
    ],
  }, {
    action: 'reject',
    itemTypes: ['discussion', 'post'],
  })

  assert.deepEqual(options, [
    {
      label: '通用拒绝',
      value: '请补充更多信息后重新提交。',
      description: '',
    },
    {
      label: '讨论和回复',
      value: '内容表达不完整，请整理后重新提交。',
      description: '',
    },
  ])
})

test('approval selection state derives current multi-select summary', () => {
  const state = resolveApprovalSelectionState([
    { type: 'discussion', id: 1 },
    { type: 'post', id: 2 },
  ], new Set(['discussion-1']))

  assert.deepEqual(state, {
    selectableKeys: ['discussion-1', 'post-2'],
    selectedItems: [{ type: 'discussion', id: 1 }],
    selectedCount: 1,
    allSelected: false,
    hasSelection: true,
  })
})
