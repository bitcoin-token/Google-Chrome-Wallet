chrome.browserAction.onClicked.addListener(function (activeTab) {
	var popupWindow = window.open(
		chrome.extension.getURL("index.html"),
		"Bitcoin Token",
		"width=400, height=650"
	);
});
