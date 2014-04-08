var clean_div = function () {
    d3.select("#TestID").selectAll("*").remove();
};

describe("Themes", function () {
    describe("Track", function () {

	var delay = 500;
	describe("Minimal", function () {
	    after(clean_div);
	    it("Loads", function (done) {
		var st = epeek.track.genome();
		var theme = epeek_theme_track_minimal();
		theme(st, document.getElementById("TestID"));
		setTimeout(done, delay);
	    });
	});

	describe("Legend", function () {
	    after(clean_div);
	    it("Loads", function (done) {
		var st = epeek.track.genome();
		var theme = epeek_theme_track_legend();
		theme(st, document.getElementById("TestID"));
		setTimeout(done, delay);
	    });
	});

	describe("Pins", function (done) {
	    after(clean_div);
	    it("Loads", function () {
		var st = epeek.track.genome();
		var theme = epeek_theme_track_pins();
		theme(st, document.getElementById("TestID"));
		setTimeout(done, delay);
	    });
	});

	describe("Tooltips", function () {
	    after(clean_div);
	    it("Loads", function (done) {
		var st = epeek.track.genome();
		var theme = epeek_theme_track_tooltips();
		theme(st, document.getElementById("TestID"));
		setTimeout(done, delay);
	    });
	});

	describe("Resizable Div", function () {
	    after(clean_div);
	    it("Loads", function (done) {
		var st = epeek.track.genome();
		var theme = epeek_theme_track_resizable_div();
		theme(st, document.getElementById("TestID"));
		setTimeout(done, delay);
	    });
	});

	describe("Compact", function () {
	    after(clean_div);
	    it("Loads", function (done) {
		var st = epeek.track.genome();
		var theme = epeek_theme_track_compact();
		theme(st, document.getElementById("TestID"));
		setTimeout(done, delay);
	    });
	});

	describe("Buttons", function () {
	    after(clean_div);
	    it("Loads", function (done) {
		var st = epeek.track.genome();
		var theme = epeek_theme_track_buttons();
		theme(st, document.getElementById("TestID"));
		setTimeout(done, delay);
	    });
	});

	describe("Resize", function () {
	    after(clean_div);
	    it("Loads", function (done) {
		var st = epeek.track.genome();
		var theme = epeek_theme_track_resize();
		theme(st, document.getElementById("TestID"));
		setTimeout(done, delay);
	    });
	});

	describe("Mobile", function () {
	    it("Loads", function (done) {
		var st = epeek.track.genome();
		var theme = epeek_theme_track_mobile();
		theme(st, document.getElementById("TestID"));
		setTimeout(done, delay);
	    });
	});

	describe("Genome-less Minimal", function () {
	    it ("Loads", function () {
		var st = epeek.track().from(0).to(500);
		var theme = epeek_theme_track_track_minimal();
		theme (st, document.getElementById("TestID"));
	    });
	});

	describe("Swap tracks", function () {
	    it ("Loads", function () {
		var st = epeek.track().from(0).to(500);
		var theme = epeek_theme_track_swap_tracks();
		theme (st, document.getElementById("TestID"));
	    });
	});

	// describe("Comparative", function () {
	//     it("Loads", function (done) {
	// 	var st = epeek.track.genome();
	// 	var theme = epeek_theme_track_comparative();
	// 	theme(st, document.getElementById("TestID"));
	// 	setTimeout(done, 1500);
	//     });
	// });

	// describe("Orthologues Tree", function () {
	//     it("Loads", function () {
	// 	var st = epeek.track.genome();
	// 	var theme = epeek_theme_track_orthologues_tree();
	// 	theme(st, document.getElementById("TestID"));
	//     });
	// });


    });

    describe("Trees", function () {

	describe("Ensembl Species", function () {
	    after(clean_div);
	    var st = epeek.tree();
	    var theme = epeek_theme_tree_ensembl_species();

	    it("Loads", function () {
		theme(st, document.getElementById("TestID"));
	    });

	    it("Doesn't break when selecting different releases", function () {
		var sel = d3.select("#TestID").select("select");
		var cbak = sel.on("change");
		var node = sel.node();
		node.value = 13;
		cbak.call(node);
	    });

	});

	describe("Sort Nodes", function () {
	    after(clean_div);
	    var st = epeek.tree();
	    var theme = epeek_theme_tree_sort_nodes();

	    it("Loads", function () {
		theme(st, document.getElementById("TestID"));
	    });

	    it("Doesn't break when selecting different sorting/coloring criteria", function () {
		var sels = d3.select("#TestID").selectAll("select")[0];

		for (var i=0; i<sels.length; i++) {
		    var sel = sels[i];
		    var cbak = d3.select(sel).on("change");
		    sel.value = "Protein-coding genes";
		    cbak.call(sel);
		}
	    });
	});

	// describe("Layout Transition", function () {
	//     it("Loads", function () {
	// 	var st = epeek.tree();
	// 	var theme = epeek_theme_tree_layout_transition();
	// 	theme(st, document.getElementById("TestID"));
	//     });
	// });

	// describe("Species Tree", function () {
	//     it("Loads", function () {
	// 	var st = epeek.tree();
	// 	var theme = epeek_theme_tree_species_tree();
	// 	theme(st, document.getElementById("TestID"));
	//     });
	// });


	describe("Swap Nodes", function () {
	    after(clean_div);
	    it("Loads", function () {
		var st = epeek.tree();
		var theme = epeek_theme_tree_swap_nodes();
		theme(st, document.getElementById("TestID"));
	    });
	});

	describe("Tooltips", function () {
	    after(clean_div);
	    var st = epeek.tree();
	    var theme = epeek_theme_tree_tooltip();

	    it("Loads", function () {
		theme(st, document.getElementById("TestID"));
	    });
	});

	describe("Ensembl Gene Tree", function () {
	    it("Loads", function () {
		var st = epeek.tree();
		var theme = epeek_theme_tree_ensembl_gene_tree();
		theme(st, document.getElementById("TestID"));
	    });
	});

	describe("Scaled Branches", function () {
	    it("Loads", function () {
		var st = epeek.tree();
		var theme = epeek_theme_tree_scaled_branches();
		theme(st, document.getElementById("TestID"));
	    });
	});

	describe("Labels", function () {
	    it("Loads", function () {
		var st = epeek.tree();
		var theme = epeek_theme_tree_labels();
		theme(st, document.getElementById("TestID"));
	    });
	});

	describe("Colors", function () {
	    it("Loads", function () {
		var st = epeek.tree();
		var theme = epeek_theme_tree_colors();
		theme(st, document.getElementById("TestID"));
	    });
	});

	// describe("Treefam", function () {
	//     it("Loads", function () {
	// 	var st = epeek.tree();
	// 	var theme = epeek_theme_tree_treefam_tree();
	// 	theme(st, document.getElementById("TestID"));
	//     });	    
	// });

	describe("Collapse Nodes", function () {
	    it("Loads", function () {
		var st = epeek.tree();
		var theme = epeek_theme_tree_collapse_nodes();
		theme(st, document.getElementById("TestID"));
	    });
	});
	

    });
});
