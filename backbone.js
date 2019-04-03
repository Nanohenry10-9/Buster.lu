$(document).ready(function() {

	var display_interval1;
	var display_interval2;
	var clock_interval;

	var displayJSON = {};

	checkPopup();
	
	var stopList = [];
	var stopListURL = "all-stops-list.txt";
	var lReq = new XMLHttpRequest();
	lReq.open("GET", stopListURL);
	lReq.send();
	lReq.onload = function() {
		stopList = lReq.responseText.split('\n');
		for (var i = 0; i < stopList.length; i++) {
			var buf = "";
			var r = false;
			for (var j = 9; j < stopList[i].length; j++) {
				if (stopList[i][j] == '@') {
					break;
				}
				buf += stopList[i][j];
			}
			stopList[i] = [buf, stopList[i]];
		}
	}
	lReq.onerror = function() {
		alert("There was an error loading bus stop data.");
	}
	
	function getStopByName(n) {
		for (var i = 0; i < stopList.length; i++) {
			if (stopList[i][0] == n) {
				return stopList[i][1];
			}
		}
		return "Not found";
	}

	function search() {
		$("#dist").hide();
		var query = document.getElementById("input-text").value;
		var results = [];
		var q = query.toLowerCase().split(' ');
		for (var i = 0; i < stopList.length; i++) {
			var s = stopList[i][0].toLowerCase();
			var b = true;
			for (var j = 0; j < q.length; j++) {
				if (!s.includes(q[j])) {
					b = false;
					break;
				}
			}
			if (b) {
				results.push(stopList[i]);
			}
		}
		var list = document.getElementById("table-content");
		$("#table-content > tr").slice(0).remove();
		for (var i = 0; i < results.length && i < 5; i++) {
			var row = document.createElement("tr");
			var c1 = document.createElement("th");
			var c2 = document.createElement("a");
			c2.innerHTML = results[i][0];
			c2.setAttribute("id", results[i][1]);
			c2.style.cursor = "pointer";
			c2.className = "bus-stop";
			c2.style.overflow = "hidden";
			c2.style.textOverflow = "ellipsis";
			c2.style.whiteSpace = "nowrap";
			c2.addEventListener("click", function(event) {
				openPopup(event.target.getAttribute("id"));
			}, false);
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
	}

	function checkPopup() {
		var url = new URL(window.location.href);
		var s = url.searchParams.get("id");
		if (s != null) {
			openPopup(s);
		} else {
			document.title = "Buster.lu";
			closePopup();
		}
	}
	
	function loadLat(s) {
		var buf = "";
		var atCount = 2;
		var cCount = 4;
		for (var i = 0; i < s.length; i++) {
			if (s[i] == '@') {
				atCount--;
			}
			if (atCount == 0) {
				cCount--;
				if (cCount <= 0) {
					buf += s[i];
				}
			}
		}
		return parseInt(buf) / 1000000;
	}
	
	function loadLon(s) {
		var buf = "";
		var atCount = 3;
		var cCount = 4;
		for (var i = 0; i < s.length; i++) {
			if (s[i] == '@') {
				atCount--;
			}
			if (atCount == 0) {
				cCount--;
				if (cCount <= 0) {
					buf += s[i];
				}
			}
		}
		return parseInt(buf) / 1000000;
	}

	function getMapUrl(lat, lon) {
	    var url = "https://www.openstreetmap.org/export/embed.html?bbox=";
	    var url2 = "&layer=mapnik&marker=";
	    var final = url + lat + "%2C" + lon + "%2C" + lat + "%2C" + lon + url2 + lon + "%2C" + lat;
	    return final;
	}
	
	function loadSchedules(id) {
		var requestURL = "http://travelplanner.mobiliteit.lu/restproxy/departureBoard?accessId=cdt&format=json&" + id;
		var req = new XMLHttpRequest();
		req.open("GET", requestURL);
		req.send();
		req.onload = function() {
			displayJSON = JSON.parse(req.response);
		}
	}
	
	function openPopup(id) {
		var requestURL = "http://travelplanner.mobiliteit.lu/restproxy/departureBoard?accessId=cdt&format=json&" + id;
		var req = new XMLHttpRequest();
		req.open("GET", requestURL);
		req.send();
		req.onload = function() {
			displayJSON = JSON.parse(req.response);
			var name = displayJSON["Departure"][0]["stop"];
			$("#all").removeClass("view-shown").addClass("view-hidden");
			$("#pop-up-div").removeClass("view-hidden").addClass("view-shown");
			document.title = "Buster.lu - " + name;
			history.pushState(null, "", "?id=" + id);
			var textbox = document.getElementById("pop-up-text");
			textbox.innerHTML = "Stop name: " + name;
			var list = document.getElementById("table-content-popup");
			$("#table-content-popup > tr").slice(0).remove();
			var t1 = document.createElement("tr");
			var t2 = document.createElement("th");
			t2.innerHTML = "Please wait...";
			displayClock();
			t1.appendChild(t2);
			list.appendChild(t1);
			var map = document.getElementById("map");
			var latLon = displayJSON["Departure"][0]["stopid"];
			map.src = getMapUrl(loadLat(latLon), loadLon(latLon));
			showData();
			
			clock_interval = setInterval(displayClock, 1000);
			display_interval1 = setInterval(loadSchedules, 30000, id);
			display_interval2 = setInterval(showData, 5000, id);
		}
	}

	function showData() {
		if (displayJSON == null) return;
		var list = document.getElementById("table-content-popup");
		$("#table-content-popup > tr").slice(0).remove();
		var l = 10;
		var u = [];
		for (var i = 0; i < displayJSON["Departure"].length && i < l; i++) {
			if (displayJSON["Departure"][i]["rtTime"] == null) {
				l++;
				continue;
			}
			var d = displayJSON["Departure"][i]["rtTime"].split(':');
			var date = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), d[0], d[1], d[2]);
			var time = date - Date.now();
			if (time < -30) {
				l++;
				continue;
			}
			u.push(displayJSON["Departure"][i]);
		}
		u.sort(function(x, y) {
			var d1 = x["rtTime"].split(':');
			var d2 = y["rtTime"].split(':');
			var date1 = (new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), d1[0], d1[1], d1[2]) - Date.now()) / 1000;
			var date2 = (new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), d2[0], d2[1], d2[2]) - Date.now()) / 1000;
			if (date1 < date2) {
				return -1;
			}
			if (date1 > date2) {
				return 1;
			}
			return 0;
		});
		for (var i = 0; i < u.length; i++) {
			var row = document.createElement("tr");
			var c1 = document.createElement("th");
			var c2 = document.createElement("th");
			var c3 = document.createElement("th");
			c1.innerHTML = u[i]["Product"]["line"];
			c2.innerHTML = u[i]["direction"];
			var d = u[i]["rtTime"].split(':');
			var date = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), d[0], d[1], d[2]);
			var hours = "" + date.getHours();
			var minutes = "" + date.getMinutes();
			if (hours.length == 1) {
				hours = '0' + hours;
			}
			if (minutes.length == 1) {
				minutes = '0' + minutes;
			}
			c3.innerHTML = hours + ":" + minutes;
			var time = date - Date.now();
			if (time / 1000 >= 0) {
				date = new Date(time);
				var arriveM = Number(date.getMinutes());
				var arriveS = Number(date.getSeconds());
				if (arriveM <= 0 && arriveS <= 30) {
					c3.innerHTML = "Now 🏃";
				} else if (arriveM <= 10) {
					if (arriveM <= 0) {
						c3.innerHTML = "< 1 min";
					} else {
						c3.innerHTML = arriveM + " min";
					}
				}
			} else if (time / 1000 >= -30) {
				c3.innerHTML = "Now 🏃";
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

	var locTime;
	$("#LocateBtn").click(function() {
		document.getElementById("LocateBtn").innerHTML = "Please wait...";
		navigator.geolocation.getCurrentPosition(getStopsNearby, showError);
		locTime = Date.now();
	});

	function getStopsNearby(pos) {
		$("#dist").show();
		var req = new XMLHttpRequest();
		var look_y = Math.round(pos.coords.latitude * 1000000);
		var look_x = Math.round(pos.coords.longitude * 1000000);
		var url = "http://travelplanner.mobiliteit.lu/hafas/query.exe/dot?performLocating=2&tpl=stop2csv&stationProxy=yes%20&look_maxdist=500&look_x=" + look_x + "&look_y=" + look_y;
		req.open("GET", url);
		req.send();
		req.onerror = function() {
			document.getElementById("LocateBtn").innerHTML = "Locate me";
			alert("There was an error searching for stops around you.");
		}
		req.onload = function() {
			var p = parseRaw(req.response);
			for (var i = 0; i < p.length; i++) {
				p[i].push(getDistance(parseFloatC(p[i][1][1]), parseFloatC(p[i][1][0]), pos.coords.latitude, pos.coords.longitude));
			}
			document.getElementById("LocateBtn").innerHTML = "Locate me";
			var list = document.getElementById("table-content");
			$("#table-content > tr").slice(0).remove();
			if (p.length > 0) {
				$("#result").show();
				$("#error").hide();
			} else {
				$("#result").hide();
				$("#error").show();
			}
			for (var i = 0; i < p.length && i < 5; i++) {
				var row = document.createElement("tr");
				var c1 = document.createElement("th");
				var c2 = document.createElement("a");
				var c3 = document.createElement("p");
				var c4 = document.createElement("th");
				c2.innerHTML = p[i][1][3];
				c2.style.cursor = "pointer";
				c2.setAttribute("lat", p[i][1][1]);
				c2.setAttribute("lon", p[i][1][0]);
				c2.className = "bus-stop";
				c2.style.overflow = "hidden";
				c2.style.textOverflow = "ellipsis";
				c2.style.whiteSpace = "nowrap";
				c2.setAttribute("name", p[i][1][3]);
				c2.addEventListener("click", function(event) {
					openPopup(getStopByName(event.target.getAttribute("name")));
				}, false);
				c3.innerHTML = roundup5(p[i][2]) + " meters";
				c3.style.overflow = "hidden";
				c3.style.textOverflow = "ellipsis";
				c3.style.whiteSpace = "nowrap";
				c1.appendChild(c2);
				c4.appendChild(c3);
				row.appendChild(c1);
				row.appendChild(c4);
				list.appendChild(row);
			}
		}
	}
	
	function parseRaw(data) {
		var l = [];
		var r = [];
		var buf = "";
		var row = "";
		for (var i = 0; i < data.length; i++) {
			if (data[i] == '\n' || data[i] == '\r') {
				r.push(buf);
				l.push([row, r]);
				r = [];
				row = "";
				buf = "";
			} else if (data[i] == ';') {
				r.push(buf);
				buf = "";
			} else {
				row += data[i];
				buf += data[i];
			}
		}
		return l;
	}

	function roundup5(x) {
		return (x % 5) ? x - x % 5 + 5 : x;
	}

	function showError() {
		if (Date.now() - locTime < 50) {
			alert("You have denied access to location data.\n\nPlease allow location to use \"Locate me\".");
		}
		document.getElementById("LocateBtn").innerHTML = "Locate me";
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
    	}
	});

	window.onpopstate = function() {
		checkPopup();
	}
});

function parseFloatC(s) {
	var c = "";
	for (var i = 0; i < s.length; i++) {
		if (s[i] == ',') {
			c += '.';
		} else {
			c += s[i];
		}
	}
	return parseFloat(c);
}

function getDistance(lat1, lon1, lat2, lon2) {
	var dLat = radians(lat2 - lat1);
	var dLon = radians(lon2 - lon1);
	var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function radians(d) {
	return d * (Math.PI / 180);
}
