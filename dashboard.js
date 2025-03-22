// frontend/src/scripts/dashboard.js
document.addEventListener('DOMContentLoaded', () => {
    const chart = LightweightCharts.createChart(document.getElementById('chart-container'), {
        width: 800,
        height: 400,
        layout: { backgroundColor: '#0B1A2F', textColor: '#E0E7E9' },
        timeScale: { timeVisible: true }
    });
    const candleSeries = chart.addCandlestickSeries({
        upColor: '#00C4B4',
        downColor: '#FF6F61',
        borderUpColor: '#00C4B4',
        borderDownColor: '#FF6F61',
        wickUpColor: '#00C4B4',
        wickDownColor: '#FF6F61',
    });

    // Function to fetch real-time data and update the chart
    const pollRealTimeData = async () => {
        try {
            const response = await fetch('https://trading-platform-backend-vert.vercel.app/api/realtime?instrument=MNQ');
            const trade = await response.json();
            const newCandle = {
                time: Math.floor(new Date(trade.timestamp).getTime() / 1000),
                open: trade.price,
                high: trade.price,
                low: trade.price,
                close: trade.price
            };
            candleSeries.update(newCandle);
        } catch (error) {
            console.error('Error fetching real-time data:', error);
        }
    };

    // Poll every 5 seconds
    setInterval(pollRealTimeData, 5000);
});
