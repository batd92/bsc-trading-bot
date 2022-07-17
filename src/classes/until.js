const fs = require('fs');
const fetch = require('isomorphic-fetch');
const ethers = require("ethers");
const msg = require('./src/classes/msg');

/**
 * Format ddyymm
 * @param {*} d 
 * @returns 
 */
const ddMMYY = (d, charSpace = '-') => d.getDate() + charSpace + (d.getMonth() + 1) + charSpace + d.getFullYear();

/**
 * Save file history
 * @param {*} wallet 
 * @param {*} contracts 
 * @param {*} data 
 */
const saveFileHistoryTrans = async (wallet, contracts, action, data) => {
    const path = 'storage.local/' + wallet + '/' + ddMMYY(new Date(), '') + '/' + action + '/' + contracts + '.json';
    if (!fs.existsSync(path)) {
        await fs.writeFileSync(path, JSON.stringify(Array.isArray(data) ? data : [data]));
    } else {
        const dataHistory = JSON.parse(await fs.readFileSync(path));
        if (dataHistory) {
            dataHistory.push(data);
            await fs.writeFileSync(path, JSON.stringify(dataHistory));
        }
    }
}

/**
   * Get info token form pancakeswap
   * @param {*} token 
   * @returns 
   */
const getToken = async (token) => {
    const info = await fetch('https://api.pancakeswap.info/api/v2/tokens/' + token).then(function (response) {
        if (response.status >= 400) {
            throw new Error("Bad response from server");
        }
        return response.json();
    });
    return info.data || {};
}

const getContractAddressByName = (_name = "") => {
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
const sleep = async (t) => {
  return new Promise(resolve => {
      setTimeout(() => {
          resolve(null)
      }, t)
  })
}

const isAddress = (address) => {
  if (ethers.utils.isAddress(address)) return address;
  msg.error(
    `[error::config] Contract "${address}" does not exist, please use an address instead.`
  );
  process.exit();
}

module.exports = {
    saveFileHistoryTrans,
    getToken,
    getContractAddressByName,
    sleep,
    isAddress
}