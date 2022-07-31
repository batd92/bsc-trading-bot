const ethers = require('ethers');
const CFG = require("../../config");


class ContractOut {
    async init(account, token_output = CFG.Tokens.TokenSwap) {
        this.account = account;
        this.token_output = token_output;
        this.contract_out = new ethers.Contract(
            token_output,
            [
                { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "payable": false, "type": "function" },
                { "constant": false, "inputs": [{ "name": "guy", "type": "address" }, { "name": "wad", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "approved", "type": "bool" }], "payable": false, "type": "function" },
                { "constant": true, "inputs": [{ "name": "sender", "type": "address" }, { "name": "guy", "type": "address" }], "name": "allowance", "outputs": [{ "name": "allowed", "type": "uint256" }], "payable": false, "type": "function" },
                { "constant": true, "inputs": [], "name": "symbol", "outputs": [{ "name": "outname", "type": "string" }], "payable": false, "type": "function" },
                { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" },
                { "inputs": [{ "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }
            ],
            account // Pass connected account to purchase smart contract
        );
    }

    /**
     * Get contract out
     */
    async _getContractOut() {
        return this.contract_out;
    }

    /**
     * Get balance
     */
    async _getBalance() {
        const raw = await this.contract_out.balanceOf(this.account.address);
        return {
            outputAmount: ethers.utils.formatEther(raw),
            raw
        }
    }

    /**
     * Get contract decimals, symbol
     */
    async getDecimalsAndSymbol() {
        try {
            const symbol = await this.contract_out.symbol();
            const decimals = await this.contract_out.decimals();
            return { decimals, symbol };
        } catch (error) {
            
        }
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
            return await this.contract_out.approve(
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
        return await this.contract_out.balanceOf(pair);
    }
}

module.exports = new ContractOut();