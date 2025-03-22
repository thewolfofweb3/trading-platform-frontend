// frontend/src/scripts/settings.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('settings-form');
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const settings = {
            apiKey: document.getElementById('api-key').value,
            accountId: document.getElementById('account-id').value,
            dailyLossCap: document.getElementById('daily-loss-cap').value,
            riskPerTrade: document.getElementById('risk-per-trade').value,
            tradingStartTime: document.getElementById('trading-start-time').value,
            tradingEndTime: document.getElementById('trading-end-time').value,
            emailNotifications: document.getElementById('email-notifications').checked,
        };
        console.log('Settings saved:', settings);
        alert('Settings saved successfully!');
    });
});
