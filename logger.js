const path = require('path');
const log4js = require('log4js');

const dir = process.cwd();

log4js.configure({
    appenders: {
        app: {type: 'file', filename: path.join(dir, "./logs/app.log")}
    },
    categories: {
        default: {
            appenders: ['console', 'app'], level: 'trace',//all log
        },
    }
});


export default log4js;

export const logger = log4js.getLogger("app");