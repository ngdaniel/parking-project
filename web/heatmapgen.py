import gmplot
import pickle
import marshal
import os

locations = pickle.load(open('avgblockfacelocs.pickle'))
heatlats = []
heatlons = []
gmap=gmplot.GoogleMapPlotter(47.6097,-122.3331,13)
for fn in os.listdir('2015data'):
    print fn
    x = marshal.load(open('2015data/' + fn, 'rb'))
    for k, v in x.iteritems():
        loc = locations.get(int(v['ElementKey']))
        print v['ElementKey']
        print loc
        if loc:
            heatlats.append(loc[0])
            heatlons.append(loc[1])

gmap.heatmap(heatlats, heatlons)
gmap.draw("heatmap.html")
