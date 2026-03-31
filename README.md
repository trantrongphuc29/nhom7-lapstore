# Nhom7 Laptop Web

Monorepo gồm 2 ứng dụng:

- `FrontendWeb`: giao diện React cho storefront và admin.
- `BackendWeb`: API Node.js/Express cho auth, sản phẩm, đơn hàng, báo cáo.

## Cấu trúc thư mục chính

### Frontend

- `FrontendWeb/src/components`: shared UI component dùng nhiều nơi.
- `FrontendWeb/src/features`: code theo feature/domain (admin, productListing, ...).
- `FrontendWeb/src/pages`: route-level pages.
- `FrontendWeb/src/context`: global context (auth, cart, toast).
- `FrontendWeb/src/services`: API client và service dùng chung.
- `FrontendWeb/src/config`: cấu hình frontend (API endpoint, env mapping).
- `FrontendWeb/src/utils`: helper dùng đa feature.

### Backend

- `BackendWeb/src/routes`: định nghĩa endpoint + middleware.
- `BackendWeb/src/controllers`: nhận request, gọi service, trả response.
- `BackendWeb/src/services`: business logic.
- `BackendWeb/src/validators`: validator cho params/query/body.
- `BackendWeb/src/middlewares`: auth, validate, upload, error handling.
- `BackendWeb/src/config`: DB/env/rbac config.
- `BackendWeb/src/utils`: helper kỹ thuật và domain utility.
- `BackendWeb/models`: model/data access lớp cũ (đang được chuẩn hóa dần).

## Convention kỹ thuật

### 1) Naming

- JavaScript/React dùng `camelCase` cho biến/hàm.
- Component React dùng `PascalCase`.
- Tên file component: `PascalCase.jsx`.
- Tên file utility/service/validator: `camelCase.js`.

### 2) API contract

- Dữ liệu DB/API có thể dùng `snake_case`.
- Trong frontend/state nội bộ ưu tiên `camelCase`.
- Mapping `snake_case <-> camelCase` thực hiện ở boundary (service/mapper), tránh rải trong UI.

### 3) React structure

- Component UI chỉ tập trung render + interaction.
- Logic domain nên tách sang:
  - `utils` (pure function),
  - `hooks` (state/effect orchestration),
  - `services` (I/O/API).
- File > 300 dòng cần tách nhỏ theo trách nhiệm.

### 4) Backend layering

- `route -> validator -> controller -> service`.
- Không đặt business logic vào route.
- Controller mỏng, chỉ orchestration request/response.
- Service giữ nghiệp vụ; validator chặn input sớm.

### 5) Validation & error handling

- Endpoint có input phải có validator tương ứng.
- Trả lỗi qua cơ chế `AppError` + middleware lỗi chung.
- Không throw string thô.

### 6) Upload/image

- Khi dùng `URL.createObjectURL` ở frontend, luôn `revokeObjectURL` khi remove/unmount.
- Upload backend phải sanitize dữ liệu đầu vào (tên file, tên thư mục, mime type).

## Lộ trình chuẩn hóa tiếp theo (khuyến nghị)

1. Tách tiếp module admin backend thành route/controller/service theo domain con (`products`, `orders`, `customers`, `reports`).
2. Hợp nhất một nguồn model layer để tránh trùng (`BackendWeb/models` vs `BackendWeb/src/models`).
3. Bổ sung path alias cho frontend để giảm import tương đối quá sâu.
4. Chuẩn hóa test strategy (unit cho utils/service, integration cho API chính).

