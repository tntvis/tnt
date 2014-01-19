// inspired on http://james.padolsey.com/javascript/monitoring-dom-properties/
d3.selection.prototype.watch = function(id, fn) {
    return this.each(function() {
	var self = d3.select(this);
	var oldVal = self.style(id);
	self.watch_timer = setInterval(function(){
	    if(self.style(id) !== oldVal) {
		fn.call(self, oldVal, self.style(id));
		oldVal = self.style(id);
	    }
	}, 1000);
    });
    return;
};

var epeek_theme = function() {

    var theme = function(gB, div) {
	var div_theme = d3.select(div);
	div_theme
	    .style("width", (gB.width() + 10) + "px")
	    .style("resize", "both")
	    .style("overflow", "hidden");

	div_theme.watch("width", function(oldWidth, newWidth) {
	    gB.width(parseInt(newWidth)-15);
	});

	div_theme.watch("height", function(oldHeight, newHeight) {
	    gB.height(parseInt(newHeight)-50);
	});


	gB(div);
	gB.start();
    };

    return theme;

};