#Get the list of package carriers
get
https://api.track123.com/gateway/open-api/tk/v2.1/courier/list
Log in to see full request history
time	status	user agent	
Make a request to see history.
0 Requests This Month

Headers
Track123-Api-Secret
string
required
Your API key

Response

200
Success

Response body
object
code
string
Service status code

data
array of objects
object
courierCode
string
The unique carrier code

courierNameCN
string
Carrier name in Chinese

courierNameEN
string
Carrier name in English

courierHomePage
string
Carrier website home page

msg
string
The description information corresponding to the service status code or other auxiliary description information.


  