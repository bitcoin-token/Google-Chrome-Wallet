myApp.onPageInit('wallet', function (page) {

    // Initialize the IndexedDB
    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
    // Open or create the DB.
    var dbOpen = indexedDB.open("Wallet", 1);
    // Create the schema
    dbOpen.onupgradeneeded = function () {
        var db = dbOpen.result;

        // Pending Transactions
        var objectStore = db.createObjectStore("PendingTxs", {
            keyPath: "id",
            autoIncrement: true
        });
        objectStore.createIndex("address", "address", { unique: false });
        objectStore.createIndex("txHash", "txHash", { unique: false });

        // Completed Transactions
        var objectStoreTxs = db.createObjectStore("CompletedTxs", {
            keyPath: "id",
            autoIncrement: true
        });
        objectStoreTxs.createIndex("address", "address", { unique: false });
        objectStoreTxs.createIndex("hash", "hash", { unique: false });
        objectStoreTxs.createIndex("imageTx", "imageTx", { unique: false });
        objectStoreTxs.createIndex("timestamp", "timestamp", { unique: false });
        objectStoreTxs.createIndex("toFrom", "toFrom", { unique: false });
        objectStoreTxs.createIndex("amount", "amount", { unique: false });

        db.close();
    };
   
    myApp.params.swipePanel = 'left';
    
    loadAddresses();
    update();
    
    function update(cb = function () {}) {
        var a, b = false;
        var callback = function () {
            if(a && b) {
                loadAddresses();
                cb();
            }
        }
        
        var addresses = getAddresses();

        updateEthPrice(function () {
            a = true;
            callback();
        });

        async.map(addresses, updateWallet, function (err, cacheAddress) {
            b = true;
            var cacheWallet = [];
            for(var i = 0; i < addresses.length; i++) {
                if(!err || (err && !err[i])) {
                    cacheWallet.push(cacheAddress[i]);
                } else {
                    error(err);
                }
            }

            localStorage.setItem("cacheWallet", JSON.stringify(cacheWallet));
            callback();
        });
    }
    
    function loadAddresses() {
        var addresses = getAddresses();
        
        let struct = "";

        for(var i = 0; i < addresses.length; i++) {
            struct += addStructure(i);
        }
        
        document.getElementById('addressesList').innerHTML = struct;

        var cacheWallet = localStorage.getItem("cacheWallet");

        if(cacheWallet != undefined) {
            let total = 0;
            let balanceAccountBTKUSD = 0;

            cacheWallet = JSON.parse(cacheWallet);
            
            for(var j = 0; j < addresses.length; j++) {
                if(cacheWallet[j] != null) {
                    let cacheToken = cacheWallet[j].tokens;

                    if(cacheToken != undefined && cacheToken.length > 0) {
                        balanceAccountBTKUSD = cacheToken[0].balances * localStorage.getItem("bitcointokenPrice");
                        document.getElementById("balanceBTK" + j).innerHTML = escapeHtml(format(cacheToken[0].balances) + ' BTK');
                        document.getElementById("balanceAccountBTKUSD" + j).innerHTML = "$" + format(balanceAccountBTKUSD, 2);
                    } else {
                        document.getElementById("balanceBTK" + j).innerHTML = '0 BTK';
                        document.getElementById("balanceAccountBTKUSD" + j).innerHTML = "$0";
                    }

                    document.getElementById("accountName" + j).innerHTML = cacheWallet[j].accountName;
                    document.getElementById("balanceETH" + j).innerHTML = format(cacheWallet[j].balanceETH) + ' ETH';
                    document.getElementById("balanceAccountUSD" + j).innerHTML = "$" + format(cacheWallet[j].balanceAccountUSD, 2);

                    total += cacheWallet[j].balanceAccountUSD;
                    total += balanceAccountBTKUSD;

                    jdenticon.update("#imageWallet" + j, cacheWallet[j].address);

                    document.getElementById("address" + j).addEventListener("click", (function (arg) {
                        return function () {
                            localStorage.setItem("currentAddress", addresses[arg]);
                            localStorage.setItem("numberCurrentAccount", arg);

                            mainView.router.loadPage("address.html");
                        };
                    })(j), false);
                }
            }
            document.getElementById("totalDollars").innerHTML = format(total, 2);
        }
    }
        
    function addStructure(i) {
        return '\
        <li style="width: 100%; border-bottom: 1px solid #ddd;">\
            <a href="#" class="item-link item-content">\
            <div class="item-media" style="margin-left: -10px; margin-top: 10px;"><canvas width="60" id="imageWallet'+i+'" height="60"></canvas></div>\
            <div class="item-inner" style="background-color: none;" id="address'+i+'">\
                <div class="item-title-row">\
                    <div class="item-title" style="color: #333;"><span id="accountName'+i+'"></span></div>\
                </div>\
                <div class="item-subtitle" style="margin-top: 5px; padding-bottom: 5px; border-bottom: 1px solid #ddd;">\
                    <div style="display: flex; justify-content: space-between; align-items: center;">\
                        <span style="color: #333;" id="balanceETH'+i+'"></span>\
                        <span style="color: #666;" id="balanceAccountUSD'+i+'"></span>\
                    </div>\
                </div>\
                <div class="item-subtitle" style="margin-top: 5px;">\
                    <div style="display: flex; justify-content: space-between; align-items: center;">\
                        <span style="color: #333;" id="balanceBTK'+i+'"></span>\
                        <span style="color: #666;" id="balanceAccountBTKUSD'+i+'"></span>\
                    </div>\
                </div>\
            </div>\
            </a>\
        </li>'; 
    }
      
    document.getElementById("update").addEventListener("click", function () {
        myApp.showPreloader("Updating the data");
        update(function () { 
            myApp.hidePreloader() 
        }); 
    });
    
    document.getElementById("helpBalance").addEventListener("click", function () {
       helpPopover("Balance",'It displays the total value of all your tokens and Ethers converted to <strong>USD</strong> (American dollar) according to the market price.', this);
    });
    
    document.getElementById("helpAccounts").addEventListener("click", function () {
       helpPopover("Accounts",'<strong>Accounts</strong> : it is the list of all of your Ethereum addresses. Each address can store Ethers and BTK Tokens. In order to see the details about an address, click on it in this list. You can generate or import addresses by clicking on the floating <i class="icon f7-icons" style="font-size:15px;">add_round</i> at the bottom of this page.', this);
    });
    
    document.getElementById("generateNewAddress").addEventListener("click", function () {
        myApp.closeModal();
        newAddress(1, passwordWallet, function () {
            var addresses = getAddresses();

            document.getElementById("addressesList").innerHTML += addStructure(addresses.length);

            localStorage.setItem("nbAddresses", parseInt(localStorage.getItem("nbAddresses")) + 1);

            info("New address successfully generated."); 
            update();
        });
    });
    
    document.getElementById("addPrivateKey").addEventListener("click", function () {
        var addresses = getAddresses();

        myApp.closeModal();
        myApp.prompt("Private key ?", "Import address", function (privateKey) {
            privateKey = privateKey.trim();
            
            var publicKey = window.ethAccount.privateToAccount(privateKey).address.toLowerCase();

            if(web3.isAddress(publicKey)) {
                var customAccounts = JSON.parse(localStorage.getItem("customAccounts"));
                document.getElementById("addressesList").innerHTML += addStructure(addresses.length);
                
                customAccounts.push({
                    public: publicKey,
                    private: CryptoJS.AES.encrypt(privateKey, passwordWallet).toString()
                });

                localStorage.setItem("customAccounts", JSON.stringify(customAccounts));

                info("New account successfully imported.");
                
                update();
            } else {
                error("Private key is not working.");
            }
        });
    });
});
