import os
import marshal
import pickle
import numpy as np
import gmplot
import webbrowser


# draw vector of blocks on gmap
def draw_blocks(coords, clr):
    for b in range(np.size(coords,0)):
        gmap.polygon([coords[b,1],coords[b,3]],[coords[b,0], coords[b,2]],color=clr,edge_width=3)

# center seattle on map
gmap=gmplot.GoogleMapPlotter(47.6097,-122.3331,13)

# open block coords
locs=pickle.load(open('datastore/blockfacelocs.p','rb')) # load location data
allblocks = marshal.load(open('datastore/allblockfaces.m', 'rb'))

# create numpy vector
clusterlocs=np.asarray(locs.values())
blocks = np.asanyarray(allblocks.values())
print 'Drawing %d red blocks, %d green blocks' % (np.size(clusterlocs,0), np.size(blocks,0))
draw_blocks(clusterlocs, 'red')
draw_blocks(blocks, 'blue')

fname = 'blueblocks.html'
path = 'html/'
gmap.draw(path + fname)
webbrowser.open('file://' + os.path.realpath(path + fname))
