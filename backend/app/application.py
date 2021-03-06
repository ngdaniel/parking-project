from __future__ import division
from flask import Flask, Response, request, abort, render_template, jsonify
from flask.ext.mysql import MySQL
from flask.ext.cors import CORS
import json
import time
import datetime
import math
import os
import requests

application = Flask(__name__)
CORS(application)
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
    query = "SELECT * FROM blockfaces"
    if element_keys:
        query += " WHERE element_key IN ({0})" 
        cur.execute(query.format(', '.join(element_keys.split())))
    else:
        cur.execute(query)
    ret = {}
    for ps in cur.fetchall():
        ret[ps[0]] = ps[1:]
        
    return json.dumps(ret)

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

    query = "SELECT *, \
                acos(sin({0})*sin(radians(latitude_avg)) + cos({0})*cos(radians(latitude_avg))*cos(radians(longitude_avg)-{1})) * {2} AS D \
            FROM ( \
                SELECT* \
                FROM blockfaces\
                WHERE latitude_avg BETWEEN {3} AND {4} \
                  AND longitude_avg BETWEEN {5} AND {6} \
            ) AS firstcut \
            WHERE acos(sin({0})*sin(radians(latitude_avg)) + cos({0})*cos(radians(latitude_avg))*cos(radians(longitude_avg)-{1})) * {2} < {7} \
            ORDER BY D"
    cur.execute(query.format(math.radians(lat), math.radians(lon), R, minlat, maxlat, minlon, maxlon, rad))
    ret = {}
    for ps in cur.fetchall():
        ret[ps[0]] = ps[1:]
        
    return json.dumps(ret)

@application.route('/transactions', methods=['GET', 'POST'])
def get_transactions():
    cur = mysql.connect().cursor()
    start = datetime.datetime.fromtimestamp(int(request.args.get('start', int(time.mktime((datetime.datetime.now()-datetime.timedelta(days=7)).timetuple())))))
    end = datetime.datetime.fromtimestamp(int(request.args.get('end', int(time.mktime(datetime.datetime.now().timetuple())))))
    query = "SELECT * FROM transactions WHERE timestamp BETWEEN '{0}' and '{1}';"
    cur.execute(query.format(start.strftime('%Y-%m-%d %H:%M:%S'), end.strftime('%Y-%m-%d %H:%M:%S')))
    ret = {}
    for t in cur.fetchall():
        ret[t[0]] = list(t[1:2]) + [str(t[3])] + [t[4]]
        
    return json.dumps(ret)

@application.route('/densities', methods=['GET', 'POST'])
def get_densities():
    cur = mysql.connect().cursor()
    at_time = datetime.datetime.fromtimestamp(int(request.args.get('time', int(time.mktime(datetime.datetime.now().timetuple())))))
    element_keys = request.args.get('element_keys', None)
    start = at_time - datetime.timedelta(hours=24)
    query = "SELECT element_key, timestamp, duration FROM transactions WHERE timestamp BETWEEN '{0}' and '{1}'"
    if element_keys:
        query += " AND element_key IN ({2}) order by duration;" 
        cur.execute(query.format(start.strftime('%Y-%m-%d %H:%M:%S'), at_time.strftime('%Y-%m-%d %H:%M:%S'), ', '.join(element_keys.split())))
    else:
        query += " order by duration;"
        cur.execute(query.format(start.strftime('%Y-%m-%d %H:%M:%S'), at_time.strftime('%Y-%m-%d %H:%M:%S')))
    transactions = cur.fetchall()
    timeframes = {}
    occupancies = {}
    for transaction in transactions:
        if transaction[1] + datetime.timedelta(seconds=transaction[2]) > at_time:
            occupancies[transaction[0]] = occupancies.get(transaction[0], 0) + 1

    densities = {}
    for key, occupancy in occupancies.iteritems():
        if occupancy:
            query = "SELECT max_occupancy FROM blockfaces WHERE element_key = {0};"
            cur.execute(query.format(key))
            max_occupancy = cur.fetchone()
            if max_occupancy:
                max_occupancy = max_occupancy[0]
                densities[key] = float("{0:.3f}".format(occupancy/max_occupancy))
        
    return json.dumps(densities)
        
if __name__ == "__main__":
    application.debug = True
    application.run(threaded=True, port = 5000)
