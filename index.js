
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
  d3.csv("https://paleobiodb.org/data1.2/occs/list.csv?base_name=Dinosauria&pgm=gplates,scotese,seton&show=full&limit=1000", function (data) {
    // document.getElementById("loader").style.display = "none";
    // The info (pop-up) window
    // const infoWindow = new google.maps.InfoWindow({
    //   content: "",
    //   disableAutoPan: true,
    // });

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
      marker.addListener("click", () => {

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

        content += "<h4> Attribution </h4>"
        var ref_id = getAttributeFromData(row, 'reference_no');
        d3.csv("https://paleobiodb.org/data1.2/refs/single.csv?id=" + ref_id.toString() + "&show=both", function (data) {
          data.map((row, i) => {
            content += data.toString();
            content += "<p>" + row + "</p>";
            content += "<p><b>Title: </b>" + capitalize(getAttributeFromData(row, 'title'));
          });
        });

        document.getElementById("info").innerHTML = content;
        openPage("Details");

      });

      // add data to marker, so we can use it later for filtering
      marker.data = row;

      return marker;
    });

    if(maptype == "points"){
      // markerCluster.clearMarkers();

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
      // markerCluster.clearMarkers();

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
  
  // New markers to be shown.
  var new_markers = [];

  // Clear all the current markers.
  markerCluster.clearMarkers();

  // Get the search query.
  var query = document.getElementById("searchquery").value;

  
  for (var i = 0; i < markers.length; i++) {
    
    // Add the markers that meet the criteria.
    // if ((markers[i].data['max_ma'] < slider.value) && ((query == "") || (markers[i].data['accepted_name'] == query))) {
      if (((query == "") || (markers[i].data['accepted_name'] == query))) {
      new_markers.push(markers[i]);
    }
  }

  // Add the new markers to the map.
  markerCluster.addMarkers(new_markers);

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
// if the resulting attribute is blank, return "Not listed"
function getAttributeFromData(data, attribute) {
    try {
      if (data[attribute] === "" || data[attribute] === undefined) {
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