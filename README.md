# Classroom Seating Generator

An offline-first tool for teachers to create randomized classroom seating arrangements with flexible layouts and student management capabilities.

## Features

### Core Functionality
- **Multiple Layouts**: Choose between 2-2-2, 2-3-2, and 3-3 seating arrangements
- **Random Generation**: Create randomized seating plans with one click
- **Fixed Seats**: Assign specific students to fixed positions
- **Drag & Drop**: Easily swap student positions through drag and drop
- **Configuration Storage**: Save and load multiple seating arrangements
- **Print Support**: Clean, print-friendly layouts

### User Experience
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on all screen sizes
- **Offline Capability**: No internet required after initial load
- **Privacy Focused**: All data stored locally in browser
- **Accessibility**: ARIA-compliant for screen readers
- **Multi-language**: Currently supports Dutch (English coming soon)

## Getting Started

1. Download the repository
2. Open `index.html` in any modern browser
3. Enter student names (one per line) in the text area
4. Optionally assign fixed seats
5. Click "Generate" to create seating plan

## Usage Guide

### Managing Student Lists
- Enter names in the textarea (one per line)
- Save lists with custom names for later use
- Load or delete saved lists from dropdown menu

### Fixed Seating
1. Click "Add Fixed Seat"
2. Enter student name
3. Specify seat number
4. Repeat as needed

### Generating Layouts
1. Select desired layout tab (2-2-2, 2-3-2, or 3-3)
2. Click "Generate" for random arrangement
3. Use drag & drop to adjust if needed
4. Print or save configuration

## Technical Details

### Browser Support
- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

### Storage
- Uses localStorage for data persistence
- Maximum storage varies by browser
- Typical limit: ~5MB (sufficient for hundreds of configurations)

### Privacy
- No data leaves your device
- No cookies used
- No analytics or tracking
- No external dependencies

## Contributing

Contributions welcome! Please read our contributing guidelines before submitting pull requests.

## License

GNU GPLv3 - See LICENSE file for details.

## Support

Create an issue on GitHub for:
- Bug reports
- Feature requests
- Implementation questions

## Roadmap

- [ ] English language support
- [ ] Additional layout options
- [ ] Import/export functionality
- [ ] Classroom statistics
- [ ] Student group management
- [ ] Custom layout creator

## Acknowledgments

Built using vanilla JavaScript and modern web standards. Special thanks to the teaching community for input and testing.

## Version History

### 1.0.0
- Initial release
- Core functionality complete
- Dutch language support
- Three layout options

---

Made with ❤️ for teachers
