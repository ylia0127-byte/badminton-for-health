<template>
  <div class="page-wrapper">
    <div class="map-card">
      <div class="top-panel">
        <div ref="geocoderContainer" class="geocoder-container"></div>

        <div class="preset-list">
          <span class="label">Select a badminton court:</span>
          <button
            v-for="court in badmintonCourts"
            :key="court.name"
            class="btn court-btn"
            @click="selectDestination(court.coords, court.name)"
          >
            <img
              src="https://www.svgrepo.com/show/9303/shuttlecock.svg"
              alt="court icon"
              class="icon-btn"
            />
            {{ court.name }}
          </button>
        </div>

        <button class="btn select-btn" @click="toggleSelectOriginMode">
          <img
            src="https://www.svgrepo.com/show/9303/shuttlecock.svg"
            alt="start icon"
            class="icon-btn"
          />
          {{ isSelectingOrigin ? 'Click map to set Start Point' : 'Choose Start Point' }}
        </button>
      </div>

      <div ref="mapContainer" class="map-container"></div>

      <div class="info">
        <strong>Origin:</strong> {{ origin ? origin.join(', ') : '-' }}  
        <strong>Destination:</strong> {{ destination ? destination.join(', ') : '-' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import mapboxgl from 'mapbox-gl'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'

const MAPBOX_TOKEN =
  'pk.eyJ1IjoieWxpYTAxMjciLCJhIjoiY21neWhncHlvMGFtbTJqcHB6ZnZ6dGEzdCJ9.EpIkESON2DPzY85fnng_QA'
mapboxgl.accessToken = MAPBOX_TOKEN

const mapContainer = ref(null)
const geocoderContainer = ref(null)

const origin = ref(null)
const destination = ref(null)
const isSelectingOrigin = ref(false)

let mapInstance = null
let originMarker = null
let destinationMarker = null

const badmintonCourts = [
  { name: 'Court A', coords: [145.1361610365988, -37.91255944880584] },
  { name: 'Court B', coords: [145.141184727895, -37.89637733498219] },
  { name: 'Court C', coords: [145.13466296290852, -37.92788815208249] },
]

function toggleSelectOriginMode() {
  isSelectingOrigin.value = !isSelectingOrigin.value
  if (mapInstance) {
    mapInstance.getCanvas().style.cursor = isSelectingOrigin.value ? 'crosshair' : ''
  }
}

function placeOriginMarker(coords) {
  if (originMarker) originMarker.remove()
  const el = document.createElement('div')
  el.className = 'marker origin-marker'
  el.style.backgroundImage = 'url("https://www.svgrepo.com/show/9303/shuttlecock.svg")'
  el.style.width = '36px'
  el.style.height = '36px'
  el.style.backgroundSize = 'contain'
  el.style.cursor = 'pointer'

  originMarker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
    .setLngLat(coords)
    .addTo(mapInstance)
}

function placeDestinationMarker(coords) {
  if (destinationMarker) destinationMarker.remove()
  const el = document.createElement('div')
  el.className = 'marker dest-marker'
  el.style.backgroundImage = 'url("https://www.svgrepo.com/show/9303/shuttlecock.svg")'
  el.style.width = '30px'
  el.style.height = '30px'
  el.style.backgroundSize = 'contain'
  el.style.cursor = 'pointer'

  destinationMarker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
    .setLngLat(coords)
    .addTo(mapInstance)
}

function selectDestination(coords, name) {
  destination.value = coords
  placeDestinationMarker(coords)
  if (origin.value) {
    fetchAndDrawRoute(origin.value, destination.value)
  }
}

async function fetchAndDrawRoute(origCoords, destCoords) {
  const originStr = `${origCoords[0]},${origCoords[1]}`
  const destStr = `${destCoords[0]},${destCoords[1]}`
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/${originStr};${destStr}` +
    `?geometries=geojson&access_token=${MAPBOX_TOKEN}`

  try {
    const resp = await fetch(url)
    if (!resp.ok) {
      console.error('Route request failed, status:', resp.status)
      return
    }
    const data = await resp.json()
    if (data.routes && data.routes.length > 0) {
      renderRouteOnMap(data.routes[0].geometry)
    } else {
      console.error('No route found', data)
    }
  } catch (err) {
    console.error('Error fetching route', err)
  }
}

function renderRouteOnMap(geojson) {
  if (!mapInstance) return
  const src = 'routeSource'
  if (mapInstance.getSource(src)) {
    mapInstance.getSource(src).setData(geojson)
  } else {
    mapInstance.addSource(src, { type: 'geojson', data: geojson })
    mapInstance.addLayer({
      id: 'routeLayer',
      type: 'line',
      source: src,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#0077ff', 'line-width': 5 },
    })
  }
  const coords = geojson.coordinates
  const bounds = coords.reduce(
    (b, c) => b.extend(c),
    new mapboxgl.LngLatBounds(coords[0], coords[0]),
  )
  mapInstance.fitBounds(bounds, { padding: 40 })
}

onMounted(() => {
  mapInstance = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [145.136, -37.91],
    zoom: 13,
  })
  mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right')

  const geocoder = new MapboxGeocoder({
    accessToken: MAPBOX_TOKEN,
    mapboxgl,
    placeholder: 'Search location…',
    language: 'en',
  })
  geocoderContainer.value.appendChild(geocoder.onAdd(mapInstance))

  geocoder.on('result', (ev) => {
    const coords = ev.result.center
    origin.value = coords
    placeOriginMarker(coords)
    if (destination.value) {
      fetchAndDrawRoute(origin.value, destination.value)
    }
  })

  mapInstance.on('click', (e) => {
    if (isSelectingOrigin.value) {
      const coords = [e.lngLat.lng, e.lngLat.lat]
      origin.value = coords
      placeOriginMarker(coords)
      isSelectingOrigin.value = false
      mapInstance.getCanvas().style.cursor = ''
      if (destination.value) {
        fetchAndDrawRoute(origin.value, destination.value)
      }
    }
  })
})
</script>

<style scoped>
.page-wrapper {
  margin: 0.5cm;
  background-color: #f4f6f8;
  display: flex;
  justify-content: center;
  align-items: stretch;
  height: calc(100vh - 1cm);
}
.map-card {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #d9e0e8;
  display: flex;
  flex-direction: column;
  background-color: white;
}
.top-panel {
  padding: 12px 18px;
  background: #eef3f8;
  border-bottom: 1px solid #d4dee9;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.geocoder-container {
  flex: 1 1 auto;
  min-width: 200px;
}
.icon-btn {
  width: 20px;
  height: 20px;
  margin-right: 6px;
  vertical-align: middle;
}
.marker {
  display: block;
}
.map-container {
  flex: 1;
  position: relative;
}
.info {
  padding: 10px 14px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.95);
  border-top: 1px solid #d9e0e8;
}
.btn {
  border: none;
  color: white;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn:hover {
  transform: translateY(-1px);
}
.court-btn {
  background-color: #1c9c66;
}
.court-btn:hover {
  background-color: #15774d;
}
.select-btn {
  background-color: #ff7e5f;
}
.select-btn:hover {
  background-color: #d14e4a;
}
</style>
