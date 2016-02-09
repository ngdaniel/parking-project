import urllib2
import csv
import datetime
import pytz
import MySQLdb
import os
import logging

db = MySQLdb.connect(host="parking.c9q5edmigsud.us-west-2.rds.amazonaws.com", port=3306, user='parking', passwd='sdotpark1ng', db="parking")
cursor = db.cursor()

logging.basicConfig(filename='/home/ec2-user/pull.log', level=logging.DEBUG, format='%(asctime)s %(message)s')

date = datetime.datetime.now(tz=pytz.timezone('US/Pacific')) - datetime.timedelta(days=1)
url = 'http://web6.seattle.gov/SDOT/wapiParkingStudy/api/ParkingTransaction?from='+ date.strftime('%m%d%Y') + '&to=' + date.strftime('%m%d%Y')
req = urllib2.urlopen(url)
csvFile = csv.reader(req)
inserted = 0
duplicates = 0
keys = csvFile.next()
for row in csvFile:
    query = 'INSERT INTO transactions (data_id, meter_code, transaction_id, timestamp, amount, payment_mean, duration, element_key) VALUES ('\
            + row[0] + ', ' + row[1] + ', ' + row[2] + ', "' + datetime.datetime.strptime(row[3], '%m/%d/%Y %H:%M:%S').strftime('%Y-%m-%d %H:%M:%S') + '", ' + row[4] + ', "' + row[6] + '", ' + row[7] + ', ' + row[8] + ')' 
    try: 
        cursor.execute(query)
        inserted += 1
    except MySQLdb.IntegrityError:
        duplicates += 1

db.commit()
db.close()

logging.info('inserted: ' + str(inserted))
logging.info('duplicates: ' + str(duplicates))
