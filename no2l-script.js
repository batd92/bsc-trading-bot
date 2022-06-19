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
    const { Environment, CustomStrategyBuy, CustomStrategySell, Tokens } = config.cfg;

    // Load cache by wallet metamask
    await cache.load(Environment.MY_ADDRESS);

    if (!network.isETH(Tokens.BNB)) {
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
    const vBNB = ethers.utils.formatEther(network.bnb_balance);
    msg.primary(`[info::no2l-script] You have ${vBNB} BNB in your wallet.`);

    // Balance check
    if (vBNB === 0) {
        msg.error(`[error::no2l-script] You don't have any BNB in your account. (used for gas fee)`);
        process.exit();
    }

    if (Environment.modeManual === '--buy-only') {
        // Check if has enough input balance
        if ((vBNB < ethers.utils.formatEther(CustomStrategySell.InvestmentAmount))) {
            msg.error(`[error::no2l-script] You don't have enough input balance for this transaction.`);
            process.exit();
        }
    }

    // Fetch pair
    const pair = await network.getPair(Tokens.BNB, Tokens.TokenSwap);
    if (!pair)  {
        msg.error(`[error::no2l-script] Pair don't exit.`);
        process.exit();
    }
    await cache.save();

    msg.primary("[debug::no2l-script] Pair address: " + JSON.stringify(pair) + ".");

    // Get liquidity
    const liquidity = await network.getLiquidity(pair);

    msg.primary(`[debug::no2l-script] Liquidity found: ${liquidity} BNB.\n`);

    const minLiquidity = Environment.modeManual === '--buy-only' ? CustomStrategyBuy.MIN_LIQUIDITY : CustomStrategySell.MIN_LIQUIDITY;
    // Check liquidity
    if (parseInt(liquidity) < parseInt(minLiquidity)) {
        msg.error(`[error::no2l-script] Liquidity of pool < Your liquidity.`);
        process.exit();
    }

    // Get starting tick
    const startingTick = Math.floor(new Date().getTime() / 1000);
    let receipt;
    // Purchase token [bnb -> token (through bnb)]
    if (Environment.modeManual === '--buy-only') {
        receipt = await network.transactToken(
            Tokens.BNB,
            Tokens.TokenSwap,
        );
    }

    // Sell token [token -> BNB (through bnb)]
    if (Environment.modeManual === '--sell-only') {
        receipt = await network.transactFromTokenToBNB(
            Tokens.TokenSwap,
            Tokens.BNB,
        );
    }

    if (receipt == null) {
        msg.error('[error::no2l-script] Could not retrieve receipt from buy tx.');
        process.exit();
    }

    console.log(chalk.hex('#2091F6').inverse('==================== [TX COMPLETED] ===================='));
    console.log(chalk.hex('#2091F6')('• ') + chalk.hex('#EBF0FA')(`https://bscscan.com/tx/${receipt.logs[1].transactionHash}`));
    console.log(chalk.hex('#2091F6').inverse('========================================================\n'));

    msg.success(`Finished in ${((Math.floor(new Date().getTime() / 1000)) - startingTick)} seconds.`);
    // await Until.saveFileHistoryTrans(Environment.MY_ADDRESS, [Tokens.BNB, Tokens.TokenSwap].join('_'), Environment.modeManual, receipt);
    process.exit();

})();

setInterval(() => {}, 1 << 30);