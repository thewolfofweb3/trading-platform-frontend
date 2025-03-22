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
    try {
        const instrument = document.getElementById('instrument')?.value || 'MNQ';
        const response = await fetch(`${API_URL}/api/candles?startDate=${startDate}&instrument=${instrument}`);
        const { candles } = await response.json();
        if (!candles || candles.length === 0) {
            console.error('No chart data received');
            return;
        }
        const chartData = candles.map(candle => ({
            time: Math.floor(new Date(candle.time).getTime() / 1000),
            open: parseFloat(candle.open),
            high: parseFloat(candle.high),
            low: parseFloat(candle.low),
            close: parseFloat(candle.close),
        }));
        candleSeries.setData(chartData);
    } catch (error) {
        console.error('Error loading chart data:', error);
    }
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
        try {
            const response = await fetch(`${API_URL}/api/backtest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instrument, startDate, strategy })
            });
            const result = await response.json();
            if (result.error) {
                document.getElementById('backtest-status').textContent = result.error;
                return;
            }
            document.getElementById('backtest-status').textContent = 'Backtest completed.';
            document.getElementById('status').textContent = 'Completed';
            document.getElementById('trades-executed').textContent = result.trades.length;
            document.getElementById('profit-loss').textContent = `$${result.trades.reduce((sum, trade) => sum + trade.profitLoss, 0).toFixed(2)}`;
            const tradeIndicators = document.getElementById('trade-indicators');
            tradeIndicators.innerHTML = result.trades.map(trade => `
                <tr>
                    <td class="p-2">${new Date(trade.timestamp).toLocaleString()}</td>
                    <td class="p-2">${trade.signal}</td>
                    <td class="p-2">${trade.entryPrice.toFixed(2)}</td>
                    <td class="p-2">${trade.units}</td>
                    <td class="p-2">${trade.stopLoss.toFixed(2)}</td>
                    <td class="p-2">${trade.takeProfit.toFixed(2)}</td>
                    <td class="p-2">$${trade.profitLoss.toFixed(2)}</td>
                </tr>
            `).join('') || '<tr><td colspan="7" class="p-2">No trades executed.</td></tr>';
        } catch (error) {
            console.error('Error running backtest:', error);
            document.getElementById('backtest-status').textContent = 'Error running backtest.';
        }
    });
}

if (document.getElementById('start-trading')) {
    document.getElementById('start-trading').addEventListener('click', async () => {
        const instrument = document.getElementById('instrument').value;
        const strategy = document.getElementById('strategy').value;
        const tradeLog = document.getElementById('trade-log');
        tradeLog.innerHTML += `<tr><td class="p-2">${new Date().toLocaleString()}</td><td class="p-2" colspan="6">Trading started with ${strategy} on ${instrument}.</td></tr>`;
        // Simulate real-time trading (placeholder)
        const interval = setInterval(async () => {
            try {
                const candles = await fetchCandlestickData(instrument, new Date());
                const signals = strategy === 'ictScalping' ? ictScalpingStrategy(candles) :
                                strategy === 'maCrossover' ? maCrossoverStrategy(candles) :
                                bollingerSqueezeStrategy(candles);
                const trades = simulateTrades(candles, signals);
                trades.forEach(trade => {
                    tradeLog.innerHTML += `
                        <tr>
                            <td class="p-2">${new Date(trade.timestamp).toLocaleString()}</td>
                            <td class="p-2">${trade.signal}</td>
                            <td class="p-2">${trade.entryPrice.toFixed(2)}</td>
                            <td class="p-2">${trade.units}</td>
                            <td class="p-2">${trade.stopLoss.toFixed(2)}</td>
                            <td class="p-2">${trade.takeProfit.toFixed(2)}</td>
                            <td class="p-2">$${trade.profitLoss.toFixed(2)}</td>
                        </tr>
                    `;
                });
            } catch (error) {
                console.error('Error during auto-trading:', error);
            }
        }, 5 * 60 * 1000); // Every 5 minutes
        document.getElementById('stop-trading').addEventListener('click', () => {
            clearInterval(interval);
            tradeLog.innerHTML += `<tr><td class="p-2">${new Date().toLocaleString()}</td><td class="p-2" colspan="6">Trading stopped.</td></tr>`;
        }, { once: true });
    });
}
