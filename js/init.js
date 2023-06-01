let mapOptions = { 'center': [34.0709, -118.444], 'zoom': 10 }

let mapPath = "data/ca_zipcodes.geojson"

let positiveLayer = L.featureGroup();
let negativeLayer = L.featureGroup();
let neutralLayer = L.featureGroup();

let layers = {
    "Positive": positiveLayer,
    "Negative": negativeLayer,
    "Neutral": neutralLayer
};

let circleOptions = {
    radius: 6,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};


const dataUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRCF24Aalv8tZ3neF_4LZQ21KLokn5jtZgpc9-wiAuDhT1_LXNYtxKRtsM-eo0UAzhGUHqQvJCgCNmI/pub?output=csv"
const map = L.map('the_map').setView(mapOptions.center, mapOptions.zoom);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

L.control.layers(null, layers).addTo(map);

// create a function to add markers
function addMarker(data) {
    let location = data['What is the zip code of your primary home?']
    console.log(location, data.lat, data.lng)
    let content = "helloooo"
    let experience = data['Overall, what would you rate your work life balance?']

    if (experience.includes("Positive")) {
        console.log("positive")
        positiveLayer.addLayer(L.circleMarker([data.lat, data.lng], circleOptions).bindPopup(content))
    } else if (experience.includes("Negative")) {
        console.log("negative")
        negativeLayer.addLayer(L.circleMarker([data.lat, data.lng], circleOptions).bindPopup(content))
    } else if (experience.includes("Neutral")) {
        neutralLayer.addLayer(L.circleMarker([data.lat, data.lng], circleOptions).bindPopup(content))
    }
    return location
}

function loadData(url) {
    Papa.parse(url, {
        header: true,
        download: true,
        complete: results => processData(results)
    })
}

function processData(results) {
    console.log(results)
    results.data.forEach(data => {
        console.log(data)
        addMarker(data)
    })
    positiveLayer.addTo(map)
    negativeLayer.addTo(map)
    neutralLayer.addTo(map)
    let allLayers = L.featureGroup([positiveLayer, negativeLayer, neutralLayer]);
    map.fitBounds(allLayers.getBounds());
    getBoundary(mapPath)
}

// mapping by zipcode
function getBoundary(mapPath) {
    fetch(mapPath)
        .then(response => {
            return response.json();
        })
        .then(data => {
            currentLayer = L.geoJSON(data, {}).addTo(map)
        })
}

loadData(dataUrl)