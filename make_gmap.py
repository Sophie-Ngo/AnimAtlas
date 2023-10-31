from bokeh.io import output_notebook
from bokeh.plotting import figure
from bokeh.models import WMTSTileSource, ColumnDataSource, GMapOptions
from bokeh.plotting import figure, show, output_file, gmap
from bokeh.layouts import gridplot
import pandas as pd
import numpy as np

# output_notebook()
output_file("gmap.html")

# web mercator coordinates
USA = x_range,y_range = ((-13884029,-7453304), (2698291,6455972))

# p = figure(tools='pan, wheel_zoom', x_range=x_range, y_range=y_range, 
#            x_axis_type="mercator", y_axis_type="mercator")

# googlemaps does not need to use wgs84_to_web_mercator, so i commented this out
# def wgs84_to_web_mercator(df, lon="lng", lat="lat"):
#     """Converts decimal longitude/latitude to Web Mercator format"""
#     k = 6378137
#     df["x"] = df[lon] * (k * np.pi/180.0)
#     df["y"] = np.log(np.tan((90 + df[lat]) * np.pi/360.0)) * k
#     return df

# dino csv for this purpose only
df = pd.read_csv("pbdb_data_dino.csv", on_bad_lines='skip', skiprows=18)
# wgs84_to_web_mercator(df) # googlemaps does not need to use wgs84_to_web_mercator

url = 'http://a.basemaps.cartocdn.com/rastertiles/voyager/{Z}/{X}/{Y}.png'
attribution = "Tiles by Carto, under CC BY 3.0. Data by OSM, under ODbL"

#deleted x range and y range
p = figure(tools='pan, wheel_zoom',  
           x_axis_type="mercator", y_axis_type="mercator")


map_options = GMapOptions(lat=0, lng=0, map_type="satellite", zoom=4)
p = gmap("AIzaSyAhW5TlRANMDjOdrcbXSHf4YhtA5gnPAgo", map_options, title="Dinosaur Fossils Map")
p.xaxis.visible = False
p.yaxis.visible = False

# p.add_tile(WMTSTileSource(url=url, attribution=attribution)) # no need for tile if we are using google maps

# p.circle(x=df['x'], y=df['y'], fill_color='orange', size=10) # googlemaps does not need to use wgs84_to_web_mercator
p.circle(x=df['lng'], y=df['lat'], fill_color='orange', size=10)

layout = gridplot([[p]], sizing_mode='stretch_both') # stretch_both fits to screen
show(p)