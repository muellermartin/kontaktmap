/* jshint esversion: 6 */

var map = L.map('map', {
	crs: L.CRS.Simple
});
var bounds = [[0, 0], [1000, 1000]];
var image = L.imageOverlay('/static/img/kontakt-gelaendeplan-20190508.svg', bounds).addTo(map);
var markers = [];
var currentMarker;
var markerProperties = document.querySelector('.marker-properties');
var sidebar = true;

map.fitBounds(bounds);

document.querySelector('.sidebar-button').addEventListener('click', function () {
	if (sidebar) {
		document.querySelector('.sidebar').style.display = 'none';
		this.innerHTML = '◀︎';
		this.style.right = 0;
	} else {
		document.querySelector('.sidebar').style.display = 'block';
		this.innerHTML = '▶︎';
		this.style.right = '20%';
	}

	sidebar = !sidebar;
});

document.querySelector('.marker-add').addEventListener('click', function(e) {
	createMarker();
	updateList();
}, false);

markerProperties.querySelector('form').addEventListener('submit', function(e) {
	e.preventDefault();
	setMarkerTitle(currentMarker, this.querySelector('#name').value);
	updateList();
});

markerProperties.querySelector('form input[type="button"]').addEventListener('click', function(e) {
	e.preventDefault();

	var index = markers.indexOf(currentMarker);

	if (index > -1) {
		markers.splice(index, 1);
	}

	currentMarker.remove();
	updateList();
	markerProperties.style.display = 'none';
	save();
});

function updateList() {
	document.querySelector('.list ol').innerHTML = '';

	markers.forEach(function(marker) {
		var listElement = document.createElement('li');

		listElement.innerHTML = marker.getTooltip().getContent() + ' <span class="marker-edit">Edit</a>';
		document.querySelector('.list ol').appendChild(listElement);

		var editButton = listElement.querySelector('.marker-edit');

		if (marker.dragging._enabled) {
			editButton.innerHTML = 'Save';
		} else {
			editButton.innerHTML = 'Edit';
		}

		editButton.addEventListener('click', function() {
			editMarkerListener(editButton, marker);
		}, false);
	});
}

function updateMarker(marker) {
	var mode;
	var name;

	if (marker.dragging._enabled) {
		mode = 'Save';
	} else {
		mode = 'Edit';
	}

	name = marker.getTooltip().getContent();
	marker.getPopup().setContent('<span class="marker-name">' + name + '</span><br /><span class="marker-edit">' + mode + '</span>');

	var editButton = document.querySelector('.marker-edit');

	editButton.addEventListener('click', function() {
		editMarkerListener(editButton, marker);
	}, false);
}

function setMarkerTitle(marker, name) {
	marker.getTooltip().setContent(name);
	updateMarker(marker);
}

function createMarker(x, y, name = 'Undefined') {
	if (x === undefined && y === undefined) {
		var center = map.getCenter();
		x = center.lng;
		y = center.lat;
	}

	var marker = L.marker([y, x]).addTo(map);

	marker.bindPopup('<span class="marker-name">' + name + '</span><br /><span class="marker-edit">Edit</span>');
	marker.bindTooltip(name);
	marker.on('click', function() {
		updateMarker(marker);
	});
	marker.on('popupopen', function() {
		if (this.dragging._enabled) {
			markerProperties.style.display = 'block';
		}
	});
	markers.push(marker);
}

function editMarkerListener(element, marker) {
	if (marker.dragging._enabled) {
		element.innerHTML = 'Edit';
		marker.dragging.disable();
		markerProperties.style.display = 'none';
		save();
	} else {
		markers.forEach(function(marker) {
			marker.dragging.disable();
		});
		element.innerHTML = 'Save';
		markerProperties.style.display = 'block';
		markerProperties.querySelector('#name').value = marker.getTooltip().getContent();
		marker.dragging.enable();
		currentMarker = marker;
	}

	updateList();
	updateMarker(marker);
}

function load() {
	var request = new XMLHttpRequest();

	request.open('GET', '/load', true);

	request.onload = function() {
		if (request.status >= 200 && request.status < 400) {
			var data = JSON.parse(JSON.parse(request.responseText));

			data.markers.forEach(function(marker) {
				createMarker(marker.x, marker.y, marker.name);
			});
			updateList();
		} else {
			// We reached our target server, but it returned an error
			console.error('Could not load markers:', request.status, request.statusText);
		}
	};

	request.onerror = function() {
		console.error('Could not load markers');
	};

	request.send();
}

function save() {
	var data = { markers: []};

	markers.forEach(function(marker) {
		var position = marker.getLatLng();

		data.markers.push({
			x: position.lng,
			y: position.lat,
			name: marker.getTooltip().getContent()
		});
	});

	var request = new XMLHttpRequest();

	request.open('POST', '/save', true);
	request.setRequestHeader('Content-Type', 'application/json');
	request.send(JSON.stringify(data));
}

load();
