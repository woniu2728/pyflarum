export function resolveApprovalTemplateOptions(config, context = {}) {
  const templates = Array.isArray(config?.noteTemplates) ? config.noteTemplates : []

  return templates
    .filter(template => {
      if (!template || !template.value) return false

      const actions = Array.isArray(template.actions) && template.actions.length
        ? template.actions
        : null
      if (actions && !actions.includes(context.action)) {
        return false
      }

      const itemTypes = Array.isArray(template.itemTypes) && template.itemTypes.length
        ? template.itemTypes
        : null
      if (itemTypes && !itemTypes.includes(context.itemType)) {
        return false
      }

      return true
    })
    .map(template => ({
      label: template.label || template.value,
      value: template.value,
      description: template.description || '',
    }))
}
