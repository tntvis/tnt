var epeek_theme_track_dynamic_track = function() {

    var theme = function(gB, div) {
	gB(div);

	var reduce = epeek.utils.reduce.block()
	    .smooth(0)
	    .value("start")
	    // .redundant(function (a, b) {
	    // 	return Math.abs(a-b)<50;
	    // })
	    // .join(function (obj1, obj2) {
	    // 	return {
	    // 	    'object' : {
	    // 		'start' : obj1.object.start,
	    // 		'end'   : obj2.end
	    // 	    },
	    // 	    'value'  : obj2.end
	    // 	}
	    // });

	var filter_blocks = function (data, loc) {
	    var sub_data = [];
	    var from = loc.from;
	    var to = loc.to;
	    for (var i=0; i<data.length; i++) {
		var item = data[i];
		if ((item.start >= loc.from && item.start <= loc.to) ||
		    (item.end >= loc.from && item.end <= loc.to)){
		    sub_data.push(item);
		}
	    }
	    
	    if ((loc.to - loc.from) < 50) {
		reduce
		    .redundant (function (a, b) {
			return false
		    });
	    } else if ((loc.to - loc.from) < 200) {
		reduce
		    .redundant(function (a, b) {
			return Math.abs(a-b)<3;
		    });
	    } else {
		reduce
		    .redundant(function (a, b) {
			return Math.abs(a-b)<10;
		    });
	    }

	    return reduce(sub_data);
	    // return sub_data;
	};

	// Block Track1
	var block_track = epeek.track.track()
	    .height(30)
	    .background_color("#FFCFDD")
	    .data(epeek.track.data()
		  .update(
		      epeek.track.retriever.sync()
			  .retriever (function (loc) {
			      return filter_blocks(data, loc);
			  })
		  )
		 )
	    .display(epeek.track.feature.block()
		     .foreground_color("blue")
		     .index(function (d) {
			 return d.start + '-' + d.end;
		     }));

	// Axis Track1
	var axis_track = epeek.track.track()
	    .height(30)
	    .background_color("white")
	    .display(epeek.track.feature.axis()
		     .orientation("top")
		    );

	// Location Track1
	var loc_track = epeek.track.track()
	    .height(30)
	    .background_color("white")
	    .display(epeek.track.feature.location());

	gB
	    .right(1000)
	    .from(0)
	    .to(1000)
	    .zoom_in(10)
	    .add_track(loc_track)
	    .add_track(axis_track)
	    .add_track(block_track);

	gB.start();
    };

    return theme;
};

var data = [
    { start : 540,
      end   : 542
    },
    { start : 544,
      end   : 546
    },
    { start : 548,
      end   : 550
    },
    { start : 552,
      end   : 555
    },
    { start : 558,
      end   : 560
    }
];
