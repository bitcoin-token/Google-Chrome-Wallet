/* Functions for tokens in general */

function instanciateContractToken(contractAddress) {
    abi = JSON.parse('[{"constant": true,"inputs": [],"name": "name","outputs": [{"name": "","type": "string"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": false,"inputs": [{"name": "_spender","type": "address"},{"name": "_value","type": "uint256"}],"name": "approve","outputs": [{"name": "success","type": "bool"}],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": true,"inputs": [],"name": "totalSupply","outputs": [{"name": "totalSupply","type": "uint256"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": false,"inputs": [{"name": "_from","type": "address"},{"name": "_to","type": "address"},{"name": "_value","type": "uint256"}],"name": "transferFrom","outputs": [{"name": "success","type": "bool"}],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": true,"inputs": [],"name": "decimals","outputs": [{"name": "","type": "uint8"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": true,"inputs": [{"name": "_owner","type": "address"}],"name": "balanceOf","outputs": [{"name": "balance","type": "uint256"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": true,"inputs": [],"name": "symbol","outputs": [{"name": "","type": "string"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": false,"inputs": [{"name": "_to","type": "address"},{"name": "_value","type": "uint256"}],"name": "transfer","outputs": [{"name": "success","type": "bool"}],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": true,"inputs": [{"name": "_owner","type": "address"},{"name": "_spender","type": "address"}],"name": "allowance","outputs": [{"name": "remaining","type": "uint256"}],"payable": false,"stateMutability": "view","type": "function"},{"anonymous": false,"inputs": [{"indexed": true,"name": "_from","type": "address"},{"indexed": true,"name": "_to","type": "address"},{"indexed": false,"name": "_value","type": "uint256"}],"name": "Transfer","type": "event"},{"anonymous": false,"inputs": [{"indexed": true,"name": "_owner","type": "address"},{"indexed": true,"name": "_spender","type": "address"},{"indexed": false,"name": "_value","type": "uint256"}],"name": "Approval","type": "event"}]');
    contract = web3.eth.contract(abi);
    instance = contract.at(contractAddress);
    
    return instance;
}

function getBalance(parameters, callback) {
    var contractInstance = parameters[0];

    contractInstance.balanceOf(parameters[1], function (error, result) {
        if(!error) {
            getDecimals(contractInstance, function (error1, decimals) {
                if(!error1) {
                    callback(null, result / (10**decimals));
                } else {
                    callback(error1);
                }
            });
        } else {
            callback(error);
        }
    });
}

function getTicker(contractInstance, callback) {
    contractInstance.symbol(function (error, result) {
        if(contractInstance.address.toLowerCase() == "0xdb8646f5b487b5dd979fac618350e85018f557d4") { 
            callback(null, "BTK"); 
        } else {
            if(!error) {
                callback(null, result);
            } else {
                callback(error);
            }
        }
    });
}

function getDecimals(contractInstance, callback) {
    contractInstance.decimals(function (error, result) {
        if(!error){
            callback(null, result);
        } else {
            callback(error);
        }
    });
}

function getName(contractInstance, callback) {
    contractInstance.name(function (error, result) {
        if(contractInstance.address.toLowerCase() == "0xdb8646f5b487b5dd979fac618350e85018f557d4") { 
            callback(null, "Bitcoin Token"); 
        } else {
            if(!error) {
                callback(null, result.replace("Network","").replace("Token","").replace("Platform","").trim());
            } else {
                callback(error);
            }
        }
    });
}