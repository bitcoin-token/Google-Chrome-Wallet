// Initlialization of Web3 + some important functions
var infuraKey = "oEpee8qjaqatNAZFx9dV";
var ethplorerKey = "rdv2151OPAwH91";

var web3 = new Web3();
var global_keystore; // keystore (vault)
var passwordWallet; // password to decrypt the encrypted addresses

function initializeVault(password, seed, cb) {
    lightwallet.keystore.createVault(
    {
        password: password,
        seedPhrase: seed, 
        hdPathString: "m/44'/60'/0'/0"
    }, 
    function (err, ks) {
        if(!err){
            // Encrypt the seed in LocalStorage, store the password hash.
            localStorage.setItem("seedWhispered", CryptoJS.AES.encrypt(seed, password).toString());
            localStorage.setItem("passwordHashWhispered", web3.sha3(password));

            global_keystore = ks;
            passwordWallet = password;

            // Add the provider.
            web3.setProvider(new Web3.providers.HttpProvider("https://mainnet.infura.io/"+infuraKey));

            // If there is a problem in LocalStorage, initialize  again the number of addresses generated.
            if(localStorage.getItem("nbAddresses") == undefined) {
                localStorage.setItem("nbAddresses", 1);
            }

            var nbAddresses = localStorage.getItem("nbAddresses");
            newAddress(nbAddresses, password, cb);
        }
        else {
            error(err);
            error("There was a problem during initialization. Please re-install the app, be sure to have your seed written somewhere.");
        }
    })
}

// Generate a given number of addresses.
function newAddress(number, password, cb) {
    global_keystore.keyFromPassword(password, function (err, pwDerivedKey) {
        global_keystore.generateNewAddress(pwDerivedKey, number);
        cb();
    });
}

function initNewAccount() {
    localStorage.setItem("nbAddresses", 1);
    localStorage.setItem("gasPrice", 10);
    localStorage.removeItem("cacheWallet");
    localStorage.removeItem("customAccounts");
}

function getAddresses() {
    var addresses = global_keystore.getAddresses();
    var customAccounts = localStorage.getItem("customAccounts");

    if(customAccounts == undefined) {
        customAccounts = [];
        localStorage.setItem("customAccounts", "[]");
    } else {
        customAccounts = JSON.parse(customAccounts);
        for(var i = 0; i < customAccounts.length; i++) {
            addresses.push(customAccounts[i].public);
        }
    }
    return addresses;
}

function exportPrivateKey(currentAddress, pwDerivedKey) {    
    return global_keystore.exportPrivateKey(currentAddress, pwDerivedKey);
}

function sendSignTransaction(values) {
    let currentAddress = localStorage.getItem("currentAddress");
    
    if(values.gasPrice == undefined) {
        values.gasPrice = localStorage.getItem("gasPrice") * Math.pow(10, 9);    
    }
    
    global_keystore.keyFromPassword(passwordWallet, function (err, pwDerivedKey) {
        web3.eth.getTransactionCount(currentAddress, function (err1, nonce) {
            values.nonce = nonce;

            web3.eth.sendRawTransaction(ethSigner.sign(values, "0x"+exportPrivateKey(currentAddress, pwDerivedKey)), function(err2, txHash) {
                if(err2) {
                    error(err2);
                } else {
                    // Initialize the IndexedDB
                    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
                    // Open or create the DB.
                    var dbOpen = indexedDB.open("Wallet", 1);

                    dbOpen.onsuccess = function () {
                        var db = dbOpen.result;
                        var tx = db.transaction(["PendingTxs"], "readwrite");
                        var objectStore = tx.objectStore("PendingTxs");

                        objectStore.add({
                            address: currentAddress, 
                            txHash: txHash
                        });

                        tx.oncomplete = function () {
                            db.close();
                        };
                    }
                    myApp.hidePreloader();

                    successModal("Your transaction has been sent. <a target=\"_blank\" class=\"external\" href=\"https://etherscan.io/tx/"+txHash+"\">Transaction Etherscan Link</a>");

                    mainView.router.back();
                }
            });
        });  
    });
}
