/*=================================================*/
/*                                                 */
/*              Written By TàoBa.                  */
/*                                                 */
/*=================================================*/
const { msg } = require('./classes/main.js');
const fs = require("fs");
const fetch = require("isomorphic-fetch");
const _ = require("lodash");
const chalk = require('chalk');

const apiPairAddressPancakeSwap = "https://api.pancakeswap.info/api/v2/pairs";
const pathPairsFormPancakeSwap = "storage.local/pairsFormPancakeSwap.json";

class PancakeSwap {
  async load() {
    // Load 1000 pair for pancake swap
    this.pairsFormPancakeSwap = await fetch(apiPairAddressPancakeSwap).then(function (response) {
      if (response.status >= 400) {
        console.log("Can not load 1000 pair for pancake swap !!!");
        return {};
      }
      return response.json();
    });

    // Load file
    if (fs.existsSync(pathPairsFormPancakeSwap)) {
      const pairsFormFile = JSON.parse(await fs.readFileSync(pathPairsFormPancakeSwap));
      if (pairsFormFile) {
        _.forEach(Object.keys(pairsFormFile['data']), (pair) => {
          if (!this.pairsFormPancakeSwap['data'][pair]) {
            this.pairsFormPancakeSwap['data'][pair] = pairsFormFile['data'][pair];
          }
        });
      }
    }
    // Save file cache
    if (this.pairsFormPancakeSwap) {
      await fs.writeFileSync(pathPairsFormPancakeSwap, JSON.stringify(this.pairsFormPancakeSwap));
    }
  }
}
// Run command
(async () => {
    await (new PancakeSwap()).load();
    console.log(chalk.hex('#2091F6').inverse('----- Finished updating pairs from PancakeSwap. ------'));
})();