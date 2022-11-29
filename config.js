/*=================================================*/
/*                                                 */
/*              Written By TàoBa.                  */
/*                                                 */
/*=================================================*/

const ethers = require("ethers");
const Until = require("./src/classes/until");
const bnbAddress = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
require('dotenv').config();

// Load data from .env
const Environment = {
  SYS_SECRET_KEY: process.env.SYS_SECRET_KEY, // => Pharse wallet
  SYS_WSS_NODE: process.env.SYS_HTTPS_NODE,     // => RPC URL nếu bạn setting websocket
  SYS_IS_WSS: false,                                    // Chỉ đỉnh connect ví metamask theo cách nào. Theo websocket hay https
  SYS_HTTPS_NODE: process.env.SYS_HTTPS_NODE,  // => RPC URL nếu bạn setting cho https
  SYS_GAS_PRICE_APPROVE: ethers.utils.parseUnits('5', "gwei"),
  SYS_GAS_LIMIT_APPROVE: 70000,
  MY_ADDRESS: process.env.MY_ADDRESS,
  modeManual: '',
  isNotNeedTx: true,                                    // Chỉ định có lấy link tx không ?
  AlwaysRunning: false,
  MinimumQuantityForSell: 0, // => Số lượng tối thiểu token có trong ví để bán
};

const Tokens = {
  'BNB': Until.isAddress(bnbAddress),
  'TokenSwap': Until.isAddress(process.env.TOKEN_SWAP)
};

const CustomStrategyBuy = () =>   {
  return {
    GAS_LIMIT: 257760,                               // => // Phí lượng gas tối đa mà có thể trả trên mỗi giao dịch => Càng nhiều => Càng nhanh
    GAS_PRICE: ethers.utils.parseUnits('5', "gwei"), // => // Giá mà có thể trả cho miner/validator trong mỗi lần giao dịch => Càng nhiều => Càng nhanh
    InvestmentAmount: 0.005,                        // => Investment amount per token => Số BNB mua cho mỗi mã thông báo
    BUY_SLIPPAGE: 50,                                // => Phần trăm trượt giá
    MIN_LIQUIDITY: 100,                              // => Số lượng BNB của pool ít nhất
    MAX_LIQUIDITY: 10000,                            // => Số lượng BNB của pool max nhất
    // INFO_TOKEN_OUTPUT: await Until.getToken(Until.isAddress('0xe9e7cea3dedca5984780bafc599bd69add087d56')), // => ???
  }
};

const CustomStrategySell = () => {
  return {
    GAS_LIMIT: 475147,                               //257760, // => // Phí lượng gas tối đa mà có thể trả trên mỗi giao dịch => Càng nhiều => Càng nhanh
    GAS_PRICE: ethers.utils.parseUnits('5', "gwei"), // => // Giá mà có thể trả cho miner/validator trong mỗi lần giao dịch => Càng nhiều => Càng nhanh
    InvestmentAmount: 1,                             // => Số lượng bán
    SELL_SLIPPAGE: 50,                               // => Phần trăm trượt giá
    MIN_LIQUIDITY: 100,                              // => Số lượng BNB của pool ít nhất
    MAX_LIQUIDITY: 10000,                            // => Số lượng BNB của pool max nhất
    //INFO_TOKEN_INPUT: await Until.getToken(Until.isAddress('0xe9e7cea3dedca5984780bafc599bd69add087d56')), // => ???
    percentOfTokensToSellProfit: 25,                 // Enter percent of tokens to sell when profit reached
    percentOfTokensToSellLoss: 0,                    // Enter percent of tokens to sell when stop loss reached,
    MIN_AMOUNT: 0
  }
};

const load = () => {
  return {
    Environment: Environment,
    CustomStrategyBuy: CustomStrategyBuy(),
    CustomStrategySell: CustomStrategySell(),
    Tokens: Tokens
  }
}

module.exports =  load();