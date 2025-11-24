module.exports = class PayoutPlugin {
    constructor(config) {
        this.config = config;
        console.log(this.config);
        fetch('https://api.agify.io?name=michael').then(d => console.log(d)).catch(e => console.log('PROHIBITED'));
    }

    getFields(code) {}
    transfer() {}
    checkStatus() {}
}
