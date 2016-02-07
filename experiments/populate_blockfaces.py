import marshal
import MySQLdb
import os

blockfaces = marshal.load(open('datastore/allblockfaces.m', 'rb'))
    
    
db = MySQLdb.connect(host="parking.c9q5edmigsud.us-west-2.rds.amazonaws.com", port=3306, user=os.environ.get('RDS_USERNAME'), passwd=os.environ.get('RDS_PASSWORD'), db="parking")
cursor = db.cursor()
for k,v in blockfaces.iteritems():
    avg_lon = (v[0] + v[2])/2
    avg_lat = (v[1] + v[3])/2
    command = "INSERT INTO blockfaces (element_key, longitude_1, latitude_1, longitude_2, latitude_2, longitude_avg, latitude_avg) VALUES(" + str(k) + ", " + str(v[0]) + ", " + str(v[1]) + ", " + str(v[2]) + ", " + str(v[3]) + ", " + str(avg_lon) + ", " + str(avg_lat) + ");"
    cursor.execute(command)

db.commit()
db.close()
