const ethers = require('ethers');

class Factory {
    async init(account) {
        // pcs stuff for later use
        this.factory = new ethers.Contract(
            '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
            [
                'event PairCreated(address indexed token0, address indexed token1, address pair, uint)',
                'function getPair(address tokenA, address tokenB) external view returns (address pair)'
            ],
            account // pass connected account to pcs factory
        );
    }

    /**
     * Get Factory
     * @returns 
     */
    async _getFactory() {
        return this.factory;
    }

    /**
     * Get pair
     * @param {*} contract_in 
     * @param {*} contract_out 
     * @returns 
     */
    async getPair(contract_in, contract_out) {
        return this.factory.getPair(contract_in, contract_out)
    }
}

module.exports = new Factory();