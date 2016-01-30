#!/usr/bin/python

import os
from urllib2 import urlopen, URLError, HTTPError
from datetime import datetime


def dl_data(url,output):
    try:        # Open the url
        f = urlopen(url)
        print "Downloading " + url

        # Open our local file for writing
        with open(os.path.basename(output), "wb") as local_file:
            local_file.write(f.read())

    except HTTPError, e:
        print "HTTP Error:", e.code, url
    except URLError, e:
        print "URL Error:", e.reason, url


def check_date(date_str):
    try:
        return datetime.strptime(date_str, '%m/%d/%y')
    except ValueError:
        print 'Incorrect format (Use: m/d/yy)'


def main():
    # Get date input
    start_date = check_date(str(raw_input('Enter Start Date : ')))
    end_date = check_date(str(raw_input('Enter End Date : ')))

    # Format URL
    start =  '%0.2d%0.2d%d' % (start_date.day, start_date.month, start_date.year)
    end =  '%0.2d%0.2d%d' % (end_date.day, end_date.month, end_date.year)
    url = 'http://web6.seattle.gov/SDOT/wapiParkingStudy/api/ParkingTransaction?from=%s&to=%s' % (start, end)

    # Download
    output = 'SDOT-%s-to-%s-Transactions.csv' % (start_date.date(), end_date.date())
    dl_data(url, output)

if __name__ == '__main__':
    main()