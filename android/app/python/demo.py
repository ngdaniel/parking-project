import pickle
import numpy as np
import gmplot
import matplotlib.pyplot as plt
gmap=gmplot.GoogleMapPlotter(47.6097,-122.3331,13) # this centers the map in seattle
#gmap.polygon(clusterlocs[0][0:2,0],clusterlocs[0][0:2,1],'r') #this draws

locs=pickle.load(open('./blockfacelocs.p','rb')) # load location data
clusterlocs=np.asarray(locs.values())
for b in range(np.size(clusterlocs,0)):
   gmap.polygon([clusterlocs[b,1],clusterlocs[b,3]],[clusterlocs[b,0],
                   clusterlocs[b,2]],color='g',edge_width=3)

st="map-2013-s"+".html"
gmap.draw(st)
print 'Created file : %s' % st