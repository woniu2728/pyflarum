import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveApprovalTemplateOptions } from './approvalQueueTemplates.js'

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
