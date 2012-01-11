$(document).ready(function() {

	var canvas = new google.maps.Map($('#map_canvas')[0], {
		zoom: 14,
		center: new google.maps.LatLng(42.37909, -72.518177), //who doesn't love Amherst, MA
		mapTypeId: google.maps.MapTypeId.ROADMAP
	});

	var line = new google.maps.Polyline({
		strokeColor: '#0000FF',
		strokeOpacity: 0.5,
		strokeWeight: 5,
	});
	line.setMap(canvas);

	var polygon = new google.maps.Polygon({
		strokeColor: '#0000FF',
		strokeOpacity: 0.5,
		strokeWeight: 5,
		fillColor: '#0000FF',
		fillOpacity: 0.2
	});
	polygon.setMap(canvas);

	var handlers = [],
		markers = [];
		
	var bind_handler = function(target, event, handler) {
		var id = google.maps.event.addListener(target, event, handler);
		handlers.push(id);
		return id;
	}
		
	var unbind_all = function() {
		while (handlers.length > 0) {
			google.maps.event.removeListener(handlers.pop());
		}
	}
		
	var clear = function() {

		$('#save_map').attr('disabled', true);

		unbind_all();
		
		var path = line.getPath();
		while (path.length > 0) {
			path.pop();
		}
		var poly_path = polygon.getPath();
		while (poly_path.length > 0) {
			poly_path.pop();
		}
		while (markers.length > 0) {
			marker = markers.pop();
			marker.setMap(null);
			marker = null;
		}

	};

	var load = function() {
	
		var path = polygon.getPath()
		for (i in mapdata) {
			coords = mapdata[i];
			point = new google.maps.LatLng(coords.lat, coords.lng);
			path.push(point);
			marker = new google.maps.Marker({
				position: point,
				draggable: true,
				map: canvas
			});
			markers.push(marker);
		}
		
	};
	
	var draw_mode = function() {

		var path = line.getPath(),
			firstmarker = null,
			newpoint = null;
			
		//have a marker (and the path) follow the mouse
		bind_handler(canvas, 'mousemove', function(event) {
			if (newpoint) path.pop();
			newpoint = event.latLng;
			path.push(newpoint);
		});
		
		//right click to add a point. add this handler to the line as well
		var add_point = function(event) {
			if (newpoint) path.pop();
			path.push(event.latLng);
			newpoint = null;

			var marker = new google.maps.Marker({
				position: event.latLng,
				map: canvas
			});
			markers.push(marker);
		
			if (!firstmarker) {
				firstmarker = marker;
				
				//right click on the first marker to close the loop
				bind_handler(firstmarker, 'rightclick', function(event) {
					if (newpoint) path.pop();
					if (path.length < 3) return;
					
					var poly_path = polygon.getPath(),
						markers_r = [];
					
					while (path.length > 0) {
						poly_path.push(path.pop());
						markers_r.push(markers.pop());
					}
					markers = markers_r;
					
					edit_mode();
				});
				
				//snap the line to the first marker if you hover over it
				bind_handler(firstmarker, 'mouseover', function(event) {
					if (newpoint) path.pop();
					if (path.length < 3) return;
					
					newpoint = firstmarker.getPosition();
					path.push(newpoint);
				});
				
			}
		};
		bind_handler(canvas, 'rightclick', add_point);
		bind_handler(line, 'rightclick', add_point);
	
	};

	var edit_mode = function() {

		unbind_all();
		
		var path = polygon.getPath();
		
		$.each(markers, function(i, marker) {
			marker.setDraggable(true);
			
			//drag
			bind_handler(marker, 'drag', function() {
				path.setAt(i, marker.getPosition());
			});
				
			//right click on a point to remove
			bind_handler(marker, 'rightclick', function() {
				if(path.length <= 3) return;
				
				path.removeAt(i);
				markers.splice(i, 0);
				marker.setMap(null);
				
				edit_mode();
			});
		});
		
		//right click between two points to add another point
		var add_point_between = function(event) {
			var newpoint = event.latLng;
			
			var is_between = function (newpoint, point_a, point_b) {
				//default sort() doesn't work on negative numbers, I guess
				var lat = newpoint.lat(),
					lng = newpoint.lng(),
					lats = [point_a.lat(), point_b.lat()].sort(function(a, b) { return a - b; });
					lngs = [point_a.lng(), point_b.lng()].sort(function(a, b) { return a - b; });
					
				if(lat < lats[0] || lat > lats[1] || lng < lngs[0] || lng > lngs[1]) return false;
				
				//TODO check slope
				
				return true;
			}
			
			var point_a = path.getAt(path.length-1),
				point_b,
				index = null;
				
			path.forEach(function(point, i) {
				if(index !== null) return;
				point_b = point;
				if(is_between(newpoint, point_a, point_b)) index = i;
				point_a = point;
			});
			
			if(index === null) return;
			
			//insert the point between the two points
			path.insertAt(index, event.latLng);
			new_marker = new google.maps.Marker({
				position: newpoint,
				draggable: true,
				map: canvas
			});
			markers.splice(index, 0, new_marker)
			
			edit_mode();
		};
		bind_handler(canvas, 'rightclick', add_point_between);
		bind_handler(polygon, 'rightclick', add_point_between);

		$('#save_map').removeAttr('disabled');

	}

	var mapdata = null; //TODO
	if (!mapdata) {
		draw_mode();
	} else {
		load();
		edit_mode();
		$('#revert_map').removeAttr('disabled');
	}

	$('#save_map').click(function() {
		var path = polygon.getPath(),
			new_mapdata = [];
			
		path.forEach(function(point, i) {
			new_mapdata.push({lat: point.lat(), lng: point.lng()});
		});
		mapdata = new_mapdata;
		//TODO save mapdata permanently
		
		$('#revert_map').removeAttr('disabled');
	});
	
	$('#revert_map').click(function() {
		clear();
		load();
		edit_mode();
	});
	
	$('#clear_map').click(function() {
		clear();
		draw_mode();
	});

});
