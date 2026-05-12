/**
 * Keepalive Ping for the chatbot backend.
 * Pings the backend periodically to prevent cold starts on hosts like Render.
 * Call startKeepalive() once when the app loads.
 */

const PING_INTERVAL = 14 * 60 * 1000 // 14 minutes (Render sleeps after 15 min)

const pingBackend = async () => {
    const url = import.meta.env.VITE_API_URL
    if (!url) return

    try {
        const response = await fetch(`${url}/api/health`, { method: 'GET', mode: 'cors' })
        if (response.ok) {
            console.log('Chatbot backend is awake')
        }
    } catch {
        console.log('Waking up chatbot backend...')
    }
}

let intervalId = null

export const startKeepalive = () => {
    pingBackend()
    if (!intervalId) {
        intervalId = setInterval(pingBackend, PING_INTERVAL)
        console.log('Keepalive pings started (every 14 minutes)')
    }
}

export const stopKeepalive = () => {
    if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
        console.log('Keepalive pings stopped')
    }
}

export default { startKeepalive, stopKeepalive }
