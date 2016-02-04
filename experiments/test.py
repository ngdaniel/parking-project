import marshal as pickle
import gmplot 

"""""""""

calculates maximum occupancies for pay station

"""""""""

import datetime
import os  
keys = set([])
d = {}
data = {}
for fn in os.listdir('datastore/2015data'):
    x = pickle.load(open('datastore/2015data/' + fn, 'rb'))
    for k, v in x.iteritems():
        time = datetime.datetime.strptime(v['TransactionDateTime'], '%m/%d/%Y %H:%M:%S').strftime('%s')
        keys.add(v['ElementKey'])
        if not data.get(v['ElementKey']):
            data[v['ElementKey']] = []
        data[v['ElementKey']].append((int(time), True))
        data[v['ElementKey']].append((int(time)+int(v['PaidDuration']), False))
for k, v in data.iteritems():
    start_stops = v 
    start_stops.sort(key=lambda tup: tup[0])
    maxOccupancy = 0
    curr = 0
    for tup in start_stops:
        if tup[1]:
            curr += 1
            maxOccupancy = max([maxOccupancy, curr])
        else:
            curr -= 1
    d[k] = maxOccupancy

pickle.dump(d, open('datastore/occupancies.pickle', 'wb'))
