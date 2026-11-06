import { createContext, useContext, useEffect, useState } from "react"
import type {
  User as ContractUser,
  UserRole,
  OrganizationSummary,
} from "../data/contract"
import { ORGANIZATIONS } from "../data/mock"
import { isApiMode, tokenStore } from "../api/config"
import { authService } from "../api/services/auth.service"

export type AppRole = "student" | "organizer" | "faculty_manager" | "student_affairs" | "admin"

export interface UserData
  extends ContractUser {
  // Convenience aliases for existing components
  name: string
  displayName: string
  initials: string
  avatar: string | null
  studentId: string
  faculty: string
  phone: string
  role: string
}

function buildDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 3) return parts.slice(-2).join(" ")
  if (parts.length === 2) return parts[1]
  return parts[0]
}

function buildInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (
      parts[parts.length - 2][0] + parts[parts.length - 1][0]
    ).toUpperCase()
  }
  return parts[0][0].toUpperCase()
}

const DEFAULT_USER: UserData = {
  ma_tai_khoan: 1,
  ho_ten: "Cao Duy Anh",
  mssv: "22521001",
  email: "22521001@gm.uit.edu.vn",
  loai_tai_khoan: "SinhVien",
  so_dien_thoai: "0901 234 567",
  lop_sinh_hoat: "HTTT2022",
  ma_khoa: 1,
  khoa: "Khoa Hệ thống Thông tin",
  ma_don_vi_to_chuc: null,
  don_vi: null,
  avatar_url: null,
  dong_y_nghi_dinh_13: true,
  buoc_doi_mat_khau: false,
  la_nhan_vien_soat_ve: false,
  hoat_dong: true,
  thoi_gian_tao: "2026-09-01T08:00:00+07:00",

  // Legacy mappings
  name: "Cao Duy Anh",
  displayName: "Duy Anh",
  initials: "DA",
  avatar: null,
  studentId: "22521001",
  faculty: "Khoa Hệ thống Thông tin",
  phone: "0901 234 567",
  role: "Sinh viên",
}

interface UserContextType {
  user: UserData
  role: AppRole | null
  authenticated: boolean
  loading: boolean
  updateUser: (
    patch: Partial<Pick<UserData, "name" | "phone" | "avatar">>,
  ) => void
  loginAs: (email: string, role?: AppRole) => void
  loginApi: (username: string, password: string) => Promise<UserData>
  logout: () => Promise<void>
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData>(DEFAULT_USER)
  const [role, setRole] = useState<AppRole | null>(() => {
    const stored = sessionStorage.getItem("ceh_demo_role")
    return stored as AppRole | null
  })
  const [loading, setLoading] = useState(isApiMode())

  useEffect(() => {
    if (!isApiMode()) return
    authService
      .me()
      .then(({ data }) => {
        setUser(fromContractUser(data))
        setRole(roleFromUser(data))
      })
      .catch(() => setRole(null))
      .finally(() => setLoading(false))
  }, [])

  function updateUser(
    patch: Partial<Pick<UserData, "name" | "phone" | "avatar">>,
  ) {
    setUser((prev) => {
      const name = patch.name ?? prev.name
      const phone = patch.phone ?? prev.phone
      const avatar = patch.avatar !== undefined ? patch.avatar : prev.avatar
      return {
        ...prev,
        ...patch,
        ho_ten: name,
        so_dien_thoai: phone,
        avatar_url: avatar,
        name,
        phone,
        avatar,
        displayName: buildDisplayName(name),
        initials: buildInitials(name),
      }
    })
  }

  function loginAs(email: string, selectedRole?: AppRole) {
    const resolvedRole = selectedRole || roleFromEmail(email)
    setRole(resolvedRole)
    sessionStorage.setItem("ceh_demo_role", resolvedRole)
    sessionStorage.setItem("ceh_demo_email", email)
    if (selectedRole === "admin" || email.includes("admin@")) {
      setUser({
        ...DEFAULT_USER,
        ma_tai_khoan: 99,
        ho_ten: "Quản trị viên Campus Event Hub",
        mssv: null,
        email: "admin@uit.edu.vn",
        loai_tai_khoan: "Admin",
        khoa: null,
        ma_khoa: null,
        ma_don_vi_to_chuc: 3,
        don_vi: ORGANIZATIONS[2],
        name: "Quản trị viên Campus Event Hub",
        displayName: "Quản trị viên",
        initials: "AD",
        studentId: "ADMIN",
        faculty: "Quản trị hệ thống",
        role: "Quản trị viên",
      })
      return
    }
    if (email === "checkin@demo.edu.vn" || email === "22520099@gm.uit.edu.vn") {
      setUser({
        ma_tai_khoan: 2,
        ho_ten: "Trần Minh Phúc",
        mssv: "22521999",
        email: "22521999@gm.uit.edu.vn",
        loai_tai_khoan: "SinhVien",
        so_dien_thoai: "0909 888 777",
        lop_sinh_hoat: "HTTT2022",
        ma_khoa: 1,
        khoa: "Khoa Công nghệ Thông tin",
        ma_don_vi_to_chuc: null,
        don_vi: null,
        avatar_url: null,
        dong_y_nghi_dinh_13: true,
        buoc_doi_mat_khau: false,
        la_nhan_vien_soat_ve: true,
        hoat_dong: true,
        thoi_gian_tao: "2026-09-01T08:00:00+07:00",

        name: "Trần Minh Phúc",
        displayName: "Minh Phúc",
        initials: "MP",
        avatar: null,
        studentId: "22521999",
        faculty: "Khoa Công nghệ Thông tin",
        phone: "0909 888 777",
        role: "Sinh viên · CTV điểm danh",
      })
      return
    }

    if (
      email === "webdev@uit.edu.vn" ||
      email === "organizer@demo.edu.vn" ||
      email === "bch.webdev@uit.edu.vn"
    ) {
      setUser({
        ma_tai_khoan: 10,
        ho_ten: "Ban Tổ Chức CLB WebDev UIT",
        mssv: null,
        email: "bch.webdev@uit.edu.vn",
        loai_tai_khoan: "ToChuc",
        so_dien_thoai: "028 3725 2002",
        lop_sinh_hoat: null,
        ma_khoa: 1,
        khoa: "Khoa Hệ thống Thông tin",
        ma_don_vi_to_chuc: 4,
        don_vi: ORGANIZATIONS[3],
        avatar_url: null,
        dong_y_nghi_dinh_13: true,
        buoc_doi_mat_khau: false,
        la_nhan_vien_soat_ve: false,
        hoat_dong: true,
        thoi_gian_tao: "2026-08-15T08:00:00+07:00",

        name: "Ban Tổ Chức CLB WebDev UIT",
        displayName: "BTC WebDev",
        initials: "BT",
        avatar: null,
        studentId: "BTC001",
        faculty: "Khoa Hệ thống Thông tin",
        phone: "028 3725 2002",
        role: "Ban tổ chức",
      })
      return
    }

    if (
      email === "httt@uit.edu.vn" ||
      email === "faculty@demo.edu.vn" ||
      email === "bql.httt@uit.edu.vn"
    ) {
      setUser({
        ma_tai_khoan: 20,
        ho_ten: "Ban Quản lý Khoa Hệ thống Thông tin",
        mssv: null,
        email: "bql.httt@uit.edu.vn",
        loai_tai_khoan: "ToChuc",
        so_dien_thoai: "028 3725 2002",
        lop_sinh_hoat: null,
        ma_khoa: 1,
        khoa: "Khoa Hệ thống Thông tin",
        ma_don_vi_to_chuc: 1,
        don_vi: ORGANIZATIONS[0],
        avatar_url: null,
        dong_y_nghi_dinh_13: true,
        buoc_doi_mat_khau: false,
        la_nhan_vien_soat_ve: false,
        hoat_dong: true,
        thoi_gian_tao: "2026-08-01T08:00:00+07:00",

        name: "Ban Quản lý Khoa HTTT",
        displayName: "Khoa HTTT",
        initials: "KQ",
        avatar: null,
        studentId: "BQL001",
        faculty: "Khoa Hệ thống Thông tin",
        phone: "028 3725 2002",
        role: "Ban quản lý khoa",
      })
      return
    }

    if (
      email === "pctsv@uit.edu.vn" ||
      email === "ctsv@demo.edu.vn" ||
      email === "ctsv@uit.edu.vn"
    ) {
      setUser({
        ma_tai_khoan: 30,
        ho_ten: "Phòng Công tác Sinh viên (CTSV)",
        mssv: null,
        email: "ctsv@uit.edu.vn",
        loai_tai_khoan: "Admin",
        so_dien_thoai: "028 3725 2002",
        lop_sinh_hoat: null,
        ma_khoa: null,
        khoa: null,
        ma_don_vi_to_chuc: 3,
        don_vi: ORGANIZATIONS[2],
        avatar_url: null,
        dong_y_nghi_dinh_13: true,
        buoc_doi_mat_khau: false,
        la_nhan_vien_soat_ve: false,
        hoat_dong: true,
        thoi_gian_tao: "2026-08-01T08:00:00+07:00",

        name: "Phòng Công tác Sinh viên",
        displayName: "Phòng CTSV",
        initials: "CT",
        avatar: null,
        studentId: "ADM001",
        faculty: "Phòng CTSV",
        phone: "028 3725 2002",
        role: "Phòng Công tác Sinh viên",
      })
      return
    }

    // Default to student
    setUser(DEFAULT_USER)
  }

  // Session restoration must rebuild the matching profile, not just the role.
  useEffect(() => {
    if (isApiMode()) return
    const storedRole = sessionStorage.getItem("ceh_demo_role") as AppRole | null
    const storedEmail = sessionStorage.getItem("ceh_demo_email")
    if (storedRole && storedEmail) loginAs(storedEmail, storedRole)
  }, [])

  async function loginApi(username: string, password: string) {
    const res = await authService.login(username, password)
    if (!res || !res.data) {
      throw new Error("Phản hồi đăng nhập không hợp lệ từ máy chủ.")
    }
    const nextUser = fromContractUser(res.data)
    setUser(nextUser)
    setRole(roleFromUser(res.data))
    return nextUser
  }

  async function logout() {
    try {
      if (isApiMode()) {
        await authService.logout()
      }
    } catch (e) {
      console.warn("Logout error:", e)
    } finally {
      tokenStore.clear()
      sessionStorage.removeItem("ceh_demo_role")
      sessionStorage.removeItem("ceh_demo_email")
      sessionStorage.setItem("ceh_just_logged_out", "true")
      setRole(null)
      setUser(DEFAULT_USER)
    }
  }

  return (
    <UserContext.Provider
      value={{
        user,
        role,
        authenticated: role !== null,
        loading,
        updateUser,
        loginAs,
        loginApi,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

function roleFromEmail(email: string): AppRole {
  if (
    email.includes("admin@") ||
    email.includes("pctsv@") ||
    email.includes("ctsv")
  )
    return "admin"
  if (
    email.includes("httt@") ||
    email.includes("faculty") ||
    email.includes("bql.") ||
    email.includes("officer")
  )
    return "faculty_manager"
  if (
    email.includes("webdev@") ||
    email.includes("organizer") ||
    email.includes("bch.")
  )
    return "organizer"
  return "student"
}

function roleFromUser(user?: ContractUser | null): AppRole {
  if (!user) return "student"
  if (user.loai_tai_khoan === "Admin") return "admin"
  if (user.loai_tai_khoan === "SinhVien") return "student"
  if (
    user.don_vi?.loai_don_vi === "Khoa" &&
    user.don_vi.ma_don_vi_cha == null
  ) {
    return "faculty_manager"
  }
  return "organizer"
}

function fromContractUser(user?: ContractUser | null): UserData {
  if (!user) return DEFAULT_USER
  return {
    ...user,
    name: user.ho_ten || DEFAULT_USER.name,
    displayName: buildDisplayName(user.ho_ten || DEFAULT_USER.name),
    initials: buildInitials(user.ho_ten || DEFAULT_USER.name),
    avatar: user.avatar_url || null,
    studentId: user.mssv || String(user.ma_tai_khoan),
    faculty: user.khoa || user.don_vi?.ten_don_vi || "Campus Event Hub",
    phone: user.so_dien_thoai || "",
    role:
      user.loai_tai_khoan === "SinhVien"
        ? "Sinh viên"
        : user.loai_tai_khoan === "Admin"
          ? "Quản trị viên"
          : "Ban tổ chức",
  }
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error("useUser must be used inside UserProvider")
  return ctx
}
