# Air Cargo Status Codes

Status codes specific to air freight shipments.

## Air Cargo Statuses

### Pre-Flight
- `cargo_accepted` - Cargo accepted at origin airport
- `security_screening` - Security screening in progress
- `loaded_on_aircraft` - Loaded onto aircraft
- `flight_departed` - Flight departed from origin

### In-Flight
- `in_transit_air` - In transit via air
- `flight_landed` - Flight landed at destination
- `unloaded_from_aircraft` - Unloaded from aircraft

### Post-Flight
- `customs_clearance_air` - Air customs clearance
- `ready_for_collection` - Ready for collection
- `out_for_delivery_air` - Out for final delivery

### Airport Operations
- `airport_delay` - Delayed at airport
- `connecting_flight` - Awaiting connecting flight
- `offloaded` - Offloaded from flight
- `manifested` - Added to flight manifest

### Documentation
- `awb_issued` - Air Waybill issued
- `docs_received` - Documentation received
- `docs_cleared` - Documentation cleared

## Special Handling
- `dangerous_goods` - Special handling for dangerous goods
- `perishable_goods` - Perishable goods handling
- `valuable_goods` - High-value goods handling