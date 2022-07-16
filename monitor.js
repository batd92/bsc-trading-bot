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
const Network = require('./src/classes/network');

// Main
const EventEmitter = require("events");
class Monitor extends EventEmitter {
    constructor(account, factory, contract_in, contract_out, router) {
        super();
        this.account = account;
        this.factory = factory;
        this.contract_in = contract_in;
        this.contract_out = contract_out;
        this.router = router;
        this.network = {};
    }

    async load() {
        await this.account.load();
        await this.factory.init(this.account);
        await this.contract_in.init(this.account, );
        await this.contract_out.init(this.account);
        await this.router.init(this.account);
        this.network = new Network(this);
    }
    /**
     * Run
     */
    start() {
        this.running = true;
        this.run().then();
        this.monitWallet().then();
    }

    /**
     * Monit Wallet
     */
    async monitWallet() {
        while (this.running) {
            await Until.sleep(500);
            // Truy vấn số token trong ví
            // let { output, outputAmount, inputAmount } = await this.swapper.getBalances();
            if (1!== 1) {
                this.emit('wallet.update.output_token', am);
                if (!task._loaded) {
                    task._loaded = true
                    this.emit('wallet.loaded', this)
                }
            }
        }
    }
}

const scheduleMonitor = async () => {
    const monitor = new Monitor(Wallet, Factory, ContractIn, ContractOut, Router);
    await monitor.load();
    monitor.start()

    // Tự động bán khi đạt đến bội số nhất định
    monitor.on('wallet.update.output_token', async (payload) => {
        await payload.network.prepare();
        await payload.network.transactFromTokenToBNB()
    })
}

// Run
scheduleMonitor();
