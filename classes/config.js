/*=================================================*/
/*                                                 */
/*              Written By TàoBa.                  */
/*                                                 */
/*=================================================*/

const ethers = require("ethers");
const fetch = require('isomorphic-fetch');

const config = {
  // [WALLET]
  SECRET_KEY:
    "lady ski they panther piece purpose logic retreat opinion unhappy swear common",
  WSS_NODE: "wss://bsc-ws-node.nariox.org:443",
  IS_WSS: false,
  HTTPS_NODE: "https://data-seed-prebsc-1-s1.binance.org:8545",
  RECIPIENT: '0x1370715e3c4B4dda15DF6d15140D90faF521FeCf',

  // [CONTRACTS]
  INPUT: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  OUTPUT: "0x8076c74c5e3f5852037f31ff0093eeb8c8add8d3",

  // [TRANSACTION]
  GAS_LIMIT: 250000,
  GAS_PRICE: '5',
  InvestmentAmount: 10, // => // Investment amount per token
  BUY_SLIPPAGE: 10, // 
  MIN_LIQUIDITY: 100, // => Số lượng BNB của pool ít nhất
};

class Config {
  async load(_name) {
    this.cfg = {
      contracts: {
        input: this.getContractAddressByName("bnb"),
        output: this.getContractAddressByName( config.OUTPUT || "busd"),
      },
      transaction: {
        gas_price: ethers.utils.parseUnits(config.GAS_PRICE, "gwei"),
        gas_limit: config.GAS_LIMIT,
        buy_slippage: config.BUY_SLIPPAGE,
        investmentAmount: config.InvestmentAmount,
        min_liquidity: config.MIN_LIQUIDITY,
        maxLiquidity: 10,
        stopLoss: 0,
        maxBuyTax: 2, 			// max buy tax
        minBuyTax: 0,			  // min buy tax
        maxSellTax: 2,			// max sell tax
        minSellTax: 0,      // min sell tax
        percentOfTokensToSellProfit: 100, // Enter percent of tokens to sell when profit reached
        percentOfTokensToSellLoss: 0 // Enter percent of tokens to sell when stop loss reached
      },
      wallet: {
        is_wss: config.IS_WSS,
        secret_key: `${config.SECRET_KEY}`,
        wss_node: `${config.WSS_NODE}`,
        https_node: `${config.HTTPS_NODE}`,
        myAddress : config.RECIPIENT
      },
      token_output: await this.getToken(config.OUTPUT),
      token_input: await this.getToken(config.INPUT)
    };
  }

  async getToken(token) {
		const info = await fetch('https://api.pancakeswap.info/api/v2/tokens/' + token).then(function (response) {
			if (response.status >= 400) {
				throw new Error("Bad response from server");
			}
			return response.json();
		});
		return info.data || {};
	}

  getContractAddressByName(_name = "") {
    // Pre-defined contracts
    switch (_name.toLowerCase()) {
      case "bnb":
        return "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
      case "eth":
        return "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
      case "matic":
        return "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";
      case "busd":
        return "0xe9e7cea3dedca5984780bafc599bd69add087d56";
      case "sfm":
        return "0x8076c74c5e3f5852037f31ff0093eeb8c8add8d3";
    }
    // No address specified, fail with error
    if (!_name.startsWith("0x")) {
      msg.error(
        `[error::config] Contract "${_name}" does not exist, please use an address instead.`
      );
      process.exit();
    }

    return _name;
  }
}

module.exports = new Config();