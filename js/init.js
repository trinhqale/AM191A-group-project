let mapOptions = { 'center': [34.0709, -118.444], 'zoom': 10 }
const map = L.map('the_map').setView(mapOptions.center, mapOptions.zoom);

let mapPath = "data/ca_zipcodes.geojson"

let positiveResponses = []
let negativeResponses = []
let neutralResponses = []

let caregiverResponses = []
let noncaregiverResponses = []

let currentLayer

const dataUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRCF24Aalv8tZ3neF_4LZQ21KLokn5jtZgpc9-wiAuDhT1_LXNYtxKRtsM-eo0UAzhGUHqQvJCgCNmI/pub?output=csv"

// change map type
let Jawg_Light = L.tileLayer('https://{s}.tile.jawg.io/jawg-light/{z}/{x}/{y}{r}.png?access-token={accessToken}', {
    attribution: '<a href="http://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    minZoom: 0,
    maxZoom: 22,
    subdomains: 'abcd',
    accessToken: 'FkWnkf1e22dnL71CnkeDRnZeEZRyPNd6DqNr2frT4o5zPMcnKvgfcgG2gQCNjnR7'
});
Jawg_Light.addTo(map)

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
        filterResponseData(data)
    })
    // TODO: add filter checkbox/buttons and get proper responses 
    let chosenResponses = positiveResponses.concat(negativeResponses, neutralResponses) 
    getBoundary(mapPath, chosenResponses) 
}

function filterResponseData(data)
{
    let userZipcode = data['What is the zip code of your primary home?']
    let userExperience = data['Overall, what would you rate your work life balance?']
    let caregiver = (data['Are you the primary caregiver of a dependent in your household?'] == "Yes")? true : false
    // TODO: add more details as needed 
    let userResponse = {
        "zipcode" : userZipcode, 
        "commuteMeans" : data['How do you typically travel to and from campus?'],
        "caregiver" :  caregiver,
        "WLBStory" : data['How is your work life balance affected by the way you commute?'],
    }
    if (userExperience.includes("Positive")) {
        console.log("positive")
        positiveResponses.push(userResponse)
    } else if (userExperience.includes("Negative")) {
        console.log("negative")
        negativeResponses.push(userResponse)
    } else if (userExperience.includes("Neutral")) {
        console.log("neutral")
        neutralResponses.push(userResponse)
    }

    // TODO: Caregiver responses
}

// mapping by zipcode
function getBoundary(mapPath, userResponses) {
    fetch(mapPath)
    .then(response => {
        return response.json();
        })
        .then(data => {
            function getStyle(currentZipcode) {
                // check if the current zipcode is in the responses
                for(let i = 0; i < userResponses.length; i++)
                {
                    // TODO: instead of random color, maybe color based on number of responses?  
                    if(userResponses[i].zipcode == currentZipcode)
                    {
                        console.log("Matched")
                        var r = Math.floor(Math.random() * 255);
                        var g = Math.floor(Math.random() * 255);
                        var b = Math.floor(Math.random() * 255);
                        return {fillColor: "rgb(" + r + " ," + g + "," + b + ")",
                        opacity : 1}
                    }
                } //else return blank
                return {fillColor: "#efefef",
                        opacity : 0}
            }
            function style(feature) {
                return getStyle(feature.properties.zcta)
            }
            currentLayer = L.geoJSON(data, {
                style: style,
                onEachFeature: onEachFeature
            }).addTo(map)
        })
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: populateSidebar
    });
}

// TODO: Custom highlight info as in tutorial: https://leafletjs.com/examples/choropleth/
function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    layer.bringToFront();
}

function resetHighlight(e) {
    currentLayer.resetStyle(e.target);
}

// TODO: make sidebar here, currently just zoom in to the region
function populateSidebar(e) {
    map.fitBounds(e.target.getBounds());
}

loadData(dataUrl)