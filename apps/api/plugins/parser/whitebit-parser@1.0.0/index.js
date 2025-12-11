module.exports = class ParserPlugin {
    constructor(config) {
        this.config = config;
        this.supported = {
            BTC: ["USDT"]
        };
    }

    async updateRates() {
        const res = await fetch('https://whitebit.com/api/v4/public/ticker');
        const rates = await res.json();

        if (!rates) throw new Error('No rates.');

        const result = {};

        for (const [from, toList] of Object.entries(this.supported)) {
            for (const to of toList) {
                const keyValue = `${from}_${to}`;
                const outputKey = `${from}:${to}`;

                const entry = rates[keyValue];
                if (!entry) continue;

                const lastPrice = entry.last_price ?? entry.lastPrice;
                if (!lastPrice) continue;

                result[outputKey] = lastPrice;
            }   
        }
        return result;
    }
}
