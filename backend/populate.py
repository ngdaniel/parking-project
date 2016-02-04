import MySQLdb
import marshal
import pickle

db = MySQLdb.connect(host="parking-cluster.cluster-c9q5edmigsud.us-west-2.rds.amazonaws.com", port=3306, user="parking", passwd="sdotpark1ng", db="parking")
cursor = db.cursor()

locations = pickle.load(open('../experiments/datastore/avgblockfacelocs.pickle', 'rb'))
occupancies = marshal.load(open('../experiments/datastore/paid_space_supply.b', 'rb'))

for k, v in locations.iteritems():
    if occupancies.get(int(k), None):
        command = "INSERT INTO pay_stations (element_key, latitude, longitude, max_occupancy) VALUES(" + str(k) + ", " + str(v[0]) + ", " + str(v[1]) + ", " + str(occupancies[int(k)]) + ");"
    else:
        command = "INSERT INTO pay_stations (element_key, latitude, longitude, max_occupancy) VALUES(" + str(k) + ", " + str(v[0]) + ", " + str(v[1]) + ", NULL);"
    cursor.execute(command)

db.commit()
db.close()
