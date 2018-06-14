myApp.onPageInit('restore', function (page) {
    
    var seedHelp = 'From these 12 words, you will be able to generate an Ethereum addresses to receive and send Ether or Bitcoin Token.\
    <br/><br/>You must <strong style="color: red">write it down</strong> somewhere secure or in an encrypted file to retrieve your account if you forget your password.\
    <br/><br/><i class="fa fa-warning"></i> Bitcoin Token is not responsible for any loss of ETH or BTK by using this web wallet. It is provided as-is with no warranty or guarantee of support.';
    
    if(localStorage.getItem("firstVisitRestore") == undefined) {
        helpPopover("Seed", seedHelp, "#seed");    
        localStorage.setItem("firstVisitRestore", "true"); 
    }
    
    document.getElementById("helpRestore").addEventListener("click", function () {
        helpPopover("Seed", seedHelp, this);
    })
    
    document.getElementById("seed").value = lightwallet.keystore.generateRandomSeed(generateEntropy(256));
    
    if(localStorage.getItem("seedWhispered") != undefined) {
        document.getElementById("backRestore").addEventListener("click", function () {
            mainView.router.back();
        });
    }

    document.getElementById("restore").addEventListener("click", function () {
        var seed = document.getElementById("seed").value.trim();
        var pass = document.getElementById("newpassword").value;
        var confirmPass = document.getElementById("confirmpassword").value;

        if(seed != "" && pass != "" && confirm != "") {
            if(pass == confirmPass) {
                if(lightwallet.keystore.isSeedValid(seed)) {
                    
                    myApp.showPreloader("Initializing your wallet");

                    initNewAccount();
                    
                    initializeVault(pass, seed, function () {
                        myApp.hidePreloader();
                        mainView.router.loadPage('wallet.html');
                        
                        info("New wallet successfully initialized.");
                    });
                } else {
                    error("Invalid seed");
                }
            } else {
                error("Password confirmation failed!");
            }   
        }
        else {
            error("There are missing fields.");
        }
    });
    
    // Generate random entropy for the seed based on crypto.getRandomValues.
    function generateEntropy(length) {
        var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var i;
        var result = "";

        values = new Uint32Array(length);
        window.crypto.getRandomValues(values);
        for(var i = 0; i < length; i++)
        {
            result += charset[values[i] % charset.length];
        }
        return result;    
    }
});