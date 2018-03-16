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
				c1.innerHTML = json[i]["properties"]["name"];
				c2.innerHTML = json[i]["properties"]["id"];
				row.appendChild(c1);
				row.appendChild(c2);
				list.appendChild(row);
			}
		}
	}

	function openPopup(id) {

	}

	$("#input-text").keyup(function(event) {
		search();
	});

});