// Tab switching
function openTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`button[onclick="openTab('${tabName}')"]`).classList.add('active');
}

// Line Chart for Market Overview
const priceChart = new Chart(document.getElementById('priceChart'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'MES1 Closing Price',
            data: [],
            borderColor: '#00f7ff',
            fill: false
        }]
    },
    options: {
        scales: {
            x: { time: { unit: 'minute' } },
            y: { beginAtZero: false }
        }
    }
});

async function fetchMarketData() {
    try {
        console.log('Fetching market data from https://trading-platform-backend-vert.vercel.app/api/market-data');
        const response = await fetch('https://trading-platform-backend-vert.vercel.app/api/market-data');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}, Response: ${await response.text()}`);
        }
        const data = await response.json();
        console.log('Market data response:', data);
        // Update line chart with closing prices
        priceChart.data.labels = data.candles.map(candle => new Date(candle.t).toLocaleTimeString());
        priceChart.data.datasets[0].data = data.candles.map(candle => candle.close);
        priceChart.update();
        document.getElementById('dailyChange').textContent = data.dailyChange + '%';
        document.getElementById('volume').textContent = data.volume;
    } catch (error) {
        console.error('Error fetching market data:', error);
    }
}

async function startAutoTrading() {
    try {
        console.log('Starting auto-trading');
        const response = await fetch('https://trading-platform-backend-vert.vercel.app/api/start-trading', { method: 'POST' });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}, Response: ${await response.text()}`);
        }
        const data = await response.json();
        console.log('Auto-trading response:', data);
        document.getElementById('tradingStatus').textContent = data.status;
        document.getElementById('todayPerformance').textContent = `$${data.profit} (${data.wins} WINS, ${data.losses} LOSSES)`;
        document.getElementById('dashboardPnL').textContent = `$${data.profit}`;
        updateTradeLog();
    } catch (error) {
        console.error('Error starting auto-trading:', error);
    }
}

async function runBacktest() {
    try {
        const instrument = document.getElementById('instrument').value;
        const strategy = document.getElementById('strategy').value;
        const date = document.getElementById('backtestDate').value;

        console.log('Sending backtest request:', { instrument, strategy, date });

        const response = await fetch('https://trading-platform-backend-vert.vercel.app/api/backtest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instrument, strategy, date })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
        }
        const data = await response.json();
        console.log('Backtest response:', data);
        if (!data || typeof data.totalTrades === 'undefined') {
            throw new Error('Invalid response from backend: ' + JSON.stringify(data));
        }

        document.getElementById('totalTrades').textContent = data.totalTrades || 0;
        document.getElementById('winRate').textContent = data.winRate ? data.winRate + '%' : '0.00%';
        document.getElementById('netProfit').textContent = '$' + (data.netProfit || 0);
        document.getElementById('profitFactor').textContent = data.profitFactor || '0.00';
        updateBacktestTradeLog();
    } catch (error) {
        console.error('Error running backtest:', error);
        alert('Failed to run backtest. Check the console for details.');
    }
}

async function startPaperTrading() {
    try {
        const broker = document.getElementById('paperBroker').value;
        const apiKey = document.getElementById('paperApiKey').value;
        const accountId = document.getElementById('paperAccountId').value;

        console.log('Starting paper trading:', { broker, apiKey, accountId });

        const response = await fetch('https://trading-platform-backend-vert.vercel.app/api/paper-trade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ broker, apiKey, accountId })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}, Response: ${await response.text()}`);
        }
        const data = await response.json();
        console.log('Paper trading response:', data);
        document.getElementById('paperTradingPnL').textContent = `$${data.netProfit}`;
        updatePaperTradeLog();
    } catch (error) {
        console.error('Error starting paper trading:', error);
    }
}

async function runPaperBacktest() {
    try {
        const broker = document.getElementById('paperBroker').value;
        const apiKey = document.getElementById('paperApiKey').value;
        const accountId = document.getElementById('paperAccountId').value;

        console.log('Running paper backtest:', { broker, apiKey, accountId });

        const response = await fetch('https://trading-platform-backend-vert.vercel.app/api/paper-backtest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ broker, apiKey, accountId })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}, Response: ${await response.text()}`);
        }
        const data = await response.json();
        console.log('Paper backtest response:', data);
        document.getElementById('paperTradingPnL').textContent = `$${data.netProfit}`;
        updatePaperTradeLog();
    } catch (error) {
        console.error('Error running paper backtest:', error);
    }
}

async function updateTradeLog() {
    try {
        console.log('Fetching trade log');
        const response = await fetch('https://trading-platform-backend-vert.vercel.app/api/trade-log');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}, Response: ${await response.text()}`);
        }
        const trades = await response.json();
        console.log('Trade log response:', trades);
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
                <td>${trade.reason}</td>
            </tr>`;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error updating trade log:', error);
    }
}

async function updateBacktestTradeLog() {
    try {
        console.log('Fetching backtest trade log');
        const response = await fetch('https://trading-platform-backend-vert.vercel.app/api/backtest-trade-log');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}, Response: ${await response.text()}`);
        }
        const trades = await response.json();
        console.log('Backtest trade log response:', trades);
        const tbody = document.getElementById('backtestTradeLogBody');
        tbody.innerHTML = '';
        trades.forEach(trade => {
            const row = `<tr>
                <td>${trade.timestamp}</td>
                <td>${trade.instrument}</td>
                <td>${trade.signal}</td>
                <td>${trade.entryPrice}</td>
                <td>${trade.exitPrice}</td>
                <td>${trade.profitLoss}</td>
                <td>${trade.reason}</td>
            </tr>`;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error updating backtest trade log:', error);
    }
}

async function updatePaperTradeLog() {
    try {
        console.log('Fetching paper trade log');
        const response = await fetch('https://trading-platform-backend-vert.vercel.app/api/paper-trade-log');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}, Response: ${await response.text()}`);
        }
        const trades = await response.json();
        console.log('Paper trade log response:', trades);
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
                <td>${trade.reason}</td>
            </tr>`;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error updating paper trade log:', error);
    }
}

function saveSettings() {
    const apiKey = document.getElementById('apiKey').value;
    localStorage.setItem('apiKey', apiKey);
    alert('Settings saved!');
}

// Fetch market data on load
fetchMarketData();
