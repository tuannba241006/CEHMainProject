import {
  Navigate,
  Outlet,
  createBrowserRouter,
  useLocation,
  useNavigate,
  useParams,
} from "react-router"
import { lazy, Suspense, useEffect, type ReactNode } from "react"
import StudentLayout from "../components/StudentLayout"
import { useUser, type AppRole } from "../context/UserContext"
import { isApiMode } from "../api/config"
import type { Ticket } from "../data/mock"
import SystemState from "../screens/SystemState"

// Safe lazy import with auto-retry and cache-busting recovery
function lazyImport<P>(
  factory: () => Promise<{ default: React.ComponentType<P> }>,
): React.LazyExoticComponent<React.ComponentType<P>> {
  return lazy(async () => {
    try {
      return await factory()
    } catch (error) {
      console.warn("Module load error, attempting automatic reload...", error)
      const key = "ceh_chunk_reloaded"
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1")
        window.location.reload()
      }
      throw error
    }
  })
}

// FE-PKG-03: Route Code Splitting with React.lazy
const Login = lazyImport(() => import("../screens/Login"))
const EventList = lazyImport(() => import("../screens/student/EventList"))
const EventDetail = lazyImport(() => import("../screens/student/EventDetail"))
const TicketConfirm = lazyImport(() => import("../screens/student/TicketConfirm"))
const MyTickets = lazyImport(() => import("../screens/student/MyTickets"))
const Profile = lazyImport(() => import("../screens/student/Profile"))
const CheckInScanner = lazyImport(() => import("../screens/student/CheckInScanner"))
const Achievements = lazyImport(() => import("../screens/student/Achievements"))
const PublicCertificateVerify = lazyImport(() => import("../screens/PublicCertificateVerify"))
const Dashboard = lazyImport(() => import("../screens/organizer/Dashboard"))
const EventsManage = lazyImport(() => import("../screens/organizer/EventsManage"))
const EventForm = lazyImport(() => import("../screens/organizer/EventForm"))
const Participants = lazyImport(() => import("../screens/organizer/Participants"))
const Staff = lazyImport(() => import("../screens/organizer/Staff"))
const ApprovalWorkspace = lazyImport(() => import("../screens/management/ApprovalWorkspace"))
const AffairsOperations = lazyImport(() => import("../screens/management/AffairsOperations"))
const QRScanner = lazyImport(() => import("../screens/staff/QRScanner"))
const AdminPortal = lazyImport(() => import("../screens/admin/AdminPortal"))
const RoomManagement = lazyImport(() => import("../screens/admin/RoomManagement"))
const KioskPortal = lazyImport(() => import("../screens/organizer/KioskPortal"))
const OrganizerSettings = lazyImport(() => import("../screens/organizer/OrganizerSettings"))
const CohostInvitations = lazyImport(() => import("../screens/organizer/CohostInvitations"))
const AuthFlow = lazyImport(() => import("../screens/AuthFlow"))

export function RouteErrorBoundary() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl text-amber-600">
          ⚠️
        </div>
        <h2 className="font-display text-lg font-bold text-slate-900">
          Phiên bản giao diện đã được cập nhật
        </h2>
        <p className="mt-2 text-xs text-slate-500 leading-relaxed">
          Trình duyệt đang lưu bản tạm cũ của phiên làm việc trước. Vui lòng bấm làm mới để đồng bộ giao diện mới nhất.
        </p>
        <button
          onClick={() => {
            sessionStorage.removeItem("ceh_chunk_reloaded")
            window.location.reload()
          }}
          className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 cursor-pointer transition-colors"
        >
          Làm mới trang ngay
        </button>
      </div>
    </div>
  )
}

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
        <p className="text-sm font-medium text-slate-500">Đang tải giao diện...</p>
      </div>
    </div>
  )
}

function SuspenseWrap({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>
}

const legacyPaths: Record<string, string> = {
  home: "/events",
  explore: "/events",
  tickets: "/student/tickets",
  waitlist: "/student/waitlist",
  checkin: "/student/attendance",
  achievements: "/student/achievements",
  profile: "/student/profile",
  "staff-scanner": "/staff/scanner",
  "org-dashboard": "/organizer/dashboard",
  "org-events": "/organizer/events",
  "org-event-form": "/organizer/events/create",
  "org-participants": "/organizer/participants",
  "org-staff": "/organizer/staff",
  "org-cohost": "/organizer/cohost-invitations",
  "org-rooms": "/organizer/rooms",
  "org-scanner": "/staff/scanner",
  "org-settings": "/organizer/settings",
  "faculty-inbox": "/faculty/approvals",
  "affairs-inbox": "/affairs/approvals",
  "affairs-results": "/affairs/drl",
  "affairs-certificates": "/affairs/certificates",
  "admin-dashboard": "/admin/dashboard",
  "admin-rooms": "/admin/rooms",
  "admin-orgs": "/admin/organizations",
  "admin-users": "/admin/users",
  "admin-noshow": "/admin/no-show",
}

function useLegacyNavigation() {
  const navigate = useNavigate()
  return (target: string) => navigate(legacyPaths[target] || target)
}

function ProtectedRoute({
  roles,
  requireStaff = false,
}: {
  roles: AppRole[]
  requireStaff?: boolean
}) {
  const { authenticated, role, user, loading } = useUser()
  const location = useLocation()
  if (loading) return <SystemState kind="loading" />
  if (!authenticated) {
    const justLoggedOut =
      typeof window !== "undefined" &&
      sessionStorage.getItem("ceh_just_logged_out") === "true"
    if (justLoggedOut) {
      return <Navigate to="/login" replace />
    }
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  if (
    !role ||
    !roles.includes(role) ||
    (requireStaff && role === "student" && !user.la_nhan_vien_soat_ve)
  ) {
    return <Navigate to="/access-denied" replace />
  }
  if (user.buoc_doi_mat_khau && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />
  }
  return (
    <SuspenseWrap>
      <Outlet />
    </SuspenseWrap>
  )
}

function GuestEvents() {
  const navigate = useNavigate()
  const { authenticated, logout } = useUser()
  return (
    <StudentLayout
      current="home"
      isGuest={!authenticated}
      onNavigate={(target) => navigate(legacyPaths[target] || target)}
      onLogout={() => void logout().finally(() => navigate("/login"))}
      onVerify={() => navigate("/certificates/verify")}
      onOpenLogin={() => navigate("/login")}
      onOpenRegister={() => navigate("/register")}
      onSelectEvent={(id) => navigate(`/events/${id}`)}
    >
      <SuspenseWrap>
        <EventList
          onSelectEvent={(id) => navigate(`/events/${id}`)}
          onNavigate={(target) => navigate(legacyPaths[target] || target)}
          isGuest={!authenticated}
          onOpenLogin={() => navigate("/login")}
          onOpenRegister={() => navigate("/register")}
        />
      </SuspenseWrap>
    </StudentLayout>
  )
}

function PublicEventDetailRoute() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const { authenticated, logout } = useUser()
  return (
    <StudentLayout
      current="event-detail"
      isGuest={!authenticated}
      onNavigate={(target) => navigate(legacyPaths[target] || target)}
      onLogout={() => void logout().finally(() => navigate("/login"))}
      onVerify={() => navigate("/certificates/verify")}
      onOpenLogin={() => navigate("/login")}
      onOpenRegister={() => navigate("/register")}
      onSelectEvent={(eventId) => navigate(`/events/${eventId}`)}
    >
      <SuspenseWrap>
        <EventDetail
          eventId={id}
          isGuest={!authenticated}
          onBack={() => navigate("/events")}
          onRegister={(ticket) =>
            navigate("/student/ticket-confirm", { state: { ticket } })
          }
          onViewTicket={() => navigate("/student/tickets")}
          onRequireLogin={() =>
            navigate("/login", { state: { from: `/events/${id}` } })
          }
        />
      </SuspenseWrap>
    </StudentLayout>
  )
}

function isPathAllowedForRole(
  path: string,
  role: AppRole,
  isStaffUser: boolean,
): boolean {
  if (
    !path ||
    path === "/login" ||
    path === "/register" ||
    path === "/access-denied" ||
    path === "/session-expired"
  ) {
    return false
  }

  // Public/shared routes accessible to anyone
  if (
    path === "/" ||
    path.startsWith("/events") ||
    path.startsWith("/certificates/verify")
  ) {
    return true
  }

  // Staff check-in scanner
  if (path.startsWith("/staff/scanner")) {
    return (
      isStaffUser ||
      role === "organizer" ||
      role === "admin" ||
      role === "student_affairs"
    )
  }

  // Kiosk mode routes
  if (path.startsWith("/admin/kiosk")) {
    return role === "admin" || role === "student_affairs"
  }
  if (path.startsWith("/organizer/kiosk")) {
    return role === "organizer" || role === "faculty_manager"
  }
  if (path.startsWith("/kiosk")) {
    return role !== "student"
  }

  // Student specific routes
  if (role === "student") {
    return path.startsWith("/student")
  }

  // Organizer specific routes (Strictly scoped - Admin is NOT permitted here)
  if (role === "organizer") {
    return path.startsWith("/organizer")
  }

  // Faculty manager routes
  if (role === "faculty_manager") {
    return path.startsWith("/faculty") || path.startsWith("/organizer")
  }

  // Student Affairs (P.CTSV) routes
  if (role === "student_affairs") {
    return path.startsWith("/affairs") || path.startsWith("/admin")
  }

  // Admin routes (Strictly scoped to admin & affairs - NEVER organizer layout)
  if (role === "admin") {
    return path.startsWith("/admin") || path.startsWith("/affairs")
  }

  return false
}

function LoginRoute({ register = false }: { register?: boolean }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginAs } = useUser()

  useEffect(() => {
    try {
      sessionStorage.removeItem("ceh_just_logged_out")
    } catch {
      // ignore in environments without storage
    }
  }, [])

  return (
    <SuspenseWrap>
      <Login
        initialRegister={register}
        onBack={() => navigate("/events")}
        onVerify={() => navigate("/certificates/verify")}
        onLogin={(role, email) => {
          if (!isApiMode()) loginAs(email, role)
          const isStaffUser = email === "22521999@gm.uit.edu.vn"
          const fallback = isStaffUser
            ? "/staff/scanner"
            : role === "student"
              ? "/events"
              : role === "organizer"
                ? "/organizer/dashboard"
                : role === "faculty_manager"
                  ? "/faculty/approvals"
                  : role === "student_affairs"
                    ? "/affairs/approvals"
                    : "/admin/dashboard"

          const rawFrom = (location.state as { from?: string } | null)?.from
          const targetPath =
            rawFrom && isPathAllowedForRole(rawFrom, role, isStaffUser)
              ? rawFrom
              : fallback

          navigate(targetPath, { replace: true })
        }}
      />
    </SuspenseWrap>
  )
}

function StudentShell({
  children,
  current,
}: {
  children: ReactNode
  current: string
}) {
  const navigate = useNavigate()
  const { logout } = useUser()
  return (
    <StudentLayout
      current={current}
      onNavigate={(target) => navigate(legacyPaths[target] || target)}
      onLogout={() => void logout().finally(() => navigate("/login"))}
      onVerify={() => navigate("/certificates/verify")}
      onSelectEvent={(id) => navigate(`/events/${id}`)}
    >
      <SuspenseWrap>{children}</SuspenseWrap>
    </StudentLayout>
  )
}

function StudentTicketsRoute({ waitlist = false }: { waitlist?: boolean }) {
  const navigate = useNavigate()
  return (
    <StudentShell current={waitlist ? "waitlist" : "tickets"}>
      <MyTickets
        initialTab={waitlist ? "waitlist" : "upcoming"}
        onNavigate={(target) => navigate(legacyPaths[target] || target)}
        onSelectEvent={(id) => navigate(`/events/${id}`)}
      />
    </StudentShell>
  )
}

function TicketConfirmRoute() {
  const navigate = useNavigate()
  const ticket = (useLocation().state as { ticket?: Ticket } | null)?.ticket
  if (!ticket) return <Navigate to="/student/tickets" replace />
  return (
    <StudentShell current="ticket-confirm">
      <TicketConfirm
        ticket={ticket}
        onViewTickets={() => navigate("/student/tickets")}
        onGoHome={() => navigate("/events")}
      />
    </StudentShell>
  )
}

function StudentProfileRoute() {
  const navigate = useNavigate()
  const { logout } = useUser()
  return (
    <StudentShell current="profile">
      <Profile
        onNavigate={(target) => navigate(legacyPaths[target] || target)}
        onLogout={() => void logout().finally(() => navigate("/login"))}
      />
    </StudentShell>
  )
}

function StudentAttendanceRoute() {
  const navigate = useNavigate()
  return (
    <StudentShell current="checkin">
      <CheckInScanner
        onNavigate={(target) => navigate(legacyPaths[target] || target)}
      />
    </StudentShell>
  )
}

function StudentAchievementsRoute() {
  const navigate = useNavigate()
  return (
    <StudentShell current="achievements">
      <Achievements
        onBack={() => navigate("/student/profile")}
        onVerify={() => navigate("/certificates/verify")}
      />
    </StudentShell>
  )
}

function OrganizerRoute({ page }: { page: string }) {
  const navigate = useNavigate()
  const { logout } = useUser()
  const onNavigate = useLegacyNavigation()
  const onLogout = () => void logout().finally(() => navigate("/login"))
  if (page === "events")
    return <EventsManage onNavigate={onNavigate} onLogout={onLogout} />
  if (page === "form")
    return <EventForm onNavigate={onNavigate} onLogout={onLogout} />
  if (page === "participants")
    return <Participants onNavigate={onNavigate} onLogout={onLogout} />
  if (page === "staff")
    return <Staff onNavigate={onNavigate} onLogout={onLogout} />
  return <Dashboard onNavigate={onNavigate} onLogout={onLogout} />
}

function CohostRoute() {
  const navigate = useNavigate()
  const { logout } = useUser()
  const onNavigate = useLegacyNavigation()
  const onLogout = () => void logout().finally(() => navigate("/login"))
  return <CohostInvitations onNavigate={onNavigate} onLogout={onLogout} />
}

function OrganizerSettingsRoute() {
  const navigate = useNavigate()
  const { logout } = useUser()
  const onNavigate = useLegacyNavigation()
  const onLogout = () => void logout().finally(() => navigate("/login"))
  return <OrganizerSettings onNavigate={onNavigate} onLogout={onLogout} />
}

function OrganizerRoomsRoute() {
  const navigate = useNavigate()
  const { logout } = useUser()
  const onNavigate = useLegacyNavigation()
  const onLogout = () => void logout().finally(() => navigate("/login"))
  return <RoomManagement readOnly onNavigate={onNavigate} onLogout={onLogout} />
}

function FacultyRoute() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { logout } = useUser()
  return (
    <ApprovalWorkspace
      role="faculty_manager"
      selectedId={id || null}
      onSelect={(caseId) => navigate(`/faculty/approvals/${caseId}`)}
      onNavigate={(target) => navigate(legacyPaths[target] || target)}
      onLogout={() => void logout().finally(() => navigate("/login"))}
    />
  )
}

function AffairsRoute({
  mode,
}: {
  mode: "approvals" | "results" | "certificates"
}) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { logout } = useUser()
  const onLogout = () => void logout().finally(() => navigate("/login"))
  const onNavigate = useLegacyNavigation()
  if (mode === "results")
    return (
      <AffairsOperations
        mode="results"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
    )
  if (mode === "certificates")
    return (
      <AffairsOperations
        mode="certificates"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
    )
  return (
    <ApprovalWorkspace
      role="student_affairs"
      selectedId={id || null}
      onSelect={(caseId) => navigate(`/affairs/approvals/${caseId}`)}
      onNavigate={onNavigate}
      onLogout={onLogout}
    />
  )
}

function StaffScannerRoute() {
  const navigate = useNavigate()
  const { logout, role, user } = useUser()

  const isFaculty =
    role === "faculty_manager" ||
    user.don_vi?.loai_don_vi === "Khoa" ||
    (typeof user.email === "string" &&
      (user.email.includes("httt@") || user.email.includes("bql.")))

  const isAdmin =
    role === "admin" ||
    role === "student_affairs" ||
    user.loai_tai_khoan === "Admin"

  const isOrg =
    role === "organizer" ||
    user.loai_tai_khoan === "ToChuc"

  return (
    <QRScanner
      onBack={() => {
        if (isFaculty) {
          navigate("/faculty/approvals")
        } else if (isAdmin) {
          navigate("/admin/dashboard")
        } else if (isOrg) {
          navigate("/organizer/events")
        } else {
          navigate("/student/tickets")
        }
      }}
      onNavigateToEvents={
        isFaculty ? () => navigate("/organizer/events") : undefined
      }
      onLogout={() => void logout().finally(() => navigate("/login"))}
    />
  )
}

function VerifyRoute() {
  const navigate = useNavigate()
  const { hash } = useParams()
  return (
    <PublicCertificateVerify
      initialCode={hash}
      onBack={() => navigate("/events")}
    />
  )
}

export const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: "", element: <Navigate to="/events" replace /> },
      { path: "events", Component: GuestEvents },
      { path: "events/:id", Component: PublicEventDetailRoute },
      { path: "login", element: <LoginRoute /> },
      { path: "register", element: <LoginRoute register /> },
      { path: "verify-otp", element: <SuspenseWrap><AuthFlow mode="otp" /></SuspenseWrap> },
      { path: "forgot-password", element: <SuspenseWrap><AuthFlow mode="forgot" /></SuspenseWrap> },
      { path: "reset-password", element: <SuspenseWrap><AuthFlow mode="reset" /></SuspenseWrap> },
      { path: "change-password", element: <SuspenseWrap><AuthFlow mode="change" /></SuspenseWrap> },
      {
        path: "certificates/verify",
        element: <SuspenseWrap><VerifyRoute /></SuspenseWrap>,
      },
      {
        path: "certificates/verify/:hash",
        element: <SuspenseWrap><VerifyRoute /></SuspenseWrap>,
      },
      {
        element: <ProtectedRoute roles={["student"]} />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { path: "student/tickets", element: <StudentTicketsRoute /> },
          { path: "student/waitlist", element: <StudentTicketsRoute waitlist /> },
          { path: "student/ticket-confirm", Component: TicketConfirmRoute },
          { path: "student/attendance", Component: StudentAttendanceRoute },
          { path: "student/achievements", Component: StudentAchievementsRoute },
          { path: "student/profile", Component: StudentProfileRoute },
          {
            path: "student/notifications",
            element: (
              <SystemState
                kind="info"
                title="Thông báo cá nhân"
                message="Mở chuông thông báo trên thanh điều hướng để xem và đánh dấu đã đọc."
              />
            ),
          },
        ],
      },
      {
        element: (
          <ProtectedRoute
            roles={["organizer", "faculty_manager"]}
          />
        ),
        errorElement: <RouteErrorBoundary />,
        children: [
          {
            path: "organizer/dashboard",
            element: <OrganizerRoute page="dashboard" />,
          },
          { path: "organizer/events", element: <OrganizerRoute page="events" /> },
          {
            path: "organizer/events/create",
            element: <OrganizerRoute page="form" />,
          },
          {
            path: "organizer/events/:id/edit",
            element: <OrganizerRoute page="form" />,
          },
          {
            path: "organizer/participants",
            element: <OrganizerRoute page="participants" />,
          },
          { path: "organizer/staff", element: <OrganizerRoute page="staff" /> },
          {
            path: "organizer/settings",
            element: <SuspenseWrap><OrganizerSettingsRoute /></SuspenseWrap>,
          },
          {
            path: "organizer/reports",
            element: <OrganizerRoute page="dashboard" />,
          },
          {
            path: "organizer/kiosk/:eventId",
            element: <SuspenseWrap><KioskPortal /></SuspenseWrap>,
          },
          {
            path: "organizer/cohost-invitations",
            element: <SuspenseWrap><CohostRoute /></SuspenseWrap>,
          },
          {
            path: "organizer/rooms",
            element: <SuspenseWrap><OrganizerRoomsRoute /></SuspenseWrap>,
          },
        ],
      },
      {
        element: (
          <ProtectedRoute roles={["faculty_manager", "admin", "student_affairs"]} />
        ),
        errorElement: <RouteErrorBoundary />,
        children: [
          {
            path: "faculty/approvals",
            element: <SuspenseWrap><FacultyRoute /></SuspenseWrap>,
          },
          {
            path: "faculty/approvals/:id",
            element: <SuspenseWrap><FacultyRoute /></SuspenseWrap>,
          },
        ],
      },
      {
        element: <ProtectedRoute roles={["student_affairs", "admin"]} />,
        errorElement: <RouteErrorBoundary />,
        children: [
          {
            path: "affairs/approvals",
            element: <AffairsRoute mode="approvals" />,
          },
          {
            path: "affairs/approvals/:id",
            element: <AffairsRoute mode="approvals" />,
          },
          { path: "affairs/drl", element: <AffairsRoute mode="results" /> },
          {
            path: "affairs/certificates",
            element: <AffairsRoute mode="certificates" />,
          },
        ],
      },
      {
        element: <ProtectedRoute roles={["admin", "student_affairs"]} />,
        errorElement: <RouteErrorBoundary />,
        children: [
          {
            path: "admin/dashboard",
            element: <AdminPortal section="dashboard" />,
          },
          {
            path: "admin/events",
            element: <AdminPortal section="events" />,
          },
          {
            path: "admin/events/create",
            element: <AdminPortal section="events-create" />,
          },
          {
            path: "admin/events/:id/edit",
            element: <AdminPortal section="events-edit" />,
          },
          {
            path: "admin/kiosk/:eventId",
            element: <SuspenseWrap><KioskPortal /></SuspenseWrap>,
          },
          { path: "admin/users", element: <AdminPortal section="users" /> },
          {
            path: "admin/organizations",
            element: <AdminPortal section="organizations" />,
          },
          { path: "admin/topics", element: <AdminPortal section="topics" /> },
          {
            path: "admin/rooms",
            element: <SuspenseWrap><RoomManagement /></SuspenseWrap>,
          },
          { path: "admin/reports", element: <AdminPortal section="reports" /> },
          { path: "admin/no-show", element: <AdminPortal section="no-show" /> },
          {
            path: "admin/participants",
            element: <AdminPortal section="participants" />,
          },
          {
            path: "admin/staff",
            element: <AdminPortal section="staff" />,
          },
          {
            path: "admin/cohost-invitations",
            element: <AdminPortal section="cohost-invitations" />,
          },
          {
            path: "admin/certificates",
            element: <AdminPortal section="certificates" />,
          },
        ],
      },
      {
        element: (
          <ProtectedRoute
            roles={[
              "organizer",
              "faculty_manager",
              "admin",
              "student_affairs",
            ]}
          />
        ),
        errorElement: <RouteErrorBoundary />,
        children: [
          {
            path: "kiosk/:eventId",
            element: <SuspenseWrap><KioskPortal /></SuspenseWrap>,
          },
        ],
      },
      {
        element: (
          <ProtectedRoute
            roles={[
              "student",
              "organizer",
              "faculty_manager",
              "admin",
              "student_affairs",
            ]}
            requireStaff
          />
        ),
        errorElement: <RouteErrorBoundary />,
        children: [
          {
            path: "staff/scanner",
            element: <SuspenseWrap><StaffScannerRoute /></SuspenseWrap>,
          },
        ],
      },
      { path: "access-denied", element: <SystemState kind="forbidden" /> },
      { path: "session-expired", element: <SystemState kind="session" /> },
      { path: "*", element: <SystemState kind="not-found" /> },
    ],
  },
])
