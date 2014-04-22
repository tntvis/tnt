var epeek_theme_tree_collapse_nodes = function() {
    "use strict";

    var tree_theme = function(sT, div) {

        var newick = "(((((homo_sapiens:9,pan_troglodytes:9)207598:34,callithrix_jacchus:43)314293:52,mus_musculus:95)314146:215,taeniopygia_guttata:310)32524:107,danio_rerio:417)117571:135;"

        var data = epeek.tree.parse_newick(newick);

        sT
            .data(data)
            .duration(500)
            .layout(epeek.tree.layout.vertical().width(600).scale(false));
            
        var tree = sT.tree();
        sT.node_info (function(node){
            sT
                .toggle_node(node)
                .update();
        });

        // The visualization is started at this point
        sT(div);
        

    };

    return tree_theme;
};