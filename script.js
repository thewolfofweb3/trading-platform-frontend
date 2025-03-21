// API base URL
const API_URL = 'https://trading-platform-backend-vert.vercel.app';

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

// Initialize the heatmap
const heatmapCanvas = document.getElementById('heatmap');
const ctx = heatmapCanvas.getContext('2d');
heatmapCanvas.width = heatmapCanvas.clientWidth;
heatmapCanvas.height = 200;

// Fetch and display candlestick data, Fibonacci levels, and session levels
async function loadChartData() {
    try {
        const response = await fetch(`${API_URL}/api/candles`);
        const { candles, sessionHigh, sessionLow, fibLevels } = await response.json();
        const chartData = candles.map(candle => ({
            time: new Date(candle.time).getTime() / 1000,
            open: parseFloat(candle.mid.o),
            high: parseFloat(candle.mid.h),
            low: parseFloat(candle.mid.l),
            close: parseFloat(candle.mid.c),
        }));
        candleSeries.setData(chartData);

        // Add session high and low lines
        if (sessionHigh) {
            chart.addLineSeries({ color: 'red', lineWidth: 1 }).setData([
                { time: chartData[0].time, value: sessionHigh },
                { time: chartData[chartData.length - 1].time, value: sessionHigh },
            ]);
        }
        if (sessionLow) {
            chart.addLineSeries({ color: 'green', lineWidth: 1 }).setData([
                { time: chartData[0].time, value: sessionLow },
                { time: chartData[chartData.length - 1].time, value: sessionLow },
            ]);
        }

        // Add Fibonacci levels
        if (fibLevels) {
            const fibSeries = [
                { level: fibLevels.fib_0, color: 'purple' },
                { level: fibLevels.fib_236, color: 'blue' },
                { level: fibLevels.fib_382, color: 'cyan' },
                { level: fibLevels.fib_500, color: 'yellow' },
                { level: fibLevels.fib_618, color: 'orange' },
                { level: fibLevels.fib_100, color: 'purple' },
            ];
            fibSeries.forEach(fib => {
                chart.addLineSeries({ color: fib.color, lineWidth: 1 }).setData([
                    { time: chartData[0].time, value: fib.level },
                    { time: chartData[chartData.length - 1].time, value: fib.level },
                ]);
            });
        }

        // Calculate heatmap data (simplified: volume and price direction)
        const heatmapData = candles.map(candle => {
            const volume = parseInt(candle.volume);
            const isBullish = candle.isBullish;
            return {
                price: parseFloat(candle.mid.c),
                volume: volume,
                color: isBullish ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)', // Green for buying, red for selling
            };
        });

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
