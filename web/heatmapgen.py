import gmplot
import pickle
import marshal
import os
import datetime

"""""""""

script for reading data and generating html heatmaps

"""""""""

gmap=gmplot.GoogleMapPlotter(47.6097,-122.3331,13)

#load look up table for pay station location
locations = pickle.load(open('datastore/avgblockfacelocs.pickle'))
#load transaction data
transactions = marshal.load(open('datastore/2015data/06020601.p', 'rb'))

#dictionary to store transactions per hour
locs_per_hr = {n: [] for n in xrange(24)}

#push transactions to dictionary
for k, v in transactions.iteritems():
    time = datetime.datetime.strptime(v['TransactionDateTime'], '%m/%d/%Y %H:%M:%S')
    if time.day == 1:
        loc = locations.get(int(v['ElementKey']))
        if loc:
            #add data to dictionary for each hour in duration of transaction
            for x in xrange(time.hour, time+datetime.timedelta(seconds=int(v['PaidDuration'])).hour):
                locs_per_hr[x].append((loc[0], loc[1]))

#generate heatmap for each hour
for k, v in locs_per_hr.iteritems():
    heatlats = []
    heatlons = []
    for loc in v:
        heatlats.append(loc[0])
        heatlons.append(loc[1])

    gmap.heatmap(heatlats, heatlons)
    gmap.draw("html/jun1heatmaps/heatmap" + str(k) + ".html")
