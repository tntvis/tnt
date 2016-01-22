
// The height of tree labels and tracks
var height = 30;

// Create vis, tree and board
var vis = tnt();
var tree = tnt.tree();
var board = tnt.board();

// helper function
var get_highest_val = function (node, prop) {
    var highest = 0;
    node.apply(function (n) {
        if (n.property(prop) === "") {
            return;
        }
        var val = parseInt (n.property(prop));
        if (val > highest) {
            highest = val;
        }
    });
    return highest;
};

// Swap tracks
var sel = d3.select(yourDiv)
    .append("select")
    .on("change", function () {
        var cond;
        if (this.value === 'Forward') {
            cond = function (node1, node2) {
                var highest1 = get_highest_val(node1, '_id');
                var highest2 = get_highest_val(node2, '_id');
                return highest1 - highest2;
            };
        }
        if (this.value === 'Reverse') {
            cond = function (node1, node2) {
                var highest1 = get_highest_val(node1, '_id');
                var highest2 = get_highest_val(node2, '_id');
                return highest2 - highest1;
            };
        }

        tree.root().sort(cond);
        vis.update();
    });

sel
    .append("option")
    .attr("selected", 1)
    .text("Forward");
sel
    .append("option")
    .text("Reverse");


// TREE SIDE
// Configure the tree
var newick = "(((((homo_sapiens:9,pan_troglodytes:9)207598:34,callithrix_jacchus:43)314293:52,mus_musculus:95)314146:215,taeniopygia_guttata:310)32524:107,danio_rerio:417)117571:135;";

tree
    .data (tnt.tree.parse_newick (newick))
    .layout (tnt.tree.layout.vertical()
        .width(430)
        .scale(false)
    )
    .label (tnt.tree.label.text()
        .text(function (node) {
            return node.data().name;
        })
        .fontsize(12)
        .height(height)
    );

// collapse nodes on click
tree.on("click", function(node){
    node.toggle();
    vis.update();
});

// BOARD SIDE
board
    .from(0)
    .to(4000)
    .width(300)
    .zoom_out(4000)
    .max(4000);

var display_select = d3.select(yourDiv)
    .append("select")
    .on("change", function () {
        switch (this.value) {
            case 'blocks' :
            vis.track(track_blocks);
            break;

            case 'line' :
            vis.track(track_lines);
            break;
        }

    });

display_select
    .append("option")
    .attr("value", "line")
    .text("lines")
    .attr("selected", 1);

display_select
    .append("option")
    .attr("value", "blocks")
    .text("blocks");

var track_lines = function (leaf_node) {
    var leaf = leaf_node.data();
    var sp = leaf.name;
    return tnt.board.track()
        .color("#EBF5FF")
        .data (tnt.board.track.data.sync()
                .retriever (function () {
                        return data[sp] ? data[sp].line : [];
                })
        )
        .display(tnt.board.track.feature.area()
            .color("steelblue")
            .index(function (d) {
                return d.pos;
            })
        );
};

var track_blocks = function (leaf_node) {
    var leaf = leaf_node.data();
    var sp = leaf.name;
    return tnt.board.track()
        .color("#EBF5FF")
        .data (tnt.board.track.data.sync()
                .retriever (function () {
                    return data[sp] ? data[sp].blocks : [];
                })
        )
        .display (tnt.board.track.feature.ensembl()
            .color ('steelblue')
            .index (function (d) {
                return d.start;
            })
        );
};

vis
    .tree(tree)
    .board(board)
    .ruler("both")
    .track(track_lines);

vis(yourDiv);
