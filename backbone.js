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
			for (var i = 0; i < json.length; i++) {
				tableAppend(list, i);
				var row = document.createElement("tr");
				var c1 = document.createElement("th");
				var c2 = document.createElement("th");
				c1.innerHTML = json[0]["name"];
				c2.innerHTML = json[0]["id"];
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