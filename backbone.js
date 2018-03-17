function loaded() {
	document.getElementById("pop-up-div").style.opacity = 0;
	document.getElementById("pop-up-div").style.top = "100%";
	document.getElementById("pop-up-div").style.visibility = 0;
	document.getElementById("all").style.opacity = 1;
	document.getElementById("all").style.visibility = 1;
}

$(document).ready(function() {

	/*var qrcode = new QRCode("test", {
    	text: "http://jindo.dev.naver.com/collie",
    	width: 128,
    	height: 128,
    	colorDark : "#000000",
    	colorLight : "#ffffff",
    	correctLevel : QRCode.CorrectLevel.H
	});*/

	var display_interval;
	var clock_interval;

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
		var thing = [id, name];
		console.log("Pushed " + thing + " to history");
		history.pushState(thing, "Buster.lu - Bus stop " + name, "/" + id);
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
		display(id);
		displayClock();
		clock_interval = setInterval(displayClock, 500);
		display_interval = setInterval(display, 30000, id);
	}

	function display(id) {
		var req = new XMLHttpRequest();
		var url = "https://api.tfl.lu/v1/StopPoint/Departures/" + id;
		req.open("GET", url);
		req.send();
		req.onload = function() {
			var json = JSON.parse(req.response);
			var list = document.getElementById("table-content-popup");
			$("#table-content-popup > tr").slice(0).remove();
			var l = $(document).height() / 3 / 42;
			for (var i = 0; i < json.length && i < l; i++) {
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
		}
	}

	window.addEventListener("popstate", function(event) {
		openPopup(event[0], event[1]);
	});

	function displayClock() {
		var clock = document.getElementById("clock");
		var date = new Date;
		var hours = date.getHours();
		var minutes = "0" + date.getMinutes();
		if (minutes.length == 3) {
			minutes = minutes.substr(1, 3);
		}
		var seconds = "0" + date.getSeconds();
		if (seconds.length == 3) {
			seconds = seconds.substr(1, 3);
		}
		clock.innerHTML = hours + ":" + minutes + ":" + seconds;
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

	$("body").on("click", function(event) {
	    if (event.pageX == 0 && event.pageY > 430 && event.pageY < 486) {
	    	document.getElementById("fork").style.visibility = "visible";
    	}
	});

});