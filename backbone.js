$(document).ready(function() {

	var display_interval1;
	var display_interval2;
	var clock_interval;

	var display_json;

	checkPopup();
	
	// The following 9 rows are temporary only.
	$("#error").show();
	document.getElementById("error").style.height = "200px";
	document.getElementById("error").style.width = "80%";
	document.getElementById("error").style.marginTop = "60px";
	document.getElementById("error").style.marginLeft = "10%";
	document.getElementById("error").style.backgroundColor = "white";
	document.getElementById("error").style.border = "white";
	document.getElementById("error-text").innerHTML = "Unfortunately Buster.lu is not working at the moment, due to unexpected issues with the API used for fetching the real-time bus departure times. Fixing the API is not in our hands, but we are trying our best to get Buster.lu working again.<br><br>Thanks for all the feedback! It really tells us that Buster.lu has been found useful by many people :)";
	document.getElementById("error-text").style.textAlign = "justify";

	function search() {
		$("#dist").hide();
		var text = document.getElementById("input-text").value;
		var req = new XMLHttpRequest();
		var url = "https://api.tfl.lu/v1/StopPoint/Search/" + text;
		req.open("GET", url);
		req.send();
		req.onerror = function() {
			alert("Uh oh, there was an error searching for your stop.");
		}
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
		display(id, 1);
		display(id, 0);
		displayClock();
		clock_interval = setInterval(displayClock, 1000);
		display_interval1 = setInterval(display, 30000, id, 1);
		display_interval2 = setInterval(display, 5000, id, 0);
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
	function display(id, update) {
		if (update) {
			var req = new XMLHttpRequest();
			var url = "https://api.tfl.lu/v1/StopPoint/Departures/" + id;
			req.open("GET", url);
			req.send();
			req.onload = function() {
				display_json = JSON.parse(req.response);
				showdata();
			}
			req.onerror = function() {
				alert("Uh oh, there was an error fetching your bus schedules.");
			}
		} else {
			showdata();
		}
	}

	function showdata() {
		if (display_json == null) return;
		var list = document.getElementById("table-content-popup");
		$("#table-content-popup > tr").slice(0).remove();
		var l = /*$(document).height() / 2 / 42*/10;
		for (var i = 0; i < display_json.length && i < l; i++) {
			var row = document.createElement("tr");
			var c1 = document.createElement("th");
			var c2 = document.createElement("th");
			var c3 = document.createElement("th");
			c1.innerHTML = display_json[i]["line"];
			c2.innerHTML = display_json[i]["destination"];
			//var delay = display_json[i]["delay"] / 60;
			var date = new Date(display_json[i]["departure"] * 1000);
			var hours = date.getHours();
			var minutes = "0" + date.getMinutes();
			if (minutes.length == 3) {
				minutes = minutes.substr(1, 3);
			}
			c3.innerHTML = hours + ":" + minutes;
			var time = (display_json[i]["departure"] * 1000) - Date.now();
			if (time / 1000 >= 0) {
				date = new Date(time);
				var arriveM = Number(date.getMinutes());
				var arriveS = Number(date.getSeconds());
				if (arriveM <= 0 && arriveS <= 30) {
					c3.innerHTML = "Now 🏃";
					console.log(time / 1000);
				} else if (arriveM <= 10) {
					if (arriveM <= 0) {
						c3.innerHTML = "< 1 min";
					} else {
						c3.innerHTML = arriveM + " min";
					}
				}
			} else if (time / 1000 >= -30) {
				c3.innerHTML = "Now 🏃";
				console.log(time / 1000);
			} else {
				l++;
				continue;
			}
			c1.style.overflow = "hidden";
			c1.style.whiteSpace = "nowrap";
			c2.style.overflow = "hidden";
			c2.style.textOverflow = "ellipsis";
			c2.style.whiteSpace = "nowrap";
			c3.style.overflow = "hidden";
			c3.style.whiteSpace = "nowrap";
			c2.style.fontSize = "14px";
			row.appendChild(c1);
			row.appendChild(c2);
			row.appendChild(c3);
			list.appendChild(row);
		}
	}

	function closePopup() {
		console.log("Closing popup");
		$("#pop-up-div").removeClass("view-shown").addClass("view-hidden");
		$("#all").removeClass("view-hidden").addClass("view-shown");
		clearInterval(display_interval1);
		clearInterval(display_interval2);
		clearInterval(clock_interval);
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
		document.getElementById("LocateBtn").innerHTML = "Please wait...";
		navigator.geolocation.getCurrentPosition(showPosition, showError);
	});

	function showPosition(pos) {
		$("#dist").show();
		console.log(pos);
		var req = new XMLHttpRequest();
		var url = "https://api.tfl.lu/v1/StopPoint/around/" + pos.coords.longitude + "/" + pos.coords.latitude + "/1000";
		req.open("GET", url);
		req.send();
		req.onerror = function() {
			document.getElementById("LocateBtn").innerHTML = "Locate me";
			alert("Uh oh, there was an error searching for stops around you.");
		}
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

	window.onpopstate = function() {
		checkPopup();
	}
});
