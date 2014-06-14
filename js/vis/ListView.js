function ListView(containterId, groups) {
	this._containerId = containterId;
	this._containerSelector = d3.select(containterId);
	this._groups = groups;
	// attach selected Tag!
	for (var i = 0; i < this._groups.length; i++)
		this._groups[i].selected = false;

	this.updateList();
}

// inspired by http://jsfiddle.net/rWByD/1/
ListView.prototype.updateList = function () {
	// var sorted = data.sort(function(a, b) { return d3.descending(a.id, b.id); });
	var head = this._containerSelector
	    .selectAll('.listDiv')
	    .data(this._groups);
	    // .data(sorted, function(d) { return d.id; });

	var enterDiv = head.enter()
	    .append("div")
	    .attr("class", "listDiv");
	    //.style("opacity", 0);
	enterDiv.append("div")
	    .text(function(d) { return d.name })
	    //.attr('style', 'visibility: collapse')
	    .attr('class', 'category')
	    .on("click", toggleMenu)
	    .append('div')
	    	.selectAll('p')
				.data(function(d) {return d.children})
				.enter().append('p')
					.attr('class', 'list-group-item attribute')
					.attr('style', 'display: none')
					.attr('draggable', 'true')
					.text(function(d) { return myApp._data[d].description.detail; })

	// This code does nothing actually - only when an update is called!
	// head.transition()
	//   .delay(1000)
	//   .style("opacity", 1);
	head.exit()
	    // .transition()
	    // .duration(1000)
	    // .style("opacity", 0)
	    .remove();

	function toggleMenu() {
		myApp._listView.updateList();
		ui.dragging.attachDragLogic();
		// console.log(this.__data__);
		if (!this.__data__.selected) {
			d3.select(this).selectAll('p').attr('style', 'display:block');
		}
		else {
			d3.select(this).selectAll('p').attr('style', 'display:none');
		}
		this.__data__.selected = !this.__data__.selected;
	}

	this.update = toggleMenu;
}