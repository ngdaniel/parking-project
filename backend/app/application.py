from flask import Flask, request, abort , render_template ,jsonify
from flask.ext.mysql import MySQL
import json
import time
import datetime
import math
import os

application = Flask(__name__)
mysql = MySQL()
 
application.config['MYSQL_DATABASE_USER'] = os.environ.get('RDS_USERNAME')
application.config['MYSQL_DATABASE_PASSWORD'] = os.environ.get('RDS_PASSWORD')
application.config['MYSQL_DATABASE_DB'] = 'parking'
application.config['MYSQL_DATABASE_HOST'] = 'parking.c9q5edmigsud.us-west-2.rds.amazonaws.com'
application.config['MYSQL_DATABASE_PORT'] = 3306
mysql.init_app(application)

@application.route('/')    
def index():
    return render_template('index.html')

@application.route('/paystations', methods=['GET', 'POST'])
def get_paystations():
    element_keys = request.args.get('element_keys', None)
    cur = mysql.connect().cursor()
    query = "SELECT * FROM pay_stations"
    if element_keys:
        query += " WHERE element_key IN ({0})" 
        cur.execute(query.format(', '.join(element_keys.split())))
    else:
        cur.execute(query)
    return str(cur.fetchall())

@application.route('/paystations_in_radius', methods=['GET', 'POST'])
def get_paystations_in_radius():
    lat = request.args.get('latitude', None)
    lon = request.args.get('longitude', None)
    rad = request.args.get('radius', None)
    if not lon or not lat or not rad:
        abort(400)

    cur = mysql.connect().cursor()
    lat = float(lat)
    lon = float(lon)
    rad = float(rad)
    R = 6371 

    maxlat = lat + math.degrees(rad/R)
    minlat = lat - math.degrees(rad/R)

    maxlon = lon + math.degrees(rad/R/math.cos(math.radians(lat)))
    minlon = lon - math.degrees(rad/R/math.cos(math.radians(lat)))

    query = "SELECT element_key, latitude, longitude, max_occupancy, \
                acos(sin({0})*sin(radians(latitude)) + cos({0})*cos(radians(latitude))*cos(radians(longitude)-{1})) * {2} AS D \
            FROM ( \
                SELECT* \
                FROM pay_stations\
                WHERE latitude BETWEEN {3} AND {4} \
                  AND longitude BETWEEN {5} AND {6} \
            ) AS firstcut \
            WHERE acos(sin({0})*sin(radians(latitude)) + cos({0})*cos(radians(latitude))*cos(radians(longitude)-{1})) * {2} < {7} \
            ORDER BY D"
    cur.execute(query.format(math.radians(lat), math.radians(lon), R, minlat, maxlat, minlon, maxlon, rad))
    results = cur.fetchall()
    return jsonify(result =results)

@application.route('/transactions')
def get_transactions():
    cur = mysql.connect().cursor()
    start = datetime.datetime.fromtimestamp(int(request.args.get('start', 631180800)))
    end = datetime.datetime.fromtimestamp(int(request.args.get('end', int(time.mktime(datetime.datetime.now().timetuple())))))
    query = "SELECT * FROM transactions WHERE timestamp BETWEEN '{0}' and '{1}';"
    cur.execute(query.format(start.strftime('%Y-%m-%d %H:%M:%S'), end.strftime('%Y-%m-%d %H:%M:%S')))
    return str(cur.fetchall())

if __name__ == "__main__":
    application.debug = True
    application.run(threaded=True, port = 5000)
