var render = function() {
    "use strict";

    var height = 30;

    var tree = tnt.tree();
    var board = tnt.board();

    var sequence_feature = function () {
        var fontsize = 10;

        // 'Inherit' from tnt.board.track.feature
        var feature = tnt.board.track.feature()
            .index (function (d) {
                return d.pos;
            });

        feature.create (function (new_nts, xScale) {
            var track = this;

            new_nts
                .append("text")
                .attr("fill", track.color())
                .style('font-size', fontsize + "px")
                .attr("x", function (d) {
                    return xScale (d.pos) ;
                })
                .attr("y", function (d) {
                    return ~~(track.height() / 2) + 5;
                })
                .style("font-family", '"Lucida Console", Monaco, monospace')
                .text(function (d) {
                    return d.nt;
                })
                .transition()
                .duration(500)
                .attr('fill', feature.color());
        });

        feature.move (function (nts) {
            var xScale = feature.scale();
            nts.select ("text")
                .attr("x", function (d) {
                    return xScale(d.pos) ;
                });
        });

        return feature;
    };


    var theme = function (ta, div) {

        var label = tnt.tree.label.text()
            .text(function (node) {
                if (node.is_leaf()) {
                    return node.property(function(d) {
                        return d.id.accession;
                    });
                } else {
                    return "";
                }
            })
            .fontsize(10)
            .height(height);

        var rest = tnt.board.track.data.ensembl;

        d3.json('ENSGT00390000003602.json', function (err, resp) {
            deploy_vis(resp);
        });

        // TREE SIDE
        var deploy_vis = function (tree_obj) {
            tree
                .data (tree_obj.tree)
                .layout (tnt.tree.layout.vertical()
                    .width(430)
                    .scale(false)
                )
                .label (label);

            var reduce = tnt.utils.reduce.line()
                .smooth(4)
                .redundant(function (a, b) {
                    return Math.abs (a-b) < 0.2;
                })
                .value("val");

            var reduce_all = function (rows) {
                var obj = {};
                for (var id in rows) {
                    if (rows.hasOwnProperty (id)) {
                        obj[id] = reduce(rows[id]);
                    }
                }
                return obj;
            };

            var filter_exon_boundaries = function (data, loc) {
                var sub_data = [];
                var from = loc.from;
                var to = loc.to;
                for (var i=0; i<data.length; i++) {
                    var item = data[i];
                    if (item.loc >= loc.from && item.loc <= loc.to) {
                        sub_data.push(item);
                    }
                }
                return sub_data;
            };

            var get_conservation = function (seqs) {
                var conservation = {};

                for (var k=0; k<seqs.length; k++) {
                    conservation[seqs[k].data()._id] = [];
                }

                for (var i=0; i<seqs[0].data().sequence.mol_seq.seq.length; i++) {
                    var cons = {};
                    for (var j=0; j<seqs.length; j++) {
                        var p = seqs[j].data();
                        if (cons[p.sequence.mol_seq.seq[i]] === undefined) {
                            cons[p.sequence.mol_seq.seq[i]] = 0;
                        }
                        cons[p.sequence.mol_seq.seq[i]]++;
                    }

                    for (var l=0; l<seqs.length; l++) {
                        var val = cons[seqs[l].data().sequence.mol_seq.seq[i]] / seqs.length;
                        conservation[seqs[l].data()._id].push({
                            pos : i,
                            val : val
                        });
                    }
                }

                return reduce_all (conservation);
            };

            var get_boundaries = function (nodes) {
                var boundaries = {};
                for (var i=0; i<nodes.length; i++) {
                    var leaf = nodes[i];
                    var this_boundaries = [];
                    var bs = leaf.data().exon_boundaries.boundaries;
                    for (var j=0; j<bs.length; j++) {
                        this_boundaries.push({loc: bs[j]});
                    }
                    boundaries[leaf.id()] = this_boundaries;
                }
                return boundaries;
            };

            var get_aln_gaps = function (nodes) {
                var gaps_info = {};
                for (var i=0; i<nodes.length; i++) {
                    var leaf = nodes[i];
                    var this_no_gap_start;
                    var this_no_gaps = [];
                    var g = leaf.data().sequence.mol_seq.seq;
                    for (var j=0; j<g.length; j++) {
                        if (g[j] !== '-') {
                            if (this_no_gap_start === undefined) {
                                this_no_gap_start = j;
                            }
                        } else {
                            if (this_no_gap_start !== undefined) {
                                this_no_gaps.push( {start : this_no_gap_start,
                                    end   : j
                                });
                                this_no_gap_start = undefined;
                            }
                        }
                    }
                    gaps_info[leaf.id()] = this_no_gaps;
                }
                return gaps_info;
            };

            var get_seq_info = function (nodes) {
                var seq_info = {};
                for (var i=0; i<nodes.length; i++) {
                    var leaf = nodes[i];
                    var this_seq = [];
                    var s = leaf.data().sequence.mol_seq.seq;
                    for (var j=0; j<s.length; j++) {
                        this_seq.push({pos : j,
                            nt  : s[j]
                        });
                    }
                    seq_info[leaf.id()] = this_seq;
                }
                return seq_info;
            };

            var leaves = tree.root().get_all_leaves();
            var conservation = get_conservation(leaves);
            var exon_boundaries = get_boundaries(leaves);
            var aln_gaps = get_aln_gaps(leaves);
            var seq_info = get_seq_info(leaves);

            // TRACK SIDE
            board
                .from(0)
                .width(300);

            var track = function (leaf_node) {
                var leaf = leaf_node.data();
                var id = leaf._id;
                return tnt.board.track()
                    .color("#EBF5FF")
                    .data (tnt.board.track.data.sync()
                        .retriever (function (loc) {
                            var seq_range = (loc.to - loc.from) <= 50 ? seq_info[id].slice(loc.from, loc.to) : [];
                            return {
                                'conservation' : function (d) {
                                    return conservation[id] || [];
                                },
                                'boundaries'   : filter_exon_boundaries(exon_boundaries[id], loc) || [],
                                'sequence'     : seq_range
                            };
                        })
                    )
                    .display( tnt.board.track.feature.composite()
                        .add ('conservation', tnt.board.track.feature.area()
                            .color("steelblue")
                            .index(function (d) {
                                return d.pos;
                            })
                        )
                        .add ('boundaries', tnt.board.track.feature.vline()
                            .color("red")
                            .index(function (d) {
                                    return d.loc;
                            })
                        )
                        .add ('sequence', sequence_feature()
                            .color("black")
                            .index(function (d) {
                                return d.pos;
                            })
                        )
                    );
            };

            var max_val = d3.max(leaves, function (d) {
                return d.data().sequence.mol_seq.seq.length;
            });

            ta.tree(tree);
            ta.board(board
                .to(max_val)
                .max(max_val)
                .zoom_out(max_val)
                .zoom_in(30)
            );
            ta.ruler("both");
            ta.track(track);

            ta(div);
        };
    };

    return theme;
};
