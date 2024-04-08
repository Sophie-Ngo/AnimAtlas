#for bokeh 1.0.4
from bokeh.plotting import figure
from bokeh.models import ColumnDataSource,Div,Row
from bokeh.io import curdoc
from bokeh.events import Tap

#the data
d={'x':[1,2],'y':[3,4],'info':['some information on a first datapoint','some information on a second datapoint']}

source=ColumnDataSource(d)
tooltips = [("x", "$x"),("y", "$y"),("info","@info")]
fig=figure(tools="tap,reset",tooltips=tooltips)
c=fig.circle('x','y',source=source,size=15)

def callback(event):
    indexActive=source.selected.indices[0]
    layout.children[1]=Div(text=d['info'][indexActive])#adjust the info on the right

fig.on_event(Tap, callback)

div=Div(text=d['info'][0])

layout=Row(fig,div)
curdoc().add_root(layout)