/**
 * Fetch wrapper chuẩn hóa API Envelope cho Campus Event Hub.
 */
export async function apiFetch(path, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers || {}),
    };

    const res = await fetch(path, {
        credentials: 'include',
        ...options,
        headers,
    });

    const body = await res.json().catch(() => ({
        success: false,
        error: { code: 'HTTP_ERROR' },
        message: 'Không thể giải mã phản hồi từ máy chủ.',
    }));

    if (!body.success) {
        const errorObj = {
            code: body.error?.code || (typeof body.error === 'string' ? body.error : 'ERROR'),
            message: body.message || 'Có lỗi xảy ra khi xử lý yêu cầu.',
            details: body.error?.details || body.details || body.errors || {},
        };
        throw errorObj;
    }

    return body.data;
}
