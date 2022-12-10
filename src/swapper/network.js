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
	 * Constructor
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

	/**
	 * Approve
	 * @returns 
	 */
	async prepare() {
		try {
			msg.primary(`[debug::network] Preparing network..`);
			// Format maxInt.
			const maxInt = (ethers.BigNumber.from("2").pow(ethers.BigNumber.from("256").sub(ethers.BigNumber.from("1")))).toString();
			const out = await this.contract_out.getDecimalsAndSymbol();
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
				cache.setAddressArtifacts(CFG.Tokens.TokenSwap, out.decimals, out.symbol);
				msg.primary(`[debug::network] Approving balance for ${out.symbol}.`);

				// Approve output (for later)
				const outTx = await this.contract_out.approve(this.getNonce(), this.router.getRouter(), maxInt);

				let outReceipt = await outTx.wait();

				if (!outReceipt.logs[0].transactionHash) {
					msg.error(`[error::network] Could not approve ${out.symbol}. (cache)`);
					process.exit();
				}

				msg.success(`[debug::network] ${out.symbol} has been approved. (cache)`);
				cache.setApproved(CFG.Tokens.TokenSwap);
				await cache.save();

			} else {
				msg.success(`[debug::network] ${out.symbol} has already been approved. (cache)`);
			}
			return true;
		} catch (error) {
			console.log('Approve error: ', error);
		}
	}

	/**
	 * Wrapper function for swapping
	 * @param {*} amountIn 
	 * @param {*} amountOutMin 
	 * @param {*} contracts 
	 * @returns 
	 */
	async swapFromTokenToToken(amountIn, amountOutMin, contracts) {
		return this.router.swapExactETHForTokensSupportingFeeOnTransferTokens(amountIn, amountOutMin, contracts, this.getNonce());
	}

	/**
	 * Estimate transaction Buy
	 * @param {*} amountIn 
	 * @param {*} amountOutMin 
	 * @param {*} contracts 
	 * @returns 
	 */
	async estimateTransaction(amountIn, amountOutMin, contracts) {
		return await this.router.estimateTransaction(amountIn, amountOutMin, contracts);
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
			let inputTokenAmount = ethers.utils.parseUnits((CFG.CustomStrategyBuy.InvestmentAmount).toString(), this.decimalsIn);
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

			msg.success(`[debug::transact] ✔ Buy done.... \n`);
			if (CFG.Environment.isNotNeedTx) return;

			msg.success(`[debug::transact] TX has been submitted. Waiting for response..\n`);
			let receipt = await tx.wait();

			// get current ballance from output contract.
			let currentOutBalance = await this.contract_out._getBalance(this.account);

			this.amount_bought_unformatted = ethers.utils.formatUnits(`${(currentOutBalance - this.output_balance)}`, cache.tokens[contracts.output].decimals);
			return receipt;

		} catch (err) {
			await this.tryNonce();
			if (err.error && err.error.message) {
				msg.error(`[error::transact] ${err.error.message}`);
			} else
				console.log(err);
				return this.transactToken(from, to);
		}
	}

	/**
	 * Check address
	 * @param {*} token 
	 * @returns 
	 */
	isETH(token) {
		return (token.toLowerCase() === ('0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c').toLowerCase());
	}

	/**
	 * Check Liquidity
	 * @param {*} pair 
	 * @returns 
	 */
	async getLiquidity(pair) {
		const bnbValue = await this.contract_in.getLiquidity(pair);
		const formattedbnbValue = await ethers.utils.formatEther(bnbValue);

		// Testing
		if (formattedbnbValue < 1) {
			msg.warning("[debug::liquidity] There is not enough liquidity yet.");
			return this.getLiquidity(pair);
		}

		return formattedbnbValue;
	}

	/**
	 * get Price Token Output
	 * @param {*} pair 
	 * @returns 
	 */
	 async getPriceTokenOutput(pair) {
		const bnbValue = await this.contract_out.getLiquidity(pair);
		return await ethers.utils.formatEther(bnbValue);
	}

	/**
	 * Get pair
	 * @param {*} contract_in 
	 * @param {*} contract_out 
	 * @returns 
	 */
	async getPair(contract_in, contract_out, onlyApprove = false) {
		// Get pair address
		const pair = cache.getPairFromCache(contract_in, contract_out) || await this.factory.getPair(contract_in, contract_out);
		if (await this.isPairAddress(pair) && !onlyApprove) return pair;
		// Set pair address to cache
		cache.setPairAddress(`${contract_in}_${contract_out}`, pair);
		if (onlyApprove) cache.save();
		console.log('successful : ',  pair);
		return pair;
	}

	/**
	 * Check Pair
	 * @param {*} pair 
	 * @returns 
	 */
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
	 * Try set nonce
	 * @returns 
	 */
	async tryNonce() {
		await (this.account.tryNonce());
	}

	/**
	 * Sell Token
	 * @param {*} from 
	 * @param {*} to 
	 * @returns 
	 */
	async sellTokens(from, to, output_balance) {
		msg.primary('✔ Sell ... ');
		try {
			const isProfit = true;
			// const output_balance = await this.contract_out._getBalanceRaw();
			if (output_balance === CFG.CustomStrategySell.MIN_AMOUNT)  return;
			// Get the amount of tokens in the wallet your
			let balanceString;
			const decimals = 18; // await this.contract_out.getDecimalsAndSymbol();
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
			const amountOutMin = 0;//sellAmount[1].sub(sellAmount[1].div(2));

			const tx = await this.sellTokenOnPancakeSwap(
				sellAmount[0].toString(),
				amountOutMin,
				[from, to]
			);
			msg.success(`[debug::transact] ✔ Sell done...... \n`);
			if (CFG.Environment.isNotNeedTx) return;

			msg.success(`[debug::transact] TX has been submitted. Waiting for response..\n`);
			const receipt = await tx.wait();

			// Get current ballance from output contract.
			const currentOutBalance = await this.contract_out._getBalance(await this.account._getAccount());

			this.amount_sell_unformatted = ethers.utils.formatUnits(`${(currentOutBalance - this.output_balance)}`, decimals);
			return receipt;

		} catch (err) {
			await this.tryNonce();
			if (err.error && err.error.message) {
				msg.error(`[error::transact] ${err.error.message}`);
			} else
				console.log(err);
				return this.sellTokens(from, to, output_balance);
		}
	}

	/**
	 * Swap Token (sell)
	 * @param {*} sellAmount 
	 * @param {*} amountOutMin 
	 * @param {*} contracts 
	 * @returns 
	 */
	async sellTokenOnPancakeSwap(sellAmount, amountOutMin, contracts) {
		try {
			return this.router.swapExactTokensForETHSupportingFeeOnTransferTokens(
				sellAmount,   // The amount of input tokens to send.
				amountOutMin, // The minimum amount of output tokens that must be received for the transaction not to revert.
				contracts
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