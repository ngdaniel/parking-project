import requests
import csv
import datetime
import pytz
import MySQLdb
import os
import logging
import traceback

db = MySQLdb.connect(host="parking.c9q5edmigsud.us-west-2.rds.amazonaws.com", port=3306, user='parking', passwd='sdotpark1ng', db="parking")
cursor = db.cursor()

logging.basicConfig(filename='pull.log', level=logging.DEBUG, format='%(asctime)s %(message)s')

for x in xrange(2):
    date = datetime.datetime.now(tz=pytz.timezone('US/Pacific')) - datetime.timedelta(days=x)
    url = 'http://web6.seattle.gov/SDOT/wapiParkingStudy/api/ParkingTransaction?from='+ date.strftime('%m%d%Y') + '&to=' + date.strftime('%m%d%Y')
    r = requests.get(url)
    reader = csv.reader(r.text.splitlines())
    inserted = 0
    duplicates = 0
    keys = reader.next()
    for row in reader:
        print row
        query = 'INSERT INTO transactions (meter_code, transaction_id, timestamp, duration, element_key) VALUES ('\
                + row[1] + ', ' + row[2] + ', "' + datetime.datetime.strptime(row[3], '%m/%d/%Y %H:%M:%S').strftime('%Y-%m-%d %H:%M:%S') + '", ' + row[7] + ', ' + row[8] + ')' 
        try: 
            cursor.execute(query)
            inserted += 1
        except MySQLdb.IntegrityError:
            duplicates += 1
        except MySQLdb.ProgrammingError:
            logging.error(query)
            logging.error(traceback.format_exc())

    db.commit()
db.close()

logging.info('inserted: ' + str(inserted))
logging.info('duplicates: ' + str(duplicates))
