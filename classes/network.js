/*=================================================*/
/*                                                 */
/*              Written By TàoBa.                  */
/*                                                 */
/*=================================================*/

const ethers = require('ethers');
const msg = require('./msg.js');
const cache = require('./cache.js');
const _ = require("lodash");
const pancakeswapRouterAddress = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
const pancakeFactory = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73';

class Network {
	async load(config) {
		this.Environment = config.cfg.Environment;
		this.CustomStrategyBuy = config.cfg.CustomStrategyBuy;
		this.CustomStrategySell = config.cfg.CustomStrategySell;
		this.Tokens = config.cfg.Tokens;
		try {
			if (this.Environment.SYS_IS_WSS) {
				// initialize stuff
				this.node = new ethers.providers.WebSocketProvider(this.Environment.SYS_WSS_NODE);
			} else {
				// initialize stuff
				this.node = new ethers.providers.JsonRpcProvider(this.Environment.SYS_HTTPS_NODE);
			}
			// initialize account
			this.wallet = new ethers.Wallet.fromMnemonic(this.Environment.SYS_SECRET_KEY);
			this.account = this.wallet.connect(this.node);
			
			// get network id for later use
			this.network = await this.node.getNetwork();

			// pcs stuff for later use
			this.factory = new ethers.Contract(
				pancakeFactory,
				[
					'event PairCreated(address indexed token0, address indexed token1, address pair, uint)',
					'function getPair(address tokenA, address tokenB) external view returns (address pair)'
				],
				this.account // pass connected account to pcs factory
			);
			// Pancake router
			this.router = new ethers.Contract(
				pancakeswapRouterAddress,
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
			// BNB router
			this.contract_in = new ethers.Contract(
				this.Tokens.BNB,
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
				this.Tokens.TokenSwap,
				[
					{ "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "payable": false, "type": "function" },
					{ "constant": false, "inputs": [{ "name": "guy", "type": "address" }, { "name": "wad", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "approved", "type": "bool" }], "payable": false, "type": "function" },
					{ "constant": true, "inputs": [{ "name": "sender", "type": "address" }, { "name": "guy", "type": "address" }], "name": "allowance", "outputs": [{ "name": "allowed", "type": "uint256" }], "payable": false, "type": "function" },
					{ "constant": true, "inputs": [], "name": "symbol", "outputs": [{ "name": "outname", "type": "string" }], "payable": false, "type": "function" },
					{ "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" },
					{ "inputs": [{ "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }
				],
				this.account // Pass connected account to purchase smart contract
			);

			// Load user balances (for later use)
			// this.bnb_balance = parseInt(await this.account.getBalance());
			// this.input_balance = parseInt((this.isETH(this.Tokens.BNB) ? this.bnb_balance : await this.contract_in.balanceOf(this.account.address)));
			// this.output_balance = parseInt((this.isETH(this.Tokens.TokenSwap) ? this.bnb_balance : await this.contract_out.balanceOf(this.account.address)));
			
			// Format BigNumber
			this.bnb_balance = await this.account.getBalance();
			this.input_balance = this.isETH(this.Tokens.BNB) ? this.bnb_balance : await this.contract_in.balanceOf(this.account.address);
			this.output_balance = this.isETH(this.Tokens.TokenSwap) ? this.bnb_balance : await this.contract_out.balanceOf(this.account.address);

			// Load some more variables
			this.base_nonce = parseInt(await this.node.getTransactionCount(this.account.address));

			this.nonce_offset = 0;
			this.first_block = -1;
		} catch (e) {
			msg.error(`[error::network] ${e}`);
			process.exit();
		}
	}

	async getOutputBalance() {
		return (this.output_balance || await this.contract_out.balanceOf(this.account.address));
	}

	async prepare() {
		msg.primary(`[debug::network] Preparing network..`);
		// Format maxInt.
		const maxInt = (ethers.BigNumber.from("2").pow(ethers.BigNumber.from("256").sub(ethers.BigNumber.from("1")))).toString();
		// Cache & prepare contracts
		if (!cache.isAddressCached(this.Tokens.BNB)) {
			const symbol = await this.contract_in.symbol();
			const decimals = await this.contract_in.decimals();
			cache.setAddressArtifacts(this.Tokens.BNB, decimals, symbol, 0);
			msg.primary(`[debug::network] Approving balance for ${symbol}.`);

			// Approve output (for later)
			const inTx = await this.contract_in.approve(
				this.router.address,
				maxInt,
				{
					'gasLimit': this.Environment.SYS_GAS_LIMIT_APPROVE,
					'gasPrice': this.Environment.SYS_GAS_PRICE_APPROVE,
					'nonce': (this.getNonce())
				}
			);
			let inReceipt = await inTx.wait();

			if (!inReceipt.logs[0].transactionHash) {
				msg.error(`[error::network] Could not approve ${symbol}. (cache)`);
				process.exit();
			}

			msg.success(`[debug::network] ${symbol} has been approved. (cache)`);
			cache.setApproved(this.Tokens.BNB);
			await cache.save();

		} else {
			msg.success(`[debug::network] BNB has already been approved. (cache)`);
		}

		// Cache & prepare contracts
		if (!cache.isAddressCached(this.Tokens.TokenSwap)) {
			const symbolOut = await this.contract_out.symbol();
			const decimalsOut = await this.contract_out.decimals();
			cache.setAddressArtifacts(this.Tokens.TokenSwap, decimalsOut, symbolOut);
			msg.primary(`[debug::network] ✔ Approving balance for ${symbolOut}.`);

			// // Approve output (for later)
			const outTx = await this.contract_out.approve(
				this.router.address,
				maxInt,
				{
					'gasLimit': this.Environment.SYS_GAS_LIMIT_APPROVE,
					'gasPrice': this.Environment.SYS_GAS_PRICE_APPROVE,
					'nonce': (this.getNonce())
				}
			);

			let outReceipt = await outTx.wait();

			if (!outReceipt.logs[0].transactionHash) {
				msg.error(`[error::network] Could not approve ${symbolOut}. (cache)`);
				process.exit();
			}

			msg.success(`[debug::network] ✔ ${symbolOut} has been approved. (cache)`);
			cache.setApproved(this.Tokens.TokenSwap);
			await cache.save();

		} else {
			msg.success(`[debug::network] TokenSwap has already been approved. (cache)`);
		}

		// Now that the cache is done, restructure variables
		if (this.Environment.modeManual === '--sell-only') {
			this.CustomStrategySell.InvestmentAmount = ethers.utils.parseUnits((this.CustomStrategySell.InvestmentAmount).toString(), await this.contract_in.decimals());
		} else {
			this.CustomStrategyBuy.InvestmentAmount = ethers.utils.parseUnits((this.CustomStrategyBuy.InvestmentAmount).toString(), await this.contract_in.decimals());
		}
	}

	// Wrapper function for swapping => (buy)
	async swapFromTokenToToken(amountIn, amountOutMin, contracts) {
		try {
			return this.router.swapExactETHForTokensSupportingFeeOnTransferTokens(
				amountOutMin,
				contracts,
				this.account.address,
				(Date.now() + 1000 * 60 * 10),
				{
					'value': amountIn,
					'gasLimit': this.CustomStrategyBuy.GAS_LIMIT,
					'gasPrice': this.CustomStrategyBuy.GAS_PRICE,
					'nonce': (this.getNonce())
				}
			);

		} catch (e) {
			console.log(`[error::swap] ${e.error}`);
			process.exit();
		}
	}

	// Check est of transaction
	async estimateTransaction(amountIn, amountOutMin, contracts) {
		try {
			const gasLimit = this.Environment.modeManual === '--sell-only' ? this.CustomStrategySell.GAS_LIMIT  : this.CustomStrategyBuy.GAS_LIMIT;
			const gasPrice = this.Environment.modeManual === '--sell-only' ? this.CustomStrategySell.GAS_PRICE : this.CustomStrategyBuy.GAS_PRICE;
			let gas = await this.router.estimateGas.swapExactETHForTokensSupportingFeeOnTransferTokens(
				amountOutMin,
				contracts,
				this.account.address,
				(Date.now() + 1000 * 60 * 10),
				{
					'value': amountIn,
					'gasLimit': gasLimit,
					'gasPrice': gasPrice
				}
			);

			// TODO: Check (fee gas + fee buy) <= money in wallet => gas increase
			// Check if is using enough gas.
			if (gas > parseInt(gasLimit)) {
				msg.error(`[error::simulate] The transaction requires at least ${gas} gas, your limit is ${gasLimit}.`);
				process.exit();
			}
			return true;
		} catch (e) {
			// TODO: Check (fee gas + fee buy) <= money in wallet => gas increase
			console.log(`[error::estimate_gas] ${e}`);
			//return this.estimateTransaction(amountIn, amountOutMin, contracts);
			process.exit();
		}
	}

	// Buy token
	async transactToken(from, to) {
		msg.primary('✔ Buy ... ');
		try {
			let inputTokenAmount = this.CustomStrategyBuy.InvestmentAmount;
			// Get output amounts
			let amounts = await this.router.getAmountsOut(inputTokenAmount, [from, to]);
			// Calculate min output with current slippage in bnb
			let amountOutMin = amounts[1].sub(amounts[1].div(100).mul(this.CustomStrategyBuy.BUY_SLIPPAGE));
			// Simulate transaction to verify outputs.
			let estimationPassed = await this.estimateTransaction(inputTokenAmount, amountOutMin, [from, to]);

			// If simulation passed, notify, else, exit
			if (estimationPassed) {
				msg.success(`[debug::transact] Estimation passed successfully. Proceeding with transaction.`);
			} else {
				msg.error(`[error::transact] Estimation did not pass checks. exiting..`);
				process.exit();
			}

			let tx = await this.swapFromTokenToToken(
				inputTokenAmount,
				amountOutMin,
				[from, to]
			);

			msg.success(`[debug::transact] ✔ Buy done. \n`);
			if (this.Environment.isWaitingTx) {
				msg.success(`[debug::transact] TX has been submitted. Waiting for response..\n`);
				let receipt = await tx.wait();
				// get current ballance from output contract.
				let currentOutBalance = await this.contract_out.balanceOf(this.account.address);

				this.amount_bought_unformatted = ethers.utils.formatUnits(`${(currentOutBalance - this.output_balance)}`, 18); //18 or cache[this.Environment.MY_ADDRESS].tokens[this.Tokens.BNB].decimals);
				return receipt;

			}
			return undefined;

		} catch (err) {
			if (err.error && err.error.message) {
				msg.error(`[error::transact] ${err.error.message}`);
			} else
				console.log(err);
			// return this.transactToken(from, to);
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
		// Check liquidity
		if (parseInt(formattedbnbValue) < parseInt(this.CustomStrategyBuy.MIN_LIQUIDITY)) {
			msg.error(`[error::no2l-script] Liquidity of pool < Your liquidity.`);
			process.exit();
		}
		return formattedbnbValue;
	}

	async getPair(contract_in, contract_out) {
		// Get pair address
		const pair = cache.getPairFromCache(contract_in, contract_out) || await this.factory.getPair(contract_in, contract_out);
		if (await this.isPairAddress(pair)) {
			// Set pair address to cache
			cache.setPairAddress(`${contract_in}_${contract_out}`, pair);
			return pair;	
		}
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

	async transactTokenToBNB(from, to) {
		msg.primary('✔ Sell ... ');
		const output_balance = ethers.utils.formatEther(this.output_balance);
		// Check token in your wallet
		if (output_balance === 0) {
			msg.error(`[error::transact] The amount of tokens (${this.Tokens.TokenSwap}) in your wallet is Zero.`);
			process.exit();
		}
		// Calculate token need sell
		try {
			const isProfit = true;
			// Get the amount of tokens in the wallet your
			let balanceString;
			const tokenOut = cache.getInfoTokenFormCache(this.Tokens.TokenSwap);
			const decimals = tokenOut.decimals || await this.contract_out.decimals();

			// Convert amount and calculate selling profit or loss
			const convertBalance = (balance, decimals, percentToSell) => (parseFloat(balance) * (percentToSell / 100)).toFixed(decimals).toString();
			if (isProfit) {
				balanceString = convertBalance(output_balance, decimals, _.get(this.CustomStrategySell, ['percentOfTokensToSellProfit']));
			} else {
				balanceString = convertBalance(output_balance, decimals, _.get(this.CustomStrategySell, ['percentOfTokensToSellLoss']));
			}
			msg.primary(`[debug::transact] Total balance sell (${balanceString}) of token ${tokenOut.symbol || ''}..\n`);
			
			var roundedBalance = Math.floor(balanceString * 100) / 100;
			// Get balance to sell current
			const balanceToSell = ethers.utils.parseUnits(roundedBalance.toString(), decimals);
			// Get output amounts of token on pancake swap. Includes price current
			const sellAmount = await this.router.getAmountsOut(balanceToSell, [from, to]);
			// Calculate min output with current slippage in bnb
			const amountOutMin = 0;//sellAmount[1].sub(sellAmount[1].div(2));
			
			const tx = await this.sellTokenOnPancakeSwap(
				sellAmount[0].toString(),
				amountOutMin,
				[from, to]
			);
			msg.success(`[debug::transact] ✔ Sell done. \n`);
			if (this.Environment.isWaitingTx) {
				msg.success(`[debug::transact] TX has been submitted. Waiting for response..\n`);

				const receipt = await tx.wait();
	
				// Get current ballance from output contract.
				const currentOutBalance = await this.contract_out.balanceOf(this.account.address);
	
				this.amount_sell_unformatted = ethers.utils.formatUnits(`${(currentOutBalance - this.output_balance)}`, _.get(cache, [this.Environment.MY_ADDRESS, 'tokens', this.Tokens.TokenSwap, 'decimals']));
				return receipt;
			}
			return undefined;

		} catch (err) {
			if (err.error && err.error.message) {
				msg.error(`[error::transact] ${err.error.message}`);
			} else {
				console.log(err);
				//return this.transactFromTokenToBNB(from, to);
			}
		}
	}

	async sellTokenOnPancakeSwap(sellAmount, amountOutMin, contracts) {
		try {
			return this.router.swapExactTokensForETHSupportingFeeOnTransferTokens(
				sellAmount,   // The amount of input tokens to send.
				amountOutMin, // The minimum amount of output tokens that must be received for the transaction not to revert.
				contracts,    // An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
				this.Environment.MY_ADDRESS, // Recipient of the ETH.
				Math.floor(Date.now() / 1000) + 60 * 20, // (Date.now() + 1000 * 60 * 10)
				{
					'gasLimit': this.CustomStrategySell.GAS_LIMIT,
					'gasPrice': this.CustomStrategySell.GAS_PRICE,
				}
			);
		} catch (error) {
			console.log(`[error::swap] ${e.error}`);
			process.exit();
		}
	}
}

module.exports = new Network();