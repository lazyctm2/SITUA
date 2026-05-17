export function formatAlertTime(timestamp) {
  if (!timestamp) return 'Hora no disponible'
  const date = new Date(timestamp)
  return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}
