const ethers = require('ethers');
const CFG = require("../../config");

class Wallet {
    async load() {
        this.config = CFG;
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
    
            // Load user balances (for later use)
            this.bnb_balance = parseInt(await this.account.getBalance());
    
            // Load some more variables
            this.base_nonce = parseInt(await this.node.getTransactionCount(this.account.address));
    
            this.nonce_offset = 0;
            this.first_block = -1;
        } catch (e) {
            msg.error(`[error::network] ${e}`);
            process.exit();
        }
    }

    /**
     * Get token BNB in wallet
     * @returns 
     */
    async _getBalance() {
        return this.bnb_balance;
    }

    /**
     * Get network
     * @returns 
     */
    async _getNetwork() {
        return this.network
    }

    /**
     * Get network
     * @returns 
     */
     async _getAccount() {
        return this.account
    }

}

module.exports = new Wallet();