// frontend/src/scripts/backtest.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('backtest-form');
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

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const instrument = document.getElementById('instrument').value;
        const strategy = document.getElementById('strategy').value;
        const startDate = document.getElementById('start-date').value;

        try {
            const response = await fetch('https://trading-platform-backend-vert.vercel.app/api/backtest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instrument, strategy, startDate })
            });
            const { trades, netProfit, chartData } = await response.json();

            // Update status and results
            document.getElementById('status').textContent = 'Backtest completed!';
            document.getElementById('trades-executed').textContent = `Trades Executed: ${trades.length}`;
            document.getElementById('profit-loss').textContent = `Net Profit: $${netProfit.toFixed(2)}`;

            // Update table
            const tableBody = document.getElementById('trade-indicators-body');
            tableBody.innerHTML = trades.map(trade => `
                <tr>
                    <td>${trade.timestamp}</td>
                    <td>${trade.signal}</td>
                    <td>${trade.entryPrice}</td>
                    <td>${trade.exitPrice}</td>
                    <td>${trade.profitLoss.toFixed(2)}</td>
                </tr>
            `).join('');

            // Update chart
            candleSeries.setData(chartData);
        } catch (error) {
            document.getElementById('status').textContent = `Error: ${error.message}`;
            console.error('Backtest error:', error);
        }
    });
});
