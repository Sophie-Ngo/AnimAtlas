
// marker cluster contains all the markers and clusters them.
var markerCluster;

// markers list contains all the markers, shown AND hidden.
var markers = [];

// map object
var map;


// Initialize and add the map
async function initMap(maptype) {

  // Request needed libraries.
  const { Map, InfoWindow } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary(
    "marker",
  );

  // The map
  map = new google.maps.Map(document.getElementById("mainmap"), {
    zoom: 3,
    center: { lat: 30.60, lng: -45.82 },
    mapId: "DEMO_MAP_ID",
    mapTypeId: 'satellite',
    disableDefaultUI: true,
  });

  // Load the data from the csv file.
  // d3.csv("pbdb_data2.csv", function (data) {
  d3.csv("https://paleobiodb.org/data1.2/occs/list.csv?base_name=Dinosauria&pgm=gplates,scotese,seton&show=full&limit=500", function (data) {
    // document.getElementById("loader").style.display = "none";
    // The info (pop-up) window
    // const infoWindow = new google.maps.InfoWindow({
    //   content: "",
    //   disableAutoPan: true,
    // });

    // ensure numerical data is being read as numeric
    data.forEach(function(d) {
      d.min_ma = parseFloat(d.min_ma);
      d.max_ma = parseFloat(d.max_ma);
    });

    let min_range = Math.floor(d3.min(data, d => d.min_ma));
    let max_range = Math.ceil(d3.max(data, d => d.max_ma));
    
    // set minimum and maximum values for slider based on min_ma and max_ma in data, and set values to entire interval
    document.getElementById("lower").min = min_range;
    document.getElementById("lower").max = max_range;
    document.getElementById("lower").value = min_range;

    document.getElementById("upper").min = min_range;
    document.getElementById("upper").max = max_range;
    document.getElementById("upper").value = max_range;

    document.getElementById('minrange').innerHTML = min_range + " - ";
    document.getElementById('maxrange').innerHTML = max_range + " million years ago";

    console.log("Min range, max range:", min_range, max_range);

    // For each row in the csv file, create a marker.
    markers = data.map((row, i) => {
      const label = row['accepted_name'];
      const pinGlyph = new google.maps.marker.PinElement({
        glyph: label,
        glyphColor: "black",
      });
      
      // Get the position of the marker.
      var position = { lat: parseFloat(row['lat']), lng: parseFloat(row['lng']) };

      // Create the marker object
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        content: pinGlyph.element,
      });
  
      // markers can only be keyboard focusable when they have click listeners
      marker.addListener("click", async() => {

        // show all row data to content
        var displayed_name = getAttributeFromData(row, 'accepted_name');
        // identified name is always available if accepted name is not usable
        if (displayed_name === "") {
          displayed_name = getAttributeFromData(row, 'identified_name');
        }
        var content = "<h1>"+ capitalize(displayed_name) +"</h1>";

        content += "<p><b> Time Range: </b>";
        content += getAttributeFromData(row, 'max_ma').toString() + " million years ago - ";
        content += getAttributeFromData(row, 'min_ma').toString() + " million years ago </p>";

        content += "<p><b>Diet: </b>" + capitalize(getAttributeFromData(row, 'diet')) + "</p>";

        content += "<h3> Attribution: </h3>"
        var ref_id = getAttributeFromData(row, 'reference_no');
        
        if (ref_id !== "") {

        await d3.csv("https://paleobiodb.org/data1.2/refs/single.csv?id=" + ref_id.toString() + "&show=both", function (data) {
          data.map((reference, i) => {
            content += "<p><b>Title: </b>" + capitalize(getAttributeFromData(reference, 'reftitle')) + "</p>";
            content += "<p><b>Published in: </b>" + getAttributeFromData(reference, 'pubyr') + "</p>";
            content += "<p><b>DOI: </b>" + getAttributeFromData(reference, 'doi') + "</p>";

            document.getElementById("info").innerHTML = content;

            openPage("Details");
          });
        });
      } else {
        document.getElementById("info").innerHTML = content;

        openPage("Details");
      }

      });

      // add data to marker, so we can use it later for filtering
      marker.data = row;

      return marker;
    });

    if(maptype == "points"){
      markerCluster.clearMarkers();

      // Add each marker to the map, one by one
      markers.forEach((marker) => {
        marker.setMap(map);
      });


    }
    else if(maptype == "clusters"){
      // Create the marker clusterer object. This groups/clusters the markers.
      markerCluster = new markerClusterer.MarkerClusterer({ markers, map });
    }
    else{
      //clear clusters 
      markerCluster.clearMarkers();

      // google maps heatmap
      var heatmap = new google.maps.visualization.HeatmapLayer({
        data: data.map((row, i) => { return new google.maps.LatLng(parseFloat(row['lat']), parseFloat(row['lng']))}),
        map: map,
        radius: 20
      });

      const gradient = [
        "rgba(0, 255, 255, 0)",
        "rgba(0, 255, 255, 1)",
        "rgba(0, 191, 255, 1)",
        "rgba(0, 127, 255, 1)",
        "rgba(0, 63, 255, 1)",
        "rgba(0, 0, 255, 1)",
        "rgba(0, 0, 223, 1)",
        "rgba(0, 0, 191, 1)",
        "rgba(0, 0, 159, 1)",
        "rgba(0, 0, 127, 1)",
        "rgba(63, 0, 91, 1)",
        "rgba(127, 0, 63, 1)",
        "rgba(191, 0, 31, 1)",
        "rgba(255, 0, 0, 1)",
      ];
    
      heatmap.set("gradient", heatmap.get("gradient") ? null : gradient);
    }
  });
}

// Update the map with subset of markers, based on slider and search query.
async function updateMap() {
  console.log("Updating map...")

  // New markers to be shown.
  var new_markers = [];

  // Clear all the current markers.
  markerCluster.clearMarkers();

  // Get the search query.
  var query = document.getElementById("namequery").value;

  var lowerSlider = document.querySelector('#lower');
  var upperSlider = document.querySelector('#upper');


  // lowerVal = parseInt(lowerSlider.value);
  // upperVal = parseInt(upperSlider.value);
  
  for (var i = 0; i < markers.length; i++) {
    
    // Add the markers that meet the criteria.
    if ((markers[i].data['max_ma'] < upperVal) && (markers[i].data['min_ma'] > lowerVal) && ((query == "") || (markers[i].data['accepted_name'] == query))) {
      // if (((query == "") || (markers[i].data['accepted_name'] == query))) {
      new_markers.push(markers[i]);
    }
  }

  // Add the new markers to the map.
  markerCluster.addMarkers(new_markers);

  console.log("Map updated!");
}

// Initialize and add the map
initMap("clusters");

// Add event listener to update button
document.getElementById("updateBtn").addEventListener("click", updateMap);

// Updates the text value under slider, each time you drag the slider handle
// var slider = document.getElementById("myRange");
// var year = document.getElementById("yearThreshold");
// year.innerHTML = slider.value;

// slider.oninput = function() {
//   year.innerHTML = this.value;
// }

function openPage(evt) {

  let pageName
  let current_tab

  // evt is string if a glyph is clicked
  if (typeof evt === 'string') {
    if (evt === 'Details') {
      pageName = evt;
      current_tab = document.getElementById('details_button');
    }
  } else {
    pageName = evt.currentTarget.innerHTML;
    current_tab = evt.currentTarget;
  }

  // Declare all variables
  var i, tabcontent, tablinks;

  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(pageName).style.display = "block";

  current_tab.className += " active";
}

function capitalize(string) {
  if (typeof string !== 'string') return string; 
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Get the attribute from the data
// if the data does not have the attribute, return "Attribute does not exist"
// if the resulting attribute is blank, return "Not listed"
function getAttributeFromData(data, attribute) {
    try {
      if (data[attribute] === undefined) {
        return "Attribute does not exist";
      }
      if (data[attribute] === "") {
        return "Not listed";
      }
      else {
        return data[attribute];
      }
    } catch (error) {
      return error;
    }
}

function openSubPage(evt) {

  let pageName = evt.currentTarget.innerHTML;

  // Get all elements with class="tabcontent" and hide them
  let tabcontent = document.getElementsByClassName("tabcontent");
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  document.getElementById(pageName).style.display = "block";

}

document.getElementById("help_button").addEventListener("click", openPage);
document.getElementById("details_button").addEventListener("click", openPage);
document.getElementById("search_button").addEventListener("click", openPage);
document.getElementById("visualization_button").addEventListener("click", openPage);

document.getElementById("visualization_button").addEventListener("click", openPage);

document.getElementById("trex_button").addEventListener("click", openSubPage);

document.getElementById("Help").style.display = "block";

document.getElementById("points").addEventListener("click", function() {
  initMap("points");
});
document.getElementById("cluster").addEventListener("click", function() {
  initMap("clusters");
});
document.getElementById("heatmap").addEventListener("click", function() {
  initMap("heatmap");
});

// initialize empty detail window (when no data is selected)
document.getElementById("info").innerHTML = "<h1>Select a data point to get started!</h1>  <p>Or, if you'd like, explore these pages below. </p> ";

var lowerSlider = document.querySelector('#lower');
var upperSlider = document.querySelector('#upper');

var lowerVal = parseInt(lowerSlider.value);
var upperVal = parseInt(upperSlider.value);

var minrange = document.getElementById("minrange");
var maxrange = document.getElementById("maxrange");

// when first loading the page, show a "loading..." message while the api call is being made
minrange.innerHTML = "Loading...";
maxrange.innerHTML = "";

upperSlider.oninput = function() {
  
  lowerVal = parseInt(lowerSlider.value);
  upperVal = parseInt(upperSlider.value);
  if (upperVal < lowerVal + 4) {
    lowerSlider.value = upperVal - 4;
    
    if (lowerVal == lowerSlider.min) {
        upperSlider.value = 4;
    }
  }

  maxrange.innerHTML = upperVal + ' million years ago';

  filterMarkers(lowerVal, upperVal);
};

lowerSlider.oninput = function() {
  
   lowerVal = parseInt(lowerSlider.value);
   upperVal = parseInt(upperSlider.value);
   if (lowerVal > upperVal - 4) {
      upperSlider.value = lowerVal + 4;
      
      if (upperVal == upperSlider.max) {
         lowerSlider.value = parseInt(upperSlider.max) - 4;
      }

   }

   minrange.innerHTML = lowerVal + ' - ';

   filterMarkers(lowerVal, upperVal);
};

function filterMarkers(minrange, maxrange){
  var visible_markers = [];

  for (var i = 0; i < markers.length; i++) {
    // in order for the fossil to show up, its time range must OVERLAP with the time range selected by the user
    // meaning, EITHER the max_ma is below maxrange AND above minrange, OR the min_ma is above minrange AND below maxrange
    if (((markers[i].data['min_ma'] >= minrange) && (markers[i].data['min_ma'] <= maxrange)) ||
        ((markers[i].data['max_ma'] >= minrange) && (markers[i].data['max_ma'] <= maxrange))) {
      markers[i].map = map;
      visible_markers.push(markers[i]);
    }
    else{
      markers[i].map = null;
    }
  }

  // redraw the clusters
  markerCluster.clearMarkers();
  markerCluster.addMarkers(visible_markers);
}