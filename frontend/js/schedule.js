import { apiFetch } from './api.js';

/**
 * Hàm kiểm tra khả dụng phòng — Reusable component cho PKG-02 (Soạn thảo sự kiện & đề xuất).
 * TUYỆT ĐỐI không tính conflict ở FE. Luôn tin server.
 */
export async function checkAvailability(roomId, start, end, excludeEventId = null) {
    const payload = {
        thoi_gian_bat_dau: start,
        thoi_gian_ket_thuc: end,
        ...(excludeEventId ? { exclude_event_id: parseInt(excludeEventId, 10) } : {}),
    };

    return await apiFetch(`/api/rooms/${roomId}/availability`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

// ==============================================
// KHỞI TẠO VÀ XỬ LÝ GIAO DIỆN (room-schedule.html)
// ==============================================
const schedRoomSelect = document.getElementById('schedRoomSelect');
const chkRoomSelect = document.getElementById('chkRoomSelect');

// Nạp danh sách phòng vào 2 select
async function loadRoomOptions() {
    try {
        const data = await apiFetch('/api/rooms?per_page=100');
        const rooms = Array.isArray(data) ? data : (data.data || []);

        const urlParams = new URLSearchParams(window.location.search);
        const preselectedRoomId = urlParams.get('roomId');

        [schedRoomSelect, chkRoomSelect].forEach(sel => {
            if (!sel) return;
            sel.innerHTML = '<option value="">-- Chọn Hội trường --</option>';
            rooms.forEach(r => {
                const opt = document.createElement('option');
                opt.value = r.ma_phong;
                opt.textContent = `#${r.ma_phong} - ${r.ten_phong} (${r.co_so}, ${r.suc_chua_toi_da} chỗ)`;
                if (preselectedRoomId && String(r.ma_phong) === String(preselectedRoomId)) {
                    opt.selected = true;
                }
                sel.appendChild(opt);
            });
        });

        // Nếu có preselected roomId, tự động trigger search lịch tháng này
        if (preselectedRoomId && schedRoomSelect) {
            initDefaultDates();
            document.getElementById('scheduleSearchForm')?.dispatchEvent(new Event('submit'));
        }
    } catch (err) {
        console.error('Không thể nạp danh sách phòng:', err);
    }
}

function initDefaultDates() {
    const today = new Date();
    const tuNgayInput = document.getElementById('schedTuNgay');
    const denNgayInput = document.getElementById('schedDenNgay');

    if (tuNgayInput && !tuNgayInput.value) {
        tuNgayInput.value = today.toISOString().split('T')[0];
    }
    if (denNgayInput && !denNgayInput.value) {
        const nextMonth = new Date(today);
        nextMonth.setDate(today.getDate() + 20); // 20 ngày sau
        denNgayInput.value = nextMonth.toISOString().split('T')[0];
    }
}

// 1. Xử lý tra cứu Lịch phòng
const scheduleForm = document.getElementById('scheduleSearchForm');
if (scheduleForm) {
    scheduleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const alertBox = document.getElementById('scheduleAlert');
        const resultArea = document.getElementById('scheduleResultArea');
        const timeline = document.getElementById('scheduleTimeline');
        const roomTitle = document.getElementById('scheduleRoomTitle');

        alertBox.style.display = 'none';
        resultArea.style.display = 'none';
        timeline.innerHTML = '';

        const roomId = schedRoomSelect.value;
        const tuNgay = document.getElementById('schedTuNgay').value;
        const denNgay = document.getElementById('schedDenNgay').value;

        if (!roomId || !tuNgay || !denNgay) return;

        // Client-side validation: Chặn range > 31 ngày trước
        const diffDays = Math.ceil((new Date(denNgay) - new Date(tuNgay)) / (1000 * 60 * 60 * 24));
        if (diffDays > 31) {
            alertBox.className = 'alert alert-danger';
            alertBox.textContent = 'Khoảng thời gian tra cứu không được vượt quá 31 ngày (hiện tại: ' + diffDays + ' ngày).';
            alertBox.style.display = 'block';
            return;
        }

        try {
            const data = await apiFetch(`/api/rooms/${roomId}/schedule?tu_ngay=${tuNgay}&den_ngay=${denNgay}`);
            roomTitle.textContent = `Lịch phòng: ${data.room.ten_phong} (${data.room.co_so}) — [${data.range.tu_ngay} đến ${data.range.den_ngay}]`;

            const items = [];

            // Thêm các khung bảo trì (đỏ)
            (data.maintenance || []).forEach(m => {
                items.push({
                    type: 'baotri',
                    title: 'LỊCH BẢO TRÌ PHÒNG',
                    start: m.bat_dau_bao_tri,
                    end: m.ket_thuc_bao_tri,
                    extra: m.ly_do_bao_tri ? `Lý do: ${m.ly_do_bao_tri}` : '',
                });
            });

            // Thêm các booking (CONFIRMED xanh lá, PENDING vàng)
            (data.bookings || []).forEach(b => {
                items.push({
                    type: b.trang_thai === 'CONFIRMED' ? 'confirmed' : 'pending',
                    title: `Sự kiện: ${b.ten_su_kien || '#' + b.ma_su_kien}`,
                    start: b.thoi_gian_bat_dau,
                    end: b.thoi_gian_ket_thuc,
                    extra: `Trạng thái đặt: ${b.trang_thai}`,
                });
            });

            if (items.length === 0) {
                timeline.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">Không có lịch sự kiện hoặc bảo trì nào trong khoảng thời gian này. Phòng hoàn toàn trống.</p>';
            } else {
                // Sắp xếp theo thời gian bắt đầu
                items.sort((a, b) => new Date(a.start) - new Date(b.start));

                items.forEach(it => {
                    const el = document.createElement('div');
                    el.className = `timeline-item ${it.type}`;
                    el.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: baseline;">
                            <strong>${it.title}</strong>
                            <small style="color: var(--text-muted); font-weight: 600;">${it.start} → ${it.end}</small>
                        </div>
                        ${it.extra ? `<div style="font-size: 0.825rem; margin-top: 4px; color: var(--text-muted);">${it.extra}</div>` : ''}
                    `;
                    timeline.appendChild(el);
                });
            }

            resultArea.style.display = 'block';

        } catch (err) {
            alertBox.className = 'alert alert-danger';
            alertBox.textContent = err.message || 'Không thể lấy lịch phòng.';
            alertBox.style.display = 'block';
        }
    });
}

// 2. Xử lý RoomAvailabilityChecker
const checkerForm = document.getElementById('checkerForm');
if (checkerForm) {
    checkerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const resultBox = document.getElementById('checkerResult');
        resultBox.style.display = 'none';
        resultBox.innerHTML = '';

        const roomId = chkRoomSelect.value;
        const start = document.getElementById('chkStart').value.replace('T', ' ') + ':00';
        const end = document.getElementById('chkEnd').value.replace('T', ' ') + ':00';
        const excludeId = document.getElementById('chkExcludeEvent').value.trim() || null;

        try {
            const data = await checkAvailability(roomId, start, end, excludeId);

            if (data.available) {
                resultBox.className = 'alert alert-success';
                resultBox.innerHTML = `
                    <strong>Phòng KHẢ DỤNG!</strong> Khung giờ từ ${start} đến ${end} hoàn toàn trống và đảm bảo giãn cách đệm 15 phút.
                `;
            } else {
                resultBox.className = 'alert alert-danger';
                let html = `<strong>Phòng KHÔNG KHẢ DỤNG trong khung giờ này!</strong><br>`;

                if (data.maintenance_conflict) {
                    html += `
                        <div style="margin-top: 8px; padding: 8px; background: #fff; border-radius: 4px;">
                            <span class="badge badge-danger">Trùng lịch bảo trì</span>:
                            từ <strong>${data.maintenance_conflict.bat_dau_bao_tri}</strong> đến <strong>${data.maintenance_conflict.ket_thuc_bao_tri}</strong>
                            <br><small>Lý do: ${data.maintenance_conflict.ly_do_bao_tri || 'Bảo trì định kỳ'}</small>
                        </div>
                    `;
                }

                if (data.conflicts && data.conflicts.length > 0) {
                    html += `<div style="margin-top: 8px;"><strong>Danh sách xung đột (kèm đệm 15 phút):</strong><ul style="margin-left: 20px; margin-top: 4px;">`;
                    data.conflicts.forEach(c => {
                        html += `<li>Sự kiện "<strong>${c.ten_su_kien}</strong>" (#${c.ma_su_kien}): ${c.thoi_gian_bat_dau} → ${c.thoi_gian_ket_thuc} (${c.trang_thai}) [${c.conflict_type}]</li>`;
                    });
                    html += `</ul></div>`;
                }

                resultBox.innerHTML = html;
            }

            resultBox.style.display = 'block';

        } catch (err) {
            resultBox.className = 'alert alert-danger';
            resultBox.textContent = 'Lỗi kiểm tra khả dụng: ' + (err.message || 'Không thể kiểm tra.');
            resultBox.style.display = 'block';
        }
    });
}

// Khởi chạy khi tải trang
initDefaultDates();
loadRoomOptions();
