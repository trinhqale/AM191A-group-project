// DEFINE GLOBAL VARIABLES

let mapOptions = { 'center': [34.0709, -118.444], 'zoom': 10 };
const map = L.map('the_map').setView(mapOptions.center, mapOptions.zoom);

const MAP_PATH = "data/ca_zipcodes.geojson"
const DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRCF24Aalv8tZ3neF_4LZQ21KLokn5jtZgpc9-wiAuDhT1_LXNYtxKRtsM-eo0UAzhGUHqQvJCgCNmI/pub?output=csv"

//TODO: make these layers
let positiveResponses = []
let negativeResponses = []
let neutralResponses = []

let caregiverResponses = []
let noncaregiverResponses = []

let chosenResponses = []

let currentLayer


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
        complete: results => processData(results.data)
    })
}

/**
 * Handle the highlight of the features
 * @param {*} e : event
 */
function highlightFeature(e) {
    let layer = e.target;
    layer.bringToFront();
    info.update(layer.feature.properties);
}

function resetHighlight(e) {
    currentLayer.resetStyle(e.target);
    info.update();
}

/**
 * Prepare
 * @param {*} results 
 */
function processData(data) {
    console.log("Data Length: " + data.length);
    data.forEach(column => {
            console.log(column)
            parseResponseData(column)
        });

    // TODO: LAYERS!!!!! add filter checkbox/buttons and get proper responses 
    chosenResponses = positiveResponses.concat(negativeResponses, neutralResponses);
    getBoundary(MAP_PATH, chosenResponses);
}

/**
 * Helper for processData, which adds responses to layers 
 * @param {*} data, JSON data: list
 */
function parseResponseData(data) {
    let userZipcode = data['What is the zip code of your primary home?'];
    let userExperience = data['Overall, what would you rate your work life balance?'];
    let caregiver = data['Are you the primary caregiver of a dependent in your household?'];
    let WLBStory = data['How is your work life balance affected by the way you commute?'];
    let household = data['How many people are in your household?'];
    let commuteMeans = data['How do you typically travel to and from campus?']
    // TODO: add more details as needed 
    let userResponse = {
        "zipcode": userZipcode,
        "commuteMeans": commuteMeans,
        "caregiver": caregiver,
        "household": household,
        "WLBStory": WLBStory,
        "experience": userExperience,
    };
    // LAYERS
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

/**
 * TODO: NEEDS REFACTOR
 * Helper for getBoundary, which determines the color and style of the map boundary
 * @param {*} feature, a JSON data list member 
 * @returns style depending on responseNumber 
 */
function getStyle(feature) {
    let currentZipcode = feature.properties.zcta;
    let count = getResponseNumber(currentZipcode);
    if (count > 0)
    {
        return{
            fillColor: getColor(count),
            weight: 1,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        } 
    }
    else{
        return {
            fillColor: "#efefef",
            opacity: 0
        }
    }
}

/**
 * gets Boundary mapping given map URL (map) zipcode
 * @param {*} mapPath, URL path to map
 * @param {*} chosenResponses,  
 */
function getBoundary(mapPath, chosenResponses) {
    fetch(mapPath)
        .then(response => {
            return response.json();
        })
        .then(data => {
            currentLayer = L.geoJSON(data, {
                style: getStyle,
                onEachFeature: onEachFeatureClosure(chosenResponses)
            }).addTo(map)
        })
}

/**
 * Helper, filters responses by mathcing zipcode
 * @param {*} currentZipcode zipcode which you want to highlight
 * @returns returns responses filtered for matching zipcode
 */
function getResponseNumber(zip){
    return chosenResponses.filter(member => member.zipcode === zip).length;
}

// TODO: Change the scale as we get more responses
// TODO: Change the colors as you like at https://colorbrewer2.org/#type=sequential&scheme=BuGn&n=3 (Ctrl + Click)
function getColor(d) {
    // return d >= 5 ? '#b30000' :
    //        d >= 4 ? '#e34a33' :
    //        d >= 3 ? '#fc8d59' :
    //        d >= 2 ? '#fdbb84' :
    //        d >= 1 ? '#fdd49e' :
    //                 '#fef0d9' ;
    return d >= 2 ?  '#e34a33':
           d >= 1 ? '#fdbb84' :
           null
}


function onEachFeatureClosure(chosenResponses) {
    return (feature, layer) => {
        let responsesByZipcode = []
        chosenResponses.forEach(response => {
            if (response.zipcode == feature.properties.zcta) {
                responsesByZipcode.push(response)
            }
        })
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: populateSidebar(responsesByZipcode)
        });
    }
}

// TODO: make changes to sidebar here
function populateSidebar(responsesByZipcode) {
    return (e) => {
        let layer = e.target
        if(responsesByZipcode.length != 0)
        {
            map.fitBounds(layer.getBounds());
            document.getElementById("stories").innerHTML = ""
            console.log(responsesByZipcode)

            // add if statement to sort through caregiver vs not to include caregiver question
            responsesByZipcode.forEach(response => {
                document.getElementById("stories").innerHTML += 
                `<div class="response"> 
                    <img src='assets/home-icon.png'> ${response.zipcode} <br>
                    <img src='assets/bus-icon.png'> ${response.commuteMeans} <br> 
                    <img src='assets/caregiver-icon.png'> Caregiver: ${response.caregiver} <br> 
                    Household: ${response.household} <br> <br>
                    <b>How is your work life balance affected by the way you commute?</b> <br> ${response.WLBStory} 
                </div>`
            })
        }
    }
}

// Add info for mouse hovering 
let info = L.control();
info.onAdd = function () {
    this._div = L.DomUtil.create('div', 'info'); 
    this.update();
    return this._div;
};

info.update = function (props) {
    let count = 0
    if(props){
        count = getResponseNumber(props.zcta)
    }
    this._div.innerHTML = 
        '<h4>Responses by Zipcode</h4>' +  ((props && count != 0) ?
        '<img src="assets/home-icon.png"> Zipcode: ' + props.zcta + '<br />' + 'Responses: ' + count
        : 'Hover over a region!');
};

info.addTo(map);

// add legend
// TODO: change the scale as we receive more responses
let legend = L.control({position: 'bottomleft'});

legend.onAdd = function () {
    let div = L.DomUtil.create('div', 'info legend');
    let grades = [1,2]; // change here
    for (let i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + 
            getColor(grades[i] ) 
            + '"></i> '  + (grades[i]) + '<br>';
    }
    console.log("Color: ", getColor(grades[i] + 1))

    return div;
};


// EXECUTE THIS CODE
loadData(DATA_URL)
// TODO: add UCLA marker with custom design

// TODO: Calculate distance from UCLA
legend.addTo(map);