import gmplot
import pickle
import marshal
import os
import datetime

locations = pickle.load(open('avgblockfacelocs.pickle'))
locs_per_hr = {n: [] for n in xrange(24)}
gmap=gmplot.GoogleMapPlotter(47.6097,-122.3331,13)
x = marshal.load(open('2015data/06020601.p', 'rb'))
for k, v in x.iteritems():
    time = datetime.datetime.strptime(v['TransactionDateTime'], '%m/%d/%Y %H:%M:%S')
    if time.day == 1:
        loc = locations.get(int(v['ElementKey']))
        if loc:
            locs_per_hr[time.hour].append((loc[0], loc[1]))

for k, v in locs_per_hr.iteritems():
    heatlats = []
    heatlons = []
    for loc in v:
        heatlats.append(loc[0])
        heatlons.append(loc[1])
    

    gmap.heatmap(heatlats, heatlons)
    gmap.draw("jun1heatmaps/heatmap" + str(k) + ".html")
