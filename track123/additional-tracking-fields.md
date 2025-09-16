Additional Tracking Fields
There are additional fields like "postalCode" and "phoneSuffix" that certain carriers need to authenticate your API request. Find the full list here.

Some carriers need to provide additional information about the tracking (to ensure that you are really the owner of the tracking information) in addition to the tracking number. These fields are handled differently by specific carriers.

Additional fields Format
Name	Description	Example
postalCode	Postal code of recipient address	10001
phoneSuffix	The last 4 digits of the shipment sender's or recipient's phone number	1234
Carriers that require additional fields
Carrier	courierCode	Required fields
Allied Express	alliedexpress	postalCode
B2C Europe	b2ceurope-be	postalCode
Colis Prive	colis-prive	postalCode
DX	dxdelivery	postalCode
GEL Express Logistik	gel-express-logistik	postalCode
GLS Spain (National)	gls-spain	postalCode
Mondial Relay	mondialrelay	postalCode
PostNL	postnl	postalCode
Postmedia Parcel Services	postmedia-parcel-services-bni-pa	postalCode
The Delivery Group	thedeliverygroup	postalCode
XDP EXPRESS	xdpexpress	postalCode
Yodel	yodel	postalCode
sfb2c	SF Express	phoneSuffix
jtexpress-mx	J&T Express (MX)	phoneSuffix
jetid	J&T Express (ID)	phoneSuffix
