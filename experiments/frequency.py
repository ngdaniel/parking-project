import MySQLdb
import datetime
import pytz
import marshal

db = MySQLdb.connect(host="parking.c9q5edmigsud.us-west-2.rds.amazonaws.com", port=3306, user='parking', passwd='sdotpark1ng', db="parking")
cur = db.cursor()

day_counts = {}

for x in xrange(369, 4, -1):
    date = datetime.datetime.now(tz=pytz.timezone('US/Pacific')) - datetime.timedelta(days=x)
    query = "SELECT element_key, timestamp, duration FROM transactions WHERE date(timestamp) = '{0}';"
    cur.execute(query.format(date.strftime('%Y-%m-%d')))
    transactions = cur.fetchall()
    for transaction in transactions:
        end = transaction[1] + datetime.timedelta(seconds=transaction[2])
        if end.day == date.day:
            counts = day_counts.get(transaction[0], [0 for z in xrange(0, 364)])
            counts[368-x] += transaction[2]/360
            day_counts[transaction[0]] = counts

print day_counts
marshal.dump(day_counts, open('datastore/frequencies.b', 'wb'))
