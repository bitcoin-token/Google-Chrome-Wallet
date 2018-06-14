myApp.onPageInit('address', function (page) {
    var currentAddress = localStorage.getItem("currentAddress");

    // Initialize the IndexedDB
    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
    // Open or create the DB.
    var dbOpen = indexedDB.open("Wallet", 1);

    document.getElementById("back").addEventListener("click", function () {
        mainView.router.loadPage("wallet.html");
    });
    
    loadAddress();
    loadTokens();
    update();
    
    function update(cb = function () {}) {
        updateEthPrice(function () {});
        updateWallet(currentAddress, function (err, currentCache) {
            if(!err) {
                setCacheAddress(currentAddress, currentCache);
                loadAddress();
                loadTokens();
                loadPendingTxs();
                loadCompletedTxs()
                loadLastTxs(function () {
                    cb();
                });
            }
            else {
                error(err);
            }
        });
    }
    
    function loadAddress() {
        var cacheAddress = getCacheAddress(currentAddress);

        if(cacheAddress != undefined) {
            document.getElementById("accountName").innerHTML = cacheAddress.accountName;
            document.getElementById("currentAddress").innerHTML = escapeHtml(cacheAddress.address);
            document.getElementById("balanceAddressETH").innerHTML = escapeHtml(format(cacheAddress.balanceETH));
            document.getElementById("balanceAccountUSD").innerHTML = "$"+format(cacheAddress.balanceAccountUSD, 2);
        }
        else {
            error("Cache error, try to reinstall the app...")
        }

        jdenticon.update("#jdenticon", currentAddress);
    }
    
    function loadTokens() {
        var cacheToken = getCacheAddress(currentAddress).tokens;

        if(cacheToken.length === 0) {
            let address = '0xdb8646f5b487b5dd979fac618350e85018f557d4';
            let missing = true;
            let cacheAddress = getCacheAddress(currentAddress);

            for(var i = 0; i < cacheAddress.tokens.length; i++) {
                if(cacheAddress.tokens[i].address == address) {
                    missing = false;
                    break;
                }
            }

            if(missing) {
                cacheAddress.tokens.push({address:address});
            }
            setCacheAddress(currentAddress, cacheAddress);
            update();
        }

        if(cacheToken != undefined && cacheToken.length === 1) {
            document.getElementById("balances").innerHTML = escapeHtml(format(cacheToken[0].balances));
            document.getElementById("sendBTK").addEventListener("click", (function (arg1) {
                return function () {
                    localStorage.setItem("tokenToSend", arg1);
                    mainView.router.loadPage("send.html");  
                };
            })(0),false);

            document.getElementById("showAddButton").style.display = 'none'; 
        }
    }

    function loadPendingTxs() {
        let struct = "";
        let pendingTxs = getPendingTxs();

        pendingTxs.onsuccess = function () {
            let len = pendingTxs.result.length;

            for (var i = 0; i < len; i++) {
                struct += addStructurePendingTxs(i);
            }

            document.getElementById("pendingTxsList").innerHTML = struct;

            for (var j = 0; j < len; j++) {
                let txHash = pendingTxs.result[j].txHash;

                document.getElementById("pendingEtherscanLink" + j).href = "https://etherscan.io/tx/" + txHash;
                document.getElementById("hash" + j).innerHTML = txHash;
            }
        };
    }

    function getPendingTxs() {
        var db = dbOpen.result;
        var tx = db.transaction(["PendingTxs"], "readwrite");
        var objectStore = tx.objectStore("PendingTxs");
        
        index = objectStore.index("address");

        return index.getAll(currentAddress);
    }

    function loadCompletedTxs() {
        let struct = "";
        let completedTxs = getCompletedTxs();

        completedTxs.onsuccess = function () {
            let len = completedTxs.result.length;

            for (var i = 0; i < len; i++) {
                struct = addStructureTxs(i) + "" + struct;
            }

            document.getElementById("txsList").innerHTML = struct;

            for (var j = 0; j < len; j++) {
                let timestamp = new Date(completedTxs.result[j].timestamp * 1000).toDateString();

                document.getElementById("tx" + j).innerHTML = completedTxs.result[j].amount;
                document.getElementById("timestamp" + j).innerHTML = timestamp;
                document.getElementById("toFrom" + j).innerHTML = completedTxs.result[j].toFrom;
                document.getElementById("tximage" + j).innerHTML = completedTxs.result[j].imageTx;
                document.getElementById("etherscanLink" + j).href = "https://etherscan.io/tx/" + completedTxs.result[j].hash;
            }
        };
    }

    function getCompletedTxs() {
        var db = dbOpen.result;
        var tx = db.transaction(["CompletedTxs"], "readwrite");
        var objectStore = tx.objectStore("CompletedTxs");
        
        index = objectStore.index("address");

        return index.getAll(currentAddress);
    }

    function getLastCompletedTxTimestamp() {
        var db = dbOpen.result;
        var tx = db.transaction(["CompletedTxs"], "readonly");
        var objectStore = tx.objectStore("CompletedTxs");
        var lastTxTimestamp = 0;
        
        var index = objectStore.index("address");

        return index.openCursor(currentAddress, 'prev');
    }
    
    function loadLastTxs(cb = function () {}) {
        var arrayTxs = [];
        var abiBitcoinToken = JSON.parse('[{"constant":false,"inputs":[{"name":"newSize","type":"uint256"}],"name":"setMetadataSize","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_amount","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"metadataSize","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"totalSupply","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"messageContent","type":"string"},{"name":"messageTitle","type":"string"},{"name":"amountBonusToken","type":"uint256"}],"name":"sendMessage","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"pricePerMessage","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newPrice","type":"uint256"}],"name":"setPriceCreatingChannel","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"burn","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"channel","type":"string"}],"name":"getOwner","outputs":[{"name":"ownerOfChannel","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"user","type":"address"}],"name":"getRank","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"user","type":"address"}],"name":"getMetadataUser","outputs":[{"name":"metadataOfUser","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"metadata","type":"string"}],"name":"setMetadataUser","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"channelName","type":"string"},{"name":"metadata","type":"string"}],"name":"setMetadataChannels","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"amounts","type":"uint256[]"},{"name":"addresses","type":"address[]"}],"name":"transferMultipleDifferentValues","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newMax","type":"uint256"}],"name":"setMaxCharacters","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"channelName","type":"string"}],"name":"buyChannel","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"maxCharacters","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"channel","type":"string"}],"name":"getPriceChannel","outputs":[{"name":"price","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_amount","type":"uint256"},{"name":"addresses","type":"address[]"}],"name":"transferMultiple","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"channelName","type":"string"},{"name":"price","type":"uint256"}],"name":"sellChannel","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"channelMaxSize","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newPrice","type":"uint256"}],"name":"setPricePerMessage","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newSymbol","type":"string"}],"name":"setSymbol","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newSize","type":"uint256"}],"name":"setPriceChannelMaxSize","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newName","type":"string"}],"name":"setName","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"channel","type":"string"}],"name":"getMetadataChannel","outputs":[{"name":"metadataOfChannel","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"channelName","type":"string"}],"name":"createChannel","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"priceCreatingChannel","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"user","type":"address"},{"name":"newRank","type":"uint256"}],"name":"setRank","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address[]"},{"name":"messageContent","type":"string"},{"name":"messageTitle","type":"string"},{"name":"amountBonusToken","type":"uint256"}],"name":"sendMultipleMessages","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"channelName","type":"string"},{"name":"messageContent","type":"string"}],"name":"sendMessageToChannel","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"from","type":"address"},{"indexed":false,"name":"to","type":"address"},{"indexed":false,"name":"bonus","type":"uint256"},{"indexed":false,"name":"messageContent","type":"string"},{"indexed":false,"name":"messageTitle","type":"string"},{"indexed":false,"name":"timestamp","type":"uint256"}],"name":"MessageSent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"from","type":"address"},{"indexed":false,"name":"channel","type":"string"},{"indexed":false,"name":"messageContent","type":"string"},{"indexed":false,"name":"timestamp","type":"uint256"}],"name":"MessageSentToChannel","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"lastOne","type":"uint256"},{"indexed":false,"name":"newOne","type":"uint256"}],"name":"pricePerMessageChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"lastOne","type":"uint256"},{"indexed":false,"name":"newOne","type":"uint256"}],"name":"priceCreatingChannelChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"channelName","type":"string"},{"indexed":false,"name":"buyer","type":"address"},{"indexed":false,"name":"seller","type":"address"}],"name":"ChannelBought","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"channelName","type":"string"},{"indexed":false,"name":"creator","type":"address"}],"name":"ChannelCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_spender","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Approval","type":"event"}]');
        const decoder = ethAbi.logDecoder(abiBitcoinToken);
        var cacheAddress = getCacheAddress(currentAddress);

        $.ajax({
            url: 'https://api.ethplorer.io/getAddressHistory/'+currentAddress+'?apiKey='+ethplorerKey,
            success: function (listTxs) {
                listTxs = listTxs['operations'];
                
                for(var i = 0; i < listTxs.length; i++) {
                    arrayTxs.push(escapeHtml(listTxs[i].transactionHash));
                }

                async.map(arrayTxs, web3.eth.getTransactionReceipt, function (errorLogs, logs) {
                    let request = getLastCompletedTxTimestamp();

                    request.onsuccess = function (event) {
                        let lastTxTimestamp = 0;

                        if(event.target.result) {
                            lastTxTimestamp = event.target.result.value.timestamp;
                        }

                        for(var i = logs.length - 1; i >= 0; i--) {
                            var event = decoder(logs[i].logs);
                            var currentEvent = event[0];

                            if(listTxs[i].timestamp > lastTxTimestamp) {
                                if(currentEvent._eventName == "Transfer" && (currentEvent._to == currentAddress || currentEvent._from == currentAddress)) {       
                                    var toFrom, color, plusMinus, image;

                                    if(currentEvent._to != currentAddress) { 
                                        toFrom = escapeHtml(currentEvent._from);
                                        plusMinus = "-";
                                        color = "#333";
                                        image = '<i class="far fa-arrow-alt-circle-up" style="font-size: 23px;"></i>';
                                    } else { 
                                        toFrom = escapeHtml(currentEvent._to);
                                        plusMinus = "+";
                                        color = "#00CE47";
                                        image = '<i class="far fa-arrow-alt-circle-down" style="font-size: 23px;"></i>';
                                    }

                                    var amount = '<span style="color:'+color+'">'+plusMinus+''+format(parseFloat(escapeHtml(currentEvent._value) / Math.pow(10, 18))) + ' BTK</span>';
                                }

                                var db = dbOpen.result;
                                var tx = db.transaction(["CompletedTxs"], "readwrite");
                                var objectStore = tx.objectStore("CompletedTxs");

                                objectStore.add({
                                    address: currentAddress,
                                    hash: arrayTxs[i], 
                                    imageTx: image,
                                    timestamp: listTxs[i].timestamp,
                                    toFrom: toFrom,
                                    amount: amount
                                });                           

                                loadCompletedTxs()
                            }
                        }
                    };

                    // Update Pending.
                    let pendingTxs = getPendingTxs();

                    pendingTxs.onsuccess = function () {
                        for(var i = 0; i < listTxs.length; i++) {
                            let completedHash = listTxs[i].transactionHash;
                            let len = pendingTxs.result.length;

                            for(var j = 0; j < len; j++) {
                                if(pendingTxs.result[j].txHash === completedHash) {
                                    var db = dbOpen.result;
                                    var tx = db.transaction(["PendingTxs"], "readwrite");
                                    var objectStore = tx.objectStore("PendingTxs");

                                    var objectStoreRequest = objectStore.delete(pendingTxs.result[j].id);

                                    objectStoreRequest.onsuccess = function () {
                                        loadPendingTxs();
                                    };                                    
                                }
                            }
                        }
                    };

                    cb();
                })
            }
        });
    }
    
    document.getElementById("updateAddress").addEventListener("click", function () {
        myApp.closeModal();
        myApp.showPreloader("Updating the data");
        update(function () { 
            myApp.hidePreloader();
        });
    });
                      
    document.getElementById("copyPublicAddress").addEventListener("click", function () {
        myApp.closeModal();
        if(copyToClipboard(currentAddress)) {
            info("Public address successfully copied to clipboard.");
        }
    });
    
    document.getElementById("moreActions").addEventListener("click", function () {  
        var popoverHTML = '<div class="popover">'+
                            '<div class="popover-inner">'+
                            '<div class="list-block">'+
                            '<ul>'+
                                '<li><a href="#" class="item-link list-button" id="sendETH">Send Ether (ETH)</li>'+
                                '<li><a href="#" class="item-link list-button" id="showPrivateKey">Export private key</li>'+
                                '<li><a href="#" class="item-link list-button" id="rename">Edit account name</li>'+
                                '<li><a href="#" class="item-link list-button" id="viewEtherscan">View on Etherscan</li>'+
                            '</ul>'+
                            '</div>'+
                            '</div>'+
                            '</div>';

        myApp.popover(popoverHTML, this);
            
        document.getElementById("sendETH").addEventListener("click", function () {
            myApp.closeModal();
            localStorage.setItem("tokenToSend", -2);
            mainView.router.loadPage("send.html");
        });
                                    
        document.getElementById("showPrivateKey").addEventListener("click", function () {
            myApp.closeModal();
            myApp.modalPassword('Password?', "Export Private Key", function (value) {
                if(localStorage.getItem("passwordHashWhispered") == web3.sha3(value)) {
                    global_keystore.keyFromPassword(value, function (err, pwDerivedKey) {
                        infoModal("Your private key is : <br/><br/><strong style=\"overflow-wrap: break-word;color:red\">"+exportPrivateKey(currentAddress,pwDerivedKey)+"</strong><br/><br/>Please be careful, do not send it to anyone !");
                    });
                }
                else {
                    error("Invalid password");
                }
            });
        });
                            
        document.getElementById("rename").addEventListener("click", function () {
            myApp.closeModal();
            myApp.prompt('New name', 'Edit Account Name', function (value) {
                value = escapeHtml(value);
                
                var cacheAddress = getCacheAddress(currentAddress);

                document.getElementById("accountName").innerHTML = value;
                cacheAddress.accountName = value;
                setCacheAddress(currentAddress, cacheAddress);
            });
        });
                            
        document.getElementById("viewEtherscan").addEventListener("click", function () {
            myApp.closeModal();
            window.open("https://etherscan.io/address/" + currentAddress);
        });
    });

    document.getElementById("addToken").addEventListener("click", function () {
        myApp.closeModal();

        let address = '0xdb8646f5b487b5dd979fac618350e85018f557d4';
        let missing = true;
        let cacheAddress = getCacheAddress(currentAddress);

        for(var i = 0; i < cacheAddress.tokens.length; i++) {
            if(cacheAddress.tokens[i].address == address) {
                missing = false;
                break;
            }
        }

        if(missing) {
            cacheAddress.tokens.push({address:address});
        }
        setCacheAddress(currentAddress, cacheAddress);
        update();
    });
    
    document.getElementById("helpTokens").addEventListener("click", function () {
       helpPopover("BTK Tokens / Transfers",'<strong>BTK Tokens</strong> : shows the balance of BTK tokens on this Ethereum address.<br/><br/><strong>Transfers</strong> : it is the list of all the token transfers on this account.', this);
    });
    
    document.getElementById("helpAccount").addEventListener("click", function () {
       helpPopover("Account",'You can see how many Ethers you have on this account (<strong>you need Ethers to send transactions to pay the mining fees</strong>). You can also copy your <strong>public address</strong> by clicking on <i class="far fa-clone"></i>.<br/><br/> All the other actions such as <strong>exporting your private key</strong> can be done by clicking on <i class="fas fa-ellipsis-v"></i>', this);
    });

    function addStructurePendingTxs(i) {
        return '\
        <a href="#" target="_blank" class="item-link item-content external" style="padding-left: 6px;" id="pendingEtherscanLink'+i+'">\
        <li class="item-content" style="width: 99%; border-bottom: 1px solid #eee;">\
            <div class="item-media" style="margin-top: 15px; min-width: 20px; color: #ccc;"><i class="fas fa-spinner fa-pulse"></i></div>\
            <div class="item-inner">\
                <div class="item-title-row">\
                    <div class="item-title" style="font-size: 12px; color: #ccc;">Pending...</div>\
                </div>\
                <div class="item-subtitle" style="color: #ccc;" id="hash'+i+'"></div>\
                </div>\
            </div>\
            <div class="item-after" id="date'+i+'"></div>\
        </li>\
        </a>';
    }
        
    function addStructureTxs(i) {
        return '\
        <a href="#" target="_blank" class="item-link item-content external" style="padding-left: 6px;" id="etherscanLink'+i+'">\
        <li class="item-content" style="width: 99%; border-bottom: 1px solid #eee;">\
            <div class="item-media" id="tximage'+i+'" style="margin-top: 15px; min-width: 20px; color: #999;"></div>\
            <div class="item-inner">\
                <div class="item-title-row">\
                    <div class="item-title" id="tx'+i+'"></div>\
                    <div class="item-title" style="font-size: 11px; color: #666; margin-top: 3px;" id="timestamp'+i+'"></div>\
                </div>\
                <div class="item-subtitle" id="toFrom'+i+'"></div>\
                <span id="message'+i+'"></span>\
                </div>\
            </div>\
            <div class="item-after" id="date'+i+'"></div>\
        </li>\
        </a>';
    }
    
    function addStructureToken(i) {
        return '\
        <li class="swipeout" style="width:100%">\
            <div class="swipeout-content">\
                <div class="item-content">\
                    <div class="item-media" id="mediaimage'+i+'">\
                        <img src="assets/img/icons/icon_48.png">\
                    </div>\
                    <div class="item-inner">\
                        <div class="item-title-row">\
                            <div class="item-title">Bitcoin Token</div>\
                        </div>\
                        <div class="item-subtitle"><span id="balances'+i+'"></span> <span id="tickers'+i+'"></span> <span style="color: #c0c0c0;"></span></div>\
                    </div>\
                    <div class="item-after"><a href="#" class="button button-fill button-raised" id="send'+i+'" style="margin-right: 10px; margin-top: 7px;">Send</a></div>\
                </div>\
            </div>\
        </li>';
    }
});