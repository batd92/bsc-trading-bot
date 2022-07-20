const ethers = require('ethers');
const CFG = require("../../config");

class ContractIn {
    async init(account, token_in = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c') {
        this.account = account;
        this.token_in = token_in;
        this.contract_in = new ethers.Contract(
            token_in,
            [
                { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "payable": false, "type": "function" },
                { "constant": false, "inputs": [{ "name": "guy", "type": "address" }, { "name": "wad", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "approved", "type": "bool" }], "payable": false, "type": "function" },
                { "constant": true, "inputs": [{ "name": "sender", "type": "address" }, { "name": "guy", "type": "address" }], "name": "allowance", "outputs": [{ "name": "allowed", "type": "uint256" }], "payable": false, "type": "function" },
                { "constant": true, "inputs": [], "name": "symbol", "outputs": [{ "name": "outname", "type": "string" }], "payable": false, "type": "function" },
                { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" },
                { "inputs": [{ "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }
            ],
            account //Pass connected account to purchase smart contract
        );
    }

    /**
     * Get balance
     */
    async _getBalance() {
        return ethers.utils.formatEther(await this.contract_in.balanceOf(this.account.address));
    }

    /**
     * Get contract in
     */
    async _getContractIn() {
        return this.contract_in;
    }

    /**
     * Get contract decimals, symbol
     */
    async getDecimalsAndSymbol() {
        const symbol = await this.contract_in.symbol();
        const decimals = await this.contract_in.decimals();
        return { symbol, decimals };
    }

    /**
     * Approve
     * @param {*} nonce 
     * @param {*} router 
     * @param {*} maxInt 
     * @returns 
     */
    async approve(nonce, router, maxInt) {
        try {
            return await this.contract_in.approve(
                router.address,
                maxInt,
                {
                    'gasLimit': CFG.Environment.SYS_GAS_LIMIT_APPROVE,
                    'gasPrice': CFG.Environment.SYS_GAS_PRICE_APPROVE,
                    'nonce': (nonce)
                }
            );
        } catch (error) {
            console.log('Lỗi Approve: ', error);
        }
    }

    /**
     * getLiquidity
     * @param {*} pair 
     * @returns 
     */
    async getLiquidity(pair) {
        return await this.contract_in.balanceOf(pair);
    }
}

module.exports = new ContractIn();