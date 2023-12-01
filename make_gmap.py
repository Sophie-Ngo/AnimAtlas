from bokeh.io import output_notebook, show, output_file, curdoc
from bokeh.plotting import figure
from bokeh.models import LinearColorMapper, WMTSTileSource, ColumnDataSource, Circle, TextInput, GMapOptions, Button, CustomJS, Styles, RangeSlider, CDSView, BooleanFilter, CustomJSFilter, OpenURL, HoverTool, TapTool, Div, GlobalImportedStyleSheet, InlineStyleSheet
from bokeh.plotting import figure, show, output_file, gmap
from bokeh.layouts import gridplot, column, row, layout
from bokeh.embed import components, json_item
from bokeh.events import Tap
from h3 import h3

import apikeys

import pandas as pd
import numpy as np


import requests
# output_file("index.html")

# convert lat/long to web mercator format
def wgs84_to_web_mercator(df, lon="lng", lat="lat"):
    """Converts decimal longitude/latitude to Web Mercator format"""
    k = 6378137
    df["x"] = df[lon] * (k * np.pi/180.0)
    df["y"] = np.log(np.tan((90 + df[lat]) * np.pi/360.0)) * k
    return df

# FETCH DATA
num_records = 20
global df
# df = pd.read_csv('https://paleobiodb.org/data1.2/occs/list.csv?base_name=Dinosauria&pgm=gplates,scotese,seton&show=full,classext,genus,subgenus,acconly,ident,img,etbasis,strat,lith,env,timebins,timecompare,resgroup,ref,ent,entname,crmod&limit=' + str(num_records), on_bad_lines='skip')

df = pd.read_csv("pbdb_data_dino_50.csv", on_bad_lines='skip')

wgs84_to_web_mercator(df) 

#used to display on the map
global source
source = ColumnDataSource(df)

global p

map_options = GMapOptions(lat=0, lng=0, map_type="satellite", zoom=3)
p = gmap(apikeys.googlekey, map_options, tools="tap, pan, wheel_zoom", active_scroll="wheel_zoom", sizing_mode="stretch_width", toolbar_location=None, height=900)
p.xaxis.visible = False
p.yaxis.visible = False

global ids
ids = df['occurrence_no']

def updateMap(api_url):
    global df
    df = pd.read_csv(api_url, on_bad_lines='skip')

    wgs84_to_web_mercator(df) 

    #used to display on the map
    global source
    source = ColumnDataSource(df)

    global p
    p = gmap(apikeys.googlekey, map_options, tools="tap, pan, wheel_zoom", active_scroll="wheel_zoom", toolbar_location=None, sizing_mode="stretch_width", height=900)
    p.xaxis.visible = False
    p.yaxis.visible = False

    global ids
    ids = df['occurrence_no']

    bool_filter = BooleanFilter([True]*len(df)) # true for everything, so shows everything initially, not ideal but works for now
    # create a view that allows the points to only appear for the set time period (filter by time slider)
    # views do not change underlying data, they only filter what is shown
    view = CDSView(filter = bool_filter) 

    p.circle(x='lng', y='lat', fill_color='orange', selection_color="blue", size=10, source=source, view=view)

    p.on_event(Tap, callbackShowData)

    final_layout.children[1].children[0] = p

    print("Map updated!")
    print("New number of rows:", len(df))

def callbackShowData(event):

    # if no data point is selected, do not change the existing div, but update the sidebar to show data
    if len(source.selected.indices) == 0:
        updateSidebar(nav, default_content)
        return

    indexActive = source.selected.indices[0]

    global df
    data_div = Div(text=
              
    "<h1>" + str(df['accepted_name'][indexActive]) + 
    "</h1><br><p>Lived: " + str(df['max_ma'][indexActive]) + " million years ago - " + str(df['min_ma'][indexActive]) + " million years ago </p> ", 

    margin=(50,0,0,0), stylesheets=[stylesheet])
    
    updateSidebar(nav, data_div)

# updates sidebar
def updateSidebar(nav, content):
    sidebar = column(nav, content, width=sidebar_width)

    final_layout.children[0] = sidebar

    return sidebar

def callbackSearchSubmit(event):

    base_link = "https://paleobiodb.org/data1.2/occs/list.csv?show=full&"
    # show=full to get all bolded attributes except paleolocation. contains lng and lat

    parameters = []

    if taxonomy.value != "":
        parameters.append("base_name=" + taxonomy.value)

    if record_limit.value != "":
        parameters.append("limit=" + record_limit.value)

    if ma_range_max.value != "":
        parameters.append("max_ma=" + ma_range_max.value)

    if ma_range_min.value != "":
        parameters.append("min_ma=" + ma_range_min.value)

    final_link = base_link + "&".join(parameters)

    print("Refreshing map with data from URL:", final_link)

    updateMap(final_link)

# search fields
taxonomy = TextInput(placeholder="e.g. Dinosauria", title="Taxonomy:")
record_limit = TextInput(placeholder="(optional) if too slow, limit records", title="Limit Number:")
ma_range_max = TextInput(placeholder="Oldest", title="Max Ma:")
ma_range_min = TextInput(placeholder="Youngest", title="Min Ma:")

submit_button = Button(label="Submit", button_type="default")
submit_button.on_click(callbackSearchSubmit)

search_fields = [taxonomy, record_limit, ma_range_max, ma_range_min, submit_button]

# show the search page
def callbackSearch(event):

    content = column(search_fields, margin=(50,0,0,0), stylesheets=[stylesheet])

    updateSidebar(nav, content) 

# button that, when clicked, directs user to fossil info page
detailButton = Button(label="Detail", button_type="default")
detailButton.on_click(callbackShowData)

# button that, when clicked, directs user to search page
searchButton = Button(label="Search", button_type="default")
searchButton.on_click(callbackSearch)

p.on_event(Tap, callbackShowData)

nav = row([detailButton, searchButton])

sidebar_width = 400

stylesheet = InlineStyleSheet(css=":host{color:black;height:100%;width:" + str(sidebar_width) + "px;position:fixed;z-index:1;top:0;left:0;background-color:white;overflow-x:hidden;padding:20px;font-size:15px;}:host p{padding:6px 8px 6px 16px;text-decoration:none;color:black;display:block}:host a:hover{color:blue}:host h1{padding:6px 8px 6px 16px;text-decoration:none;font-size:25px;color:black;display:block}")

time_slider = RangeSlider(value=(100, 200), start=0, end=4000, step=1, direction='rtl', title="Time Range (Ma)", sizing_mode='stretch_width')
bool_filter = BooleanFilter([True]*len(df)) # true for everything, so shows everything initially, not ideal but works for now

callbackUpdateTimerange = CustomJS(args=dict(source=source, filter=bool_filter, time_slider=time_slider),
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

time_slider.js_on_change('value', callbackUpdateTimerange)

# create a view that allows the points to only appear for the set time period (filter by time slider)
# views do not change underlying data, they only filter what is shown
view = CDSView(filter = bool_filter) 


# p.hex_tile(df['lng'], df['lat'],size=0.5, hover_color="pink", hover_alpha=0.8)

# p.hexbin(df['lng'].values, df['lat'].values,size=0.5, hover_color="pink", hover_alpha=0.8)
r = p.circle(x='lng', y='lat', fill_color="orange", line_color="firebrick", size=10, source=source, view=view)

selected_circle = Circle(fill_color="blue", size=20)
nonselected_circle = Circle(fill_color="orange", line_color="firebrick", size=10)

r.selection_glyph = selected_circle
r.nonselection_glyph = nonselected_circle

# color_mapper = LinearColorMapper(palette="Viridis256", low=0, high=4000)

# color_bar = ColorBar(color_mapper)




basic_div = Div(text="<p>Select a data point to learn about fossil occurences!</p>" + 
          "<p>Don't know where to start? Explore these pages below. </p>",
          margin=(50,0,-200,0), stylesheets=[stylesheet]) 

trex_button = Button(label="Tyrannosaurus Rex", button_type="default")
homosapiens_button = Button(label="Homo Sapiens", button_type="default")

explore_buttons = column(trex_button, homosapiens_button, margin=(200,0,0,0), stylesheets=[InlineStyleSheet(css=":host{z-index:1;padding:20px;}")])

default_content = column([basic_div, explore_buttons])

# copied code snippet from https://github.com/uber/h3-py-notebooks/blob/master/notebooks/unified_data_layers.ipynb
# ---
APERTURE_SIZE = 9
hex_col = 'hex'+str(APERTURE_SIZE)

# find hexs containing the points
df[hex_col] = df.apply(lambda x: h3.geo_to_h3(x.lat,x.lng,APERTURE_SIZE),1)

# aggregate the points
df = df.groupby(hex_col).size().to_frame('cnt').reset_index()

#find center of hex for visualization
df['lat'] = df[hex_col].apply(lambda x: h3.h3_to_geo(x)[0])
df['lng'] = df[hex_col].apply(lambda x: h3.h3_to_geo(x)[1])

df.drop("hex9", axis=1)

# ---








final_layout = column(p, time_slider, margin=(0,0,0,0), sizing_mode='stretch_width')
final_layout = row(default_content, final_layout, sizing_mode='stretch_width')

updateSidebar(nav, default_content)

curdoc().add_root(final_layout)


