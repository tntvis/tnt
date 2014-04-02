var epeek_theme_track_buttons = function() {

    var factor = 0.2;
    var gBrowser;

    var path = epeek.utils.script_path("buttons.js");

    var theme = function(gB, div) {
	gBrowser = gB;

	var control_panel = d3.select(div)
	    .append("div")
	    .attr("id", "ePeek_buttons_controlPanel")
	    .style("margin-left",  "auto")
	    .style("margin-right", "auto")
	    .style("width",        "70%");

	var left_button = control_panel
	    .append("button")
	    .attr("title", "go left")
	    .on("click", theme.left);
	left_button
	    .append("img")
	    .attr("src", path + "../../themes/pics/glyphicons_216_circle_arrow_left.png");

	var zoomIn_button = control_panel
	    .append("button")
	    .attr("title", "zoom in")
	    .on("click", theme.zoomIn)
	zoomIn_button
	    .append("img")
	    .attr("src", path + "../../themes/pics/glyphicons_191_circle_minus.png");

	var zoomOut_button = control_panel
	    .append("button")
	    .attr("title", "zoom out")
	    .on("click", theme.zoomOut);
	zoomOut_button
	    .append("img")
	    .attr("src", path + "../../themes/pics/glyphicons_190_circle_plus.png");

	var right_button = control_panel
	    .append("button")
	    .attr("title", "go right")
	    .on("click", theme.right);
	right_button
	    .append("img")
	    .attr("src", path + "../../themes/pics/glyphicons_217_circle_arrow_right.png");

	var draggability_button = control_panel
	    .append("button")
	    .attr("title", "Disable dragging")
	    .on("click",theme.toggle_draggability);
	draggability_button
	    .append("img")
	    .attr("id", "ePeek_buttons_draggability") // WARNING: This doesn't support independent multiple instances of the control panel
	    .attr("src", path + "../../themes/pics/noHand-cursor-icon.png")
	    .attr("width", "20px")
	    .attr("height", "20px");

	var buttons_sensibility = control_panel
	    .append("span")
	    .style("font-size" , "12px")
	    .text("Buttons sensibility: 0");
	buttons_sensibility
	    .append("input")
	    .attr("type", "range")
	    .attr("min", "0")
	    .attr("max", "1.0")
	    .attr("step", "0.1")
	    .attr("value", "0.2")
	    .on("change", function(d){theme.set_factor(this.value)});
	buttons_sensibility
	    .append("text")
	    .text("1");

	var gene_track = epeek.track.track.gene()
	    .height(200)
	    .foreground_color("#586471")
	    .plotter(epeek.track.feature.gene());

	gB(div);

	gB.add_track(gene_track)

	gB.start();
    };

    theme.set_factor = function(val) {
	factor = parseFloat(val);
    };

    theme.toggle_draggability = function() {
	var div_id = "ePeek_buttons_draggability";
	if (gBrowser.allow_drag()) {
            d3.select("#" + div_id)
		.attr("src", path + "../../themes/pics/noHand-cursor-icon.png")
		.attr("title", "Enable dragging");
            gBrowser.allow_drag(false);
	} else {
            d3.select("#" + div_id)
		.attr("src", path + "../../themes/pics/Hand-cursor-icon.png")
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

    theme.start = function() {
	gBrowser.start();
    };

    return theme;
};
