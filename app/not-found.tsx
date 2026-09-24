import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-center">
      <div className="card narrow center">
        <p className="eyebrow">404</p>
        <h1 className="h-xl">Không tìm thấy trang</h1>
        <p className="muted">Đường dẫn không tồn tại hoặc đã được thay đổi.</p>
        <Link className="btn btn-primary" href="/">
          Về bản đồ dữ liệu
        </Link>
      </div>
    </div>
  );
}
