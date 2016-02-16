import marshal
import pickle
import json

blocks=pickle.load(open('datastore/usedblocks.p','rb')) # load location data
with open('datastore/streets.json', 'w') as out:
    json.dump(blocks, out)
