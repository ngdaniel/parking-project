import SimpleHTTPServer
import SocketServer

"""""""""

easy local http server to query html from

"""""""""

PORT = 8000

Handler = SimpleHTTPServer.SimpleHTTPRequestHandler

httpd = SocketServer.TCPServer(("", PORT), Handler)

print "serving at port", PORT
httpd.serve_forever()
