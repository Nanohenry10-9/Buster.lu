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
				var c2 = document.createElement("th");
				var c3 = document.createElement("a");
				c3.innerHTML = json[i]["properties"]["name"];
				c3.setAttribute("data-theme", json[i]["properties"]["id"]);
				c3.addEventListener("click", function(event) {
					openPopup(c3.getAttribute("data-theme"));
					event.preventDefault();
				});
				c1.appendChild(c3);
				row.appendChild(c1);
				row.appendChild(c2);
				list.appendChild(row);
			}
		}
	}

	function openPopup(id) {
		//var box = document.getElementById("pop-up-div");
		//box[visibility] = "visible";
		var textbox = document.getElementById("pop-up-text");
		textbox.innerHTML = "Bus stop number: " + id;
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
			$("#table-content-popup > tr").slice(0).remove();
			for (var i = 0; i < json.length && i < 5; i++) {
				var row = document.createElement("tr");
				var c1 = document.createElement("th");
				var c2 = document.createElement("th");
				var c3 = document.createElement("th");
				c1.innerHTML = json[i]["line"];
				c2.innerHTML = json[i]["destination"];
				var delay = Number(json[i]["delay"]) / 60;
				var date = new Date(Number(json[i]["departure"]) * 1000);
				var hours = date.getHours();
				var minutes = "0" + date.getMinutes();
				if (minutes.length == 3) {
					minutes = minutes.substr(1, 3);
				}
				c3.innerHTML = hours + ":" + minutes;
				if (delay > 0) {
					c3.innerHTML = c3.innerHTML + " (" + delay + " min. late)"
				}
				row.appendChild(c1);
				row.appendChild(c2);
				list.appendChild(row);
			}
		}
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