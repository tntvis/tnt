var epeek_theme_track_resize = function() {

    var pathToScript = epeek.utils.script_path("resize.js");

    var theme = function(gB, div) {
	var div_theme = d3.select(div);
	var div_id = div_theme.attr("id");

	div_theme
	    .style("border", "1px solid gray");

	var table = div_theme
	    .append("table")
	    .attr("border", "0px")
	    .attr("margin", "0px")
	    .style("border-spacing", "0px");

	var table_row1 = table
	    .append("tr");
	table_row1
	    .append("td")
	    .append("div")
	    .attr("id", "ePeek_browser_comes_here");
	gB(document.getElementById("ePeek_browser_comes_here"));

	table_row1
	    .append("td")
	    .append("img")
	    .attr("src", pathToScript + "../pics/chevron_active_right.png")
	    .on("click", function() {
		gB.width(900);
	    });

	var table_row2 = table
	    .append("tr");
	table_row2
	    .append("td")
	    .style("text-align", "center")
	    .append("img")
	    .attr("src", pathToScript + "../pics/chevron_active_right.png")
	    .on("click", function() {
		gB.height(300);
	    });

	gB.start();

    };
    return theme;

};