const ethers = require('ethers');

class Router {
    async init(account) {
        this.router = new ethers.Contract(
            '0x10ED43C718714eb63d5aA57B78B54704E256024E',
            [
                'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
                'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
                'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
                'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable',
                'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external',
                'function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline) external  payable returns (uint[] memory amounts)'
            ],
            account // Pass connected account to pcs router
        );
        return this.router;
    }
}

module.exports = new Router();