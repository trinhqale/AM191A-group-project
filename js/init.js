// DEFINE GLOBAL VARIABLES

let mapOptions = { 'center': [34.0709, -118.444], 'zoom': 10 };
const map = L.map('the_map').setView(mapOptions.center, mapOptions.zoom);

const MAP_PATH = "data/ca_zipcodes.geojson"
const DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRCF24Aalv8tZ3neF_4LZQ21KLokn5jtZgpc9-wiAuDhT1_LXNYtxKRtsM-eo0UAzhGUHqQvJCgCNmI/pub?output=csv"

// checkboxes for user rating
const postiveResponsesLegendHtml = document.getElementById("positiveCheckbox");
const negativeResponsesLegendHtml = document.getElementById("negativeCheckbox");
const neutralResponsesLegendHtml = document.getElementById("neutralCheckbox");

// Layers
let positiveLayer = L.featureGroup()
let negativeLayer = L.featureGroup()
let neutralLayer = L.featureGroup()

// whether to display experience on sidebar
let displayPositiveResponses = true
let displayNegativeResponses = true
let displayNeutralResponses = true


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
 * Prepare
 * @param {*} results 
 */
function processData(data) {
    let allResponses = []
    console.log("Data Length: " + data.length);
    data.forEach(column => {
            console.log(column)
            let userResponse = getUserResponseData(column)
            allResponses.push(userResponse)
        });
    getBoundary(MAP_PATH, allResponses);
    // map bounds
    let latlngs = []
    allResponses.forEach(response=>{
        console.log(response.zipcode.length)
        // if zipcode is valid (aka not empty)
        if(response.zipcode.length > 0)
        {
            latlngs.push([response.latlng])
        }
    })
    map.fitBounds(latlngs);
}

/**
 * Helper for processData, which adds responses to layers 
 * @param {*} data, JSON data: list
 */
function getUserResponseData(data) {
    let userZipcode = data['What is the zip code of your primary home?'];
    let userExperience = data['Overall, what would you rate your work life balance?'];
    let caregiver = data['Are you the primary caregiver of a dependent in your household?'];
    let WLBStory = data['How is your work life balance affected by the way you commute?'];
    let household = data['How many people are in your household?'];
    let commuteMeans = data['How do you typically travel to and from campus?']
    let latlng = [data['lat'], data['lng']]
    // TODO: Calculate distance from UCLA here
    // TODO: add more details as needed 
    let userResponse = {
        "zipcode": userZipcode,
        "commuteMeans": commuteMeans,
        "caregiver": caregiver,
        "household": household,
        "WLBStory": WLBStory,
        "experience": userExperience,
        "latlng" : latlng
    };
    return userResponse
}


/**
 * gets Boundary mapping given map URL (map) zipcode
 * @param {*} mapPath, URL path to map
 * @param {*} allResponses, Array contains all user responses 
 */
function getBoundary(mapPath, allResponses) {
    fetch(mapPath)
        .then(response => {
            return response.json();
        })
        .then(data => {
            // create a customized geojson that includes user responses filtered by rating
            // add more if needed 

            let filteredGeoJson = {
                "type": "FeatureCollection",
                "features" : []
            }
            data.features.forEach(feature =>{
                allResponses.forEach(response=>{
                    if(response.zipcode == feature.properties.zcta)
                    {
                        let customizedFeature = {
                            "type": "Feature",
                            "properties": {
                                "zcta": feature.properties.zcta, 
                                "latitude": feature.properties.latitude, 
                                "longitude": feature.properties.longitude,
                                "positiveResponses" : [],
                                "negativeResponses" : [],
                                "neutralResponses" : [],
                            },
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": feature.geometry.coordinates
                            },
                        }
                        // add positive/negative/neutral response to geojson
                        if(response.experience.includes("Positive"))
                        {
                            customizedFeature.properties.positiveResponses.push(response)
                        }
                        else if (response.experience.includes("Negative"))
                        {
                            customizedFeature.properties.negativeResponses.push(response)
                        }
                        else if(response.experience.includes("Neutral"))
                        {
                            customizedFeature.properties.neutralResponses.push(response)
                        }
                        // append current feature to geojson
                        filteredGeoJson.features.push(customizedFeature)
                    }
                })
            })

            //Layers by user experience
            positiveLayer = L.geoJSON(filteredGeoJson, {
                style: getStyle,
                onEachFeature: onEachFeature,
                filter: function (feature, layer){
                    return (feature.properties.positiveResponses.length > 0)
                }
            }).addTo(map)

            negativeLayer = L.geoJSON(filteredGeoJson, {
                style: getStyle,
                onEachFeature: onEachFeature,
                filter: function (feature, layer){
                    return (feature.properties.negativeResponses.length > 0)
                }
            }).addTo(map)

            neutralLayer = L.geoJSON(filteredGeoJson, {
                style: getStyle,
                onEachFeature: onEachFeature,
                filter: function (feature, layer){
                    return (feature.properties.neutralResponses.length > 0)
                }
            }).addTo(map)
        })
}



/**
 * Helper, filters responses by mathcing zipcode
 * @param {*} currentZipcode zipcode which you want to highlight
 * @returns returns responses filtered for matching zipcode
 */

function getStyle(feature) {
    console.log(feature)
    let score = getScoreForRegion(feature);
        return {
            fillColor: getColorFromScore(score),
            weight: 1,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        }
}


function getScoreForRegion(feature)
{
    let plusScore = feature.properties.positiveResponses.length 
    let minusScore = feature.properties.negativeResponses.length
    return plusScore - minusScore
}

// TODO: May need to come up with new color gradient
// TODO: Change the colors as you like at https://colorbrewer2.org/#type=sequential&scheme=BuGn&n=3 (Ctrl + Click)
function getColorFromScore(score) {
    if (score >= 2) {
        return '#b30000';
    }
    if (score >= 1) {
        return '#e34a50';
    }
    if (score >= 0) {
        return '#e34a33';
    }
    if (score >= -1) {
        return '#fc8d59';
    }
    if (score >= -2) {
        return '#fdbb84';
    }
    return '#f00088';
}


function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: populateSidebar
    });
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
    info.update();
}

// TODO: make changes to sidebar here
function populateSidebar(e) {
        let layer = e.target
        console.log(layer)
        // map.fitBounds(layer.getBounds());
        document.getElementById("stories").innerHTML = ""

        // todo: maybe refactor to a function that returns a response 
        if(displayPositiveResponses)
        {
            layer.feature.properties.positiveResponses.forEach(response => {
            document.getElementById("stories").innerHTML += 
            `<div class="response"> 
                <img src='assets/home-icon.png'> ${response.zipcode} <br>
                <img src='assets/bus-icon.png'> ${response.commuteMeans} <br> 
                <img src='assets/caregiver-icon.png'> Caregiver: ${response.caregiver} <br> 
                Household: ${response.household} <br> <br>
                <b>How is your work life balance affected by the way you commute?</b> <br> ${response.WLBStory} 
            </div>`
            })
            // TODO: if caregiver goes here
        }
        if(displayNegativeResponses)
        {
            layer.feature.properties.negativeResponses.forEach(response => {
                document.getElementById("stories").innerHTML += 
                `<div class="response"> 
                    <img src='assets/home-icon.png'> ${response.zipcode} <br>
                    <img src='assets/bus-icon.png'> ${response.commuteMeans} <br> 
                    <img src='assets/caregiver-icon.png'> Caregiver: ${response.caregiver} <br> 
                    Household: ${response.household} <br> <br>
                    <b>How is your work life balance affected by the way you commute?</b> <br> ${response.WLBStory} 
                </div>`
            })
            // TODO: if caregiver goes here
        }
        
        if(displayNeutralResponses)
        {
            layer.feature.properties.neutralResponses.forEach(response => {
                document.getElementById("stories").innerHTML += 
                `<div class="response"> 
                    <img src='assets/home-icon.png'> ${response.zipcode} <br>
                    <img src='assets/bus-icon.png'> ${response.commuteMeans} <br> 
                    <img src='assets/caregiver-icon.png'> Caregiver: ${response.caregiver} <br> 
                    Household: ${response.household} <br> <br>
                    <b>How is your work life balance affected by the way you commute?</b> <br> ${response.WLBStory} 
                </div>`
            })
            // TODO: if caregiver goes here 
        } 

        
}

// Add info for mouse hovering 
let info = L.control({position : "bottomright"});
info.onAdd = function () {
    this._div = L.DomUtil.create('div', 'info'); 
    this.update();
    return this._div;
};

info.update = function (props) {
    console.log(props)
    if(props)
    {
    let positiveCount = props.positiveResponses.length
    let negativeCount = props.negativeResponses.length
    let neutralCount = props.neutralResponses.length
    let totalCount = positiveCount + negativeCount + neutralCount
    this._div.innerHTML = 
        '<h4>Experience by Zipcode</h4>' + 
        '<img src="assets/home-icon.png"> Zipcode: ' + props.zcta + '<br />' + 'Total Responses: ' + totalCount 
        + '<br />' + 'Positive Experience: ' + positiveCount
        + '<br />' + 'Negative Experience: ' + negativeCount
        + '<br />' + 'Neutral Experience: ' + neutralCount
    }
    else
    {
        this._div.innerHTML = `Hover over a region to see<br>work-life balance<br>rating by zipcode!`;
        
    }
};

info.addTo(map);

// TODO: Saved for later, maybe we don't need this 
// add legend
// TODO: change the scale as we receive more responses
// let legend = L.control({position: 'bottomleft'});

// legend.onAdd = function () {
//     let div = L.DomUtil.create('div', 'info legend');
//     let grades = [1,2]; // change here
//     for (let i = 0; i < grades.length; i++) {
//         div.innerHTML +=
//             '<i style="background:' + 
//             getColor(grades[i] ) 
//             + '"></i> '  + (grades[i]) + '<br>';
//     }
//     return div;
// };
// legend.addTo(map);


// EXECUTE THIS CODE
loadData(DATA_URL)
// TODO: add UCLA marker with custom design

// Toggle Layers
postiveResponsesLegendHtml.addEventListener("click", togglePositiveLayer) 

function togglePositiveLayer(){
    if(map.hasLayer(positiveLayer)){
        map.removeLayer(positiveLayer)
    }
    else{
        map.addLayer(positiveLayer)
    }
    // whether to show positive exp in sidebar
    displayPositiveResponses = !displayPositiveResponses
}

negativeResponsesLegendHtml.addEventListener("click", toggleNegativeLayer) 

function toggleNegativeLayer(){
    if(map.hasLayer(negativeLayer)){
        map.removeLayer(negativeLayer)
    }
    else{
        map.addLayer(negativeLayer)
    }
    // whether to show negative exp in sidebar
    displayNegativeResponses = !displayNegativeResponses
}

neutralResponsesLegendHtml.addEventListener("click", toggleNeutralLayer) 

function toggleNeutralLayer(){
    if(map.hasLayer(neutralLayer)){
        map.removeLayer(neutralLayer)
    }
    else{
        map.addLayer(neutralLayer)
    }
    // whether to show neutral exp in sidebar
    displayNeutralResponses = !displayNeutralResponses
}