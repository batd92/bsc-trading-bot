/*=================================================*/
/*                                                 */
/*              Written By TàoBa.                  */
/*                                                 */
/*=================================================*/
const { msg, config, cache, network } = require('./classes/main.js');
const ethers = require('ethers');
const chalk = require('chalk');
const Until = require('./classes/until');

let ConsoleLog = console.log;

// Main classes
// console.clear();
msg.primary('[debug::no2l-script] Loading..');

// Error handler
process.on('uncaughtException', (err, origin) => {
	msg.error(`[error::no2l-script] Exception: ${err}`);
	process.exit();
});

// Main
(async () => {
    // Load config using our loaded cache
    await config.load();
    const { contracts, transaction, wallet, token_output, token_input} = config.cfg;

    // Load cache by wallet metamask
    await cache.load(wallet.myAddress);

    if (!network.isETH(contracts.input)) {
        msg.error(`[error::no2l-script] The free version of the bot can only use the BNB pair. => Input: BNB address.`);
        process.exit();
    }

	// Initialize our network using a config.
	await network.load(config);

	// Prepare network for transactions
    await network.prepare();

    // Print debug info
    // console.clear();

    ConsoleLog(`
    /*=================================================*/
    /*                                                 */
    /*              Written By TàoBa.                  */
    /*                                                 */
    /*=================================================*/
    \n\n`);

    msg.primary('[debug::no2l-script] ↻ No2L ✇ →→→→→→→→ has been started.');

    const wBNB = ethers.utils.formatEther(network.bnb_balance);
    msg.primary(`[info::no2l-script] You have ${wBNB} BNB in your wallet.`);

	// Balance check
    if (wBNB === 0) {
    	msg.error(`[error::no2l-script] You don't have any BNB in your account. (used for gas fee)`);
        process.exit();
    }

    // Check if has enough input balance
    if ((network.bnb_balance < transaction.investmentAmount)) {
        msg.error(`[error::no2l-script] You don't have enough input balance for this transaction.`);
        process.exit();
    }

    // Fetch pair
    const pair = await network.getPair(contracts.input, contracts.output);
    await cache.save();

    msg.primary("[debug::no2l-script] Pair address: " + JSON.stringify(pair) + ".");

    // Get liquidity
    const liquidity = await network.getLiquidity(pair);

    console.log(token_input, token_output);
    msg.primary(`[debug::no2l-script] Liquidity found: ${liquidity} ${token_input.symbol}.\n`);

    // Check liquidity
    if (parseInt(liquidity) < parseInt(transaction.min_liquidity)) {
        msg.error(`[error::no2l-script] Liquidity of pool < Your liquidity.`);
        process.exit();
    }

    // Get starting tick
    const startingTick = Math.floor(new Date().getTime() / 1000);
    let receipt;
    // Purchase token [bnb -> token (through bnb)]
    if (transaction.modeManual === '--buy-only') {
        receipt = await network.transactToken(
            contracts.input,
            contracts.output
        );
    }

    // Sell token [token -> BNB (through bnb)]
    if (transaction.modeManual === '--sell-only') {
        receipt = await network.transactFromTokenToBNB(
            contracts.input, 
            contracts.output
        );
    }

    if (receipt == null) {
        msg.error('[error::no2l-script] Could not retrieve receipt from buy tx.');
        process.exit();
    }
    const outputToken = cache.getInfoTokenFormCache(contracts.output);
    const inputToken = cache.getInfoTokenFormCache(contracts.input);
    console.log(chalk.hex('#2091F6').inverse('==================== [TX COMPLETED] ===================='));
    console.log(chalk.hex('#2091F6')('• ') + chalk.hex('#EBF0FA')(`From ${inputToken.symbol} (${transaction.amount_in} ${inputToken.symbol}) -> ${outputToken.symbol} (minimum ${network.amount_bought_unformatted} ${outputToken.symbol})`));
    console.log(chalk.hex('#2091F6')('• ') + chalk.hex('#EBF0FA')(`https://bscscan.com/tx/${receipt.logs[1].transactionHash}`));
    console.log(chalk.hex('#2091F6').inverse('========================================================\n'));

    msg.success(`Finished in ${((Math.floor(new Date().getTime() / 1000)) - startingTick)} seconds.`);
    Until.saveFileHistoryTrans(wallet.myAddress, [contracts.input, contracts.output].join('_'), transaction.modeManual, receipt);
    process.exit();

})();

setInterval(() => {}, 1 << 30);