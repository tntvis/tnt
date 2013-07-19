var epeek_tree = function () {

    var newick_species_tree = "((((((((((((((((((((((((Homo_sapiens:0.0067,Pan_troglodytes:0.006667):0.00225,Gorilla_gorilla:0.008825):0.00968,Pongo_abelii:0.018318):0.00717,Nomascus_leucogenys:0.025488):0.00717,(Macaca_mulatta:0.007853,?Papio_hamadryas:0.007637):0.029618):0.021965,Callithrix_jacchus:0.066131):0.05759,Tarsius_syrichta:0.137823):0.011062,(Microcebus_murinus:0.092749,Otolemur_garnettii:0.129725):0.035463):0.015494,Tupaia_belangeri:0.186203):0.004937,(((((Mus_musculus:0.084509,Rattus_norvegicus:0.091589):0.197773,Dipodomys_ordii:0.211609):0.022992,Cavia_porcellus:0.225629):0.01015,Ictidomys_tridecemlineatus:0.148468):0.025746,(Oryctolagus_cuniculus:0.114227,Ochotona_princeps:0.201069):0.101463):0.015313):0.020593,((((Vicugna_pacos:0.107275,(Tursiops_truncatus:0.064688,(Bos_taurus:0.061796,?Ovis_aries:0.061796):0.061796):0.025153):0.0201675,Sus_scrofa:0.079):0.0201675,((Equus_caballus:0.109397,(Felis_catus:0.098612,((Ailuropoda_melanoleuca:0.025614,Mustela_putorius_furo:0.0256):0.0256145,Canis_familiaris:0.051229):0.051229):0.049845):0.006219,(Myotis_lucifugus:0.14254,Pteropus_vampyrus:0.113399):0.033706):0.004508):0.011671,(Erinaceus_europaeus:0.221785,Sorex_araneus:0.269562):0.056393):0.021227):0.023664,(((Loxodonta_africana:0.082242,Procavia_capensis:0.155358):0.02699,Echinops_telfairi:0.245936):0.049697,(Dasypus_novemcinctus:0.116664,Choloepus_hoffmanni:0.096357):0.053145):0.006717):0.234728,(Monodelphis_domestica:0.125686,(Macropus_eugenii:0.101004,Sarcophilus_harrisii:0.101004):0.021004):0.2151):0.071664,Ornithorhynchus_anatinus:0.456592):0.109504,(((((Gallus_gallus:0.041384,Meleagris_gallopavo:0.041384):0.041384,Anas_platyrhynchos:0.082768):0.082768,Taeniopygia_guttata:0.171542):0.199223,Anolis_carolinensis:0.489241):0.105143,Pelodiscus_sinensis:0.4989):0.17):0.149,Xenopus_tropicalis:0.855573):0.155677,Latimeria_chalumnae:0.155677):0.155677,(((Oreochromis_niloticus:0.45,(Tetraodon_nigroviridis:0.224159,Takifugu_rubripes:0.203847):0.195181,((Xiphophorus_maculatus:0.1204925,Oryzias_latipes:0.240985):0.240985,Gasterosteus_aculeatus:0.316413):0.05915):0.16282,Gadus_morhua:0.16282):0.16282,Danio_rerio:0.730752):0.147949):0.526688,Petromyzon_marinus:0.526688):0.526688,(Ciona_savignyi:0.8,Ciona_intestinalis:0.8)Cionidae:0.6)Chordata:0.2,(?Apis_mellifera:0.9,(((?Aedes_aegypti:0.25,?Culex_quinquefasciatus:0.25):0.25,?Anopheles_gambiae:0.5)Culicinae:0.2,Drosophila_melanogaster:0.8)Diptera:0.1)Endopterygota:0.7)Coelomata:0.1,Caenorhabditis_elegans:1.7)Bilateria:0.3,Saccharomyces_cerevisiae:1.9)Fungi_Metazoa_group:0.3);"

    var r = 960 / 2;
    var curr_species = "Homo_sapiens";
    var sp_counts = {};

    var tree = function (div) {

	// We populate the species tree
	var cluster = d3.layout.cluster()
	    .size([360, 1])
	    .sort(null)
	    .value(function(d) { return d.length; })
	    .children(function(d) { return d.branchset; })
	    .separation(function(a, b) { return 1; });

	var species_tree = newick.parse(tree.newick_tree());

	var nodes = cluster.nodes(species_tree);
	phylo(nodes[0], 0);

	var sp_names = get_names_of_present_species(sp_counts);
	var present_nodes  = get_tree_nodes_by_names(species_tree, sp_names);

	var lca_node = lca_for_nodes(present_nodes)

	decorate_tree(lca_node);
	nodes_present(species_tree, present_nodes);

	var vis = d3.select(div)
	    .append("svg")
	    .attr("width", r * 2)
	    .attr("height", r * 2)
	    .attr("fill", "none")
	    .append("g")
	    .attr("transform", "translate(" + r + "," + r + ")");

	var link = vis.selectAll("path.link")
	    .data(cluster.links(nodes))
	    .enter().append("path")
	    .attr("class", "link")
	    .attr("d", step)
	    .style("stroke", function(d){
	    	if (d.source.real_present === 1) {
	    	    return "steelblue";
	    	}
	    	if (d.source.present_node === 1) {
	    	    return "ccc";
	    	}
	    	return "fff";
	    });

	var node = vis.selectAll("g.node")
	    .data(nodes.filter(function(n) { return n.x !== undefined; }))
	    .enter().append("g")
	    .attr("class", "node")
	    .attr("id", function(d) {return "ePeek_tree_" + d.name})
	    .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; });

	node.append("circle")
	    .attr("class", function(d) {
		if (d.real_present) {
		    return "present";
		}
		if (d.present_node) {
		    return "dubious";
		}
		return "absent";
	    })
	    .attr("r", 2.5);

	var label = vis.selectAll("text")
	    .data(nodes.filter(function(d) { return d.x !== undefined && !d.children; }))
	    .enter().append("text")
	    .style("fill", function (d) {
		if (d.name === tree.species()) {
		    return "red";
		}
		if (d.real_present === 1) {
		    return "steelblue";
		}
		return "ccc";
		// return d.name === tree.species() ? "red" : "black"
	    })
	    .attr("dy", ".31em")
	    .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
	    .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (r - 220 + 8) + ")rotate(" + (d.x < 180 ? 0 : 180) + ")"; }) // The translate's big number should be adjusted "manually". Affects the location of the labels
	    .text(function(d) { var label = d.name.replace(/_/g, ' ');
				var species_name = d.name.charAt(0).toLowerCase() + d.name.slice(1);
				label = label + " [" + (sp_counts[species_name] === undefined ? 0 : sp_counts[species_name].length) + "]";
				return label;
			      });



    };

    var phylo = function (n, offset) {
	if (n.length != null) offset += n.length * 80; // This number should be adjusted "manually". Gives the size of the tree
	n.y = offset;
	if (n.children)
	    n.children.forEach(function(n) {
		phylo(n, offset);
	    });
    };

    var step = function (d) {
	var s = project(d.source),
	m = project({x: d.target.x, y: d.source.y}),
	t = project(d.target),
	r = d.source.y,
	sweep = d.target.x > d.source.x ? 1 : 0;
	return (
	    "M" + s[0] + "," + s[1] +
		"A" + r + "," + r + " 0 0," + sweep + " " + m[0] + "," + m[1] +
		"L" + t[0] + "," + t[1]);
    };

    var project = function (d) {
	var r = d.y, a = (d.x - 90) / 180 * Math.PI;
	return [r * Math.cos(a), r * Math.sin(a)];
    };

    // API
    tree.newick_tree = function (newick) {
	if (!arguments.length) {
	    return newick_species_tree;
	}
	newick_species_tree = newick;
	return tree;
    };

    tree.species = function (sp) {
	if (!arguments.length) {
	    return curr_species;
	}

	curr_species = sp;
	return tree;
    };

    tree.species_counts = function (obj) {
	if (!arguments.length) {
	    return sp_counts;
	}
	sp_counts = obj;
	return tree;
    }



    // Tree traversing
    var get_node_by_name = function(tree, name) {
	// console.log(tree.name + " -VS- " + name);
	if (tree.name === name) {
	    return tree;
	}
	if (tree.children === undefined) {
	    return;
	}
	for (var i = 0; i < tree.children.length; i++) {
	    var node =  get_node_by_name(tree.children[i], name);
	    if (node !== undefined) {
		return node;
	    }
	}
    };

    var has_ancestor = function (node1, node2) {
	if (node1.parent === undefined) {
	    return false
	}
	if (node1.parent === node2) {
	    return true;
	}
	return has_ancestor(node1.parent, node2);
    };

    var lca_for_nodes = function (nodes) {
	if (nodes.length === 1) {
	    return nodes[0];
	}
	var lca_node = nodes[0];
	for (var i = 1; i < nodes.length; i++) {
	    lca_node = lca(lca_node, nodes[i]);
	}
	return lca_node;
    }

    // This is the easiest way to calculate the LCA I can think of. But it is very inefficient too.
    // It would be better to implement a better LCA algorithm. For example see:
    // http://community.topcoder.com/tc?module=Static&d1=tutorials&d2=lowestCommonAncestor
    var lca = function (node1, node2) {
	if (node1 === node2) {
	    return node1;
	}
	if (has_ancestor(node1, node2)) {
	    return node2;
	}
	return lca(node1, node2.parent);
    };

    var decorate_tree = function (node) {
	if (node !== undefined) {
	    traverse_tree(node, function(n) {n.present_node = 1});
	}
    };


    var nodes_present = function (tree, nodes) {
	for (var i = 0; i < nodes.length; i++) {
	    var tree_node = get_node_by_name(tree, nodes[i].name);
	    if (tree_node === undefined) {
		console.log("NO NODE FOUND WITH NAME " + nodes[i]);
	    } else {
		tree_node.real_present = 1;
	    }
	}

	// TODO: Highly inefficient algorithm ahead
	var max_depth = max_tree_depth(tree);
	for (var i = 0; i < max_depth; i++) {
	    var children_present = function(node) {
		if (node.children !== undefined) {
		    if (check_children_present(node)) {
			node.real_present = 1;
		    }
		    for (var i = 0; i < node.children.length; i++) {
			children_present(node.children[i]);
		    }
		}
	    };
	    children_present(tree);
	}
    };

    var check_children_present = function(node) {
	var n_present = 0;
	for (var i = 0; i < node.children.length; i++) {
	    if (node.children[i].real_present === 1) {
		n_present++;
	    }
	}
	if (node.children.length === n_present) {
	    return true;
	}
	return false;
    }

    var traverse_tree = function (tree, cbak) {
	cbak(tree);
	if (tree.children !== undefined) {
	    for (var i = 0; i < tree.children.length; i++) {
		traverse_tree(tree.children[i], cbak);
	    }
	}
    };

    var max_tree_depth = function (tree, max) {
	if (max === undefined) {
	    max = 0
	}
	var this_depth = tree.depth;
	if (tree.children !== undefined) {
	    for (var i = 0; i < tree.children.length; i++) {
		return max_tree_depth(tree.children[i], this_depth > max ? this_depth : max)
	    }
	}
	return max;
    };

    var get_names_of_present_species = function (sp_nodes) {
	var names = [];
	for (var i in sp_nodes) {
	    if (sp_nodes.hasOwnProperty(i)) {
		names.push(i.charAt(0).toUpperCase() + i.slice(1));
	    }
	}
	return names;
    };

    var get_tree_nodes_by_names = function (tree, names) {
	var nodes = [];
	for (var i = 0; i < names.length; i++) {
	    var node = get_node_by_name(tree, names[i]);
	    if (node !== undefined) {
		nodes.push(node);
	    }
	}
	return nodes;
    };

    tree.update = function(sp_counts) {
	
	return tree;
    };

    return tree;
};

var newick_species_tree_big = "(((((((((((((((((((Escherichia_coli_EDL933:0.00000,Escherichia_coli_O157_H7:0.00000)96:0.00044,((Escherichia_coli_O6:0.00000,Escherichia_coli_K12:0.00022)76:0.00022,(Shigella_flexneri_2a_2457T:0.00000,Shigella_flexneri_2a_301:0.00000)100:0.00266)75:0.00000)100:0.00813,((Salmonella_enterica:0.00000,Salmonella_typhi:0.00000)100:0.00146,Salmonella_typhimurium:0.00075)100:0.00702)100:0.03131,((Yersinia_pestis_Medievalis:0.00000,(Yersinia_pestis_KIM:0.00000,Yersinia_pestis_CO92:0.00000)31:0.00000)100:0.03398,Photorhabdus_luminescens:0.05076)61:0.01182)98:0.02183,((Blochmannia_floridanus:0.32481,Wigglesworthia_brevipalpis:0.35452)100:0.08332,(Buchnera_aphidicola_Bp:0.27492,(Buchnera_aphidicola_APS:0.09535,Buchnera_aphidicola_Sg:0.10235)100:0.10140)100:0.06497)100:0.15030)100:0.02808,((Pasteurella_multocida:0.03441,Haemophilus_influenzae:0.03754)94:0.01571,Haemophilus_ducreyi:0.05333)100:0.07365)100:0.03759,((((Vibrio_vulnificus_YJ016:0.00021,Vibrio_vulnificus_CMCP6:0.00291)100:0.01212,Vibrio_parahaemolyticus:0.01985)100:0.01536,Vibrio_cholerae:0.02995)100:0.02661,Photobacterium_profundum:0.06131)100:0.05597)81:0.03492,Shewanella_oneidensis:0.10577)100:0.12234,((Pseudomonas_putida:0.02741,Pseudomonas_syringae:0.03162)100:0.02904,Pseudomonas_aeruginosa:0.03202)100:0.14456)98:0.04492,((Xylella_fastidiosa_700964:0.01324,Xylella_fastidiosa_9a5c:0.00802)100:0.10192,(Xanthomonas_axonopodis:0.01069,Xanthomonas_campestris:0.00934)100:0.05037)100:0.24151)49:0.02475,Coxiella_burnetii:0.33185)54:0.03328,((((Neisseria_meningitidis_A:0.00400,Neisseria_meningitidis_B:0.00134)100:0.12615,Chromobacterium_violaceum:0.09623)100:0.07131,((Bordetella_pertussis:0.00127,(Bordetella_parapertussis:0.00199,Bordetella_bronchiseptica:0.00022)67:0.00006)100:0.14218,Ralstonia_solanacearum:0.11464)100:0.08478)75:0.03840,Nitrosomonas_europaea:0.22059)100:0.08761)100:0.16913,((((((Agrobacterium_tumefaciens_Cereon:0.00000,Agrobacterium_tumefaciens_WashU:0.00000)100:0.05735,Rhizobium_meliloti:0.05114)100:0.05575,((Brucella_suis:0.00102,Brucella_melitensis:0.00184)100:0.08660,Rhizobium_loti:0.09308)51:0.02384)100:0.08637,(Rhodopseudomonas_palustris:0.04182,Bradyrhizobium_japonicum:0.06346)100:0.14122)100:0.05767,Caulobacter_crescentus:0.23943)100:0.11257,(Wolbachia_sp._wMel:0.51596,(Rickettsia_prowazekii:0.04245,Rickettsia_conorii:0.02487)100:0.38019)100:0.12058)100:0.12365)100:0.06301,((((Helicobacter_pylori_J99:0.00897,Helicobacter_pylori_26695:0.00637)100:0.19055,Helicobacter_hepaticus:0.12643)100:0.05330,Wolinella_succinogenes:0.11644)100:0.09105,Campylobacter_jejuni:0.20399)100:0.41390)82:0.04428,((Desulfovibrio_vulgaris:0.38320,(Geobacter_sulfurreducens:0.22491,Bdellovibrio_bacteriovorus:0.45934)43:0.04870)69:0.04100,(Acidobacterium_capsulatum:0.24572,Solibacter_usitatus:0.29086)100:0.20514)64:0.04214)98:0.05551,((Fusobacterium_nucleatum:0.45615,(Aquifex_aeolicus:0.40986,Thermotoga_maritima:0.34182)100:0.07696)35:0.03606,(((Thermus_thermophilus:0.26583,Deinococcus_radiodurans:0.29763)100:0.24776,Dehalococcoides_ethenogenes:0.53988)35:0.04370,((((Nostoc_sp._PCC_7120:0.12014,Synechocystis_sp._PCC6803:0.15652)98:0.04331,Synechococcus_elongatus:0.13147)100:0.05040,(((Synechococcus_sp._WH8102:0.06780,Prochlorococcus_marinus_MIT9313:0.05434)100:0.04879,Prochlorococcus_marinus_SS120:0.10211)74:0.04238,Prochlorococcus_marinus_CCMP1378:0.16170)100:0.20442)100:0.07646,Gloeobacter_violaceus:0.23764)100:0.24501)39:0.04332)51:0.02720)74:0.03471,((((Gemmata_obscuriglobus:0.36751,Rhodopirellula_baltica:0.38017)100:0.24062,((Leptospira_interrogans_L1-130:0.00000,Leptospira_interrogans_56601:0.00027)100:0.47573,((Treponema_pallidum:0.25544,Treponema_denticola:0.16072)100:0.19057,Borrelia_burgdorferi:0.42323)100:0.20278)95:0.07248)42:0.04615,(((Tropheryma_whipplei_TW08/27:0.00009,Tropheryma_whipplei_Twist:0.00081)100:0.44723,Bifidobacterium_longum:0.29283)100:0.14429,(((((Corynebacterium_glutamicum_13032:0.00022,Corynebacterium_glutamicum:0.00000)100:0.03415,Corynebacterium_efficiens:0.02559)100:0.03682,Corynebacterium_diphtheriae:0.06479)100:0.13907,(((Mycobacterium_bovis:0.00067,(Mycobacterium_tuberculosis_CDC1551:0.00000,Mycobacterium_tuberculosis_H37Rv:0.00000)98:0.00022)100:0.03027,Mycobacterium_leprae:0.05135)97:0.01514,Mycobacterium_paratuberculosis:0.02091)100:0.11523)100:0.09883,(Streptomyces_avermitilis:0.02680,Streptomyces_coelicolor:0.02678)100:0.16707)91:0.06110)100:0.26800)23:0.03480,((Fibrobacter_succinogenes:0.51984,(Chlorobium_tepidum:0.37204,(Porphyromonas_gingivalis:0.11304,Bacteroides_thetaiotaomicron:0.13145)100:0.34694)100:0.09237)62:0.04841,(((Chlamydophila_pneumoniae_TW183:0.00000,(Chlamydia_pneumoniae_J138:0.00000,(Chlamydia_pneumoniae_CWL029:0.00000,Chlamydia_pneumoniae_AR39:0.00000)37:0.00000)44:0.00000)100:0.10482,Chlamydophila_caviae:0.05903)98:0.04170,(Chlamydia_muridarum:0.01938,Chlamydia_trachomatis:0.02643)100:0.06809)100:0.60169)32:0.04443)67:0.04284)66:0.02646,((Thermoanaerobacter_tengcongensis:0.17512,((Clostridium_tetani:0.10918,Clostridium_perfringens:0.11535)78:0.03238,Clostridium_acetobutylicum:0.11396)100:0.15056)100:0.11788,(((((Mycoplasma_mobile:0.27702,Mycoplasma_pulmonis:0.28761)100:0.28466,((((Mycoplasma_pneumoniae:0.10966,Mycoplasma_genitalium:0.11268)100:0.31768,Mycoplasma_gallisepticum:0.24373)100:0.14180,Mycoplasma_penetrans:0.34890)94:0.06674,Ureaplasma_parvum:0.33874)100:0.19177)100:0.07341,Mycoplasma_mycoides:0.37680)100:0.12541,Phytoplasma_Onion_yellows:0.47843)100:0.09099,(((((Listeria_monocytogenes_F2365:0.00063,Listeria_monocytogenes_EGD:0.00144)90:0.00235,Listeria_innocua:0.00248)100:0.13517,((Oceanobacillus_iheyensis:0.13838,Bacillus_halodurans:0.09280)91:0.02676,(((Bacillus_cereus_ATCC_14579:0.00342,Bacillus_cereus_ATCC_10987:0.00123)100:0.00573,Bacillus_anthracis:0.00331)100:0.08924,Bacillus_subtilis:0.07876)96:0.01984)100:0.03907)69:0.02816,((Staphylococcus_aureus_MW2:0.00000,(Staphylococcus_aureus_N315:0.00022,Staphylococcus_aureus_Mu50:0.00022)61:0.00022)100:0.02479,Staphylococcus_epidermidis:0.03246)100:0.17366)64:0.02828,(((((((Streptococcus_agalactiae_III:0.00110,Streptococcus_agalactiae_V:0.00155)100:0.01637,(Streptococcus_pyogenes_M1:0.00134,(Streptococcus_pyogenes_MGAS8232:0.00045,(Streptococcus_pyogenes_MGAS315:0.00000,Streptococcus_pyogenes_SSI-1:0.00022)100:0.00110)87:0.00066)100:0.02250)100:0.01360,Streptococcus_mutans:0.04319)99:0.01920,(Streptococcus_pneumoniae_R6:0.00119,Streptococcus_pneumoniae_TIGR4:0.00124)100:0.03607)100:0.04983,Lactococcus_lactis:0.11214)100:0.08901,Enterococcus_faecalis:0.07946)100:0.03958,(Lactobacillus_johnsonii:0.20999,Lactobacillus_plantarum:0.14371)100:0.06763)100:0.08989)100:0.08905)92:0.09540)54:0.04315)Bacteria:1.34959,(((((Thalassiosira_pseudonana:0.33483,(Cryptosporidium_hominis:0.25048,Plasmodium_falciparum:0.28267)100:0.14359)42:0.03495,(((Oryza_sativa:0.07623,Arabidopsis_thaliana:0.09366)100:0.15770,Cyanidioschyzon_merolae:0.38319)96:0.08133,(Dictyostelium_discoideum:0.34685,(((Eremothecium_gossypii:0.07298,Saccharomyces_cerevisiae:0.07619)100:0.21170,Schizosaccharomyces_pombe:0.24665)100:0.15370,(((Anopheles_gambiae:0.10724,Drosophila_melanogaster:0.10233)100:0.09870,((Takifugu_rubripes:0.03142,Danio_rerio:0.05230)100:0.04335,(((Rattus_norvegicus:0.03107,Mus_musculus:0.01651)91:0.00398,(Homo_sapiens:0.00957,Pan_troglodytes:0.03864)100:0.01549)99:0.01629,Gallus_gallus:0.04596)100:0.01859)100:0.09688)95:0.03693,(Caenorhabditis_elegans:0.01843,Caenorhabditis_briggsae:0.01896)100:0.24324)100:0.09911)85:0.04004)41:0.02708)44:0.02636)87:0.06455,Leishmania_major:0.45664)100:0.10129,Giardia_lamblia:0.55482)100:0.57543,((Nanoarchaeum_equitans:0.81078,(((Sulfolobus_tokodaii:0.17389,Sulfolobus_solfataricus:0.18962)100:0.33720,Aeropyrum_pernix:0.43380)94:0.09462,Pyrobaculum_aerophilum:0.55514)100:0.12018)100:0.15444,((Thermoplasma_volcanium:0.10412,Thermoplasma_acidophilum:0.09785)100:0.66151,((((Methanobacterium_thermautotrophicum:0.36583,Methanopyrus_kandleri:0.35331)99:0.07446,(Methanococcus_maripaludis:0.28592,Methanococcus_jannaschii:0.13226)100:0.23828)100:0.06284,((Pyrococcus_horikoshii:0.02786,Pyrococcus_abyssi:0.02179)100:0.02239,Pyrococcus_furiosus:0.02366)100:0.36220)51:0.04469,(Archaeoglobus_fulgidus:0.34660,(Halobacterium_sp._NRC-1:0.61597,(Methanosarcina_acetivorans:0.02602,Methanosarcina_mazei:0.03087)100:0.30588)100:0.12801)100:0.10395)62:0.06815)99:0.11833)100:0.43325):0.88776);";
