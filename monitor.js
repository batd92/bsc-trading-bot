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
        this.outputAmount = 0;
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
     * Start
     */
    start() {
        this.running = true;
        this.prepare = false;
        this.monitWallet().then();
    }

    /**
     * Run
     */
    async run() {
        while (this.running) {
            await sleep(500)
            await this.fetchTrade()
        }
    }

    /**
     * Monit Wallet
     */
    async monitWallet() {
        // Get token 
        let outputAmount = await this.contract_out._getBalance(await this.account._getAccount());
        while (this.running) {
            await Until.sleep(500);
            console.clear();
            Msg.primary('Đang quét ví .... ');
            // Truy vấn số token trong ví
            if (outputAmount !== this.outputAmount && outputAmount > this.outputAmount) {
                Msg.warning('Đang bán token .... ');
                this.emit('wallet.update.output_token', this);
                this.outputAmount = outputAmount;
                // Chỉ bán 1 lần
                this.running = false;
            }
        }
    }
}


const scheduleMonitor = async () => {
    const monitor = new Monitor(Wallet, Factory, ContractIn, ContractOut, Router);
     await monitor.load();
    monitor.start();

    // // Tự động bán khi đạt đến bội số nhất định
    monitor.on('wallet.update.output_token', async (payload) => {
        if (this.prepare) {
            this.prepare = await payload.network.prepare();
        }
        await payload.network.transactFromTokenToBNB(CFG.Tokens.TokenSwap, CFG.Tokens.BNB);
    })
}

module.exports = { scheduleMonitor };
