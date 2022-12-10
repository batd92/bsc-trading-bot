/*=================================================*/
/*                                                 */
/*              Written By TàoBa.                  */
/*                                                 */
/*=================================================*/
const Until = require('./src/classes/until');
const Wallet = require('./src/swapper/wallet');
const Router = require('./src/swapper/router');
const ContractIn = require('./src/swapper/contract_in');
const ContractOut = require('./src/swapper/contract_out');
const Factory = require('./src/swapper/factory');
const Cache = require('./src/classes/cache');
const CFG = require('./config');

const { Network } = require('./src/swapper/network');
const EventEmitter = require('events').EventEmitter;
const Msg = require('./src/classes/msg');

// Lấy số luồng trong máy tính và ép ứng dụng chạy tài nguyênß
const os = require('os');
process.env.UV_THREADPOOL_SIZE = os.cpus().length - 1;
const BUSD = process.env.BUSD || '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16';
const BNB = process.env.BNB || '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16';

// Main
class Monitor extends EventEmitter {
    constructor(account, factory, contract_in, contract_out, router) {
        super();
        this.account = account;
        this.factory = factory;
        this.contract_in = contract_in;
        this.contract_out = contract_out;
        this.router = router;
        this.network = {};
        this.outputAmount = CFG.Environment.MinimumQuantityForSell;
    }

    async load() {
        await this.account.load();
        const _account = await this.account._getAccount();
        await this.factory.init(_account);
        await this.contract_in.init(_account);
        await this.contract_out.init(_account);
        await this.router.init(_account);
        this.network = new Network(this);
        await Cache.load(CFG.Environment.MY_ADDRESS);
    }

    /**
     * Start wallet
     */
    async startCheckWallet() {
        this.running = true;
        this.prepare = false;
        this.monitWallet().then();
    }

    /**
     * Start Liquidity
     */
    startLiquidity() {
        this.runCheckLiquidity = true;
        this.monitLiquidity().then();
    }
    /**
     * Burn token
     */
    burnUnicrypt() {
        this.isBurnUnicrypt = true;
        this.monitBurnUnicrypt().then();
    }

    /**
     * Run
     */
    async run() {
        while (this.running) {
            await sleep(500)
            // await this.fetchTrade()
        }
    }

    /**
     * Monit Wallet
     */
    async monitWallet() {
        try {
            while (this.running) {
                await Until.sleep(500);
                // Get token 
                let { outputAmount, raw } = await this.contract_out._getBalance(await this.account._getAccount());
                let bnb = await this.account._getBalance();
                console.clear();
                Msg.primary('Đang quét ví .... ');
                Msg.warning(`Số lượng (BNB) trong ví:  ${bnb}`);
                Msg.warning(`Số lượng token (${CFG.Tokens.TokenSwap}) trong ví: ${outputAmount}`);
                Msg.warning(`Số lượng token (${CFG.Tokens.TokenSwap}) trong ví trước đó: ${this.outputAmount}`);
                // Truy vấn số token trong ví
                if (outputAmount !== this.outputAmount && outputAmount > CFG.Environment.MinimumQuantityForSell) {
                    Msg.warning('Đang bán token .... ');
                    this.emit('wallet.update.output_token', { raw, network: this.network });
                    this.outputAmount = outputAmount;
                    this.emit('wallet.loaded');
                    this.running = false;
                }
            }
        } catch (error) {
            console.log('monitWallet : ' + error);
        }
    }

    /**
     * monit Liquidity
     */
    async monitLiquidity() {
        while (this.runCheckLiquidity) {
            const bnb = await this.network.getLiquidity(BNB);
            const priceBusd = await this.network.getPriceTokenOutput(BUSD);
            console.log('bnb monit liquidity (monitLiquidity): ', bnb, priceBusd);
            // Check nếu có sự thay đổi về liquidity thì bán token
        }
    }

    /**
     * Burn token
     */
    async monitBurnUnicrypt() {
        while (this.isBurnUnicrypt) {
            const bnb = await this.network.getLiquidity(BNB);
            const priceBusd = await this.network.getPriceTokenOutput(BUSD);
            console.log('bnb monit liquidity (monitBurnUnicrypt): ', bnb, priceBusd);
            // Check nếu có sự thay đổi về liquidity thì bán token
        }
    }
    /**
     * Auto buy token
     */
    async canBuyWithoutChecking() {
        // prepare
        await this.network.prepare();
        console.time('time-buy');
        await this.network.transactToken(CFG.Tokens.BNB, CFG.Tokens.TokenSwap);
        console.timeEnd('time-buy');
    }

    /**
     * Get Profit
     * @param {*} currentPrice 
     * @param {*} oldPrice 
     * @returns 
     */
    async getProfit(currentPrice, oldPrice) {
        return currentPrice / oldPrice;
    }

    /**
     * approve token
     */
    async approveToken() {
        // prepare
        console.log('Approve Token .... ');
        await this.network.prepare();
        await this.network.getPair(CFG.Tokens.BNB, CFG.Tokens.TokenSwap, true);
        return;
    };
}

/**
 * Schedule Main
 * @param {*} param0 
 * @returns 
 */
const scheduleMonitor = async ({ canBuy = undefined, canSell = undefined, canUnicrypt = undefined, canApprove = undefined, canLiquidity = undefined }) => {
    const monitor = new Monitor(Wallet, Factory, ContractIn, ContractOut, Router);
    await monitor.load();

    // Nếu chỉ mua thì mua xong và thoát
    if (canBuy) {
        await monitor.canBuyWithoutChecking();
        return;
    }

    // Nếu chỉ có bán
    if (canSell) {
        await monitor.startCheckWallet();

        // Tự động bán khi đạt đến bội số nhất định
        monitor.on('wallet.update.output_token', async (payload) => {
            if (this.prepare) {
                this.prepare = await payload.network.prepare();
            }
            console.time('time-sell');
            await payload.network.sellTokens(CFG.Tokens.TokenSwap, CFG.Tokens.BNB, payload.raw);
            console.timeEnd('time-sell');
        });
        return;
    }

    // Nếu chỉ đốt token
    if (canUnicrypt) {
        monitor.burnUnicrypt();
        console.log('burn token, check số lượng người bán và số lượng token burn');
        return;
    }

    // Nếu chỉ có approve
    if (canApprove) {
        await monitor.approveToken();
        return;
    }

    // Auto bán theo liquidity change
    if (canLiquidity) {
        console.log('Đang check liquidity và bán khi có lời !!!');
        monitor.startLiquidity();
        return;
    }
    // Load ví metamask
    monitor.on('wallet.loaded', (wallet) => {
        console.log("wallet loaded:", wallet)
    })

    // Liquidity
    monitor.on('liquidity.on', (trade) => {
        console.log("liquidity changed")
    })

    // Liquidity change
    monitor.on('liquidity.timer', async (amount, trade) => {
        const info = swapper.printTrade("liquidity.timer", amount, trade)
        // set current price
        task.swap.currentPrice = info.executionPrice;
        console.log(`swap.price.update: ${task.wallet.outputAmount} / percent:${swapper.getPrc(task.swap.currentPrice).toFixed(5)} / [C=${task.swap.currentPrice},B=${task._buyedPrice}]`) //当前价格
        if (task._buyedPrice <= 0) return;
        await swapper.autoSell(task.wallet.outputAmount, info) //auto sell
    })
}

module.exports = { scheduleMonitor };
