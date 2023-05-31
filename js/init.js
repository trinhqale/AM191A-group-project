// declare variables
let mapOptions = { 'center': [34.0709, -118.444], 'zoom': 10 }

// use the variables

// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
// }).addTo(map);

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
        // L.marker([data.lat, data.lng]).addTo(map).bindPopup(`<h2>${location}</h2> <h3>${(data['Do you like Anime/Manga?'] == "Yes") ? "Watch Anime" : "Do not watch Anime"}</h3>`)
        // createButtons(data.lat, data.lng, location)
        // return location
    let experience = data['Overall, what would you rate your work life balance?']
    let content
    if (experience.includes("Positive")) {
        console.log("positive")
    } else if (experience.includes("Negative")) {
        content = "Hello"
        console.log("negative")
            // neg.addLayer(L.circleMarker([data.lat, data.lng], circleOptions).bindPopup(content))
        L.marker([data.lat, data.lng]).addTo(map).bindPopup(content)
    } else {
        console.log("neutral")
    }
    // let caregiver = (data['Are you the primary caregiver of a dependent in your household?'] == "Yes") ? true : false;
    // if (caregiver)
    // {
    //     if (data[])
    // }
    // else
    // {

    // }
    return location

}

function onEachFeature(feature, layer) {
    console.log(feature.properties)
    if (feature.properties.values) {
        let count = feature.properties.values.length
        let targetRegion = layer.feature.properties.region
        console.log(count) // see what the count is on click
        let text = count.toString() // convert it to a string
        layer.bindPopup(targetRegion + ': ' + text + ' Responses'); //bind the pop up to the number
    }

    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: populateSidebar
    });
}

// function createButtons(lat, lng, title, content) {
//     const newButton = document.createElement("button"); // adds a new button
//     newButton.id = "button" + title; // gives the button a unique id
//     newButton.innerHTML = title; // gives the button a title
//     newButton.setAttribute("lat", lat); // sets the latitude 
//     newButton.setAttribute("lng", lng); // sets the longitude 
//     newButton.addEventListener('click', function() {
//         map.flyTo([lat, lng]); //this is the flyTo from Leaflet
//         const popup = L.popup() // creates a popup instance
//             .setLatLng([lat, lng]) // sets the popup location
//             .setContent(content) // sets the popup content
//             .openOn(map); // opens the popup on the map
//         window.scrollTo({ top: 80, behavior: "smooth" });
//     })
//     const spaceForButtons = document.getElementById('placeForButtons')
//     spaceForButtons.appendChild(newButton); //this adds the button to our page.
// }

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
    pos.addTo(map) // add our layers after markers have been made
    neg.addTo(map) // add our layers after markers have been made  
    neu.addTo(map)
    let allLayers = L.featureGroup([pos, neg]);
    map.fitBounds(allLayers.getBounds());
}

loadData(dataUrl)