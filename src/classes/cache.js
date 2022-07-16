/*=================================================*/
/*                                                 */
/*              Written By TàoBa.                  */
/*                                                 */
/*=================================================*/

const fs = require("fs");
const _ = require("lodash");

const pathPairsFormPancakeSwap = "storage.local/pairsFormPancakeSwap.json";
class Cache {
  async load(wallet) {
    this.walletAddress = wallet;

    // Load info address from cached file
    this.fileToken = `storage.local/${this.walletAddress}.json`;
    if (fs.existsSync(this.fileToken)) {
      const data = JSON.parse(await fs.readFileSync(this.fileToken));
      if (data) {
        this[this.walletAddress.toString()] = {
          tokens: data.tokens,
          pairs_address: data.pairs_address,
        };
      }
    } else {
      this[this.walletAddress.toString()] = {
        tokens: {},
        pairs_address: {},
      };
    }

    // Load 1000 pair for pancake swap
    if (fs.existsSync(pathPairsFormPancakeSwap)) {
      this.pairsFormPancakeSwap = JSON.parse(await fs.readFileSync(pathPairsFormPancakeSwap));
    }
  }

  /**
   * Check address
   * @param {*} _address
   * @returns
   */
  isAddressCached(_address) {
    return _.get(this, [this.walletAddress.toString(),"tokens", _address.toString()], {}).isApproved || false;
  }

  /**
   * Set info token
   * @param {*} _address
   * @param {*} _decimals
   * @param {*} _symbol
   */
  setAddressArtifacts(_address, _decimals, _symbol) {
    if (!this.isAddressCached(_address)) this.createAddress(_address);
    _.set(this, [this.walletAddress.toString(), 'tokens', _address.toString()], {
      decimals: _decimals,
      symbol: _symbol,
    });
  }

  /**
   * Set balance token in wallet
   * @param {*} _address
   * @param {*} _balance
   */
  setBalance(_address, _balance) {
    if (!this.isAddressCached(_address)) this.createAddress(_address.toString());
    _.set(this, [this.walletAddress.toString(), 'tokens', _address.toString(),'_balance'], _balance);
  }

  /**
   * Create tokens
   * @param {*} address
   * @returns
   */
  createAddress(_address) {
    _.set(this, [this.walletAddress.toString(), 'tokens', _address.toString()], {});
  }

  /**
   * Set pair address
   * @param {*} _pair
   */
  setPairAddress(contracts, _pair) {
    if (_.get(this.walletAddress.toString(), ['pairs_address', contracts.toString()])) return;
    _.set(this, [this.walletAddress.toString(), 'pairs_address', contracts.toString()], _pair);
  }

  /**
   * Load pair from pancake swap
   * @param {*} from
   * @param {*} to
   * @returns
   */
  getPairFromPancakeSwap(from, to) {
    return _.get(this.pairsFormPandcake, ['data', `${from}_${to}`],{}).pair_address || '';
  }

  /**
   * Get pair cache from file
   * @param {*} from 
   * @param {*} to 
   * @returns 
   */
  getPairFormFile(from, to) {
    return _.get(this, [this.walletAddress.toString(), 'pair_address', `${from}_${to}`], {}).address || '';
  }

  /**
   * Get pair
   * @param {*} from 
   * @param {*} to 
   * @returns 
   */
  getPairFromCache(from, to) {
    const pairCache = this.getPairFormFile(from, to);
    return pairCache ? pairCache : this.getPairFromPancakeSwap(from, to) || '';
  }

  /**
   * Check is approved
   * @param {*} address
   * @returns
   */
  isApproved(address) {
    return _.get(this, [this.walletAddress.toString(), 'tokens', address.toString()], {}).isApproved || false;
  }

  /**
   * Set Approved
   * @param {*} address wallet
   */
  setApproved(address) {
    _.set(this, [this.walletAddress.toString(), 'tokens', address.toString(), 'isApproved'], true);
    _.set(this, [this.walletAddress.toString(), 'tokens', address.toString(), 'timeApproved'], new Date().getTime());
  }

  /**
   * Get history buy sell
   * @param {*} date
   * @param {*} token
   * @param {*} wallet
   * @returns
   */
  async getHisroty(date, token, wallet) {
    const pathHistory = `storage.local/${date}/${wallet}/${token}.json`;
    if (fs.existsSync(pathHistory)) {
      try {
        return JSON.parse(await fs.readFileSync(pathHistory));
      } catch (error) {
        msg.primary(`[debug::get history]` + error);
        return {};
      }
    }
  }

  /**
   * Save file cache
   */
  async save() {
    await fs.writeFileSync(
      this.fileToken,
      JSON.stringify(this[this.walletAddress.toString()])
    );
  }

  getInfoTokenFormCache(address) {
    return _.get(this, [this.walletAddress.toString(), 'tokens', address.toString()], {});
  }
}

module.exports = new Cache();
