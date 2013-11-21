var epeek_theme = function() {

    var colors = {
	"protein_coding" : "CA0020"
    };

    var theme = function(gB, div) {
	
	gB(div);
	gB.startOnOrigin();
    };

    return theme;
};