var epeek_theme = function() {
    "use strict";

    var tree_theme = function(sT, div) {

        var newick = "(((((homo_sapiens:9,pan_troglodytes:9)207598:34,callithrix_jacchus:43)314293:52,mus_musculus:95)314146:215,taeniopygia_guttata:310)32524:107,danio_rerio:417)117571:135;"

        // var newick = "((homo_sapiens,pan_troglodytes),mus_musculus);";

        // var newick = "(((2,4),(5,1)),3)";

        var data = epeek.tree.parse_newick(newick);

        sT
            .data(data)
            .duration(500)
            .layout(epeek.tree.layout.vertical().width(600).scale(false));
            
        var tree = sT.tree();
        sT.node_info_callback = function(node){
                console.log(node);
                console.log(this);
                
                // console.log(sT.data());
                   sT
                   .toggle_node(node)
                    .update();
                // node.toggle_node()
            };

        
        // console.log(sT.data());


        // var curr = sT.curr();
        
        // The visualization is started at this point
        sT(div);
        
        //setTimeout(function() {

            // sT
            // .toggle_node('32524')
            // .update();
        // }, 500);

    };

    // function toggle(d) {
    //     if (d.children) {
    //         d._children = d.children;
    //         d.children = null;
    //     } else {
    //         d.children = d._children;
    //         d._children = null;
    //     }
    // }

    return tree_theme;
};