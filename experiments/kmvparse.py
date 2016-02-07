import pickle
import marshal
import pykml.parser as par
import xml.etree.ElementTree as et
tree=et.parse('datastore/blockfacecsv.kml')
root=tree.getroot()
idd=[]
crd=[]
for child in root.findall('.//{http://www.opengis.net/kml/2.2}SimpleData'):
    d=child.attrib
    if d['name']=='ELMNTKEY':
        idd.append(int(child.text))
crd = pickle.load(open('datastore/allblocks.p'))
    #coords = c[0].split()
    #crd.append([coords[0].split(','), coords[1].split(',')])
#crd_=[[float(i) for i in y[0].split().split(',')] for y in crd]
#for y in crd:
#  s=y[0].split(',')
#  c=[float(i) for i in s]
#  crd_.append(c)
al=zip(idd,crd)
dic={}
for i,c in al:
    dic[i]=c

marshal.dump(dic, open('datastore/allblockfaces.m', 'wb'))
