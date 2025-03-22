// frontend/src/scripts/backtest.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('backtest-form');
    const chartContainer = document.getElementById('chart-container');
    let chart, candleSeries;

    // Initialize chart
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
    }

    // Connect to WebSocket for real-time data
    const ws = new WebSocket('ws://localhost:8080');
    ws.onopen = () => {
        console.log('Connected to backend WebSocket');
        const instrument = document.getElementById('instrument').value;
        ws.send(JSON.stringify({ instrument }));
    };
    ws.onmessage = (event) => {
        const trade = JSON.parse(event.data);
        console.log('Received real-time trade:', trade);
        const tableBody = document.getElementById('trade-indicators-body');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${trade.timestamp}</td>
            <td>Trade</td>
            <td>${trade.price}</td>
            <td>${trade.size}</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
        `;
        tableBody.prepend(row);
    };
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    ws.onclose = () => {
        console.log('Disconnected from backend WebSocket');
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const instrument = document.getElementById('instrument').value;
        const strategy = document.getElementById('strategy').value;
        const startDate = document.getElementById('start-date').value;
        const today = new Date().toISOString().split('T')[0];

        // Validate date
        if (!startDate) {
            document.getElementById('status').textContent = 'Error: Please select a start date.';
            return;
        }
        if (startDate >= today) {
            document.getElementById('status').textContent = 'Error: Please select a past date.';
            return;
        }

        document.getElementById('status').textContent = 'Running backtest...';
        try {
            console.log('Sending backtest request:', { instrument, strategy, startDate });
            const response = await fetch('https://trading-platform-backend-vert.vercel.app/api/backtest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instrument, strategy, startDate })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Backtest failed');
            }

            const result = await response.json();
            console.log('Backtest result:', result);

            // Update results
            document.getElementById('status').textContent = 'Backtest completed.';
            document.getElementById('trades-executed').textContent = `Trades Executed: ${result.trades.length}`;
            document.getElementById('profit-loss').textContent = `Profit/Loss: $${result.netProfit.toFixed(2)}`;

            // Populate table
            const tableBody = document.getElementById('trade-indicators-body');
            tableBody.innerHTML = '';
            if (result.trades.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7">No trades executed.</td></tr>';
            } else {
                result.trades.forEach(trade => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${trade.timestamp}</td>
                        <td>${trade.signal}</td>
                        <td>${trade.entryPrice}</td>
                        <td>${trade.units}</td>
                        <td>${trade.stopLoss}</td>
                        <td>${trade.takeProfit}</td>
                        <td>${trade.profitLoss >= 0 ? '+' : ''}${trade.profitLoss.toFixed(2)}</td>
                    `;
                    tableBody.appendChild(row);
                });
            }

            // Update chart
            if (candleSeries && result.chartData) {
                candleSeries.setData(result.chartData);
            }
        } catch (error) {
            document.getElementById('status').textContent = `Error: ${error.message}`;
            console.error('Backtest error:', error);
        }
    });
});
