function Heatmap (containerId, cramersVMatrix) {
	this._containerId = containerId;
	this._cramersVMatrix = cramersVMatrix;
	this.create();
}

Heatmap.prototype.create = function() {

	var margin = {top: 100, right: 0, bottom: 10, left: 120},
			width = 700,
			height = 700;

	var x = d3.scale.ordinal().rangeBands([0, width]),
			z = d3.scale.linear().domain([0, 0.6]).clamp(true),
			c = d3.scale.category10().domain(d3.range(10));

	var svg = d3.select(this._containerId).append("svg")
			.attr('class', 'heatmap')
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.style("margin-left", margin.left + "px")
		.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// d3.json("cramersVMatrix.json", function(json) {
	// d3.json("cramersVMatrix_abnutzungwirbel.json", function(json) {
	cramersVMatrix = this._cramersVMatrix;
	var matrix = [],
			// nodes = undefined,
			// n = nodes.length;

	// Compute index per node.
	// nodes.forEach(function(node, i) {
	// 	node.index = i;
	// 	node.count = 0;
	// 	matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
	// });

	// Convert links to matrix; count character occurrences.
	

	// console.log(matrix);
	// console.log("matrix.length");
	// console.log(matrix.length);

	// Prepare Cramer Matrix
	cMatrix = [];
	elements = Object.keys(cramersVMatrix);
	for (var i = 0; i < elements.length; i++) {
		cMatrix[i] = [];
		for (var j = 0; j < elements.length; j++) {
			if (cramersVMatrix[elements[i]][elements[j]] != undefined) {
				var value = cramersVMatrix[elements[i]][elements[j]];
				cMatrix[i][j] = {x: j, y: i, z: value};
			}
			else
				cMatrix[i][j] = {x: j, y: i, z: 0};
		}
	}

	// Precompute the orders.
	var orders = {
		// name: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].name, nodes[b].name); }),
		// count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
		// group: d3.range(n).sort(function(a, b) { return nodes[b].group - nodes[a].group; })
		name: d3.range(elements.length).sort(function(a, b) { return d3.ascending(elements[a], elements[b]); }),
		// count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
		// group: d3.range(n).sort(function(a, b) { return nodes[b].group - nodes[a].group; })
	};

	// The default sort order.
	x.domain(orders.name);

	svg.append("rect")
			.attr("class", "heatmap background")
			.attr("width", width)
			.attr("height", height);

	var row = svg.selectAll(".row")
			.data(cMatrix)
		.enter().append("g")
			.attr("class", "row")
			.attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
			.each(row);

	row.append("line")
			.attr("x2", width);

	row.append("text")
			.attr("x", -6)
			.attr("y", x.rangeBand() / 2)
			.attr("dy", ".32em")
			.attr("text-anchor", "end")
			// .text(function(d, i) { return nodes[i].name; });
			.text(function(d, i) { return elements[i]; });

	var column = svg.selectAll(".column")
			.data(cMatrix)
		.enter().append("g")
			.attr("class", "column")
			.attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

	column.append("line")
			.attr("x1", -width);

	column.append("text")
			.attr("x", 6)
			.attr("y", x.rangeBand() / 2)
			.attr("dy", ".32em")
			.attr("text-anchor", "start")
			// .text(function(d, i) { return nodes[i].name; });
			.text(function(d, i) { return elements[i]; });

	function row(row) {
		var cell = d3.select(this).selectAll(".cell")
				.data(row.filter(function(d) { return d.z; }))
			.enter().append("rect")
				.attr("class", "cell")
				.attr("x", function(d) { return x(d.x); })
				.attr("width", x.rangeBand())
				.attr("height", x.rangeBand())
				// .style("fill-opacity", function(d) { return 1;})
				.style("fill-opacity", function(d) { return z(d.z); })
				.style("fill", '#1f77b4')
				//.style("fill", function(d) { console.log(nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : null); return nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : null; })
				.on("mouseover", mouseover)
				.on("mouseout", mouseout);
	}

	function mouseover(p) {
		d3.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
		d3.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
	}

	function mouseout() {
		d3.selectAll("text").classed("active", false);
	}

	d3.select("#order").on("change", function() {
		clearTimeout(timeout);
		order(this.value);
	});

	// function order(value) {
	// 	x.domain(orders[value]);

	// 	var t = svg.transition().duration(250);

	// 	t.selectAll(".row")
	// 			.delay(function(d, i) { return x(i) * 4; })
	// 			.attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
	// 		.selectAll(".cell")
	// 			.delay(function(d) { return x(d.x) * 4; })
	// 			.attr("x", function(d) { return x(d.x); });

	// 	t.selectAll(".column")
	// 			.delay(function(d, i) { return x(i) * 4; })
	// 			.attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
	// }

	// var timeout = setTimeout(function() {
	// 	order("group");
	// 	d3.select("#order").property("selectedIndex", 2).node().focus();
	// }, 5000);
}