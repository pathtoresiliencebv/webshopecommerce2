# SHEIN Product Importer Chrome Extension

A Chrome extension that allows Aurelio Living store administrators to easily import products from SHEIN directly into their store.

## Features

- **One-Click Product Import**: Import individual products from SHEIN product pages
- **Bulk Import**: Import multiple products from SHEIN category/search pages  
- **Admin Authentication**: Secure login with organization-specific access
- **Customizable Import Settings**: Configure price adjustments, auto-approval, and more
- **Visual Product Selection**: Highlight and select specific products to import
- **Real-time Progress Tracking**: Monitor import status with live updates
- **Category Mapping**: Automatically map SHEIN categories to store categories
- **Price Adjustment**: Apply percentage or fixed markup to imported products

## Installation

### For Developers

1. Clone or download the extension files to a local directory
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The extension icon should appear in your Chrome toolbar

### For End Users

The extension will be published to the Chrome Web Store. Once available:

1. Visit the Chrome Web Store page for "SHEIN Product Importer"
2. Click "Add to Chrome"
3. Confirm the installation when prompted

## Setup

1. **Admin Login**: Click the extension icon and log in with your Aurelio Living admin credentials
2. **Configure Settings**: Right-click the extension icon and select "Options" to configure import preferences
3. **Visit SHEIN**: Navigate to any SHEIN product or category page
4. **Start Importing**: Use the floating action button or extension popup to import products

## Usage

### Importing Single Products

1. Navigate to a SHEIN product page
2. Click the floating "Import" button or extension icon
3. Review the extracted product information
4. Click "Import Selected" to add to your store

### Bulk Import

1. Navigate to a SHEIN category or search results page
2. Click "Scan Page" in the extension popup
3. Select which products to import using checkboxes
4. Configure import settings (price adjustments, auto-approval, etc.)
5. Click "Import Selected" to process all chosen products

### Context Menu

Right-click on any SHEIN page to access quick actions:
- "Import this product to Aurelio Living"
- "Import all products on this page"
- "Open Aurelio Living Admin"

## Configuration

### API Settings
- **API Endpoint**: Configure custom API endpoint (defaults to Lovable Cloud)
- **Organization ID**: Pre-fill organization for faster login

### Import Settings
- **Auto-approve**: Automatically publish imported products
- **Maximum products**: Limit bulk import quantity
- **Minimum rating**: Only import highly-rated products
- **Include sold out**: Import out-of-stock products

### Price Adjustments
- **Percentage markup**: Add percentage-based markup (e.g., 20% markup)
- **Fixed markup**: Add fixed amount to all prices
- **Currency handling**: Automatic currency detection and conversion

### Category Mapping
- **Default category**: Fallback category for unmapped products
- **Custom mappings**: Map SHEIN categories to your store categories

## Security

- **Secure Authentication**: Uses JWT tokens with expiration
- **Organization-based Access**: Users can only import to organizations they belong to
- **Permission Validation**: Requires admin/manager role for imports
- **Rate Limiting**: Prevents API abuse with built-in delays
- **Audit Logging**: All imports are logged for security and compliance

## API Endpoints

The extension communicates with these backend endpoints:

### Authentication
- `POST /chrome-extension-auth` - Authenticate admin user
- `GET /chrome-extension-auth` - Validate existing token

### Import
- `POST /shein-import` - Import products from SHEIN

## Troubleshooting

### Common Issues

**"No products found"**
- Ensure you're on a SHEIN product or category page
- Try refreshing the page and scanning again
- Check if the page has finished loading completely

**"Authentication failed"**
- Verify your admin credentials are correct
- Ensure you have admin/manager permissions
- Check if your organization ID is correct

**"Import failed"**
- Check your internet connection
- Verify the API endpoint is accessible
- Try importing fewer products at once

### Debug Mode

Enable debug logging in the extension options to get detailed error information:

1. Right-click extension icon → Options
2. Enable "Debug logging" under Advanced Settings
3. Check Chrome DevTools Console for detailed logs

### Support

For technical support:
1. Check the browser console for error messages
2. Export your settings for debugging
3. Contact the development team with error details

## Development

### File Structure

```
chrome-extension/
├── manifest.json          # Extension manifest
├── popup.html             # Main popup interface
├── popup.css              # Popup styles
├── popup.js               # Popup functionality
├── content.js             # Content script for SHEIN pages
├── content.css            # Content script styles
├── background.js          # Background service worker
├── options.html           # Settings page
├── options.css            # Settings page styles
├── options.js             # Settings functionality
├── injected.js            # Injected script for deep data extraction
├── icons/                 # Extension icons
└── README.md              # This file
```

### Key Components

- **Popup**: Main interface for product scanning and import
- **Content Script**: Extracts product data from SHEIN pages
- **Background Script**: Handles context menus and background tasks
- **Options Page**: Configuration interface for settings

### Building

The extension is built using vanilla JavaScript and doesn't require a build process. Simply load the unpacked extension in Chrome for development.

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with different SHEIN pages
5. Submit a pull request

## Permissions

The extension requires these permissions:

- `activeTab`: Access current tab for product extraction
- `storage`: Store user settings and authentication tokens
- `identity`: For user authentication
- `scripting`: Inject scripts into SHEIN pages
- `contextMenus`: Add right-click context menu options
- `notifications`: Show import status notifications

## Privacy

- **No Data Collection**: The extension doesn't collect or store personal data
- **Local Storage**: Settings and tokens are stored locally in Chrome
- **Secure Communication**: All API calls use HTTPS encryption
- **Minimal Permissions**: Only requests necessary permissions

## Version History

### v1.0.0
- Initial release
- Basic product import functionality
- Admin authentication
- Price adjustment features
- Bulk import support

## License

This extension is proprietary software for Aurelio Living. Unauthorized distribution or modification is prohibited.

## Credits

Developed for Aurelio Living by the development team.
Built with Chrome Extension Manifest V3 and modern web technologies.