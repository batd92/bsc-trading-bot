const ethers = require('ethers');
const CFG = require("../../config");
const Msg = require('../classes/msg');

class Wallet {
    async load() {
        this.Environment = CFG.Environment ;
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
    
            // Load user balances (for later use)
            this.bnb_balance = parseInt(await this.account.getBalance());
    
            // Load some more variables
            this.base_nonce = parseInt(await this.node.getTransactionCount(this.account.address));    
            this.nonce_offset = 0;
            this.first_block = -1;
        } catch (e) {
            Msg.error(`[Wallet::error] ${e}`);
            process.exit();
        }
    }

    /**
     * Get token BNB in wallet
     * @returns 
     */
    async _getBalance() {
        return ethers.utils.formatEther(await this.account.getBalance());
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

    /**
	 * Get nonce
	 * @returns 
	 */
    getNonce() {
        let nonce = (this.base_nonce + this.nonce_offset);
		this.nonce_offset++;
		return nonce;
    }
    
    /**
     * Try nonce
     */
    async tryNonce() {
        this.base_nonce = parseInt(await this.node.getTransactionCount(this.account.address));    
        this.nonce_offset = 0;
        this.first_block = -1;
    }
}

module.exports = new Wallet();