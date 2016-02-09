import marshal
import datetime
import os  

"""""""""

calculates maximum occupancies for pay station

"""""""""

keys = set([])
d = {}
data = {}
identifier = 'ElementKey'
#identifier = 'MeterCode'

for fn in os.listdir('datastore/2015data'):
    x = marshal.load(open('datastore/2015data/' + fn, 'rb'))
    for k, v in x.iteritems():
        time = datetime.datetime.strptime(v['TransactionDateTime'], '%m/%d/%Y %H:%M:%S').strftime('%s')
        keys.add(v[identifier])
        if not data.get(v[identifier]):
            data[v[identifier]] = []
        data[v[identifier]].append((int(time), True))
        data[v[identifier]].append((int(time)+int(v['PaidDuration']), False))
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

print d
print len(d.keys())
marshal.dump(d, open('datastore/blockface_occupancies.m', 'wb'))

