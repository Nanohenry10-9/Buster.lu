$(document).ready(function() {

	var display_interval;
	var clock_interval;

	checkPopup();

	function search() {
		$("#dist").hide();
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
				c2.style.cursor = "pointer";
				c2.setAttribute("lat", json[i]["geometry"]["coordinates"][0]);
				c2.setAttribute("lon", json[i]["geometry"]["coordinates"][1]);
				c2.className = "bus-stop";
				c2.style.overflow = "hidden";
				c2.style.textOverflow = "ellipsis";
				c2.style.whiteSpace = "nowrap";
				c1.appendChild(c2);
				row.appendChild(c1);
				list.appendChild(row);
			}
			if (i > 0) {
				$("#result").show();
				$("#error").hide();
			} else {
				$("#result").hide();
				$("#error").show();
			}
			addEvents();
		}
	}

	function checkPopup() {
		var url = new URL(window.location.href);
		var s = url.searchParams.get("s");
		var n = url.searchParams.get("n");
		var lat = url.searchParams.get("lat");
		var lon = url.searchParams.get("lon");
		if (s != null && n != null && lat != null && lon != null) {
			document.title = "Buster.lu - " + n;
			openPopup(s, n, false, lat, lon);
		} else {
			document.title = "Buster.lu";
			closePopup();
		}
	}

	function addEvents() {
		$(".bus-stop").click(function(event) {
			openPopup(event.target.getAttribute("id"), event.target.innerHTML, true, event.target.getAttribute("lat"), event.target.getAttribute("lon"));
		});
	}

	function openPopup(id, name, pushhistory, lat, lon) {
		$("#all").removeClass("view-shown").addClass("view-hidden");
		$("#pop-up-div").removeClass("view-hidden").addClass("view-shown");
		document.title = "Buster.lu - " + name;
		if (pushhistory) {
			history.pushState(null, "", "?s=" + id + "&n=" + name + "&lat=" + lat + "&lon=" + lon);
		}
		console.log("Popup for: " + id + ", " + name);
		var textbox = document.getElementById("pop-up-text");
		textbox.innerHTML = "Stop name: " + name;
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
		var map = document.getElementById("map");
		map.src = getmapurl(lat, lon);
		console.log(getmapurl(lat, lon));
		console.log("Displaying done.");
	}

	function getmapurl(lat, lon) {
	    var url = "https://www.openstreetmap.org/export/embed.html?bbox=";
	    var url2 = "&layer=mapnik&marker=";
	    var final = url + lat + "%2C" + lon + "%2C" + lat + "%2C" + lon + url2 + lon + "%2C" + lat;
	    return final;
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
			var l = /*$(document).height() / 2 / 42*/6;
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
				var time = ((json[i]["departure"] + delay) * 1000) - Date.now();
				if (time > 0) {
					date = new Date(time);
					var arrive = Number(date.getMinutes());
					if (arrive <= 0) {
						c3.innerHTML = "Now 🏃";
					} else if (arrive <= 10) {
						c3.innerHTML = arrive + " min";
					}
				} else {
					c3.innerHTML = "Now 🏃"; /* 🏃‍♀️ (Rendering issue) */
				}
				c1.style.overflow = "hidden";
				c1.style.textOverflow = "ellipsis";
				c1.style.whiteSpace = "nowrap";
				c2.style.overflow = "hidden";
				c2.style.textOverflow = "ellipsis";
				c2.style.whiteSpace = "nowrap";
				c3.style.overflow = "hidden";
				c3.style.textOverflow = "ellipsis";
				c3.style.whiteSpace = "nowrap";
				c2.style.fontSize = "14px";
				row.appendChild(c1);
				row.appendChild(c2);
				row.appendChild(c3);
				list.appendChild(row);
			}
		}
	}

	function closePopup() {
		console.log("Closing popup");
		$("#pop-up-div").removeClass("view-shown").addClass("view-hidden");
		$("#all").removeClass("view-hidden").addClass("view-shown");
	}

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
		document.getElementById("LocateBtn").innerHTML = "Please wait...";
		$("#dist").show();
		console.log(pos);
		var req = new XMLHttpRequest();
		var url = "https://api.tfl.lu/v1/StopPoint/around/" + pos.coords.longitude + "/" + pos.coords.latitude + "/1000";
		req.open("GET", url);
		req.send();
		req.onload = function() {
			document.getElementById("LocateBtn").innerHTML = "Locate me";
			var json = JSON.parse(req.response).features;
			var list = document.getElementById("table-content");
			$("#table-content > tr").slice(0).remove();
			json.sort(function(a, b){
			   	if (a["properties"]["distance"] > b["properties"]["distance"]) {
			   		return 1;
			   	}
			    if (a["properties"]["distance"] < b["properties"]["distance"]) {
			    	return -1;
			    }
			    return 0;
			});
			for (var i = 0; i < json.length && i < 5; i++) {
				var row = document.createElement("tr");
				var c1 = document.createElement("th");
				var c2 = document.createElement("a");
				var c3 = document.createElement("p");
				var c4 = document.createElement("th");
				c2.innerHTML = json[i]["properties"]["name"];
				c2.setAttribute("id", json[i]["properties"]["id"]);
				c2.style.cursor = "pointer";
				c2.setAttribute("lat", json[i]["geometry"]["coordinates"][0]);
				c2.setAttribute("lon", json[i]["geometry"]["coordinates"][1]);
				c2.className = "bus-stop";
				c2.style.overflow = "hidden";
				c2.style.textOverflow = "ellipsis";
				c2.style.whiteSpace = "nowrap";
				c3.innerHTML = roundup5(json[i]["properties"]["distance"]) + " meters";
				c3.style.overflow = "hidden";
				c3.style.textOverflow = "ellipsis";
				c3.style.whiteSpace = "nowrap";
				c1.appendChild(c2);
				c4.appendChild(c3);
				row.appendChild(c1);
				row.appendChild(c4);
				list.appendChild(row);
			}
			if (i > 0) {
				$("#result").show();
				$("#error").hide();
			} else {
				$("#result").hide();
				$("#error").show();
			}
			addEvents();
		}
	}

	function roundup5(x) {
		return (x % 5) ? x - x % 5 + 5 : x;
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
	    if (event.pageX <= 1) {
	    	document.getElementById("fork").style.visibility = "visible";
	    	document.getElementById("fork").style.top = event.pageY + "px";
	    	setTimeout(alert, 100, "It's a secret to everybody.");
    	}
	});

	document.getElementById("back-btn").onclick = function() {
		window.location.href = "index.html";
		document.title = "Buster.lu";
		closePopup();
	}

	window.onpopstate = function() {
		checkPopup();
	}
});