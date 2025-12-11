const crypto = require('crypto');
module.exports = class MerchantPlugin {
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

    async getPaymentDetails(data) {
        const code = data.code;
        const ticker = code === "USDTTRC20" ? "USDT" : "BNB";
        const network = ticker === "USDT" ? "TRC20" : "BEP20";

        const requestBody = {
            ticker,
            network,
            request: '/api/v4/main-account/address',
            nonce: Date.now()
        };

        const payload = Buffer.from(JSON.stringify(requestBody)).toString("base64");

        const signature = crypto
            .createHmac('sha512', this.config.secretKey)
            .update(payload)
            .digest('hex');

        const response = await fetch('https://whitebit.com/api/v4/main-account/address', {
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
        console.log(result);

        return {
            identifier: result.account.address,
            details: [{
                label: "To address",
                value: result.account.address
            }]
        }
    }

    webhookHandler(data) {
        let payload = data.payload;

        const headers = data.headers;

        // const payload = JSON.parse(
        //     Buffer.from(headers['X-TXC-PAYLOAD'], 'base64').toString('utf-8')
        // );

        // const signature = headers['X-TXC-SIGNATURE'];
        // const secret = this.config.secretKey;

        // const expected = crypto
        //     .createHmac('sha512', secret)
        //     .update(payload)
        //     .digest('hex');

        if (payload.method === 'deposit.canceled') {
            return {
                identifier: payload.params.address,
                amount: payload.params.amount,
                status: 'error_paid',
                confirmations: payload.params.confirmations
            }
        } else if (payload.method === 'deposit.updated') {
            return {
                identifier: payload.params.address,
                amount: payload.params.amount,
                status: 'processing',
                confirmations: payload.params.confirmations
            }
        } else if (payload.method === 'deposit.processed') {
            return {
                identifier: payload.params.address,
                amount: payload.params.amount,
                status: 'in_payout',
                confirmations: payload.params.confirmations
            }
        } else {
            throw new Error('Invalid webhook data');
        }
    }

    getVerificationData() {
        return [this.config.webhookKey];
    }
}
