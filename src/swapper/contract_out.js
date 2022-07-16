const ethers = require('ethers');
const CFG = require("../../config");


class ContractOut {
    async init(account, token_output = CFG.contracts.output) {
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
            account //Pass connected account to purchase smart contract
        );
        return this.contract_out;
    }

    /**
     * Get balance
     */
    async _getBalance() {
        return parseInt(await this.contract_out.balanceOf(this.account.address));
    }
}

module.exports = new ContractOut();