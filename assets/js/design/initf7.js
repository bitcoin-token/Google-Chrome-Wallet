var myApp = new Framework7({
    swipePanel: 'left',
    animateNavBackIcon: true,
    material: true,
    smartSelectOpenIn:'picker',
    externalLinks: '.external'
});

var $$ = Dom7;
var mainView = myApp.addView('.view-main');

myApp.showPreloader("Loading scripts");

function error(text) {
    myApp.alert(text, "<center style=\"color:red\">ERROR</center>");
}

function info(text) {
    myApp.addNotification({
        message: text,
        button: {
            text: 'Close',
            color: 'orange'
        }
    });
}

function infoModal(text) {
    myApp.alert(text,"<center style=\"color:green\">Info</center>");
}

function successModal(text) {
    myApp.alert(text,"<center style=\"color:green\">Success</center>");
}

function helpPopover(title, text, target) {
    myApp.popover('<div class="popover"><div class="popover-inner"><div class="content-block"><p><div class="small-caps">Help : '+title+'</div><hr/>'+text+'</p></div></div></div>', target);
}