# CineBook UI/UX Design - Thiết Kế Giao Diện Người Dùng

## Tổng Quan UI/UX Design

Thiết kế UI/UX của CineBook lấy cảm hứng từ các cinema booking website hàng đầu như Galaxy Cinema, với focus vào trải nghiệm người dùng mượt mà, hiện đại và phù hợp với thị trường Việt Nam.

## Nguyên Tắc Thiết Kế

### 1. Design Principles
- **User-Centric**: Đặt người dùng làm trung tâm trong mọi quyết định thiết kế
- **Simplicity**: Giao diện đơn giản, dễ hiểu và dễ sử dụng
- **Consistency**: Nhất quán trong toàn bộ hệ thống
- **Accessibility**: Đảm bảo accessibility cho tất cả người dùng
- **Mobile-First**: Thiết kế tối ưu cho mobile trước

### 2. Visual Hierarchy
- Sử dụng typography, màu sắc và spacing để tạo hierarchy rõ ràng
- CTA buttons nổi bật và dễ nhận diện
- Thông tin quan trọng được highlight appropriately

## Color Palette

### Primary Colors
```css
:root {
  --primary-red: #E50914;        /* Netflix-inspired red for CTA */
  --primary-dark: #141414;       /* Dark background */
  --primary-gold: #FFD700;       /* Premium accent */
  
  --secondary-gray: #2F2F2F;     /* Secondary backgrounds */
  --text-white: #FFFFFF;         /* Primary text on dark */
  --text-gray: #CCCCCC;          /* Secondary text */
  --text-muted: #8C8C8C;         /* Muted text */
  
  --success-green: #46D369;      /* Success states */
  --warning-orange: #FF9500;     /* Warning states */
  --error-red: #FF3B30;          /* Error states */
}
```

### Usage Guidelines
- **Primary Red**: CTA buttons, active states, important highlights
- **Dark Backgrounds**: Main backgrounds để tạo cinema atmosphere
- **Gold Accents**: Premium features, ratings, special offers
- **Gray Variations**: Cards, modals, secondary elements

## Typography

### Font Family
```css
font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Typography Scale
```css
/* Headings */
.heading-xl { font-size: 48px; font-weight: 700; line-height: 1.2; }
.heading-lg { font-size: 36px; font-weight: 600; line-height: 1.3; }
.heading-md { font-size: 24px; font-weight: 600; line-height: 1.4; }
.heading-sm { font-size: 20px; font-weight: 500; line-height: 1.4; }

/* Body Text */
.body-lg { font-size: 18px; font-weight: 400; line-height: 1.6; }
.body-md { font-size: 16px; font-weight: 400; line-height: 1.6; }
.body-sm { font-size: 14px; font-weight: 400; line-height: 1.5; }
.body-xs { font-size: 12px; font-weight: 400; line-height: 1.4; }

/* Special */
.caption { font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
```

## Layout System

### Grid System
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Responsive breakpoints */
@media (max-width: 768px) {
  .container { padding: 0 16px; }
}

.grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
```

### Spacing System
```css
/* Spacing scale (8px base) */
.spacing-xs { margin/padding: 8px; }
.spacing-sm { margin/padding: 16px; }
.spacing-md { margin/padding: 24px; }
.spacing-lg { margin/padding: 32px; }
.spacing-xl { margin/padding: 48px; }
.spacing-xxl { margin/padding: 64px; }
```

## Component Design

### 1. Navigation Header

#### Desktop Header
```
┌─────────────────────────────────────────────────────────────────────┐
│ [LOGO] [Phim] [Rạp] [Khuyến Mãi]     [Search] [Login] [Language] │
└─────────────────────────────────────────────────────────────────────┘
```

#### Mobile Header
```
┌─────────────────────────────────────┐
│ [☰] [LOGO]           [🔍] [👤]    │
└─────────────────────────────────────┘
```

**Design Specs:**
- Height: 80px (desktop), 60px (mobile)
- Background: Dark with slight transparency on scroll
- Logo: 120px width
- Sticky positioning

### 2. Hero Section

```
┌─────────────────────────────────────────────────────────────────────┐
│                   FEATURED MOVIE BANNER                             │
│                                                                     │
│  ┌──────────────┐   MOVIE TITLE                                   │
│  │              │   Genre | Duration | Rating                      │
│  │   POSTER     │                                                  │
│  │   IMAGE      │   Brief synopsis text...                        │
│  │              │                                                  │
│  └──────────────┘   [▶ Trailer] [🎫 Đặt Vé Ngay]               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Design Specs:**
- Height: 60vh (desktop), 40vh (mobile)
- Background: Movie poster với overlay gradient
- CTA button: Primary red, prominent positioning

### 3. Movie Cards

#### Grid Layout
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│              │ │              │ │              │
│    POSTER    │ │    POSTER    │ │    POSTER    │
│    IMAGE     │ │    IMAGE     │ │    IMAGE     │
│              │ │              │ │              │
├──────────────┤ ├──────────────┤ ├──────────────┤
│ Movie Title  │ │ Movie Title  │ │ Movie Title  │
│ ⭐ 4.5 | 120min │ │ ⭐ 4.2 | 95min  │ │ ⭐ 4.8 | 150min │
│ Action, Drama│ │ Comedy       │ │ Sci-Fi       │
│              │ │              │ │              │
│   [Đặt Vé]   │ │   [Đặt Vé]   │ │   [Đặt Vé]   │
└──────────────┘ └──────────────┘ └──────────────┘
```

**Design Specs:**
- Aspect ratio: 2:3 cho poster
- Card padding: 16px
- Hover effect: Scale 1.05, shadow elevation
- Rating: Gold stars với số rating

### 4. Seat Map Interface

```
                     SCREEN
        ┌─────────────────────────────────┐
        │                                 │
        └─────────────────────────────────┘

BOX     [🟫] [🟫]     [🟫] [🟫]      VIP
        [🟫] [🟫]     [🟫] [🟫]

PLATINUM
  [🟦] [🟦] [🟦] [🟦] [🟦] [🟦] [🟦] [🟦]
  [🟦] [🟦] [🟦] [🟦] [🟦] [🟦] [🟦] [🟦]

GOLD
  [🟨] [🟨] [🟨] [🟨] [🟨] [🟨] [🟨] [🟨]
  [🟨] [🟨] [🟨] [🟨] [🟨] [🟨] [🟨] [🟨]
  [🟨] [🟨] [🟨] [🟨] [🟨] [🟨] [🟨] [🟨]

Legend: [🟩] Available [🟥] Occupied [🟪] Selected
```

**Design Specs:**
- Seat colors: Gold (#FFD700), Platinum (#E5E4E2), Box (#8B4513)
- Interactive hover states
- Clear legend với pricing
- Mobile: Scrollable horizontal + pinch zoom

### 5. Booking Progress Indicator

```
┌──────────────────────────────────────────────────────────────┐
│ ① Chọn Phim → ② Chọn Suất → ③ Chọn Ghế → ④ Thanh Toán      │
│ ● ────────── ● ────────── ◯ ────────── ◯                   │
└──────────────────────────────────────────────────────────────┘
```

**States:**
- Completed: Green circle với checkmark
- Current: Primary red circle
- Upcoming: Gray circle outline

## Page-Specific Designs

### 1. Homepage

#### Structure
```
┌─────────────────────────────────────────────────┐
│                 HEADER                          │
├─────────────────────────────────────────────────┤
│                HERO SECTION                     │
│              Featured Movie                     │
├─────────────────────────────────────────────────┤
│               QUICK BOOKING                     │
│    [City] [Movie] [Date] [Theater] [Search]     │
├─────────────────────────────────────────────────┤
│              NOW SHOWING                        │
│          Movie Grid (2x4 desktop)              │
├─────────────────────────────────────────────────┤
│              COMING SOON                        │
│            Horizontal Scroll                    │
├─────────────────────────────────────────────────┤
│               PROMOTIONS                        │
│          Banner Carousel                        │
├─────────────────────────────────────────────────┤
│                FOOTER                           │
└─────────────────────────────────────────────────┘
```

### 2. Movie Listing Page

#### Desktop Layout
```
┌─────────────────┬───────────────────────────────────┐
│                 │                                   │
│    FILTERS      │          MOVIE GRID               │
│                 │                                   │
│   • Genre       │  [Movie] [Movie] [Movie] [Movie]  │
│   • Language    │  [Movie] [Movie] [Movie] [Movie]  │
│   • Rating      │  [Movie] [Movie] [Movie] [Movie]  │
│   • City        │                                   │
│   • Date        │          [Load More]             │
│                 │                                   │
└─────────────────┴───────────────────────────────────┘
```

#### Mobile Layout
```
┌─────────────────────────────────────┐
│           [🔍] [Filter]             │
├─────────────────────────────────────┤
│  [Movie]              [Movie]       │
│  [Movie]              [Movie]       │
│  [Movie]              [Movie]       │
│                                     │
│            [Load More]              │
└─────────────────────────────────────┘
```

### 3. Movie Detail Page

```
┌─────────────────────────────────────────────────────────┐
│  ┌─────────┐  MOVIE TITLE               [▶ Trailer]    │
│  │ POSTER  │  Genre | Duration | Rating                │
│  │ IMAGE   │                                           │
│  │         │  Synopsis text here...                   │
│  └─────────┘                                           │
├─────────────────────────────────────────────────────────┤
│                 CAST & CREW                            │
│  [Actor] [Actor] [Actor] [Director]                    │
├─────────────────────────────────────────────────────────┤
│                 SHOWTIMES                              │
│  Theater 1: [10:00] [13:00] [16:00] [19:00]           │
│  Theater 2: [11:00] [14:00] [17:00] [20:00]           │
├─────────────────────────────────────────────────────────┤
│                REVIEWS (4.5 ⭐)                       │
│  [Review 1] [Review 2] [Review 3] [All Reviews]       │
└─────────────────────────────────────────────────────────┘
```

### 4. Admin Dashboard

#### Layout Structure
```
┌──────┬─────────────────────────────────────────────────┐
│      │                 HEADER                          │
│ SIDE ├─────────────────────────────────────────────────┤
│ BAR  │                METRICS CARDS                    │
│      │  [Revenue] [Bookings] [Movies] [Users]          │
│      ├─────────────────────────────────────────────────┤
│      │              CHARTS SECTION                     │
│      │  ┌───────────────┐  ┌────────────────────┐      │
│      │  │ Revenue Chart │  │ Popular Movies     │      │
│      │  └───────────────┘  └────────────────────┘      │
│      ├─────────────────────────────────────────────────┤
│      │             RECENT ACTIVITY                     │
│      │        Recent Bookings Table                    │
└──────┴─────────────────────────────────────────────────┘
```

## Interactive Elements

### 1. Buttons

#### Primary Button
```css
.btn-primary {
  background: linear-gradient(135deg, #E50914, #B81319);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(229, 9, 20, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(229, 9, 20, 0.4);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: transparent;
  color: #CCCCCC;
  border: 2px solid #2F2F2F;
  padding: 12px 24px;
  border-radius: 8px;
}

.btn-secondary:hover {
  border-color: #E50914;
  color: #E50914;
}
```

### 2. Form Inputs

```css
.form-input {
  background: #2F2F2F;
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 12px 16px;
  color: white;
  font-size: 16px;
}

.form-input:focus {
  border-color: #E50914;
  outline: none;
  box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.1);
}
```

### 3. Modal Design

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
}

.modal-content {
  background: #1F1F1F;
  border-radius: 12px;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}
```

## Responsive Design

### Breakpoints
```css
/* Mobile First Approach */
.mobile-up    { min-width: 0px; }      /* 0px+ */
.tablet-up    { min-width: 768px; }    /* 768px+ */
.desktop-up   { min-width: 1024px; }   /* 1024px+ */
.large-up     { min-width: 1200px; }   /* 1200px+ */
```

### Mobile Optimizations
- **Navigation**: Hamburger menu với slide-out sidebar
- **Cards**: Stack vertically với full width
- **Booking Flow**: Step-by-step với clear progress
- **Touch Targets**: Minimum 44px height cho tap targets
- **Typography**: Larger font sizes cho readability

## Animation & Transitions

### 1. Page Transitions
```css
.page-enter {
  opacity: 0;
  transform: translateY(20px);
}

.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: all 0.3s ease;
}
```

### 2. Loading States
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.skeleton {
  background: linear-gradient(90deg, #2F2F2F 25%, #3F3F3F 50%, #2F2F2F 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 3. Microinteractions
- **Hover Effects**: Subtle scale và shadow changes
- **Button Press**: Scale down 0.98 on active
- **Form Focus**: Smooth border color transitions
- **Toast Notifications**: Slide in from top-right

## Accessibility (A11y)

### 1. Color Contrast
- Text on dark background: Minimum 4.5:1 ratio
- CTA buttons: High contrast với background
- Focus states: Visible focus indicators

### 2. Keyboard Navigation
- Tab order logical và intuitive
- Skip links for main content
- Arrow key navigation cho seat selection

### 3. Screen Reader Support
```html
<!-- Example -->
<button aria-label="Đặt vé cho phim Avengers">
  Đặt Vé
</button>

<div role="tabpanel" aria-labelledby="showtimes-tab">
  <!-- Showtimes content -->
</div>
```

### 4. ARIA Labels
- Form inputs có proper labels
- Dynamic content updates announced
- Status messages cho booking process

## Performance Considerations

### 1. Image Optimization
- WebP format với fallback
- Responsive images với srcset
- Lazy loading cho images below fold
- Placeholder blur effect while loading

### 2. Critical Path
- Above-fold content loads first
- Critical CSS inlined
- Non-critical resources deferred

### 3. Loading States
- Skeleton screens cho content loading
- Progressive loading cho image galleries
- Optimistic updates cho user actions