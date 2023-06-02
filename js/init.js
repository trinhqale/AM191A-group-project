let mapOptions = { 'center': [34.0709, -118.444], 'zoom': 10 }

let mapPath = "data/ca_zipcodes.geojson"

let positiveLayer = L.featureGroup();
let negativeLayer = L.featureGroup();
let neutralLayer = L.featureGroup();

let positiveResponses = []
let negativeResponses = []
let neutralResponses = []

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
    

    
    return location
}

function loadData(url) {
    Papa.parse(url, {
        header: true,
        download: true,
        complete: results => processData(results)
    })
}

function filterResponseData(data)
{
    let userZipcode = data['What is the zip code of your primary home?']
    let userExperience = data['Overall, what would you rate your work life balance?']
    let caregiver = (data['Are you the primary caregiver of a dependent in your household?'] == "Yes")? true : false
    let userResponse = {
        "zipcode" : data['What is the zip code of your primary home?'], 
        "commuteMeans" : data['How do you typically travel to and from campus?'],
        "caregiver" :  caregiver
    }
    
    if (userExperience.includes("Positive")) {
        console.log("positive")
        positiveLayer.addLayer(L.circleMarker([data.lat, data.lng], circleOptions).bindPopup(content))
    } else if (userExperience.includes("Negative")) {
        console.log("negative")
        negativeLayer.addLayer(L.circleMarker([data.lat, data.lng], circleOptions).bindPopup(content))
    } else if (userExperience.includes("Neutral")) {
        console.log("neutral")
        neutralLayer.addLayer(L.circleMarker([data.lat, data.lng], circleOptions).bindPopup(content))
    }
}

function processData(results) {
    console.log(results)
    results.data.forEach(data => {
        console.log(data)
        filterResponseData(data)
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
            function getColor() {
                var r = Math.floor(Math.random() * 255);
                var g = Math.floor(Math.random() * 255);
                var b = Math.floor(Math.random() * 255);
                return "rgb(" + r + " ," + g + "," + b + ")";
            }

            function style(feature) {
                return {
                    fillColor: getColor(),
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.7
                };
            }
            currentLayer = L.geoJSON(data, {
                style: style,
                // onEachFeature: onEachFeature
            }).addTo(map)
        })
}

loadData(dataUrl)