#!/usr/bin/python
import sys
import numpy as np

def main():
    print sys.argv[1]
    try:
        file = str(sys.argv[1]) # TODO check for csv
    except:
        print 'Need .csv input file argument'
    # with open(file, 'rb') as f:
    #     reader = csv.DictReader(f)
    #     for line in reader:
    #         print line
    # Import data to numpy as floats
    data = np.genfromtxt(file, dtype=None, delimiter=',', names=True)
    print data.dtype.names
    print data['TransactionDateTime']
    # times = np.array(data['TransactionDateTime'], dtype='datetime64')


if __name__ == '__main__':
    main()