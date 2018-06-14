myApp.onPageInit('send', function (page) {

    var currentAddress = localStorage.getItem("currentAddress");
    var cacheAddress = getCacheAddress(currentAddress).tokens;
    var pricePerMessage = 0;
    web3.eth.defaultAccount = currentAddress;
    
    // Setting up the select list of tokens to send and initialization of the current token.
    var tokenToSend = localStorage.getItem("tokenToSend");
    var currentToken = {tickers: "ETH"};
    if(tokenToSend == undefined) { 
        tokenToSend = -2; 
    } // Ethereum = -2
    for(var i = 0; i < cacheAddress.length; i++) {
        var active = "";
        if(tokenToSend == i) { 
            active = "selected";
        }
        document.getElementById("listOfCryptos").innerHTML += '<option '+active+' id="'+cacheAddress[i].tickers+'" value="'+i+'">'+cacheAddress[i].tickers+'</option>';
    }
    
    initializeToken();
    
    // Init of the gas price
    web3.eth.getGasPrice(function (error, gasPrice) {
        if(!error) {
            gasPrice = escapeHtml(gasPrice);
            //document.getElementById("gasPriceLabel").innerHTML += (gasPrice/10**9) + " suggested";
            document.getElementById("gasPriceLabel").innerHTML += "";
            document.getElementById("gasPrice").value = gasPrice/10**9;
        }
    });
    
    // Change the token to send.
    document.getElementById("listOfCryptos").addEventListener("change", function () {
        initializeToken();
        verifyTransaction(false);
    });
    
    // Go back.
    document.getElementById("backSend").addEventListener("click", function () {
        mainView.router.back();
    });
    
    // Estimate gas price.
    document.getElementById("doit").addEventListener("click", function () {
        verifyTransaction(true)
    })
    
    document.getElementById("amount").addEventListener("change", function () {
        verifyTransaction(false);
    })
    
    document.getElementById("helpSend").addEventListener("click", function () {
       helpPopover("New transaction","You can chose which currency you want to send (ETH or BTK) from your current address to a <strong>recipient</strong> address.<br/><br/>Gas is necessary to pay the miners that will approve your transaction. It is like a fee and the necessary amount is calculated automatically. <br/><br/>You can then choose the <strong>Sending Gas Fee</strong> : the higher it is, the quicker your transaction will go through, but at additional cost. We recommed leaving the values that appear automatically.", this); 
    });
    
    function initializeToken() {
        currentToken = {tickers: "ETH"};
        var balanceToAdd;
        var id = document.getElementById("listOfCryptos").value;
        if(id != -2) {
            currentToken = cacheAddress[id];
            balanceToAdd = currentToken.balances;
        } else {
            balanceToAdd = getCacheAddress(currentAddress).balanceETH;
        }
        
        document.getElementById("amount").min = 0;
        document.getElementById("amountLabel").innerHTML = "Amount (<a href=\"#\" id=\"maxToAdd\">"+format(balanceToAdd)+" max</a>)";
        
        document.getElementById("maxToAdd").addEventListener("click", function () {
            document.getElementById("amount").value = balanceToAdd;
        })
    }
    
    function verifyTransaction(send) {
        var gasPrice = parseFloat(document.getElementById("gasPrice").value);
        var gasAmount = parseInt(document.getElementById("gasAmount").value);
        var amount = parseFloat(document.getElementById("amount").value);
        var recipient = document.getElementById("recipient").value.trim();
        var err = false;
        
        if(gasAmount != "" && gasPrice != "" && amount != "" && recipient != "") {
            var errorS = "";
            if(!web3.isAddress(recipient)) {
                err = true;
                errorS = "Recipient address is not valid.";
            } else if(gasPrice <= 0 && send) {
                err = true;
                errorS = "Gas price is too low." ;
            } else if(gasAmount <= 0 && send) {
                err = true;
                errorS = "Gas amount is too low.";
            } else if(amount < 0) {
                err = true;
                errorS = "You must choose an amount to send.";
            }
            
            if(!err) {
                gasPrice = gasPrice * 1.0e9;

                if(currentToken.tickers == "ETH") {
                    // ETH Transaction
                    var decimals = 18;
                    var balance = getCacheAddress(currentAddress).balanceETH * Math.pow(10, 18);
                    var data = "0x";
                    
                    amount = amount * Math.pow(10, 18);
                    var value = amount;
                } else {
                    // BTK Transaction
                    var decimals = 18;
                    var balance = parseFloat(currentToken.balances) * Math.pow(10, 18);
                    
                    amount = amount * Math.pow(10, 18);
                    
                    var contract = instanciateContractToken(currentToken.address);
                    var data = contract.transfer.getData(recipient, amount);
                    
                    recipient = currentToken.address;
                    var value = 0;
                }
                
                if(send) {
                    if(amount <= balance) {
                        myApp.showPreloader("Sending");

                        sendSignTransaction({
                            to: recipient,
                            value: value,
                            gas: gasAmount,
                            gasPrice: gasPrice,
                            data: data
                        });
                    } else {
                        err = true;
                        errorS = "You don't have enough funds.";
                    }
                } else {                  
                    web3.eth.estimateGas({to: recipient, value: value, data:data}, function (errorEst, val) {
                        if(!errorEst) {
                            document.getElementById("gasAmount").value = val;
                        } else {
                            err = true;
                            errorS = errorEst;
                        }
                    });
                }
            }
        } else {
            errorS = "You did not fill all the fields."
            err = true;
        }
        
        if(send && err) {
            error(errorS);
        }
    }
});