import {
  Navigate,
  Outlet,
  createBrowserRouter,
  useLocation,
  useNavigate,
  useParams,
} from "react-router"
import { lazy, Suspense, type ReactNode } from "react"
import StudentLayout from "../components/StudentLayout"
import { useUser, type AppRole } from "../context/UserContext"
import { isApiMode } from "../api/config"
import type { Ticket } from "../data/mock"
import SystemState from "../screens/SystemState"

// FE-PKG-03: Route Code Splitting with React.lazy
const Login = lazy(() => import("../screens/Login"))
const EventList = lazy(() => import("../screens/student/EventList"))
const EventDetail = lazy(() => import("../screens/student/EventDetail"))
const TicketConfirm = lazy(() => import("../screens/student/TicketConfirm"))
const MyTickets = lazy(() => import("../screens/student/MyTickets"))
const Profile = lazy(() => import("../screens/student/Profile"))
const CheckInScanner = lazy(() => import("../screens/student/CheckInScanner"))
const Achievements = lazy(() => import("../screens/student/Achievements"))
const PublicCertificateVerify = lazy(() => import("../screens/PublicCertificateVerify"))
const Dashboard = lazy(() => import("../screens/organizer/Dashboard"))
const EventsManage = lazy(() => import("../screens/organizer/EventsManage"))
const EventForm = lazy(() => import("../screens/organizer/EventForm"))
const Participants = lazy(() => import("../screens/organizer/Participants"))
const Staff = lazy(() => import("../screens/organizer/Staff"))
const ApprovalWorkspace = lazy(() => import("../screens/management/ApprovalWorkspace"))
const AffairsOperations = lazy(() => import("../screens/management/AffairsOperations"))
const QRScanner = lazy(() => import("../screens/staff/QRScanner"))
const AdminPortal = lazy(() => import("../screens/admin/AdminPortal"))
const RoomManagement = lazy(() => import("../screens/admin/RoomManagement"))
const KioskPortal = lazy(() => import("../screens/organizer/KioskPortal"))
const OrganizerSettings = lazy(() => import("../screens/organizer/OrganizerSettings"))
const CohostInvitations = lazy(() => import("../screens/organizer/CohostInvitations"))
const AuthFlow = lazy(() => import("../screens/AuthFlow"))

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

function LoginRoute({ register = false }: { register?: boolean }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginAs } = useUser()
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
          const from = (location.state as { from?: string } | null)?.from
          navigate(from || fallback, { replace: true })
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
  const { logout, role } = useUser()
  return (
    <QRScanner
      onBack={() => {
        if (role === "organizer") navigate("/organizer/events")
        else if (role === "admin" || role === "student_affairs")
          navigate("/admin/dashboard")
        else navigate("/events")
      }}
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
  { path: "/", element: <Navigate to="/events" replace /> },
  { path: "/events", Component: GuestEvents },
  { path: "/events/:id", Component: PublicEventDetailRoute },
  { path: "/login", element: <LoginRoute /> },
  { path: "/register", element: <LoginRoute register /> },
  { path: "/verify-otp", element: <SuspenseWrap><AuthFlow mode="otp" /></SuspenseWrap> },
  { path: "/forgot-password", element: <SuspenseWrap><AuthFlow mode="forgot" /></SuspenseWrap> },
  { path: "/reset-password", element: <SuspenseWrap><AuthFlow mode="reset" /></SuspenseWrap> },
  { path: "/change-password", element: <SuspenseWrap><AuthFlow mode="change" /></SuspenseWrap> },
  {
    path: "/certificates/verify",
    element: <SuspenseWrap><VerifyRoute /></SuspenseWrap>,
  },
  {
    path: "/certificates/verify/:hash",
    element: <SuspenseWrap><VerifyRoute /></SuspenseWrap>,
  },
  {
    element: <ProtectedRoute roles={["student"]} />,
    children: [
      { path: "/student/tickets", element: <StudentTicketsRoute /> },
      { path: "/student/waitlist", element: <StudentTicketsRoute waitlist /> },
      { path: "/student/ticket-confirm", Component: TicketConfirmRoute },
      { path: "/student/attendance", Component: StudentAttendanceRoute },
      { path: "/student/achievements", Component: StudentAchievementsRoute },
      { path: "/student/profile", Component: StudentProfileRoute },
      {
        path: "/student/notifications",
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
        roles={["organizer", "faculty_manager", "admin", "student_affairs"]}
      />
    ),
    children: [
      {
        path: "/organizer/dashboard",
        element: <OrganizerRoute page="dashboard" />,
      },
      { path: "/organizer/events", element: <OrganizerRoute page="events" /> },
      {
        path: "/organizer/events/create",
        element: <OrganizerRoute page="form" />,
      },
      {
        path: "/organizer/events/:id/edit",
        element: <OrganizerRoute page="form" />,
      },
      {
        path: "/organizer/participants",
        element: <OrganizerRoute page="participants" />,
      },
      { path: "/organizer/staff", element: <OrganizerRoute page="staff" /> },
      {
        path: "/organizer/settings",
        element: <SuspenseWrap><OrganizerSettings /></SuspenseWrap>,
      },
      {
        path: "/organizer/reports",
        element: <OrganizerRoute page="dashboard" />,
      },
      {
        path: "/organizer/kiosk/:eventId",
        element: <SuspenseWrap><KioskPortal /></SuspenseWrap>,
      },
      {
        path: "/kiosk/:eventId",
        element: <SuspenseWrap><KioskPortal /></SuspenseWrap>,
      },
      {
        path: "/organizer/cohost-invitations",
        element: <SuspenseWrap><CohostRoute /></SuspenseWrap>,
      },
      {
        path: "/organizer/rooms",
        element: <SuspenseWrap><RoomManagement readOnly /></SuspenseWrap>,
      },
    ],
  },
  {
    element: (
      <ProtectedRoute roles={["faculty_manager", "admin", "student_affairs"]} />
    ),
    children: [
      {
        path: "/faculty/approvals",
        element: <SuspenseWrap><FacultyRoute /></SuspenseWrap>,
      },
      {
        path: "/faculty/approvals/:id",
        element: <SuspenseWrap><FacultyRoute /></SuspenseWrap>,
      },
    ],
  },
  {
    element: <ProtectedRoute roles={["student_affairs", "admin"]} />,
    children: [
      {
        path: "/affairs/approvals",
        element: <AffairsRoute mode="approvals" />,
      },
      {
        path: "/affairs/approvals/:id",
        element: <AffairsRoute mode="approvals" />,
      },
      { path: "/affairs/drl", element: <AffairsRoute mode="results" /> },
      {
        path: "/affairs/certificates",
        element: <AffairsRoute mode="certificates" />,
      },
    ],
  },
  {
    element: <ProtectedRoute roles={["admin", "student_affairs"]} />,
    children: [
      {
        path: "/admin/dashboard",
        element: <AdminPortal section="dashboard" />,
      },
      { path: "/admin/users", element: <AdminPortal section="users" /> },
      {
        path: "/admin/organizations",
        element: <AdminPortal section="organizations" />,
      },
      { path: "/admin/topics", element: <AdminPortal section="topics" /> },
      {
        path: "/admin/rooms",
        element: <SuspenseWrap><RoomManagement /></SuspenseWrap>,
      },
      { path: "/admin/reports", element: <AdminPortal section="reports" /> },
      { path: "/admin/no-show", element: <AdminPortal section="no-show" /> },
      {
        path: "/admin/certificates",
        element: <AdminPortal section="certificates" />,
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
    children: [
      {
        path: "/staff/scanner",
        element: <SuspenseWrap><StaffScannerRoute /></SuspenseWrap>,
      },
    ],
  },
  { path: "/access-denied", element: <SystemState kind="forbidden" /> },
  { path: "/session-expired", element: <SystemState kind="session" /> },
  { path: "*", element: <SystemState kind="not-found" /> },
])
