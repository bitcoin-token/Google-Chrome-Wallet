function updateEthPrice(cb = function () {}) {
    $.ajax({
        url: "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD",
        success: function (eth) {
            localStorage.setItem("ethereumPrice", eth.USD);
            cb();
        },
        dataType: "json"
    });
    
    $.ajax({
        url: "https://btk.community/api/price.php",
        success: function (btk) {
            localStorage.setItem("bitcointokenPrice", btk.USD);
            cb();
        },
        dataType: "json"
    });
}

function updateWallet(address, cb = function () {}) {
    let cacheAddress = getCacheAddress(address);

    $.ajax({
        url: "https://api.ethplorer.io/getAddressInfo/"+address+"?apiKey="+ethplorerKey,
        success: function (listAutoTokens) {
            var cacheToken = cacheAddress.tokens;
            
            if(cacheToken == undefined) {
                cacheToken = [];
            }
            
            listAutoTokens = listAutoTokens.tokens;
            var prices = [];
            if(listAutoTokens != undefined) {
                for(var k = 0; k < listAutoTokens.length; k++) {
                    prices[listAutoTokens[k].tokenInfo.symbol] = listAutoTokens[k].tokenInfo.price.rate; // save the prices
                    
                    var ok = true;
                    for(var i = 0; i < cacheToken.length; i++) {
                        if(cacheToken[i].address == listAutoTokens[k].tokenInfo.address) {
                            ok = false;
                            break;
                        }
                    }
                    if(ok) {
                        cacheToken.push({address:listAutoTokens[k].tokenInfo.address}); // if not initialized in the cache
                    }
                }
            }
            
            var contractInstances = [];
            var parametersBalance = [];

            for(var i = 0; i < cacheToken.length; i++) {
                contractInstances.push(instanciateContractToken(cacheToken[i].address));  
                parametersBalance.push([instanciateContractToken(cacheToken[i].address), address]);
            }
                    
            var totalDollar = 0;
            
            async.map(contractInstances, getTicker, function (err, tickers) {
                async.map(contractInstances, getDecimals, function (err1, decimals) {
                    async.map(contractInstances, getName, function (err2, names) {
                        async.map(parametersBalance, getBalance, function (err3, balances) {
                            for(var i = 0; i < cacheToken.length; i++) {
                                names[i] = escapeHtml(names[i]);
                                balances[i] = escapeHtml(balances[i]);
                                tickers[i] = escapeHtml(tickers[i]);
                                decimals[i] = escapeHtml(decimals[i]);

                                if(prices[tickers[i]] == undefined) {
                                    prices[tickers[i]] = 0;
                                }
                            
                                cacheToken[i].names = names[i];
                                cacheToken[i].balances = balances[i];
                                cacheToken[i].tickers = tickers[i];
                                cacheToken[i].decimals = decimals[i];
                                cacheToken[i].price = prices[tickers[i]];
                                
                                totalDollar += balances[i] * prices[tickers[i]];
                            }
                        
                            cacheAddress.tokens = cacheToken;
                            
                            if(cacheAddress.accountName == undefined) {
                                cacheAddress.accountName = chance.animal().split(" ").slice(-1) + " Account";   
                            }
                            
                            web3.eth.getBalance(address, function (err, balanceETH) {
                                if(!err) {
                                    balanceETH = escapeHtml(balanceETH / 1.0e18);
                                    cacheAddress.balanceETH = balanceETH;

                                    cacheAddress.balanceAccountUSD = totalDollar + balanceETH * localStorage.getItem("ethereumPrice");
                                    cb(null, cacheAddress);
                                } else {
                                    cb(err);
                                }
                            });
                        });
                    });
                });
            });
        },
        dataType: "json"
    });
}
