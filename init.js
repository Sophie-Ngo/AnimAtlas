/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
// Initialize and add the map
let map;

async function initMap() {

  const allo1 = { lng: -108.199997, lat: 43.630001  }; // 22058
  const allo2 = { lng: -109.205833, lat: 40.423611  }; // 220162
  const allo3 = { lng: -107.133202, lat: 34.942299  }; // 382123
  const allo4 = { lng: -106.940559, lat: 35.320278  }; // 405146
  const allo5 = { lng: -107.400002, lat: 38.450001  }; // 405200
  // Request needed libraries.
  //@ts-ignore
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  // The map, centered at allo1
  map = new Map(document.getElementById("map"), {
    zoom: 4,
    center: allo1,
    mapId: "DEMO_MAP_ID",
  });

  // The marker, positioned at allo1 (with occurence no. 220058)
  const marker = new AdvancedMarkerElement({
    map: map,
    position: allo1,
    title: "Allosaurus 220058",
  });
}

initMap();
