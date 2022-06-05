/*=================================================*/
/*                                                 */
/*              Written By TàoBa.                  */
/*                                                 */
/*=================================================*/

const ethers = require('ethers');
const msg = require('./msg.js');
const cache = require('./cache.js');
const _gas_limit = [];

class Network {
	async load(config) {
		this.config = config.cfg;
		try {
			if (!this.config.wallet.is_wss) {
				// initialize stuff
				this.node = new ethers.providers.WebSocketProvider(this.config.wallet.wss_node);
			} else {
				// initialize stuff
				this.node = new ethers.providers.JsonRpcProvider(this.config.wallet.https_node);
			}
			// initialize account
			this.wallet = new ethers.Wallet.fromMnemonic(this.config.wallet.secret_key);
			this.account = this.wallet.connect(this.node);
			
			// get network id for later use
			this.network = await this.node.getNetwork();

			// pcs stuff for later use
			this.factory = new ethers.Contract(
				'0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
				[
					'event PairCreated(address indexed token0, address indexed token1, address pair, uint)',
					'function getPair(address tokenA, address tokenB) external view returns (address pair)'
				],
				this.account // pass connected account to pcs factory
			);

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
				this.account // Pass connected account to pcs router
			);

			this.contract_in = new ethers.Contract(
				this.config.contracts.input,
				[
					{ "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "payable": false, "type": "function" },
					{ "constant": false, "inputs": [{ "name": "guy", "type": "address" }, { "name": "wad", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "approved", "type": "bool" }], "payable": false, "type": "function" },
					{ "constant": true, "inputs": [{ "name": "sender", "type": "address" }, { "name": "guy", "type": "address" }], "name": "allowance", "outputs": [{ "name": "allowed", "type": "uint256" }], "payable": false, "type": "function" },
					{ "constant": true, "inputs": [], "name": "symbol", "outputs": [{ "name": "outname", "type": "string" }], "payable": false, "type": "function" },
					{ "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" },
					{ "inputs": [{ "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }
				],
				this.account // Pass connected account to bnb smart contract
			);

			this.contract_out = new ethers.Contract(
				this.config.contracts.output,
				[
					{ "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "payable": false, "type": "function" },
					{ "constant": false, "inputs": [{ "name": "guy", "type": "address" }, { "name": "wad", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "approved", "type": "bool" }], "payable": false, "type": "function" },
					{ "constant": true, "inputs": [{ "name": "sender", "type": "address" }, { "name": "guy", "type": "address" }], "name": "allowance", "outputs": [{ "name": "allowed", "type": "uint256" }], "payable": false, "type": "function" },
					{ "constant": true, "inputs": [], "name": "symbol", "outputs": [{ "name": "outname", "type": "string" }], "payable": false, "type": "function" },
					{ "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" },
					{ "inputs": [{ "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }
				],
				this.account //Pass connected account to purchase smart contract
			);

			// Load user balances (for later use)
			this.bnb_balance = parseInt(await this.account.getBalance());
			this.input_balance = parseInt((this.isETH(this.config.contracts.input) ? this.bnb_balance : await this.contract_in.balanceOf(this.account.address)));
			this.output_balance = parseInt((this.isETH(this.config.contracts.output) ? this.bnb_balance : await this.contract_out.balanceOf(this.account.address)));

			// Load some more variables
			this.base_nonce = parseInt(await this.node.getTransactionCount(this.account.address));

			this.nonce_offset = 0;
			this.first_block = -1;
		} catch (e) {
			msg.error(`[error::network] ${e}`);
			process.exit();
		}
	}

	async prepare() {

		msg.primary(`[debug::network] Preparing network..`);
		// Format maxInt.
		const maxInt = (ethers.BigNumber.from("2").pow(ethers.BigNumber.from("256").sub(ethers.BigNumber.from("1")))).toString();
		// Cache & prepare contracts
		if (!cache.isAddressCached(this.config.contracts.input)) {
			const symbol = await this.contract_in.symbol();
			const decimals = await this.contract_in.decimals();
			cache.setAddressArtifacts(this.config.contracts.input, decimals, symbol);
			msg.primary(`[debug::network] Approving balance for ${symbol}.`);

			// Approve output (for later)
			const inTx = await this.contract_in.approve(
				this.router.address,
				maxInt,
				{
					'gasLimit': this.config.transaction.gas_limit,
					'gasPrice': this.config.transaction.gas_price,
					'nonce': (this.getNonce())
				}
			);
			let inReceipt = await inTx.wait();

			if (!inReceipt.logs[0].transactionHash) {
				msg.error(`[error::network] Could not approve ${symbol}. (cache)`);
				process.exit();
			}

			msg.success(`[debug::network] ${symbol} has been approved. (cache)`);
			cache.setApproved(this.config.contracts.input);
			await cache.save();

		} else {
			const token = cache.getInfoTokenFormCache(this.config.contracts.input);
			msg.success(`[debug::network] ${(token ? token.symbol : await this.contract_in.symbol())} has already been approved. (cache)`);
		}

		// Cache & prepare contracts
		if (!cache.isAddressCached(this.config.contracts.output)) {
			const symbolOut = await this.contract_out.symbol();
			const decimalsOut = await this.contract_out.decimals();
			cache.setAddressArtifacts(this.config.contracts.output, decimalsOut, symbolOut);
			msg.primary(`[debug::network] Approving balance for ${symbolOut}.`);

			// // Approve output (for later)
			const outTx = await this.contract_out.approve(
				this.router.address,
				maxInt,
				{
					'gasLimit': this.config.transaction.gas_limit,
					'gasPrice': this.config.transaction.gas_price,
					'nonce': (this.getNonce())
				}
			);

			let outReceipt = await outTx.wait();

			if (!outReceipt.logs[0].transactionHash) {
				msg.error(`[error::network] Could not approve ${symbolOut}. (cache)`);
				process.exit();
			}

			msg.success(`[debug::network] ${symbolOut} has been approved. (cache)`);
			cache.setApproved(this.config.contracts.output);
			await cache.save();

		} else {
			const token = cache.getInfoTokenFormCache(this.config.contracts.output);
			msg.success(`[debug::network] ${(token ? token.symbol : await this.contract_out.symbol())} has already been approved. (cache)`);
		}

		// Now that the cache is done, restructure variables
		this.config.transaction.investmentAmount = ethers.utils.parseUnits((this.config.transaction.investmentAmount).toString(), await this.contract_in.decimals());
	}

	// Wrapper function for swapping
	async swapFromTokenToToken(amountIn, amountOutMin, contracts) {
		try {
			return this.router.swapExactETHForTokensSupportingFeeOnTransferTokens(
				amountOutMin,
				contracts,
				this.account.address,
				(Date.now() + 1000 * 60 * 10),
				{
					'value': amountIn,
					'gasLimit': this.config.transaction.gas_limit,
					'gasPrice': this.config.transaction.gas_price,
					'nonce': (this.getNonce())
				}
			);

		} catch (e) {
			console.log(`[error::swap] ${e.error}`);
			process.exit();
		}
	}

	async estimateTransaction(amountIn, amountOutMin, contracts) {
		try {
			let gas = await this.router.estimateGas.swapExactETHForTokensSupportingFeeOnTransferTokens(
				amountOutMin,
				contracts,
				this.account.address,
				(Date.now() + 1000 * 60 * 10),
				{
					'value': amountIn,
					'gasLimit': this.config.transaction.gas_limit,
					'gasPrice': this.config.transaction.gas_price
				}
			);

			// Check if is using enough gas.
			if (gas > parseInt(this.config.transaction.gas_limit)) {
				msg.error(`[error::simulate] The transaction requires at least ${gas} gas, your limit is ${this.config.transactiontransaction.gas_limit}.`);
				process.exit();
			}
			return true;
		} catch (e) {
			// => Xử lí ở đây để tăng fee gas
			console.log(`[error::estimate_gas] ${e}`);
			//return this.estimateTransaction(amountIn, amountOutMin, contracts);
			process.exit();
		}
	}

	async transactToken(from, to) {
		try {
			let inputTokenAmount = this.config.transaction.investmentAmount;
			// Get output amounts
			let amounts = await this.router.getAmountsOut(inputTokenAmount, [from, to]);
			// Calculate min output with current slippage in bnb
			let amountOutMin = amounts[1].sub(amounts[1].div(100).mul(this.config.transaction.buy_slippage));
			// Simulate transaction to verify outputs.
			let estimationPassed = await this.estimateTransaction(inputTokenAmount, amountOutMin, [from, to]);

			// If simulation passed, notify, else, exit
			if (estimationPassed) {
				msg.success(`[debug::transact] Estimation passed successfully. proceeding with transaction.`);
			} else {
				msg.error(`[error::transact] Estimation did not pass checks. exiting..`);
				process.exit();
			}

			let tx = await this.swapFromTokenToToken(
				inputTokenAmount,
				amountOutMin,
				[from, to]
			);

			msg.success(`[debug::transact] TX has been submitted. Waiting for response..\n`);

			let receipt = await tx.wait();

			// get current ballance from output contract.
			let currentOutBalance = await this.contract_out.balanceOf(this.account.address);

			this.amount_bought_unformatted = ethers.utils.formatUnits(`${(currentOutBalance - this.output_balance)}`, cache.tokens[contracts.output].decimals);
			return receipt;

		} catch (err) {
			if (err.error && err.error.message) {
				msg.error(`[error::transact] ${err.error.message}`);
			} else
				console.log(err);
			return this.transactToken(from, to);
		}
	}

	isETH(token) {
		return (token.toLowerCase() === ('0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c').toLowerCase());
	}

	async getLiquidity(pair) {
		const bnbValue = await this.contract_in.balanceOf(pair);
		const formattedbnbValue = await ethers.utils.formatEther(bnbValue);

		// Testing
		if (formattedbnbValue < 1) {
			msg.warning("[debug::liquidity] There is not enough liquidity yet.");
			return this.getLiquidity(pair);
		}

		return formattedbnbValue;
	}

	async getPair(contract_in, contract_out) {
		// Get pair address
		const pair = cache.getPairFromCache(contract_in, contract_out) || await this.factory.getPair(contract_in, contract_out);
		if (await this.isPairAddress(pair)) return pair;
		// Set pair address to cache
		cache.setPairAddress(`${contract_in}_${contract_out}`, pair);
		return pair;
	}

	async isPairAddress(pair) {
		// No pair found, re-launch
		if (!pair || (pair.toString().indexOf('0x0000000000000') > -1)) {
			msg.warning("[debug::pair] Could not find pair for specified contracts.");
			process.exit();
		}
		return true;
	}

	getNonce() {
		let nonce = (this.base_nonce + this.nonce_offset);
		this.nonce_offset++;
		return nonce;
	}

	async transactFromTokenToBNB(from, to) {
		// Check token in your wallet
		// if (this.output_balance === 0) {
		// 	msg.error(`[error::transact] The amount of tokens (${this.config.contracts.output}) in your wallet is Zero.`);
		// 	process.exit();
		// }
		try {
			const isProfit = true;
			const output_balance = await this.contract_out.balanceOf(this.config.contracts.output);
			// Get the amount of tokens in the wallet your
			let balanceString;
			const tokenOut = cache.getInfoTokenFormCache(this.config.contracts.output);
			const decimals = tokenOut.decimals || await this.contract_out.decimals();

			// Convert amount and calculate selling profit or loss
			const convertBalance = (balance, decimals, percentToSell) => {
				return (parseFloat(ethers.utils.formatUnits(balance.toString(), decimals)) * (percentToSell / 100)).toFixed(decimals).toString()
			}
			if (isProfit) {
				balanceString = convertBalance(output_balance, decimals, this.config.transaction.percentOfTokensToSellProfit);
			} else {
				balanceString = convertBalance(output_balance, decimals, this.config.transaction.percentOfTokensToSellLoss);
			}
			// Get balance to sell current
			const balanceToSell = ethers.utils.parseUnits(balanceString, decimals);
			// Get output amounts of token on pancake swap. Includes price current
			const sellAmount = await this.router.getAmountsOut(balanceToSell, [from, to]);

			// Calculate min output with current slippage in bnb
			const amountOutMin = sellAmount[1].sub(sellAmount[1].div(2));

			// Simulate transaction to verify outputs.
			const estimationPassed = await this.estimateTransaction(sellAmount[0].toString(), amountOutMin, [from, to]);

			// If simulation passed, notify, else, exit
			if (estimationPassed) {
				msg.success(`[debug::transact] Estimation passed successfully. proceeding with transaction.`);
			} else {
				msg.error(`[error::transact] Estimation did not pass checks. exiting..`);
				process.exit();
			}

			const tx = await this.sellTokenOnPancakeSwap(
				sellAmount[0].toString(),
				amountOutMin,
				[from, to]
			);

			msg.success(`[debug::transact] TX has been submitted. Waiting for response..\n`);

			const receipt = await tx.wait();

			// Get current ballance from output contract.
			const currentOutBalance = await this.contract_out.balanceOf(this.account.address);

			this.amount_sell_unformatted = ethers.utils.formatUnits(`${(currentOutBalance - this.output_balance)}`, cache.tokens[this.config.contracts.output].decimals);
			return receipt;

		} catch (err) {
			if (err.error && err.error.message) {
				msg.error(`[error::transact] ${err.error.message}`);
			} else
				console.log(err);
			return this.transactFromTokenToBNB(from, to);
		}
	}

	async sellTokenOnPancakeSwap(sellAmount, amountOutMin, contracts) {
		try {
			return this.router.swapExactTokensForETHSupportingFeeOnTransferTokens(
				sellAmount,   // The amount of input tokens to send.
				amountOutMin, // The minimum amount of output tokens that must be received for the transaction not to revert.
				contracts,    // An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
				this.config.wallet.myAddress, // Recipient of the ETH.
				Math.floor(Date.now() / 1000) + 60 * 20, // (Date.now() + 1000 * 60 * 10)
				{
					'gasLimit': this.config.transaction.gas_limit,
					'gasPrice': this.config.transaction.gas_price
				}
			);
		} catch (error) {
			console.log(`[error::swap] ${e.error}`);
			process.exit();
		}
	}
}

module.exports = new Network();