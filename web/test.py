import pickle
import gmplot 
import xlrd
import pprint
import csv
'''
gmap=gmplot.GoogleMapPlotter(47.6097,-122.3331,13)
cross_reference_xls = xlrd.open_workbook('crossreferencesheet.xlsx').sheet_by_index(0)
keys = cross_reference_xls.row(0)
for x in xrange(len(keys)):
    keys[x] = keys[x].value
cross_reference = {}
meters = {} 
for row_index in xrange(1, cross_reference_xls.nrows):
    d = {keys[col_index]: cross_reference_xls.cell(row_index, col_index).value 
         for col_index in xrange(cross_reference_xls.ncols)}
    meters[int(cross_reference_xls.cell(row_index, 5).value)] = d


locs = pickle.load(open('blockfacelocs.p','rb')) # load location data
lats = []
lons = []
for id in locs.keys():
    locs[id] = [(locs[id][1] + locs[id][3])/2, (locs[id][0] + locs[id][2])/2]
    lats.append(locs[id][0])
    lons.append(locs[id][1])

pickle.dump(locs, open('avgblockfacelocs.pickle', 'wb'))
pickle.dump(meters, open('meters.pickle', 'wb'))
gmap.heatmap(lats, lons)
gmap.draw("index.html")
'''
import datetime
x = pickle.load(open('transactionsFrom01012015to01072015.pkl', 'rb'))
y = []
keys = set([])
for k, v in x.iteritems():
    keys.add(v['ElementKey'])
    if v['ElementKey'] == '119444':
        y.append(v)

start_stops  = []
for transaction in y:
    time = datetime.datetime.strptime(transaction['TransactionDateTime'], '%m/%d/%Y %H:%M:%S').strftime('%s')
    start_stops.append((int(time), True))
    start_stops.append((int(time)+int(transaction['PaidDuration'])*60, False))

print start_stops
start_stops.sort(key=lambda tup: tup[0])
print start_stops

maxOccupancy = 0
curr = 0
for tup in start_stops:
    print curr
    if tup[1]:
        curr += 1
        maxOccupancy = max([maxOccupancy, curr])
    else:
        curr -= 1
print maxOccupancy
