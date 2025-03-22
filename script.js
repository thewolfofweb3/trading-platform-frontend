const API_URL = 'https://trading-platform-backend-vert.vercel.app';

let chart, candleSeries;
const chartContainer = document.getElementById('chart');
if (chartContainer) {
    chart = LightweightCharts.createChart(chartContainer, {
        width: chartContainer.clientWidth,
        height: 400,
        layout: { backgroundColor: '#0B1A2F', textColor: '#E0E7E9' },
        grid: { vertLines: { color: '#2E3A3B' }, horzLines: { color: '#2E3A3B' } },
        timeScale: { timeVisible: true, secondsVisible: false },
    });
    candleSeries = chart.addCandlestickSeries({
        upColor: '#00C4B4', downColor: '#FF6F61',
        borderUpColor: '#00C4B4', borderDownColor: '#FF6F61',
        wickUpColor: '#00C4B4', wickDownColor: '#FF6F61',
    });
    loadChartData(new Date(Date.now() - 50 * 5 * 60 * 1000).toISOString().split('T')[0]);
}

async function loadChartData(startDate) {
    const response = await fetch(`${API_URL}/api/candles?startDate=${startDate}`);
    const { candles } = await response.json();
    const chartData = candles.map(candle => ({
        time: Math.floor(new Date(candle.time).getTime() / 1000),
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
    }));
    candleSeries.setData(chartData);
}

if (document.getElementById('backtest-form')) {
    document.getElementById('backtest-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const instrument = document.getElementById('instrument').value;
        const startDate = document.getElementById('start-date').value;
        const strategy = document.getElementById('strategy').value;
        if (!startDate || !strategy) {
            alert('Please select a start date and strategy.');
            return;
        }
        const response = await fetch(`${API_URL}/api/backtest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instrument, startDate, strategy })
        });
        const result = await response.json();
        document.getElementById('backtest-status').textContent = 'Backtest completed.';
        document.getElementById('status').textContent = 'Completed';
        document.getElementById('trades-executed').textContent = result.trades.length;
        document.getElementById('profit-loss').textContent = `$${result.trades.reduce((sum, trade) => sum + trade.profitLoss, 0).toFixed(2)}`;
        const tradeIndicators = document.getElementById('trade-indicators');
        tradeIndicators.innerHTML = result.trades.map(trade => `
            <tr>
                <td class="p-2">${new Date(trade.time).toLocaleString()}</td>
                <td class="p-2">${trade.signal || 'Exit'}</td>
                <td class="p-2">${trade.entry.toFixed(2)}</td>
                <td class="p-2">1</td>
                <td class="p-2">${trade.stopLoss.toFixed(2)}</td>
                <td class="p-2">${trade.takeProfit.toFixed(2)}</td>
                <td class="p-2">$${trade.profitLoss.toFixed(2)}</td>
            </tr>
        `).join('') || '<tr><td colspan="7" class="p-2">No trades executed.</td></tr>';
    });
}
