epeek.tooltip = function() {
    "use strict";
    var path = epeek.scriptPath("ePeek.js");

    // Style options
    var bgColor;
    var fgColor;

    var drag = d3.behavior.drag()
	.origin(function(){
	    return {x:parseInt(d3.select(this).style("left")),
		    y:parseInt(d3.select(this).style("top"))
		   }
	})
	.on("drag", function() {
	    d3.select(this)
		.style("left", d3.event.x + "px")
		.style("top", d3.event.y + "px")
	});


    // TODO: Why do we need the div element?
    // It looks like if we anchor the tooltip in the "body"
    // The tooltip is not located in the right place (appears at the bottom)
    // See clients/tooltips_test.html for an example
    var container = d3.select(this).selectAncestor("div");
    if (container === undefined) {
	// We require a div element at some point to anchor the tooltip
	return
    };

    var sel = container
	.append("div")
	.attr("class", "ePeek_gene_info")
 	.classed("ePeek_gene_info_active", true)  // TODO: Is this needed/used???
	.call(drag);

    sel
	.style("left", d3.mouse(this)[0] + "px")
	.style("top", d3.mouse(this)[1] + "px");


    // Close
    sel.append("span")
	.style("position", "absolute")
	.style("right", "-10px")
	.style("top", "-10px")
	.append("img")
	.attr("src", path + "lib/close.png")
	.attr("width", "20px")
	.attr("height", "20px")
	.on("click", function() {d3.select(this).node().parentNode.parentNode.remove();});


    var tooltip = {};

    tooltip.table = function(obj) {

	// Tooltip is a table
	var obj_info_table = sel 
	    .append("table")
	    .attr("class", "ePeek_zmenu")
	    .attr("border", "solid")
	    .style("border-color", fgColor);
	
	// Tooltip header
	obj_info_table
	    .append("tr")
	    .attr("class", "ePeek_gene_info_header")
	    .append("th")
	    .style("background-color", fgColor)
	    .style("color", bgColor)
	    .attr("colspan", 2)
	    .text(obj.header.label + ": " + obj.header.value);

	// Tooltip rows
	var table_rows = obj_info_table.selectAll(".ePeek_tooltip_rows")
	    .data(obj.rows)
	    .enter()
	    .append("tr")
	    .attr("class", "ePeek_tooltip_rows");

	table_rows
	    .append("th")
	    .style("border-color", fgColor)
	    .html(function(d,i) {return obj.rows[i].label});
	
	table_rows
	    .append("td")
	    .html(function(d,i) {return obj.rows[i].value});
    };

    tooltip.plain = function(obj) {
	var tooltip_div = sel
	    .append("div")
	    .html(obj);
    };


    tooltip.header = function(obj) {
	sel
	    .append("div")
	    .attr("height", "15px")
	    .append("text")
	    .text(obj.header);

	sel
	    .append("div")
	    .html(obj.data);
    };

    tooltip.background_color = function(color) {
	if (!arguments.length) {
	    return bgColor;
	}
	bgColor = color;
	return tooltip;
    };

    tooltip.foreground_color = function(color) {
	if (!arguments.length) {
	    return fgColor;
	}
	fgColor = color;
	return tooltip;
    };

    return tooltip;
};
