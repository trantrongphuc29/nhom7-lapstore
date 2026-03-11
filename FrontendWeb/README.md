# ThinkPro Laptop Store - React App

Dự án website bán laptop ReactJS.

## Cấu trúc dự án

```
FrontendWeb/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── Banner.jsx
│   │   ├── Sidebar.jsx
│   │   ├── ProductCard.jsx
│   │   ├── ProductGrid.jsx
│   │   └── Footer.jsx
│   ├── App.jsx
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Chạy ứng dụng:
```bash
npm start
```

3. Build production:
```bash
npm run build
```

## Các component chính

- **Header**: Thanh điều hướng với logo, search bar, menu
- **Banner**: Banner khuyến mãi
- **Sidebar**: Bộ lọc sản phẩm (thương hiệu, CPU, RAM, giá)
- **ProductCard**: Card hiển thị thông tin sản phẩm
- **ProductGrid**: Lưới hiển thị danh sách sản phẩm
- **Footer**: Footer với thông tin liên hệ

## Công nghệ sử dụng

- React 18
- Tailwind CSS
- Material Symbols Icons
