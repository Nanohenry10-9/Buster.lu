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
			for (var i = 0; i < json.length; i++) {
				var row = document.createElement("tr");
				var c1 = document.createElement("th");
				var c2 = document.createElement("th");
				var c3 = document.createElement("a");
				a.innerHTML = json[i]["properties"]["name"];
				a.onclick = "openPopup(" + json[i]["properties"]["id"] + ")";
				c1.appendChild(a);
				row.appendChild(c1);
				row.appendChild(c2);
				list.appendChild(row);
			}
		}
	}

	function openPopup(id) {
		//var box = document.getElementById("pop-up-div");
		//box.visibility = "visible";
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
		req.send();
		req.onload = function() {
			var json = JSON.parse(req.response);
			$("#table-content-popup > tr").slice(0).remove();
			for (var i = 0; i < json.length && i < 5; i++) {
				var row = document.createElement("tr");
				var c1 = document.createElement("th");
				var c2 = document.createElement("th");
				c1.innerHTML = json[i]["number"];
				c2.innerHTML = json[i]["departure"];
				row.appendChild(c1);
				row.appendChild(c2);
				list.appendChild(row);
			}
		}
	}

	$("#input-text").keyup(function(event) {
		search();
	});

});