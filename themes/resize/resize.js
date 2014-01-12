var epeek_theme = function() {

    var sizes = [
	{ value   : '950x200',
	  display : '950 x 200'
	},
	{ value   : '900x400',
	  display : '900 x 400'
	},
	{ value   : '800x300',
	  display : '800 x 300'
	}
    ];

    var theme = function(gB, div) {

	var div_theme = d3.select(div);
	var div_id = div_theme.attr("id");

	var resize_select = div_theme
	    .append("select")
	    .attr("id", "ePeek_" + div_id + "_resize_select") // Needed ID?
	    .on("change", function(){
		var vals = this.value.split("x");
		gB.width(vals[0]);
		gB.height(vals[1]);
	    });

	resize_select.selectAll("option")
	    .data(sizes)
	    .enter()
	    .append("option")
	    .attr("value", function(d) {return d.value})
	    .text(function(d) {return d.display});

	gB(div);
	gB.start();

    };

    return theme;
};

