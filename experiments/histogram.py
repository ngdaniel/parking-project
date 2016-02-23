import MySQLdb
import datetime
import pytz

db = MySQLdb.connect(host="parking.c9q5edmigsud.us-west-2.rds.amazonaws.com", port=3306, user='parking', passwd='sdotpark1ng', db="parking")
cur = db.cursor()

hour_counts= {}
max_occupancies = {}
query = "SELECT * FROM blockfaces"
cur.execute(query)
for blockface in cur.fetchall():
    max_occupancies[blockface[0]] = blockface[7]

for x in xrange(3, 368):
    date = datetime.datetime.now(tz=pytz.timezone('US/Pacific')) - datetime.timedelta(days=x)
    query = "SELECT element_key, timestamp, duration FROM transactions WHERE date(timestamp) = '{0}';"
    cur.execute(query.format(date.strftime('%Y-%m-%d')))
    transactions = cur.fetchall()
    for transaction in transactions:
        start = transaction[1]
        end = start + datetime.timedelta(seconds=transaction[2])
        if end.day == date.day:
            for y in xrange(start.hour, end.hour):
                counts = hour_counts.get(transaction[0], [0 for z in xrange(0, 23)])
                counts[y] += 1
                hour_counts[transaction[0]] = counts
                
    print hour_counts
                
