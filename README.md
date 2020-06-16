# tempLogger
Temp Logger. Logs your Temps

`docker run /path/to/existing/database.sqlite:/templogger/database.sqlite -p 8002:8002 strifel/templogger`

# Insert
POST /input/name
{
	"temperature": 25.4,
	"humidity": 300,
	"token": "84c22ffbdfd88f427250d653" // You get that on first start
}

# Get
GET /current/name

OR:

GET /today/name
