const ethers = require('ethers');
const CFG = require("../../config");

class Router {
    async init(account) {
        this.account = account;
        this.router = new ethers.Contract(
            '0x10ED43C718714eb63d5aA57B78B54704E256024E',
            [
                'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
                'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
                'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
                'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable',
                'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external',
                'function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline) external  payable returns (uint[] memory amounts)'
            ],
            account // Pass connected account to pcs router
        );
        return this.router;
    }

    /**
     * Get AmountsOut
     * @param {*} inputTokenAmount 
     * @param {*} param
     * @returns 
     */
    async getAmountsOut(inputTokenAmount, [from, to]) {
        return await this.router.getAmountsOut(inputTokenAmount, [from, to]);
    }

    /**
     * Get Router
     * @returns 
     */
    getRouter() {
        return this.router;
    }

   /**
    * Buy token
    * @param {*} amountIn 
    * @param {*} amountOutMin 
    * @param {*} contracts 
    * @param {*} nonce 
    * @returns 
    */
    async swapExactETHForTokensSupportingFeeOnTransferTokens(amountIn, amountOutMin, contracts, nonce) {
        try {
			return this.router.swapExactETHForTokensSupportingFeeOnTransferTokens(
				amountOutMin,
				contracts,
				this.account.address,
				(Date.now() + 1000 * 60 * 10),
				{
					'value': amountIn,
                    'gasLimit': CFG.CustomStrategyBuy.GAS_LIMIT,
                    'gasPrice': CFG.CustomStrategyBuy.GAS_PRICE,
					'nonce': nonce
				}
			);

		} catch (e) {
			console.log(`[error::swap] ${e.error}`);
			process.exit();
		}
    }

    /**
     * Sell token
     * @param {*} sellAmount 
     * @param {*} amountOutMin 
     * @param {*} contracts 
     * @returns 
     */
    async swapExactTokensForETHSupportingFeeOnTransferTokens(sellAmount, amountOutMin, contracts) {
        try {
            return this.router.swapExactTokensForETHSupportingFeeOnTransferTokens(
                sellAmount,   // The amount of input tokens to send.
                amountOutMin, // The minimum amount of output tokens that must be received for the transaction not to revert.
                contracts,    // An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
                CFG.Environment.MY_ADDRESS, // Recipient of the ETH.
                Math.floor(Date.now() / 1000) + 60 * 20, // (Date.now() + 1000 * 60 * 10)
                {
                    'gasLimit': CFG.CustomStrategySell.GAS_LIMIT,
                    'gasPrice': CFG.CustomStrategySell.GAS_PRICE
                }
            );
        } catch (error) {
            console.log('swapExactTokensForETHSupportingFeeOnTransferTokens: ', error);
        }
    }

    /**
     * Get estimate
     * @param {*} amountIn 
     * @param {*} amountOutMin 
     * @param {*} contracts 
     * @returns 
     */
    async estimateTransaction(amountIn, amountOutMin, contracts) {
        try {
			let gas = await this.router.estimateGas.swapExactETHForTokensSupportingFeeOnTransferTokens(
				amountOutMin,
				contracts,
				this.account.address,
				(Date.now() + 1000 * 60 * 10),
				{
					'value': amountIn,
					'gasLimit': CFG.CustomStrategyBuy.GAS_LIMIT,
					'gasPrice': CFG.CustomStrategyBuy.GAS_PRICE
				}
			);

			// TODO: Check (fee gas + fee buy) <= money in wallet => gas increase
			// Check if is using enough gas.
			if (gas > parseInt(CFG.CustomStrategyBuy.GAS_LIMIT)) {
				msg.error(`[error::simulate] The transaction requires at least ${gas} gas, your limit is ${CFG.CustomStrategyBuy.GAS_LIMIT}.`);
				process.exit();
			}
			return gas;
		} catch (e) {
			// TODO: Check (fee gas + fee buy) <= money in wallet => gas increase
			console.log(`[error::estimate_gas] ${e}`);
			//return this.estimateTransaction(amountIn, amountOutMin, contracts);
			process.exit();
		}
    }
}

module.exports = new Router();