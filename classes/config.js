/*=================================================*/
/*                                                 */
/*              Written By TàoBa.                  */
/*                                                 */
/*=================================================*/

const ethers = require("ethers");
const Until = require("./until");
const bnbAddress = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";

const modeManual = "--sell-only";                       // Enables manual sell mode. This will only sell the token and then exit.
//const modeManual = '--buy-only';                      // Enables manual buy mode. This will only buy the token and then exit.

// Load data from .env
const Environment = {
  SYS_SECRET_KEY: "lady ski they panther piece purpose logic retreat opinion unhappy swear common", // => Pharse wallet
  SYS_WSS_NODE: "wss://bsc-ws-node.nariox.org:443",     // => RPC URL nếu bạn setting websocket
  SYS_IS_WSS: false,                                    // Chỉ đỉnh connect ví metamask theo cách nào. Theo websocket hay https
  SYS_HTTPS_NODE: "https://bsc-dataseed.binance.org/",  // => RPC URL nếu bạn setting cho https
  SYS_GAS_PRICE_APPROVE: ethers.utils.parseUnits('5', "gwei"),
  SYS_GAS_LIMIT_APPROVE: 70000,
  MY_ADDRESS: '0x1370715e3c4B4dda15DF6d15140D90faF521FeCf',
  modeManual
};

const Tokens = {
  'BNB': Until.isAddress(bnbAddress),
  'TokenSwap': Until.isAddress('0xe9e7cea3dedca5984780bafc599bd69add087d56')
};

const CustomStrategyBuy = async () =>   {
  return {
    GAS_LIMIT: 257760,                               // => // Phí lượng gas tối đa mà có thể trả trên mỗi giao dịch => Càng nhiều => Càng nhanh
    GAS_PRICE: ethers.utils.parseUnits('5', "gwei"), // => // Giá mà có thể trả cho miner/validator trong mỗi lần giao dịch => Càng nhiều => Càng nhanh
    InvestmentAmount: 0.0005,                        // => Investment amount per token => Số BNB mua cho mỗi mã thông báo
    BUY_SLIPPAGE: 50,                                // => Phần trăm trượt giá
    MIN_LIQUIDITY: 100,                              // => Số lượng BNB của pool ít nhất
    MAX_LIQUIDITY: 10000,                            // => Số lượng BNB của pool max nhất
    INFO_TOKEN_OUTPUT: await Until.getToken(Until.isAddress('0xe9e7cea3dedca5984780bafc599bd69add087d56')), // => ???
  }
};

const CustomStrategySell = async () => {
  return {
    GAS_LIMIT: 475147,                               //257760, // => // Phí lượng gas tối đa mà có thể trả trên mỗi giao dịch => Càng nhiều => Càng nhanh
    GAS_PRICE: ethers.utils.parseUnits('5', "gwei"), // => // Giá mà có thể trả cho miner/validator trong mỗi lần giao dịch => Càng nhiều => Càng nhanh
    InvestmentAmount: 1,                             // => Số lượng bán
    BUY_SLIPPAGE: 50,                                // => Phần trăm trượt giá
    MIN_LIQUIDITY: 100,                              // => Số lượng BNB của pool ít nhất
    MAX_LIQUIDITY: 10000,                            // => Số lượng BNB của pool max nhất
    INFO_TOKEN_INPUT: await Until.getToken(Until.isAddress('0xe9e7cea3dedca5984780bafc599bd69add087d56')), // => ???
    percentOfTokensToSellProfit: 25,                 // Enter percent of tokens to sell when profit reached
    percentOfTokensToSellLoss: 0,                    // Enter percent of tokens to sell when stop loss reached,
  }
};

class Config {
  async load() {
    this.cfg = {
      Environment: Environment,
      CustomStrategyBuy: await CustomStrategyBuy(),
      CustomStrategySell: await CustomStrategySell(),
      Tokens: Tokens,
    }
  }
}

module.exports = new Config();
