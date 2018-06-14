myApp.onPageInit('unlock', function (page) {

    document.getElementById("unlock").addEventListener("click", function () {
        unlockWallet(document.getElementById("password").value);
    });
    
    function unlockWallet(password) {
        if(web3.sha3(password) != localStorage.getItem("passwordHashWhispered")) {
            error("Invalid password");
        } else {
            let seed = CryptoJS.AES.decrypt(encSeed, password).toString(CryptoJS.enc.Utf8);

            myApp.showPreloader("Decrypting your seed");

            initializeVault(password, seed, function () {
                myApp.hidePreloader();
                mainView.router.loadPage('wallet.html');
            });
        }
    }
});
