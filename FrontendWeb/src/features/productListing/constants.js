export const DEFAULT_PRODUCT_FILTERS = {
  brands: [],
  cpu: "",
  ram: "",
  minPrice: null,
  maxPrice: null,
  priceRanges: [],
  keyword: "",
  sort: "newest",
};

export const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "price-asc", label: "Giá thấp - cao" },
  { value: "price-desc", label: "Giá cao - thấp" },
];

export const CPU_OPTIONS = ["Core i5", "Core i7", "Ryzen 5", "Apple M2"];
export const RAM_OPTIONS = ["8GB", "16GB", "32GB"];

export const PRICE_RANGE_OPTIONS = [
  { id: "under15", label: "Dưới 15 triệu" },
  { id: "15-20", label: "15 - 20 triệu" },
  { id: "20-25", label: "20 - 25 triệu" },
  { id: "25-30", label: "25 - 30 triệu" },
  { id: "30-35", label: "30 - 35 triệu" },
  { id: "over40", label: "Trên 40 triệu" },
];
