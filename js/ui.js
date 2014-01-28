var ui = {};

ui.dragging = {};
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
		// .attr('class', 'collapse in')
		.attr('class', 'collapse')
		.append('ul')
			.selectAll('li')
			.data(function(d) {return d.links})
			.enter().append('li')
				.attr('class', 'list-group-item attribute')
				.attr('draggable', 'true')
				.text(function(d) { return myApp._data[d].description.detail; })
}

/* +++++++++++++++++++++++++++++++ */
// http://www.html5rocks.com/de/tutorials/dnd/basics/

ui.dragging.handleDragStart = function(e) {
	this.style.opacity = '0.4';  // this / e.target is the source node.
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
	console.log("handleDragEnter");
	console.log(this);
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
  // See the section on the DataTransfer object.
  return false;
}

ui.dragging.handleDragEnd = function(e) {
  // this/e.target is the source node.
  [].forEach.call(ui.dragging.cols, function (col) {
    col.classList.remove('over');
  });
}


ui.dragging.attachDragStart = function(){
	console.log("Attached Dragging Logic");
	ui.dragging.cols = document.querySelectorAll('li.attribute');
	[].forEach.call(ui.dragging.cols, function(col) {
		col.addEventListener('dragstart', ui.dragging.handleDragStart, false);
		col.addEventListener('dragenter', ui.dragging.handleDragEnter, false);
		col.addEventListener('dragover', ui.dragging.handleDragOver, false);
		col.addEventListener('dragleave', ui.dragging.handleDragLeave, false);
		col.addEventListener('drop', ui.dragging.handleDrop, false);
		col.addEventListener('dragend', ui.dragging.handleDragEnd, false);
	//[].forEach.call(ui.dragging.cols, function(col) {
	//	col.addEventListener('dragstart', ui.dragging.handleDragStart, false);
	});
}