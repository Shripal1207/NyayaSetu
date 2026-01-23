/**
 * Keepalive Ping System for Render Services
 * 
 * This module pings the backend services periodically to prevent cold starts.
 * Call startKeepalive() once when the app loads.
 */

const PING_INTERVAL = 14 * 60 * 1000 // 14 minutes (Render sleeps after 15 min)

const services = [
    { name: 'Backend', url: import.meta.env.VITE_API_URL },
    { name: 'Chatbot', url: import.meta.env.VITE_CHATBOT_URL },
    { name: 'DocAnalyzer', url: import.meta.env.VITE_DOC_ANALYZER_URL }
]

const pingService = async (name, url) => {
    if (!url) return

    try {
        const healthUrl = `${url}/api/health`
        const response = await fetch(healthUrl, {
            method: 'GET',
            mode: 'cors'
        })
        if (response.ok) {
            console.log(`✅ ${name} is awake`)
        }
    } catch (error) {
        // Silent fail - service might still be waking up
        console.log(`⏳ Waking up ${name}...`)
    }
}

const pingAllServices = () => {
    services.forEach(({ name, url }) => pingService(name, url))
}

let intervalId = null

export const startKeepalive = () => {
    // Initial ping to wake up services
    pingAllServices()

    // Only set up interval if not already running
    if (!intervalId) {
        intervalId = setInterval(pingAllServices, PING_INTERVAL)
        console.log('🔄 Keepalive pings started (every 14 minutes)')
    }
}

export const stopKeepalive = () => {
    if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
        console.log('⏹ Keepalive pings stopped')
    }
}

export default { startKeepalive, stopKeepalive }
