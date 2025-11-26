const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/portfolio';

async function testTrading() {
    console.log('🧪 Testing Portfolio Trading System...\n');

    try {
        // Reset portfolio with ₹10,000
        console.log('1. Resetting portfolio with ₹10,000...');
        const resetResponse = await axios.post(`${BASE_URL}/reset-with-capital`, {
            capital: 10000
        });
        console.log('✅', resetResponse.data.message, '\n');

        // Make sample trades
        const sampleTrades = [
            { symbol: 'SBIN.NS', action: 'BUY', quantity: 5, price: 650 },
            { symbol: 'TCS.NS', action: 'BUY', quantity: 1, price: 3450 },
            { symbol: 'RELIANCE.NS', action: 'BUY', quantity: 1, price: 2450 },
            { symbol: 'INFY.NS', action: 'BUY', quantity: 2, price: 1650 }
        ];

        console.log('2. Executing sample trades...');
        for (const trade of sampleTrades) {
            const tradeResponse = await axios.post(`${BASE_URL}/trade`, trade);
            if (tradeResponse.data.success) {
                console.log('✅', tradeResponse.data.message);
            } else {
                console.log('❌', tradeResponse.data.error);
            }
            await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        }
        console.log('');

        // Check final portfolio
        console.log('3. Checking final portfolio...');
        const portfolioResponse = await axios.get(BASE_URL);
        if (portfolioResponse.data.success) {
            const portfolio = portfolioResponse.data.data;
            console.log('   Portfolio Summary:');
            console.log(`   Portfolio Value: ₹${portfolio.portfolioValue.toFixed(2)}`);
            console.log(`   Available Cash: ₹${portfolio.availableCash.toFixed(2)}`);
            console.log(`   Total Invested: ₹${portfolio.totalInvested.toFixed(2)}`);
            console.log(`   Total P&L: ₹${portfolio.totalPnl.toFixed(2)} (${portfolio.totalPnlPercent.toFixed(2)}%)`);
            console.log(`   Active Positions: ${portfolio.positions.length}`);
            console.log(`   Total Trades: ${portfolio.totalTrades}`);
        }

        // Check performance
        console.log('\n4. Performance Metrics:');
        const performance = portfolioResponse.data.data.performance;
        console.log(`   Total Return: ${performance.totalReturn.toFixed(2)}%`);
        console.log(`   Sharpe Ratio: ${performance.sharpeRatio.toFixed(2)}`);
        console.log(`   Win Rate: ${performance.winRate.toFixed(1)}%`);
        console.log(`   Max Drawdown: ${performance.maxDrawdown.toFixed(1)}%`);

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

// Run the test
testTrading();