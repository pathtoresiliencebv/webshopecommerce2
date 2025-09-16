# Ocean Cargo API

API endpoints specific to ocean freight shipments.

## Create Ocean Cargo Tracking

**POST** `/ocean-cargo/trackings`

Create tracking for ocean freight shipment.

### Request Body

```json
{
  "container_number": "MSKU1234567",
  "bill_of_lading": "BOL123456789",
  "carrier": "maersk",
  "vessel_name": "Maersk Alabama",
  "voyage_number": "001W",
  "origin_port": "USNYC",
  "destination_port": "NLRTM",
  "customer_info": {
    "shipper": "ABC Corp",
    "consignee": "XYZ Ltd",
    "notify_party": "notify@example.com"
  }
}
```

### Response

```json
{
  "id": "ocean_123456",
  "container_number": "MSKU1234567",
  "bill_of_lading": "BOL123456789",
  "carrier": "maersk",
  "status": "loaded_on_vessel",
  "vessel_info": {
    "name": "Maersk Alabama",
    "voyage": "001W",
    "imo": "1234567"
  },
  "port_info": {
    "origin": "USNYC",
    "destination": "NLRTM",
    "current_location": "USNYC"
  },
  "estimated_arrival": "2023-01-15T00:00:00Z"
}
```

## Get Container Status

**GET** `/ocean-cargo/containers/{container_number}`

Get detailed container status and location.

## Get Vessel Information

**GET** `/ocean-cargo/vessels/{imo_number}`

Get vessel information and current position.

### Response

```json
{
  "imo": "1234567",
  "name": "Maersk Alabama",
  "mmsi": "123456789",
  "current_position": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "timestamp": "2023-01-01T12:00:00Z"
  },
  "next_port": "NLRTM",
  "eta": "2023-01-15T08:00:00Z"
}
```

## Port Schedules

**GET** `/ocean-cargo/ports/{port_code}/schedules`

Get vessel schedules for a specific port.

### Query Parameters

- `from_date` - Start date (YYYY-MM-DD)
- `to_date` - End date (YYYY-MM-DD)
- `carrier` - Filter by carrier