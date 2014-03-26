describe("Themes", function () {
    describe("Track", function () {
	var delay = 300;
	describe("Minimal", function () {
	    it("Loads", function (done) {
		var st = epeek.genome();
		var theme = epeek_theme_track_minimal();
		theme(st, document.getElementById("TestID"));
		setTimeout(done, delay);
	    });
	});

	describe("Legend", function () {
	    it("Loads", function (done) {
		var st = epeek.genome();
		var theme = epeek_theme_track_legend();
		theme(st, document.getElementById("TestID"));
		setTimeout(done, delay);
	    });
	});

	describe("Pins", function (done) {
	    it("Loads", function () {
		var st = epeek.genome();
		var theme = epeek_theme_track_pins();
		theme(st, document.getElementById("TestID"));
		setTimeout(done, delay);
	    });
	});

	describe("Tooltips", function () {
	    it("Loads", function (done) {
		var st = epeek.genome();
		var theme = epeek_theme_track_tooltips();
		theme(st, document.getElementById("TestID"));
		setTimeout(done, delay);
	    });
	});

	describe("Resizable Div", function () {
	    it("Loads", function (done) {
		var st = epeek.genome();
		var theme = epeek_theme_track_resizable_div();
		theme(st, document.getElementById("TestID"));
		setTimeout(done, delay);
	    });
	});

	describe("Compact", function () {
	    it("Loads", function (done) {
		var st = epeek.genome();
		var theme = epeek_theme_track_compact();
		theme(st, document.getElementById("TestID"));
		setTimeout(done, delay);
	    });
	});

	describe("Buttons", function () {
	    it("Loads", function (done) {
		var st = epeek.genome();
		var theme = epeek_theme_track_buttons();
		theme(st, document.getElementById("TestID"));
		setTimeout(done, delay);
	    });
	});

	describe("Resize", function () {
	    it("Loads", function (done) {
		var st = epeek.genome();
		var theme = epeek_theme_track_resize();
		theme(st, document.getElementById("TestID"));
		setTimeout(done, delay);
	    });
	});

	describe("Mobile", function () {
	    it("Loads", function (done) {
		var st = epeek.genome();
		var theme = epeek_theme_track_mobile();
		theme(st, document.getElementById("TestID"));
		setTimeout(done, delay);
	    });
	});

	// describe("Comparative", function () {
	//     it("Loads", function (done) {
	// 	var st = epeek.genome();
	// 	var theme = epeek_theme_track_comparative();
	// 	theme(st, document.getElementById("TestID"));
	// 	setTimeout(done, 1500);
	//     });
	// });

	// describe("Orthologues Tree", function () {
	//     it("Loads", function () {
	// 	var st = epeek.genome();
	// 	var theme = epeek_theme_track_orthologues_tree();
	// 	theme(st, document.getElementById("TestID"));
	//     });
	// });


    });

    describe("Trees", function () {

	describe("Ensembl Species", function () {
	    it("Loads", function () {
		var st = epeek.tree();
		var theme = epeek_theme_tree_ensembl_species();
		theme(st, document.getElementById("TestID"));
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

	describe("Sort Nodes", function () {
	    it("Loads", function () {
		var st = epeek.tree();
		var theme = epeek_theme_tree_sort_nodes();
		theme(st, document.getElementById("TestID"));
	    });
	});

	describe("Swap Nodes", function () {
	    it("Loads", function () {
		var st = epeek.tree();
		var theme = epeek_theme_tree_swap_nodes();
		theme(st, document.getElementById("TestID"));
	    });
	});

	describe("Tooltips", function () {
	    it("Loads", function () {
		var st = epeek.tree();
		var theme = epeek_theme_tree_tooltip();
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

	describe("Labels", function () {
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
