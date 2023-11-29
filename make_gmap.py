from bokeh.io import output_notebook, show, output_file, curdoc
from bokeh.plotting import figure
from bokeh.models import WMTSTileSource, ColumnDataSource, GMapOptions, CustomJS, Styles, RangeSlider, CDSView, BooleanFilter, CustomJSFilter, OpenURL, TapTool, Div, GlobalImportedStyleSheet, InlineStyleSheet
from bokeh.plotting import figure, show, output_file, gmap
from bokeh.layouts import gridplot, column, row, layout
from bokeh.embed import components, json_item

import apikey

import pandas as pd
import numpy as np

output_file("index.html")

# convert lat/long to web mercator format
def wgs84_to_web_mercator(df, lon="lng", lat="lat"):
    """Converts decimal longitude/latitude to Web Mercator format"""
    k = 6378137
    df["x"] = df[lon] * (k * np.pi/180.0)
    df["y"] = np.log(np.tan((90 + df[lat]) * np.pi/360.0)) * k
    return df

# dino csv for this purpose only
df = pd.read_csv("pbdb_data_dino_50.csv", on_bad_lines='skip')
# df = pd.read_csv("pbdb_data_dino_all.csv", on_bad_lines='skip', skiprows=19)
# df = pd.read_csv("pbdb_data_dino.csv", on_bad_lines='skip', skiprows=18)
wgs84_to_web_mercator(df) 

#used to display on the map
source = ColumnDataSource(df)

p = figure(tools='pan, wheel_zoom',  
           x_axis_type="mercator", y_axis_type="mercator")

map_options = GMapOptions(lat=0, lng=0, map_type="satellite", zoom=3)
p = gmap(apikey.apikey, map_options, title="Dinosaur Fossils Map", tools="tap, pan", sizing_mode="stretch_width", height=900)
p.xaxis.visible = False
p.yaxis.visible = False

ids = df['occurrence_no']

# --------------------------------------------------------------------------
# Clustering
# --------------------------------------------------------------------------

# for all fossil occurences that are within 1 kilometer of another fossil, group them together

# create a new dataframe with the same columns as the original
# this dataframe will be used to store the clusters
df_clusters = pd.DataFrame(columns=df.columns)

# create a new column in the original dataframe to store the cluster id
df['cluster_id'] = -1

# create a new column in the original dataframe to store the cluster size
df['cluster_size'] = -1


# loop through all the fossils

# for each fossil, check if it is within 1 kilometer of another fossil
# if it is, add it to the cluster of that fossil
# if it is not, create a new cluster for that fossil
# for id in df["occurrence_no"]:
#     for other in df["occurrence_no"]:
#         if distnace

# def distance(lat1,lat2,long1,long2):
#     return np.sqrt((lat1-lat2)**2 + (long1-long2)**2)


# --------------------------------------------------------------------------
# done with map stuff, now onto the slider
# how it works: the filter keeps track of a list of booleans, one for each fossil. it represents whether this fossil should be shown or not.
# the callback function is called whenever the slider is changed, and it updates the filter's list of booleans based on the slider's value (the time range)
# --------------------------------------------------------------------------

stylesheet = InlineStyleSheet(css=":host{height:100%;width:300px;position:fixed;z-index:1;top:0;left:0;background-color:#111;overflow-x:hidden;padding-top:20px}:host a{padding:6px 8px 6px 16px;text-decoration:none;font-size:25px;color:#818181;display:block}:host a:hover{color:#f1f1f1}")

time_slider = RangeSlider(value=(100, 200), start=0, end=4000, step=1, direction='rtl', title="Time Range (Ma)", sizing_mode='stretch_width')
bool_filter = BooleanFilter([True]*len(df)) # true for everything, so shows everything initially, not ideal but works for now

callback = CustomJS(args=dict(source=source, filter=bool_filter, time_slider=time_slider),
    code="""

    var data = source.data;

    const start = time_slider.value[0]
    const end = time_slider.value[1]
    
    // min/start means the oldest the fossil can be, max/end means the youngest the fossil can be
    for (let i = 0; i < filter.booleans.length; i++)
        filter.booleans[i] = data['min_ma'][i] >= start && data['max_ma'][i] <= end;

    console.log(filter.booleans)
    source.change.emit();
    """)

time_slider.js_on_change('value', callback)

# create a view that allows the points to only appear for the set time period (filter by time slider)
# views do not change underlying data, they only filter what is shown
view = CDSView(filter = bool_filter) 

p.circle(x='lng', y='lat', fill_color='orange', selection_color="blue", size=10, source=source, view=view)

taptool = p.select(type=TapTool)

div = Div(text = """ 
      <a id="about" href="#">About</a>
      <a href="#">Services</a>
      <a href="#">Clients</a>
      <a href="#">Contact</a>  """, width=50, height=100, stylesheets=[stylesheet]) # ADD IN STYLESHEET

callback2 = CustomJS(code = """
                     
    //var id = document.getElementById(document.body.getElementsByTagName("div")[0].id).id               
    //console.log(document.getElementById(id).getElementsByClassName("bk-Column")[0].shadowRoot.querySelectorAll(".bk-Row")[0].shadowRoot.querySelectorAll(".bk-Div")[0].shadowRoot.querySelectorAll(".bk-clearfix")[0].querySelectorAll("#mySidebar")[0]);
    //document.getElementById(id).getElementsByClassName("bk-Column")[0].shadowRoot.querySelectorAll(".bk-Row")[0].shadowRoot.querySelectorAll(".bk-Div")[0].shadowRoot.querySelectorAll(".bk-clearfix")[0].querySelectorAll("#mySidebar")[0].style.width = "300px";
    //console.log(document.getElementById(id).getElementsByClassName("bk-Column")[0].shadowRoot.querySelectorAll(".bk-Row")[0].shadowRoot.querySelectorAll(".bk-Div")[0].shadowRoot.querySelectorAll(".bk-clearfix")[0].querySelectorAll("#mySidebar")[0]);
                    
    
                     
 """)

taptool.callback = callback2

final_layout = column(p, time_slider, margin=(0,0,0,300), sizing_mode='stretch_width')
final_layout = row(div, final_layout, sizing_mode='stretch_width')

show(final_layout)




