# Auto-Sliding Product Image Carousel Implementation

## Overview
Implemented an auto-sliding image carousel for product cards on the `/products` page. The carousel automatically cycles through all available product images (up to 5) every 2 seconds with smooth fade transitions.

## Changes Made

### 1. ProductCard Component (`frontend/src/app/components/ProductCard.tsx`)

#### Added Imports
- Added `useEffect` hook import for managing the auto-slide timer

#### New State Management
```tsx
const [currentImageIndex, setCurrentImageIndex] = useState(0);
```

#### Image Extraction Logic
```tsx
const allImages = product.gallery_images && product.gallery_images.length > 0 
    ? product.gallery_images 
    : product.images && product.images.length > 0 
        ? product.images 
        : product.featured_image 
            ? [product.featured_image] 
            : [];
```

#### Auto-Slide Implementation
```tsx
useEffect(() => {
    if (allImages.length <= 1) return; // Don't slide if only one image

    const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => 
            prevIndex === allImages.length - 1 ? 0 : prevIndex + 1
        );
    }, 2000); // 2 seconds

    return () => clearInterval(interval); // Cleanup on unmount
}, [allImages.length]);
```

#### Updated Image Rendering
- Changed from displaying only the first image to displaying the current image based on `currentImageIndex`
- Added carousel indicators (dots) to show which image is currently displayed

#### Carousel Indicators
```tsx
{allImages.length > 1 && (
    <div className="carousel-indicators">
        {allImages.map((_, index) => (
            <div
                key={index}
                className={`carousel-dot ${index === currentImageIndex ? 'active' : ''}`}
            />
        ))}
    </div>
)}
```

### 2. Global Styles (`frontend/src/app/globals.css`)

#### Image Fade Animation
```css
.product-card-image-container img {
  transition: transform 0.3s ease, opacity 0.5s ease;
  animation: fadeInImage 0.5s ease-in-out;
}

@keyframes fadeInImage {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

#### Carousel Indicators Styling
```css
.carousel-indicators {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  z-index: 8;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.carousel-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #d1d5db;
  transition: all 0.3s ease;
}

.carousel-dot.active {
  background: var(--primary);
  width: 20px;
  border-radius: 10px;
}
```

## Features

### ✅ Auto-Sliding
- Images automatically cycle every 2 seconds
- Smooth transition between images
- Loops back to the first image after the last one

### ✅ Visual Indicators
- Dots at the bottom of each product card show total number of images
- Active dot is highlighted in orange (primary color) and elongated
- Inactive dots are gray and circular

### ✅ Performance Optimized
- Only runs the interval timer if there are multiple images
- Properly cleans up the interval on component unmount to prevent memory leaks
- Uses CSS animations for smooth transitions

### ✅ Responsive Design
- Indicators are positioned at the bottom center
- Semi-transparent background with backdrop blur for visibility
- Works seamlessly with existing hover effects

## User Experience

1. **Visual Feedback**: Users can see all product images without any interaction
2. **Progress Indication**: Dots show which image is currently displayed
3. **Smooth Transitions**: Fade-in animation creates a polished, professional look
4. **Non-Intrusive**: Carousel doesn't interfere with wishlist button or discount badge
5. **Automatic**: No user interaction required - images cycle automatically

## Technical Details

- **Interval**: 2000ms (2 seconds)
- **Max Images**: Up to 5 images per product (as per schema)
- **Fallback**: If only one image or no images, carousel doesn't activate
- **Image Priority**: gallery_images → images → featured_image
- **Animation Duration**: 0.5s fade-in effect

## Browser Compatibility

- Modern browsers with ES6+ support
- CSS animations and transitions
- Backdrop filter support (with fallback)

## Testing Recommendations

1. Test with products that have:
   - Multiple images (2-5)
   - Single image
   - No images
2. Verify smooth transitions
3. Check indicator visibility on different backgrounds
4. Ensure no memory leaks on page navigation
5. Test hover effects still work correctly

## Future Enhancements (Optional)

- Pause on hover
- Manual navigation (click dots to jump to specific image)
- Swipe gestures for mobile devices
- Configurable slide duration
- Different transition effects (slide, zoom, etc.)
