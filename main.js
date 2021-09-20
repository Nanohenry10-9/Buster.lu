const server = "https://cdt.hafas.de/";

const apiKey = "c2fb3438-45a4-48ff-9f5f-3546da29c6a9"; // this is the universal/public key, no worries

const api = {
	stops: opt => `opendata/apiserver/location.nearbystops?accessId=${apiKey}&id=220401001&originCoordLong=${opt.lon}&originCoordLat=${opt.lat}&maxNo=${opt.n}&r=${opt.r}&format=json`,
	departures: opt => `opendata/apiserver/departureBoard?accessId=${apiKey}&lang=fr&id=${opt.id}&format=json`
};

const luxCoords = {lat: 49.77723, lon: 6.09528};
const maxDist = 80000; // height of Luxembourg
const maxStops = 5000; // currently there are ~3000 stops

var userCoords = null;
var loadingCoords = false;
var lastSearch = {names: [], lines: []};
var hideLoading = false;
var intervals = [];

var busLines = new Set();

const updateSearch = () => {
	const resultContainer = document.getElementById("result");

	var results = stops;
	if (lastSearch.names.length > 0) {
		results = results.filter(stop => lastSearch.names.every(name => utils.normalize(stop.name).includes(name)));
	}
	if (lastSearch.lines.length > 0) {
		results = results.filter(stop => lastSearch.lines.every(line => stop.buses?.some(bus => utils.normalize(bus.line) == line)));
	}

	if (userCoords) {
		results = results.map(stop => ({...stop, dist: utils.computeCoordDistance(stop.lat, stop.lon, userCoords.lat, userCoords.lon)}));

		results = results.sort((a, b) => a.dist - b.dist);
	}

	results = results.slice(0, 5);

	const collapsible = (header, content) => {
		const container = document.createElement("div");
		container.classList.add("collapsible-container");

		const headerElem = document.createElement("div");
		headerElem.classList.add("collapsible-header");
		header.forEach(elem => headerElem.appendChild(elem));

		const contentElem = document.createElement("div");
		contentElem.classList.add("collapsible-content");
		content.forEach(elem => contentElem.appendChild(elem));

		headerElem.addEventListener("click", () => {
			headerElem.classList.toggle("active");
			contentElem.classList.toggle("active");
			utils.updateCollapsibleHeight(contentElem);
		});

		container.appendChild(headerElem);
		container.appendChild(contentElem);

		return container;
	};

	const updateDepartureTable = (elem, id) => {
		const makeDate = (date, time) => new Date(`${date}T${time}.000+02:00`);

		const depTable = data => {
			const tableRow = vals => {
				const row = document.createElement("tr");
				row.classList.add("departure-table-row");
				vals.forEach(val => {
					const col = document.createElement("td");
					col.innerHTML = val;
					row.appendChild(col);
				});
				return row;
			};

			const tab = document.createElement("table");
			tab.classList.add("departure-table");
			tab.appendChild(tableRow(["Line", "Direction", "Time"]));
			data.forEach(dep => {
				tab.appendChild(tableRow([utils.generateBusIcon(dep.color.bg, dep.color.fg, dep.line).outerHTML, dep.direction, utils.formatTime(dep.time)]));
			});

			/*
			Le epic hack to have auto table layout without row wrap:

			1) The table is created with auto layout set in CSS (through the departure-table class)
			2) The browser automagically spaces the elements
			3) Once this is done (i.e. after a 1 ms timeout), the column widths are read from the table
			4) The column widths are explicitly set with the width attribute (except for the middle one, which occupies the leftover space)
			5) The table's layout attribute is set to fixed
			*/

			setTimeout(() => {
				const columnWidths = Array.from(tab.children[0].children).map(col => col.offsetWidth);
				Array.from(tab.children).forEach(row => {
					Array.from(row.children).forEach((col, index) => {
						if (index != 1) col.style.width = `${columnWidths[index]}px`;
					});
				});
				tab.style.tableLayout = "fixed";
			}, 1);

			return tab;
		};

		utils.getResourceAsJSON(api.departures({id: id})).then(data => {
			while (elem.firstChild) elem.removeChild(elem.lastChild);

			if (data.Departure) {
				elem.appendChild(depTable(data.Departure.map(dep => ({...utils.productToBusInfo(dep.Product), time: makeDate(dep.rtDate || dep.date, dep.rtTime || dep.time), direction: dep.direction})).sort((a, b) => a.time - b.time).slice(0, 15)));
			} else {
				elem.appendChild(utils.warning("No departures"));
			}

			utils.updateCollapsibleHeight(elem.parentNode);
		});
	};

	const beginDepartureTableUpdate = (elem, id) => {
		intervals.push(setInterval(() => updateDepartureTable(elem, id), 30000));
		updateDepartureTable(elem, id);
	};

	const resultTable = data => data.map(stop => {
		const headerL = document.createElement("div");
		headerL.classList.add("collapsible-header-elem-l");
		headerL.innerHTML = stop.dist? `<span class=\"stop-name\">${stop.name}</span> ${utils.generateDistIcon(utils.formatDist(stop.dist)).outerHTML}` : `<span class=\"stop-name\">${stop.name}</span>`;

		const headerR = document.createElement("div");
		headerR.classList.add("collapsible-header-elem-r");
		headerR.innerHTML = stop.buses?.map(bus => utils.generateBusIcon(bus.color.bg, bus.color.fg, bus.line).outerHTML).join(" ") || "";

		const content = document.createElement("div");
		content.classList.add("collapsible-content-elem");

		beginDepartureTableUpdate(content, stop.id);

		return collapsible([headerL, headerR], [content]);
	});

	intervals.forEach(interval => clearInterval(interval));
	intervals = [];

	while (resultContainer.firstChild) resultContainer.removeChild(resultContainer.lastChild);
	
	if (results.length > 0) {
		resultTable(results).forEach((elem, index) => {
			setTimeout(() => elem.classList.add("visible"), index * 80);
			resultContainer.appendChild(elem);
		});
	} else {
		const w = utils.warning("No results");
		w.classList.add("animated");
		setTimeout(() => w.classList.add("visible"), 1);
		resultContainer.appendChild(w);
	}
};

const onInputChange = value => {
	const search = utils.normalize(value).split(" ");

	const names = search.filter(w => !busLines.has(w));
	const lines = search.filter(w => busLines.has(w));

	if (lastSearch.names != names || lastSearch.lines != lines) {
		lastSearch = {names: names, lines: lines};
		updateSearch();
	}
};

const onLoadingFinished = () => {
	const nameInput = document.getElementById("name-input");
	if (nameInput.value.length > 0) {
		onInputChange(nameInput.value);
	}
};

var stops = JSON.parse(localStorage.getItem("stops"));

//console.log(`Data is from ${(Date.now() - stops?.ts) / 86400000} days ago (ts = ${stops?.ts})`);
if (!stops || !stops.ts || Date.now() - stops.ts > 10 * 86400000) { // 10 days
	//console.log("Downloading stop data");
	utils.getResourceAsJSON(api.stops({...luxCoords, n: maxStops, r: maxDist})).then(data => {
		stops = data.stopLocationOrCoordLocation.map(stop => ({name: stop.StopLocation.name, id: stop.StopLocation.id, lat: stop.StopLocation.lat, lon: stop.StopLocation.lon, buses: stop.StopLocation.productAtStop?.map(utils.productToBusInfo)}));

		busLines = new Set([].concat.apply([], stops.map(stop => stop.buses?.map(bus => bus.line.toLowerCase()))));

		localStorage.setItem("stops", JSON.stringify({data: stops, ts: Date.now()}));

		document.getElementById("loading").classList.add("done");
		setTimeout(() => document.getElementById("loading").style.display = "none", 500);

		onLoadingFinished();
	});
} else {
	stops = stops.data;

	busLines = new Set([].concat.apply([], stops.map(stop => stop.buses?.map(bus => bus.line.toLowerCase()))));

	hideLoading = true;
}

window.addEventListener("load", () => {
	if (hideLoading) {
		document.getElementById("loading").style.display = "none";
		onLoadingFinished();
	}

	const locationToggle = document.getElementById("locationToggle");
	const nameInput = document.getElementById("name-input");

	locationToggle.addEventListener("click", evt => {
		if (loadingCoords) return;

		locationToggle.classList.toggle("enabled");
		setTimeout(() => {
			if (locationToggle.classList.contains("enabled") && userCoords == null) {
				const spinner = utils.showSpinner(locationToggle);
				loadingCoords = true;
				locationToggle.classList.toggle("blocked");

				navigator.geolocation.getCurrentPosition(
					pos => {
						userCoords = {lat: pos.coords.latitude, lon: pos.coords.longitude};
						utils.hideSpinner(spinner);
						loadingCoords = false;
						locationToggle.classList.remove("blocked");

						updateSearch();
					}, err => {
						userCoords = null;
						if (err.code == err.PERMISSION_DENIED) {
							utils.errorBox("Permission was denied for location information. Please make sure that location services are enabled and that they are not blocked for this site.");
						} else {
							utils.errorBox("An error occurred while determining location. Please try again later.");
						}
						locationToggle.classList.remove("enabled");
						utils.hideSpinner(spinner);
						loadingCoords = false;
						locationToggle.classList.remove("blocked");
					}
				);
			} else {
				userCoords = null;

				updateSearch();
			}
		}, 1);
	});

	nameInput.addEventListener("keyup", evt => {
		onInputChange(nameInput.value);
	});
});
