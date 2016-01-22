// The height of tree labels and tracks
var height = 30;

// Create tree and board
var tree = tnt.tree();
var board = tnt.board();

var newick = "(((((homo_sapiens,pan_troglodytes),callithrix_jacchus),mus_musculus),taeniopygia_guttata),danio_rerio);";
var newick2 = "(((((mus_musculus,homo_sapiens),taeniopygia_guttata),danio_rerio);";

var label_en = tnt.tree.label.text()
    .text(function (node) {
        if (node.children) {
            return "";
        } else {
            return node.id.accession;
        }
    })
    .fontsize(10)
    .height(height);

var sel = d3.select(yourDiv)
    .append("select")
    .on("change", function () {
        var cond;
        if (this.value === 'Example Tree') {
            tree
                .data (tnt.tree.parse_newick (newick))
                .layout (tnt.tree.layout.vertical()
                    .width(430)
                    .scale(false))
                .label (tnt.tree.label.text()
                    .height(height)
                );
        }

        if (this.value === 'Example Tree 2') {
            tree
                .data (tnt.tree.parse_newick (newick2))
                .layout (tnt.tree.layout.vertical()
                    .width(430)
                    .scale(false)
                )
                .label (tnt.tree.label.text()
                    .height(height)
                );
        }

        vis.update();
    });


sel
    .append("option")
    .attr("selected", 1)
    .text("Example Tree ");

sel
    .append("option")
    .text("Example Tree 2");

tree
    .data (tnt.tree.parse_newick (newick))
    .layout (tnt.tree.layout.vertical()
         .width(430)
         .scale(false)
     )
    .label (tnt.tree.label.text()
        .height(height)
    );


// collapse nodes on click
tree.on("click", (function(node){
    node.toggle();
    vis.update();
}));

// TRACK SIDE
board
    .from(0)
    .to(1000)
    .width(300)
    .max(1000);

var track = function (leaf_node) {
    var leaf = leaf_node.data();
    var sp = leaf.name;
    return tnt.board.track()
        .color("#EBF5FF")
        .data (tnt.board.track.data.sync()
            .retriever (function () {
                return data2[sp] || [];
            })
        )
        .display(tnt.board.track.feature.ensembl()
            .color("green")
            .index(function (d) {
                return d.start;
            })
        );
};

var vis = tnt()
    .tree(tree)
    .key('name')
    .board(board)
    .ruler("both")
    .track(track);

vis(yourDiv);
