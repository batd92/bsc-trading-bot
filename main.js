const Monitor = require('./monitor');
console.clear();
console.log(`
######    ######  ### ###    ###      ####    ##  ##  ##   ##  
 ##  ##     ##     ## ##    ## ##    ##  ##   ##  ##  ##   ##  
 ##  ##     ##     ####    ##   ##  ##        ##  ##  ##   ##  
 #####      ##     ###     ##   ##  ##        ######  ##   ##  
 ##         ##     ####    #######  ##        ##  ##  ##   ##  
 ##         ##     ## ##   ##   ##   ##  ##   ##  ##  ##   ##  
####      ######  ### ###  ##   ##    ####    ##  ##   ##### `);
console.log(`\n--------_TàoBa.Nụ <3_------ \n`);

const prompts = require("prompts");

// Feature
const question = [
    {
        type: "select",
        name: "feature",
        message: "Please select the function you want to perform ?",
        choices: [
            { title: "Auto/manual selling", value: "--sell" },
            { title: "Auto/manual buy", value: "--buy" },
            { title: "Unicrypt Burn", value: "--unicrypt" },
            { title: "Approve Token", value: "--approve" },
            { title: "Auto sell by liquidity", value: "--liquidity" },
            { title: "Exit", value: "--exit" },
        ],
        initial: 1,
    },
];

// Main
(async () => {
    const { feature } = await prompts(question);
    if (feature) {
        switch (feature) {
            case '--sell':
                console.clear();
                console.log("Sell....");
                await Monitor.scheduleMonitor({ canSell: true });
                break;
            case '--buy':
                console.clear();
                console.log("Buy....");
                await Monitor.scheduleMonitor({ canBuy: true });
                break;
            case '--unicrypt':
                console.clear();
                console.log("Unicrypt....");
                await Monitor.scheduleMonitor({ canUnicrypt: true });
                break;
            case '--approve':
                console.clear();
                console.log("Approve....");
                await Monitor.scheduleMonitor({ canApprove: true });
                break;
            case '--liquidity':
                console.clear();
                console.log("Liquidity....");
                await Monitor.scheduleMonitor({ canLiquidity: true });
                break;
            case '--exit':
                console.clear();
                console.log("Exit program....");
                process.exit();
            default:
                console.clear();
                console.log("Exit program....");
                process.exit();
        }
    }
})();

setInterval(() => { }, 1 << 30);

// Error handler
process.on("uncaughtException", (err) => {
    console.log(`[error::no2l-script] Exception: ${err}`);
    process.exit();
});