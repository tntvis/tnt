var epeek_theme_track_switch_track = function() {

    var theme = function(gB, div) {
	gB(div);

	gB.right (1000);

	// Switchable track
	var track = epeek.track.track()
	    .height(30)
	    .background_color("#FFCFDD")
	    .data(epeek.track.data()
		  .update(
		      epeek.track.retriever.sync()
			  .retriever (function () {
			      return [
				  {
				      start : 20,
				      end   : 100
				  }
			      ]
			  })
		  )
		 )
	    .display(epeek.track.feature.block()
		     .foreground_color("blue")
		     .index(function (d) {
			 return d.start;
		     }));

	// Select to switch the track
	var select = d3.select(div)
	    .append("select")
	    .on("change", function (d) {
		switch (this.value) {
		case 'blocks' :
		    track
			.data(epeek.track.data()
			      .update(
				  epeek.track.retriever.sync()
				      .retriever (function () {
					  return [
					      {
						  start : 20,
						  end   : 100
					      }
					  ]
				      })
			      )
			     )
			.display(epeek.track.feature.block()
				 .foreground_color("blue")
				 .index(function (d) {
				     return d.start;
				 }));
		    break;

		case 'line' :
		    track
			.data(epeek.track.data()
			      .update(
				  epeek.track.retriever.sync()
				      .retriever (function () {
					  return data_line
				      })
			      )
			     )
			.display(epeek.track.feature.area()
				 .foreground_color("steelblue")
				 .index(function (d) {
				     return d.pos
				 }));
		    break;
		}
		gB.start();
	    });

	select
	    .append("option")
	    .attr("value", "blocks")
	    .text("blocks");

	select
	    .append("option")
	    .attr("value", "line")
	    .text("line");


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
	    .add_track(loc_track)
	    .add_track(axis_track)
	    .add_track(track);

	gB.start();
    };

    return theme;
};

var data_line = [
    { pos : 1,
      val : 0.5
    },
    { pos : 20,
      val : 0.4
    },
    { pos : 30,
      val : 0.8
    },
    { pos : 40,
      val : 0.5
    },
    { pos : 50,
      val : 0.7
    },
    { pos : 60,
      val : 0.3
    },
    { pos : 70,
      val : 0.4
    },
    { pos : 80,
      val : 0
    },
    { pos : 90,
      val : 0.7
    },
    { pos : 100,
      val : 0.6
    },
    { pos : 110,
      val : 0.6
    },
    { pos : 120,
      val : 0.5
    },
    { pos : 130,
      val : 0.9
    },
    { pos : 140,
      val : 0.8
    },
    { pos : 150,
      val : 0.4
    },
    { pos : 160,
      val : 0.7
    },
    { pos : 170,
      val : 0.5
    },
    { pos : 180,
      val : 0.6
    },
    { pos : 190,
      val : 0.8
    },
    { pos : 200,
      val : 0.5
    },
    { pos : 210,
      val : 0.5
    },
    { pos : 220,
      val : 0.5
    }
];
