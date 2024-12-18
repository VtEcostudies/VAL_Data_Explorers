export const townsBasemap =
{
  "version": 8,
  "name": "ESRI towns",
  "metadata": {
    "gb:reproject": false
  },
  "sources": {
    "outline": {
      "type": "geojson",
      "data": "https://vtatlasoflife.org/val_www/leaflet/geojson/Polygon_VT_Town_Boundaries.geojson", //"towns.geojson"
    },
    "topo": {
      "type": "raster",
      "tiles": [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
      ],
      "maxzoom": 20,
      "tileSize": 256,
      "attribution": "Tiles &copy; Esri"
    }
  },
  "layers": [
    {
      "id": "background",
      "paint": {
        "background-color": "#e5e9cd"
      },
      "type": "background"
    },
    {
      "id": "base-layer",
      "type": "raster",
      "source": "topo"
    },
    {
      "id": "geojson-layer",
      "type": "line",
      "source": "outline",
      "paint": {
        "line-color": "#00f",
        "line-width": 2
      }
    }
  ],
  "id": "esri-towns"
}
