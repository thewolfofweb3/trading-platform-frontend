// API base URL
const API_URL = 'https://trading-platform-backend-vert.vercel.app';

// Initialize the chart (for dashboard)
const chartContainer = document.getElementById('chart');
let chart, candleSeries, heatmapCanvas, ctx;
let isTrading = false;
let tradingInterval;

if (chartContainer) {
    chart = LightweightCharts.createChart(chartContainer, {
        width: chartContainer.clientWidth,
        height: 400,
        layout: {
            backgroundColor: '#0B1A2F', // Deep navy
            textColor: '#E0E7E9', // Soft off-white
        },
        grid: {
            vertLines: { color: '#2E3A3B' }, // Cool gray
            horzLines: { color: '#2E3A3B' }, // Cool gray
        },
        timeScale: {
            timeVisible: true,
            secondsVisible: false,
        },
    });

    candleSeries = chart.addCandlestickSeries({
        upColor: '#00C4B4', // Teal for bullish
        downColor: '#FF6F61', // Coral for bearish
        borderUpColor: '#00C4B4',
        borderDownColor: '#FF6F61',
        wickUpColor: '#00C4B4',
        wickDownColor: '#FF6F61',
    });

    // Initialize the heatmap
    heatmapCanvas = document.getElementById('heatmap');
    ctx = heatmapCanvas.getContext('2d');
    heatmapCanvas.width = heatmapCanvas.clientWidth;
    heatmapCanvas.height = 200;

    // Load initial chart data
    loadChartData(new Date(Date.now() - 50 * 5 * 60 * 1000).toISOString().split('T')[0]);
}

// Fetch and display candlestick data, Fibonacci levels, and session levels (for dashboard)
async function loadChartData(startDate) {
    try {
        const response = await fetch(`${API_URL}/api/candles?startDate=${startDate}`);
        const { candles, sessionHigh, sessionLow, fibLevels } = await response.json();
        if (!candles || candles.length === 0) {
            console.error('No candles received from /api/candles');
            return;
        }

        const chartData = candles.map(candle => ({
            time: Math.floor(new Date(candle.time).getTime() / 1000), // Convert to Unix timestamp in seconds
            open: parseFloat(candle.open),
            high: parseFloat(candle.high),
            low: parseFloat(candle.low),
            close: parseFloat(candle.close),
        }));
        candleSeries.setData(chartData);

        // Add session high and low lines
        if (sessionHigh) {
            chart.addLineSeries({ color: '#FF6F61', lineWidth: 1 }).setData([
                { time: chartData[0].time, value: sessionHigh },
                { time: chartData[chartData.length - 1].time, value: sessionHigh },
            ]);
        }
        if (sessionLow) {
            chart.addLineSeries({ color: '#00C4B4', lineWidth: 1 }).setData([
                { time: chartData[0].time, value: sessionLow },
                { time: chartData[chartData.length - 1].time, value: sessionLow },
            ]);
        }

        // Add Fibonacci levels
        if (fibLevels) {
            const fibSeries = [
                { level: fibLevels.fib_0, color: '#42A5F5' }, // Electric blue
                { level: fibLevels.fib_236, color: '#00C4B4' }, // Teal
                { level: fibLevels.fib_382, color: '#26A69A' }, // Muted teal
                { level: fibLevels.fib_500, color: '#FFCA28' }, // Golden yellow
                { level: fibLevels.fib_618, color: '#FF6F61' }, // Coral
                { level: fibLevels.fib_100, color: '#42A5F5' }, // Electric blue
            ];
            fibSeries.forEach(fib => {
                chart.addLineSeries({ color: fib.color, lineWidth: 1 }).setData([
                    { time: chartData[0].time, value: fib.level },
                    { time: chartData[chartData.length - 1].time, value: fib.level },
                ]);
            });
        }

        // Calculate heatmap data (simplified: volume and price direction)
        const heatmapData = candles.map(candle => ({
            price: parseFloat(candle.close),
            volume: parseInt(candle.volume),
            color: candle.isBullish ? 'rgba(0, 196, 180, 0.7)' : 'rgba(255, 111, 97, 0.7)', // Teal for buying, coral for selling
        }));

        // Draw heatmap
        const priceRange = Math.max(...heatmapData.map(d => d.price)) - Math.min(...heatmapData.map(d => d.price));
        const priceMin = Math.min(...heatmapData.map(d => d.price));
        const barWidth = heatmapCanvas.width / heatmapData.length;
        ctx.clearRect(0, 0, heatmapCanvas.width, heatmapCanvas.height);
        heatmapData.forEach((data, i) => {
            const x = i * barWidth;
            const y = ((data.price - priceMin) / priceRange) * (heatmapCanvas.height - 20);
            const intensity = Math.min(data.volume / 1000, 1); // Scale volume for intensity
            ctx.fillStyle = data.color;
            ctx.globalAlpha = intensity;
            ctx.fillRect(x, heatmapCanvas.height - y, barWidth, 5);
        });
        ctx.globalAlpha = 1.0;
    } catch (error) {
        console.error('Error loading chart data:', error);
    }
}

// Fetch trade signals for dashboard (single fetch)
if (document.getElementById('fetch-signals')) {
    document.getElementById('fetch-signals').addEventListener('click', async () => {
        const startDate = document.getElementById('start-date').value;
        if (!startDate) {
            alert('Please select a start date.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/start-trading?startDate=${startDate}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await response.json();
            const tradeLog = document.getElementById('trade-log');
            tradeLog.innerHTML += `<p>${new Date(result.timestamp).toLocaleString()}: ${result.message}${result.signal ? ' - Signal: ' + result.signal : ''}${result.units ? ' - Units: ' + result.units : ''}${result.stopLoss ? ' - Stop Loss: ' + result.stopLoss : ''}${result.takeProfit ? ' - Take Profit: ' + result.takeProfit : ''}</p>`;

            // Load chart data for visualization
            loadChartData(startDate);
        } catch (error) {
            console.error('Error fetching trade signals:', error);
        }
    });
}

// Start auto-trading (real-time loop)
if (document.getElementById('start-trading')) {
    document.getElementById('start-trading').addEventListener('click', async () => {
        if (isTrading) {
            alert('Trading is already running.');
            return;
        }

        isTrading = true;
        const tradeLog = document.getElementById('trade-log');
        tradeLog.innerHTML += `<p>${new Date().toLocaleString()}: Trading started.</p>`;

        tradingInterval = setInterval(async () => {
            try {
                const response = await fetch(`${API_URL}/api/start-trading`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const result = await response.json();
                tradeLog.innerHTML += `<p>${new Date(result.timestamp).toLocaleString()}: ${result.message}${result.signal ? ' - Signal: ' + result.signal : ''}${result.units ? ' - Units: ' + result.units : ''}${result.stopLoss ? ' - Stop Loss: ' + result.stopLoss : ''}${result.takeProfit ? ' - Take Profit: ' + result.takeProfit : ''}</p>`;
            } catch (error) {
                console.error('Error during auto-trading:', error);
                tradeLog.innerHTML += `<p>${new Date().toLocaleString()}: Error during trading: ${error.message}</p>`;
            }
        }, 5 * 60 * 1000); // Fetch every 5 minutes
    });
}

// Stop auto-trading
if (document.getElementById('stop-trading')) {
    document.getElementById('stop-trading').addEventListener('click', () => {
        if (!isTrading) {
            alert('Trading is not running.');
            return;
        }

        isTrading = false;
        clearInterval(tradingInterval);
        const tradeLog = document.getElementById('trade-log');
        tradeLog.innerHTML += `<p>${new Date().toLocaleString()}: Trading stopped.</p>`;
    });
}

// Backtesting logic
if (document.getElementById('backtest-form')) {
    document.getElementById('backtest-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const instrument = document.getElementById('instrument').value;
        const startDate = document.getElementById('start-date').value;
        if (!startDate) {
            alert('Please select a start date.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/backtest?instrument=${instrument}&startDate=${startDate}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await response.json();

            // Update backtest results
            document.getElementById('backtest-status').textContent = 'Backtest completed.';
            document.getElementById('status').textContent = 'Completed';
            document.getElementById('trades-executed').textContent = result.totalTrades || 0;
            document.getElementById('profit-loss').textContent = `$${result.netProfit || 0}`;

            // Display trade indicators
            const tradeIndicators = document.getElementById('trade-indicators');
            tradeIndicators.innerHTML = '';
            if (result.trades && result.trades.length > 0) {
                result.trades.forEach(trade => {
                    tradeIndicators.innerHTML += `<p>${new Date(trade.timestamp).toLocaleString()}: Signal: ${trade.signal} - Units: ${trade.units} - Stop Loss: ${trade.stopLoss} - Take Profit: ${trade.takeProfit} - Profit/Loss: $${trade.profitLoss}</p>`;
                });
            } else {
                tradeIndicators.innerHTML = '<p>No trades executed during this period.</p>';
            }
        } catch (error) {
            console.error('Error running backtest:', error);
            document.getElementById('backtest-status').textContent = 'Error running backtest.';
        }
    });
}

// Check status (for dashboard)
if (document.getElementById('account-balance')) {
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
}
