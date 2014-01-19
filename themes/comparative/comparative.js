var epeek_theme = function() {
    "use strict";

    var genomeBrowsers;

    var pathToScript = epeek.scriptPath('comparative.js');

    var species_to_icon_filename = {
	'human' : "Homo_sapiens.png",
	'mouse' : "Mus_musculus.png",
    };

    // Now, gBs is an array of gBs
    var gBrowserTheme = function(gBs, div) {

	var options_pane = d3.select(div)
	    .append("div")
	    .append("p");

	options_pane
	    .append("text")
	    .text("Show gene ");

	var gene_select = options_pane
	    .append("select")
	    .on("change", gene);
	gene_select
	    .append("option")
	    .attr("value", "brca1")
	    .text("BRCA1");
	gene_select
	    .append("option")
	    .attr("value", "brca2")
	    .attr("selected", 1)
	    .text("BRCA2");
	gene_select
	    .append("option")
	    .attr("value", "phi")
	    .text("PHI");

	options_pane
	    .append("text")
	    .text("on species ");

	var species1_select = options_pane
	    .append("select")
	    .on("change", function(){species(this.value, 1)});
	species1_select
	    .append("option")
	    .attr("value", "human")
	    .attr("selected", 1)
	    .text("Human");
	species1_select
	    .append("option")
	    .attr("value", "mouse")
	    .text("Mouse");

	options_pane
	    .append("text")
	    .text("and ");

	var species2_select = options_pane
	    .append("select")
	    .on("change", function(){species(this.value, 2)});
	species2_select
	    .append("option")
	    .attr("value", "human")
	    .text("Human");
	species2_select
	    .append("option")
	    .attr("value", "mouse")
	    .attr("selected", 1)
	    .text("Mouse");

	genomeBrowsers = gBs;
	var table = d3.select(div)
	    .append("table")
	    .attr("border", "1px solid gray")
	    .attr("margin", "0px")
	    .style("border-spacing", "0px");

	var caption_row = table
	    .append("tr")

	caption_row
	    .append("td")
	    .append("p")
	    .text("Species")

	var control_td = caption_row
	    .append("td")

	// The controls pane
	// TODO: The style elements should be included in a CSS file should we have a separate stylesheet for this theme
//	var control_pane = d3.select(div)
	var control_pane = control_td
	    .append("div")
	    .attr("class", "ePeek_control_pane")
	    .style("margin-left", "auto")
	    .style("margin-right", "auto")
	    .style("width", "30%");

	var left_button = control_pane
	    .append("button")
	    .on ("click", function() {
		for (var i = 0; i < gBs.length; i++) {
		    gBs[i].left(1.2);
		}});
	left_button
	    .append("img")
	    .attr("src", pathToScript + "../../themes/pics/glyphicons_216_circle_arrow_left.png");

	var zoomin_button = control_pane
	    .append("button")
	    .on("click", function() {
		for (var i = 0; i < gBs.length; i++) {
		    gBs[i].zoom(0.8);
		}
	    });
	zoomin_button
	    .append("img")
	    .attr("src", pathToScript + "../../themes/pics/glyphicons_190_circle_plus.png");

	var zoomout_button = control_pane
	    .append("button")
	    .on("click", function() {
		for (var i = 0; i < gBs.length; i++) {
		    gBs[i].zoom(1.2);
		}
	    });
	zoomout_button
	    .append("img")
	    .attr("src", pathToScript + "../../themes/pics/glyphicons_191_circle_minus.png");

	var right_button = control_pane
	    .append("button")
	    .on ("click", function() {
		for (var i = 0; i < gBs.length; i++) {
		    gBs[i].right(1.2);
		}
	    });
	right_button
	    .append("img")
	    .attr("src", pathToScript + "../../themes/pics/glyphicons_217_circle_arrow_right.png");

	var origin_button = control_pane
	    .append("button")
	    .on ("click", function() {
		for (var i = 0; i < gBs.length; i++) {
		    gBs[i].start();
		}
	    });
	origin_button
	    .append("img")
	    .attr("src", pathToScript + "../../themes/pics/glyphicons_242_google_maps.png");

	var setupDiv = function (i) {
	    setTimeout( function() {
		var gB = gBs[i].extend_canvas({
		    left  : 25,
		    right : 25
		});

		var table_row = table
		    .append("tr");

		table_row
		    .append("td")
		    .append("img")
		    .attr("id", "ePeek_species_icon_" + i)
		    .attr("src", pathToScript + "../../themes/pics/" + species_to_icon_filename[gB.species()]);

		table_row
		    .append("td")
		    .append("div")
		    .attr("id", "ePeek_comparative" + i)

		gB(document.getElementById("ePeek_comparative" + i));

		// TODO: Should we have a getter in genome.js to retrieve this groupDiv?
		var gDiv = d3.select("#ePeek_comparative" + i + " .ePeek_groupDiv");

		// left chevron
		gDiv
		    .insert("img", ":first-child")
		    .attr("src", pathToScript + "../pics/chevron_inactive_left.png")
		    .attr("height", 150)
		    .attr("width", 25)
		    .on("click", function(){gB.left(1.2)})
		    .on("mouseover", function(){
			d3.select(this).attr("src", pathToScript + "../pics/chevron_active_left.png")
		    })
		    .on("mouseout", function(){
			d3.select(this).attr("src", pathToScript + "../pics/chevron_inactive_left.png")
		    });


		// right chevron
		gDiv
		    .append("img")
		    .attr("src", pathToScript + "../pics/chevron_inactive_right.png")
		    .attr("height", 150)
		    .attr("width", 25)
		    .on("click", function(){gB.right(1.2)})
		    .on("mouseover", function(){
			d3.select(this).attr("src", pathToScript + "../pics/chevron_active_right.png")
		    })
		    .on("mouseout", function(){
			d3.select(this).attr("src", pathToScript + "../pics/chevron_inactive_right.png")
		    });

		gB.start();
	    }, i * 1500);	    
	}


	for (var i=0; i<gBs.length; i++) {
	    setupDiv(i);
	}

    };

    var species = function(new_species, pos) {
	var index = pos-1;
	genomeBrowsers[index].species(new_species);
	genomeBrowsers[index].start();
	d3.select("#ePeek_species_icon_" + index)
	    .attr("src", pathToScript + "../../themes/pics/" + species_to_icon_filename[new_species]);
    };

    var gene = function() {
	var new_gene = this.value;
	for (var i=0; i<genomeBrowsers.length; i++) {
	    setTimeout( function(gB) {
		gB.gene(new_gene);
		gB.start();
	    }(genomeBrowsers[i]), i*1500);
	}
    };

    return gBrowserTheme;
};
