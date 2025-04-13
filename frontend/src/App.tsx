import {Route, Routes} from 'react-router-dom'
import Footer from './components/Footer'
import ProjectsPage from "./pages/ProjectsPage.tsx";
import TasksPage from "./pages/TasksPage.tsx";
import DrawerNavigation from "./components/DrawerNavigation.tsx";
import {AlertManager} from "./components/AlertManager.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import {PrivateRoute} from "./utils/PrivateRoute.tsx";
import {PublicRoute} from "./utils/PublicRoute.tsx";
import UsersPage from "./pages/UsersPage.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";

function App() {

    return (
        <div className="min-h-screen h-screen flex flex-col">
            <main className="flex-grow min-h-[calc(100vh-4rem)]">
                <Routes>
                    <Route element={<PublicRoute/>}>
                        <Route path="/auth" element={
                            <div>
                                <AlertManager/>
                                <AuthPage/>
                            </div>
                        }/>
                    </Route>
                    <Route element={<PrivateRoute/>}>
                        <Route element={<DrawerNavigation/>}>
                            <Route path="/" element={<DashboardPage/>}/>
                            <Route path="/tasks" element={<TasksPage/>}/>
                            <Route path="/projects" element={<ProjectsPage/>}/>
                            <Route path="/profile" element={<ProfilePage/>}/>
                            <Route path="/users" element={<UsersPage/>}/>
                        </Route>
                    </Route>
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </main>
            <Footer/>
        </div>
    )
}

export default App;
