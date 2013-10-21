var epeek_theme = function() {

    var factor = 0.2;
    var gBrowser;

    var theme = function(gB, div) {
	gBrowser = gB;
	gB(div);
	gB.startOnOrigin();
    };

    theme.set_factor = function(div_id) {
	factor = parseFloat(document.getElementById(div_id).value);
	d3.select("#" + div_id).attr("title", factor);
    };

    theme.toggle_draggability = function(div_id) {
	if (gBrowser.allow_drag()) {
            d3.select("#" + div_id)
		.attr("src", "../pics/noHand-cursor-icon.png")
		.attr("title", "Enable dragging");
            gBrowser.allow_drag(false);
	} else {
            d3.select("#" + div_id)
		.attr("src", "../pics/Hand-cursor-icon.png")
		.attr("title", "Disable dragging");
            gBrowser.allow_drag(true);
	}
    };

    theme.left = function() {
	gBrowser.left(1+factor);
    };

    theme.right = function() {
	gBrowser.right(1+factor);
    };

    theme.zoomIn = function() {
	gBrowser.zoom(1+factor);
    };

    theme.zoomOut = function() {
	gBrowser.zoom(1/(1+factor));
    };

    theme.startOnOrigin = function() {
	gBrowser.startOnOrigin();
    };

    return theme;
};
