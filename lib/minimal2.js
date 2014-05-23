var tnt_theme = function () {

    var newick;  // The newick tree is not defined in the theme

    var theme = function (t, div) {
	t
	    .data (tnt.tree.parse_newick(newick))
	    .layout (tnt.tree.layout.vertical()
		     .width(650)
		     .scale(false)
		    )
	    .label (tnt.tree.label.text()
		    .height(15)
		   );

	t(div);
    };

    theme.newick = function (new_newick) {
	newick = new_newick;
	return theme;
    };

    return theme;
};
