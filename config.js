/*=================================================*/
/*                                                 */
/*              Written By TàoBa.                  */
/*                                                 */
/*=================================================*/

const ethers = require("ethers");
const Until = require("./src/classes/until");

const GAS_PRICE_APPROVE = "5";
const GAS_LIMIT_APPROVE = 21000;

// const modeManual = '--sell-only'; // Enables manual sell mode. This will only sell the token and then exit.
const modeManual = "--buy-only"; // Enables manual buy mode. This will only buy the token and then exit.

// Load data from .env
const env = {
  // [WALLET]
  SECRET_KEY:
    "lady ski they panther piece purpose logic retreat opinion unhappy swear common", // => Pharse wallet
  WSS_NODE: "wss://bsc-ws-node.nariox.org:443", // => RPC URL nếu bạn setting websocket
  IS_WSS: false, // Chỉ đỉnh connect ví metamask theo cách nào. Theo websocket hay https
  HTTPS_NODE: "https://data-seed-prebsc-1-s1.binance.org:8545", // => RPC URL nếu bạn setting cho https
  RECIPIENT: "0x1370715e3c4B4dda15DF6d15140D90faF521FeCf", // Địa chỉ ví nhận, địa chỉ ví metamask mà mua bán

  // [CONTRACTS]
  INPUT: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // => Tonken bị bán đi để mua token mới
  OUTPUT: "0x8076c74c5e3f5852037f31ff0093eeb8c8add8d3", // => Token cần mua

  // [TRANSACTION]
  GAS_LIMIT: 250000, // => // Phí lượng gas tối đa mà có thể trả trên mỗi giao dịch => Càng nhiều => Càng nhanh
  GAS_PRICE: "5", // => // Giá mà có thể trả cho miner/validator trong mỗi lần giao dịch => Càng nhiều => Càng nhanh
  InvestmentAmount: 0.01, // => Investment amount per token => Số BNB mua cho mỗi mã thông báo
  BUY_SLIPPAGE: 10, // => Phần trăm trượt giá
  MIN_LIQUIDITY: 100, // => Số lượng BNB của pool ít nhất
  MAX_LIQUIDITY: 10000, // => Số lượng BNB của pool max nhất
};

const CFG = {
  contracts: {
    input: Until.getContractAddressByName("bnb"),
    output: Until.getContractAddressByName(env.OUTPUT || "busd"),
  },
  transaction: {
    gas_price: ethers.utils.parseUnits(env.GAS_PRICE, "gwei"),
    gas_limit: env.GAS_LIMIT,
    buy_slippage: env.BUY_SLIPPAGE,
    investmentAmount: env.InvestmentAmount,
    min_liquidity: env.MIN_LIQUIDITY,
    maxLiquidity: env.MAX_LIQUIDITY,
    percentOfTokensToSellProfit: 100, // Enter percent of tokens to sell when profit reached
    percentOfTokensToSellLoss: 0, // Enter percent of tokens to sell when stop loss reached,
    gas_price_approve: ethers.utils.parseUnits(GAS_PRICE_APPROVE, "gwei"),
    gas_limit_approve: GAS_LIMIT_APPROVE,
    modeManual,
  },
  wallet: {
    is_wss: env.IS_WSS,
    secret_key: env.SECRET_KEY,
    wss_node: env.WSS_NODE,
    https_node: env.HTTPS_NODE,
    myAddress: env.RECIPIENT,
  },
  token_output: env.OUTPUT,
  token_input: env.INPUT,
};

module.exports = CFG;
