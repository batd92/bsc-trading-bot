/*=================================================*/
/*                                                 */
/*              Written By TàoBa.                  */
/*                                                 */
/*=================================================*/

const msg = require('../classes/msg.js');
const cache = require('../classes/cache.js');
const ethers = require('ethers');
const CFG = require("../../config");

class Network {
	/**
	 * constructor
	 * @param {*} account 
	 * @param {*} factory 
	 * @param {*} router 
	 * @param {*} contract_in 
	 * @param {*} contract_out 
	 */
	constructor(payload) {
		const { account, factory, router, contract_in, contract_out } = payload;
		this.account = account;
		this.factory = factory;
		this.router = router;
		this.contract_in = contract_in;
		this.contract_out = contract_out;
	}

	async prepare() {
		try {
			msg.primary(`[debug::network] Preparing network..`);
			// Format maxInt.
			const maxInt = (ethers.BigNumber.from("2").pow(ethers.BigNumber.from("256").sub(ethers.BigNumber.from("1")))).toString();
			const { decimalsOut, symbolOut } = await this.contract_out.getDecimalsAndSymbol();
			const { decimals, symbol } = await this.contract_in.getDecimalsAndSymbol();
			
			// Cache & prepare contracts
			if (!cache.isAddressCached(CFG.Tokens.BNB)) {
				cache.setAddressArtifacts(CFG.Tokens.BNB, decimals, symbol);
				msg.primary(`[debug::network] Approving balance for ${symbol}.`);

				// Approve output (for later)
				const inTx = await this.contract_in.approve(this.getNonce(), this.router.getRouter(), maxInt);
				let inReceipt = await inTx.wait();

				if (!inReceipt.logs[0].transactionHash) {
					msg.error(`[error::network] Could not approve ${symbol}. (cache)`);
					process.exit();
				}

				msg.success(`[debug::network] ${symbol} has been approved. (cache)`);
				cache.setApproved(CFG.Tokens.BNB);
				await cache.save();

			} else {
				msg.success(`[debug::network] ${symbol} has already been approved. (cache)`);
			}

			// Cache & prepare contracts
			if (!cache.isAddressCached(CFG.Tokens.TokenSwap)) {
				cache.setAddressArtifacts(CFG.Tokens.TokenSwap, decimalsOut, symbolOut);
				msg.primary(`[debug::network] Approving balance for ${symbolOut}.`);

				// Approve output (for later)
				const outTx = await this.contract_out.approve(this.getNonce(), this.router.getRouter(), maxInt);

				let outReceipt = await outTx.wait();

				if (!outReceipt.logs[0].transactionHash) {
					msg.error(`[error::network] Could not approve ${symbolOut}. (cache)`);
					process.exit();
				}

				msg.success(`[debug::network] ${symbolOut} has been approved. (cache)`);
				cache.setApproved(CFG.Tokens.TokenSwap);
				await cache.save();

			} else {
				msg.success(`[debug::network] ${symbolOut} has already been approved. (cache)`);
			}

			// Now that the cache is done, restructure variables
			CFG.CustomStrategyBuy.InvestmentAmount = ethers.utils.parseUnits((CFG.CustomStrategyBuy.InvestmentAmount).toString(), decimals);
			return true;
		} catch (error) {
			console.log('Approve error: ', error);
		}
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
					'gasLimit': CFG.CustomStrategyBuy.GAS_LIMIT,
					'gasPrice': CFG.CustomStrategyBuy.GAS_PRICE,
					'nonce': (this.getNonce())
				}
			);

		} catch (e) {
			console.log(`[error::swap] ${e.error}`);
			process.exit();
		}
	}

	/**
	 * Estimate transaction Buy
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
			return true;
		} catch (e) {
			// TODO: Check (fee gas + fee buy) <= money in wallet => gas increase
			console.log(`[error::estimate_gas] ${e}`);
			//return this.estimateTransaction(amountIn, amountOutMin, contracts);
			process.exit();
		}
	}

	/**
	 * Buy Token
	 * @param {*} from 
	 * @param {*} to 
	 * @returns 
	 */
	async transactToken(from, to) {
		msg.success(`[debug::transact] ✔ Buy ... \n`);
		try {
			let inputTokenAmount = CFG.CustomStrategyBuy.InvestmentAmount;
			// Get output amounts
			let amounts = await this.router.getAmountsOut(inputTokenAmount, [from, to]);
			// Calculate min output with current slippage in bnb
			let amountOutMin = amounts[1].sub(amounts[1].div(100).mul(CFG.CustomStrategyBuy.BUY_SLIPPAGE));
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
			msg.success(`[debug::transact] ✔ Buy done. \n`);

			let receipt = await tx.wait();

			// get current ballance from output contract.
			let currentOutBalance = await this.contract_out._getBalance(this.account);

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

	/**
	 * Get nonce
	 * @returns 
	 */
	getNonce() {
		return this.account.getNonce();
	}

	/**
	 * Sell Token
	 * @param {*} from 
	 * @param {*} to 
	 * @returns 
	 */
	async transactFromTokenToBNB(from, to) {
		msg.primary('✔ Sell ... ');
		try {
			const isProfit = true;
			const output_balance = await this.contract_out._getBalance(await this.account._getAccount());
			if (output_balance === CFG.CustomStrategySell.MIN_AMOUNT)  return;
			// Get the amount of tokens in the wallet your
			let balanceString;
			const { decimals } = await this.contract_out.getDecimalsAndSymbol();;

			// Convert amount and calculate selling profit or loss
			const convertBalance = (balance, decimals, percentToSell) => {
				return (parseFloat(ethers.utils.formatUnits(balance.toString(), decimals)) * (percentToSell / 100)).toFixed(decimals).toString()
			}
			if (isProfit) {
				balanceString = convertBalance(output_balance, decimals, CFG.CustomStrategySell.percentOfTokensToSellProfit);
			} else {
				balanceString = convertBalance(output_balance, decimals, CFG.CustomStrategySell.percentOfTokensToSellLoss);
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
			msg.success(`[debug::transact] ✔ Sell done. \n`);

			const receipt = await tx.wait();

			// Get current ballance from output contract.
			const currentOutBalance = await this.contract_out._getBalance(await this.account._getAccount());

			this.amount_sell_unformatted = ethers.utils.formatUnits(`${(currentOutBalance - this.output_balance)}`, cache.tokens[CFG.Tokens.TokenSwap].decimals);
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
				CFG.Environment.MY_ADDRESS, // Recipient of the ETH.
				Math.floor(Date.now() / 1000) + 60 * 20, // (Date.now() + 1000 * 60 * 10)
				{
					'gasLimit': CFG.CustomStrategySell.GAS_LIMIT,
					'gasPrice': CFG.CustomStrategySell.GAS_PRICE
				}
			);
		} catch (error) {
			console.log(`[error::swap] ${e.error}`);
			process.exit();
		}
	}
}

module.exports = {
	Network
}