# Air Cargo API

API endpoints specific to air freight shipments.

## Create Air Cargo Tracking

**POST** `/air-cargo/trackings`

Create tracking for air freight shipment.

### Request Body

```json
{
  "awb_number": "020-12345678",
  "carrier": "lufthansa-cargo",
  "flight_number": "LH441",
  "origin_airport": "FRA",
  "destination_airport": "JFK",
  "pieces": 5,
  "weight": "125.5",
  "customer_info": {
    "shipper": "ABC Corp",
    "consignee": "XYZ Ltd",
    "agent": "Cargo Agent Inc"
  }
}
```

### Response

```json
{
  "id": "air_123456",
  "awb_number": "020-12345678",
  "carrier": "lufthansa-cargo",
  "status": "loaded_on_aircraft",
  "flight_info": {
    "number": "LH441",
    "departure": "2023-01-01T14:00:00Z",
    "arrival": "2023-01-01T18:00:00Z"
  },
  "airport_info": {
    "origin": "FRA",
    "destination": "JFK",
    "current_location": "FRA"
  },
  "cargo_details": {
    "pieces": 5,
    "weight": "125.5 kg",
    "dimensions": "120x80x100 cm"
  }
}
```

## Get Flight Information

**GET** `/air-cargo/flights/{flight_number}`

Get flight information and cargo manifest.

### Response

```json
{
  "flight_number": "LH441",
  "aircraft_type": "Boeing 747-400F",
  "departure": {
    "airport": "FRA",
    "scheduled": "2023-01-01T14:00:00Z",
    "actual": "2023-01-01T14:15:00Z"
  },
  "arrival": {
    "airport": "JFK", 
    "scheduled": "2023-01-01T18:00:00Z",
    "estimated": "2023-01-01T18:20:00Z"
  },
  "status": "in_flight"
}
```

## Airport Cargo Status

**GET** `/air-cargo/airports/{airport_code}/cargo`

Get cargo operations status at specific airport.

### Query Parameters

- `date` - Date (YYYY-MM-DD)
- `status` - Filter by cargo status
- `carrier` - Filter by carrier

## AWB Tracking

**GET** `/air-cargo/awb/{awb_number}`

Track shipment by Air Waybill number.

### Response

```json
{
  "awb_number": "020-12345678",
  "status": "customs_clearance_air",
  "current_location": "JFK",
  "events": [
    {
      "timestamp": "2023-01-01T12:00:00Z",
      "location": "FRA",
      "status": "cargo_accepted",
      "description": "Cargo accepted at Frankfurt"
    },
    {
      "timestamp": "2023-01-01T14:15:00Z", 
      "location": "FRA",
      "status": "loaded_on_aircraft",
      "description": "Loaded on flight LH441"
    }
  ]
}
```