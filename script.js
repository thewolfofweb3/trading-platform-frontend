// Tab switching
function openTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`button[onclick="openTab('${tabName}')"]`).classList.add('active');
}

// Chart.js for Market Overview
const sessionHighChart = new Chart(document.getElementById('sessionHighChart'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Session High',
            data: [],
            borderColor: '#00f7ff',
            fill: false
        }]
    },
    options: { scales: { y: { beginAtZero: true } } }
});

const sessionLowChart = new Chart(document.getElementById('sessionLowChart'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Session Low',
            data: [],
            borderColor: '#00f7ff',
            fill: false
        }]
    },
    options: { scales: { y: { beginAtZero: true } } }
});

async function fetchMarketData() {
    const response = await fetch('');
    const data = await response.json();
    sessionHighChart.data.labels = data.labels;
    sessionHighChart.data.datasets[0].data = data.highs;
    sessionHighChart.update();
    sessionLowChart.data.labels = data.labels;
    sessionLowChart.data.datasets[0].data = data.lows;
    sessionLowChart.update();
    document.getElementById('dailyChange').textContent = data.dailyChange + '%';
    document.getElementById('volume').textContent = data.volume;
}

async function startAutoTrading() {
    const response = await fetch('https://futures-ai-trading-backend.vercel.app/api/start-trading', { method: 'POST' });
    const data = await response.json();
    document.getElementById('tradingStatus').textContent = data.status;
    document.getElementById('todayPerformance').textContent = `$${data.profit} (${data.wins} WINS, ${data.losses} LOSSES)`;
    updateTradeLog();
}

async function runBacktest() {
    const instrument = document.getElementById('instrument').value;
    const strategy = document.getElementById('strategy').value;
    const date = document.getElementById('backtestDate').value;

    const response = await fetch('https://futures-ai-trading-backend.vercel.app/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instrument, strategy, date })
    });
    const data = await response.json();

    document.getElementById('totalTrades').textContent = data.totalTrades;
    document.getElementById('winRate').textContent = data.winRate + '%';
    document.getElementById('netProfit').textContent = '$' + data.netProfit;
    document.getElementById('profitFactor').textContent = data.profitFactor;
}

async function startPaperTrading() {
    const broker = document.getElementById('paperBroker').value;
    const apiKey = document.getElementById('paperApiKey').value;
    const accountId = document.getElementById('paperAccountId').value;

    const response = await fetch('https://futures-ai-trading-backend.vercel.app/api/paper-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ broker, apiKey, accountId })
    });
    const data = await response.json();
    updatePaperTradeLog();
}

async function runPaperBacktest() {
    const broker = document.getElementById('paperBroker').value;
    const apiKey = document.getElementById('paperApiKey').value;
    const accountId = document.getElementById('paperAccountId').value;

    const response = await fetch('https://futures-ai-trading-backend.vercel.app/api/paper-backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ broker, apiKey, accountId })
    });
    const data = await response.json();
    updatePaperTradeLog();
}

async function updateTradeLog() {
    const response = await fetch('https://futures-ai-trading-backend.vercel.app/api/trade-log');
    const trades = await response.json();
    const tbody = document.getElementById('tradeLogBody');
    tbody.innerHTML = '';
    trades.forEach(trade => {
        const row = `<tr>
            <td>${trade.timestamp}</td>
            <td>${trade.instrument}</td>
            <td>${trade.signal}</td>
            <td>${trade.entryPrice}</td>
            <td>${trade.exitPrice}</td>
            <td>${trade.profitLoss}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

async function updatePaperTradeLog() {
    const response = await fetch('https://futures-ai-trading-backend.vercel.app/api/paper-trade-log');
    const trades = await response.json();
    const tbody = document.getElementById('paperTradeLogBody');
    tbody.innerHTML = '';
    trades.forEach(trade => {
        const row = `<tr>
            <td>${trade.timestamp}</td>
            <td>${trade.instrument}</td>
            <td>${trade.signal}</td>
            <td>${trade.entryPrice}</td>
            <td>${trade.exitPrice}</td>
            <td>${trade.profitLoss}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

// Fetch market data on load
fetchMarketData();
