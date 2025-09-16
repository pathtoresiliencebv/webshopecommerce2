# Ocean Cargo Status Codes

Status codes specific to ocean freight shipments.

## Ocean Cargo Statuses

### Pre-Carriage
- `cargo_received` - Cargo received at origin port
- `loaded_on_vessel` - Loaded onto vessel
- `vessel_departed` - Vessel departed from origin port

### Main Carriage  
- `in_transit_ocean` - In transit via ocean
- `transshipment` - At transshipment port
- `vessel_arrived` - Vessel arrived at destination port

### On-Carriage
- `discharged_from_vessel` - Discharged from vessel
- `customs_clearance_ocean` - Customs clearance in progress
- `ready_for_pickup` - Ready for pickup at destination

### Container Statuses
- `container_loaded` - Container loaded
- `container_sealed` - Container sealed
- `container_gated_out` - Container gated out
- `container_gated_in` - Container gated in
- `container_stripped` - Container stripped/unloaded

## Port Operations
- `port_congestion` - Delayed due to port congestion
- `waiting_berth` - Waiting for berth availability
- `under_discharge` - Currently being discharged