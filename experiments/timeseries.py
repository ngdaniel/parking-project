import MySQLdb
import time
import os
import pickle
import datetime as dt
import numpy as np
import pandas as pd

# Settings
# TODO support a list of ids and output dataframe |timestamp|elm_id(0)|elm_id(2)|...|elm_id(n)|
elm_id = 76429
buffer_size = 2  # days to log before writing file

start_day = '1-1-2014'
end_day = '1-4-2014'
start_time = time.time()  # current time for timing script
last_time = 0
last_output = ''
path = 'datastore/paystations/'
if not os.path.exists(path):
    os.makedirs(path)

# Init
db = MySQLdb.connect(host="parking.c9q5edmigsud.us-west-2.rds.amazonaws.com",
                     port=3306, user='parking', passwd='sdotpark1ng', db="parking")
cur = db.cursor()
start_date = dt.datetime.strptime(start_day, '%m-%d-%Y')
end_date = dt.datetime.strptime(end_day, '%m-%d-%Y')
day_count = (end_date - start_date).days
hour_count = 24*day_count
day_lookup = ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun']

# Create data frame
index = pd.date_range(start_day, end_day, freq='H')
densities = np.zeros((len(index), 1))
ts = pd.DataFrame(data=densities, index=index, columns=['density'])
ts = ts.fillna(0)


# Free park function
def free_parking(d):
    # holiday (skip and if on sunday skip mon)
    holiday = ['01-01', '07-04', '11-11', '12-25']
    d_str = d.strftime('%m-%d')
    if d_str in holiday:
        return 'holiday'
    mon_after = (d - dt.timedelta(days=1)).strftime('%m-%d')
    if mon_after in holiday and d.weekday() == 0:
        return 'mon after sun holiday'
    # Any Sunday
    if d.weekday() == 6:
        return 'sunday'
    # 3rd Mon Feb and Jan (mlk and pres day)
    elif d.weekday() == 0 and 14 < d.day < 22 and 1 <= d.month <= 2:
        return 'mlk / pres day'
    # Last Mon of may (memorial)
    elif d.weekday() == 0 and 21 < d.day < 32 and d.month == 5:
        return 'memorial day'
    # 1st Mon sept (labor)
    elif d.weekday() == 0 and 0 < d.day < 8 and d.month == 9:
        return 'labor day'
    # 4th Thurs Nov (thanksgiving)
    elif d.weekday() == 3 and 21 < d.day < 29 and d.month == 11:
        return 'thanksgiving day'
    else:
        return ''

def save_data(ts, elm_id, curr_count, day_count):
    global last_output
    print ' Found %d hours of parked cars' %np.nansum(ts.density)
    output = path + '%s_%d_days_of_%d.d' % (str(elm_id), curr_count, day_count-1) # output path
    print 'Saving to %s' % output
    pickle.dump(ts, open(output, 'wb'))
    print ts
    try:
        os.remove(last_output)  # remove previous file
        print 'Deleted : %s' % last_output
    except OSError:
        pass
    last_output = output


# LOOP DAY
print 'Searching Element ID : %d ...' % elm_id
for i, date in enumerate(start_date + dt.timedelta(n) for n in range(day_count)):
    densities = np.zeros(24)  # temp

    # Save every X days
    if i % buffer_size == 0 and i > 0:
        print 'Saving the last %d days' % buffer_size
        save_data(ts[0:24*i], elm_id, i, day_count)

    # Skip free parking
    skip_str = free_parking(date)
    if skip_str:
        ts.density[24*i:24*i+len(densities)] = np.nan
        elapsed_time = time.time() - start_time
        print '  %d/%d \t%s-%s...\tSKIP\t@ id %d\tTime: %d min\tDelta: 0s\t(%s)' % \
            (i, day_count-1, day_lookup[date.weekday()], date.strftime('%Y-%m-%d'), elm_id,
             elapsed_time/60, skip_str)
        continue

    query = "SELECT element_key, timestamp, duration FROM transactions " \
            "WHERE date(timestamp) = '{0}' AND element_key= %d" % elm_id
    cur.execute(query.format(date.strftime('%Y-%m-%d')))
    transactions = cur.fetchall()

    # LOOP TRANSACTIONS
    for j, transaction in enumerate(transactions):
        start = transaction[1]
        end = start + dt.timedelta(seconds=transaction[2])

        # TODO handle this case better
        if end.day != date.day:
            print "\t\tERROR: start and end of transaction must be same day"
            print '\t\t', start, 'to', end
            break

        # LOOP HOURS
        for hr in xrange(start.hour, end.hour):
            densities[hr] += 1

    # Store day's data to ts
    ts.density[24*i:24*i+len(densities)] = densities  # store from hr 0 to 23 for the ith day
    elapsed_time = (time.time() - start_time)
    delta = elapsed_time - last_time

    # Print update
    print '  %d/%d \t%s-%s...\t%d hrs\t@ id %d\tTime: %d min\tDelta: %ds' % \
          (i,day_count-1,day_lookup[date.weekday()],date.strftime('%Y-%m-%d'),len(transactions),elm_id,elapsed_time/60.0,delta)
    last_time = elapsed_time

print 'Done in %d s' % (time.time() - start_time)
save_data(ts, (str(elm_id)+'_final'), day_count, day_count)
