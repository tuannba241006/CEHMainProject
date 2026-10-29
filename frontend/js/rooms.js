import { apiFetch } from './api.js';

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    if (type === 'error') {
        toast.style.background = '#dc2626';
    } else if (type === 'success') {
        toast.style.background = '#16a34a';
    }
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// ==========================================
// 1. TRANG DANH SÁCH HỘI TRƯỜNG (rooms.html)
// ==========================================
const roomsTable = document.getElementById('roomsTable');
if (roomsTable) {
    let currentPage = 1;

    async function loadRooms(page = 1) {
        const loading = document.getElementById('loadingStatus');
        const tbody = document.getElementById('roomsTableBody');
        const coSo = document.getElementById('filterCoSo')?.value || '';
        const sucChua = document.getElementById('filterSucChua')?.value || '';
        const trangThai = document.getElementById('filterTrangThai')?.value || '';

        loading.style.display = 'block';
        roomsTable.style.display = 'none';

        try {
            const query = new URLSearchParams({
                page: page,
                ...(coSo ? { co_so: coSo } : {}),
                ...(sucChua ? { suc_chua_min: sucChua } : {}),
                ...(trangThai ? { trang_thai: trangThai } : {}),
            });

            const data = await apiFetch(`/api/rooms?${query.toString()}`);
            tbody.innerHTML = '';

            const rooms = Array.isArray(data) ? data : (data.data || []);
            if (rooms.length === 0) {
                loading.textContent = 'Không tìm thấy phòng hội trường nào phù hợp.';
                return;
            }

            rooms.forEach(room => {
                const tr = document.createElement('tr');
                const isBaoTri = room.trang_thai === 'BaoTri';
                const statusBadge = isBaoTri
                    ? `<span class="badge badge-danger">Bảo Trì</span>`
                    : `<span class="badge badge-success">Khả Dụng</span>`;

                const equipList = room.trang_thiet_bi ? Object.keys(room.trang_thiet_bi).join(', ') : '—';

                tr.innerHTML = `
                    <td><strong>#${room.ma_phong}</strong></td>
                    <td><strong>${escapeHtml(room.ten_phong)}</strong></td>
                    <td>${room.co_so === 'CoSo1' ? 'Cơ sở 1 (Thủ Đức)' : 'Cơ sở 2'}</td>
                    <td>${room.suc_chua_toi_da} chỗ</td>
                    <td><small style="color: var(--text-muted);">${escapeHtml(equipList)}</small></td>
                    <td>${statusBadge}</td>
                    <td>
                        <a href="/admin/room-form.html?id=${room.ma_phong}" class="btn btn-secondary btn-sm">Sửa</a>
                        <a href="/admin/room-schedule.html?roomId=${room.ma_phong}" class="btn btn-secondary btn-sm">Lịch</a>
                        <button class="btn btn-danger btn-sm btn-delete" data-id="${room.ma_phong}" data-name="${escapeHtml(room.ten_phong)}">Xóa</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            loading.style.display = 'none';
            roomsTable.style.display = 'table';

            // Pagination info
            const meta = data.meta || {};
            const pageInfo = document.getElementById('pageInfo');
            const prevBtn = document.getElementById('btnPrevPage');
            const nextBtn = document.getElementById('btnNextPage');

            currentPage = meta.current_page || page;
            if (pageInfo) {
                pageInfo.textContent = `Trang ${currentPage} / ${meta.last_page || 1} (Tổng cộng ${meta.total || rooms.length} phòng)`;
            }
            if (prevBtn) prevBtn.disabled = currentPage <= 1;
            if (nextBtn) nextBtn.disabled = currentPage >= (meta.last_page || 1);

        } catch (err) {
            loading.textContent = 'Lỗi khi tải dữ liệu: ' + (err.message || 'Không thể kết nối máy chủ.');
            loading.style.color = 'var(--danger)';
        }
    }

    document.getElementById('filterForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        loadRooms(1);
    });

    document.getElementById('btnResetFilter')?.addEventListener('click', () => {
        document.getElementById('filterCoSo').value = '';
        document.getElementById('filterSucChua').value = '';
        document.getElementById('filterTrangThai').value = '';
        loadRooms(1);
    });

    document.getElementById('btnPrevPage')?.addEventListener('click', () => {
        if (currentPage > 1) loadRooms(currentPage - 1);
    });

    document.getElementById('btnNextPage')?.addEventListener('click', () => {
        loadRooms(currentPage + 1);
    });

    // Xử lý Xóa phòng (Handle 409 ROOM_HAS_BOOKING_HISTORY)
    roomsTable.addEventListener('click', async (e) => {
        const btn = e.target.closest('.btn-delete');
        if (!btn) return;

        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        if (!confirm(`Bạn có chắc chắn muốn xóa phòng "${name}" (#${id}) không?`)) {
            return;
        }

        try {
            await apiFetch(`/api/rooms/${id}`, { method: 'DELETE' });
            showToast(`Đã xóa phòng "${name}" thành công!`, 'success');
            loadRooms(currentPage);
        } catch (err) {
            if (err.code === 'ROOM_HAS_BOOKING_HISTORY') {
                alert(`Không thể xóa phòng: Phòng này đã có lịch sử đặt phòng trong hệ thống (${err.details?.total_bookings || ''} lượt đặt). Vui lòng chuyển sang trạng thái "Bảo Trì" nếu không muốn sử dụng tiếp.`);
            } else {
                alert('Lỗi: ' + (err.message || 'Không thể xóa phòng.'));
            }
        }
    });

    loadRooms(1);
}

// ==========================================
// 2. TRANG FORM TẠO/SỬA PHÒNG (room-form.html)
// ==========================================
const roomForm = document.getElementById('roomForm');
if (roomForm) {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('id');
    const formTitle = document.getElementById('formTitle');
    const trangThaiSelect = document.getElementById('trang_thai');
    const maintenanceSection = document.getElementById('maintenanceSection');
    const conflictBox = document.getElementById('conflictBox');
    const affectedEventsBody = document.getElementById('affectedEventsBody');
    const btnSubmit = document.getElementById('btnSubmitForm');
    const alertBox = document.getElementById('alertBox');

    function toggleMaintenanceSection() {
        if (trangThaiSelect.value === 'BaoTri') {
            maintenanceSection.style.display = 'block';
            document.getElementById('bao_tri_tu_ngay').required = true;
            document.getElementById('bao_tri_den_ngay').required = true;
            document.getElementById('ly_do_bao_tri').required = true;
        } else {
            maintenanceSection.style.display = 'none';
            document.getElementById('bao_tri_tu_ngay').required = false;
            document.getElementById('bao_tri_den_ngay').required = false;
            document.getElementById('ly_do_bao_tri').required = false;
            conflictBox.style.display = 'none';
            btnSubmit.disabled = false;
        }
    }

    trangThaiSelect.addEventListener('change', toggleMaintenanceSection);

    // Nếu sửa phòng: nạp dữ liệu hiện tại
    if (roomId) {
        formTitle.textContent = `Chỉnh sửa Hội trường #${roomId}`;
        (async () => {
            try {
                const room = await apiFetch(`/api/rooms/${roomId}`);
                document.getElementById('ten_phong').value = room.ten_phong;
                document.getElementById('co_so').value = room.co_so;
                document.getElementById('suc_chua_toi_da').value = room.suc_chua_toi_da;
                document.getElementById('trang_thai').value = room.trang_thai;

                if (room.trang_thiet_bi) {
                    if (room.trang_thiet_bi.may_chieu) document.getElementById('tb_maychieu').checked = true;
                    if (room.trang_thiet_bi.am_thanh) document.getElementById('tb_amthanh').checked = true;
                    if (room.trang_thiet_bi.may_lanh) document.getElementById('tb_maylanh').checked = true;
                    if (room.trang_thiet_bi.livestream) document.getElementById('tb_livestream').checked = true;
                }

                if (room.trang_thai === 'BaoTri') {
                    if (room.bat_dau_bao_tri) document.getElementById('bao_tri_tu_ngay').value = room.bat_dau_bao_tri.replace(' ', 'T').slice(0, 16);
                    if (room.ket_thuc_bao_tri) document.getElementById('bao_tri_den_ngay').value = room.ket_thuc_bao_tri.replace(' ', 'T').slice(0, 16);
                    if (room.ly_do_bao_tri) document.getElementById('ly_do_bao_tri').value = room.ly_do_bao_tri;
                }

                toggleMaintenanceSection();
            } catch (err) {
                alert('Không thể tải thông tin phòng: ' + (err.message || 'Lỗi server'));
            }
        })();
    }

    roomForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        alertBox.style.display = 'none';
        conflictBox.style.display = 'none';

        const trangThietBi = {};
        if (document.getElementById('tb_maychieu').checked) trangThietBi.may_chieu = true;
        if (document.getElementById('tb_amthanh').checked) trangThietBi.am_thanh = true;
        if (document.getElementById('tb_maylanh').checked) trangThietBi.may_lanh = true;
        if (document.getElementById('tb_livestream').checked) trangThietBi.livestream = true;

        const payload = {
            ten_phong: document.getElementById('ten_phong').value.trim(),
            co_so: document.getElementById('co_so').value,
            suc_chua_toi_da: parseInt(document.getElementById('suc_chua_toi_da').value, 10),
            trang_thiet_bi: trangThietBi,
            trang_thai: trangThaiSelect.value,
        };

        if (trangThaiSelect.value === 'BaoTri') {
            payload.bao_tri_tu_ngay = document.getElementById('bao_tri_tu_ngay').value.replace('T', ' ') + ':00';
            payload.bao_tri_den_ngay = document.getElementById('bao_tri_den_ngay').value.replace('T', ' ') + ':00';
            payload.ly_do_bao_tri = document.getElementById('ly_do_bao_tri').value.trim();
        }

        try {
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Đang lưu...';

            if (roomId) {
                await apiFetch(`/api/rooms/${roomId}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
                showToast('Cập nhật phòng hội trường thành công!', 'success');
            } else {
                await apiFetch('/api/rooms', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                showToast('Tạo mới phòng hội trường thành công!', 'success');
            }

            setTimeout(() => {
                window.location.href = '/admin/rooms.html';
            }, 800);

        } catch (err) {
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Lưu thông tin';

            if (err.code === 'ROOM_MAINTENANCE_CONFLICT') {
                // Giữ modal/form mở, render bảng affected_events, disable nút submit
                conflictBox.style.display = 'block';
                affectedEventsBody.innerHTML = '';
                const events = err.details?.affected_events || [];
                events.forEach(ev => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><strong>#${ev.ma_su_kien}</strong></td>
                        <td>${escapeHtml(ev.ten_su_kien)}</td>
                        <td>${ev.thoi_gian_bat_dau}</td>
                        <td>${ev.thoi_gian_ket_thuc}</td>
                    `;
                    affectedEventsBody.appendChild(row);
                });
                btnSubmit.disabled = true; // Disable nút submit theo spec 9.1
            } else {
                alertBox.className = 'alert alert-danger';
                alertBox.textContent = err.message || 'Lỗi dữ liệu đầu vào. Vui lòng kiểm tra lại.';
                alertBox.style.display = 'block';
            }
        }
    });
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}
