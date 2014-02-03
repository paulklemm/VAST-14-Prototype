var ui = {};

ui.dragging = {};
ui.resizing = {};
// https://stackoverflow.com/questions/18660269/collapsible-responsive-sidebar-menu-with-jquery-and-bootstrap-3
// https://stackoverflow.com/questions/15391325/how-to-collapse-expand-list-using-bootstrap-jquery
ui.createSidebar = function() {

	groupArray = myApp._groups;

	// Create something which looks like this:
	// <li class="list-group-item"><a id="toggler" href="#" data-toggle="collapse" class="active" data-target="#demo">Group 1</a>
	// 	<div id="demo" class="collapse in">
	// 		<ul class="list-group">
	// 			<!-- <li class="nav-header">List header</li> -->
	// 			<li class="list-group-item"><a href="#">Home</a></li>
	// 			<li class="list-group-item"><a href="#">Library</a></li>
	// 		</ul>
	// 	</div>
	// </li>
	// <li class="list-group-item"><a id="toggler" href="#" data-toggle="collapse" class="active" data-target="#demo2">Group 2</a>
	// 	<div id="demo2" class="collapse in">
	// 		<ul class="list-group">
	// 			<!-- <li class="nav-header">List header</li> -->
	// 			<li class="list-group-item"><a href="#">Home</a></li>
	// 			<li class="list-group-item"><a href="#">Library</a></li>
	// 		</ul>
	// 	</div>
	// </li>

	var toplist = d3.select(".well ul");

	var listEnter = toplist.selectAll("li")
			.data(groupArray)
		.enter().append('li')
			.attr('class', 'list-group-item');

	listEnter.append('a')
		.attr('id', 'toggler')
		.attr('href', '#')
		.attr('data-toggle', "collapse")
		//.attr('class', "active")
		.attr('data-target', function(d) { return '#' + d.name})
		.text(function(d){ return d.name });

	listEnter.append('div')
		.attr('id', function(d){ return d.name})
		// .attr('class', 'collapse')
		.attr('class', 'collapse in')
		.append('ul')
			.selectAll('li')
			.data(function(d) {return d.links})
			.enter().append('li')
				.attr('class', 'list-group-item attribute')
				.attr('draggable', 'true')
				.text(function(d) { return myApp._data[d].description.detail; })

	// Add Drag and Drop functionality to the Elements
	ui.dragging.attachDragLogic();
}

ui.createContainer = function(e, id) {
	// Panel looks like this
	// <div class="remove glyphicon glyphicon-remove">
	//   <div class="remove_element icon-remove"></div>
	//   <div class="panel-heading">Panel heading without title</div>
	//   <div class="panel-body">
	//     Panel content
	//   </div>
	// </div>
	
	var panel = document.createElement('div');
	var panelHeading = document.createElement('div');
	var panelBody = document.createElement('div');
	var removeButton = document.createElement('div');
	var containerId = 'vis' + myApp._visualizations.length;
	// Classes
	// Append the little close Button und the top right corner of each element
	panel.setAttribute('class', 'viscontainer panel panel-default');
	panel.setAttribute('id', containerId); // at the end of the method we register the vis to this variable
	panelHeading.setAttribute('class', 'panel-heading');
	panelBody.setAttribute('class', 'panel-body');
	removeButton.setAttribute('class', 'remove glyphicon glyphicon-remove')

	// Text
	panelHeading.textContent = 'Heading of ' + id;
	//panelBody.textContent = 'Body of ' + id;
	// Append
	panel.appendChild(removeButton);
	panel.appendChild(panelHeading);
	panel.appendChild(panelBody);
	document.getElementById('canvas').appendChild(panel);
	// Put it into the right position
	panel.style.position = "absolute";
	var correctedX = e.layerX - ($(panel).width() / 2)
	var correctedY = e.layerY - ($(panel).height() / 2)
	panel.style.left = correctedX + 'px';
	panel.style.top = correctedY + 'px';
	// make it dragable and resizable
	$('.viscontainer')
		.draggable( {containment: "parent", handle: "div.panel-heading"} )
		.resizable( {containment: "parent", 
			resize: ui.resizing.resize} );

	$(removeButton).on("click", function(e) {
		// Get Container ID
		var id = $(this).parent().attr('id');
		$(this).parent().remove();
		myApp.removeRegisteredVisualization('#' + id);
	})
	// Register Container
	var detail = {};
	detail.id = id;
	detail.containerId = '#' + containerId;
	myApp.createMatchingVisualization(detail);
}

/* +++++++++++++++++++++++++++++++ */

ui.resizing.resize = function(event, _ui) {
	// https://groups.google.com/forum/#!topic/d3-js/mTBxTLi0q1o
	var elementId = _ui.element.attr('id');
	// HACK: Height is calculated wrong in the panel-body
	// var height = $("#" + elementId + ' .panel-body').height();
	// var width = $("#" + elementId + ' .panel-body').width();
	var width = $("#" + elementId).width();
	var height = _ui.size.height - 80;
	d3.select("#" + elementId + " svg")
		.attr("width", width)
		.attr("height", height)
		.attr("preserveAspectRatio", "none");
}

/* +++++++++++++++++++++++++++++++ */
// http://www.html5rocks.com/de/tutorials/dnd/basics/

ui.dragging.draggedElementID = null;

ui.dragging.handleDragStart = function(e) {
	//this.style.opacity = '0.4';  // this / e.target is the source node.

	// Store ID of clicked element
	ui.dragging.draggedElementID = this.__data__;
}

ui.dragging.handleDragOver = function(e) {
	if (e.preventDefault) {
		e.preventDefault(); // Necessary. Allows us to drop.
	}
	e.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.
	return false;
}

ui.dragging.handleDragEnter = function(e) {
	// this / e.target is the current hover target.
	this.classList.add('over');
}

ui.dragging.handleDragLeave = function(e) {
	this.classList.remove('over');  // this / e.target is previous target element.
}

ui.dragging.handleDrop = function(e) {
	// this / e.target is current target element.
	if (e.stopPropagation) {
		e.stopPropagation(); // stops the browser from redirecting.
	}
	ui.createContainer(e, ui.dragging.draggedElementID);
	// See the section on the DataTransfer object.
	return false;
}

ui.dragging.handleDragEnd = function(e) {
	// this/e.target is the source node.
	// [].forEach.call(ui.dragging.cols, function (col) {
	// 	col.classList.remove('over');
	// });
	document.querySelector('.well#canvas').classList.remove('over');
}


ui.dragging.attachDragLogic = function(){

	var attributes = document.querySelectorAll('li.attribute');
	var canvas = document.querySelector('.well#canvas');
	canvas.addEventListener('dragenter', ui.dragging.handleDragEnter, false);
	canvas.addEventListener('dragover', ui.dragging.handleDragOver, false);
	canvas.addEventListener('dragleave', ui.dragging.handleDragLeave, false);
	canvas.addEventListener('drop', ui.dragging.handleDrop, false);
	
	[].forEach.call(attributes, function(col) {
		col.addEventListener('dragstart', ui.dragging.handleDragStart, false);
		col.addEventListener('dragend', ui.dragging.handleDragEnd, false);
	});
}