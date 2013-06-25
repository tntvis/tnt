var epeek_tree = function() {
    "use strict";

    var gBs = [];

    var epeek_theme = function(div) {

	var control_pane = d3.select(div)
	    .insert("foreignObject", ":first-child")
	    .attr("width", 300)
	    .attr("height", 50)
	    .attr("x", 0)
	    .attr("y", 0)
	    .append("xhtml:body")
	    .append("div")
	    .attr("class", "ePeek_control_pane")
	    .style("margin-left", "auto")
	    .style("margin-right", "auto")
	    .style("width", "50%");

	var left_button = control_pane
	    .append("button")
	    .on ("click", function() {
		for (var i = 0; i < gBs.length; i++) {
		    gBs[i].left(1.2);
		}});
	left_button
	    .append("img")
	    .attr("src", "glyphicons_216_circle_arrow_left.png");

	var zoomin_button = control_pane
	    .append("button")
	    .on("click", function() {
		for (var i = 0; i < gBs.length; i++) {
		    gBs[i].zoom(0.8);
		}
	    });
	zoomin_button
	    .append("img")
	    .attr("src", "glyphicons_190_circle_plus.png");

	var zoomout_button = control_pane
	    .append("button")
	    .on("click", function() {
		for (var i = 0; i < gBs.length; i++) {
		    gBs[i].zoom(1.2);
		}
	    });
	zoomout_button
	    .append("img")
	    .attr("src", "glyphicons_191_circle_minus.png");

	var right_button = control_pane
	    .append("button")
	    .on ("click", function() {
		for (var i = 0; i < gBs.length; i++) {
		    gBs[i].right(1.2);
		}
	    });
	right_button
	    .append("img")
	    .attr("src", "glyphicons_217_circle_arrow_right.png");

	var origin_button = control_pane
	    .append("button")
	    .on ("click", function() {
		for (var i = 0; i < gBs.length; i++) {
		    gBs[i].startOnOrigin();
		}
	    });
	origin_button
	    .append("img")
	    .attr("src", "glyphicons_242_google_maps.png");


      var placeholders = d3.select(div).selectAll(".node")
        .filter(function(d) {return d.children === undefined ? this : 0})
        .append("foreignObject")
        .attr("width", 700)
        .attr("height", 80)
        .attr("x", 40)
        .attr("y", -30)
        .append("xhtml:body")
        .append("div")
        .attr("id", function(d){return d.species});

      for (var i = 0; i < placeholders[0].length; i++) {
         insertGenomeBrowser(i);
      }

	function insertGenomeBrowser(i) {
            setTimeout(function() {
		var obj = placeholders[0][i].__data__;
		var gB = epeek().species(obj.species).gene(obj.gene).width(600).height(50).background_color("white").foreground_color("steelblue");
		gB.genes_layout = epeek_nolayout();
		gBs.push(gB);
		var gBTheme = epeek_minimal();
		gBTheme(gB, placeholders[0][i]);

		var gDiv = d3.select("#" + obj.species + " .ePeek_groupDiv");
		console.log(gDiv);
		gDiv
		    .insert("img", ":first-child")
		    .attr("src", "glyphicons_224_chevron-left.png")
		    .on("click", function(){gB.left(1.2)});
		gDiv
		    .append("img")
		    .attr("src", "glyphicons_223_chevron-right.png")
		    .on("click", function(){gB.right(1.2)});
         }, i * 2500);
      }

    };

    return epeek_theme;
}

var epeek_nolayout = function() {
    "use strict";

    var slot_type = {
	slot_height : 30,
	gene_height : 10,
	show_label  : true
    };
    var height = 50;
    var genes = [];
    var genes_layout = function(gs) {
	for (var i = 0; i < gs.length; i++) {
	    gs[i].slot = 0;
	}
	genes = gs
	console.log("GENES:");
	console.log(genes);
    };

    genes_layout.scale = function(){};
    genes_layout.height = function(){return height}
    genes_layout.genes = function(){return genes};
    genes_layout.gene_slot = function(){return slot_type};
    return genes_layout;
};
