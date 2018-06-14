myApp.hidePreloader();

var encSeed = localStorage.getItem("seedWhispered");

if(encSeed == undefined) { 
    mainView.router.loadPage("restore.html");
} else {
    mainView.router.loadPage("unlock.html");
}

myApp.params.swipePanel = false;
