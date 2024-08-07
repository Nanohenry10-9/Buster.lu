const _parseCommaFloat = s => parseFloat(s.replace(",", "."));
const _toRadians = deg => deg * (Math.PI / 180);

const _computeCoordDistance = (lat1, lon1, lat2, lon2) => {
	var dLat = _toRadians(lat2 - lat1);
	var dLon = _toRadians(lon2 - lon1);
	var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(_toRadians(lat1)) * Math.cos(_toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

	// 6366 km is the approximate radius of the Earth in Luxembourg
	// The difference is tiny, but hey, why not make it precise

	return 6366000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const _getResourceAsJSON = url => fetch(server + url).then(resp => resp.json());

const _showSpinner = elem => {
	var bounds = elem.getBoundingClientRect();

	var cont = document.createElement("div");
	cont.classList.add("spinner-container");
	cont.style.position = "absolute";
	cont.style.left = `${bounds.right + window.scrollX + 5}px`;
	cont.style.top = `${bounds.top + window.scrollY}px`;

	var spinner = document.createElement("div");
	spinner.classList.add("spinner");
	spinner.classList.add("cw");
	cont.appendChild(spinner);

	var spinner2 = document.createElement("div");
	spinner2.classList.add("spinner");
	spinner2.classList.add("ccw");
	cont.appendChild(spinner2);

	document.body.appendChild(cont);
	return cont;
};

const _hideSpinner = spinner => {
	document.body.removeChild(spinner);
};

const _errorBox = msg => {
	// todo
	alert(msg);
};

/*
<div id="error" class="alert alert-warning" role="alert">
	<h4 id="error-text">No results</h4>
</div>
*/

const _warning = msg => {
	const container = document.createElement("div");
	container.classList.add("alert");

	const text = document.createElement("p");
	text.innerHTML = msg;

	container.appendChild(text);

	return container;
};

const _isNumeric = str => !isNaN(str) && !isNaN(parseFloat(str));

const _normalize = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const _formatDist = dist => {
	dist = Math.round(dist);
	if (dist >= 1000) {
		return (Math.round(dist / 100.0) / 10.0) + " km";
	}
	return dist + " m";
};

const _formatTime = t => {
	const d = t - Date.now();
	if (d < 0) {
		return "Now 🏃";
	}
	if (d < 60000) {
		return "< 1 min";
	}
	if (d > 10 * 60000) { // 10 mins
		return t.toLocaleTimeString("fr-LU", {timeZone: "Europe/Luxembourg"}).substring(0, 5);
	}
	return `${Math.round(d / 60000)} min`;
};

const _generateBusIcon = (bg, fg, line) => {
	var elem = document.createElement("div");
	elem.classList.add("busLineIcon");
	elem.style.backgroundColor = bg;
	elem.style.color = fg;
	elem.innerHTML = line;
	return elem;
};

const _generateDistIcon = dist => {
	var elem = document.createElement("div");
	elem.classList.add("distance");
	elem.innerHTML = dist;
	return elem;
};

const _productToBusInfo = product => {
	if (Array.isArray(product)) product = product[0];
	return {
		type: product.catOut,
		line: (product.line && product.line != ""? product.line : product.name).replace(" ", ""),
		color: {
			bg: product.icon.backgroundColor.hex,
			fg: product.icon.foregroundColor.hex
		}
	};
}

const _updateCollapsibleHeight = elem => {
	if (!elem.classList.contains("active")) {
		elem.style.maxHeight = null;
	} else {
		elem.style.maxHeight = elem.scrollHeight + "px";
	}
};

const _getStopFromParams = () => {
	const params = new URLSearchParams(window.location.search);
	const stopData = JSON.parse(localStorage.getItem("stops"))?.data;

	if (!stopData) {
		params.append("page", window.location.pathname.substring(1).split(".")[0]);
		window.location.replace(`/?${params.toString()}`);
	}

	const getStopID = () => {
		if (params.has("id")) {
			return params.get("id");
		}

		if (params.has("name")) {
			const searchName = params.get("name");

			return stopData.filter(stop => utils.normalize(searchName).split(" ").every(name => utils.normalize(stop.name).includes(name)))[0]?.id;
		}

		return null;
	};
	
	const id = getStopID();

	if (!id) return null;

	return stopData.filter(stop => stop.id == id)[0];
};

const utils = {
	computeCoordDistance: _computeCoordDistance,
	parseCommaFloat: _parseCommaFloat,
	toRadians: _toRadians,
	getResourceAsJSON: _getResourceAsJSON,
	showSpinner: _showSpinner,
	hideSpinner: _hideSpinner,
	errorBox: _errorBox,
	warning: _warning,
	isNumeric: _isNumeric,
	normalize: _normalize,
	formatDist: _formatDist,
	formatTime: _formatTime,
	generateBusIcon: _generateBusIcon,
	generateDistIcon: _generateDistIcon,
	productToBusInfo: _productToBusInfo,
	updateCollapsibleHeight: _updateCollapsibleHeight,
	getStopFromParams: _getStopFromParams
};
