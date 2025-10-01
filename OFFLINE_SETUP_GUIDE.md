# 🌐 Offline Setup Guide for POS Application

## 📁 Folder Structure Created:
```
src/assets/
├── fonts/
│   ├── roboto.css
│   ├── playfair-display.css
│   ├── inter.css
│   ├── nunito.css
│   ├── merriweather.css
│   ├── lora.css
│   ├── source-sans-pro.css
│   ├── crimson-text.css
│   ├── libre-baskerville.css
│   └── lato.css
├── icons/
│   ├── fontawesome/
│   ├── bootstrap/
│   └── material/
```

## 🔤 Step 1: Download Google Fonts

### Download Links (Click to download ZIP files):
1. **Roboto**: https://fonts.google.com/download?family=Roboto
2. **Playfair Display**: https://fonts.google.com/download?family=Playfair%20Display
3. **Inter**: https://fonts.google.com/download?family=Inter
4. **Nunito**: https://fonts.google.com/download?family=Nunito
5. **Merriweather**: https://fonts.google.com/download?family=Merriweather
6. **Lora**: https://fonts.google.com/download?family=Lora
7. **Source Sans Pro**: https://fonts.google.com/download?family=Source%20Sans%20Pro
8. **Crimson Text**: https://fonts.google.com/download?family=Crimson%20Text
9. **Libre Baskerville**: https://fonts.google.com/download?family=Libre%20Baskerville
10. **Lato**: https://fonts.google.com/download?family=Lato

### Instructions:
1. Download each font ZIP file
2. Extract the ZIP files
3. Copy the `.woff2` and `.woff` files to `src/assets/fonts/`
4. Rename files to match the CSS file references

## 🎨 Step 2: Download Font Awesome Icons

### Download Link:
- **Font Awesome 6.4.0**: https://use.fontawesome.com/releases/v6.4.0/fontawesome-free-6.4.0-web.zip

### Instructions:
1. Download the ZIP file
2. Extract it
3. Copy `css/all.min.css` to `src/assets/icons/fontawesome/`
4. Copy the `webfonts/` folder to `src/assets/icons/fontawesome/`

## 🅱️ Step 3: Download Bootstrap Icons

### Download Link:
- **Bootstrap Icons 1.10.5**: https://github.com/twbs/icons/releases/download/v1.10.5/bootstrap-icons-1.10.5.zip

### Instructions:
1. Download the ZIP file
2. Extract it
3. Copy `bootstrap-icons.css` to `src/assets/icons/bootstrap/`
4. Copy the `fonts/` folder to `src/assets/icons/bootstrap/`

## 🎯 Step 4: Download Material Icons

### Download Link:
- **Material Icons**: https://fonts.google.com/download?family=Material%20Icons

### Instructions:
1. Download the ZIP file
2. Extract it
3. Copy the font files to `src/assets/icons/material/`

## 🔧 Step 5: Update index.html

After downloading all resources, update your `src/index.html` file to use local resources instead of CDN links.

## ✅ Benefits of This Approach:

1. **Complete Offline Functionality**: No internet required
2. **Faster Loading**: Local files load faster than CDN
3. **Reliability**: No dependency on external services
4. **Privacy**: No external requests
5. **Consistency**: Same fonts/icons across all environments

## 🚀 Next Steps:

1. Download all the resources listed above
2. Place them in the correct folders
3. Update index.html to reference local files
4. Test the application offline
5. Build and deploy with offline support

## 📝 Notes:

- Font files are typically 50-200KB each
- Total size increase: ~2-5MB
- All CSS files are already created with proper @font-face declarations
- Icons will work exactly the same as before



