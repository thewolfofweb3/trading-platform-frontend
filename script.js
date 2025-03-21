// API base URL (replace with your Vercel URL after deployment)
const API_URL = 'http://localhost:5000'; // Change to https://trading-bot-backend.vercel.app after deployment

// Start trading
document.getElementById('start-trading').addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_URL}/api/start-trading`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        const tradeLog = document.getElementById('trade-log');
        tradeLog.innerHTML += `<p>${new Date().toLocaleTimeString()}: ${result.message}${result.signal ? ' - Signal: ' + result.signal : ''}${result.units ? ' - Units: ' + result.units : ''}</p>`;
    } catch (error) {
        console.error('Error starting trading:', error);
    }
});

// Check status
async function updateStatus() {
    try {
        const response = await fetch(`${API_URL}/api/status`);
        const status = await response.json();
        document.getElementById('account-balance').textContent = `Daily Loss: $${status.dailyLoss} | Trades Today: ${status.tradesToday}`;
    } catch (error) {
        console.error('Error fetching status:', error);
    }
}

setInterval(updateStatus, 60000); // Update status every minute
updateStatus();
