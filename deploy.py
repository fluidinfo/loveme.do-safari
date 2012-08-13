#!/usr/bin/env python

from getpass import getpass
import fluidinfo as fi
from pprint import pprint

username = 'gridaphobe'
password = getpass('password: ')

fi.login(username, password)


with open('../loveme.do.safariextz') as f:
    extension = f.read()

h, r = fi.put('/about/@fluidinfo/gridaphobe/fluidinfo.safariextz', extension,
              'application/octet-stream')

if h['status'] != '204':
    print 'Error uploading extension:'
    pprint(h)


with open('update.plist') as f:
    plist = f.read()

h, r = fi.put('/about/@fluidinfo/gridaphobe/safari-extension.plist', plist,
              'text/plain')

if h['status'] != '204':
    print 'Error uploading plist:'
    pprint(h)
