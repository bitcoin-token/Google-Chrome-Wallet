var entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

function timeSince(date) {
    var seconds = Math.floor((new Date() - date) / 1000);
    var interval = Math.floor(seconds / 31536000);
    
    if (interval > 1) {
        return interval + " years";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " months";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " days";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " hours";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutes";
    }
    return Math.floor(seconds) + " seconds";
}

// This function is instrumental for security and avoid JS or HTML injections in messages attached with transactions
function escapeHtml (string) {
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
        return entityMap[s];
  });
}

function escapeHtmlImage (string) {
    return String(string).replace(/[&<>"'`=]/g, function (s) {
        return entityMap[s];
  });
}

function formatFiat(number){
    if(number != null) {
        size = 3;
        var type = "";
        if(number > 1000000000) {
            number = number / 1000000000;
            type = "B";
        }
        else if(number > 1000000) {
            number = number / 1000000;
            type = "M";
        }
        else if(number > 1000){
            number = number / 1000;
            type = "K";
        }

        number = number.toString();
        for(var i = 0; i < number.length; i++) {
            if(number[i] == '.'){ 
                size++;
                break;
            }
        }

        var res = "";
        for(var i = 0; i < Math.min(size,number.length); i++) {
            if(i != Math.min(size,number.length) - 1 || number[i] != ".") {
                res = res + number[i];
            }
        }

        res = res + type;
    } else {
        var res = "0";
    }
    
    return res;
}

function format(number, decimals = 5) {
    number = Math.floor(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
    var parts = number.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

function copyToClipboard(text) {
    var success = true,
    range = document.createRange(),
    selection;

    // Create a temporary element off screen.
    var tmpElem = $('<div>');
    tmpElem.css({
        position: "absolute",
        left:     "-1000px",
        top:      "-1000px",
    });
    tmpElem.text(text);
    $("body").append(tmpElem);
    // Select temp element.
    range.selectNodeContents(tmpElem.get(0));
    selection = window.getSelection ();
    selection.removeAllRanges ();
    selection.addRange (range);
    // Lets copy.
    try { 
        success = document.execCommand ("copy", false, null);
    }
    catch (e) {
        error("Copying failed");
        return false;
    }
    
    if (success) {
    // remove temp element.
        tmpElem.remove();
    }
    
    return true;
}

function getCacheAddress(address) {
    var cache = JSON.parse(localStorage.getItem("cacheWallet"));
    if(cache != undefined){
        for(var i = 0; i < cache.length; i++) {
            if(cache[i] != null && cache[i].address == address) {
                return cache[i];
            }
        }
    }
    
    return {address:address};
}

function setCacheAddress(address, cacheAddress) {
    var cache = JSON.parse(localStorage.getItem("cacheWallet"));
    var ok = false;
    if(cache != undefined) {
        for(var i = 0; i < cache.length; i++) {
            if(cache[i].address == address) {
                cache[i] = cacheAddress;
                ok = true;
            }
        }
    }
    
    if(cache == undefined) {
        cache = [cacheAddress];
    } else if(!ok) {
        cache.push(cacheAddress);
    }
    
    localStorage.setItem("cacheWallet", JSON.stringify(cache));
}