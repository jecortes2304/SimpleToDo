import {lazy, Suspense} from 'react'
import {Route, Routes} from 'react-router-dom'
import Footer from './components/shared/app-footer.tsx'
import DrawerNavigation from "./components/shared/navigation-drawer.tsx";
import {AlertManager} from "./components/alerts/alert-manager.tsx";
import {PrivateRoute} from "./utils/private-route.tsx";
import {PublicRoute} from "./utils/public-route.tsx";
import {AdminRoute} from "./utils/admin-route.tsx";
import {useBootstrapAuth} from './hooks/use-bootstrap-auth.ts';

const AuthPage = lazy(() => import('./pages/auth-page.tsx'))
const DashboardPage = lazy(() => import('./pages/dashboard-page.tsx'))
const ForgotPasswordPage = lazy(() => import('./pages/forgot-password-page.tsx'))
const NotFoundPage = lazy(() => import('./pages/not-found-page.tsx'))
const ProfilePage = lazy(() => import('./pages/profile-page.tsx'))
const ProjectsPage = lazy(() => import('./pages/projects-page.tsx'))
const PromptsPage = lazy(() => import('./pages/prompts-page.tsx'))
const ResetPasswordPage = lazy(() => import('./pages/reset-password-page.tsx'))
const TasksPage = lazy(() => import('./pages/tasks-page.tsx'))
const UsersPage = lazy(() => import('./pages/users-page.tsx'))
const VerificationEmailPendingPage = lazy(() => import('./pages/verification-email-pending-page.tsx'))
const VerifyEmailPage = lazy(() => import('./pages/verify-email-page.tsx'))

const PageFallback = () => (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading page">
        <span className="loading loading-spinner loading-lg text-primary"/>
    </div>
)

function App() {

    useBootstrapAuth();

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1">
				<Suspense fallback={<PageFallback/>}>
				<Routes>
                    <Route element={<PublicRoute/>}>
                        <Route path="/auth" element={
                            <div>
                                <AlertManager/>
                                <AuthPage/>
                            </div>
                        }/>
                        <Route path="/verification-email" element={
                            <div>
                                <AlertManager/>
                                <VerifyEmailPage/>
                            </div>
                        }/>
                        <Route path="/pending-email-verification" element={
                            <div>
                                <AlertManager/>
                                <VerificationEmailPendingPage/>
                            </div>
                        }/>
                        <Route path="/forgot-password" element={
                            <div>
                                <AlertManager/>
                                <ForgotPasswordPage/>
                            </div>
                        }/>
                        <Route path="/reseting-password" element={
                            <div>
                                <AlertManager/>
                                <ResetPasswordPage/>
                            </div>
                        }/>
                    </Route>
                    <Route element={<PrivateRoute/>}>
                        <Route element={<DrawerNavigation/>}>
                            <Route path="/" element={<DashboardPage/>}/>
                            <Route path="/tasks" element={<TasksPage/>}/>
                            <Route path="/projects" element={<ProjectsPage/>}/>
                            <Route path="/profile" element={<ProfilePage/>}/>
                            <Route element={<AdminRoute/>}>
                                <Route path="/users" element={<UsersPage/>}/>
                                <Route path="/prompts" element={<PromptsPage/>}/>
                            </Route>
                        </Route>
                    </Route>
                    <Route path="*" element={<NotFoundPage />} />
				</Routes>
				</Suspense>
            </main>
            <Footer/>
        </div>
    )
}

export default App;
