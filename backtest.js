document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('backtest-form');
    const chartContainer = document.getElementById('chart-container');
    const status = document.getElementById('status');
    let chart, candleSeries;

    // Initialize chart
    if (chartContainer) {
        chart = LightweightCharts.createChart(chartContainer, {
            width: chartContainer.clientWidth,
            height: 400,
            layout: { backgroundColor: '#0B1A2F', textColor: '#E0E7E9' },
            timeScale: { timeVisible: true }
        });
        candleSeries = chart.addCandlestickSeries({
            upColor: '#00C4B4',
            downColor: '#FF6F61',
            borderUpColor: '#00C4B4',
            borderDownColor: '#FF6F61',
            wickUpColor: '#00C4B4',
            wickDownColor: '#FF6F61',
        });
    } else {
        console.error('Chart container not found');
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const instrument = document.getElementById('instrument').value;
        const strategy = document.getElementById('strategy').value;
        const startDate = document.getElementById('start-date').value;

        if (!startDate) {
            status.textContent = 'Error: Please select a start date.';
            return;
        }
        if (startDate >= new Date().toISOString().split('T')[0]) {
            status.textContent = 'Error: Start date must be in the past.';
            return;
        }

        status.textContent = 'Running backtest...';
        try {
            const response = await fetch('https://trading-platform-backend-vert.vercel.app/api/backtest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instrument, strategy, startDate })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch data');
            }

            const { trades, netProfit, chartData } = await response.json();

            // Update UI
            status.textContent = 'Backtest completed!';
            document.getElementById('trades-executed').textContent = `Trades: ${trades.length}`;
            document.getElementById('profit-loss').textContent = `Profit: $${netProfit.toFixed(2)}`;

            // Update table
            const tableBody = document.getElementById('trade-indicators-body');
            tableBody.innerHTML = trades.map(trade => `
                <tr>
                    <td>${trade.timestamp}</td>
                    <td>${trade.signal}</td>
                    <td>${trade.entryPrice}</td>
                    <td>${trade.profitLoss.toFixed(2)}</td>
                </tr>
            `).join('');

            // Update chart
            if (candleSeries && chartData) {
                candleSeries.setData(chartData);
                chart.timeScale().fitContent();
            }
        } catch (error) {
            status.textContent = `Error: ${error.message}`;
            console.error('Fetch error:', error);
        }
    });
});
