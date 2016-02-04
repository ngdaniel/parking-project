import xlrd
import marshal

paid_spaces_supply = xlrd.open_workbook('datastore/paidspacesupply.xlsx').sheet_by_index(0)
#keys = [key.value for key in paid_spaces_supply.row(0)]

curr_occupancies = {}

for row_index in xrange(1, paid_spaces_supply.nrows):
    
    #ignore changes not in effect
    if not paid_spaces_supply.cell_value(row_index, 17) and paid_spaces_supply.cell_value(row_index, 4):
        curr_occupancies[int(paid_spaces_supply.cell_value(row_index, 1))] = int(paid_spaces_supply.cell_value(row_index, 4))

marshal.dump(curr_occupancies, open('datastore/paid_space_supply.b', 'wb'))
