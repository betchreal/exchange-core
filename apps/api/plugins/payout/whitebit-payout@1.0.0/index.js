const crypto = require('crypto');
module.exports = class PayoutPlugin {
    constructor(config) {
        this.config = config;
        this.currencies = ["USDTTRC20", "BNBBEP20"]
    }

    getFields(code) {
        const fields =[]
        switch (code) {
            case this.currencies[0]:
                fields.push({
                    id: "address",
                    label: "Address",
                    hint: "Enter USDT TRC20 Address",
                    validator: "^T[A-Za-z1-9]{33}$"
                });
                break;
            case this.currencies[1]:
                fields.push({
                    id: "address",
                    label: "Address",
                    hint: "Enter BNB BEP20 Address",
                    validator: "^0x[a-fA-F0-9]{40}$"
                });
                break;
            default:
                throw new Error("Not supported currency.");
        }
        return fields;
    }

    async transfer(data) {
        const code = data.code;
        if (!code) throw new Error('No code.');

        const amount = data.amount;
        if (!amount) throw new Error('No amount.');

        const values = data.args;
        if (!values) throw new Error('No values.');

        const { address } = values

        if (!address) throw new Error('Address is required.');
        const uniqueId = crypto.randomUUID();

        const ticker = code === this.currencies[0] ? "USDT" : "BNB";
        const network = ticker === "USDT" ? "TRC20" : "BEP20";

        const requestBody = {
            ticker,
            amount,
            address,
            uniqueId,
            network,
            request: '/api/v4/main-account/withdraw-pay',
            nonce: Date.now()
        };

        const payload = Buffer.from(JSON.stringify(requestBody)).toString("base64");

        const signature = crypto
            .createHmac('sha512', this.config.secretKey)
            .update(payload)
            .digest('hex');

        const response = await fetch('https://whitebit.com/api/v4/main-account/withdraw-pay', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-TXC-APIKEY': this.config.publicKey,
                'X-TXC-PAYLOAD': payload,
                'X-TXC-SIGNATURE': signature
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`WhiteBIT API Error: ${JSON.stringify(error)}`);
        }

        const result = await response.json();

        return uniqueId;
    }


    async checkStatus(uniqueId) {
         const getStatusText = (statusCode) => {
            const withdrawStatuses = {
                1: 'Pending', 2: 'Pending', 3: 'Successful', 4: 'Canceled',
                5: 'Unconfirmed by user', 6: 'Pending', 7: 'Successful',
                10: 'Pending', 11: 'Pending', 12: 'Pending', 13: 'Pending',
                14: 'Pending', 15: 'Pending', 16: 'Pending', 17: 'Pending',
                18: 'Partially successful', 21: 'Frozen'
            };

            return withdrawStatuses[statusCode] || 'Unknown';
        }
        
        const requestBody = {
            transactionMethod: "2",
            uniqueId,
            request: '/api/v4/main-account/history',
            nonce: Date.now()
        };

        const payload = Object.keys(requestBody)
            .sort()
            .map(key => requestBody[key])
            .join('');

        const signature = crypto
            .createHmac('sha512', this.config.secretKey)
            .update(payload)
            .digest('hex');

        const response = await fetch('https://whitebit.com/api/v4/main-account/history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-TXC-APIKEY': this.config.publicKey,
                'X-TXC-PAYLOAD': Buffer.from(JSON.stringify(requestBody)).toString('base64'),
                'X-TXC-SIGNATURE': signature
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        console.log(data);

        const transaction = data.records.find(tx => tx.uniqueId === uniqueId);

        if (!transaction) {
            return { status: 'not_found' };
        }

        return {
            status: getStatusText(transaction.status),
            amount: transaction.amount,
            fee: transaction.fee,
            ticker: transaction.ticker,
            address: transaction.address,
            transactionHash: transaction.transactionHash,
            transactionId: transaction.transactionId,
            createdAt: transaction.createdAt
        };
    }
}