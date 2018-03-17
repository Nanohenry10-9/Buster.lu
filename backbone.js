function loaded() {
	document.getElementById("pop-up-div").style.opacity = 0;
	document.getElementById("all").style.opacity = 1;
}

$(document).ready(function() {

	function search() {
		var text = document.getElementById("input-text").value;
		var req = new XMLHttpRequest();
		var url = "https://api.tfl.lu/v1/StopPoint/Search/" + text;
		req.open("GET", url);
		req.send();
		req.onload = function() {
			var json = JSON.parse(req.response).features;
			var list = document.getElementById("table-content");
			$("#table-content > tr").slice(0).remove();
			for (var i = 0; i < json.length && i < 5; i++) {
				var row = document.createElement("tr");
				var c1 = document.createElement("th");
				var c2 = document.createElement("a");
				c2.innerHTML = json[i]["properties"]["name"];
				c2.setAttribute("id", json[i]["properties"]["id"]);
				c2.setAttribute("href", "#");
				c2.className = "bus-stop";
				c1.appendChild(c2);
				row.appendChild(c1);
				list.appendChild(row);
			}
			addEvents();
		}
	}

	function addEvents() {
		$(".bus-stop").click(function(event) {
			openPopup(event.target.getAttribute("id"), event.target.innerHTML);
		});
	}

	function openPopup(id, name) {
		$("#all").removeClass("view-shown");
		$("#all").addClass("view-hidden");
		$("#pop-up-div").removeClass("view-hidden");
		$("#pop-up-div").addClass("view-shown");
		history.pushState(null, "Buster.lu - Bus stop " + name, "/" + id);
		console.log("Popup for: " + id + ", " + name);
		var textbox = document.getElementById("pop-up-text");
		textbox.innerHTML = "Bus stop: " + name;
		var list = document.getElementById("table-content-popup");
		$("#table-content-popup > tr").slice(0).remove();
		var t1 = document.createElement("tr");
		var t2 = document.createElement("th");
		t2.innerHTML = "Please wait...";
		t1.appendChild(t2);
		list.appendChild(t1);
		var req = new XMLHttpRequest();
		var url = "https://api.tfl.lu/v1/StopPoint/Departures/" + id;
		req.open("GET", url);
		req.send();
		req.onload = function() {
			var json = JSON.parse(req.response);
			if (json.length != 0) {
				$("#table-content-popup > tr").slice(0).remove();
				for (var i = 0; i < json.length && i < 5; i++) {
					var row = document.createElement("tr");
					var c1 = document.createElement("th");
					var c2 = document.createElement("th");
					var c3 = document.createElement("th");
					c1.innerHTML = json[i]["line"];
					c2.innerHTML = json[i]["destination"];
					var delay = json[i]["delay"] / 60;
					var date = new Date((json[i]["departure"] + delay) * 1000);
					var hours = date.getHours();
					var minutes = "0" + date.getMinutes();
					if (minutes.length == 3) {
						minutes = minutes.substr(1, 3);
					}
					c3.innerHTML = hours + ":" + minutes;
					if (delay > 0) {
						c3.innerHTML = c3.innerHTML + " (" + delay + " min. late)";
					}
					row.appendChild(c1);
					row.appendChild(c2);
					row.appendChild(c3);
					list.appendChild(row);
				}
			} else {
				t2.innerHTML = "Could not load data.";
			}
		}
	}

	$("#LocateBtn").click(function() {
		navigator.geolocation.getCurrentPosition(showPosition, showError);
	});

	function showPosition(pos) {
		console.log(pos);
		var req = new XMLHttpRequest();
		var url = "https://api.tfl.lu/v1/StopPoint/around/" + pos.coords.longitude + "/" + pos.coords.latitude + "/1000";
		req.open("GET", url);
		req.send();
		req.onload = function() {
			var json = JSON.parse(req.response).features;
			var list = document.getElementById("table-content");
			$("#table-content > tr").slice(0).remove();
			for (var i = 0; i < json.length && i < 5; i++) {
				var row = document.createElement("tr");
				var c1 = document.createElement("th");
				var c2 = document.createElement("a");
				c2.innerHTML = json[i]["properties"]["name"];
				c2.setAttribute("id", json[i]["properties"]["id"]);
				c2.setAttribute("href", "#");
				c2.className = "bus-stop";
				c1.appendChild(c2);
				row.appendChild(c1);
				list.appendChild(row);
			}
			addEvents();
		}
	}

	function showError(err) {
		console.log(err.message);
	}

	$("#input-text").keydown(function(event) {
		if (event.keyCode == 13) {
			event.preventDefault();
		}
	});

	$("#input-text").keyup(function(event) {
		search();
	});

});