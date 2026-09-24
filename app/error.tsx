"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="page-center">
      <div className="card narrow center">
        <h1 className="h-xl">Đã có lỗi xảy ra</h1>
        <p className="muted">{error.message || "Lỗi không xác định."}</p>
        <button className="btn btn-primary" onClick={reset}>
          Thử lại
        </button>
      </div>
    </div>
  );
}
