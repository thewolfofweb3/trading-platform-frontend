// API base URL (replace with your Vercel URL after deployment)
const API_URL = 'https://trading-bot-backend.vercel.app'; // Replace with your Vercel URL

// Initialize the chart
const chartContainer = document.getElementById('chart');
const chart = LightweightCharts.createChart(chartContainer, {
    width: chartContainer.clientWidth,
    height: 400,
    layout: {
        backgroundColor: '#1F2937',
        textColor: '#D1D5DB',
    },
    grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
    },
    timeScale: {
        timeVisible: true,
        secondsVisible: false,
    },
});

const candleSeries = chart.addCandlestickSeries();

// Fetch and display candlestick data
async function loadChartData() {
    try {
        const response = await fetch(`${API_URL}/api/candles`);
        const data = await response.json();
        const chartData = data.map(candle => ({
            time: new Date(candle.time).getTime() / 1000,
            open: parseFloat(candle.mid.o),
            high: parseFloat(candle.mid.h),
            low: parseFloat(candle.mid.l),
            close: parseFloat(candle.mid.c),
        }));
        candleSeries.setData(chartData);
    } catch (error) {
        console.error('Error loading chart data:', error);
    }
}

loadChartData();

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
