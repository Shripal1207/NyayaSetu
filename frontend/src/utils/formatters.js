export const formatTime = (date) => {
  if (!date) return ''

  const d = date instanceof Date ? date : new Date(date)

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}
