// declare variables
let mapOptions = { 'center': [34.0709, -118.444], 'zoom': 10 }
    // use the variables
const dataUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRCF24Aalv8tZ3neF_4LZQ21KLokn5jtZgpc9-wiAuDhT1_LXNYtxKRtsM-eo0UAzhGUHqQvJCgCNmI/pub?output=csv"
const boundaryLayer = "data/ca_zipcodes.geojson"
    // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    // }).addTo(map);

let currentLayer
let zipcodes = []

let pos = L.featureGroup();
let neg = L.featureGroup();
let neu = L.featureGroup();

let layers = {
    "Positive": pos,
    "Negative": neg,
    "Neutral": neu
};

let circleOptions = {
    radius: 6,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};

const map = L.map('the_map').setView(mapOptions.center, mapOptions.zoom);

let Jawg_Light = L.tileLayer('https://{s}.tile.jawg.io/jawg-light/{z}/{x}/{y}{r}.png?access-token={accessToken}', {
    attribution: '<a href="http://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    minZoom: 0,
    maxZoom: 22,
    subdomains: 'abcd',
    accessToken: 'FkWnkf1e22dnL71CnkeDRnZeEZRyPNd6DqNr2frT4o5zPMcnKvgfcgG2gQCNjnR7'
});

Jawg_Light.addTo(map)

// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
// }).addTo(map);

L.control.layers(null, layers).addTo(map);



// create a function to add markers
function addRegion(data) {
    let zipcode = data['What is the zip code of your primary home?']
    console.log(location, data.lat, data.lng)
    let experience = data['Overall, what would you rate your work life balance?']
    let content = "Hello"

    // if (experience.includes("Positive")) {
    //     console.log("positive")
    //     L.marker([data.lat, data.lng]).addTo(map).bindPopup(content)
    // } else if (experience.includes("Negative")) {
    //     console.log("negative")
    //         // neg.addLayer(L.circleMarker([data.lat, data.lng], circleOptions).bindPopup(content))
    //     L.marker([data.lat, data.lng]).addTo(map).bindPopup(content)
    // } else if (experience.includes("Neutral")) {
    //     console.log("neutral")
    //     L.marker([data.lat, data.lng]).addTo(map).bindPopup(content)
    // }
    return zipcode
}

function highlightFeature(e, zipCode) {
    let layer = e.target;
    let fillColor = layer.options.fillColor;
    let count = 0;
    for (let i = 0; i < zipcodes.length; i++) {
        if (zipcodes[i] == zipCode) {
            count++;
        }
    }
    let popupMessage = `🏠: ${zipCode}
                        <br>
                        Total Responses: ${count}`
        // Check if the fill color is not grey
    if (fillColor !== "#efefef") {
        layer.bindPopup(popupMessage).openPopup();
        layer.setStyle({
            weight: 5,
            color: "#666",
            dashArray: '',
            fillOpacity: 0.7
        });
    }

    layer.bringToFront();
}

function resetHighlight(e) {
    currentLayer.resetStyle(e.target);
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
    let zipCode = feature.properties.zcta;
    layer.on("mouseover", function(e) {
        highlightFeature(e, zipCode);
    });
    layer.on({
        // mouseover: highlightFeature(zipCode),
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

function getColor() {
    var r = Math.floor(Math.random() * 255);
    var g = Math.floor(Math.random() * 255);
    var b = Math.floor(Math.random() * 255);
    return "rgb(" + r + " ," + g + "," + b + ")";
}

function getBoundary(layer, zipcodes) {
    fetch(layer)
        .then(response => {
            return response.json();
        })
        .then(data => {

            //set the boundary to data

            console.log("Current data: ", data)
                // here is the geoJson of the `collected` result:
            function style(feature) {
                let zipCode = feature.properties.zcta;

                // Check if the current zip code is in the desired set
                if (zipcodes.includes(zipCode)) {
                    return {
                        fillColor: getColor(),
                        weight: 2,
                        opacity: 1,
                        color: 'white',
                        dashArray: '3',
                        fillOpacity: 0.7
                    };
                } else {
                    return {
                        fillColor: "#efefef",
                        opacity: 0
                    };
                }
            }
            currentLayer = L.geoJSON(data, {
                style: style,
                onEachFeature: onEachFeature
            }).addTo(map)
        })
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
        console.log("data object: ", data)
        zipcodes.push(addRegion(data))
    })
    pos.addTo(map) // add our layers after markers have been made
    neg.addTo(map) // add our layers after markers have been made  
    neu.addTo(map)
    let allLayers = L.featureGroup([pos, neg, neu]);
    // map.fitBounds(allLayers.getBounds());
    console.log(zipcodes)
    getBoundary(boundaryLayer, zipcodes)
}

loadData(dataUrl)