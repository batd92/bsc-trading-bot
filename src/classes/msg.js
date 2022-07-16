/*=================================================*/
/*                                                 */
/*              Written By TàoBa.                  */
/*                                                 */
/*=================================================*/

const chalk = require('chalk');
class Msg {
	error(msg) { console.log(chalk.hex('#F62020')(msg)); }
	success(msg) { console.log(chalk.hex('#669EE8')(msg)); }
	primary(msg) { console.log(chalk.hex('#EBF0FA')(msg)); }
	warning(msg) { console.log(chalk.hex('#E8BF66')(msg)); }
    originalLog(msg) { console.log(msg) }
}

module.exports = new Msg();