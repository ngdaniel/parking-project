import marshal
import MySQLdb
import os

blockfaces = marshal.load(open('datastore/allblockfaces.m', 'rb'))
occupancies = marshal.load(open('datastore/paid_space_supply.b', 'rb'))
    
db = MySQLdb.connect(host="parking.c9q5edmigsud.us-west-2.rds.amazonaws.com", port=3306, user=os.environ.get('RDS_USERNAME'), passwd=os.environ.get('RDS_PASSWORD'), db="parking")
cursor = db.cursor()
for k,v in occupancies.iteritems():
    blockface = blockfaces.get(int(k), None)
    if blockface:
        try:
            avg_lon = (float(blockface[0][0]) + float(blockface[1][0]))/2
            avg_lat = (float(blockface[0][1]) + float(blockface[1][1]))/2
            command = "INSERT INTO blockfaces (element_key, longitude_1, latitude_1, longitude_2, latitude_2, longitude_avg, latitude_avg, max_occupancy) VALUES(" + str(k) + ", " + str(blockface[0][0]) + ", " + str(blockface[0][1]) + ", " + str(blockface[1][0]) + ", " + str(blockface[1][1]) + ", " + str(avg_lon) + ", " + str(avg_lat) + ', ' + str(v) + ");"
            print command
            cursor.execute(command)
        except MySQLdb.IntegrityError:
            pass
    else:
        print k 

db.commit()
db.close()
