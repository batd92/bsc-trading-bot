/*=================================================*/
/*                                                 */
/*              Written By TàoBa.                  */
/*                                                 */
/*=================================================*/
const { msg, config, cache, network } = require("./classes/main.js");
const ethers = require("ethers");
const chalk = require("chalk");
const prompts = require("prompts");

// Feature
const question = [
    {
        type: "select",
        name: "feature",
        message: "Please select the function you want to perform ?",
        choices: [
            { title: "Sell", value: "--sell" },
            { title: "Buy", value: "--buy" },
            { title: "Claim", value: "--claim" },
            { title: "Approve", value: "--approve" },
            { title: "Exit", value: "--exit" },
        ],
        initial: 1,
    },
];
/**
 * Bill
 * @param {*} isWaitingTx 
 * @param {*} receipt 
 */
 const checkBill = (isWaitingTx, receipt) => {
    console.log(chalk.hex("#2091F6").inverse("[error::no2l-script] [TX COMPLETED]."));
    if (receipt && isWaitingTx) {
        console.log(receipt ? `https://bscscan.com/tx/${receipt.logs[1].transactionHash}` : '');
    }
    process.exit();
};

/**
 * Check Liquidity
 * @param {*} network 
 * @param {*} pair 
 */
const checkLiquidity = async (network, pair, CustomStrategyBuy) => {
    // Get liquidity
    const liquidity = await network.getLiquidity(pair);
    msg.primary(`[debug::no2l-script] Liquidity found: ${liquidity} BNB.\n`);
};

/**
 * Get pair and save
 * @param {*} cache 
 * @param {*} network 
 * @returns 
 */
const getPair = async (cache, network, Tokens) => {
    // Fetch pair
    const pair = await network.getPair(Tokens.BNB, Tokens.TokenSwap);
    if (!pair) {
        msg.error(`[error::no2l-script] Pair don't exit.`);
        process.exit();
    }
    await cache.save();
    return pair;
}

let ConsoleLog = console.log;

// Main classes
console.clear();
msg.primary("[debug::no2l-script] Loading..");

// LockAndExecute
(async () => {
    // Load config using our loaded cache
    await config.load();
    const { Environment, CustomStrategyBuy, CustomStrategySell, Tokens } = config.cfg;
    
    // Load cache by wallet metamask
    await cache.load(Environment.MY_ADDRESS);
    
    if (!network.isETH(Tokens.BNB)) {
        msg.error(
            `[error::no2l-script] The free version of the bot can only use the BNB pair. => Input: BNB address.`
        );
         process.exit();
    }
    
    // Initialize our network using a config.
    await network.load(config);
    msg.primary("[debug::no2l-script] ↻ No2L ✇ →→→→→→→→ has been started.");
    const vBNB = ethers.utils.formatEther(network.bnb_balance);
    msg.primary(`[info::no2l-script] You have ${vBNB} BNB in your wallet.`);

    // Balance check
    if (vBNB === 0) {
        msg.error(
            `[error::no2l-script] You don't have any BNB in your account. (used for gas fee)`
        );
        process.exit();
    };

    ConsoleLog(`
    /*=================================================*/
    /*                                                 */
    /*              Written By TàoBa.                  */
    /*                                                 */
    /*=================================================*/
    \n`);
    let receipt;
    let startingTick;
    let pair;
    const { feature } = await prompts(question);
    if (feature) {
        switch (feature) {
            case "--sell":
                // Get starting tick
                console.time(`Finished in seconds.`);
                Environment.modeManual = '--sell-only';
                // Prepare network for transactions
                await network.prepare();
                pair = await getPair(cache, network, Tokens);
                msg.primary("[debug::no2l-script] Pair address: " + JSON.stringify(pair) + ".");
                receipt = await network.transactTokenToBNB(Tokens.TokenSwap, Tokens.BNB);
                console.timeEnd(`Finished in seconds.`);
                checkBill(Environment.isWaitingTx, receipt);
                break;
            case "--buy":
                // Get starting tick
                console.time(`Finished in seconds.`)
                Environment.modeManual = '--buy-only';
                // Prepare network for transactions
                await network.prepare();
                pair = await getPair(cache, network, Tokens);
                msg.primary("[debug::no2l-script] Pair address: " + JSON.stringify(pair) + ".");
                await checkLiquidity(network, pair, CustomStrategyBuy);
                receipt = await network.transactToken(Tokens.BNB, Tokens.TokenSwap);
                console.timeEnd(`Finished in seconds.`);
                checkBill(Environment.isWaitingTx, receipt);
                break;
            case "--claim":
                break;
            case "--approve":
                // Prepare network for transactions
                console.clear();
                await network.prepare();
                break;
            case "--exit":
                msg.primary("[debug::no2l-script] Exit program.");
                process.exit();
        }
    }
})();

// Error handler
process.on("uncaughtException", (err) => {
    msg.error(`[error::no2l-script] Exception: ${err}`);
    process.exit();
});

setInterval(() => { }, 1 << 30);
