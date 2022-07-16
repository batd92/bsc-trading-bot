const ethers = require('ethers');

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
        return this.contract_in;
    }

    /**
     * Get balance
     */
         async _getBalance() {
            return parseInt(await this.contract_in.balanceOf(this.account.address));
        }
}

module.exports = new ContractIn();