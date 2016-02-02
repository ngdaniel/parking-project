import marshal as pickle
import numpy as np
import gmplot # you need to install this from the above link
import matplotlib.pyplot as plt
import urllib2
import csv
import datetime

"""""""""

parses and serializes data from SDOT API, one week at a time

"""""""""

startDate = datetime.datetime(2015, 1, 1)
for x in xrange(52):
    transactions = {}
    start = startDate.strftime('%m%d%Y')
    endDate = startDate + datetime.timedelta(days=7)
    end = endDate.strftime('%m%d%Y')
    url = 'http://web6.seattle.gov/SDOT/wapiParkingStudy/api/ParkingTransaction?from='+start+'&to=' + end
    req = urllib2.urlopen(url)
    csvFile = csv.reader(req)

    '''
    DataID Key()                           Text               System unique identifier  
    MeterCode(0)                   Text               Unique identifier of the pay station
    TransactionID (1)                Text               The unique transaction identifier 
    TransactionDateTime (2)    Text               The date and time of the transaction as recorded 
    Amount(3)                          Text               The amount of the transactions in dollars 
    User Number (4)                 Text               Equals to 1; can be disregarded   
    PaymentMean (5)              Text               Type of payment (Coin, Credit, Phone) 
    PaidDuration (6)                Text               The total amount of time in seconds this payment represents. This field may include an extra 2 minute grace period or the prepayment hours before paid hours begin.  Some older machines can only report time in 5 minute increments.  (Number) 
    Elementkey  (7)                 Text               Unique identifier for the city street segment where the pay station is located 
    Year  (8)                             Text               The year of the transaction as recorded (derived from TransactionDateTime)  
    Month (9)                           Text               The month of the transaction as recorded (derived from TransactionDateTime) 
    '''

    keys = csvFile.next() 

    for row in csvFile:
        transactions[row[0]] = {keys[col_index]: row[col_index] for col_index in xrange(12)}
        
    outputFile = open('/datastore/2015data/' + startDate.strftime('%m%d') + '_' + endDate.strftime('%m%d') + '.p', 'wb')

    startDate = endDate + datetime.timedelta(days=1)
    pickle.dump(transactions, outputFile)
    outputFile.close()
